# Domain 5: Context Management & Reliability (15%)

The smallest domain by weight, but the one that threads through every scenario you've already studied — error handling, escalation, and context loss show up inside Domain 1's coordinator patterns, Domain 2's tool errors, and Domain 3's long sessions alike. Treat this as a synthesis pass rather than an isolated topic.

## 5.1 Preserving Critical Info Across Long Interactions

**Concept.** The Messages API is stateless. Every request must carry the complete conversation history you want the model to see; if you drop earlier turns to save tokens, the model has no memory of them and the conversation loses coherence. That forces a trade-off in long sessions: history keeps growing, so at some point you summarize or trim. Done carelessly, that is exactly where critical facts disappear.

Three risks to know by name:

- **Progressive summarization** — each summarization pass compresses again. Specifics get rounded into vague prose: "$340 refund on order #9981, promised by Friday" becomes "customer wants a refund." Numbers, percentages, dates, and customer-stated expectations are the first casualties.
- **"Lost in the middle"** — models reliably use information at the *beginning* and *end* of long inputs, but may overlook findings buried in the middle.
- **Tool result accumulation** — every tool result stays in history and keeps costing tokens on every later turn. An order lookup that returns 40+ fields when only 5 matter for a return crowds out the context that actually matters.

**Fixes:**

- Extract transactional facts (amounts, dates, order numbers, statuses) into a persistent **"case facts" block** that is included in every prompt, *outside* the summarized narrative history. Summaries can compress the conversation; they never touch the case facts.
- For sessions with several issues, keep a **separate structured layer per issue** (order ID, amount, status) so facts from issue 1 don't blur into issue 2.
- **Trim tool outputs** to the relevant fields before they are appended to history.
- In aggregated inputs, put a **key findings summary at the start** and organize details under explicit section headers.
- In multi-agent pipelines, have upstream agents return **structured data with metadata** (dates, source locations, method) instead of long prose and reasoning chains, especially when the downstream agent has a limited context budget.

**Worked example — case facts kept outside summarized history.** A support agent is 25 turns into a session covering two problems. The application rebuilds each request like this:

```text
[system prompt: policies, tools, escalation rules]

=== CASE FACTS (authoritative; never summarized) ===
customer_id: C-20417 (verified via email + last 4 of card)
issue_1:
  order_id: 9981
  item: wireless headphones
  amount: 340.00 USD
  delivered: 2026-11-02
  status: refund approved, pending processing
  customer_expectation: "refund before Friday Nov 28"
issue_2:
  order_id: 10112
  item: phone case (wrong colour)
  amount: 19.99 USD
  status: replacement requested, awaiting photo
=== END CASE FACTS ===

=== CONVERSATION SUMMARY (turns 1-20) ===
Customer reported two problems. Refund for issue_1 approved after
verification. Issue_2 opened; agent asked for a photo.
=== END SUMMARY ===

[turns 21-25 verbatim]
```

The summary is allowed to be lossy because nothing load-bearing lives only in it. When the agent writes "your $340 refund is approved," it reads the number from the case facts, not from a paraphrase of a paraphrase.

**Worked example — trimming tool output before it accumulates.** The raw `lookup_order` result:

```json
{"order_id": "9981", "customer_id": "C-20417", "warehouse": "DAL-3",
 "carrier": "UPS", "tracking": "1Z999...", "sku": "HP-220-BLK",
 "tax_breakdown": {...}, "promo_codes": [...], "gift_wrap": false,
 "billing_address": {...}, "shipping_address": {...},
 "delivered_at": "2026-11-02T14:11:00Z", "total": 340.00,
 "return_window_days": 30, "return_status": "none", "... 30 more fields": "..."}
```

What actually gets appended to the conversation for a return request:

```json
{"order_id": "9981", "total": 340.00, "delivered_at": "2026-11-02",
 "return_window_days": 30, "return_status": "none"}
```

Do the trimming in code (a wrapper around the tool, or a post-tool step), not by asking the model to "ignore irrelevant fields." The tokens are spent the moment the raw result enters history.

**Worked example — structured output from an upstream agent.** A research subagent feeds a synthesis agent that has a tight context budget. Instead of three pages of narrative and reasoning, it returns:

```json
{
  "question": "EV battery recycling rates in the EU",
  "key_facts": [
    {"fact": "Collection rate for portable batteries was 46% in 2022",
     "source": "Eurostat dataset env_waspb", "location": "table 1",
     "date": "2024-03", "method": "member-state reported data",
     "relevance": 0.9}
  ],
  "open_questions": ["No 2023 figure found for Poland"]
}
```

Dates, source locations, and methodological context travel with each fact, so the synthesis agent can order findings correctly and weigh them without rereading the sources.

### Long single documents

**Concept.** Everything above is about long *conversations*. A single very long document (a 200-page contract, a full year of financial filings) creates the same "lost in the middle" risk, but the fix looks different because there's no multi-turn history to summarize — the whole document has to be processed at once or split deliberately.

**Decision rule:**

