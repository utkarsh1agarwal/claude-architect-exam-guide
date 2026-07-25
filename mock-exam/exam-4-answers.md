# Mock Exam 4 — Answer Key (Hard Mode)

Domain tags: **D1** Agentic Architecture · **D2** Tool Design & MCP · **D3** Claude Code Workflows · **D4** Prompt Engineering · **D5** Context & Reliability

## Scenario 1: Customer Support Resolution Agent

**Q1. Answer: B** *(D1)* — The hook enforcement is doing its job; the defect is upstream. The agent escalates *before* attempting `process_refund` because it doesn't understand the tool can handle refunds up to $750 — that's a description problem, not a hook problem. Lowering the threshold (A) doesn't touch the premature-escalation behavior, and PostToolUse (C) would let the over-threshold refund attempt happen before blocking it, which is worse, not better.

**Q2. Answer: B** *(D2)* — A flat `isError: true` with no category tells the agent nothing about whether to retry, escalate, or move on. `errorCategory` and `isRetryable` let it distinguish a retry-safe timeout from a permission failure that needs escalation instead. Better descriptions (A) fix tool *selection*, not recovery after a call has already failed.

**Q3. Answer: B** *(D5)* — Ambiguous multi-match lookups should never be resolved by a heuristic like recency; ask for another identifier (email, phone, order number) to disambiguate safely. Guessing based on recent activity (A) is exactly the anti-pattern that caused the wrong-customer refund here.

**Q4. Answer: B** *(D1)* — The failure isn't that the agent worked on the wrong concern first — it's that it fully executed one concern (issuing a refund) before checking prerequisites relevant to the other. Eligibility and prerequisite checks across all concerns should happen before any high-stakes action is taken, precisely because refunds are hard to unwind once issued.

**Q5. Answer: C** *(D2)* — Restricting when `escalate_to_human` can be called — only after `get_customer` and `lookup_order` have already returned something substantive — directly targets premature escalation without removing tools the agent still needs for legitimate investigation. Stripping investigative tools (B) would make *every* case harder to resolve, not just the over-escalated ones.

**Q6. Answer: B** *(D5)* — A persistent case-facts block (amount, order ID, dates) carried alongside the narrative prevents exactly this kind of detail loss during summarization. Keeping the full raw history forever (A) avoids the problem but doesn't scale, and neither context-window size nor temperature (C, D) address progressive detail loss from summarization itself.

**Q7. Answer: B** *(D1)* — Only a `PreToolUse` hook can block `process_refund` *before* it executes, which is what "guarantee" requires here. A `PostToolUse` hook (A, C) fires after the refund has already gone through, and a prompt instruction (D) is followed probabilistically, not deterministically — exactly the gap the team wants closed.

**Q8. Answer: A, D** *(D2)* — Both are description-quality fixes: A renames the tools and adds explicit non-use cases, D adds input formats, example queries, and explicit boundaries. These are the first rung on the fix ladder. Few-shot examples (B) are the *next* rung, reached only once description quality is exhausted; merging the tools (C) throws away a legitimate distinction the team still needs.

**Q9. Answer: B** *(D1)* — Turn count doesn't track complexity — the same routine workflow can span very different numbers of turns depending on the customer's communication style. Escalation should be triggered by an actual unresolved ambiguity or policy gap, not by how long the conversation happened to run.

**Q10. Answer: B** *(D1)* — The handoff records *what the agent recommended* but never states *whether the agent itself took any action*. Without an explicit field for "attempted actions" (and confirmation that no refund was actually executed), a human reviewer has no way to know the recommendation still requires their own action to complete — which is exactly the gap that led to the refund never happening.

---

## Scenario 2: Code Generation with Claude Code

**Q11. Answer: A** *(D3)* — Path-scoped `.claude/rules/` files are evaluated against the working file set at session initialization; they don't dynamically re-scan for files created mid-session. The glob pattern itself is correct (ruling out B), git commit status doesn't gate rule loading (C), and `/memory` shows what's currently loaded rather than forcing a live re-scan (D).

**Q12. Answer: A** *(D3)* — `allowed-tools` in `SKILL.md` frontmatter constrains which *built-in* tools a skill may call; it has no effect on MCP tool access, which the skill inherits from the parent session's existing MCP configuration regardless of the frontmatter list. There is no separate `allowed-servers` field (B), and `tool_choice` isn't a skill-frontmatter concept (C).

