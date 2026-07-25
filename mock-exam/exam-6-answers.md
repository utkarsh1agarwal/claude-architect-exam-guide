# Mock Exam 6 — Answer Key (Hard Mode)

Domain tags: **D1** Agentic Architecture · **D2** Tool Design & MCP · **D3** Claude Code Workflows · **D4** Prompt Engineering · **D5** Context & Reliability

## Scenario 1: Customer Support Resolution Agent

**Q1. Answer: B** *(D1)* — Emitting both `Task` calls within a single coordinator response is what actually runs the two subagents concurrently; merging them into one subagent (A) loses the modularity of separate investigations, and neither a generic batching layer (C) nor a bigger token budget (D) changes the fact that the calls are currently dispatched sequentially.

**Q2. Answer: C** *(D2)* — Concrete guidance in the description — exactly what belongs in the enum vs. what belongs in free text, with an example of when justification is actually needed — is the direct, lowest-effort fix for this kind of field-misuse pattern, ahead of renaming (A), merging the fields (B), or bolting on a rejection hook (D).

**Q3. Answer: B** *(D5)* — A persistent case-facts block carried outside the part of the conversation that gets condensed is what keeps specific numbers from disappearing during synthesis, which is exactly what happened to three of the four transaction amounts here. A bigger context window (A) doesn't stop summarization from happening; higher temperature (C) adds noise, not fidelity; and asking the customer to repeat themselves (D) is a workaround, not a fix.

**Q4. Answer: B** *(D1)* — Routing each case to a specialized subagent scoped to only its own category's tools directly addresses uneven performance across very different case types, without expanding any single agent's tool surface (A) or relying on examples alone to cover three very different domains (C). Splitting into fully separate backend services (D) throws away the shared coordinator without actually fixing tool scoping.

**Q5. Answer: B** *(D2)* — Making the required fields part of the tool's own input schema means the call literally cannot be made without them — a deterministic guarantee that stronger prompt wording (A) or a hook that only flags problems after the fact (C) can't provide. Splitting the tool in two (D) doesn't address the missing-context problem itself.

**Q6. Answer: B** *(D5)* — The right trigger for escalation is a genuine gap or silence in the documented policy that no further investigation can resolve on its own — not proxies like order count, dollar amount, tool-call count, or sentiment, all of which correlate poorly with whether the agent is actually equipped to decide the case.

**Q7. Answer: B** *(D1)* — Checking each step's result before dispatching the next lets the coordinator escalate the moment a red flag appears, instead of always paying for every remaining step regardless of outcome. A rigid pre-baked decision tree (A) is brittle against cases outside its exact enumerated conditions, and running everything in parallel (D) doesn't save any of the wasted work this fix is meant to eliminate.

**Q8. Answer: A, B** *(D2)* — A fixes the selection confusion by drawing an explicit boundary against `check_refund_eligibility`; B fixes the separate problem of an undifferentiated error response by giving the coordinator an actual category and retryability signal to act on. Merging the tools (C) hides the same decision rather than resolving it, and identical descriptions (D) would make the original confusion worse.

**Q9. Answer: B** *(D5)* — The subagent needs a way to say "I could not verify this" that's structurally distinct from "I verified this and it's fine" — without that distinction, the coordinator has no way to avoid treating an inability to check as a clean pass. Retrying indefinitely (A) doesn't solve the reporting problem, dropping the check (C) loses real value, and blanket auto-escalation (D) overcorrects for a problem that's really about signal clarity.

**Q10. Answer: C** *(D1)* — Branching from an already-verified shared fact base into two isolated explorations avoids both cross-contamination between the two paths (which a single shared session risks) and the wasted, potentially-inconsistent re-verification of two fully separate sessions (B). Manual labeling within one session (A) or note-taking between path switches (D) both rely on discipline rather than actual isolation.

---

## Scenario 2: Code Generation with Claude Code

**Q11. Answer: B** *(D3)* — A `PreToolUse` hook that exits non-zero blocks the tool call outright, before it ever executes — that's the entire point of the mechanism, not an advisory suggestion layered on top of it. The hook fires for the `Write` call regardless of file type (ruling out C), and the block happens before, not after, anything gets written (ruling out A and D).

**Q12. Answer: B** *(D3)* — Glob patterns are literal path matches: `src/api/**` and `lib/api/**` only cover those two specific trees, and a new directory like `server/api/` needs to be added explicitly (or covered by a broader pattern such as `**/api/**`) — it isn't automatically included just because it also contains the word "api."

