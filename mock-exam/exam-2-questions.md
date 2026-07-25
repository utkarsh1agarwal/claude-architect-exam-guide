# Mock Exam 2 — Questions

> Every question here is original material written against the public CCAR-F blueprint — none of it is drawn from or paraphrased from real exam content. See [CONTRIBUTING.md](../CONTRIBUTING.md#the-one-hard-rule) for why that boundary matters and how to add more questions the right way.

## How to take it

- **A closer simulation of the real draw than Exam 1:** this mock pulls 60 questions from **4 of the 6** official scenarios — **Customer Support Resolution Agent · Multi-Agent Research System · Developer Productivity with Claude · Structured Data Extraction** — rather than covering all 6. (Exam 1 covers all 6 scenarios for full domain coverage; this one mirrors what an actual sitting looks like.)
- **Set a timer for 120 minutes.** That's ~2 minutes per item — tight enough that you need to move on from anything you're stuck on, just like the real thing.
- **No notes, no search, no assistant.** Simulate real conditions as closely as you can.
- Some items are marked **"(Select TWO)"** — treat these as multiple-response; you must get both parts correct to receive credit. Don't treat section labels as a scoring hint.
- Score yourself against [exam-2-answers.md](exam-2-answers.md) afterward — it includes a per-domain breakdown, which is a more useful diagnostic than the raw score alone.

## Scoring guide

Simulated passing score: **48/60 (≈720 scaled)** — matches the real exam's scaled cut score. Rough gut-check only, not the real exam's formal standard-setting result.

| Raw score (out of 60) | Rough read |
|---|---|
| 50+ | Likely in good shape — do a final cheat-sheet skim and go |
| 40–49 | Solid, but review your weakest domain(s) before scheduling |
| Below 40 | Not ready yet — go back through the study guide and study plan first |

---

## Scenario 1: Customer Support Resolution Agent (Items 1-15)

**1.** Your support agent has tools `get_customer`, `lookup_order`, `process_refund`, and `escalate_to_human`. A customer says "I want to speak to a manager right now" partway through a routine return. What should the agent do?
- A) Offer a discount to de-escalate before considering a transfer
- B) Ask one clarifying question to see if the issue can still be resolved
- C) Escalate immediately, without attempting further investigation
- D) Continue investigating the return since it's already 80% resolved

**2.** `lookup_order` returns three possible matches for the identifiers provided. What is the correct handling?
- A) Select the most recently placed order
- B) Select the order with the highest dollar value, since it's likely the one in dispute
- C) Process against all three and let the customer confirm afterward
- D) Ask the customer for an additional identifier to disambiguate

**3.** A refund-authorization hook blocks `process_refund` for amounts over $500 and redirects to `escalate_to_human`. An engineer proposes removing the hook and instead adding "never approve refunds over $500 without escalation" to the system prompt, arguing it's simpler to maintain. What is the main risk?
- A) Prompt instructions have a non-zero failure rate; the guarantee becomes probabilistic instead of deterministic
- B) Removing the hook would violate the MCP specification
- C) None — a clear instruction is just as reliable as a hook
- D) The system prompt has a hard character limit that would be exceeded

**4.** A customer's message covers two unrelated concerns: a billing dispute and a shipping delay. What is the best decomposition strategy?
- A) Escalate immediately since multi-concern messages are inherently too complex
- B) Ask the customer to restate their message as two separate, single-issue messages
- C) Resolve only the first concern mentioned and ask the customer to open a second ticket for the other
- D) Decompose into the two distinct items, investigate each using shared context, then synthesize one unified response

**5.** When escalating a case the agent cannot resolve, what should the handoff to the human agent include?
- A) Just the customer's most recent message, since the human can read the full transcript
- B) A confidence score representing how hard the case is
- C) A structured summary: customer details, root cause analysis, and a recommended action
- D) Only the customer ID, so the human starts the investigation fresh

**6.** `get_customer` and `lookup_order` are frequently confused by the model when a customer says "check on order #12345." Descriptions are minimal ("Retrieves customer information" / "Retrieves order details"). What should you try first?
- A) Expand each description with input formats, example queries, and explicit "use this vs. that" boundaries
- B) Add 8–10 few-shot examples of correct routing
- C) Merge the two tools into one generic `lookup` tool
- D) Build a keyword pre-router that inspects the message before the model sees it

