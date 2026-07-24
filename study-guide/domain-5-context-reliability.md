# Domain 5: Context Management & Reliability (15%)

The smallest domain by weight, but the one that threads through every scenario you've already studied — error handling, escalation, and context loss show up inside Domain 1's coordinator patterns, Domain 2's tool errors, and Domain 3's long sessions alike. Treat this as a synthesis pass rather than an isolated topic.

## Preserving Critical Info Across Long Conversations

**Risks:**

- **Progressive summarization** can quietly drop numbers, dates, percentages, and customer-stated expectations as it compresses turn-by-turn.
- **"Lost in the middle"** — models are more reliable on information at the *start* and *end* of long inputs than in the middle.
- Verbose tool outputs (e.g., 40+ fields from an order lookup when only 5 matter) accumulate and crowd out relevant context.

**Fixes:**

- Extract a persistent **"case facts" block** (amounts, dates, order numbers, statuses) that rides along in every prompt, *outside* the summarized narrative history.
- Trim tool outputs to only relevant fields before they accumulate.
- Put key findings summaries at the **start** of aggregated inputs; use explicit section headers.


**Practice.** A multi-turn support conversation about a $340 refund on order #9981 gets summarized after 15 turns. The summary says "customer requested a refund," losing the specific amount and order number, causing the agent to ask the customer to repeat themselves. Best fix?

A) Never summarize; always keep full raw history
B) Extract a persistent "case facts" block (amount, order ID, dates) carried in every prompt outside the narrative summary
C) Ask the customer to always restate details each turn
D) Increase the context window size

**Answer: B.**

## Handling Long Single Documents

**Concept.** Everything above is about long *conversations*. A single very long document (a 200-page contract, a full year of financial filings) creates the same "lost in the middle" risk, but the fix looks different because there's no multi-turn history to summarize — the whole document has to be processed at once or split deliberately.

**Decision rule:**

- **If the document fits comfortably in context and the task needs cross-document reasoning** (e.g., "does clause 12 contradict clause 47?"), pass it whole — splitting it would sever exactly the cross-references the task depends on.
- **If the document is processed section-by-section anyway** (e.g., extracting a structured record per invoice from a batch of scanned invoices, or per-chapter summaries), **chunk deliberately along natural boundaries** (sections, chapters, invoices) rather than by a fixed token count, so a chunk boundary never lands mid-record.
- **Map-reduce for synthesis across chunks:** run extraction/analysis independently per chunk (the "map" step), then a separate pass that reconciles/synthesizes across chunk-level outputs (the "reduce" step) — mirrors the coordinator/subagent and per-file/cross-file patterns from [Domain 1](domain-1-agentic-architecture.md#16-task-decomposition-strategy-fixed-vs-adaptive) and [Domain 3](domain-3-claude-code-workflows.md#36-cicd-integration), applied to a document instead of a codebase or a PR.
- Put the **question or task instructions before *and* after** a very long pasted document — reinforcing the ask at the end counters the middle-of-context reliability drop for whatever comes right before it.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Splitting a long document into fixed-size token chunks | A chunk boundary can land mid-clause or mid-record, corrupting exactly the unit being extracted | Chunk along natural document boundaries (sections, invoices, chapters) |
| Running one single pass over an entire long document for both per-section extraction and cross-section synthesis | Same attention-dilution failure as a single-pass multi-file code review — depth is inconsistent across sections | Map (per-chunk extraction) then reduce (a separate cross-chunk synthesis pass) |
| Instructions placed only once, before a very long document | The instruction is exactly the kind of content "lost in the middle" affects once enough document text follows it | Repeat the task instructions after the document too, not just before |


**Practice.** A pipeline extracts line-item data from a single 300-page PDF containing 150 concatenated invoices, chunking the PDF every 2,000 tokens regardless of where an invoice happens to end. Line items near chunk boundaries are frequently corrupted or duplicated. What's the fix?

A) Increase the chunk size to 4,000 tokens
B) Chunk along invoice boundaries instead of a fixed token count, so no single invoice is split across two chunks
C) Switch to a model with a larger context window and stop chunking entirely, regardless of cost
D) Ask the pipeline to re-run only on the corrupted chunks with the same fixed-size chunking

