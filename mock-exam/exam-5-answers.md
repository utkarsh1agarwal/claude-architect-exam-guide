# Mock Exam 5 — Answer Key (Hard Mode)

Domain tags: **D1** Agentic Architecture · **D2** Tool Design & MCP · **D3** Claude Code Workflows · **D4** Prompt Engineering · **D5** Context & Reliability

## Scenario 1: Customer Support Resolution Agent

**Q1. Answer: B** *(D1)* — A system-prompt instruction ("skip investigation for simple cases") provides only probabilistic compliance. The reliable fix is a deterministic gate in the coordinator that simply never invokes the investigation subagent for cases the intake subagent already marked simple, enforcing the decision at the control-flow level instead of hoping the model follows a prose instruction.

**Q2. Answer: B** *(D2)* — Once description improvements alone haven't resolved misrouting, renaming the ambiguous tool to make its purpose unmistakable — `escalate_refund_exception_review`, with explicit "use this when policy does NOT allow the refund" guidance — is the next rung on the fix ladder, ahead of merging tools with an internal parameter (C) or splitting into separate subagents (D), both more disruptive changes.

**Q3. Answer: B** *(D5)* — This is context loss in a long investigation: specific numbers and identifiers can fade from a narrative history even though the conversation is nominally still "about" the same case. A persistent case-facts block (customer ID, order number, amount, dates) carried separately from the narrative is the direct fix — more targeted than simply enlarging the context window (A) or asking the customer to repeat themselves (D).

**Q4. Answer: B** *(D1)* — When a subagent fails, the coordinator needs a structured signal to tell "nothing was found" apart from "the investigation itself failed." A status field (success/failure/partial) plus structured error context (`errorCategory`, `isRetryable`) gives the coordinator exactly that distinction; without it, a silent timeout can look identical to a clean negative result.

**Q5. Answer: B** *(D2)* — Read-only, rarely-changing catalogs that exist to be discovered rather than acted upon belong in MCP resources, not tools — removing the round-trip decision cost entirely. Caching in `CLAUDE.md` (A) still requires re-reading the catalogs into context every session, and merging into a single tool (C) still costs a round-trip.

**Q6. Answer: B** *(D5)* — Self-reported model confidence is a poorly calibrated proxy for actual case complexity — it can dip on a single unresolved sub-question even when every other part of the case is completely clear-cut, which is exactly what happened here. Escalation thresholds built on this signal will misfire in both directions: escalating clear cases and failing to escalate genuinely hard ones.

**Q7. Answer: B** *(D1)* — The agentic loop must check whether `stop_reason` is `"tool_use"` to know a tool call is still pending, and execute it regardless of any accompanying text, rather than treating the presence of customer-facing text as a signal that nothing further needs to happen. Terminating early here means the tool call that should have processed the refund never actually runs.

**Q8. Answer: B, C** *(D2)* — B fixes the tool-selection confusion by making each tool's intended use case explicit; C fixes the separate problem of the coordinator being unable to tell a retryable timeout from a hard policy failure by giving error responses a category and a retryability flag. Consolidating the tools behind a parameter (A) just hides the same decision inside the model instead of removing it, and making descriptions identical (D) would make the original confusion worse, not better.

**Q9. Answer: B** *(D5)* — Turn count is a proxy that doesn't track actual complexity — a routine case can easily need extra turns just for data-gathering, while an expert can resolve a genuinely complex policy question in very few. Escalation should trigger on explicit, checkable conditions instead: policy ambiguity, missing customer-supplied data, or contradictory backend information.

**Q10. Answer: B** *(D1)* — A rigid, fully-enumerated if-then-else prompt leaves the subagent no room to reason when a real case doesn't map cleanly onto the enumerated conditions (missing photo evidence, ambiguous international shipping windows). The better design gives the subagent the same investigation tools and the underlying decision criteria, but lets it assess whether those criteria are satisfied given what it can actually observe, rather than forcing an exact literal match.

---

## Scenario 2: Code Generation with Claude Code

**Q11. Answer: B** *(D3)* — Skill frontmatter (including `argument-hint`) is read when a session starts, not re-read for a session that's already running. A session begun before the SKILL.md edit keeps operating on the old requirements for its entire lifetime; only a new session picks up the update — which is exactly the split behavior observed here.