**7.** After a 20-turn conversation about a $215 refund on order #4471, the conversation is summarized to save tokens. The summary says "customer wants a refund," and the agent later asks the customer to repeat the amount and order number. What's the most direct fix?
- A) Maintain a persistent "case facts" block (amount, order ID, dates) carried in every prompt outside the narrative summary
- B) Disable summarization entirely for all conversations
- C) Ask the customer to always begin messages with their order number
- D) Switch to a model with a larger context window

**8.** Your team wants the agent to self-report a 1–10 confidence score and auto-escalate anything below 6, replacing explicit escalation criteria. What is the concern with this approach?
- A) Confidence scores require a separate fine-tuned model to produce
- B) This approach violates MCP resource specifications
- C) Self-reported confidence is poorly calibrated — the model is often confidently wrong on exactly the hardest cases
- D) Confidence scores can only be produced when using extended thinking

**9. (Select TWO)** Which two error-reporting practices should an MCP tool AVOID when `lookup_order` fails due to a backend timeout?
- A) Returning an empty result set marked as a successful, valid query
- B) Returning `isError: true` with `errorCategory: "transient"` and `isRetryable: true`
- C) Returning a generic "Operation failed" string with no other metadata
- D) Returning the timeout duration and the specific query attempted

**10.** The agent has grown to 18 available tools across support, billing, and shipping functions, and tool-selection accuracy has degraded noticeably. What is the most appropriate fix?
- A) Force `tool_choice` to a single always-used tool
- B) Add a 20-example few-shot block covering every tool combination
- C) Scope each agent/role to only the 4–6 tools relevant to it
- D) Increase `max_tokens` so the model has more room to reason about tool choice

**11.** Which best describes why a programmatic prerequisite (blocking `process_refund` until `get_customer` returns a verified ID) is preferred over prompt wording for identity verification?
- A) It provides a deterministic guarantee instead of relying on probabilistic model compliance
- B) It's the only way to satisfy MCP's `isError` requirement
- C) It is required by the Message Batches API
- D) It reduces the number of tokens used per turn

**12.** A customer explicitly states policy allows price matching only against the company's own past sales, but asks for a price match against a competitor — a case the policy doesn't address either way. What should the agent do?
- A) Offer a partial discount as a compromise
- B) Escalate, since the policy is silent/ambiguous on this specific request
- C) Deny the request, since it wasn't explicitly permitted
- D) Approve the request, since it wasn't explicitly denied

**13.** Which is the correct interpretation of a `PostToolUse` hook's role, given `lookup_order` returns Unix timestamps and `get_customer` returns ISO 8601 dates?
- A) It's used to route the request to a different subagent
- B) It's used to normalize the two different date formats into one consistent format before the model reasons over them
- C) It's used to cache results across sessions
- D) It's used to block a tool call before it executes

**14.** Sentiment analysis is added to detect customer frustration and auto-escalate above a threshold. Escalation rates go up sharply, but first-contact resolution doesn't improve, and some genuinely simple cases now escalate unnecessarily just because the customer sounded annoyed. What does this indicate?
- A) The sentiment threshold was simply set too low
- B) The agent needs more few-shot examples of angry customers
- C) Sentiment doesn't reliably correlate with actual case complexity, so it's a poor escalation signal on its own
- D) Sentiment analysis should be paired with a larger model

**15.** A customer says "I already tried this, just send me to a person," after the agent offers to help resolve a straightforward issue. What's the appropriate next step?
- A) Honor the reiterated request and escalate
- B) Continue offering the same resolution path, since the issue is within the agent's capability
- C) Provide a partial refund automatically without further discussion
- D) Ask one more diagnostic question to confirm the issue is really unresolved

---

## Scenario 2: Multi-Agent Research System (Items 16-30)

**16.** A coordinator delegates to a web-search subagent and a document-analysis subagent. For the coordinator to invoke either one, what must be true?
- A) Both subagents must share the coordinator's full conversation history automatically
- B) The subagents must be configured with `context: fork`
- C) The coordinator must run in plan mode
- D) The coordinator's `allowedTools` must include `"Task"`

**17.** All subagents in a research pipeline complete successfully and report no errors, yet the final report covers only 30% of the requested topic. Where should you look first?
- A) The web-search subagent's result ranking
- B) The document-analysis subagent's summarization fidelity
- C) The coordinator's task decomposition logs
- D) The synthesis subagent's writing quality

