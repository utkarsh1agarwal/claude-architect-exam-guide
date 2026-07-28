# Mock Exam 2 — Answer Key

Domain tags: **D1** Agentic Architecture · **D2** Tool Design & MCP · **D3** Claude Code Workflows · **D4** Prompt Engineering · **D5** Context & Reliability. A slash (e.g. `D1/D5`) marks an item that genuinely straddles two domains.

## Scenario 1: Customer Support Resolution Agent (Items 1-15)

**1. Answer: C** *(D5)* — An explicit request to escalate must be honored immediately, without further investigation, since customer-requested escalation overrides progress-based reasoning. Continuing to investigate because the return is "80% done" (D) ignores the customer's stated preference.

**2. Answer: D** *(D5)* — Multiple ambiguous matches should never be resolved by a heuristic guess like recency or dollar value; the safe move is asking for one more identifier to disambiguate. Picking heuristically risks acting on the wrong customer's order entirely.

**3. Answer: A** *(D1)* — Prompt instructions carry a non-zero, probabilistic failure rate, so removing the hook trades a deterministic $500 threshold guarantee for something the model can occasionally ignore. Neither MCP compliance nor prompt length is actually at issue here.

**4. Answer: D** *(D1)* — Decomposing into the two distinct concerns, investigating each with shared context, then synthesizing one reply mirrors the exam's decomposition pattern (like per-file-then-cross-file review). Deferring one concern to a separate ticket (C) needlessly fragments the interaction when the agent already has what it needs to handle both.

**5. Answer: C** *(D1)* — Since the human has no transcript access, the handoff must substitute for that missing context with customer details, root-cause analysis, and a recommended action. A bare customer ID or last message (A/D) forces the human to re-investigate from zero.

**6. Answer: A** *(D2)* — Description quality is always the lowest-effort, highest-leverage first fix for tool-selection confusion — before few-shot examples or structural changes. Merging the tools (C) would erase the very signal that lets the model discriminate between customer and order lookups.

**7. Answer: A** *(D5)* — A persistent case-facts block for the amount and order ID, carried outside the narrative summary, survives compression that plain-prose summarization won't. Disabling summarization outright (B) is a blunt fix that reintroduces the token-bloat problem it was solving.

**8. Answer: C** *(D5)* — Self-reported confidence scores are poorly calibrated, and models tend to be most confidently wrong on exactly the hardest cases — the opposite of what an auto-escalation gate needs. This is a calibration problem inherent to self-assessment, not a tooling or fine-tuning limitation (A, D).

**9. Answer: A, C** *(D2)* — Masking a timeout as a successful empty result (A) hides a real failure from the caller, and a bare "Operation failed" string (C) strips away the category and retryability info needed to react. B and D are the recommended structured practices (categorized retryable errors, useful diagnostic detail), not things to avoid.

**10. Answer: C** *(D2)* — Scoping each agent/role to the 4–6 tools it actually needs directly reduces the decision surface causing misselection. Forcing a single tool (A) or adding more few-shot coverage (B) doesn't address the root cause of too many overlapping options in one place.

**11. Answer: A** *(D1)* — A hard prerequisite gives a deterministic guarantee that refunds can never fire before identity is verified, whereas any prompt-based rule is only probabilistically followed. This is the exam's central "structural fix beats prompt fix" lesson, not an MCP or token-budget issue (B, D).

**12. Answer: B** *(D5)* — Silence in policy is treated the same as ambiguity: escalate rather than let the agent invent a resolution either way. Approving (D) or denying (C) both assume an answer the policy doesn't actually give.

**13. Answer: B** *(D1)* — A PostToolUse hook is the right place to normalize disparate tool output formats (Unix timestamps vs. ISO 8601) into one consistent representation before the model reasons over them. It doesn't block calls before execution (D) — that's a pre-call/interception hook's job.

**14. Answer: C** *(D5)* — Rising escalations without improved resolution, plus simple cases escalating just for sounding annoyed, is the signature of a signal that doesn't track actual complexity. Retuning the threshold (A) or adding more examples (B) would just move the same unreliable signal around rather than fix the mismatch.

**15. Answer: A** *(D5)* — A reiterated, explicit request for a human takes priority over the agent's belief that the issue is simple; explicit requests get honored immediately rather than re-litigated. Asking one more diagnostic question (D) directly contradicts the customer's stated preference.