- **If the document fits comfortably in context and the task needs cross-document reasoning** (e.g., "does clause 12 contradict clause 47?"), pass it whole — splitting it would sever exactly the cross-references the task depends on.
- **If the document is processed section-by-section anyway** (e.g., extracting a structured record per invoice from a batch of scanned invoices, or per-chapter summaries), **chunk deliberately along natural boundaries** (sections, chapters, invoices) rather than by a fixed token count, so a chunk boundary never lands mid-record.
- **Map-reduce for synthesis across chunks:** run extraction/analysis independently per chunk (the "map" step), then a separate pass that reconciles/synthesizes across chunk-level outputs (the "reduce" step) — mirrors the coordinator/subagent and per-file/cross-file patterns from [Domain 1](domain-1-agentic-architecture.md#16-task-decomposition-strategy-fixed-vs-adaptive) and [Domain 3](domain-3-claude-code-workflows.md#36-cicd-integration), applied to a document instead of a codebase or a PR.
- Put the **question or task instructions before *and* after** a very long pasted document — reinforcing the ask at the end counters the middle-of-context reliability drop for whatever comes right before it.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Relying on a rolling summary to carry amounts, dates and order IDs | Each pass compresses specifics into vague prose | Persistent case facts block outside the summarized history |
| Dropping older turns from the API request to save tokens, with nothing replacing them | The API is stateless; the model loses context and contradicts earlier turns | Send full history, or replace old turns with a summary plus case facts |
| Appending full 40-field tool results to history | Irrelevant tokens accumulate on every later turn | Trim to task-relevant fields in code before appending |
| Burying the key findings in the middle of a long aggregated input | Lost-in-the-middle effect | Key findings summary first, details under explicit headers |
| Upstream agent passes long prose and reasoning chains downstream | Wastes the downstream agent's limited budget, loses metadata | Return structured key facts, citations, dates and relevance scores |
| Splitting a long document into fixed-size token chunks | A chunk boundary can land mid-clause or mid-record, corrupting exactly the unit being extracted | Chunk along natural document boundaries (sections, invoices, chapters) |
| Running one single pass over an entire long document for both per-section extraction and cross-section synthesis | Same attention-dilution failure as a single-pass multi-file code review — depth is inconsistent across sections | Map (per-chunk extraction) then reduce (a separate cross-chunk synthesis pass) |
| Instructions placed only once, before a very long document | The instruction is exactly the kind of content "lost in the middle" affects once enough document text follows it | Repeat the task instructions after the document too, not just before |


**Practice.** A multi-turn support conversation about a $340 refund on order #9981 gets summarized after 15 turns. The summary says "customer requested a refund," losing the specific amount and order number, causing the agent to ask the customer to repeat themselves. Best fix?

- A) Never summarize; always keep full raw history
- B) Extract a persistent "case facts" block (amount, order ID, dates) carried in every prompt outside the narrative summary
- C) Ask the customer to always restate details each turn
- D) Increase the context window size

**Answer: B.** The facts that matter are transactional and small, so pin them in a block that summarization never touches. A works for short sessions but does not scale and still exposes key facts to lost-in-the-middle, C pushes the system's failure onto the customer, and D only delays the point at which summarization happens without making the summary any less lossy.

**Practice.** A returns agent calls `lookup_order` several times per session. Each result has about 45 fields, and by turn 12 the agent starts missing the return window date it saw earlier. Token usage per request has tripled. What is the most effective change?

- A) Tell the model in the system prompt to focus only on return-related fields
- B) Summarize the whole conversation after every tool call
- C) Wrap the tool so only the return-relevant fields (order ID, total, delivery date, return window, return status) are appended to history
- D) Switch to a model with a larger context window

**Answer: C.** The problem is irrelevant tokens accumulating in history, and trimming in code before they are appended removes them at the source. A still leaves all 45 fields in context on every turn, so tokens and distraction remain, B adds progressive summarization loss on top of the original problem, and D postpones the issue while making every request more expensive.

**Practice.** A pipeline extracts line-item data from a single 300-page PDF containing 150 concatenated invoices, chunking the PDF every 2,000 tokens regardless of where an invoice happens to end. Line items near chunk boundaries are frequently corrupted or duplicated. What's the fix?

- A) Increase the chunk size to 4,000 tokens
- B) Switch to a model with a larger context window and stop chunking entirely, regardless of cost
- C) Ask the pipeline to re-run only on the corrupted chunks with the same fixed-size chunking
- D) Chunk along invoice boundaries instead of a fixed token count, so no single invoice is split across two chunks

**Answer: D.** The corruption is a direct result of chunk boundaries being blind to document structure, and chunking along natural record boundaries removes it. A only moves the boundaries so some invoices are still split, B ignores cost and brings back lost-in-the-middle across 150 invoices in one pass, and C re-runs the same broken strategy.

**Practice.** In a research system, three search subagents each return about 4,000 words of narrative findings plus their reasoning to a synthesis agent. The synthesis agent's report regularly omits findings from the second subagent and misdates several statistics. Which change addresses the root cause?

- A) Have each subagent return structured findings — key facts, citations, dates, source locations and relevance scores — instead of narrative and reasoning chains
- B) Have the synthesis agent read the subagents' outputs twice
- C) Run the synthesis agent with a higher temperature to encourage broader coverage
- D) Concatenate all three outputs and put the instruction at the very top only

**Answer: A.** Verbose upstream output overwhelms the downstream budget and puts the second subagent's content in the middle, while missing metadata causes the dating errors, and structured output with dates and locations fixes both. B doubles the token load without fixing position effects or missing dates, C has nothing to do with coverage or accuracy, and D keeps the same lost-in-the-middle layout and makes the instruction easier to lose.