**Q13. Answer: B** *(D3)* — `context: fork` exists specifically to keep a skill's exploratory reasoning out of the main session's context; only the final result the skill actually returns comes back, not the intermediate questions and dead ends that led to it.

**Q14. Answer: B** *(D3)* — Once the real shape of the task turns out to be reconciling genuinely competing priorities across eight teams, that's exactly the kind of design question plan mode is suited to work through before any file gets touched — a very different situation from the surface-level "update three imports" framing the task started with.

**Q15. Answer: A** *(D3)* — Giving the model the team's actual existing tests as context, plus documenting available fixtures and assertion patterns in `CLAUDE.md`, gives it concrete, specific patterns to reuse instead of reinventing boilerplate each time — which a token-budget change (B, D) or a single extra example (C) don't reliably provide.

**Q16. Answer: B** *(D3)* — A small test suite covering every meaningful combination of the three interdependent conditions, with real failures shared back after each attempt, pins down the exact intended behavior far more reliably than repeating the same prose requirement more forcefully (A, C) or picking a favorite among several blind attempts (D).

**Q17. Answer: B** *(D3)* — The interview pattern is built for exactly this situation: a domain unfamiliar enough that the developer can't yet know which tradeoffs (TTL vs. LRU, tiering, invalidation triggers) actually matter, so surfacing those questions before implementation catches gaps a detailed upfront prompt would likely miss.

**Q18. Answer: C** *(D3)* — Hooks are scoped by their `matcher`; a hook matching `Write` simply doesn't fire for an `Edit` call, and vice versa. Since this operation is an `Edit`, only the type-checking hook (matched to `Edit`) runs — the formatting hook never gets a chance to block anything here.

**Q19. Answer: A** *(D3)* — `allowed-tools` genuinely restricts a skill to the listed tools; a skill can't reach for `Bash` if it isn't on that list, full stop — this isn't an advisory setting (B) or a blanket ban on `Bash` specifically (C), and it does actually constrain what the skill can do (ruling out D).

**Q20. Answer: B** *(D3, D5)* — A short scratchpad stating the constraint explicitly, checked before writing a new utility, gives the rule a durable anchor outside the conversation's own shifting "salience" — which is what quietly erodes over a long session and is why the convention started slipping around hour three and a half. Restarting (A) throws away the accumulated refactoring context the developer explicitly wants to keep, and repeating the constraint verbally (D) is exactly the kind of reminder that already stopped working once.

---

## Scenario 3: Multi-Agent Research System

**Q21. Answer: B** *(D1)* — Adding an explicit coverage check after synthesis — and conditionally spawning follow-up searches only when real gaps remain — is what lets the pipeline adapt to what it actually finds, instead of running the same fixed sequence regardless of whether the topic turned out to need more regional coverage than initially planned.

**Q22. Answer: C** *(D1)* — When several subagents' outputs are concatenated into one very long prompt with nothing marking which parts matter, material buried in the middle predictably gets less attention than what's near the start or end — the classic "lost in the middle" effect, not a case of the data having been dropped or overwritten (A, D) or needing an extra turn (B).

**Q23. Answer: B** *(D2)* — A largely static, read-only catalog that exists to be looked up — not acted on — is exactly what MCP resources are for; exposing it that way removes the tool-call decision and round-trip entirely, rather than just making the tool's description clearer (A) or forcing when the call happens (C).

**Q24. Answer: B** *(D1)* — With no shared state between the two delegations, what's actually carrying "precedent" language into the recent-changes report is the identical prompt template itself — the phrasing pattern, not any shared memory — pulling in an unintended thematic association. The fix is differentiating how each task is framed, not adjusting the coordinator's own system prompt (C) or the parallel-vs-sequential structure (D).

**Q25. Answer: B** *(D1)* — A hook that actually blocks the report-generation dispatch until synthesis's result exists enforces the ordering deterministically; prompt-level ordering language (A), few-shot examples (C), or a bigger context window (D) are all still just probabilistic nudges toward an order the pipeline itself doesn't actually guarantee.

**Q26. Answer: B** *(D2)* — A narrowly scoped verification tool lets the common, simple 85% of checks resolve locally without a coordinator round-trip, while the rarer, genuinely complex 15% still get routed through the coordinator where that overhead is actually justified. Full tool access for synthesis (A) reintroduces the coordination and scope problems scoped tools exist to avoid.