**Q12. Answer: B** *(D3)* — User-level configuration is personal and never shared through version control, no matter how good the skill is. Making a skill available consistently to 40 engineers means it has to live at the project level, where every clone of the repo inherits the identical file — not duplicated in two places (C) or manually distributed (A).

**Q13. Answer: B** *(D3)* — A verbose/debug flag on a compaction step re-expands exactly the content the step exists to condense, which is why running it produced no improvement — it was working against its own purpose. Dropping the flag let the command actually compact accumulated context and restore room for specific detail.

**Q14. Answer: B** *(D3)* — A forked subagent's internal reasoning and any artifacts it generates don't automatically flow back to the parent session — only whatever the fork explicitly returns as its result does. If the main session needs the reference material, it has to be passed back directly or written somewhere the main session actually reads, not just produced somewhere inside the fork.

**Q15. Answer: B** *(D3)* — Multiple hooks on the same matcher run in a defined order, and when the linter happens to run before the formatter, it necessarily validates against the pre-formatted version of the file — producing a false violation against formatting that's about to change anyway. Reordering the hooks (or having the linter re-read the file post-format) fixes the sequencing, not the linter's rules themselves.

**Q16. Answer: B** *(D3)* — `allowed-tools` is a pre-approval convenience list, not a hard restriction on everything else — a tool left off the list can still be requested and go through the normal approval flow. Treating it as a security boundary here is the mistake; a genuine hard block on Bash would require something like `disallowedTools` or a blocking hook, not reliance on `allowed-tools` alone.

**Q17. Answer: B** *(D3)* — The interview pattern earns its value specifically in unfamiliar territory, where the person writing the prompt doesn't yet know which tradeoffs matter (like TTL-based expiry here) and so can't have specified them upfront. Surfacing design questions before implementation catches exactly the kind of gap that a single detailed prompt — however thorough it feels — is likely to miss when the domain itself is the unknown.

**Q18. Answer: B** *(D3)* — Continuing in the main session preserves the accumulated context of the 12 files already changed, which the fix genuinely depends on; forking at this point would isolate the fix into a context that's missing exactly the surrounding refactoring work it needs to stay consistent with.

**Q19. Answer: A** *(D3)* — Glob matching is literal path matching: `src/api/**/*.ts` matches only paths that actually fall under `src/api/`, and `src/api-client/` is a distinct sibling directory that happens to share a prefix, not a match for that pattern. A broader pattern (or an additional rule) would be needed to cover both directories.

**Q20. Answer: B** *(D3, D5)* — A running scratchpad of architectural constraints, checked before generating new code in the affected area, gives a long session a durable place for a constraint to live outside the conversation's own "salience," which is what silently erodes as the session grows and moves on to new topics. Restarting periodically (A) or compacting on a fixed schedule (C) don't specifically preserve this kind of constraint — they just change what else gets lost along with it.

---

## Scenario 3: Multi-Agent Research System

**Q21. Answer: B** *(D1)* — Forking at the point where two genuinely incompatible investigations diverge gives each hypothesis its own isolated copy of the shared context to build on independently, preventing conclusions grounded in one hypothesis from leaking into the other's write-up. Ordinary fresh named subagents don't solve this on their own if the coordinator's framing or the shared setup still lets assumptions bleed across branches.

**Q22. Answer: B** *(D1)* — A subagent only has what's explicitly included in its own invocation prompt. Terminology and source guidance the coordinator built up in its own conversation over 15 turns doesn't automatically travel with a new delegation — it has to be restated in that subagent's prompt, which is exactly what was missing here.

**Q23. Answer: B** *(D2)* — A narrow, purpose-built verification tool for simple single-fact checks lets the high-frequency, low-complexity case resolve locally without a coordinator round-trip, while genuinely complex verification still goes through the coordinator. Giving the synthesis agent full search/analysis tool access (A) reintroduces the coordination and scope problems that scoped tools are meant to avoid.

**Q24. Answer: C** *(D5)* — Every subagent looking correct in isolation doesn't guarantee the combined output is coherent — that's exactly why an explicit checkpoint evaluating the aggregated findings against citation-accuracy and cross-section-consistency criteria, before report generation runs, catches problems that no individual subagent would ever surface on its own.

**Q25. Answer: B** *(D1)* — The right call depends on whether the failed piece was essential to what was actually asked. Here, reconciling conflicts across topics was the entire point of the request, and synthesis was the step responsible for that — so a "successful" partial report from just search and document analysis would misrepresent whether the actual question got answered, and escalating is more honest than quietly returning an incomplete result.

