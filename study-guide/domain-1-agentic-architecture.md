# Domain 1: Agentic Architecture & Orchestration (27%)

This is the largest domain on the exam, and for good reason: nearly every other domain assumes you understand the agentic loop and the coordinator/subagent pattern. If you only have time to study one domain deeply, make it this one.

## 1.1 The Agentic Loop

**Concept.** An agent isn't a single API call — it's a loop:

```text
1. Send messages[] + tools[] to Claude
2. Inspect response.stop_reason
   - "tool_use"    -> Claude wants to call one or more tools
   - "end_turn"    -> Claude is done, final answer ready
3. If tool_use: execute the tool(s) locally, append the assistant turn
   AND a user turn containing the tool_result blocks to messages[],
   go to step 1
4. If end_turn: return the response to the user, loop ends
```

Two details make or break the loop:

- **The history is the agent's memory.** Each iteration sends the *whole* conversation again: the original request, every assistant turn (including its `tool_use` blocks), and every `tool_result`. Claude has no other record of what it already did. If you drop a tool result, the model literally never learns the outcome and will often call the same tool again.
- **Every `tool_use` gets a `tool_result`.** Claude can request several tools in one response. Each `tool_use` block has an `id`; you return one `tool_result` per block, matched by `tool_use_id`, all together in the next user message.

Other `stop_reason` values you should handle explicitly rather than ignore: `max_tokens` (output was cut off — raise the limit or continue), `stop_sequence`, `refusal`, and `pause_turn` (a long server-side tool turn was paused; send the conversation back, including that assistant turn, and Claude picks up where it left off). The exam focuses on `tool_use` vs. `end_turn`.

**Who decides what happens next?** Claude does. The model reads the context, including fresh tool results, and chooses the next tool or decides it's finished. That is **model-driven decision-making**. The alternative — a pre-configured decision tree ("if the user says *refund*, call `lookup_order` then `process_refund`") — throws away the reason for using a model. Keep deterministic code for the few things that *must* be guaranteed (see [1.4](#14-multi-step-workflows-enforcement-and-handoffs) and [1.5](#15-hooks-posttooluse-and-tool-interception)), and let the model drive everything else.

**Worked example — a complete loop:**

```python
import anthropic

client = anthropic.Anthropic()
SAFETY_CEILING = 40  # guards against runaway bugs; NOT the normal exit


def run_agent(user_request: str) -> str:
    messages = [{"role": "user", "content": user_request}]

    for _ in range(SAFETY_CEILING):
        resp = client.messages.create(
            model=MODEL, max_tokens=4096, system=SYSTEM_PROMPT,
            tools=TOOLS, messages=messages,
        )
        # Keep the assistant turn, tool_use blocks included
        messages.append({"role": "assistant", "content": resp.content})

        if resp.stop_reason == "end_turn":
            return "".join(b.text for b in resp.content if b.type == "text")

        if resp.stop_reason == "tool_use":
            results = []
            for block in resp.content:          # handle EVERY tool_use block
                if block.type != "tool_use":
                    continue
                try:
                    output = execute_tool(block.name, block.input)
                    results.append({"type": "tool_result",
                                    "tool_use_id": block.id, "content": output})
                except ToolError as e:
                    results.append({"type": "tool_result", "tool_use_id": block.id,
                                    "content": str(e), "is_error": True})
            messages.append({"role": "user", "content": results})  # one message, all results
            continue

        if resp.stop_reason == "pause_turn":
            continue  # resend the conversation so Claude can finish the paused turn

        raise UnexpectedStop(resp.stop_reason)  # max_tokens, refusal, ...: decide explicitly

    raise SafetyCeilingReached("Agent exceeded 40 iterations; inspect the transcript")
```

**What the history looks like after one tool round** (support agent, simplified):

```json
[
  {"role": "user", "content": "Where is order 8812? It was due Monday."},
  {"role": "assistant", "content": [
    {"type": "text", "text": "Let me look that up."},
    {"type": "tool_use", "id": "toolu_01", "name": "lookup_order", "input": {"order_id": "8812"}}
  ]},
  {"role": "user", "content": [
    {"type": "tool_result", "tool_use_id": "toolu_01",
     "content": "{\"status\": \"held_at_customs\", \"since\": \"2026-11-20\"}"}
  ]}
]
```

On the next call Claude sees `held_at_customs` and decides on its own whether to call `get_customs_case`, explain the delay, or offer options. Nobody hard-coded that branch.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Loop terminates by scanning assistant text for phrases like "I'm done" | Natural language isn't a reliable control-flow signal | Check `stop_reason == "end_turn"` |
| Loop ends whenever the response contains any text block | Claude often writes text *and* a `tool_use` in the same turn ("Let me check that…") | Text presence means nothing; only `stop_reason` decides |
| Loop capped at N iterations as the *primary* stop mechanism | Cuts off legitimate long tasks and masks real bugs | Use `stop_reason` as the primary signal; keep an iteration cap only as a safety ceiling |
| Tool results discarded after execution instead of fed back | The model can't reason over new information it never sees | Always append `tool_result` blocks to conversation history |
| Only the first `tool_use` block is executed | The other requested calls never get results; the request is malformed or the model repeats itself | Loop over all `tool_use` blocks and return all results in one user message |
| Hard-coded `if intent == "refund": call A then B` around the model | Recreates a brittle decision tree; breaks on any request that doesn't fit | Give Claude well-described tools and let it choose; enforce only true invariants in code |

**Practice.** An engineer implements loop termination by checking whether the assistant's response text contains the words "Done" or "Completed." QA finds the agent sometimes stops mid-task because it used the word "completed" while describing a *future* step. What's the fix?

- A) Add more stop-phrases to the checklist
- B) Check `stop_reason` for `"end_turn"` instead of parsing text
- C) Lower temperature to reduce phrasing variance
- D) Add a retry if the task looks incomplete

**Answer: B.** Parsing natural language for control flow is inherently unreliable, and `stop_reason` is the deterministic, API-level signal designed for exactly this; more stop-phrases (A) just add more ways to misfire, temperature (C) doesn't change the fact that wording isn't a control signal, and a retry heuristic (D) treats the symptom while keeping the broken termination check.