**Q27. Answer: A, C** *(D5)* — Requiring metadata to travel with every claim (A) and requiring structured claim-source mappings that synthesis must preserve rather than paraphrase (C) both directly target why specificity is disappearing — the information is getting lost in translation during synthesis. A single maximally long context window (B) is the opposite of a fix here, since it's exactly this kind of single, undifferentiated long pass that's causing the degradation; a downstream quality gate (D) might catch some resulting inconsistencies but doesn't address why the detail vanished in the first place.

**Q28. Answer: C** *(D5)* — Whether to return partial results, retry, or escalate should depend on whether the 60 already-collected results are actually enough to answer what the user asked — not a blanket rule to always return whatever exists (A), always escalate (B), or retry forever regardless of diminishing returns (D).

**Q29. Answer: B** *(D1)* — A graduated backoff-and-retry-limit policy handles the realistic middle ground between giving up too easily (C, D) and retrying forever regardless of cost (A) — it gives genuinely transient failures a real chance to resolve without letting one subagent's hiccup indefinitely stall the whole pipeline.

**Q30. Answer: B** *(D5)* — Splitting into a "map" phase (detailed, per-source extraction, each source getting full attention on its own) and a "reduce" phase (synthesizing across those already-detailed outputs) directly counters the attention tapering that a single 50-document pass produces. A bigger context window (A) doesn't stop attention from tapering within it, and simply processing fewer documents (C) or filtering by a confidence score after the fact (D) don't address why detail degrades as the pass goes on.

---

## Scenario 4: Developer Productivity with Claude

**Q31. Answer: B** *(D2)* — An `errorCategory` plus an `isRetryable` flag gives the agent an actual signal to reason from, rather than treating every failure identically — which is what's currently causing it to sometimes retry a hopeless malformed query forever and sometimes give up on a call that would have succeeded with one more attempt.

**Q32. Answer: B** *(D2)* — A largely static catalog that exists purely to be discovered, not acted on, is exactly the case MCP resources are meant for — the agent can read it directly without spending a tool-use decision on pure discovery, which merging (C) or caching into `CLAUDE.md` (D) don't actually eliminate.

**Q33. Answer: B** *(D2)* — Once description-level fixes have already been applied and the remaining mistakes are concentrated in genuinely ambiguous edge cases, few-shot examples with explicit reasoning are the next lever — well short of removing a legitimate tool (A) or forcing selection regardless of fit (D).

**Q34. Answer: B** *(D2)* — A generic description that never mentions a faster, narrower alternative reads as "use me, I'm the safe default" by omission; making that boundary explicit in the description is the direct fix, ahead of deprecating the tool (A), adding more examples for a problem that's really about missing information (C), or merging the two (D).

**Q35. Answer: C** *(D2)* — Data that's effectively static within a session and exists to be referenced, not acted on, belongs behind an MCP resource rather than a tool — removing the repeated round-trip cost that embedding in the system prompt (A), caching in `CLAUDE.md` (B), or manual developer input (D) don't actually solve as cleanly.

**Q36. Answer: A** *(D2)* — Validating the input shape inside the tool itself, before the expensive (and here, enormous) operation runs, stops the problem at its actual source; a `PostToolUse` hook (B) only trims the damage after the huge response has already consumed context and time, and a description-only warning (C) is easy for a vague request to slip past.

**Q37. Answer: B** *(D2)* — With 22 similar-looking tools live at once, narrowing which ones are actually available for a focused task like this one directly reduces the selection space causing the misfires — a more direct fix than better prompting (A), a more generic description (C), or hoping a larger context window somehow improves the underlying selection judgment (D).

**Q38. Answer: C** *(D2)* — Making `search_api_endpoints`'s description explicitly state when it beats fetching the entire spec is the direct fix for this kind of under-selection; removing the full-spec tool (A) breaks legitimate cases that need it, and shrinking its response (B) or raising temperature (D) don't address why the search tool isn't being reached for in the first place.

**Q39. Answer: A** *(D2, D3)* — A `PreToolUse` hook that inspects the specific tool being called together with its target path is what can actually block a mismatched combination (like a rename operation aimed at a migrations directory) before it executes — this is a real, path-aware enforcement mechanism, unlike `.claude/rules/`, which scopes what *guidance text* loads for matching files but has no ability to restrict which *tools* are available based on path. Forcing one tool globally via `tool_choice` (B) would break the other two legitimate use cases, and more reasoning room (C) or a manually-invoked skill (D) don't add any actual enforcement.