**18.** The synthesis subagent needs the findings gathered by the web-search and document-analysis subagents. What must happen for it to have that information?
- A) Nothing — subagents automatically share a session-scoped memory pool
- B) The synthesis subagent must call `fork_session` to inherit prior context
- C) The coordinator must explicitly include the complete findings in the synthesis subagent's prompt
- D) The findings are inherited automatically as long as all subagents share the same `AgentDefinition`

**19.** The coordinator needs to run a web-search subtask and a document-analysis subtask concurrently rather than one after another. How should it do this?
- A) Send both subtasks in separate turns but with the same `tool_use_id`
- B) Use `fork_session` to duplicate the coordinator into two parallel coordinators
- C) Set `tool_choice: "any"` on the coordinator's next call
- D) Emit both `Task` tool calls within a single coordinator response

**20.** Two credible sources report different figures for the same statistic during synthesis. What should the final report do?
- A) Preserve both values with source attribution, distinguishing well-established from contested findings
- B) Average the two figures and report the average as the value
- C) Silently prefer whichever source was retrieved most recently
- D) Omit the statistic entirely since it can't be verified

**21.** During synthesis, a claim's supporting excerpt is compressed for brevity, and the source URL originally attached to it is dropped in the process. What principle was violated?
- A) The excerpt should have been translated into a different content type
- B) Structured claim-source mappings must be preserved and merged through synthesis, not summarized away
- C) The claim should have been paraphrased more aggressively, not less
- D) The claim needed a confidence score instead of a source

**22.** A web-search subagent times out mid-query. What should it return to the coordinator?
- A) An empty result set marked as a successful query
- B) A retry loop that continues indefinitely until it succeeds
- C) Nothing — the coordinator should assume failure from a lack of response
- D) Structured error context: failure type, what was attempted, any partial results, and possible alternatives

**23.** A statistic in one subagent's findings comes from a report published two years ago, while another subagent's finding on the same metric is from last month. Synthesis treats these as contradictory. What was missing from the subagents' structured output?
- A) A `retryable` boolean
- B) A `confidence` field
- C) An `errorCategory` field
- D) Publication or data-collection dates, which would show this is a change over time rather than a contradiction

**24.** The synthesis subagent frequently needs simple fact-checks (dates, names, statistics) — 85% of verification needs are simple, 15% require deep investigation. Routing every check through the coordinator to the web-search agent adds significant latency. What is the most balanced fix?
- A) Batch all verification requests to run once at the end of the pipeline
- B) Have the web-search subagent pre-cache anything it speculates might later be needed
- C) Give the synthesis subagent full, unrestricted access to all search tools
- D) Give the synthesis subagent one scoped `verify_fact` tool for the simple 85%, keep coordinator-routed delegation for the complex 15%

**25.** A coordinator decomposes "impact of remote work on urban commercial real estate" into three subtasks: "office vacancy rates downtown," "office vacancy rates in suburbs," and "office leasing trends." The resulting report never touches retail or residential conversion angles. What is the root cause?
- A) The coordinator's task decomposition was too narrow, missing entire relevant sub-domains of the topic
- B) The web-search subagent didn't search broadly enough
- C) The document-analysis subagent filtered out irrelevant sources
- D) The synthesis subagent lacked writing guidance on breadth

**26.** After reviewing a first-pass synthesis output, the coordinator identifies that the "counterarguments" section is thin. What is the appropriate next action, consistent with iterative refinement of multi-agent research?
- A) Publish the report as-is; thoroughness is the synthesis agent's sole responsibility
- B) Lower the temperature and regenerate synthesis from the same inputs
- C) Ask the user to manually supply counterarguments
- D) Re-delegate to search/analysis subagents with targeted follow-up queries, then re-invoke synthesis

**27.** Which best distinguishes a subagent's isolated context from the coordinator's context?
- A) Subagents inherit context only during the first invocation of a session
- B) Subagents do not automatically inherit the coordinator's conversation history; relevant context must be explicitly passed in
- C) Subagents share the coordinator's memory but not its tool access
- D) Subagents inherit context if and only if they use the same underlying model

**28.** A research pipeline crashes mid-run due to an infrastructure failure. What design allows the coordinator to resume cleanly?
- A) Each agent exporting state to a known location; the coordinator loads a manifest on resume and re-injects it
- B) Relying on the model to recall its own prior progress from training data
- C) Restarting from scratch and re-running every subagent regardless of prior progress
- D) Keeping all state only in the coordinator's in-memory variables