**Practice.** A research agent's loop executes tools correctly when Claude asks for one tool at a time. When Claude asks for `web_search` and `fetch_paper` in the same response, the next API call fails or Claude re-requests `fetch_paper`. The loop code uses `next(b for b in resp.content if b.type == "tool_use")`. What should change?

- A) Iterate over every `tool_use` block, execute each, and return one `tool_result` per block (matched by `tool_use_id`) in a single user message
- B) Tell Claude in the system prompt to request only one tool per turn
- C) Retry the API call when it fails
- D) Append only the most recent tool result, to keep the history short

**Answer: A.** Claude may request several tools in one turn, and each `tool_use` needs a matching `tool_result`, so the loop must handle all of them; forbidding parallel calls in the prompt (B) is a probabilistic workaround that also slows the agent, retrying (C) repeats the same malformed history, and dropping results (D) is exactly the anti-pattern that leaves the model blind to what happened.

**Practice.** A team's customer-support agent has `max_iterations = 5` as its only termination logic. Simple tickets finish in 2–3 iterations, but complex billing disputes are routinely cut off mid-investigation and return half-finished answers. What's the best change?

- A) Raise the cap to 25 so complex tickets fit
- B) Detect long tickets up front and route them to a separate agent with a higher cap
- C) Ask Claude to summarize its progress at iteration 4 so the answer is never empty
- D) Make `stop_reason == "end_turn"` the normal exit and keep a much higher cap only as a safety ceiling

**Answer: D.** The loop should end when the model signals it's finished, with an iteration cap reserved for catching runaway bugs; raising the cap (A) still makes an arbitrary number the primary stop and will cut off the next unusually long ticket, routing by predicted length (B) adds complexity without fixing the wrong stopping signal, and a forced summary (C) just packages an incomplete investigation more politely.

**Practice.** A developer proposes replacing the agent with a rules engine: "if the message mentions *invoice*, call `get_invoice`; then if the balance is above zero, call `create_payment_link`." Customers frequently ask things like "why was I charged twice after I changed plans?" What's the main weakness of the proposal?

- A) Rules engines are slower than API calls
- B) It can't be tested
- C) It replaces model-driven tool selection with a fixed decision tree that can't adapt to what each tool result reveals
- D) Claude cannot call billing tools

**Answer: C.** The value of an agent is that Claude reads each new tool result and picks the next step, which a pre-wired tree can't do for requests outside its rules; speed (A) isn't the issue, rules engines are actually easy to test (B), and Claude can call any tool you define (D).

## 1.2 Coordinator–Subagent (Hub-and-Spoke) Orchestration

**Concept.** In a multi-agent system, one **coordinator** agent sits at the hub and several **subagents** sit on the spokes. The coordinator:

- **Decomposes** the request into subtasks.
- **Decides which subagents to invoke** — based on what the query actually needs, not by running every agent every time.
- **Delegates** each subtask with the context that subagent needs.
- **Aggregates** results, checks them for gaps and conflicts, and produces (or requests) the final output.
- **Owns all communication.** Subagents don't talk to each other directly. Results come back to the coordinator, which decides what to pass on. This gives you one place to log, one place to handle errors, and one place to control what information flows where.

Subagents run with **isolated context**. They don't see the coordinator's conversation history, and they don't see each other's work unless the coordinator explicitly passes it on (details in [1.3](#13-subagent-invocation-context-passing-and-spawning)).

**The biggest risk is upstream.** If the coordinator splits a broad topic too narrowly, every subagent can do its job perfectly and the final report will still miss most of the topic. Narrow coverage with no subagent errors is a *decomposition* bug.

### Dynamic subagent selection

Not every query needs the full pipeline. A coordinator prompt should make the selection explicit:

```text
You coordinate a research team. Available subagents:
- web-search: finds recent public sources (news, blogs, vendor docs)
- doc-analysis: reads internal PDFs and reports we already hold
- data-analyst: runs calculations over tables and datasets
- synthesis: writes the final report from collected findings

Before delegating, decide what the question actually needs.
- A factual lookup with a single answer may need only web-search.
- Questions about our own documents don't need web-search.
- Only invoke data-analyst when numbers must be computed, not just quoted.
Always explain in one line which subagents you chose and why.
```

### Partitioning scope to avoid duplication

When several subagents work on one topic, give each a distinct slice — by subtopic, source type, or time range — so they don't return the same five articles:

```json
{
  "topic": "Impact of generative AI on creative industries",
  "assignments": [
    {"agent": "web-search", "scope": "visual arts, illustration, design", "sources": "news + industry reports"},
    {"agent": "web-search", "scope": "music and audio production", "sources": "news + industry reports"},
    {"agent": "web-search", "scope": "film, TV, games, and writing", "sources": "news + industry reports"},
    {"agent": "doc-analysis", "scope": "all subtopics", "sources": "academic papers and labor statistics only"}
  ],
  "out_of_scope_for_all": "general AI history; model architecture details"
}
```

### Iterative refinement loop

A single pass is rarely enough for broad research. The coordinator evaluates the synthesis against its quality criteria, finds gaps, and re-delegates targeted work:

```python
findings = run_parallel(initial_assignments)
report = synthesis_agent(findings)

for _ in range(MAX_REFINEMENT_ROUNDS):          # small ceiling, e.g. 3
    gaps = coordinator_review(report, criteria)  # e.g. "no data on music licensing"
    if not gaps:
        break
    findings += run_parallel([search_task(g.targeted_query) for g in gaps])
    report = synthesis_agent(findings)           # re-synthesize with the new material
```

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Coordinator decomposes a broad topic into narrow, overlapping sub-slices (e.g., "AI in creative industries" → only 3 visual-arts subtopics) | Looks like a *subagent* failure, but it's a *coordinator decomposition* failure | Widen/rebalance the decomposition; add iterative refinement — coordinator evaluates synthesis output for gaps and re-delegates |
| Every query runs search → analysis → synthesis, even "what's our refund window?" | Wastes time and money; more steps also mean more places to fail | Coordinator analyzes the query and invokes only the subagents it needs |
| Two search subagents given the same vague brief | Duplicate results, wasted budget, false sense of corroboration | Partition by subtopic, source type, or time range |
| Subagents pass results directly to each other | No single place to log, retry, or filter; errors propagate silently | Route everything through the coordinator |
| Synthesis runs once and the report ships | Gaps found later by a human | Coordinator reviews coverage against explicit criteria and loops |

**Practice.** A research pipeline's final report is coherent but only covers 25% of the requested topic's breadth. Each subagent completed its assigned task successfully with no errors. Where do you look first?

- A) The synthesis agent's writing quality
- B) The web search agent's query relevance
- C) The coordinator's task decomposition logs
- D) The document analysis agent's summarization accuracy