## 5.2 Escalation & Ambiguity Resolution

**Concept.** Escalation is a design decision, not a mood. Good triggers are tied to observable facts about the case, written into the system prompt as explicit criteria, and illustrated with few-shot examples that show both sides of the line.

**Correct triggers to escalate:**

- **Customer explicitly asks for a human** → escalate **immediately**. Don't investigate first, don't try to "save" the case.
- **Policy exception or policy gap** — the policy is **silent or ambiguous** on this specific request. Not "this case is complex"; complex cases inside policy are the agent's job.
- **No meaningful progress** — the agent has tried what it can and is going in circles.

**Frustration is not the same as a request for a human.** If the customer is annoyed but the issue is straightforward and within the agent's capability, acknowledge the frustration and offer the resolution. Escalate only if the customer then reiterates that they want a person.

**Unreliable escalation signals (don't use these alone):**

- **Sentiment/frustration detection** — angry customers often have simple problems; calm customers often have policy exceptions. Sentiment doesn't track case complexity.
- **Self-reported model confidence scores** — poorly calibrated; the model is often confidently wrong on exactly the hardest cases.

**Multiple-match handling:** if a lookup returns more than one possible customer or order, **ask for another identifier** (email, order number, postcode). Never pick heuristically ("most recent", "closest name match") — acting on the wrong account is far worse than one extra question.

**Worked example — escalation criteria with few-shot examples in the system prompt:**

```text
## When to escalate (call escalate_to_human)
Escalate when ANY of these is true:
1. The customer asks for a human, manager, or real person. Do this
   immediately. Do not look anything up first.
2. The request is not covered by policy, or the policy is ambiguous
   for this exact situation.
3. You have made two attempts to resolve and cannot make progress.

Do NOT escalate just because the customer is upset or the case has
several steps. If the issue is within policy, acknowledge their
frustration and offer the fix.

## Examples
Customer: "This is the third time I'm writing. The blender arrived
cracked, photo attached."
-> RESOLVE. Damaged item with photo is a standard replacement.
   Acknowledge the repeated contacts, issue the replacement.

Customer: "Store X sells this for $40 less. Match it or refund the
difference."
-> ESCALATE. Policy covers price drops on our own site only;
   competitor matching is not addressed.

Customer: "Just get me a person."
-> ESCALATE immediately, no investigation.

Customer: "Ugh, this is ridiculous. Fine, what are my options?"
(late delivery, within refund policy)
-> RESOLVE. Offer the shipping refund. If they then repeat that
   they want a person, escalate.
```

**Worked example — a structured escalation handoff.** The human agent who picks up the case should not have to reread the transcript. The `escalate_to_human` tool takes:

```json
{
  "customer_id": "C-20417",
  "reason": "policy_gap",
  "summary": "Customer requests price match against a competitor. Policy covers own-site price adjustments only.",
  "case_facts": {"order_id": "10230", "item": "stand mixer",
                 "paid": 389.00, "competitor_price": 349.00,
                 "competitor": "customer-supplied link"},
  "actions_taken": ["verified identity", "confirmed order and price paid"],
  "customer_expectation": "refund of the $40 difference",
  "recommended_next_step": "decide whether to grant a one-time goodwill adjustment"
}
```

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Escalate when sentiment score is negative | Frustration doesn't track complexity; floods humans with easy cases | Explicit criteria based on request type and policy coverage |
| Escalate when the model reports confidence below a threshold | Self-reported confidence is poorly calibrated | Criteria plus few-shot examples |
| Investigating the account before honoring "I want a human" | Ignores an explicit request and adds delay | Escalate immediately |
| Escalating every frustrated customer even when the fix is simple | Lowers first-contact resolution | Acknowledge, offer the fix, escalate if they repeat the request |
| Improvising a policy for an uncovered request | The agent invents commitments the business never made | Treat policy gaps as an escalation trigger |
| Picking the "most recent" of several matching accounts | Can expose or change the wrong customer's data | Ask for an additional identifier |
| Handoff that says only "customer needs help" | Human has to restart the investigation | Structured handoff with case facts, actions taken, and reason |


**Practice.** First-contact resolution is at 55% against an 80% target. Logs show the agent escalates *easy* cases (standard replacements with photo evidence) while trying to autonomously resolve *hard* ones (policy exceptions). Best fix?

- A) Self-reported confidence score routing
- B) Explicit escalation criteria plus few-shot examples distinguishing escalate-vs-resolve cases
- C) Sentiment-based escalation
- D) A separate ML classifier trained on historical tickets

**Answer: B.** The agent's decision boundary is wrong in both directions, and stating the criteria plainly with examples on each side of the line is the most direct way to move it. A relies on poorly calibrated self-reported confidence, which is often highest on exactly the hard cases, C ties escalation to mood rather than complexity, and D is a heavy build that should come only after the prompt-level fix has been tried.

**Practice.** A customer opens with: "I don't want to talk to a bot. Transfer me to a person." The agent's current behavior is to look up the account, check recent orders, and offer a fix before transferring. What should change?

- A) Keep the lookup so the human agent gets context, then transfer
- B) Offer one resolution attempt first, and transfer only if the customer declines
- C) Escalate immediately when a customer explicitly asks for a human, without investigating first
- D) Escalate only if a sentiment model also detects frustration