**Q26. Answer: B** *(D2)* — The scope-creep problem is a tool-design problem, not a prompting problem: replacing general web search with a tool that can only verify claims against the already-approved document set makes scope expansion structurally impossible, rather than relying on the model to voluntarily stay within bounds it technically still has the power to exceed.

**Q27. Answer: A, C** *(D5)* — Requiring date, methodology, and corroboration-count metadata on every finding (A) gives synthesis the actual information needed to judge evidence quality, and explicitly weighting corroboration over raw recency (C) fixes the specific bias observed — an uncorroborated report currently outranking a triple-confirmed finding purely because it's newer. Treating recency as the deciding factor regardless of corroboration (B) or discarding everything except the newest source (D) both make the underlying problem worse, not better.

**Q28. Answer: B** *(D5)* — Structured state exports plus a coordinator-loaded manifest on resume is the reliable crash/interruption-recovery pattern: each subagent's completed work is captured in a known location, and resuming means loading that manifest and re-injecting only what a subsequent step actually needs, rather than redoing work or manually threading raw output through every future prompt.

**Q29. Answer: B** *(D1)* — Clearing the coordinator's own history rules out state leaking through the coordinator itself; what's left is that reusing the same prompt template or phrasing pattern across three notionally-independent Task invocations gives the model a structural cue to connect them thematically, even with no shared state at all. Framing each invocation as genuinely self-contained — not just clearing history — is what actually isolates them.

**Q30. Answer: B** *(D5)* — Time-sensitive research doesn't stay valid forever; resuming after a real time gap and re-injecting old findings as if they're still current risks exactly this outcome — publishing on sources that have since been retracted or substantially revised. Explicitly validating source currency before reuse, rather than treating a prior session's findings as permanently authoritative, is what would have caught it.

---

## Scenario 4: Developer Productivity with Claude

**Q31. Answer: C** *(D2)* — An `errorCategory` plus an `isRetryable` flag lets the agent tell a worthwhile retry (transient) apart from a hopeless one (a malformed query that will fail identically every time). Without that distinction, uniform retry logic (A) burns time on exactly the calls retrying can never fix, and failing immediately on everything (D) throws away the retries that would have actually succeeded.

**Q32. Answer: C** *(D2)* — A catalog that's mostly static within a session and exists to be looked up, not acted on, is a textbook fit for an MCP resource — it can be read directly without spending a tool-use decision on every check. Caching into `CLAUDE.md` (B) still requires a file read each time it's needed and goes stale silently; a single combined tool (A) still costs a round trip per call.

**Q33. Answer: B** *(D2)* — When several reads are genuinely independent of each other, emitting them together as separate tool-use blocks in one response lets the client run them concurrently and return all results at once, rather than paying three sequential round trips for work that never depended on being sequential in the first place.

**Q34. Answer: B** *(D2)* — Treating every error identically wastes effort specifically on the validation failure, since retrying the same malformed input produces the same malformed result every time — only the transient failure has any real chance of resolving on retry. The fix isn't fewer or more retries across the board, it's recognizing which category is actually retryable.

**Q35. Answer: C** *(D2)* — Narrowing which tools are actually available for a given task phase reduces the live decision space itself, which is a more direct fix for misselection among 22 similar-looking tools than hoping ever-better descriptions alone will fully resolve it, or assuming a bigger context window (B) somehow improves the underlying selection judgment.

**Q36. Answer: D** *(D2)* — A hook that runs before the Bash tool executes and can validate the target path against `workspace_root` — blocking the call outright when it falls outside — is the only one of these options that can actually prevent an out-of-scope modification from happening. A post-hoc check (A) or a self-imposed pre-check the agent might skip (B) both allow the violation to occur first; a prompt instruction (C) is advisory, not enforced.

**Q37. Answer: B** *(D2)* — A `"permission"` error category signals an authorization problem — missing credentials or an insufficient scope — which retrying the identical call will never resolve. The right response is to escalate, obtain different credentials, or skip the operation, not to keep retrying as if the failure might eventually clear on its own.

**Q38. Answer: C** *(D1, D2)* — Structured findings (claim, file path, line range, source excerpt) preserve exactly the precision that free-form prose summaries lose — without them, a later step has to try to reconstruct file-level detail from a paragraph that was never designed to carry it. Manually reconstructing that detail after the fact (A) is error-prone and doesn't scale, and merging everything into one document (D) doesn't restore detail that was never captured in the first place.