## Scenario 2: Multi-Agent Research System (Items 16-30)

**16. Answer: D** *(D1)* — The coordinator can only invoke subagents through the Task tool, so it must appear in `allowedTools`; nothing about shared history, fork context, or plan mode is a real prerequisite for delegation.

**17. Answer: C** *(D1)* — When every subagent succeeds at its assigned slice but overall coverage is narrow, the defect lives upstream in what the coordinator chose to assign, not in how well any individual subagent executed its own task.

**18. Answer: C** *(D1)* — Subagents don't automatically inherit the coordinator's history, so findings must be explicitly written into the synthesis subagent's prompt; there's no automatic memory pool (A, D), and `fork_session` branches a session's own context rather than transferring another subagent's output (B).

**19. Answer: D** *(D1)* — Real concurrency requires the coordinator to emit both Task calls within one response so they execute in parallel; reusing a `tool_use_id` (A) is invalid, `fork_session` (B) duplicates a session rather than dispatching two subtasks, and `tool_choice: "any"` (C) only forces some tool call, not simultaneity.

**20. Answer: A** *(D5)* — Preserving both values with attribution keeps the reader informed of a genuine disagreement; averaging (B) invents a number neither source reported, and recency bias (C) or omission (D) both discard real information.

**21. Answer: B** *(D5)* — The source-to-claim mapping is exactly the provenance information synthesis must carry forward intact, not compress away in the name of brevity.

**22. Answer: D** *(D5/D2)* — Structured failure context (failure type, what was attempted, partial results, alternatives) lets the coordinator make an informed recovery decision; masking it as success (A), retrying forever (B), or going silent (C) all destroy that information.

**23. Answer: D** *(D5)* — Without publication or data-collection dates, synthesis has no way to distinguish a genuine change over time from a contradiction between two sources measuring the same thing at different times.

**24. Answer: D** *(D2)* — A narrowly scoped `verify_fact` tool handles the high-frequency simple case without ballooning the synthesis agent's tool surface (unlike C), while the rarer complex 15% still routes through the coordinator as before; batching (A) or speculative caching (B) don't fix the routing overhead itself.

**25. Answer: A** *(D1)* — All three subtasks are narrow slices of the same angle (vacancy/leasing), so no subagent was ever asked to look at retail or residential conversion — the gap originates in decomposition, not execution.

**26. Answer: D** *(D1)* — A thin section reflects missing evidence, not bad prose, so the fix is gathering more findings via targeted follow-up delegation and re-synthesizing; regenerating at a different temperature (B) can't manufacture counterarguments that were never collected.

**27. Answer: B** *(D1)* — Isolation is the default behavior; relevant context must be explicitly passed in, not automatically shared via memory (C) or matched via model identity (D).

**28. Answer: A** *(D5)* — Externalized per-agent state plus a coordinator-read manifest is what makes clean resume possible after an infrastructure crash; relying on model recall (B) or blind full restarts (C) can't actually recover prior progress.

**29. Answer: C** *(D2)* — Tools outside an agent's specialization invite misuse (a synthesis agent wandering into its own web searches), which is the real cost — "unused tools cost nothing" (B) ignores exactly this selection risk.

**30. Answer: A** *(D1/D5)* — Separate fields for claim, excerpt, source, and date keep content and provenance metadata independently addressable through further processing; a formatted string (C) or prose paragraph (B) bakes metadata into content where it's easily lost or mis-parsed.

## Scenario 3: Developer Productivity with Claude (Items 31-45)

**31. Answer: C** *(D2)* — Grep searches file contents for the function name, which is exactly what's needed to find every call site; Glob only matches file paths/names, not the code inside them.

**32. Answer: C** *(D2)* — Glob does file-path pattern matching, which is precisely suited to a glob pattern like `**/*.test.tsx`; Grep searches file contents, not paths.

**33. Answer: B** *(D2)* — When an anchor string isn't unique, Edit can't reliably target the right occurrence, so loading the full file with Read and rewriting it with Write sidesteps the ambiguity entirely; switching to sed loses the model's understanding of context and isn't the documented fallback.