**Answer: C.** An explicit request for a human is a direct escalation trigger and should be honored right away. A and B both delay a request the customer already made, and the "offer a fix first" pattern applies to frustrated customers who have not asked for a person, while D adds an unreliable signal on top of a clear one.

**Practice.** A customer writes: "Your competitor has this TV for $60 less. Match it." The refund policy describes price adjustments when *your own site* lowers the price within 14 days, and says nothing about competitors. What should the agent do?

- A) Escalate, because the policy is silent on competitor price matching
- B) Apply the 14-day own-site adjustment rule, since it is the closest policy
- C) Decline, because anything not explicitly allowed is forbidden
- D) Ask the customer how frustrated they are before deciding

**Answer: A.** This is a policy gap, which is one of the core escalation triggers, and a human should decide whether to make an exception. B stretches a rule to a case it was not written for, C invents a policy position the business never stated, and D uses sentiment, which says nothing about whether the request is covered.

**Practice.** A `find_customer` call for "J. Patel" returns three accounts. The agent currently picks the account with the most recent order and proceeds to discuss its refund. What is the right instruction?

- A) Pick the account whose name matches most closely
- B) Pick the account with the most recent order, but mention the assumption to the customer
- C) Escalate every multiple-match case to a human
- D) Ask the customer for an additional identifier, such as email or order number, before acting on any account

**Answer: D.** Multiple matches need clarification, and one more identifier resolves almost all of them at low cost. A and B are heuristic selection that can expose or change another customer's account, and C sends a routine clarification to humans when the agent can handle it with one question.

## 5.3 Error Propagation Across Multi-Agent Systems

**Concept.** Same structured-error philosophy as [Domain 2](domain-2-tool-design-mcp.md#22-structured-mcp-error-responses), applied at the *coordinator* level. The coordinator can only make a good recovery decision if the subagent tells it what actually happened.

**What a useful error carries:**

- **Failure type** — timeout, auth failure, rate limit, invalid query, source not found.
- **What was attempted** — the query, the source, how many retries.
- **Partial results** — whatever was gathered before the failure.
- **Alternatives** — other sources or query shapes that might work.

**Access failure vs. valid empty result.** These two look similar and mean opposite things:

- *Access failure*: "the search timed out" — we don't know whether matching data exists. The coordinator must decide whether to retry, use another source, or mark a gap.
- *Valid empty result*: "the search ran and found nothing" — that is a finding. It may be meaningful evidence ("no recalls on record for this model").

If both come back as `[]`, the coordinator will treat missing data as evidence of absence.

**Rules:**

- Subagents attempt **local recovery** for transient errors first (retry with backoff, smaller page size).
- Only propagate errors that **can't** be resolved locally — with what was attempted and any partial results.
- **Generic statuses** like `"search unavailable"` hide exactly the context the coordinator needs.
- Never **silently suppress** a failure by returning empty results as success.
- Never **terminate the whole workflow** because one subagent failed. Continue with what you have and say what is missing.
- The final synthesis carries **coverage annotations**: which findings are well supported and which areas have gaps because sources were unavailable.

**Worked example — a structured subagent error payload.** A research coordinator asks a subagent to collect clinical-trial data. The trial registry times out twice; one database works.

```json
{
  "status": "partial",
  "task": "Find phase 3 trials for drug X, 2020-2026",
  "results": [
    {"trial_id": "NCT0451...", "source": "EU trials register",
     "phase": 3, "status": "completed", "retrieved": "2026-11-20"}
  ],
  "errors": [
    {
      "source": "US trial registry API",
      "failure_type": "timeout",
      "transient": true,
      "attempted": "query 'drug X phase 3', 3 retries with backoff over 45s",
      "partial_results": "first page only (20 of ~60 records)",
      "alternatives": ["retry later", "use bulk download file",
                        "narrow date range to 2023-2026"]
    }
  ],
  "empty_but_successful": [
    {"source": "WHO trial platform", "query": "drug X phase 3",
     "note": "query succeeded, 0 matches"}
  ]
}
```

The coordinator can now choose: retry the registry with a narrower range, accept partial data, or mark a gap. It also knows the WHO result is a real zero, not a failure.

**Worked example — synthesis with coverage annotations:**

```markdown
## Coverage
| Topic | Support | Notes |
|---|---|---|
| EU phase 3 trials | Well supported | 2 registries, consistent |
| US phase 3 trials | Partial | Registry timed out; 20 of ~60 records reviewed |
| Post-market safety | Gap | Safety database unavailable during run |
```

A reader sees immediately which conclusions are solid and which rest on incomplete data.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Subagent returns `{"status": "error", "message": "search unavailable"}` | Coordinator can't tell retryable from fatal, or what was tried | Failure type, attempted query, partial results, alternatives |
| Timeout returned as `{"results": []}` with success status | Missing data reads as "nothing exists" | Distinguish access failure from valid empty result |
| Every transient blip propagated to the coordinator | Coordinator gets noisy and replans for nothing | Local retry first; propagate only what can't be fixed |
| Coordinator aborts the whole job when one source fails | Throws away good work from other subagents | Continue with partial results and annotate the gap |
| Final report written as if coverage were complete | Readers over-trust conclusions | Coverage annotations per topic |


**Practice.** A competitor-analysis subagent's web search times out. It returns `{"status": "success", "results": []}`. The final report states "no competitor has launched a similar product." What is the root problem?

- A) The search timeout was too short
- B) The coordinator should have run the search itself
- C) The synthesis agent should have been told to avoid absolute statements
- D) The subagent reported an access failure as a valid empty result, so the coordinator treated missing data as evidence of absence