**Q39. Answer: A** *(D2, D3)* — `disallowedTools` operates at the level of whole tools, not individual file paths within a tool's use — it can prevent `Edit` from being used at all, but it has no mechanism for saying "only allow edits to files matching this pattern." Enforcing a path-based restriction requires something that actually inspects the target path before the edit happens, such as a hook, not a tool-level allow/deny list.

**Q40. Answer: B** *(D1, D2)* — Delegating the modification phase to a subagent that receives the exploration phase's key findings explicitly, while restricting its own toolset to what modification actually needs, preserves the continuity a fully separate, context-blind agent (the alternative being ruled out here) would lose, while still tightening tool access for the riskier, higher-precision phase.

---

## Scenario 5: Claude Code for Continuous Integration

**Q41. Answer: B** *(D3)* — When two independent jobs can flag the same underlying issue, having the second job receive the first job's findings as input — with an explicit instruction to skip anything already flagged — removes the duplication at the source. Merging the jobs into one long-lived session (A) creates the same kind of context-carryover risk seen elsewhere in CI reviews, and a purely infrastructure-level dedup pass (C) is a heavier solution than simply passing the first job's output forward.

**Q42. Answer: B** *(D3)* — The generated tests fail in CI specifically because nothing available to the test-generation step describes the CI environment's actual fixture layout — the model has no way to know a developer-machine absolute path won't exist inside the container. Documenting the real fixture locations, helper utilities, and test-data structure in `CLAUDE.md` (or an equivalent always-loaded reference) gives every future invocation the information it's currently missing.

**Q43. Answer: B** *(D4)* — A prompt instruction to "only report changed lines" doesn't stop the model from generating a line number outside that range in the first place; validating each finding's `line_number` against the PR's actual diff bounds before posting is the deterministic check that actually filters out-of-range findings, rather than hoping instruction-following prevents them.

**Q44. Answer: B** *(D4)* — A second rule file scoped specifically to test files lets test-appropriate conventions apply on their own terms, instead of inheriting a production-oriented rule (like mandatory try/catch wrapping) that doesn't fit idiomatic test patterns such as asserting on a rejected promise. This is more maintainable than an informal prose exception bolted onto the production rule (A), and it doesn't require giving up path-scoped guidance altogether (C).

**Q45. Answer: B** *(D3)* — "Focus on behavior" alone hasn't resolved the ambiguity because "behavior" itself needs to be pinned down concretely; before/after examples contrasting an implementation-detail assertion with a behavior-driven one, documented as a standard, gives the model a concrete boundary to apply consistently — which a vague prose instruction, a smaller `max_tokens` budget, or a different model don't provide on their own.

**Q46. Answer: C** *(D3)* — The generation step already had the existing test file as context, but nothing told it those exact names were already taken; explicitly listing the existing test names and instructing the model to avoid reusing any of them gives it the specific information needed to prevent a silent, accidental name collision.

**Q47. Answer: A** *(D3, D4)* — Once a separate process reformats the PR's files before review reads them, any line numbers the review computes are aligned to the reformatted version, not to the diff reviewers are actually looking at. Reading from a snapshot taken before that reformatting step keeps the review's line numbers aligned with the PR diff itself, which is what the posted comments need to match.

**Q48. Answer: B** *(D4)* — Schema validation only confirms the JSON is well-formed and each value is a legal enum member — it has no way to check whether the chosen category actually matches the finding's own description. A deterministic post-generation check that cross-references category against description content catches exactly this class of semantically-wrong-but-syntactically-valid output, which more enum granularity or a different model wouldn't reliably fix.

**Q49. Answer: A, B** *(D3)* — Passing prior findings forward with an explicit "only new or still-unaddressed" instruction (A) and a separate deduplication step comparing new findings against what's already been posted (B) attack the same problem from two complementary angles — one shaping what the model generates, the other catching anything that still slips through. A single long-lived session persisting across every commit (C) reintroduces the same kind of context-carryover degradation seen when one session is reused across unrelated reviews, and merely labeling repeats (D) doesn't actually prevent the duplicate comment from being posted.