**Q40. Answer: B** *(D1, D2)* — Standardizing what tools report on failure is a tool-design fix (D2) that's the actual prerequisite for a reliable coordinator-level retry/escalation policy (D1) — without a consistent shape to react to, no amount of coordinator-side logic (A) can reliably tell the three formats apart. Merging subagents (C) or pushing normalization down into each subagent separately (D) both sidestep fixing the inconsistency at its source.

---

## Scenario 5: Claude Code for Continuous Integration

**Q41. Answer: C** *(D3)* — Configuring `.claude/settings.json` permissions so only the three read-only tools are allowed, with everything else denied by default, is a declarative, version-controlled restriction every developer's session inherits automatically — more direct and more maintainable than reimplementing the same allow logic inside a hook (B), a prompt note that depends on the model following it (A), or physically stripping tools from the whole project's registry (D).

**Q42. Answer: B** *(D3)* — What actually removes the generation-reasoning bias is that each of the five review agents is a fully independent invocation carrying no context from whatever session wrote the code in the first place — parallelism alone (A) doesn't provide that independence, and neither does deduplicating findings afterward (C) or the choice of output format (D).

**Q43. Answer: B** *(D4)* — The model already produces schema-valid JSON, so the problem isn't structural — it's that the model hasn't internalized which content belongs in which field. A few concrete field-assignment examples per violation type teach that distinction directly, which tightening required-ness (A), adding an unrelated list field (C), or forcing tool choice (D) don't address.

**Q44. Answer: B** *(D4)* — Temporarily pulling the one category driving nearly all the dismissals — while leaving the well-performing categories active — protects trust in the parts of the review that are actually working, and buys room to fix that category's criteria properly. Stronger wording (A) and a lower temperature (C) haven't moved this kind of false-positive rate before and aren't likely to now; requiring justification for every dismissal (D) adds friction without addressing the underlying noise.

**Q45. Answer: A** *(D3)* — A path-scoped rules file means the code-specific guidance only loads when Claude is actually working with matching source files, leaving doc-only PRs unaffected — without duplicating content across two full root files that both still need to be kept in sync (B), moving guidance somewhere the model has to decide to consult (C), or hoping the model selectively ignores irrelevant content it's always being fed (D).

**Q46. Answer: B** *(D2)* — Setting an environment variable at the CI job level doesn't guarantee every process spawned within that job automatically inherits it — if Claude Code is invoked from a context that never actually received that variable in its own process environment, expansion will fail even though the syntax and the job-level setting are both correct. This is a process/environment-scoping issue, not a syntax limitation (A), a server misconfiguration (C), or a permissions block (D).

**Q47. Answer: B** *(D3, D4)* — Persisting prior findings and then explicitly dropping any that no longer correspond to a real location in the current diff — before deciding what's actually new — keeps the review current with the code as it stands, without silently mislabeling old, no-longer-relevant lines as bugs in the new code. Reviewing only the final commit (A) throws away the benefit of fast per-commit feedback; manual line renumbering (C) doesn't scale; a blanket disclaimer (D) doesn't fix the underlying misattribution.

**Q48. Answer: B** *(D4)* — Schema validity only confirms the JSON is well-formed and the value is an integer — it says nothing about whether that number is actually grounded in anything. A deterministic check that looks for real supporting evidence in the PR before accepting a quantitative claim is what catches this, which tighter integer ranges (A), removing the field (C), or a lower temperature (D) don't reliably provide.

**Q49. Answer: A, B** *(D4)* — Citations and schema-enforced `tool_use` output can't be combined in the same request, so the right way to attach a grounded excerpt to a structured finding is to add an explicit evidence/excerpt field to the schema itself (A), populated from whatever source text was actually given in context (B) — not to try to layer the citations feature on top of tool-use output, which isn't a supported combination (ruling out C), and citations don't automatically populate unrelated fields like `remediation` (ruling out D).