**Answer: C.** When every subagent succeeded at its *assigned* task but overall coverage is narrow, the defect is upstream in what the coordinator decided to assign; synthesis quality (A) can't add material that was never collected, and search relevance (B) or summarization accuracy (D) would show up as wrong or poor results within a slice, not as whole slices missing.

**Practice.** An internal knowledge assistant uses a coordinator with four subagents (web search, internal-doc analysis, data analysis, synthesis). Logs show that simple questions like "Which office does the legal team sit in?" take 40 seconds because all four subagents run every time. What's the best fix?

- A) Have the coordinator analyze each query and invoke only the subagents it needs
- B) Run all four subagents in parallel instead of sequentially
- C) Replace the coordinator with a single agent that has every tool
- D) Cache the synthesis agent's output for an hour

**Answer: A.** Dynamic selection based on query requirements is the coordinator's job, and most simple questions need one subagent at most; parallelizing (B) still pays for four agents on a one-line question, collapsing everything into one agent (C) gives up the isolation and specialization the design was built for, and caching (D) only helps exact repeats.

**Practice.** In a multi-agent research system, the analysis subagent sends its output straight to the synthesis subagent. When analysis occasionally returns a malformed result, the synthesis agent silently produces a report with missing sections and nobody notices. What architectural change addresses this?

- A) Add a retry inside the synthesis subagent
- B) Let the synthesis subagent call the analysis subagent directly when it needs more data
- C) Give the synthesis subagent a stricter system prompt about completeness
- D) Route all subagent outputs back through the coordinator, which validates them, handles errors, and decides what to pass to synthesis

**Answer: D.** Hub-and-spoke routing gives you one place for observability, consistent error handling, and control over what information flows on; a retry inside synthesis (A) can't fix bad upstream data it doesn't recognize as bad, more direct agent-to-agent calls (B) make the problem worse, and a stricter prompt (C) is probabilistic and still blind to the malformed input.

**Practice.** A coordinator sends three web-search subagents the same instruction: "Research remote-work productivity." The final report cites the same handful of studies three times and misses everything about hybrid schedules and manager effectiveness. What is the best fix?

- A) Add a deduplication step after synthesis
- B) Give each subagent a distinct scope (e.g., fully remote output studies, hybrid schedules, management and collaboration) and have the coordinator check coverage before finalizing
- C) Use a single search subagent with a larger context window
- D) Increase the number of search subagents to six

**Answer: B.** Partitioning scope across subagents prevents overlap, and a coverage check catches remaining gaps; deduplication (A) removes repeats but can't create the missing subtopics, one bigger agent (C) loses parallelism and still has no plan for coverage, and more identical subagents (D) multiplies the duplication.

## 1.3 Subagent Invocation, Context Passing, and Spawning

**Concept.** In the Claude Agent SDK, a coordinator spawns subagents with the **Task tool**. Two configuration pieces matter:

1. **`allowedTools` must include `"Task"`.** If it doesn't, the coordinator simply can't spawn subagents — it will try to do the work itself or report it can't.
2. **Each subagent type is an `AgentDefinition`**: a `description` (tells the coordinator *when* to use it), a `prompt` (the subagent's system prompt), and optionally `tools` (restricts what it can do) and `model`.

> **Naming note:** newer Claude Code releases (v2.1.63+) call this the **Agent** tool, and `Task` still works as an alias. The exam guide uses **Task**, so expect that name in questions.

**Context is not inherited.** A subagent starts with its own system prompt, its tool definitions, and the prompt string the coordinator wrote when calling Task. It does *not* get the coordinator's conversation, earlier tool results, or memory from previous subagent runs. Whatever it needs — the question, prior findings, file paths, constraints — must be written into that prompt.

> Newer Claude Code versions also offer an explicit *fork* subagent that copies the current conversation. That's an opt-in exception; a normal subagent starts fresh, which is what the exam tests.

**Worked example — defining a coordinator and its subagents (Python Agent SDK):**

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

options = ClaudeAgentOptions(
    system_prompt=COORDINATOR_PROMPT,
    allowed_tools=["Task", "Read"],          # without "Task", no subagents can be spawned
    agents={
        "web-search": AgentDefinition(
            description="Finds recent public sources. Use for news, vendor docs, market data.",
            prompt="You search the web and return findings as JSON with source URLs and dates.",
            tools=["WebSearch", "WebFetch"],
        ),
        "doc-analysis": AgentDefinition(
            description="Reads internal PDFs and reports. Use for anything in /reports.",
            prompt="You extract claims from documents. Cite document name and page for each claim.",
            tools=["Read", "Grep", "Glob"],   # read-only: cannot edit or run commands
        ),
        "synthesis": AgentDefinition(
            description="Writes the final report from findings supplied in the prompt.",
            prompt="You write reports only from the findings you are given. Never add uncited claims.",
            tools=[],                         # works only from what it's handed
        ),
    },
)
```

**Pass complete findings, structured.** The synthesis subagent can't see what the search and analysis agents found unless the coordinator includes it. Use a structured format that keeps content separate from metadata, so attribution survives the handoff:

```text
Write a 1-page brief answering: "Is the EU market ready for our product?"
Use ONLY the findings below. Cite every claim with its source_id.

<findings>
[
  {"source_id": "W1", "type": "web", "url": "https://example.com/eu-survey-2026",
   "published": "2026-09-14", "claim": "41% of mid-size EU retailers plan to adopt..."},
  {"source_id": "D1", "type": "document", "document": "Q3-market-review.pdf", "page": 12,
   "claim": "Our pilot in Germany converted at 3.2%..."}
]
</findings>

Quality bar: flag any claim supported by only one source; note conflicts instead of picking a side.
```

**Spawn in parallel by emitting several Task calls in one response.** If the coordinator emits one Task call per turn, the work runs sequentially and each subagent waits for the previous one. If it emits them together, they run concurrently:

```json
{"role": "assistant", "content": [
  {"type": "tool_use", "id": "toolu_a", "name": "Task",
   "input": {"subagent_type": "web-search", "description": "EU retail adoption",
             "prompt": "Find 2025-2026 surveys on AI tool adoption by EU mid-size retailers..."}},
  {"type": "tool_use", "id": "toolu_b", "name": "Task",
   "input": {"subagent_type": "doc-analysis", "description": "Pilot results",
             "prompt": "From /reports/Q3-market-review.pdf, extract conversion and churn figures..."}}
]}
```

**Write goals and quality criteria, not step-by-step scripts.** Subagents are useful because they can adapt to what they find.

| Procedural (brittle) | Goal-oriented (adaptable) |
|---|---|
| "Search for 'EU AI retail'. Open the first 3 results. Summarize each in 2 sentences." | "Find evidence on whether EU mid-size retailers are adopting AI tools. Prefer sources from the last 18 months. Return at least 5 independent sources, and say if evidence is thin." |

**Fork-based sessions** are the other way to share context: instead of a fresh subagent, you branch an existing session so two lines of work start from the same analysis. That's covered in [1.7](#17-session-management-resume-vs-fork-vs-fresh).

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Subagent assumed to "know" what the coordinator already discussed | Subagents have isolated context by default | Pass complete findings explicitly in the subagent's prompt |
| Coordinator passes "summarize the findings above" to synthesis | There are no findings "above" in the subagent's context | Paste the findings into the prompt |
| Findings passed as one blob of prose | Source URLs and page numbers get lost or mixed up | Structured records: content fields separate from metadata fields |
| Giving every subagent every tool | Increases misuse and misselection risk | Scope `tools` per `AgentDefinition` (see [Domain 2](domain-2-tool-design-mcp.md)) |
| One Task call per coordinator turn for independent work | Sequential latency for no reason | Emit multiple Task calls in a single response |
| Coordinator scripts each subagent's exact steps | Subagent can't adapt when step 2 returns nothing useful | State goals, constraints, and quality criteria |

**Practice.** Which statement about subagent context is correct?

- A) Subagents automatically receive the full coordinator conversation history
- B) Subagents share a common memory pool keyed by session ID
- C) Subagents require explicit context passed in their invocation prompt
- D) Subagents inherit context only if `context: inherit` is set in `AgentDefinition`

**Answer: C.** A standard subagent starts with only its own system prompt, tools, and the prompt the coordinator writes, so anything it needs must be in that prompt; it does not receive the coordinator's history (A), there is no shared memory pool between invocations (B), and `context: inherit` (D) is not an `AgentDefinition` field.

**Practice.** A developer defines three `AgentDefinition`s and passes them to the coordinator, but in testing the coordinator never delegates — it tries to do all the research itself and says it lacks the right tools. The coordinator's options include `allowed_tools=["Read", "Grep", "WebSearch"]`. What's the most likely cause?

- A) The subagents' `description` fields are too short
- B) The subagents need a `model` field to be usable
- C) The coordinator's system prompt doesn't mention subagents by name
- D) `allowedTools` doesn't include `"Task"`, so the coordinator has no way to spawn subagents

**Answer: D.** The Task tool is the mechanism for spawning subagents, and the coordinator can't use it unless it's allowed; short descriptions (A) or an unnamed prompt (C) would make delegation less accurate but not impossible, and `model` (B) is optional and defaults sensibly.

**Practice.** A coordinator needs results from a patent-search subagent and a competitor-news subagent; neither depends on the other. Each currently takes about 50 seconds, and total time is about 100 seconds. What reduces latency without changing the subagents?

- A) Have the coordinator emit both Task tool calls in a single response so they run in parallel
- B) Merge both subagents into one with both tool sets
- C) Ask each subagent to return shorter results
- D) Spawn the second subagent from inside the first

**Answer: A.** Multiple Task calls in one coordinator response run concurrently, so total time approaches the slower of the two; merging agents (B) removes the parallelism and isolation, shorter outputs (C) barely affect search time, and nesting (D) keeps the work sequential and bypasses the coordinator's control.

**Practice.** A synthesis subagent's reports contain accurate claims, but reviewers can't tell which claims came from which source — some citations point to the wrong document. The coordinator passes findings as a single paragraph of combined prose. What's the best fix?

- A) Instruct the synthesis subagent to "be careful with citations"
- B) Pass findings as structured records that keep each claim separate from its metadata (source URL or document name, page, date)
- C) Have the synthesis subagent re-run all searches itself
- D) Drop citations from the report

**Answer: B.** Separating content from metadata in a structured format preserves attribution across the handoff; a softer instruction (A) can't recover provenance that was already lost in the prose, re-running searches (C) duplicates work and wastes the earlier agents' output, and dropping citations (D) gives up on the requirement.

**Practice.** A coordinator prompt tells the search subagent: "Step 1: search 'battery recycling EU'. Step 2: open the top 3 results. Step 3: summarize each." When the top results are paywalled, the subagent returns three summaries of paywall notices. What's the better prompt design?

- A) Add a Step 4: "If a result is paywalled, skip it"
- B) Give the subagent a longer list of exact search queries to run in order
- C) State the research goal and quality criteria (e.g., "at least 4 accessible sources from the last 2 years on EU battery recycling policy; note gaps") and let the subagent choose its steps
- D) Move the search into the coordinator

**Answer: C.** Goal-and-criteria prompts let the subagent adapt when a step doesn't work, which is the whole point of delegating to an agent; adding another rule (A) patches one failure but leaves the script brittle for the next, more exact queries (B) are even more procedural, and pulling search into the coordinator (D) bloats its context and gives up delegation.

## 1.4 Multi-Step Workflows: Enforcement and Handoffs

**Concept.** Many business workflows have steps that *must* happen in order: verify identity before touching money, check inventory before promising a ship date, get approval before deleting data. You have two ways to make Claude follow the order:

- **Prompt-based guidance** — "Always verify the customer's identity before processing a refund." Claude follows this most of the time. Most of the time is a non-zero failure rate.
- **Programmatic enforcement** — code that physically prevents the downstream tool from running until the prerequisite is met: a prerequisite gate in your tool dispatcher, or a hook (see [1.5](#15-hooks-posttooluse-and-tool-interception)).

When the rule is a compliance or money rule, you need the second. Prompts are still useful for explaining *why* and for the soft parts of the workflow (tone, what to ask next).

**Worked example — a prerequisite gate.** `process_refund` is blocked until `get_customer` has returned a verified ID for the *same* customer:

```python
from claude_agent_sdk import ClaudeAgentOptions, HookMatcher

verified_customers: dict[str, set[str]] = {}   # session_id -> verified customer IDs


async def record_verification(input_data, tool_use_id, context):
    # PostToolUse on get_customer: remember who has been verified in this session
    customer = parse_customer(input_data["tool_response"])
    if customer.get("identity_verified"):
        verified_customers.setdefault(input_data["session_id"], set()).add(customer["id"])
    return {}


async def require_verified_customer(input_data, tool_use_id, context):
    # PreToolUse on process_refund: block unless that customer was verified first
    cid = input_data["tool_input"].get("customer_id")
    if cid not in verified_customers.get(input_data["session_id"], set()):
        return {"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason":
                "Refund blocked: call get_customer and confirm identity for this customer first.",
        }}
    return {}