**Answer: B.** The corruption is a direct result of chunk boundaries being blind to document structure — fixing the chunk size (A) or re-running with the same strategy (D) doesn't address the root cause; chunking along natural record boundaries does.

## Escalation & Ambiguity Resolution

**Correct triggers to escalate:**

- Customer explicitly asks for a human → escalate **immediately**, don't investigate first.
- Policy is **silent or ambiguous** on the specific request — not just "this is complex."
- Agent genuinely can't make progress.

**Unreliable escalation signals (don't use these alone):**

- Sentiment/frustration detection — doesn't correlate with actual case complexity.
- Self-reported model confidence scores — poorly calibrated; the model is often confidently wrong on exactly the hardest cases.

**Multiple-match handling:** if a lookup returns multiple possible customer matches, **ask for another identifier** — never pick heuristically (e.g., "most recent").


**Practice.** First-contact resolution is at 55% against an 80% target. Logs show the agent escalates *easy* cases (standard replacements with photo evidence) while trying to autonomously resolve *hard* ones (policy exceptions). Best fix?

A) Self-reported confidence score routing
B) Explicit escalation criteria plus few-shot examples distinguishing escalate-vs-resolve cases
C) Sentiment-based escalation
D) A separate ML classifier trained on historical tickets

**Answer: B.**

## Error Propagation in Multi-Agent Systems

Same structured-error philosophy as [Domain 2](domain-2-tool-design-mcp.md#22-structured-mcp-error-responses), applied at the *coordinator* level:

- Subagents should attempt **local recovery** for transient errors first.
- Only propagate errors that **can't** be resolved locally — and when you do, include failure type, what was attempted, and any partial results.
- Never silently convert failure into "success with empty results."
- Never kill the entire workflow over one subagent's failure — annotate coverage gaps and proceed with partial results where reasonable.

## Large Codebase Exploration & Crash Recovery

- Long exploration sessions degrade — the model starts saying "typical patterns" instead of citing the specific classes it found earlier. Counter with **scratchpad files** that persist key findings across context boundaries.
- Use subagents to isolate verbose exploration; the main agent keeps high-level coordination only.
- For crash recovery: each agent exports state to a known location, and the coordinator loads a **manifest** on resume and re-injects it.
- Use `/compact` to reduce context usage in long sessions filled with verbose discovery output.


**Practice.** After 2 hours of codebase exploration, Claude starts giving vague answers referencing "typical Java patterns" instead of the specific classes it identified earlier in the session. What's the most direct fix?

A) Restart with no context at all
B) Have the agent maintain a scratchpad file of key findings to reference, countering context degradation
C) Switch models mid-session
D) Increase `max_tokens`

**Answer: B.**

## Human Review, Confidence Calibration & Provenance

- **Aggregate accuracy can mask segment-level failure** — 97% overall might hide 60% accuracy on one document type. Always validate accuracy **by document type and field**, not just in aggregate.
- **Stratified random sampling** of *high-confidence* extractions catches novel error patterns you'd otherwise never see, since you're not reviewing "confident" outputs by default.
- **Provenance:** require subagents to output structured claim-source mappings (source, excerpt, date) that synthesis must *preserve*, not summarize away.
- **Conflicting sources:** annotate both values with attribution — never silently pick one.
- **Temporal data:** require publication/collection dates so a genuine *change over time* isn't misread as a *contradiction*.


**Practice.** Two credible sources give different statistics for the same metric during a research synthesis. What should the synthesis output do?

A) Silently use the more recent source
B) Average the two values
C) Preserve both values with source attribution, distinguishing well-established from contested findings
D) Drop the statistic entirely to avoid inaccuracy

**Answer: C.**