**Q50. Answer: C** *(D3, D4)* — Separate skills, each carrying the guidance specific to one review type, with the CI job itself reading the PR's real labels (via the GitHub API, which is ordinary CI scripting, not a Claude-Code-specific feature) and invoking the matching skill, uses only real, documented building blocks. There's no `labels` field in `.claude/rules/` frontmatter — path-scoped rules only match against file paths Claude actually reads locally, not external metadata like GitHub labels, so option B describes a capability that doesn't exist. Swapping `CLAUDE.md` files via environment variables (A) is a real but clunkier alternative to the same end, and keeping everything in one prompt with inline conditionals (D) is exactly the unmaintainable pattern the team is trying to get away from.

---

## Scenario 6: Structured Data Extraction

**Q51. Answer: B** *(D4)* — Since whether an approval date should even be expected depends entirely on the document actually being a purchase order rather than an estimate, classifying that first and only then conditionally requiring the field prevents the mismatch that's causing fabrication on documents that were never going to have a real date in the first place.

**Q52. Answer: C** *(D4)* — A plausible, correctly-formatted value can still be wrong, which is exactly what a registry cross-check or a source-location/evidence requirement catches and a regex never can — regex only verifies shape, not whether the specific digits are actually correct.

**Q53. Answer: A, B** *(D5)* — Cross-document leakage inside one long shared conversation is a context-carryover problem, and the two changes that actually remove the shared context causing it are isolating each contract into its own call (A) and, short of that, at least shrinking how many documents share a conversation at once (B). Validating vendor names against the document text (C) can catch the symptom after the fact but doesn't stop the leakage from happening, and temperature (D) isn't a reliable defense against context carryover.

**Q54. Answer: B** *(D4)* — A retry needs the original document to re-read, the failed output to see what actually went wrong, and the specific validation error to understand exactly why — a vague "fix it" retry (implicitly what's happening now) gives the model no new information to correct against, which is why it keeps failing the same way.

**Q55. Answer: C** *(D4)* — When a required field consistently lives late in long documents and detail is visibly trailing off well before that point, splitting extraction into an early-pages pass and a late-pages pass ensures the later pages get real attention, which is more cost-effective than indefinitely raising `max_tokens` (B) and doesn't sacrifice the field the way making it optional (A) or truncating the source document (D) would.

**Q56. Answer: A** *(D2, D4)* — When a document is genuinely, structurally both things at once, no amount of sharpening either extraction tool's own description will fully resolve the ambiguity, because the ambiguity is a property of the document, not the tool definitions; an explicit classification step (including a genuine "hybrid" outcome) that then routes accordingly is what actually handles that case, rather than asking one of the two extraction tools to also silently double as a classifier.

**Q57. Answer: A, B** *(D5)* — Checking whether an extracted vendor name actually appears in the source (A) and checking extracted dates against a basic logical/business rule (B) are both structural checks that catch a wrong value regardless of what the model's own confidence score said about it. Simply lowering the threshold (C) just shifts more volume through the same confidence-only signal that's already been shown not to catch these errors, and a single weak proxy like scan quality alone (D) doesn't directly verify whether the extracted value is actually correct.

**Q58. Answer: C** *(D4)* — With no latency SLA and a documented worst case of up to 24 hours, the Batches API is fundamentally incompatible with a hard same-day deadline like this one — treating "up to 24 hours" as something that will comfortably fit inside a 3-hour window (A) misunderstands what "no SLA" actually means, and a partial migration for only the earliest-submitted invoices (B) still leaves the same unbounded risk for whatever doesn't make that early cutoff.

**Q59. Answer: A** *(D4)* — When a field is genuinely and legitimately absent from many real source documents, making it nullable is what stops the model from having to invent a value just to satisfy a required-field constraint — separate schemas per document type (C) don't address the actual mismatch (discount data that's optional within a single document type, not just across types), and a free-text field (B) or removing it downstream (D) both give up structure the pipeline still needs.

**Q60. Answer: B** *(D4)* — Logging the actual characteristics of the document alongside each extraction — format, OCR confidence where relevant, vendor, country — is what turns three flat error-rate percentages into something that can actually be correlated with a root cause, which a bare trace ID (A), a free-text note (C), or a retry counter (D) don't provide on their own.

---

## Score yourself

Count your correct answers out of 60, and check per-scenario breakdowns against your weakest domain(s) — see the [scoring guide](exam-6-questions.md#scoring-guide) and go back to the relevant [domain page](../study-guide/) for anything you missed. Between Exams 4, 5, and 6 you now have 180 hard-mode questions covering three different angles on the same blueprint — a persistent gap in the same domain across all three is a much stronger signal than a single miss on any one of them.