**34. Answer: D** *(D2)* — Personal/experimental MCP servers belong in the user-scoped `~/.claude.json`, keeping them invisible to teammates; putting it in `.mcp.json` (even under a different key) would land in the shared, version-controlled team config.

**35. Answer: C** *(D2)* — Claude has a strong prior toward familiar built-ins like Grep, so an under-described MCP tool loses out by default; the fix is enhancing the description to make the capability advantage explicit, not disabling Grep or changing server scope.

**36. Answer: D** *(D3)* — `context: fork` runs the skill in an isolated sub-agent context so its verbose dependency-tracing output never pollutes the main conversation; `allowed-tools` restricts tool access, not output visibility.

**37. Answer: B** *(D3)* — `allowed-tools` directly restricts which tools a skill can invoke, letting it be scoped to file-write only; `context: fork` isolates context/output, not tool permissions.

**38. Answer: A** *(D3)* — The classic failure mode is conventions living in the senior engineer's personal `~/.claude/CLAUDE.md`, which never gets committed, so new hires cloning the repo never see them; this fits better than assuming the new hire simply skipped a file that was in fact correctly placed and shared.

**39. Answer: A** *(D3)* — `.claude/rules/*.md` with `paths` frontmatter applies conventions by glob pattern regardless of directory, exactly matching test files scattered across layers; per-directory CLAUDE.md files don't scale and don't follow files that move.

**40. Answer: A** *(D1/D3)* — This is the textbook adaptive-decomposition case: with unclear module boundaries, mapping structure and prioritizing as dependencies are discovered beats any fixed upfront checklist, which can't account for what hasn't been explored yet.

**41. Answer: C** *(D3)* — A clear stack trace pointing to one function is a well-understood, single-file fix, which is exactly when direct execution is appropriate; plan mode or parallel forking would be needless overhead for a task with no real ambiguity.

**42. Answer: B** *(D3)* — Inconsistent handling across attempts signals genuine ambiguity in the prose spec, and concrete input/output examples pin down the exact expected behavior; repeating the same instructions more emphatically doesn't resolve ambiguity, it just restates it.

**43. Answer: B** *(D3)* — The interview pattern — having Claude surface open design questions before implementing — is designed for exactly this kind of unfamiliar-domain uncertainty; test-driven iteration assumes you can already specify expected behavior, which is what's missing here.

**44. Answer: B** *(D3)* — Because the three findings interact, fixing one changes the correct fix for another, so they must be communicated together in one message; addressing them sequentially risks rework when an earlier "fix" is invalidated by a later one.

**45. Answer: B** *(D3)* — Dozens of files with multiple valid service-boundary designs is squarely plan mode's use case, and the Explore subagent isolates the noisy discovery phase so it doesn't burn the main session's context; skipping subagents (D) forfeits that context-isolation benefit for no real gain.

## Scenario 4: Structured Data Extraction (Items 46-60)