**Q50. Answer: B** *(D3, D4)* — The generated tests fail in CI because nothing in the invocation describes the team's actual test infrastructure; documenting conventions, fixtures, and helpers in `CLAUDE.md` (giving every invocation that context) combined with a concrete example of correct usage (showing, not just telling, what "correct" looks like) directly targets the missing information, rather than relying on developers to catch it after the fact or restricting generation to only the simplest possible cases.

---

## Scenario 6: Structured Data Extraction

**Q51. Answer: C** *(D4)* — Schema validity only confirms the JSON is well-formed, not that a claimed value actually exists in the source. A `vendor_source_location` field forces the extraction to ground its claim in a specific, checkable part of the document — a null value there signals the vendor genuinely wasn't found, making hallucination visible in a way a required-but-ungrounded string field never was.

**Q52. Answer: B** *(D4)* — Tool descriptions are the primary signal driving selection; when they're vague about scope and silent on documents that need both tools, the model has no reason to call more than one. Making the descriptions explicit about what each covers — and stating outright that a document with both prose and tables should trigger both — directly addresses the observed under-calling, ahead of merging the tools (A) or forcing a single named tool (C).

**Q53. Answer: B** *(D5)* — Processing all 40 invoices inside one shared conversation lets details from earlier documents bleed into later extractions as context accumulates — splitting the batch into independent, single-invoice calls removes the shared context that's causing the carryover entirely, rather than just narrowing it (as a scratchpad, C, would) or hoping more tokens or a lower temperature changes the underlying behavior.

**Q54. Answer: C** *(D4)* — Since whether `po_number` should even be expected depends entirely on the document actually being a purchase order, classifying the document type first and only then conditionally requiring `po_number` prevents the mismatch from ever reaching validation, instead of discovering it only after the full extraction already ran (A) or giving up the requirement across the board (B, D).

**Q55. Answer: C** *(D4)* — Generic before/after examples weren't enough because they didn't convey *why* one date should be preferred over the other; adding the explicit precedence reasoning to the examples, backed by a schema-level comment stating the same rule, gives the model a concrete, repeatable basis for the choice instead of leaving it to infer a pattern from examples alone.

**Q56. Answer: A** *(D2, D4)* — Both tools currently describe themselves with the same vague phrase ("important contract terms"), which is exactly what's letting one substitute for the other. Rewriting the descriptions to state precisely what each does and doesn't cover, with an example apiece, removes the ambiguity directly — well ahead of forcing both tools to always run (B) or merging them outright (C), which gives up the distinction the team wants to keep.

**Q57. Answer: A, B** *(D5)* — A second-pass check on high-confidence extractions (A) directly targets the blind spot that a confidence-only process structurally can't see; requiring an evidence/location reference per field (B) gives that check something concrete and structural to verify against, catching both an ungrounded value and a value assigned to the wrong field. Raising the threshold across the board (C) doesn't target these two specific failure types any more precisely, and relying on the model's own self-reported uncertainty (D) is exactly the confidence signal that's already been shown not to catch them.

**Q58. Answer: B** *(D4)* — With no latency SLA, a 6 PM submission could in the worst case take the full 24 hours, landing right around 6 PM the following day — well past the 9 AM downstream deadline. Treating "up to 24 hours" as if it were a guaranteed same-morning turnaround (A) or assuming it behaves like the current 2-hour synchronous process (C) both mistake an unbounded worst case for a reliable one.

**Q59. Answer: B** *(D4)* — An `"other"` enum value paired with a free-text detail field lets the schema stay structured and queryable for the common cases while still accommodating the genuine long tail of relationships that don't fit any predefined category — without either abandoning structure entirely (A) or requiring a brand-new tool every time a new edge case appears (C).

**Q60. Answer: B** *(D4)* — Logging the actual characteristics of the input alongside each extraction — scan quality, page count, roughly where in the document a field was found — is what makes it possible to correlate rejections with real causes (a long contract, a poor scan, a particular vendor's layout) instead of treating every rejection as an undifferentiated data point with nothing to explain it.

---

## Score yourself

Count your correct answers out of 60, and check per-scenario breakdowns against your weakest domain(s) — see the [scoring guide](exam-5-questions.md#scoring-guide) and go back to the relevant [domain page](../study-guide/) for anything you missed. This set draws on a different, larger source pool than Exam 4, so a gap between how you scored on the two is a useful signal about which specific mechanisms still need review — not just "the exam was harder or easier this time."