**Answer: D.** A timeout means "unknown," not "none," and reporting it as success with empty results hid that from the coordinator. A might reduce how often timeouts happen but leaves the same silent misreporting in place, B gives up the benefit of delegation without fixing error reporting, and C treats a symptom in the wording while the coordinator still believes the search ran.

**Practice.** A coordinator runs five subagents for a market report. One subagent's data source returns HTTP 503 after three local retries. The current design aborts the whole run and reports "job failed." What is the better design?

- A) Have the failing subagent return a structured error (failure type, what was attempted, partial results, alternatives) and let the coordinator continue, marking that area as a coverage gap in the report
- B) Keep aborting, since partial reports can mislead
- C) Have the failing subagent return an empty result so the run can finish
- D) Retry the failing subagent indefinitely until the source responds

**Answer: A.** One failed source should not discard four good results, and a structured error plus coverage annotations lets the report be honest about what is missing. B wastes the completed work when the gap could simply be labelled, C silently suppresses the error and misleads the reader, and D can hang the workflow on a source that may be down for hours.

**Practice.** Subagents in a document-processing system send every error straight to the coordinator, including one-off rate-limit responses that succeed on a second try. The coordinator spends many turns replanning around problems that would have resolved themselves. What should change?

- A) Have the coordinator ignore all errors from subagents
- B) Replace error details with a single "unavailable" status to reduce noise
- C) Have subagents retry transient failures locally and propagate only errors they cannot resolve, including what was attempted and any partial results
- D) Move all tool calls from subagents to the coordinator

**Answer: C.** Transient errors belong to the component closest to them, and only unresolved failures need the coordinator's attention, with enough detail to act on. A hides real failures, B is the generic-status anti-pattern that removes the context the coordinator needs, and D overloads the coordinator's context and removes the isolation subagents provide.

## 5.4 Large Codebase Exploration & Crash Recovery

**Concept.** Long exploration sessions degrade. After hours of reading files, the model's context is full of raw search output, and answers drift: it contradicts earlier findings and starts talking about "typical patterns" instead of the specific classes it found earlier. The fixes all move durable knowledge out of the growing context and keep raw exploration output from piling up there.

**Tools for this:**

- **Scratchpad files** — the agent writes key findings (class names, file paths, call chains, decisions) to a file and rereads it before answering later questions. The file survives context compaction, new sessions, and handoffs.
- **Subagent delegation** — send narrow questions ("find all test files for billing," "trace the refund flow dependencies") to subagents. Each subagent runs in its own context window, absorbs the verbose search output, and returns only a summary. The main agent keeps the high-level picture. In Claude Code, the built-in **Explore subagent** is read-only and is used for file discovery and code search so that the results stay out of the main conversation; Claude picks a thoroughness level (quick, medium, or very thorough) when it calls it.
- **Phase summaries** — when one exploration phase ends, summarize its key findings and inject that summary into the initial context of the subagents for the next phase. They start from what is known instead of rediscovering it.
- **`/compact`** — in Claude Code, `/compact` frees up context by summarizing the conversation so far, and accepts optional focus instructions for the summary (for example `/compact keep the refund flow call chain and file paths`). Use it when context is full of verbose discovery output. `/context` shows what is filling the window. Compaction is itself a summary, so anything you can't afford to lose should already be in a scratchpad file.
- **Crash recovery with manifests** — each agent exports its state to a known location as it works. If the run crashes, the coordinator loads a **manifest** on resume and injects the relevant state into each agent's prompt, so work restarts from the last checkpoint instead of from zero.

**Worked example — a scratchpad file.** `notes/refund-exploration.md`, maintained by the agent while exploring a legacy Java monolith:

```markdown
# Refund flow exploration (updated after each finding)

## Confirmed facts
- Entry point: `RefundController.submit()` (web/RefundController.java:88)
- Business logic: `RefundService.process()` -> `LedgerAdapter.post()`
- Refund limits read from `refund_rules` table via `RuleRepository`,
  NOT from config files (checked application.yml: no refund keys)
- Async path: `RefundEventListener` consumes `refund.requested` (Kafka)

## Open questions
- Who else writes to `refund_rules`? (grep found 2 callers, 1 unread)

## Decisions
- Ignore `legacy/RefundV1*` - dead code, no references outside tests
```

Before each new question, the agent rereads this file. When asked "where are refund limits set?" it answers "`refund_rules` table via `RuleRepository`," not "usually in a config file."

**Worked example — a crash recovery manifest.** The coordinator for a migration analysis writes `state/manifest.json` after every subagent checkpoint:

```json
{
  "run_id": "migr-2026-11-27-01",
  "phase": "dependency-mapping",
  "updated": "2026-11-27T10:42:00Z",
  "agents": [
    {"name": "billing-mapper", "status": "complete",
     "state_file": "state/billing-mapper.json"},
    {"name": "orders-mapper", "status": "in_progress",
     "state_file": "state/orders-mapper.json",
     "last_checkpoint": "mapped 41 of 67 packages"},
    {"name": "auth-mapper", "status": "not_started", "state_file": null}
  ],
  "phase_summary": "state/phase1-summary.md"
}
```