**Q13. Answer: B** *(D3)* — A command hook only blocks a tool call if its script exits non-zero; printing a detection message to logs has no effect on the tool-use decision itself. The matcher syntax is fine as written (A), `PostToolUse` (C) would run after the Bash command has already executed, and `"approval"` isn't a valid hook type (D).

**Q14. Answer: B** *(D3)* — Plan mode earns its overhead on multi-file work with several genuinely valid approaches; a single-file, already-decided, five-to-ten-line change gets nothing extra from a planning pass and only adds latency. Feature-vs-bugfix (D) isn't the relevant distinction — task complexity and decision-ambiguity are.

**Q15. Answer: B** *(D3)* — When the same category of transformation produces inconsistent results despite clear prose instructions, concrete before/after examples that pin down the exact boundary (which terms to simplify, what must survive simplification) are more effective than further prose (A), manual cherry-picking (C), or splitting the task (D), none of which resolve the underlying ambiguity in what "customer-friendly but accurate" actually means here.

**Q16. Answer: B** *(D3)* — A single glob-scoped `.claude/rules/` file with paths covering both migration directories applies the convention wherever migration files live, without duplicating content across directory-level `CLAUDE.md` files (A) or bloating the root `CLAUDE.md` with a rule that's only relevant to a subset of files (C).

**Q17. Answer: A** *(D3, D5)* — A scratchpad file capturing constraints discovered during exploration — paired with the `Explore` subagent to keep the verbose search process itself out of the main context — is the direct fix for exactly this failure mode: a constraint noticed early gets silently dropped by the time implementation happens. A fresh session (B) or a bigger context window (C) don't capture and resurface the constraint; they just change how much gets forgotten and when.

**Q18. Answer: B** *(D3)* — This is intentional design, not a bug: a session that generated the fix retains its own reasoning and is measurably less likely to challenge its own prior decisions, so an independent review session is used specifically to avoid that bias. This particular miss doesn't invalidate the pattern — it's a separate reliability gap. Giving the reviewer the generation reasoning (A) or merging the two steps (C) would reintroduce the exact bias the design is meant to avoid.

**Q19. Answer: B** *(D3)* — `argument-hint` is autocomplete guidance shown when a skill is invoked without arguments; once an argument is supplied, the skill proceeds on the assumption the user has provided what's needed. It isn't a schema or a validator, so it doesn't force a prompt regardless of input (ruling out A and D), and `context: fork` governs execution isolation, not prompting behavior (C).

**Q20. Answer: B** *(D3, D5)* — A scratchpad recording constraints and invariants discovered during exploration is what lets a later implementation step recheck against them explicitly, instead of relying on the model to spontaneously recall something read an hour earlier in a long session. Aggressive `/compact` (A) and periodic restarts (C) both actively discard the very information that needed to be preserved.

---

## Scenario 3: Multi-Agent Research System

**Q21. Answer: C** *(D1)* — Every subagent executing correctly rules out execution-level defects; the imbalance traces back to the coordinator never giving synthesis any weighting or integration guidance for how to combine the two domains. This is the scenario's signature trap: a "successful" pipeline with a decomposition-level bug.

**Q22. Answer: B** *(D1)* — Subagents don't automatically inherit the coordinator's conversation history — this is by design, not a defect. Context needed by a subagent must be explicitly included in its invocation prompt, which is exactly what didn't happen here.

**Q23. Answer: B** *(D1)* — Emitting multiple `Task` calls within a single coordinator turn is what runs subagents concurrently. Sequential delegation (the current setup) is what's producing the 45-second elapsed time; combining the three lookups into one subagent (A) or shelling out via `Bash` (C) both abandon the coordinator's oversight of the delegation itself.

**Q24. Answer: B** *(D2, D5)* — Categorized error context — cause, retryability, what was attempted, and a suggested next step — is what lets the coordinator make an informed recovery decision instead of guessing. A bare boolean (A) or a self-reported confidence score (C) don't distinguish a temporary outage from a permission problem, which is exactly the ambiguity causing unpredictable recovery here.