options = ClaudeAgentOptions(hooks={
    "PostToolUse": [HookMatcher(matcher="mcp__support__get_customer", hooks=[record_verification])],
    "PreToolUse":  [HookMatcher(matcher="mcp__support__process_refund", hooks=[require_verified_customer])],
})
```

The denial reason goes back to Claude, so the agent learns what to do next instead of just failing. (`parse_customer` stands in for however your MCP server formats its result.)

### Multi-concern requests

Customers often bundle problems: *"My March invoice charged me twice, the replacement router never arrived, and I want to cancel the extra line."* Handle this as three items, not one blurred task:

1. **Decompose** into distinct concerns, each with its own status.
2. **Investigate in parallel** — the billing, shipping, and account lookups don't depend on each other, so issue them together. All of them share the same verified customer context.
3. **Synthesize one resolution** that addresses every item, and note any item that needs a human.

### Structured handoff protocols

Sometimes the agent has to escalate mid-process. The human who picks it up typically has **no access to the conversation transcript**, so the handoff must stand on its own:

- **Customer details** — verified identity, account/order identifiers
- **Root cause analysis** — the actual problem, not just the symptom the customer described
- **Recommended action** — what the agent believes should happen next (a refund amount, a policy exception), even though a human makes the final call

```json
{
  "customer_id": "C-20931",
  "identity_verified": true,
  "concerns": [
    {"item": "Duplicate March charge", "status": "needs_human",
     "root_cause": "Plan change on Mar 3 created a second subscription instead of replacing the first",
     "evidence": ["invoice INV-7781", "invoice INV-7790"],
     "recommended_action": "Refund INV-7790 ($89.00) and close subscription SUB-551",
     "why_escalated": "Refund exceeds $50 agent limit"},
    {"item": "Replacement router not delivered", "status": "resolved",
     "resolution": "Carrier lost package; reshipped with tracking 1Z999..."},
    {"item": "Cancel extra line", "status": "resolved", "resolution": "Line 2 cancelled effective today"}
  ],
  "customer_sentiment": "frustrated; second contact this week"
}
```

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| "ALWAYS verify identity first" in capitals, repeated three times | Still prompt-based; still a non-zero failure rate | Programmatic gate that blocks `process_refund` until verification succeeds |
| Gate checks only that `get_customer` was *called* | It may have returned "not verified", or a different customer | Check the result and match the customer ID |
| Escalation note is just the customer's last message plus a ticket number | The human must re-investigate from zero, defeating the point of the AI agent's prior work | Compile a structured summary: customer ID, root cause, dollar amounts, recommended action |
| Escalation note includes a self-reported confidence score instead of a root cause | A number isn't actionable — the human still doesn't know *what's wrong* | Replace or augment with an actual root-cause statement |
| Multi-concern case escalated with only the first concern documented | The human re-litigates the second concern from scratch | Carry forward the full decomposed list of concerns into the handoff |
| Multi-concern request investigated one concern at a time, end to end | Slow, and later concerns get less attention | Decompose, investigate independent items in parallel, then synthesize |

**Practice.** A support agent occasionally processes refunds before verifying the customer's identity, despite the system prompt explicitly stating "always verify identity first." What is the most reliable fix?

- A) Rewrite the system prompt with stronger, more emphatic language
- B) Add a programmatic prerequisite that blocks `process_refund` until `get_customer` has returned a verified ID
- C) Add 10 few-shot examples showing correct ordering
- D) Reduce temperature to make behavior more consistent

**Answer: B.** Ordering guarantees for high-stakes operations need enforcement, not persuasion, and a programmatic gate makes the wrong order impossible; stronger wording (A), few-shot examples (C), and lower temperature (D) all reduce the failure rate but leave it above zero, which isn't acceptable for financial operations.

**Practice.** A case is escalated to a human agent with no access to the prior conversation. The escalation payload contains only the customer's final message ("this is ridiculous, just fix it") and a system-generated ticket number. What's missing, and why does it matter?

- A) A sentiment label, so the human knows the customer is upset
- B) A retry count, so the human knows how many times the agent attempted resolution
- C) A structured summary with customer details, root cause analysis, and a recommended action — without it, the human must re-investigate from scratch
- D) The full unedited transcript, so the human can read every turn

**Answer: C.** The human has no transcript access, so a bare final message and ticket number give no usable context; a sentiment label (A) and retry count (B) don't tell the human what's wrong or what to do, and dumping the full transcript (D) makes the human dig for the root cause the agent already found instead of handing it over.

**Practice.** A customer writes: "I was double-billed in October, my promo code didn't apply, and my address is still the old one." The agent handles the double-billing fully, then answers the other two in one hurried sentence, and the promo issue is never actually investigated. What design fixes this?

- A) Increase `max_tokens` so the agent can write longer answers
- B) Ask the customer to open a separate ticket for each problem
- C) Add "be thorough" to the system prompt
- D) Decompose the message into three distinct concerns, investigate them in parallel with the shared customer context, and synthesize one resolution covering each item

**Answer: D.** Explicit decomposition makes each concern a tracked item, parallel investigation stops later items from getting leftover attention, and one synthesis keeps the reply unified; more tokens (A) don't create a plan, pushing the work onto the customer (B) is poor service, and "be thorough" (C) is a vague instruction with no structure behind it.

## 1.5 Hooks: PostToolUse and Tool Interception

**Concept.** Agent SDK hooks are callbacks your code registers to run at fixed points in the agentic loop. They are deterministic: they run every time, regardless of what the model "decides." Two patterns matter for the exam:

- **Intercepting tool results (`PostToolUse`)** — runs after a tool returns, *before* Claude sees the result. Use it to transform data: normalize formats, strip fields, redact PII, add context.
- **Intercepting outgoing tool calls** — runs before a tool executes and can block it. In the Agent SDK this event is **`PreToolUse`**; it returns a decision such as `"deny"` with a reason that goes back to Claude. Use it to enforce policy (e.g., no refunds over $500) and redirect to an alternative (e.g., human escalation).

**Rule of thumb:** hooks give you guaranteed compliance. Prompt instructions give you probabilistic compliance — a non-zero failure rate. Anything with financial, legal, or safety consequences gets a hook, not just a stronger prompt.

### Worked example — normalizing heterogeneous MCP data (PostToolUse)

Three MCP servers report dates and statuses differently. Without normalization, Claude has to reconcile `1732406400`, `"2024-11-24T00:00:00+05:30"`, and `"status": 3` on every turn, and sometimes gets it wrong (e.g., comparing a Unix timestamp to an ISO date).

Before (raw tool results):

```json
{"crm":      {"last_contact": 1732406400, "status": 2}}
{"billing":  {"invoice_date": "2024-11-24T00:00:00+05:30", "state": "PAID"}}
{"shipping": {"shipped_at": "11/23/2024", "status_code": 3}}
```

The hook:

```python
from datetime import datetime, timezone