**29.** The synthesis subagent is given tools for web search, document parsing, and fact verification "just in case it needs them for edge cases." What risk does this create?
- A) It requires `fork_session` to function correctly
- B) It has no real downside since unused tools cost nothing
- C) Agents with tools outside their specialization tend to misuse them (e.g., a synthesis agent attempting its own web searches)
- D) It will always outperform a narrowly-scoped agent

**30.** Structured findings from subagents should separate content from metadata. Which of these best exemplifies that separation?
- A) Separate fields for `claim`, `evidence_excerpt`, `source_url`, and `publication_date`
- B) A markdown-formatted paragraph with inline citations
- C) A single string like `"Retail vacancy hit 18% (Source: CBRE, March 2026, cbre.com/report-2026)"`
- D) A raw dump of the source webpage's HTML

---

## Scenario 3: Developer Productivity with Claude (Items 31-45)

**31.** A developer wants to find every file that calls a specific exported function across a large codebase. Which built-in tool is the right starting point?
- A) `Read`, applied to every file in the repo
- B) `Bash` with no specific command needed
- C) `Grep`, since it searches file contents for the function name
- D) `Glob`, since it searches by pattern

**32.** A developer wants to locate every test file in a monorepo matching `**/*.test.tsx` regardless of directory. Which tool is correct?
- A) `Write`
- B) `Grep`
- C) `Glob`
- D) `Edit`

**33.** `Edit` repeatedly fails on a file because the anchor text it's trying to match appears multiple times. What is the recommended fallback?
- A) Switch to `Bash` with `sed` exclusively
- B) Use `Read` to load the full file, then `Write` the corrected full content
- C) Split the file into smaller files first
- D) Increase `max_tokens` and retry `Edit`

**34.** A team keeps a company-wide MCP server for Jira in `.mcp.json`, using `${JIRA_TOKEN}` for the credential. A developer also wants to experiment with a personal, unreleased MCP server without affecting teammates. Where should the personal server be configured?
- A) It cannot be done without modifying the shared repo config
- B) In `CLAUDE.md` as a code block
- C) In `.mcp.json` with a different key
- D) In `~/.claude.json`

**35.** Claude Code keeps preferring `Grep` over a connected MCP server's more powerful `search_codebase` tool, even though the MCP tool would give better results for the developer's query. What is the most likely cause and fix?
- A) MCP tools always lose to built-in tools by design and this can't be changed
- B) The MCP tool is broken; disable `Grep` entirely
- C) The MCP tool's description under-sells its capability relative to the well-known built-in tool; improve the description to clarify when and why to prefer it
- D) Switch the MCP server from project scope to user scope

**36.** A developer wants a "codebase exploration" skill whose verbose dependency-tracing output shouldn't clutter the main conversation. Which SKILL.md frontmatter option addresses this?
- A) `argument-hint`
- B) `paths`
- C) `allowed-tools`
- D) `context: fork`

**37.** A skill should be limited to file-write operations only, with no ability to run destructive `Bash` commands. Which frontmatter option enforces this?
- A) There is no way to restrict a skill's tool access
- B) `allowed-tools`
- C) `argument-hint`
- D) `context: fork`

**38.** A new hire isn't receiving the team's established coding conventions, even though a senior engineer insists "it's all in CLAUDE.md." What is the most likely cause?
- A) The conventions live in the senior engineer's user-level `~/.claude/CLAUDE.md`, which isn't shared via version control
- B) CLAUDE.md files are cached and require a manual cache clear
- C) The new hire's IDE isn't configured to load CLAUDE.md
- D) The conventions are correctly placed in the project-level CLAUDE.md, and the new hire simply hasn't read it

**39.** A monorepo has React, API, and database-model layers, each with different conventions, plus test files scattered throughout every layer. What is the most maintainable way to apply testing conventions specifically, regardless of file location?
- A) A `.claude/rules/testing.md` file with `paths: ["**/*.test.*"]` frontmatter
- B) A skill that must be manually invoked before writing any test
- C) Put a "Testing" section in the root CLAUDE.md and hope Claude infers when it applies
- D) Add a CLAUDE.md to every directory that happens to contain a test file