On resume the coordinator reads the manifest, skips `billing-mapper`, restarts `orders-mapper` with its state file injected into the prompt ("you have already mapped these 41 packages; continue with the rest"), and starts `auth-mapper` fresh with the phase summary.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| One agent reads hundreds of files directly in the main session | Raw output floods the main context; answers degrade | Delegate narrow questions to subagents (e.g. Explore) |
| Relying on the model to "remember" findings from two hours ago | Context degradation and compaction lose specifics | Scratchpad file reread before answering |
| Starting each phase's subagents with no context | They rediscover what is already known | Inject a summary of the previous phase |
| Crash means restarting the whole run | Wastes completed work | Per-agent state exports plus a manifest the coordinator loads on resume |
| Keeping all verbose discovery output until the window fills | Pushes out earlier, more important context | `/compact` with focus instructions, after saving key facts to the scratchpad |


**Practice.** After 2 hours of codebase exploration, Claude starts giving vague answers referencing "typical Java patterns" instead of the specific classes it identified earlier in the session. What's the most direct fix?

- A) Restart with no context at all
- B) Have the agent maintain a scratchpad file of key findings to reference, countering context degradation
- C) Switch models mid-session
- D) Increase `max_tokens`

**Answer: B.** A scratchpad persists the specific findings outside the degrading context, and rereading it grounds later answers in what was actually found. A throws away everything learned without preventing the same decline next time, C does nothing about the full context, and D controls output length, not how well the model uses its input.

**Practice.** A multi-agent analysis of a 2-million-line codebase crashes four hours in, after three of five subagents have finished. Today the only option is to rerun everything. Which design fixes this?

- A) Run all subagents sequentially so a crash affects only one
- B) Increase the coordinator's context window so it can hold all subagent output
- C) Have each agent export its state to a known location and have the coordinator load a manifest on resume, injecting each agent's saved state into its prompt
- D) Have the coordinator re-ask each subagent what it remembers after the crash

**Answer: C.** Structured state exports plus a manifest let the coordinator skip finished work and resume partial work from its checkpoint. A makes the run slower and still loses state on a crash, B doesn't survive a process crash at all, and D cannot work because a crashed subagent's context is gone.

**Practice.** A developer asks Claude Code to "find every place the app reads feature flags." The main session's context fills with thousands of lines of grep output, and later answers about architecture get worse. What is the best approach for this kind of question?

- A) Delegate the search to a subagent such as the built-in Explore subagent, which does the searching in its own context and returns a summary of locations
- B) Paste the grep output into a scratchpad and keep it in context as well
- C) Run `/clear` after each search
- D) Ask the main agent to read each matching file in full to be thorough

**Answer: A.** A subagent absorbs the verbose search output in its own context window and hands back only the conclusion, so the main session keeps its high-level understanding. B keeps the noise in context and adds a copy, C starts a new conversation and throws away the architectural understanding the developer wants to keep, and D makes the context problem worse.

**Practice.** Phase 1 of a legacy-system analysis mapped the module structure. Phase 2 spawns subagents to analyze each module's data access, but they keep re-mapping module boundaries before doing their real work, and some contradict phase 1's findings. What should the coordinator do?

- A) Give the phase 2 subagents the full phase 1 transcript
- B) Tell the phase 2 subagents to work faster
- C) Run phase 2 in the coordinator's own context instead of in subagents
- D) Summarize the key findings from phase 1 and inject that summary into each phase 2 subagent's initial context

**Answer: D.** A concise phase summary gives each new subagent the established facts at the start of its context, so it builds on them instead of rediscovering or contradicting them. A floods the subagents with raw history and puts the key facts in the middle, B is not an instruction that changes behavior, and C loses the context isolation that made subagents useful.

## 5.5 Human Review & Confidence Calibration

**Concept.** Automating extraction (invoices, claims, contracts) is a question of where to spend scarce human review time. Two ideas drive the exam's answers here: aggregate numbers can hide failures, and confidence scores are only useful once they are calibrated against labeled data.

**Key points:**

- **Aggregate accuracy can mask segment-level failure.** 97% overall might hide 60% accuracy on handwritten invoices, or on the `tax_amount` field. Validate **by document type and by field** before reducing human review for any segment.
- **Field-level confidence**, not one score per document. A document can have a certain vendor name and a doubtful due date.
- **Calibrate thresholds on a labeled validation set.** A raw score of 0.9 means nothing until you've checked how often 0.9-scored fields are actually right. Set the auto-accept threshold where measured accuracy meets your target, per field and document type.
- **Route to humans:** fields with low confidence, and documents whose sources are ambiguous or contradictory (the PO says $1,200, the invoice says $1,250). Prioritize these, because reviewer capacity is limited.
- **Stratified random sampling of high-confidence output.** Auto-accepted extractions still get sampled, stratified by document type and field, so you keep measuring their error rate and catch **novel error patterns** (a new vendor template, a changed date format) that the confidence score didn't flag.

**Worked example — calibration and review plan for invoice extraction:**