STATUS = {1: "pending", 2: "active", 3: "in_transit", 4: "delivered"}


def to_iso_utc(v):
    if isinstance(v, (int, float)):                 # Unix seconds
        return datetime.fromtimestamp(v, tz=timezone.utc).isoformat()
    if "/" in v:                                    # MM/DD/YYYY from the shipping API
        return datetime.strptime(v, "%m/%d/%Y").replace(tzinfo=timezone.utc).isoformat()
    return datetime.fromisoformat(v).astimezone(timezone.utc).isoformat()


async def normalize_result(input_data, tool_use_id, context):
    data = normalize_fields(input_data["tool_response"], date_fn=to_iso_utc, status_map=STATUS)
    return {"hookSpecificOutput": {
        "hookEventName": "PostToolUse",
        "updatedToolOutput": data,   # replaces what Claude sees
    }}
```

After (what Claude actually receives):

```json
{"crm":      {"last_contact": "2024-11-24T00:00:00+00:00", "status": "active"}}
{"billing":  {"invoice_date": "2024-11-23T18:30:00+00:00", "status": "paid"}}
{"shipping": {"shipped_at":   "2024-11-23T00:00:00+00:00", "status": "in_transit"}}
```

> API detail: current SDKs replace output with `updatedToolOutput`; older releases used `updatedMCPToolOutput`, which works for MCP tools only. You can also return `additionalContext` to append a note instead of replacing the result. The exam tests the pattern, not the field name.

### Worked example — blocking a policy violation and redirecting (PreToolUse)

```python
REFUND_LIMIT = 500


async def refund_limit(input_data, tool_use_id, context):
    amount = float(input_data["tool_input"].get("amount", 0))
    if amount > REFUND_LIMIT:
        return {"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"Refunds over ${REFUND_LIMIT} need human approval. Do not retry. "
                "Call escalate_to_human with customer_id, amount, and root cause."
            ),
        }}
    return {}   # no decision: normal flow continues