**40.** A developer is asked to add comprehensive tests to a legacy codebase with no existing test coverage and unclear module boundaries. What task-decomposition approach fits best?
- A) Map the codebase structure first, identify high-impact areas, then build a prioritized plan that adapts as dependencies are discovered
- B) A fixed, fully pre-specified sequential checklist decided before any exploration
- C) Escalate to a human immediately since the task is too undefined for an agent
- D) Write tests for every file in alphabetical order

**41.** A developer is debugging a single failing test with a clear stack trace pointing to one function. What's the appropriate mode?
- A) Plan mode, to explore alternative architectures first
- B) Fork the session to explore two different fixes in parallel
- C) Direct execution, since the change is small and well-understood
- D) Escalate to a second Claude instance for independent review before touching any code

**42.** A developer describes a desired data-transformation function in prose, but Claude's implementation is inconsistent across attempts — sometimes handling edge cases differently. What is the most effective way to tighten the specification?
- A) Lower `max_tokens` to force a more concise implementation
- B) Provide 2–3 concrete input/output examples that pin down the exact expected transformation
- C) Repeat the same prose instructions with more emphatic wording
- D) Switch to a different model without changing the instructions

**43.** Before implementing a caching layer in an unfamiliar part of the codebase, a developer wants Claude to surface considerations they might not have thought of — invalidation strategy, failure modes, TTL choices — before writing any code. What technique does this describe?
- A) Plan mode is not applicable here since this is a single feature, not an architecture-wide task
- B) The interview pattern — having Claude ask clarifying questions before implementation
- C) Test-driven iteration
- D) Prompt chaining

**44.** A code-review request surfaces three findings that interact with each other (fixing one changes the correct fix for another). What's the better way to communicate them to Claude?
- A) Ignore the interactions and let Claude discover them on its own
- B) Provide all three interacting issues together in a single detailed message
- C) Fix them one at a time in separate messages, waiting for each fix before mentioning the next
- D) Ask Claude to pick which one to fix first

**45.** A team is restructuring a monolith into microservices — changes will span 45+ files, and there are multiple valid ways to draw service boundaries. What's the correct approach, and which subagent helps avoid exhausting context during the investigation phase?
- A) Direct execution; no subagent is needed since this is primarily a refactor
- B) Plan mode to explore and decide on an approach first, using the Explore subagent to isolate verbose discovery output
- C) Direct execution with an extremely long, fully-detailed upfront prompt describing every service boundary
- D) Plan mode, but skip subagents entirely to keep everything in one context

---

## Scenario 4: Structured Data Extraction (Items 46-60)

**46.** An extraction schema marks `contract_end_date` as a required field, but many contracts in the corpus are open-ended with no end date. What happens, and what's the fix?
- A) Switch from `tool_use` to plain-text JSON output to avoid the issue
- B) This is expected behavior and requires no change
- C) The model may fabricate a plausible end date to satisfy the required constraint; make the field nullable/optional instead
- D) Extraction will simply fail validation every time; the schema is unusable

**47.** An extraction pipeline using `tool_use` with a strict JSON schema never produces malformed JSON, but sometimes produces line items that don't sum to the stated total. What does this indicate?
- A) This is a semantic error, not a syntax error — add a `calculated_total` field to compare against `stated_total` and flag mismatches
- B) Lowering `max_tokens` will resolve the inconsistency
- C) The schema itself is broken and needs stricter typing
- D) `tool_use` cannot guarantee numeric fields and should be abandoned for this use case

**48.** You have three extraction schemas (invoice, receipt, contract) and don't know in advance which document type will arrive, but you want to guarantee some structured extraction occurs. Which `tool_choice` setting is correct?
- A) `"auto"`
- B) Omitting `tool_choice`
- C) `{"type": "tool", "name": "extract_invoice"}`
- D) `"any"`

**49.** An extraction validated against a JSON schema fails because a required field, `vendor_tax_id`, is missing. On investigation, the source document never contained a tax ID anywhere. What should happen next?
- A) Recognize that retrying is unlikely to help since the information is genuinely absent from the source; the field should have been optional
- B) Fabricate a placeholder value so the schema validates
- C) Increase `max_tokens` and retry
- D) Retry the extraction with the same prompt; retries usually resolve missing-field errors

**50.** A validation-retry loop for extraction failures should include which of the following in the follow-up request?
- A) The original document, the failed extraction, and the specific validation error(s) that occurred
- B) Only the original document, without reference to the prior failed attempt
- C) A completely new document as a substitute
- D) Only a generic instruction to "try again more carefully"