```text
1. Labeled validation set
   2,000 invoices, hand-labeled, stratified by type:
   typed PDF (60%), scanned (30%), handwritten (10%)

2. Accuracy by segment (not just overall: 96.8%)
   field          typed   scanned  handwritten
   vendor_name    99.6%   99.1%    97.0%
   invoice_total  99.4%   97.2%    81.5%   <- hidden by aggregate
   due_date       98.9%   95.0%    74.0%   <- hidden by aggregate

3. Threshold calibration (per field, per type)
   invoice_total / scanned: fields scored >= 0.92 were 99.3% correct
   -> auto-accept threshold 0.92
   invoice_total / handwritten: no threshold reaches 99%
   -> always human review

4. Routing
   - Any field below its threshold          -> review queue
   - Invoice total != PO total, or two
     different totals on the same document  -> review queue (priority)
   - Handwritten invoice_total / due_date   -> review queue

5. Ongoing sampling of auto-accepted output
   - Weekly: random sample of 2% per (type x field) stratum,
     minimum 30 per stratum
   - Track error rate per stratum; alert if any exceeds 1%
   - Reviewers tag new error patterns (e.g. "new vendor template",
     "EU date format DD/MM read as MM/DD")
```

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Cutting human review because overall accuracy is 97% | Weak segments are averaged away | Validate per document type and per field first |
| Using raw model confidence as a threshold without checking it | Self-reported scores are not calibrated | Calibrate thresholds against a labeled validation set |
| One confidence score per document | Hides which field is doubtful | Field-level confidence |
| Never reviewing high-confidence extractions | Confidently wrong patterns go undetected | Stratified random sampling of auto-accepted output |
| Reviewing a purely random sample of everything | Rare document types barely get sampled | Stratify by document type and field |
| Sending all documents to a review queue in arrival order | Limited reviewers spend time on easy cases | Prioritize low-confidence fields and contradictory sources |


**Practice.** An invoice extraction pipeline shows 97% overall field accuracy on last month's data, and the team proposes removing human review entirely. What should happen first?

- A) Remove review, since 97% exceeds the 95% target
- B) Raise the model's temperature to reduce systematic errors
- C) Remove review for half the documents as a trial, chosen at random
- D) Break accuracy down by document type and field to confirm every segment meets the target before reducing review for that segment

**Answer: D.** An aggregate figure can hide a document type or field performing far below target, so segment-level validation has to come first. A acts on the number that may be hiding the problem, B has no link to systematic extraction errors and makes output less consistent, and C still doesn't reveal which segments are weak.

**Practice.** A claims-processing system auto-accepts any field with model confidence of 0.95 or higher and never reviews those fields again. Six weeks after a large insurer changed its form layout, someone notices that policy numbers from that insurer have been wrong the whole time — all with confidence above 0.95. What process would have caught this early?

- A) Ongoing stratified random sampling of high-confidence extractions, so auto-accepted fields are still checked by humans and new error patterns surface
- B) Raising the threshold to 0.99
- C) Asking the model to double-check fields scored above 0.95
- D) Sending only low-confidence fields to review, as now, but with more reviewers

**Answer: A.** Sampling auto-accepted output by stratum keeps measuring the real error rate and surfaces novel patterns that the confidence score itself does not flag. B still auto-accepts confident wrong answers and was never calibrated, C asks the same model that was confidently wrong to grade itself, and D adds capacity to a queue that by design never sees these errors.

**Practice.** A team has field-level confidence scores but chose the auto-accept cutoff of 0.85 because "it seemed reasonable." Reviewers report many errors among accepted fields for some fields and almost none for others. What is the right way to set thresholds?

- A) Use one stricter global threshold, such as 0.95, for all fields
- B) Let reviewers adjust the threshold weekly based on how busy they are
- C) Measure accuracy at each confidence level on a labeled validation set, and set thresholds per field (and document type) where measured accuracy meets the target
- D) Replace field-level scores with a single document-level score

**Answer: C.** Confidence scores only become useful once calibrated against labeled data, and calibration usually shows that different fields need different cutoffs. A is still uncalibrated and will over-review some fields while under-reviewing others, B ties quality to workload instead of measured accuracy, and D throws away the information about which field is doubtful.

## 5.6 Provenance & Uncertainty in Multi-Source Synthesis

**Concept.** In multi-agent research, a claim passes through several steps — search, summary, synthesis. At each step, compression tends to drop *where the claim came from*. By the final report, a statistic has no source, conflicting values have been quietly merged, and an old figure looks like a current one. The fix is to treat provenance as structured data that every step must preserve and merge, not as prose that can be summarized away.

**Rules:**

- **Claim-source mappings.** Subagents output each claim with its source (URL or document name), the relevant excerpt, and the publication or data collection date. The synthesis agent preserves and merges these mappings; it does not summarize them away.
- **Conflicting values from credible sources** — keep both, each with attribution. Don't silently pick one or average them.
- **Let the coordinator reconcile.** A document-analysis subagent completes its work with conflicting values included and explicitly annotated; the coordinator decides how to reconcile (or whether to leave the conflict visible) before passing to synthesis.
- **Dates prevent false contradictions.** "Market size $4.1B (2023 data)" and "$5.6B (2025 data)" are a trend, not a disagreement. Without dates they look like a conflict.
- **Report structure.** Separate **well-established findings** from **contested** ones, and keep the original sources' characterizations and methodological context ("survey of 1,200 firms," "preliminary estimate").
- **Render each content type appropriately.** Financial data as tables, news as prose, technical findings as structured lists. Don't flatten everything into one uniform format.

**Worked example — claim→source mapping with a conflict annotation:**

