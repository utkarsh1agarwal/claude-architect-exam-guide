# Mock Exam 3 — Answer Key

Domain tags: **D1** Agentic Architecture · **D2** Tool Design & MCP · **D3** Claude Code Workflows · **D4** Prompt Engineering · **D5** Context & Reliability.

## Scenario 1: Code Generation with Claude Code (Items 1-15)

**1. Answer: D** *(D3)* — Three inconsistent refactors from the same vague instruction is a definitional-ambiguity problem, not a randomness problem, so 2–3 concrete before/after examples pinning down what "cleaned up" means fixes the actual cause. Reducing `max_tokens` or repeating the request with more emphasis doesn't resolve what "clean" means for this codebase.

**2. Answer: D** *(D3)* — Asking Claude to surface traffic-pattern, failure-mode, and scoping questions before writing any code is the interview pattern, and it earns its keep specifically in unfamiliar domains where the developer hasn't already anticipated every design consideration. Prompt chaining (A) sequences already-known steps rather than surfacing unknown design questions.

**3. Answer: B** *(D3)* — With tests already covering behavior, edge cases, and performance up front, the recommended loop is to hand Claude the actual failures after each attempt so it can progressively converge. Showing tests once and then ignoring results (A), or withholding them until "done" (D), both break the feedback loop that makes test-driven iteration work.

**4. Answer: D** *(D3)* — Because fixing bug 1 changes the correct approach to bug 2, the issues interact, and interacting issues must be described together in one detailed message so Claude reasons about them jointly. Reporting them one at a time (A) risks Claude fixing bug 2 in a way bug 1's fix later invalidates, forcing rework.

**5. Answer: A** *(D3)* — A single-file bug fix with a clear stack trace is the well-understood, low-ambiguity case direct execution suits, while a cross-service redesign with multiple valid approaches and dozens of files benefits from planning before committing to changes. Treating plan mode as "always safer" (B) ignores the needless overhead it adds on trivial, unambiguous fixes.

**6. Answer: A** *(D3)* — A command every developer needs immediately after cloning must be version-controlled and project-scoped, which is exactly what `.claude/commands/deploy-check.md` provides. The personal `~/.claude/commands/` location (C) is never shared via git, so a fresh clone wouldn't have it.

**7. Answer: A** *(D3)* — `context: fork` runs the skill in an isolated sub-agent context, keeping the long exploratory brainstorm output out of the main conversation once a decision is made. `allowed-tools` (B) restricts which tools a skill can call, not where its output lands.

**8. Answer: B** *(D3)* — User-level and project-level CLAUDE.md files are designed to coexist and stack; the personal file at `~/.claude/CLAUDE.md` is never checked into version control, so it only affects that one engineer's own sessions. Claiming it "silently overwrites" the project file for everyone (D) misreads the hierarchy — personal preferences layer on top of, rather than replace, shared team conventions.

**9. Answer: D** *(D3)* — Because each convention is tied to a filename pattern rather than a single directory, three `.claude/rules/*.md` files with `paths` frontmatter load automatically based on which file is being edited, regardless of location. Duplicating directory-level CLAUDE.md files into every test directory (B) doesn't scale and invites drift.

**10. Answer: C** *(D1)* — `fork_session` is built for exactly this: branching two parallel explorations from a shared baseline so the initial investigation isn't redone. Using `--resume` with two independently created session names (A) doesn't share a common starting point the way a fork does.

**11. Answer: C** *(D1)* — Resuming a session doesn't make Claude aware that files changed since last time; the fix is explicitly telling it which files changed so it can do targeted re-analysis. Switching to `fork_session` (A) solves a different problem (parallel branching), not stale context in a resumed session.

**12. Answer: D** *(D3)* — `allowed-tools` frontmatter directly restricts which tools a skill can invoke, so scoping it away from shell/`Bash` access structurally prevents destructive commands. `context: fork` (C) isolates output/context, it doesn't restrict tool access.

**13. Answer: A** *(D2)* — Wrapper re-exports mean the function may be called under several different names, so all of them must be enumerated before `Grep` can find every call site; grepping only the original name would miss usages through renamed re-exports. Reading every file upfront (B) is the anti-pattern the built-in exploration pattern warns against — start with targeted search, not full reads.