options = ClaudeAgentOptions(hooks={
    "PreToolUse":  [HookMatcher(matcher="mcp__billing__process_refund", hooks=[refund_limit])],
    "PostToolUse": [HookMatcher(matcher="^mcp__(crm|billing|shipping)__", hooks=[normalize_result])],
})
```

The refund of $650 never executes. Claude receives the reason, calls `escalate_to_human`, and tells the customer a specialist will approve it.

### Hooks vs. prompts

| Requirement | Prompt instruction | Hook |
|---|---|---|
| "Be concise with customers" | Right tool | Overkill |
| "Prefer the cheaper shipping option when equivalent" | Right tool | Overkill |
| "Never refund more than $500 without a human" | Non-zero failure rate | Right tool |
| "Dates must be compared in UTC" | Model may still mix formats | Normalize in `PostToolUse` |
| "Never write to production config files" | Non-zero failure rate | Right tool |

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| System prompt lists every date format and asks Claude to convert | Adds reasoning load to every turn; mistakes still happen | Normalize once in a `PostToolUse` hook |
| Refund limit enforced only by "never refund over $500" in the prompt | Probabilistic; one miss is a real financial loss | `PreToolUse` hook that denies the call |
| Trying to block a refund in `PostToolUse` | The refund already happened | Block before execution (`PreToolUse`) |
| Hook denies silently with no reason | Claude retries or tells the customer something wrong | Return a reason that names the alternative workflow |

**Practice.** An order-tracking agent uses three MCP servers. One returns Unix timestamps, one returns ISO 8601 strings with time zones, and one returns numeric status codes. The agent sometimes tells customers a package shipped "after" it was delivered. What's the most robust fix?

- A) A `PostToolUse` hook that converts all timestamps to one format and maps status codes to labels before Claude sees the results
- B) A system-prompt table explaining each server's formats
- C) Ask Claude to double-check date comparisons before answering
- D) Remove the server that uses Unix timestamps

**Answer: A.** Normalizing heterogeneous data deterministically before the model processes it removes the source of the errors; a format table (B) and a self-check (C) still rely on the model converting correctly every time, and dropping a server (D) loses data the agent needs.

**Practice.** Company policy says any refund over $500 must be approved by a human. The agent's system prompt states this clearly, and the agent follows it in 99% of test cases. Finance says 1% is unacceptable. What should the team implement?

- A) Fine-tune the prompt with more examples of over-limit refunds
- B) A second model call that reviews every refund decision before it's sent
- C) A tool-call interception hook that blocks `process_refund` when the amount exceeds $500 and directs the agent to escalate to a human
- D) Lower the limit in the prompt to $400 to leave a safety margin

**Answer: C.** When a business rule requires guaranteed compliance, a hook that intercepts the outgoing call is deterministic; more examples (A) and a lower prompt limit (D) are still prompt-based with a non-zero failure rate, and a reviewer model (B) is also probabilistic and adds cost and latency.

**Practice.** A developer adds the $500 refund check to a `PostToolUse` hook on `process_refund`. In testing, over-limit refunds still go through, though the agent correctly mentions escalation afterwards. Why?

- A) `PostToolUse` hooks only fire for MCP tools
- B) `PostToolUse` runs after the tool has executed, so the refund has already been issued; the check belongs in a `PreToolUse` hook
- C) The hook needs a higher priority setting
- D) The matcher must be `"*"` for hooks to fire on financial tools

**Answer: B.** Result interception happens after execution, so it can transform what Claude sees but can't prevent the action; blocking has to happen on the outgoing call. `PostToolUse` also fires for built-in tools (A), there's no priority setting that changes when it fires (C), and a specific matcher works fine (D).

## 1.6 Task Decomposition Strategy: Fixed vs. Adaptive

**Concept.** Complex work needs to be broken into steps. The question is whether you know those steps in advance.

| Pattern | When to use | Example |
|---|---|---|
| **Prompt chaining** (fixed sequential steps) | Predictable, multi-aspect but well-understood workflows | Code review: per-file pass, then a separate cross-file integration pass |
| **Dynamic/adaptive decomposition** | Open-ended investigation where next steps depend on findings | "Add comprehensive tests to a legacy codebase" — map structure first, then decide priorities as you learn the code |

Prompt chaining is cheap to build, easy to test, and gives consistent output, because every run follows the same steps. Adaptive decomposition costs more and is less predictable, but it's the only option when step 3 depends on what step 2 found.

### Worked example — prompt chaining for a large PR review

A single prompt reviewing 15 files at once suffers from **attention dilution**: some files get a careful read, others get skimmed, and the same pattern is flagged in one file and approved in another. Split the review:

```text
Step 1 (per file, run for each changed file, can run in parallel):
  "Review src/payments/refund.py for correctness, error handling, and security.
   Output JSON: [{line, severity, issue, suggestion}]. Also list every public
   function signature you changed or call from other modules."

Step 2 (cross-file integration pass, one call):
  "Here are the per-file findings and the interface lists for all 15 files.
   Check only cross-file concerns: mismatched signatures, inconsistent error
   handling between callers and callees, duplicated logic, migrations vs. models.
   Do not repeat per-file issues."

Step 3 (format):
  "Merge and de-duplicate into a PR comment grouped by severity."
```

Each step has a narrow job, and the integration pass sees compact summaries rather than 15 full files.

### Worked example — adaptive plan for an open-ended task

Task: *"Add comprehensive tests to this legacy billing service."* You can't list the steps up front, so the agent builds and revises a plan:

```text
1. Map structure: list modules, entry points, existing tests, external dependencies.
2. Identify high-impact areas: code that handles money, has many callers, or changed recently.
3. Draft a prioritized plan:
     P1 invoice_calculator.py  (money, 0% coverage)
     P2 proration.py           (money, complex branches)
     P3 webhooks.py            (external input)
4. Execute P1. Discovered: invoice_calculator calls tax_service over HTTP with no seam.
   -> Insert new task before P1 tests: add an injectable tax client so it can be faked.
5. Re-prioritize: proration.py depends on the same tax client, so it is now cheaper to test; move it up.
```

The plan changes as dependencies are discovered. That's the point.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| One giant prompt reviewing every file in a large PR | Attention dilution; inconsistent findings | Per-file passes + one cross-file integration pass |
| Fixed checklist for an open-ended investigation | Steps written before you know the codebase are often wrong | Map first, prioritize, re-plan as you learn |
| Fully dynamic agent for a routine, well-defined review | Unpredictable output and cost for no benefit | Prompt chaining |
| Adaptive plan that never gets revised | It's just a fixed plan written later | Re-prioritize when a discovery changes the cost or risk |

**Practice.** You're automating review of PRs that touch 10–20 files. A single-pass review over all files produces contradictory findings (the same pattern flagged in one file, approved in another). Best fix?

- A) Use a larger context-window model
- B) Split into per-file local-analysis passes plus a separate cross-file integration pass
- C) Require three independent full-PR passes and keep majority-vote findings
- D) Ask developers to manually split PRs into fewer than 4 files

**Answer: B.** This is attention dilution, and the fix is decomposing the review itself into focused per-file passes plus an integration pass; a bigger context window (A) lets you fit more but doesn't make attention more even, majority voting (C) triples cost while each pass still suffers the same dilution, and forcing smaller PRs (D) pushes an architecture problem onto developers.

**Practice.** A team asks an agent to "add comprehensive tests to our 8-year-old inventory service." Their first attempt gave the agent a fixed list: "write tests for each file in alphabetical order." It spent most of its budget on rarely used utility modules and never reached the stock-reservation logic. What approach fits better?

- A) Keep the fixed list but sort it by file size
- B) Split the files evenly across five parallel subagents
- C) Run the same fixed list again with a larger budget
- D) Have the agent first map the structure, identify high-impact areas, create a prioritized plan, and revise it as dependencies are discovered

**Answer: D.** Open-ended tasks need adaptive decomposition that starts by mapping and prioritizing, then adjusts as the agent learns; file size (A) isn't a measure of impact, parallel subagents (B) still have no idea what matters, and a bigger budget (C) just finishes the wrong order more slowly.

**Practice.** Every night, a pipeline reviews new vendor contracts for the same five things: payment terms, liability caps, termination clauses, data-protection terms, and renewal dates. Output must have a consistent format for the legal team's dashboard. Which decomposition pattern fits best?

- A) Prompt chaining: a fixed sequence of focused steps (one per aspect, or extraction then checks), followed by a formatting step
- B) Dynamic decomposition where the agent decides what to look for in each contract
- C) A single prompt asking for "a full legal review"
- D) A coordinator that spawns a new subagent whenever it finds something unusual

**Answer: A.** The steps are known in advance and the output must be consistent, which is exactly what prompt chaining is for; dynamic decomposition (B) and open-ended spawning (D) add unpredictability where none is wanted, and a single broad prompt (C) invites uneven coverage of the five aspects.

## 1.7 Session Management: Resume vs. Fork vs. Fresh

**Concept.** A session is the saved conversation: messages, tool calls, and tool results. You have three ways to continue work later:

| Tool | Use case |
|---|---|
| `--resume <session-name>` | Continue a specific prior conversation when prior context is still mostly valid |
| `fork_session` | Branch from a shared analysis baseline to explore divergent approaches in parallel (e.g., comparing two refactor strategies) |
| Start fresh + inject a structured summary | When prior tool results are **stale** (e.g., files changed since the last session) — more reliable than resuming with stale data |

**Key nuance:** a resumed session still "remembers" the old contents of every file it read. If you resume after code has changed, you must **explicitly tell the agent what changed**. It won't infer file staleness on its own.

### Worked example — named sessions and forks

In Claude Code:

```bash
# Day 1: start a named investigation
claude -n payments-timeout-investigation