```json
{
  "claims": [
    {
      "claim_id": "c1",
      "claim": "Global heat pump sales grew in 2022",
      "status": "well_established",
      "sources": [
        {"source": "https://example.org/heat-pump-report-2023",
         "document": "Heat Pump Market Report 2023",
         "excerpt": "Sales rose 11% year on year in 2022",
         "published": "2023-07", "data_period": "2022"}
      ]
    },
    {
      "claim_id": "c2",
      "claim": "European heat pump sales change in 2023",
      "status": "contested",
      "values": [
        {"value": "-5%", "source": "Industry association annual statistics",
         "excerpt": "Sales in 14 tracked markets fell 5%",
         "published": "2024-03", "data_period": "2023",
         "method": "member-reported unit sales, 14 countries"},
        {"value": "+3%", "source": "Consultancy market tracker",
         "excerpt": "We estimate 3% growth across Europe",
         "published": "2024-01", "data_period": "2023 (estimate)",
         "method": "modelled estimate, all EU markets"}
      ],
      "conflict_note": "Different coverage (14 markets vs all EU) and methods (reported vs modelled). Not reconciled; coordinator to decide."
    }
  ]
}
```

The synthesis agent can now write: "Sales grew in 2022 (11%). For 2023, sources disagree: an industry association reports a 5% fall across 14 markets, while a consultancy estimates 3% growth across all EU markets."

**Worked example — report skeleton:**

```markdown
## Key findings (well established)
- ... each with inline citation [1], [2]

## Contested findings
- 2023 European sales: -5% [3] vs +3% (estimate) [4]; differing coverage and method

## Financial data
| Metric | 2022 | 2023 | Source |
|---|---|---|---|

## Recent news
Short prose paragraphs, dated.

## Technical findings
- Bulleted, one finding per line, with source

## Coverage gaps
- No data found for ...
```

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Subagents return prose summaries without sources | Attribution is gone before synthesis starts | Structured claim-source mappings (URL/document, excerpt, date) |
| Synthesis agent rewrites findings and drops citations | Provenance lost at the final step | Require synthesis to preserve and merge the mappings |
| Picking the more "authoritative" of two conflicting values silently | Hides real uncertainty | Show both values with attribution and a conflict note |
| Averaging conflicting statistics | Produces a number no source reported | Keep both, explain differences in method or coverage |
| No dates on extracted figures | Change over time looks like contradiction | Publication and data collection dates in every output |
| Everything rendered as bullet points | Financial comparisons and narrative lose their shape | Tables for financial data, prose for news, lists for technical findings |


**Practice.** Two credible sources give different statistics for the same metric during a research synthesis. What should the synthesis output do?

- A) Silently use the more recent source
- B) Average the two values
- C) Preserve both values with source attribution, distinguishing well-established from contested findings
- D) Drop the statistic entirely to avoid inaccuracy

**Answer: C.** Credible sources that disagree are real uncertainty, and the report should show both values with attribution in a contested section. A hides the disagreement and assumes recency settles it, B invents a number neither source reported, and D throws away useful information that could be presented honestly.

**Practice.** A synthesis report states that two sources "contradict each other" on a company's headcount: one says 8,000, the other 11,500. On inspection, one figure is from a 2021 annual report and the other from a 2025 filing. What change to the pipeline prevents this?

- A) Have the synthesis agent always prefer the larger number
- B) Require subagents to include publication or data collection dates in their structured outputs, so the synthesis can read differences over time correctly
- C) Drop any statistic that appears with two different values
- D) Have the synthesis agent search for a third source to break the tie

**Answer: B.** With dates attached, the synthesis can see growth over four years rather than a contradiction. A is an arbitrary rule that would be wrong in other cases, C removes a valid and useful trend, and D treats a non-conflict as a conflict and spends effort on it.

**Practice.** Search subagents in a research system return detailed notes with URLs and quotes. The final report has accurate content, but almost no citations, and reviewers cannot tell which claims came from which source. Where is the fix?

- A) Require claim-source mappings in a structured format that the synthesis agent must preserve and merge, rather than letting it compress findings into uncited prose
- B) Add a final step where the model guesses the likely source of each claim
- C) Ask reviewers to trace sources manually
- D) Have the subagents shorten their notes

**Answer: A.** Attribution is being lost at the summarization step, so the mappings need to be structured data that synthesis is required to carry through. B would generate plausible but unverified citations, C pushes the system's failure onto humans, and D shrinks the notes further without protecting the source links.

**Practice.** A due-diligence report combines quarterly revenue figures, recent press coverage, and an engineering assessment of the target company's platform. The synthesis agent writes all three as one long run of bullet points. What should the output instructions require?

- A) Convert everything to prose for readability
- B) Convert everything to one large table for consistency
- C) Keep the bullet format but add more headings
- D) Render each content type appropriately: financial figures as tables, press coverage as dated prose, and technical findings as structured lists

**Answer: D.** Different content types communicate best in different shapes, and forcing one uniform format loses comparisons in the financials and context in the news. A buries numbers in sentences, B forces narrative and technical judgment into cells where they lose meaning, and C adds headings while keeping the financial figures hard to compare.

<!-- support-footer -->
---

> Created by **Utkarsh Agarwal** — certified Claude Certified Architect (Foundations & Professional).
> Found this useful? [⭐ Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) · [💼 Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) · [☕ Buy me a coffee](https://utkarsh1agarwal.github.io/claude-architect-exam-guide/#support)