**14. Answer: C** *(D5)* — Vague "typical patterns" answers after 90 minutes of exploration signal context degradation, not a capacity problem, so a scratchpad file persisting specific findings (the classes actually examined) directly counters it. Increasing `max_tokens` (A) doesn't address the model losing track of specifics it already found.

**15. Answer: C** *(D5)* — The Explore subagent isolates verbose file-by-file discovery output during structure-mapping tasks, so the main session's context isn't exhausted by exploration noise. `fork_session` (A) is for branching parallel investigations from a shared point, not for keeping exploration noise out of the main session in the first place.

## Scenario 2: Claude Code for Continuous Integration (Items 16-30)

**16. Answer: B** *(D3)* — `claude -p "..."` runs non-interactively, which is exactly what prevents a CI job from blocking while waiting on a stdin prompt. A (piping `/dev/null`) is a hacky workaround at best, and C/D reference an env var and flag that don't actually exist — classic plausible-but-fictional distractors.

**17. Answer: D** *(D3)* — `--output-format json` combined with `--json-schema` forces genuinely schema-compliant, machine-parseable findings a script can split into individual inline comments. `-p` alone (B) only makes the run non-interactive; it says nothing about the shape of the output.

**18. Answer: C** *(D3)* — Feeding prior review findings (including ones already dismissed as "won't fix") into context and instructing Claude to report only new/unaddressed issues fixes the actual root cause: each re-run currently has no memory of what was already flagged. Disabling review (A) or shrugging off duplicates as unavoidable (B) discard the tool's value instead of fixing the re-run design.

**19. Answer: C** *(D3)* — Providing the existing test files in context directly closes the information gap causing redundant suggestions — the model simply can't avoid duplicating coverage it can't see. Running generation twice and manually deduping (B) treats the symptom while doubling cost.

**20. Answer: B** *(D3/D4)* — The session retains its own generation reasoning and is structurally less inclined to challenge decisions it just made, so an independent review instance is the fix — not a config flag (C) or more few-shot examples (D). This exact pattern shows up in both the CI/CD-workflow material and the multi-instance-review material, so it genuinely straddles both domains rather than being a clean D3-vs-D4 call.

**21. Answer: B** *(D3)* — Documenting testing standards, what makes a test valuable, and available fixtures/conventions in `CLAUDE.md` gives the model the missing project-specific judgment it needs to generate high-value tests instead of boilerplate. Dumping every function (C) or citing CI infra details (A) doesn't address *what makes a test worth writing*.

**22. Answer: D** *(D3)* — Splitting into focused per-file passes for local issues plus a separate cross-file integration pass directly fixes the attention-dilution problem causing contradictory findings across a 14-file review. A bigger model in a single pass (A) or brute-force majority voting across three full-PR passes (B) don't address the structural cause; offloading the split to developers (C) isn't a tooling fix at all.

**23. Answer: A** *(D4)* — An unattended overnight job with no one waiting on results is exactly the non-blocking, latency-tolerant case the Message Batches API is built for, at roughly 50% lower cost. B is wrong since multi-turn tool calling isn't needed for a review job like this, and C/D impose constraints (SLA guarantee, staying synchronous) that don't apply to an unattended nightly run.

**24. Answer: D** *(D4)* — A 40%-false-positive category is actively eroding trust in categories that are accurate, so defining explicit criteria for that category (and considering temporarily disabling it while iterating) protects overall trust in the tool. Vague reinforcement like "be more careful" (C) doesn't fix ill-defined criteria, and permanently killing all categories (A) overcorrects.

**25. Answer: D** *(D4)* — Replacing "flag anything that seems off" with specific, categorical criteria (e.g., claimed vs. actual behavior contradiction) removes the ambiguity that vague instructions can't resolve. "Only flag things you're very confident about" (B) is exactly the kind of vague reinforcement that's been shown not to reduce false positives.

**26. Answer: D** *(D1)* — Three fixed, ordered, well-understood steps where each output feeds the next is the textbook definition of prompt chaining, not open-ended/adaptive decomposition (C), which is for investigations where next steps depend on unknown findings.