# Day 2: continue exactly that conversation (by name or ID)
claude --resume payments-timeout-investigation

# Branch it to try a different approach without touching the original
claude --resume payments-timeout-investigation --fork-session
```

In the Agent SDK (Python), you resume by session ID and fork with `fork_session`:

```python
# Shared baseline: one session that analyzed the codebase
baseline_id = session_id_from_first_run

# Branch A: integration-test strategy
opts_a = ClaudeAgentOptions(resume=baseline_id, fork_session=True)
# Branch B: contract-test strategy, from the same baseline
opts_b = ClaudeAgentOptions(resume=baseline_id, fork_session=True)
# Each fork gets its own new session ID; the baseline stays unchanged.
```

Forking copies the *conversation*, not the filesystem. If both branches edit the same working directory, they'll see each other's changes — use separate worktrees or keep forks to analysis and planning.

### Worked example — resuming after code changes

Instead of "please re-read everything," tell the resumed session exactly what changed:

```text
Since we last talked, these files changed (commit 4f2a9c1):
- src/payments/client.py: retry logic rewritten; RetryPolicy now takes max_wait_s
- src/payments/config.py: TIMEOUT_MS raised from 3000 to 8000
- tests/test_client.py: new
Everything else you analyzed is unchanged. Re-read only these three files,
then update your timeout diagnosis.
```

### Worked example — starting fresh with a summary

When much of the old context is wrong (big refactor, files moved, days of other work), a new session with a clean summary beats resuming with stale tool results:

```text
Context from a previous investigation (verified 2026-11-26):
- Goal: find why checkout requests time out under load.
- Confirmed: timeouts occur only when the fraud-check service exceeds 2s.
- Ruled out: database pool exhaustion (pool metrics normal at peak).
- Open question: does the new retry policy cause retry storms?
- Files of interest: src/payments/client.py, src/fraud/adapter.py
Start by reading those two files; they have changed since the summary was written.
```

### Choosing

| Situation | Choose |
|---|---|
| Came back after lunch; nothing changed | Resume |
| A teammate changed 2 of the 30 files the agent read | Resume + tell it which files changed |
| Want to compare two refactoring approaches from the same analysis | Fork |
| Large refactor merged; most earlier tool results are wrong | Fresh session + structured summary |

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Resuming after major changes and trusting the agent's memory | It reasons from old file contents | Inform it of specific changes, or start fresh with a summary |
| Asking a resumed agent to "re-explore the whole repo" | Wastes time and context on unchanged files | Name the changed files for targeted re-analysis |
| Trying two strategies one after another in the same session | The second attempt is biased by the first | Fork from the shared baseline |
| Relying on unnamed sessions for multi-day investigations | Hard to find the right one later | Name sessions and resume by name |

**Practice.** A developer resumes a coding session two days later, after teammates modified several files the agent had already analyzed. The agent's suggestions reference outdated function signatures. What should have been done differently?

- A) Used `fork_session` instead of `--resume`
- B) Increased the context window size
- C) Informed the resumed session about the specific file changes for targeted re-analysis
- D) Started a completely new session with no context at all

**Answer: C.** A resumed session reasons from the file contents it read before, so it needs to be told which files changed and re-read them; forking (A) copies the same stale history, a larger context window (B) doesn't refresh anything, and starting with no context (D) throws away valid analysis that a summary or targeted update could keep.

**Practice.** After a long session analyzing a monolith, a tech lead wants to compare two migration approaches — strangler-fig extraction vs. a modular monolith — without one exploration influencing the other, and without repeating the analysis. What should they do?

- A) Fork the analysis session twice (`fork_session` / `--fork-session`) and explore one approach in each branch
- B) Explore both approaches one after the other in the same session
- C) Start two fresh sessions and repeat the analysis in each
- D) Resume the session and ask the agent to "keep the two approaches separate"

**Answer: A.** Forking creates independent branches from a shared baseline, so both explorations start with the full analysis and neither sees the other; one session (B and D) lets the first approach bias the second no matter what the prompt says, and fresh sessions (C) waste the work already done.

**Practice.** A team returns to a named investigation session after a large refactor that renamed modules and moved half the files. When resumed, the agent keeps citing paths and functions that no longer exist. What's the most reliable way to continue?

- A) Keep resuming and correct the agent each time it cites an old path
- B) Fork the session so the new branch starts clean
- C) Resume and ask the agent to verify every path before using it
- D) Start a new session and inject a structured summary of the earlier findings, noting what is still valid and what needs re-checking

**Answer: D.** When most of the prior tool results are stale, a fresh session with a curated summary avoids reasoning from outdated observations; repeated corrections (A) and verification instructions (C) fight a history full of wrong data, and a fork (B) copies that same stale history.

<!-- support-footer -->
---

> Created by **Utkarsh Agarwal** — certified Claude Certified Architect (Foundations & Professional).
> Found this useful? [⭐ Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) · [💼 Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) · [☕ Buy me a coffee](https://utkarsh1agarwal.github.io/claude-architect-exam-guide/#support)