**51.** A finding-tracking system for a review pipeline adds a `detected_pattern` field to every flagged issue. What is this field's purpose?
- A) To determine `isRetryable` status
- B) To enable systematic analysis of which code constructs trigger findings, useful for spotting false-positive patterns developers repeatedly dismiss
- C) To select which `tool_choice` mode to use next
- D) To store the model's confidence score

**52.** A code-review prompt already says "only report high-confidence findings," yet developers report 40% of flagged issues in the "style consistency" category are false positives. What's the most effective next step?
- A) Lower the model's temperature setting
- B) Permanently remove the category so it never generates findings again
- C) Add "be even more conservative" to the prompt
- D) Define explicit, categorical criteria for what specifically counts as a style issue vs. what doesn't, and consider temporarily disabling the category while iterating

**53.** Few-shot examples are added to help a model select between two visually similar tools in ambiguous cases. What makes few-shot effective here, beyond simply showing input/output pairs?
- A) Few-shot examples eliminate the need for good tool descriptions entirely
- B) Showing the reasoning for why one tool was chosen over a plausible alternative helps the model generalize judgment to novel, unseen cases
- C) Few-shot examples work only because they increase total prompt length
- D) Few-shot examples are only useful for formatting, not for judgment calls

**54.** Your organization wants to move two workloads to the Message Batches API for its 50% cost savings: (a) an overnight technical-debt report and (b) a blocking pre-merge security gate that developers actively wait on. What's the correct call?
- A) Batch both, with a real-time fallback triggered if the batch takes too long
- B) Keep both synchronous, since batch correlation via `custom_id` is too error-prone
- C) Batch both workloads
- D) Batch only the overnight report; keep the pre-merge gate on synchronous calls

**55.** A batch submission of 200 documents returns some failures. What's the correct remediation approach?
- A) Switch failed documents to a completely different extraction schema
- B) Identify the failed documents by `custom_id`, and resubmit only those, adjusting for the specific cause (e.g., chunking oversized documents)
- C) Resubmit the entire batch of 200 documents from scratch
- D) Discard the failed documents permanently since batch jobs cannot be retried

**56.** An extraction system reports 97% aggregate accuracy across all processed documents. A stakeholder asks whether this is sufficient to reduce human review. What should you check before answering?
- A) Whether the model used `tool_choice: "auto"` or `"any"`
- B) Only the accuracy of the single most common document type
- C) Nothing further — 97% aggregate accuracy is sufficient on its own
- D) Accuracy broken down by document type and by field, since aggregate metrics can mask poor performance on specific segments

**57.** To catch novel extraction error patterns that wouldn't normally be caught by reviewing low-confidence outputs, what technique should be applied to high-confidence extractions?
- A) Re-run the same extraction twice and average the two outputs
- B) Stratified random sampling of high-confidence extractions for ongoing error-rate measurement
- C) Apply a stricter required-fields schema only to high-confidence cases
- D) Skip reviewing them entirely, since they're already high-confidence

**58.** Field-level confidence scores are being used to route extractions to human review. What should calibrate the routing thresholds?
- A) An arbitrary fixed cutoff, e.g., always exactly 80%
- B) The number of fields in the schema
- C) Thresholds calibrated using labeled validation sets, so the confidence score maps to actual accuracy
- D) The document's file size

**59.** The same Claude session that generated a code fix is also used to review that fix before merge, and subtle logic errors are consistently missed. What's the underlying cause and the fix?
- A) `--output-format json` needs to be enabled for accurate review
- B) The session retains its generation reasoning and is less likely to challenge its own decisions; use an independent review instance without that prior context
- C) The context window is too small for review tasks; use a larger model
- D) The prompt lacks a sufficient number of few-shot examples of bugs

**60. (Select TWO)** Which two practices are appropriate when reviewing a 16-file pull request to avoid the attention dilution seen in single giant review passes?
- A) Run one single-pass review across all 16 files simultaneously for maximum context
- B) Split into focused per-file passes for local issues
- C) Require exactly three independent full-PR passes and keep only majority-vote findings
- D) Run a separate cross-file integration pass for data-flow issues spanning files

---


*End of Exam 2. Check your answers against the [Answer Key](exam-2-answers.md).*