**27. Answer: C** *(D3)* — `-p` / `--print` is specifically the non-interactive mode flag that prevents hanging on stdin in a CI context; the other options control output formatting or session continuity, not interactivity.

**28. Answer: B** *(D4)* — Batch requests correlate to responses via `custom_id`, so failures can be precisely identified and only those resubmitted with an adjustment for the specific cause. Discarding failures (A) or resubmitting the full 500-file batch (D) wastes cost and ignores the correlation mechanism the API provides for exactly this situation.

**29. Answer: A** *(D4)* — Since the Batches API offers no latency SLA within its up-to-24-hour window, submitting on a cadence (e.g., every 4-6 hours) bounds worst-case wait-before-submission plus processing time comfortably under the 30-hour deadline. Submitting immediately "and hoping" (C) or batching only once daily regardless of volume (D) either lacks a deliberate buffer or risks a PR opened right after the daily cutoff blowing the SLA.

**30. Answer: A, C** *(D4)* — The Batches API gives ~50% cost savings (A) and processes within an up-to-24-hour window with no guaranteed latency SLA (C). B is wrong because correlation uses `custom_id`, not session names/`--resume`, and D is wrong because multi-turn tool calling mid-request isn't supported in a single batch call.

## Scenario 3: Customer Support Resolution Agent (Items 31-45)

**31. Answer: C** *(D1)* — This mirrors the classic verify-before-refund anti-pattern: a probabilistic fix (better wording, few-shot examples) still leaves a non-zero failure rate on a task with account-modification consequences, so only a structural prerequisite hook can guarantee `get_customer` runs first. D sounds intuitive but "mandatory" language is exactly the kind of prompt-only fix that produced the 15% failure rate in the first place.

**32. Answer: A** *(D2)* — Tool description quality is the primary, lowest-effort lever for tool-selection accuracy and should always be tried before few-shot examples, routing layers, or restructuring. Merging (C) or forcing a single tool (D) are overcorrections that break legitimate use cases for the other tool.

**33. Answer: B** *(D1)* — Normalizing heterogeneous timestamp/date formats via a `PostToolUse` hook is precisely a data-format consistency fix so the model reasons over clean, comparable values instead of misinterpreting formats; it isn't about which tool to call (A) or escalation (D).

**34. Answer: B** *(D1)* — A pre-call hook that blocks and redirects above a dollar threshold provides deterministic enforcement independent of model behavior, whereas the system prompt alone (D) or a confidence-score threshold (C) only reduce, not eliminate, the failure rate on a rule with real financial consequences.

**35. Answer: D** *(D1)* — Multi-issue requests need decomposition into distinct items, investigation of each with shared context, then a single synthesized resolution — mirroring the per-item-then-synthesis pattern used elsewhere in task decomposition. Silently dropping or randomly prioritizing one issue (B) or offloading the problem to the customer (A) both abandon the second issue instead of resolving it.

**36. Answer: C** *(D5)* — Multiple ambiguous matches call for requesting an additional identifier rather than guessing; picking the "most recent" (D) or first result (B) risks acting on the wrong account/order, which is exactly the kind of identity/data risk this domain flags as needing disambiguation, not heuristics.

**37. Answer: D** *(D1)* — Since the human has no transcript access, the handoff must substitute for that missing context: customer details, root cause, and a recommended action. A raw, unformatted transcript (C) reintroduces the token-bloat problem instead of giving the human an actionable summary.

**38. Answer: D** *(D2)* — Scoping the agent to the 4–6 tools relevant to its actual role directly addresses selection-accuracy degradation caused by tool-list bloat; adding more few-shot examples (A) doesn't fix the root over-provisioning problem and doesn't scale to every combination of 18 tools.

**39. Answer: B** *(D2)* — A backend timeout is an access failure, not a valid empty result, so it must be reported with `isError: true`, a `transient` category, retryability, and context on what was attempted — conflating it with an empty-but-successful result (C) hides a recoverable failure from the coordinator.

**40. Answer: D** *(D5)* — The described failure (escalating easy cases, autonomously resolving cases needing policy exceptions) is a criteria-calibration problem, best fixed with explicit escalate-vs-resolve criteria and few-shot examples; confidence scores (B) and sentiment (C) are both known-unreliable proxies for actual case complexity.

