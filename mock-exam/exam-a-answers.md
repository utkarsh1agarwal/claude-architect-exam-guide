# Mock Exam A — Answer Key

Domain tags: **D1** Agentic Architecture · **D2** Tool Design & MCP · **D3** Claude Code Workflows · **D4** Prompt Engineering · **D5** Context & Reliability

## Scenario 1: Customer Support Resolution Agent

**Q1. Answer: B** *(D1)* — Deterministic ordering guarantees for high-stakes operations (money, identity) need programmatic enforcement, not stronger prompt wording. This is the exam's single most-repeated lesson.

**Q2. Answer: B** *(D2)* — Tool description quality is the primary, lowest-effort lever for fixing tool-selection confusion. Always fix descriptions before reaching for few-shot examples or architectural changes.

**Q3. Answer: C** *(D5)* — Multiple ambiguous matches should never be resolved heuristically; ask for another identifier to disambiguate safely.

**Q4. Answer: B** *(D5)* — An explicit request for a human should be honored immediately, not investigated around. Offering to resolve first is correct only when the customer *hasn't* explicitly demanded escalation.

**Q5. Answer: B** *(D1)* — A structured handoff (customer details, root cause, recommended action) lets a human act without re-investigating from zero; a sentiment score or bare transcript don't solve that gap.

**Q6. Answer: B** *(D1)* — A pre-call tool-interception hook gives a deterministic guarantee. Prompt clauses and few-shot examples are probabilistic and can fail.

**Q7. Answer: A** *(D1)* — A `PostToolUse` hook normalizes heterogeneous data formats before the model reasons over them — a hook problem, not a prompting problem.

**Q8. Answer: B** *(D1)* — Multi-concern requests should be decomposed into distinct items, investigated with shared context, then synthesized into one unified response.

**Q9. Answer: B** *(D5)* — Self-reported model confidence is a poorly calibrated proxy for actual case complexity; it fails precisely on the hardest cases, which is what's happening here.

**Q10. Answer: B** *(D2)* — Generic error responses hide information the agent needs to react correctly. Structured fields (`errorCategory`, `isRetryable`) let it distinguish retryable, validation, and business-rule failures.

## Scenario 2: Code Generation with Claude Code

**Q11. Answer: B** *(D3)* — User-level `CLAUDE.md` files are personal and not shared via version control. Team-wide conventions belong in a project-level file.

**Q12. Answer: B** *(D3)* — Glob-scoped `.claude/rules/` apply based on file path pattern, independent of directory — exactly the "convention tied to file type, not location" problem.

**Q13. Answer: C** *(D3)* — `context: fork` runs a skill in an isolated sub-agent context so verbose output doesn't pollute the main conversation.

**Q14. Answer: B** *(D3)* — Multi-file architectural decisions with several valid approaches are exactly plan mode's use case — explore and design before committing.

**Q15. Answer: B** *(D3)* — Inconsistent interpretation of a prose instruction is fixed with concrete before/after examples, not stronger wording.

**Q16. Answer: B** *(D3)* — Interacting issues need to be described together in one message; sequencing them risks contradictory or wasted fixes.

**Q17. Answer: B** *(D3)* — The interview pattern surfaces design considerations before implementation — well-suited to unfamiliar domains where not every consideration has been anticipated.

**Q18. Answer: A** *(D3)* — Project-scoped commands in `.claude/commands/` are version-controlled and shared with everyone who clones the repo.

**Q19. Answer: B** *(D3)* — Test-driven iteration works by sharing actual test *failures* after each attempt, not just the original test suite once.

**Q20. Answer: B** *(D3)* — `.claude/rules/` with glob `paths` scales to conventions that might extend across directories; a subdirectory `CLAUDE.md` is bound to one location.

## Scenario 3: Multi-Agent Research System

**Q21. Answer: B** *(D1)* — Every subagent executed correctly; the narrow coverage comes from how the coordinator decomposed the topic in the first place.

**Q22. Answer: C** *(D1)* — Subagents do not automatically inherit context; it must be explicitly included in their invocation prompt.

**Q23. Answer: B** *(D1)* — Emitting multiple Task tool calls in a single coordinator response runs subagents concurrently rather than sequentially.

**Q24. Answer: B** *(D2, D5)* — Structured error context (failure type, attempted action, partial results, alternatives) lets the coordinator make an informed recovery decision. Silently succeeding (A) or vague strings (C) hide information; runaway retries (D) risk resource exhaustion without reporting.

**Q25. Answer: B** *(D2)* — Giving the synthesis agent one scoped tool for the common, simple case follows least-privilege while avoiding unnecessary coordinator round-trips; the rare complex case still routes through the coordinator.

**Q26. Answer: C** *(D5)* — Conflicting credible sources should be preserved with attribution and flagged, never silently reconciled by picking or averaging one value.

**Q27. Answer: B** *(D5)* — Structured claim-source mappings preserve provenance through synthesis; unstructured prose loses which claim came from which source.

**Q28. Answer: B** *(D1)* — The `Task` tool must be in `allowedTools` for a coordinator to spawn subagents at all.

**Q29. Answer: B** *(D5)* — Structured state exports plus a coordinator-loaded manifest on resume is the recommended crash-recovery pattern.