**Q25. Answer: B** *(D1)* — When the right next step depends on what a stage actually finds, a dynamic orchestrator that inspects results and decides subsequent delegation is the fit — this is the orchestrator-workers pattern. A fixed chain (A) can't adapt when complex topics need a different dispatch shape than simple ones.

**Q26. Answer: B** *(D2)* — Thin, near-identical descriptions ("Retrieves market information" / "Retrieves economic information") give the model no basis for correct selection. Rewriting both with specific inputs, example queries, and explicit boundaries is the first and highest-leverage fix, ahead of few-shot examples (A) or a pre-router (D).

**Q27. Answer: A, C** *(D5)* — Dating each figure lets a reader separate a genuine trend over time from an apparent contradiction (A); preserving each figure with attribution and explicitly flagging the disagreement (C) avoids silently deciding which source is "right." Averaging (D) or picking only the newest figure (B) both destroy information the reader needs to interpret the disagreement themselves.

**Q28. Answer: B** *(D5)* — Structured claim-source mappings — claim, excerpt, source, date, methodology — carried through as a required part of the handoff are what prevent provenance from being silently dropped during synthesis. A confidence score (A) doesn't address citation loss, and a checklist (C) or externally-stored sources file (D) both rely on a manual step that's easy to skip under exactly the conditions that caused the original loss.

**Q29. Answer: B** *(D1)* — A partial, clearly-annotated report lets the reader judge whether the coverage gap matters for their purposes, while still delivering the value already produced by the two subagents that succeeded. Escalating over one failed subagent (A), retrying indefinitely (C), or discarding good work (D) all destroy value the pipeline has already legitimately produced.

**Q30. Answer: B** *(D5)* — A persistent findings-summary artifact, re-injected into every synthesis turn, is the direct countermeasure to specific facts getting buried and generalized away as a long multi-turn session grows — the classic "lost in the middle" pattern. Restarting (A), raising `max_tokens` (C), or swapping models (D) don't address why the earlier, more specific findings stopped being referenced.

---

## Scenario 4: Developer Productivity with Claude

**Q31. Answer: B** *(D2, D5)* — A scratchpad tracking each candidate's path, line number, and status as it's actually checked gives Claude a persistent record to synthesize from, instead of drawing a conclusion from a small, arbitrary subset of the 14 matches. A bigger context window (A) doesn't force the remaining 11 files to actually get checked, and "be thorough" (D) is a probabilistic instruction, not a structural fix.

**Q32. Answer: B** *(D2)* — Tool selection is driven primarily by description quality; a thin or vague description for the more capable tool loses to a familiar, simpler alternative by default. Sharpening `trace_dataflow`'s description to spell out its semantic, cross-boundary capability — and when that capability actually matters — is the direct fix, well ahead of anything at the network or precedence level (A, C).

**Q33. Answer: B** *(D2)* — `Grep` is the right tool for finding a pattern (the function definition) inside file contents, and `Read` is then used narrowly on just the matched region. `Glob` (C) matches file paths, not contents, and reading entire branches (D) wastes context on code that isn't relevant to the comparison.

**Q34. Answer: B** *(D2)* — When an `Edit` anchor isn't unique, the documented fallback is `Read` to load the whole file, manually identify the correct occurrence, then `Write` the corrected full-file version. A longer anchor (A) might still collide, and constructing an `Edit` around a bare line number (C) isn't how the tool matches text.

**Q35. Answer: B** *(D2)* — Project-scoped `.mcp.json`, committed to version control, with `${DATABASE_API_KEY}` expanded from each developer's own environment, is exactly the pattern that keeps the config shared while keeping the secret itself out of git. `~/.claude.json` (A) isn't shared across the team by design.

**Q36. Answer: B** *(D2)* — `~/.claude.json` is the user-scoped location intended for exactly this: a personal, experimental server that shouldn't be pushed into the shared project configuration or risk breaking anything for teammates.

**Q37. Answer: B** *(D2, D5)* — This is context degradation over a long session — earlier specifics get lost even though the conversation is still "about" the same system. A scratchpad recording key class names and relationships, referenced in later prompts, is the direct mitigation. Restarting (A) throws away three hours of legitimate exploration.