**41. Answer: C** *(D5)* — A persistent case-facts block for hard data (amounts, order IDs, dates) that rides outside the summarized narrative directly prevents progressive summarization from dropping numbers the agent needs later. Disabling summarization entirely (B) or expanding the context window (A) don't address the actual mechanism of loss.

**42. Answer: C** *(D5)* — An explicit, calm request for a human should be honored immediately without first attempting resolution, per the escalation-trigger rule that explicit requests bypass investigation regardless of how simple the issue looks. Option A's "try to resolve first" directly violates that honor-the-explicit-request principle.

**43. Answer: B** *(D5)* — Self-reported confidence is a poorly calibrated signal — models can be confidently wrong precisely on the hardest, most nuanced cases — which is why it's listed as an unreliable escalation trigger. The other options (batches API, `context: fork`, compute cost) are irrelevant technical distractors.

**44. Answer: D** *(D5)* — A policy that is silent on the specific scenario (lost-in-transit) is a genuine policy gap, and the correct trigger for silence/ambiguity is escalation — not extending policy by analogy (A) or unilaterally denying/approving (B, C) a case the policy never addressed.

**45. Answer: A, B** *(D5)* — An explicit request for a human should always be honored, and policy silence/ambiguity is a genuine reason to escalate rather than guess. Self-reported confidence (C) and sentiment keywords (D) are both poorly-calibrated proxies for actual case complexity.

## Scenario 4: Structured Data Extraction (Items 46-60)

**46. Answer: B** *(D4)* — The invoice genuinely never had a PO number, so no amount of retrying manufactures data that isn't in the source; the fix is upstream, making the field nullable. Increasing `max_tokens` (A) or retrying the same prompt (C) can't invent missing information, and a stricter type constraint (D) doesn't address absence.

**47. Answer: B** *(D4)* — A structural error like a flattened array is retry-fixable, but only if the follow-up gives new information to correct against: the original document, the failed output, and the specific validation error. Repeating "format correctly" (D) or an unrelated example (C) provides no diagnostic signal, and assuming schema-enforced tools can never produce structural errors (A) is false.

**48. Answer: B** *(D4)* — `tool_use` with a schema guarantees the output parses and matches the schema's structure (syntactic validity) but cannot verify that values are semantically correct, e.g., a total that doesn't sum or a value in the wrong field. D overclaims that semantic correctness is also guaranteed, which is exactly the gap a `calculated_total` vs. `stated_total` check exists to catch.

**49. Answer: D** *(D4)* — Pairing an `"other"` enum value with a free-text `category_detail` field lets the schema absorb novel categories without breaking validation while still capturing detail. A closed enum (C) breaks on any new category, dropping the enum (B) sacrifices validation entirely, and per-category booleans (A) can't scale to unanticipated categories.

**50. Answer: C** *(D4)* — Tagging findings with the specific pattern that triggered them turns one-off fixes into an aggregate signal for spotting recurring false-positive causes. It's unrelated to `tool_choice` (A), isn't a confidence score (B), and doesn't indicate retryability (D).

**51. Answer: A** *(D4)* — Showing a few examples across genuinely different document structures teaches the underlying judgment (how to locate methodology or citations regardless of layout), letting the model generalize to formats not explicitly shown. Few-shot examples don't guarantee zero omissions (B), don't replace schema enforcement (C), and typically add tokens rather than reduce them (D).

**52. Answer: C** *(D4)* — At 5,000-document scale with batch turnaround up to 24 hours and no latency SLA, discovering a prompt flaw only after the full run is enormously costly, so refining against a smaller sample first maximizes first-pass success. Submitting everything immediately (B) or skipping validation (D) both forfeit the cheap chance to catch systematic errors early, and abandoning batch (A) throws away the reason for using it.

**53. Answer: B** *(D5)* — A 96% aggregate can hide a document type or field performing far worse, so only a by-type, by-field breakdown reveals whether review can safely be reduced broadly or only for specific segments. Document length (A) and whether a schema flag was used (C) don't address the masking risk, and accepting the aggregate at face value (D) is the exact mistake stratified analysis prevents.