**Q30. Answer: A** *(D5)* — Publication/collection dates let genuine change over time be distinguished from an apparent contradiction between sources.

## Scenario 4: Developer Productivity with Claude

**Q31. Answer: B** *(D2)* — `Glob` matches file paths/names by pattern.

**Q32. Answer: A** *(D2)* — `Grep` searches file *contents*, which is what's needed to find function callers.

**Q33. Answer: B** *(D2)* — A thin MCP tool description loses to a familiar built-in by default; enhancing the description (not removing the built-in) is the fix.

**Q34. Answer: B** *(D2)* — When `Edit`'s anchor text isn't unique, `Read` + `Write` is the reliable fallback for a full-file rewrite.

**Q35. Answer: B** *(D2)* — Project-scoped `.mcp.json` with environment-variable expansion keeps credentials out of version control while remaining shared team config.

**Q36. Answer: B** *(D2)* — `~/.claude.json` is the user-scoped location for personal/experimental servers.

**Q37. Answer: B** *(D5)* — A scratchpad file persisting key findings counters context degradation in long exploration sessions.

**Q38. Answer: B** *(D2)* — Starting with `Grep` for entry points, then `Read` to follow imports, builds understanding incrementally without reading everything upfront.

**Q39. Answer: B** *(D2)* — Splitting an overly generic tool into purpose-specific tools is the next rung on the fix ladder once description improvements alone haven't fully resolved confusion.

**Q40. Answer: B** *(D2)* — Too many available tools increases selection complexity and misuse; scoping tools per task/role is the fix, not a bigger context window or removing a single tool.

## Scenario 5: Claude Code for Continuous Integration

**Q41. Answer: A** *(D3)* — `-p` / `--print` runs Claude Code non-interactively, which is required in automated pipelines. (B and D describe flags/variables that don't exist — a common distractor pattern.)

**Q42. Answer: B** *(D3)* — `--output-format json` with `--json-schema` produces machine-parseable structured findings suitable for automated PR comments.

**Q43. Answer: B** *(D3)* — A session that generated code retains its own reasoning and is less likely to challenge its own decisions; an independent instance reviews more effectively.

**Q44. Answer: B** *(D4)* — Vague instructions like "be conservative" don't meaningfully reduce false positives; explicit categorical criteria do, and temporarily disabling a high-false-positive category protects trust while iterating.

**Q45. Answer: B** *(D3)* — Including prior findings and instructing the model to report only new/unaddressed issues avoids duplicate PR comments across re-runs.

**Q46. Answer: B** *(D1, D4)* — Splitting into per-file passes plus a separate cross-file integration pass avoids the attention dilution causing inconsistent, contradictory findings.

**Q47. Answer: B** *(D4)* — The Batch API's lack of a latency SLA makes it unsuitable for blocking workflows; it's appropriate only for the latency-tolerant overnight report.

**Q48. Answer: B** *(D3)* — Providing existing test files in context and documenting standards/fixtures in `CLAUDE.md` reduces duplicate, low-value test generation.

**Q49. Answer: B** *(D3, D4)* — Enforced structured output via CLI flags is far more reliable than asking nicely in a prompt or parsing free text with regex.

**Q50. Answer: B** *(D3)* — Documenting standards in `CLAUDE.md` makes them available to every Claude Code invocation, including CI, instead of living only in one person's head.

## Scenario 6: Structured Data Extraction

**Q51. Answer: B** *(D4)* — `tool_use` with a schema eliminates syntax errors but not semantic ones; comparing a calculated total against the stated total catches this class of mismatch.

**Q52. Answer: B** *(D4)* — `tool_choice: "any"` guarantees a tool call happens while still letting the model choose which of several schemas fits.

**Q53. Answer: B** *(D4)* — When information is genuinely absent from the source, no amount of retrying will produce it; the field should be nullable instead of required.

**Q54. Answer: B** *(D4)* — This is a structural, retry-fixable error — the retry needs the specific validation error to correct against.

**Q55. Answer: A** *(D2, D4)* — Once description improvements are exhausted, few-shot examples with reasoning are the next lever for genuinely ambiguous residual cases.

**Q56. Answer: B** *(D5)* — Aggregate accuracy can mask segment-level failure; validating by document type and field is required before reducing review.

**Q57. Answer: A** *(D5)* — Stratified random sampling of high-confidence extractions is specifically designed to catch novel error patterns that a confidence-based review process would otherwise never see.

**Q58. Answer: B** *(D4)* — The Batch API's lack of a latency SLA (up to 24 hours) makes it unsuitable for any blocking, pre-merge/pre-approval workflow.

**Q59. Answer: B** *(D4)* — An `enum` plus `"other"` and a detail string handles extensibility without over-fitting to a fixed list or silently misclassifying novel cases.

**Q60. Answer: B** *(D4)* — A `detected_pattern` field enables systematic, aggregate analysis of which patterns trigger errors or get dismissed as false positives over time.

---

## Score yourself

Count your correct answers out of 60, and check per-scenario breakdowns to see if a specific area needs more review — see the [scoring guide](exam-a-questions.md#scoring-guide) and go back to the relevant [domain page](../study-guide/) for anything you missed.