**Q38. Answer: B** *(D2)* — Search first, read second: `Grep` for validation-related terms surfaces candidate files, then `Read` on just those matches (following imports from there) builds understanding incrementally. Reading everything upfront (A, D) front-loads irrelevant content before knowing what actually matters.

**Q39. Answer: B** *(D2, D3)* — A variable exported only in `~/.bashrc` is available to shells that source that file at startup — it doesn't automatically propagate to every process on the machine. If Claude Code was launched from a context that never sourced `.bashrc`, the variable simply isn't present in its environment. The fix is ensuring the variable is actually set in the shell/session Claude Code is launched from — this is standard environment-variable scoping, not an `.mcp.json` syntax or location problem (A, C, D).

**Q40. Answer: A** *(D1, D2)* — `allowedTools` scoped at the agent/role definition is exactly the mechanism for restricting which tools are available during which phase, without needing two fully disconnected agents (B) or relying on prompt instructions alone (C) to enforce what should be a hard boundary.

---

## Scenario 5: Claude Code for Continuous Integration

**Q41. Answer: B** *(D3)* — Reusing one session across multiple PRs lets earlier reasoning and context bleed into later reviews, producing generic, prior-PR-flavored comments instead of a focused read of the current diff. A fresh session per PR removes that contamination. Raising `max_tokens` (A) doesn't address contaminated context, and parallelizing (D) sidesteps the question of what's actually wrong with the sequential design rather than fixing it.

**Q42. Answer: B** *(D3)* — The hook's logic is sound; its scope is too broad. Narrowing the `matcher` (or adding a condition) so it only fires on review-related tool calls — not on an unrelated test-execution step — fixes the interference without giving up normalization altogether (A) or misdiagnosing the fix as a timing change (C).

**Q43. Answer: B** *(D4)* — Nine categories' worth of fine-grained criteria packed into a single pass is a recipe for attention dilution — the model can't reliably hold and apply that many rules while also reading code. Splitting into per-category (or per-file) passes, or moving some of the criteria into a deterministic post-generation validation step, addresses the structural cause. More examples (C) or forcing `temperature: 0` (D) don't resolve rules competing for the same attention budget.

**Q44. Answer: B** *(D4)* — The Message Batches API has no latency SLA and can take up to 24 hours; that's fundamentally incompatible with an under-8-minute blocking pre-merge check, but is a good fit for the latency-tolerant nightly scan. Assuming a typical 2-hour turnaround (C) treats an unbounded window as if it were a guarantee, which it isn't.

**Q45. Answer: C** *(D3, D4)* — `--output-format json` with `--json-schema` already produces structurally enforced, schema-valid JSON; the bracket-counting sanity check the bot added on top is a redundant heuristic that misfires on legitimate finding text containing `{`/`}`. Removing that extra, unnecessary check and parsing directly against the enforced schema is more robust than patching around it with string-search heuristics (A) or hoping a prompt instruction (B) prevents `{`/`}` from ever appearing in prose.

**Q46. Answer: B** *(D3)* — A non-negotiable prerequisite needs enforcement outside the model's voluntary compliance. A `PreToolUse` hook that checks the ticket-link prerequisite and blocks the review tool call deterministically is the fix; a stronger prompt (A), a skill that merely documents the check as a step (C), or post-hoc filtering (D) all still depend on the model behaving correctly, which has already been shown to fail.

**Q47. Answer: B** *(D3, D4)* — Running each stage as its own fresh `-p` invocation avoids both the session-bloat precision loss and the re-flagging problem, as long as the per-file findings are explicitly passed into the integration invocation so it knows what's already been caught and can focus on genuinely new cross-file issues. Keeping both stages in one long session (A, D) preserves the very context accumulation causing the precision loss.

**Q48. Answer: C** *(D4)* — "Flag only critical cases" is still a subjective judgment call; an explicit, codebase-specific rule (naming the function, the exception types, and the concrete consequence that matters) removes the ambiguity that examples alone hadn't resolved. More examples without a sharper rule (A) doesn't change the boundary itself.

**Q49. Answer: B, D** *(D3)* — Per-file passes plus a separate integration pass directly address inconsistent depth and missed cross-file issues (B); independent instances per PR prevent one PR's reasoning from biasing the next (D). Consolidating into one big pass (A) reintroduces the attention-dilution problem, and reusing a session across PRs (C) is the same contamination pattern seen in Q41.

