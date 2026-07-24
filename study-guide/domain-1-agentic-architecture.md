# Domain 1: Agentic Architecture & Orchestration (27%)

This is the largest domain on the exam, and for good reason: nearly every other domain assumes you understand the agentic loop and the coordinator/subagent pattern. If you only have time to study one domain deeply, make it this one.

## 1.1 The Agentic Loop

**Concept.** An agent isn't a single API call — it's a loop:

```text
1. Send messages[] + tools[] to Claude
2. Inspect response.stop_reason
   - "tool_use"    -> Claude wants to call a tool
   - "end_turn"    -> Claude is done, final answer ready
   - "pause_turn"  -> long-running turn; resume with the same request
3. If tool_use: execute the tool(s) locally, append tool_result
   blocks to messages[], go to step 1
4. If end_turn: return the response to the user, loop ends
```

The critical design decision here is **who decides what happens next**. Claude reasons about which tool to call based on context — you are not supposed to hard-code a decision tree ("if the user says X, call tool Y") on top of it. That defeats the purpose of using a model at all.

**Worked example:**

```python
messages = [{"role": "user", "content": "Refund order #123"}]
while True:
    resp = client.messages.create(model=MODEL, tools=TOOLS, messages=messages)
    messages.append({"role": "assistant", "content": resp.content})

    if resp.stop_reason == "tool_use":
        tool_call = next(b for b in resp.content if b.type == "tool_use")
        result = execute_tool(tool_call.name, tool_call.input)
        messages.append({
            "role": "user",
            "content": [{"type": "tool_result", "tool_use_id": tool_call.id, "content": result}]
        })
        continue

    if resp.stop_reason == "end_turn":
        break
```

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Loop terminates by scanning assistant text for phrases like "I'm done" | Natural language isn't a reliable control-flow signal | Check `stop_reason == "end_turn"` |
| Loop capped at N iterations as the *primary* stop mechanism | Cuts off legitimate long tasks and masks real bugs | Use `stop_reason` as the primary signal; keep an iteration cap only as a safety ceiling |
| Tool results discarded after execution instead of fed back | The model can't reason over new information it never sees | Always append `tool_result` blocks to conversation history |


**Practice.** An engineer implements loop termination by checking whether the assistant's response text contains the words "Done" or "Completed." QA finds the agent sometimes stops mid-task because it used the word "completed" while describing a *future* step. What's the fix?

A) Add more stop-phrases to the checklist
B) Check `stop_reason` for `"end_turn"` instead of parsing text
C) Lower temperature to reduce phrasing variance
D) Add a retry if the task looks incomplete

**Answer: B.** Parsing natural language for control flow is inherently unreliable. `stop_reason` is the deterministic, API-level signal designed for exactly this.

## 1.2–1.3 Coordinator–Subagent (Hub-and-Spoke) Pattern

**Concept.** A coordinator agent decomposes work and delegates to subagents via the **Task tool**. Subagents:

- Do **not** automatically inherit the coordinator's conversation history — context must be explicitly passed in the invocation prompt.
- Should be **narrowly scoped** — their own tools, their own system prompt (`AgentDefinition`).
- Route all communication *through* the coordinator, for observability and consistent error handling.

The coordinator's `allowedTools` must include `"Task"` for it to spawn subagents at all.

**Worked example — parallel vs. sequential spawn:**

```text
# Slow (sequential): 3 round trips
Task(search_agent, "find X")     -> wait -> result
Task(analysis_agent, "analyze Y")-> wait -> result
Task(synthesis_agent, "combine") -> wait -> result

# Fast (parallel): coordinator emits multiple Task calls in ONE response
[Task(search_agent, "find X"), Task(analysis_agent, "analyze Y")] -> both run concurrently
```

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Coordinator decomposes a broad topic into narrow, overlapping sub-slices (e.g., "AI in creative industries" → only 3 visual-arts subtopics) | Looks like a *subagent* failure, but it's a *coordinator decomposition* failure | Widen/rebalance the decomposition; add iterative refinement — coordinator evaluates synthesis output for gaps and re-delegates |
| Subagent assumed to "know" what the coordinator already discussed | Subagents have isolated context by default | Pass complete findings explicitly in the subagent's prompt |
| Giving every subagent every tool | Increases misuse and misselection risk | Scope tools per subagent role (see [Domain 2](domain-2-tool-design-mcp.md)) |


**Practice.** A research pipeline's final report is coherent but only covers 25% of the requested topic's breadth. Each subagent completed its assigned task successfully with no errors. Where do you look first?

A) The synthesis agent's writing quality
B) The web search agent's query relevance
C) The coordinator's task decomposition logs
D) The document analysis agent's summarization accuracy

**Answer: C.** When every subagent succeeded at its *assigned* task but overall coverage is narrow, the defect is upstream — in what the coordinator decided to assign, not in how well any single agent executed.


**Practice.** Which statement about subagent context is correct?

A) Subagents automatically receive the full coordinator conversation history
B) Subagents share a common memory pool keyed by session ID
C) Subagents require explicit context passed in their invocation prompt
D) Subagents inherit context only if `context: inherit` is set in `AgentDefinition`

**Answer: C.**

## 1.4 Hooks: PostToolUse and Tool Interception