**46. Answer: C** *(D4)* — With no end date anywhere in many source contracts, forcing `contract_end_date` as required pressures the model to invent a plausible-looking date rather than admit absence; making it nullable/optional removes that pressure. D overstates the failure mode (validation wouldn't fail "every time" — it would silently succeed with fabricated data, which is the more dangerous outcome).

**47. Answer: A** *(D4)* — `tool_use` with a schema guarantees syntactic validity but not semantic correctness, so line items can still fail to sum correctly; adding a `calculated_total` field to diff against `stated_total` catches exactly this class of error downstream. D is the tempting-but-wrong take — the tool is working as designed, so abandoning it throws out a mechanism that's already solving the syntax problem.

**48. Answer: D** *(D4)* — `"any"` forces the model to call some tool (guaranteeing structured output) while still letting it pick which of the three schemas fits the incoming document. `"auto"` (the tempting alternative) would let the model bail out with plain text on an ambiguous document, defeating the stated goal of guaranteeing extraction.

**49. Answer: A** *(D4)* — Since the tax ID is confirmed absent from the source document, no retry can manufacture data that was never there; the correct move is to accept the gap and make the field optional going forward. D is the trap: it assumes missing-field errors are generically retry-fixable, but that's only true for structural/formatting mistakes, not genuine source-data absence.

**50. Answer: A** *(D4)* — An effective retry needs the original document, the prior failed output, and the specific validation error so the model has something concrete to correct against. A bare "try again" (D) or a fresh document with no error context (B, C) gives the model no signal about what actually went wrong.

**51. Answer: B** *(D4)* — Tagging findings with `detected_pattern` turns individual fixes into aggregate data, letting you spot which constructs or patterns developers repeatedly dismiss as false positives and target prompt fixes at them. It's a tracking/analytics field, not a routing or scoring mechanism, so A/C/D misattribute its purpose.

**52. Answer: D** *(D4)* — "Only report high-confidence findings" is already vague, and 40% false positives shows vague conservatism instructions don't work; the fix is explicit categorical criteria for what counts as a style issue, with temporary category suppression while iterating. C repeats the same failed pattern (more vague conservatism language) rather than fixing the underlying ambiguity.

**53. Answer: B** *(D4)* — Showing the reasoning behind choosing one tool over a plausible-but-wrong alternative teaches the model the underlying judgment, so it generalizes to new ambiguous cases rather than just memorizing the shown pairs. A overreaches — few-shot supplements good descriptions, it doesn't make them unnecessary.

**54. Answer: D** *(D4)* — The overnight report is latency-tolerant and fits batch's non-blocking, no-SLA processing window, but a pre-merge gate developers are actively waiting on needs real-time responsiveness batch can't guarantee. A's "real-time fallback" is tempting but adds complexity for a workflow that should never have been batched in the first place.

**55. Answer: B** *(D4)* — Batch failures should be triaged individually via `custom_id`, with the specific cause addressed (e.g., splitting an oversized document) before resubmitting just those items. C wastes cost/time reprocessing 198 documents that already succeeded, which defeats the point of batch's cost savings.

**56. Answer: D** *(D5)* — A 97% aggregate can mask a document type or field with much worse accuracy, so the honest answer requires breaking the metric down before making a review-reduction call. B is the near-miss — checking only the most common type still hides poor performance on rarer-but-consequential types/fields.

**57. Answer: B** *(D5)* — Since low-confidence outputs get reviewed by default, novel error patterns hiding in *high*-confidence outputs are only caught by proactively sampling them (stratified random sampling) for ongoing measurement. D is the failure mode this technique exists to prevent — skipping high-confidence review entirely is exactly how these errors go undetected.

**58. Answer: C** *(D5)* — Thresholds are only meaningful if calibrated against labeled validation data so a given confidence score actually corresponds to a known accuracy rate; otherwise the score is just an arbitrary number. A's fixed 80% cutoff is the tempting-but-ungrounded choice — with no calibration, 80% could mean anything from 60% to 99% real accuracy.

**59. Answer: B** *(D4)* — The session carries its own generation-time reasoning, so it's biased toward defending its prior work rather than genuinely scrutinizing it — fresh independent instances lack that baggage and catch subtle issues more reliably. A stronger self-critical prompt can't overcome context the model already holds, since the bias is structural, not a wording problem.

**60. Answer: B, D** *(D4)* — Per-file passes give each file focused attention for local issues, while a separate cross-file pass specifically targets data-flow/integration issues that span files — together avoiding the attention dilution of one monolithic pass. A is the exact anti-pattern being guarded against, and C substitutes brute-force repetition and majority voting for a structurally sound decomposition.

---

## Scoring Your Domain Breakdown

Count your correct answers per domain and compare against the exam's real weighting to see where to focus:

| Domain | Items in this mock | Your score (___/___) | Real exam weight |
|---|---|---|---|
| D1 – Agentic Architecture & Orchestration | ~14 | ___ | 27% |
| D2 – Tool Design & MCP Integration | ~11 | ___ | 18% |
| D3 – Claude Code Configuration & Workflows | ~10 | ___ | 20% |
| D4 – Prompt Engineering & Structured Output | ~14 | ___ | 20% |
| D5 – Context Management & Reliability | ~11 | ___ | 15% |

**Note:** several items straddle two domains (marked with a slash) since the exam blueprint itself notes Domain 5 threads through nearly every scenario as "connective tissue" rather than an isolated block.

## Score yourself

Count your correct answers out of 60, and check per-scenario breakdowns to see if a specific area needs more review — see the [scoring guide](exam-2-questions.md#scoring-guide) and go back to the relevant [domain page](../study-guide/) for anything you missed.