**Q50. Answer: B** *(D3, D4)* — Moving path- or category-specific guidance into `.claude/rules/` with scoped frontmatter means it only loads for matching files, freeing up context budget for the actual diff being reviewed. `@path` imports (A) still get fully expanded into context regardless of relevance, and gutting `CLAUDE.md` to under 100 lines (C) throws away guidance the team still needs, just less selectively than option B.

---

## Scenario 6: Structured Data Extraction

**Q51. Answer: B** *(D4)* — Schema validity guarantees the JSON is well-formed, not that the value is grounded in the source. A `source_location` field lets downstream validation check that an extracted value actually appears where it claims to have come from, which is what catches a fabricated-but-plausible vendor name that a confidence score alone missed.

**Q52. Answer: C** *(D4)* — `tool_choice: "any"` guarantees a tool call happens, but not that it's the *right* one; that requires a separate validation-retry loop that detects a field-presence mismatch, names the better-fitting schema in a structured error, and lets the model retry against that specific feedback. Few-shot examples (A) may help marginally but don't replace direct error feedback on the actual mismatch.

**Q53. Answer: B** *(D5)* — Confidence scores are a poor signal specifically for fabrication, since a model can be highly confident about an invented value. Stratified random sampling of a slice of high-confidence extractions is designed to surface exactly the failure patterns a pure confidence threshold structurally cannot catch. Lowering the threshold (A) doesn't target this failure mode any more precisely.

**Q54. Answer: B** *(D4)* — Four identical retries hitting the same wall is a sign the problem is the schema, not the prompt: accept the value as a string and parse it deterministically afterward, moving that check out of the pre-approval retry loop entirely. Persisting with more retries (A, D) repeats an approach already shown not to work.

**Q55. Answer: C** *(D4)* — Making the field optional stops fabrication, but conflates two very different situations under one `null` value; a `source_location` (or similar evidence field) lets you tell "genuinely not in the document" apart from "present, but missed" — the second of which is an extraction bug worth fixing, unlike the first.

**Q56. Answer: B** *(D2, D4)* — Sharpened, mutually exclusive tool descriptions reduce ambiguity up front, and a validation step that checks the extraction against the detected document type — returning a structured error and allowing a corrected retry when they don't match — handles the genuinely ambiguous cases that description quality alone won't fully resolve. A merged schema (A) is explicitly what the team is trying to avoid.

**Q57. Answer: A, B** *(D5)* — Stratified sampling of high-confidence extractions targets exactly the blind spot a threshold-only review has (A); mandatory review for new vendors or document types catches cases the model has no track record on yet (B). Raising the threshold to 0.95 (C) doesn't target these specific failure modes, and cross-checking two independent passes (D) is a reasonable idea but not as directly matched to these three failure classes as A and B.

**Q58. Answer: B** *(D4)* — A geometric mean lets one very weak field hide behind several strong ones, which is exactly how a category confidence of 0.32 got auto-approved. A minimum-field threshold ensures no single field is silently the weak link, which is why the flat-0.72-across-the-board receipts perform better in the audit despite a lower "overall" score.

**Q59. Answer: B** *(D4)* — A retry loop that plateaus after several attempts, especially when contrasted against a different failure class where a single retry mostly works, indicates the model is drawing on a strong learned association ("AMZN") that re-prompting won't reliably override. A deterministic post-processing alias lookup handles it outside the retry loop, which is more reliable than continuing to ask nicely (A) or discarding an otherwise-good extraction outright (D).

**Q60. Answer: B** *(D4)* — A `detected_pattern` field capturing what characteristic drove a given extraction path is what turns a flat pass/fail log into something that can actually be aggregated and prioritized by root cause (vendor, date format, document type). A trace ID (A) or retry count (C) don't explain *why* a failure happened, only that one did.

---

## Score yourself

Count your correct answers out of 60, and check per-scenario breakdowns against your weakest domain(s) — see the [scoring guide](exam-4-questions.md#scoring-guide) and go back to the relevant [domain page](../study-guide/) for anything you missed. Remember: this set is calibrated harder than the real CCAR-F exam on purpose, so treat a lower raw score here as a normal, expected diagnostic — not a signal you're behind where Exam 1/2/3 already showed you to be.