**Concept.** Hooks let you programmatically intercept the agentic loop for **deterministic** behavior that prompts can't guarantee:

- **`PostToolUse` hook** — normalize/transform tool results before the model sees them (e.g., unify Unix timestamps, ISO-8601 dates, and numeric status codes from different MCP tools into one format).
- **Pre-call / tool-interception hook** — block a tool call outright if it violates policy (e.g., `process_refund` for amount > $500 → redirect to human escalation), *before* the requested action executes.

**Rule of thumb:** hooks give you guaranteed compliance. Prompt instructions give you probabilistic compliance — a non-zero failure rate. Anything with financial, legal, or safety consequences gets a hook, not just a stronger prompt.

```python
def pre_tool_hook(tool_name, tool_input):
    if tool_name == "process_refund" and tool_input["amount"] > 500:
        return {
            "blocked": True,
            "redirect": "escalate_to_human",
            "reason": "Refund exceeds $500 auto-approval threshold",
        }
    return {"blocked": False}
```


**Practice.** A support agent occasionally processes refunds before verifying the customer's identity, despite the system prompt explicitly stating "always verify identity first." What is the most reliable fix?

A) Rewrite the system prompt with stronger, more emphatic language
B) Add a programmatic prerequisite hook that blocks `process_refund` until `get_customer` has returned a verified ID
C) Add 10 few-shot examples showing correct ordering
D) Reduce temperature to make behavior more consistent

**Answer: B.** Ordering guarantees for high-stakes operations need enforcement, not persuasion — this is the single most-repeated lesson across the entire exam.

## 1.5 Structured Handoff Protocols

Hooks get the *ordering* right — verify before you refund. But ordering is only half of multi-step workflow design. The other half is **what gets handed off** when a human has to pick up a case, since the human agent typically has **no access to the conversation transcript**.

A structured handoff must include, at minimum:

- **Customer details** — verified identity, account/order identifiers
- **Root cause analysis** — the actual problem, not just the symptom the customer described
- **Recommended action** — what the agent believes should happen next (a refund amount, a policy exception), even though a human makes the final call

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Escalation note is just the customer's last message plus a ticket number | The human must re-investigate from zero, defeating the point of the AI agent's prior work | Compile a structured summary: customer ID, root cause, dollar amounts, recommended action |
| Escalation note includes a self-reported confidence score instead of a root cause | A number isn't actionable — the human still doesn't know *what's wrong* | Replace or augment with an actual root-cause statement |
| Multi-concern case escalated with only the first concern documented | The human re-litigates the second concern from scratch | Carry forward the full decomposed list of concerns into the handoff |


**Practice.** A case is escalated to a human agent with no access to the prior conversation. The escalation payload contains only the customer's final message ("this is ridiculous, just fix it") and a system-generated ticket number. What's missing, and why does it matter?

A) A sentiment label, so the human knows the customer is upset
B) A structured summary with customer details, root cause analysis, and a recommended action — without it, the human must re-investigate from scratch
C) The full unedited transcript, so the human can read every turn
D) A retry count, so the human knows how many times the agent attempted resolution

**Answer: B.** The human has no transcript access, so a bare final message and ticket number provide no usable context. Option C reintroduces the token-bloat / lost-in-the-middle problem instead of solving the actual gap.

## 1.6 Task Decomposition Strategy: Fixed vs. Adaptive

| Pattern | When to use | Example |
|---|---|---|
| **Prompt chaining** (fixed sequential steps) | Predictable, multi-aspect but well-understood workflows | Code review: per-file pass, then a separate cross-file integration pass |
| **Dynamic/adaptive decomposition** | Open-ended investigation where next steps depend on findings | "Add comprehensive tests to a legacy codebase" — map structure first, then decide priorities as you learn the code |


**Practice.** You're automating review of PRs that touch 10–20 files. A single-pass review over all files produces contradictory findings (the same pattern flagged in one file, approved in another). Best fix?

A) Use a larger context-window model
B) Split into per-file local-analysis passes plus a separate cross-file integration pass
C) Require three independent full-PR passes and keep majority-vote findings
D) Ask developers to manually split PRs into fewer than 4 files

**Answer: B.** This is attention dilution — the fix is architectural decomposition of the review itself, not a bigger model or brute-force voting.

## 1.7 Session Management: Resume vs. Fork vs. Fresh

| Tool | Use case |
|---|---|
| `--resume <session-name>` | Continue a specific prior conversation when prior context is still mostly valid |
| `fork_session` | Branch from a shared analysis baseline to explore divergent approaches in parallel (e.g., comparing two refactor strategies) |
| Start fresh + inject a structured summary | When prior tool results are **stale** (e.g., files changed since the last session) — more reliable than resuming with stale data |

**Key nuance:** if you resume a session after code has changed, you must **explicitly tell the agent what changed**. It won't infer file staleness on its own.


**Practice.** A developer resumes a coding session two days later, after teammates modified several files the agent had already analyzed. The agent's suggestions reference outdated function signatures. What should have been done differently?

A) Used `fork_session` instead of `--resume`
B) Informed the resumed session about the specific file changes for targeted re-analysis
C) Started a completely new session with no context at all
D) Increased the context window size

**Answer: B.**