**54. Answer: A** *(D5)* — A threshold is only meaningful if tied to what confidence level actually predicts correctness, which requires calibration against labeled ground truth. Sizing it to schema field count (B), team headcount (C), or an arbitrary round number (D) fits the threshold to convenience rather than actual error risk.

**55. Answer: A** *(D5)* — Attaching a publication or data-collection date to each extracted value lets downstream synthesis recognize a legitimate change over time rather than flag a contradiction. `isRetryable` (B), `tool_choice` (C), and `errorCategory` (D) are extraction-mechanics fields that say nothing about when the underlying fact was true.

**56. Answer: A** *(D4)* — Retrying only helps when there's new information or clearer instruction to converge on; if the value was never in the source document, no retry can invent it. Swapped fields (B), flattened arrays (D), and structural/format mismatches (C) are exactly the error class a specific validation error message can fix.

**57. Answer: A** *(D4)* — Requiring both the stated and a model-computed total creates a downstream check schema validation alone can't perform: if the two disagree, something is semantically wrong even in well-formed JSON. It isn't redundancy for its own sake (B), unrelated to `tool_choice` (C), and doesn't reduce required fields elsewhere (D).

**58. Answer: B** *(D5)* — Financial figures, narrative, and specs carry different information shapes, and collapsing them into one uniform format throws away structure that's cheap to preserve and useful downstream. Dropping non-financial content (A) discards real information, and forcing everything into plain paragraphs (C) or an undifferentiated JSON blob (D) both erase distinctions the source document actually has.

**59. Answer: A** *(D4)* — `"auto"` explicitly permits the model to answer with plain text instead of calling any tool, which is the one outcome this pipeline must prevent; `"any"` and a forced tool name both guarantee a tool call happens. B is a distractor implying conditionality where none exists — either "any" or a forced name alone already satisfies the guarantee.

**60. Answer: A, C** *(D4)* — Making fields nullable removes the pressure to invent a value just to satisfy a "required" constraint, and few-shot examples of correct null/absent-field handling model the desired behavior directly. Making every field required (B) increases fabrication pressure since the model must supply something, and a larger `max_tokens` budget (D) doesn't touch the underlying incentive to fabricate.

---

## Scoring Your Domain Breakdown

| Domain | Items in this mock | Your score (___/___) | Real exam weight |
|---|---|---|---|
| D1 – Agentic Architecture & Orchestration | ~9 | ___ | 27% |
| D2 – Tool Design & MCP Integration | ~4 | ___ | 18% |
| D3 – Claude Code Configuration & Workflows | ~18 | ___ | 20% |
| D4 – Prompt Engineering & Structured Output | ~19 | ___ | 20% |
| D5 – Context Management & Reliability | ~10 | ___ | 15% |

**Why this mock leans D3/D4:** its scenario draw (Code Generation, CI/CD, Structured Extraction) is naturally D3/D4-heavy — this mirrors how the real exam's random 4-of-6 draw can shift your effective domain mix from attempt to attempt. Run **both mocks** and add your per-domain totals together for a more balanced read on where you actually stand; Exam 2 leaned D1/D5, so the combined 120-item total should approximate the real 27/18/20/20/15 split closely.

## Score yourself

Count your correct answers out of 60, and check per-scenario breakdowns against your weakest domain(s) — see the [scoring guide](exam-3-questions.md#scoring-guide) and go back to the relevant [domain page](../study-guide/) for anything you missed.

---

## Two things worth adding to your prep guide before exam day

Based on this pair of mocks, make sure your prep guide has explicit answers ready for these two patterns — they came up repeatedly above and are currently thin or missing in your notes:

1. **Iterative refinement (3.5):** input/output examples > repeated prose; test-driven iteration (share failures, not just tests); the "interview pattern" for unfamiliar domains; single message for *interacting* issues vs. sequential for *independent* ones.
2. **Validation-retry loops (4.4):** always include the original doc + failed output + specific error in the retry prompt; know the difference between a fixable structural error (retry helps) and genuinely absent source information (retry won't help, field should be nullable); `detected_pattern` fields for tracking dismissal patterns over time.
