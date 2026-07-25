# Mock Exam 6 — Questions (Hard Mode)

> Every question here is original material written against the public CCAR-F blueprint — none of it is drawn from or paraphrased from real exam content. See [CONTRIBUTING.md](../CONTRIBUTING.md#the-one-hard-rule) for why that boundary matters and how to add more questions the right way.

## How to take it

- **Full 6-scenario coverage, like Exams 1, 4, and 5** — 60 questions, 10 per official scenario, so every domain area gets drilled regardless of which 4 scenarios the real exam draws for you.
- **Difficulty: HARD**, same calibration as [Exam 4](exam-4-questions.md) and [Exam 5](exam-5-questions.md) — finer mechanism-level distractors, denser scenario stems, a few arithmetic/timing calculations, and select-two items. This is the third hard-mode set, drawing on yet another angle of source material, so it's a good third pass once you've exhausted the other two.
- **Set a timer for 120 minutes anyway.** The time pressure doesn't go away just because the questions get harder.
- **No notes, no search, no assistant.** Simulate real conditions as closely as you can.
- Five items are marked **"(Select TWO)"** — treat these as multiple-response; you must get both parts correct to receive credit.
- Score yourself against [exam-6-answers.md](exam-6-answers.md) afterward. Anything you missed, go back to the relevant [study guide](../study-guide/) domain page and re-derive the mechanism yourself — don't just read the rationale and call it learned.

## Scoring guide

Rough gut-check only — and *don't* benchmark it against Exams 1–3's bands or the real exam's scaled 720/1000 cut. This set is intentionally harder than the real thing, so a lower raw score here is expected and normal.

| Raw score (out of 60) | Rough read |
|---|---|
| 45+ | Strong — you're holding up well against distractors sharper than the real exam is likely to throw at you |
| 33–44 | Solid foundation, but the domains where you missed clusters of questions need another pass before you sit Exam 1/2/3 or the real thing |
| Below 33 | Expected on a first attempt at hard mode — this is a diagnostic, not a verdict. Go re-drill the missed domains, then retake |

---

## Scenario 1: Customer Support Resolution Agent

**Q1.** Your resolution agent must check customer account status and recent order history before acting on a case. The two lookups have no ordering dependency on each other, but the coordinator currently dispatches them as two sequential subagent calls, and high case volume is making that round-trip latency a real bottleneck. What's the most effective fix?

- A) Merge both lookups into a single combined subagent that performs both investigations in one turn
- B) Emit both `Task` calls within a single coordinator response so the two subagents run concurrently, then collect both results before proceeding
- C) Add a batching layer that packs multiple subagent invocations into one API request
- D) Increase `max_tokens` so each lookup resolves faster

**Q2.** Your refund tool exposes `refund_reason_code` (an enum: "defective," "not_as_described," "customer_request," "policy_exception") and `refund_justification` (free text for additional context). Logs show the agent frequently stuffs long explanatory text into `reason_code` and leaves `justification` blank, even on cases where a bare code isn't enough detail for the finance team to evaluate. Both parameters already have descriptions. What's the clearest next fix?

- A) Rename both parameters to something else entirely, on the theory that new names alone will resolve the confusion
- B) Merge them into a single free-text `refund_reason` field and parse category and detail out of it server-side
- C) Expand both parameter descriptions with concrete guidance: `reason_code` gets "must be exactly one of the enum values, never free text"; `justification` gets an example of what to write when the code alone doesn't capture enough context
- D) Add a hook that rejects the call outright whenever `justification` is empty

**Q3.** A customer disputes charges across three orders plus one account-level adjustment, requesting a $620 total refund. An initial lookup surfaces all four transaction amounts. After two subagents separately investigate return eligibility and account reconciliation, the synthesis step produces a final recommendation of "approve $105" — referencing the adjustment but dropping the three order amounts entirely, even though both subagents' own outputs were correct and complete. What's the most direct fix?

- A) Increase the context window so intermediate results never need to be summarized
- B) Maintain a persistent "case facts" block (each transaction ID and amount) carried alongside every prompt, outside the part of the conversation that gets condensed into a narrative summary
- C) Re-run both subagent investigations at a higher temperature for more thorough coverage
- D) Have the customer restate all four disputed amounts before the agent finalizes anything

**Q4.** Your single general-purpose resolution agent handles returns, billing disputes, and account-security cases, with access to every relevant tool across all three areas. First-contact resolution varies sharply by category: returns succeed 88% of the time, billing disputes only 59%, and account-security cases are occasionally escalated based on insufficient identity verification depth. What's the most effective structural fix?

- A) Give the single agent even more tools, including advanced financial-analysis and multi-factor-auth capabilities
- B) Introduce a lightweight intake step that classifies each case and routes it to a specialized subagent per category (returns, billing, security), each scoped to only the tools relevant to its own case type
- C) Keep one general agent, but add 15+ few-shot examples spanning all three case types
- D) Split the system into three fully separate backend services, one per case type, with no shared coordinator at all

**Q5.** `escalate_to_human` is meant to always carry structured context (customer ID, root cause, attempted actions), and the system prompt says so explicitly and emphatically. Logs still show a meaningful share of escalations going out with minimal or blank context, and the coordinator doesn't stop them. What's the most direct, deterministic fix?

- A) Make the system-prompt wording even stronger and more emphatic
- B) Define `escalate_to_human`'s input schema so `customer_id`, `root_cause`, and `attempted_actions` are required parameters the call cannot be made without
- C) Add a hook that inspects the call after the fact and flags escalations with thin context for follow-up
- D) Split `escalate_to_human` into two separate tools, one for routine escalations and one for emergencies

**Q6.** Your written policy explicitly covers defective items (90-day window) and wrong items shipped (30-day window), but says nothing about unopened, resalable items returned outside either window — a real request that comes up in about 5% of cases. The agent currently escalates every one of these, which is dragging down first-contact resolution, even though the policy's spirit plausibly supports approving some of them. Under what condition should a case like this actually go to a human?

- A) Whenever it involves more than one order or a large dollar amount
- B) When the agent has genuinely run out of applicable policy to reason from — the request falls into real silence or ambiguity in the documented rules — and further tool calls won't resolve that gap
- C) Once the agent has made at least three tool calls, since that indicates a thorough-enough investigation
- D) Whenever sentiment analysis on the customer's message indicates frustration or urgency

**Q7.** A pilot workflow needs three sequential checks — eligibility, account reconciliation, fraud assessment — where a red flag at any step should escalate immediately rather than continuing to the next step. The current coordinator runs all three regardless, and only checks for red flags once every step has already finished, wasting effort on cases that should have escalated at step one. What's the best fix?

- A) Bake a rigid, fully-enumerated if-then-else decision tree directly into the coordinator's prompt
- B) Have the coordinator inspect each subagent's result before dispatching the next one, and escalate immediately the moment a red flag appears, instead of always running the full sequence
- C) Remove the subagent layer and have one agent call all the underlying tools directly with branching logic
- D) Run all three checks in parallel, then escalate afterward if any of them raised a flag

**Q8. (Select TWO)** A new `recommend_resolution` tool suggests a refund, replacement, or store credit for a given order. Two problems compound in production: (1) when the order ID doesn't exist or the backend times out, it returns a flat `{"error": "backend unavailable"}`, giving the agent no way to tell a hopeless case (bad ID) from a worth-retrying one (timeout); (2) its description ("Suggests a resolution") is generic enough that agents sometimes reach for it instead of the more targeted `check_refund_eligibility` tool, missing important nuance that tool captures. Which TWO changes would most directly improve reliability here?

- A) Rewrite the description with explicit use cases and a clear boundary against `check_refund_eligibility` — including example queries and an explicit "don't use this for X" note
- B) Add structured error fields — an `errorCategory` (e.g. "transient," "validation," "business") and an `isRetryable` boolean — so the agent can tell a timeout worth retrying from an invalid order that isn't
- C) Merge `recommend_resolution` and `check_refund_eligibility` into one tool to remove the choice entirely
- D) Give both tools identical descriptions so the model has maximum flexibility in choosing between them

**Q9.** A subagent tasked with verifying a customer's shipping address calls an address-validation tool twice; both attempts time out. It returns `{"status": "complete", "findings": "Address verification unavailable"}`. The coordinator reads this as "verification succeeded, address is fine" and proceeds to process the refund — but the address was actually wrong, and the shipment later fails. What's the core issue, and the fix?

- A) The subagent's retry logic is too conservative; it should keep retrying until the backend eventually responds
- B) The subagent needs a way to clearly distinguish "I investigated and got a definitive answer" from "I was unable to investigate at all," using a distinct status or explicit failure marker — so the coordinator can't mistake an inability to verify for a successful verification
- C) Address validation is too unreliable to be part of this workflow and should be removed
- D) The coordinator should automatically escalate any case where address data comes back unavailable

**Q10.** A complex billing dispute has two defensible outcomes given the exact same underlying facts (verified identity, order history, account status): a strict-policy calculation of $280, and a goodwill-exception calculation of $420. You want to reason through both paths independently — without one path's assumptions contaminating the other — but re-verifying the same facts from scratch in two completely separate sessions wastes backend calls and risks the two paths ending up with subtly inconsistent fact bases. What approach best threads this needle?

- A) Stay in one session and add explicit labels at each step noting which path is currently being reasoned about
- B) Run two entirely independent fresh sessions for the two paths, accepting the duplicated backend calls and the risk of drifting fact bases as an unavoidable cost
- C) Branch into two isolated sessions from the same already-verified shared fact base, explore each path independently within its own branch, then bring both conclusions back together for a final recommendation
- D) Have the agent keep detailed written notes and re-read them each time it switches between the two paths

---

## Scenario 2: Code Generation with Claude Code

**Q11.** Your `.claude/settings.json` has a `PreToolUse` hook matching the `Write` tool that runs a validation script — exit code 0 for a valid file, non-zero for an invalid one. A developer's edit would produce a configuration file that fails that validation. What happens?

- A) The file is written first, and the validation failure is only reported afterward
- B) The write is blocked outright — the hook's non-zero exit prevents the tool call from executing at all
- C) The hook only applies to `Bash`-style commands, so a `Write` call bypasses it entirely
- D) The write proceeds regardless, since hooks are advisory rather than enforced

**Q12.** A convention needs to apply consistently to API-related code scattered across several unrelated directory trees, not confined to one folder. A developer creates `.claude/rules/api-validation.md` with `paths: ["src/api/**", "lib/api/**"]`. Later, new code is added under `server/api/handlers/`. Does the existing rule apply there?

- A) Yes — the presence of "api" anywhere in a path is enough to match
- B) No — `src/api/**` and `lib/api/**` only match those two specific directory trees; a path like `server/api/**` needs to be added explicitly (or a broader pattern like `**/api/**` used instead)
- C) Yes, but only once the new files have been committed to version control
- D) No, because rules never apply to any directory that didn't exist when the rule file was first created

**Q13.** A skill at `.claude/skills/design-phase/SKILL.md` uses `context: fork` to keep a long back-and-forth about architecture options out of the main conversation, and returns a final structured proposal as its result. Does the main session also retain the intermediate questions, dead ends, and exploratory reasoning that happened inside that fork?

- A) Yes — `context: fork` only changes what's displayed; all the underlying reasoning is still part of the session
- B) No — the fork's exploratory reasoning stays isolated to keep the main session's context clean; only the final result the skill actually returns comes back
- C) Only if the skill happens to summarize its own reasoning as part of that final output
- D) Yes, but only after a manual step re-merges the fork's context into the main thread

**Q14.** A task is described simply as "remove unused dependencies from `package.json` and update three import statements." On investigation, it turns out this actually means reconciling 15 separate package removals with genuinely competing priorities from eight different teams that depend on different subsets of them. Given that complexity, what's the more appropriate approach?

- A) Direct execution — dependency removal is inherently a simple, mechanical task
- B) Plan mode — the real work here is resolving competing priorities and removal order across teams, which is a design question that benefits from being worked out before any file gets touched
- C) Direct execution, switching to plan mode only if something unexpected comes up along the way
- D) Neither — this specific kind of cross-team coordination is out of scope for Claude Code entirely

**Q15.** A `/generate-tests` skill produces new test files with a lot of repeated boilerplate — fixture setup, mock definitions, assertion patterns — duplicated nearly identically across runs. Re-invoking it with an added instruction to "avoid boilerplate" doesn't change the output. What's the most direct fix?

- A) Include the team's existing test files as context, and document the available fixtures and standard assertion patterns the team already has in `CLAUDE.md`
- B) Increase `max_tokens` so the skill has more room to vary its output
- C) Add one "good" example test at the very start of the prompt as a single few-shot example
- D) Decrease `max_tokens` to force shorter, simpler generated tests

**Q16.** A `validateUser` function needs three interdependent checks: the user must be active, must have an assigned role, and that role must pass a whitelist. Across two separate attempts at implementing this, Claude structures the interaction between the three checks differently each time — once checking all three independently, once only checking the role if the user is already active. What's the most effective way to pin down the exact intended behavior?

- A) Repeat the requirement more forcefully: "make sure all three conditions are checked consistently"
- B) Provide a small test suite covering every meaningful combination (active/inactive × role-present/missing × role-valid/invalid) and share the actual failures after each attempt
- C) Ask Claude to "be more careful about edge cases this time"
- D) Generate five separate attempts and manually pick whichever looks best

**Q17.** Before implementing a cache-eviction strategy in a service the developer has never worked in, they want Claude to first surface open design questions (TTL vs. LRU, single- vs. multi-tier, what triggers invalidation) rather than go straight to an implementation. Which technique fits best?

- A) Test-driven iteration, backed by a comprehensive test suite covering cache behavior
- B) The interview pattern — have Claude ask clarifying design questions before proposing any implementation
- C) Plan mode, working from a detailed architectural brief the developer writes upfront
- D) Direct execution, just with a longer and more specific initial prompt

**Q18.** Your `.claude/settings.json` has two separate `PreToolUse` hooks: one matching `Write` that runs a formatting check, and one matching `Edit` that runs a type-checking validation. A developer performs an `Edit` on a file that would fail the formatting check but pass type-checking. Which hook(s) actually run?

- A) The formatting hook runs first alphabetically, blocks the call, and type-checking never runs
- B) Both hooks run regardless of which tool was called — formatting is checked, then type-checking
- C) Only the type-checking hook runs, since it matches `Edit`; the formatting hook is scoped to `Write` and doesn't fire here at all
- D) Neither hook runs, since hooks are only evaluated for `Write`, never for `Edit`

**Q19.** A skill at `.claude/skills/security-audit/SKILL.md` has `allowed-tools: ["Read", "Grep"]` in its frontmatter, meant to keep it to pure file analysis. Mid-run, it decides it needs to actually execute a quick `node --check` on a module to confirm it's syntactically importable, and attempts to use `Bash`. What stops this from working?

- A) `Bash` isn't in the skill's `allowed-tools` list, so the skill cannot invoke a tool outside that set
- B) `allowed-tools` is only advisory — the call goes through, just with an extra permission prompt
- C) `Bash` is categorically disallowed inside any skill, regardless of configuration
- D) `allowed-tools` doesn't actually restrict anything; a skill can use any tool available to the parent session

**Q20.** A developer is deep into a four-hour refactoring session, having created 25+ new utility functions along the way. The session started with an explicit constraint: "every new utility function must include a full parameter/return-type doc comment." Around the three-and-a-half-hour mark, Claude quietly stops following that convention and starts writing bare one-line comments on new utilities instead. The developer doesn't want to restart and lose the accumulated refactoring context. What's the most effective fix?

- A) Restart the session to reset context and re-establish the constraint from scratch
- B) Maintain a short scratchpad file stating the doc-comment constraint explicitly, and have Claude check it before writing a new utility, giving the rule a durable anchor outside the flow of an increasingly long conversation
- C) Increase `max_tokens` so Claude has more room to "remember" the constraint
- D) Repeat the constraint verbally in the chat with extra emphasis whenever it's noticed slipping

---

## Scenario 3: Multi-Agent Research System

**Q21.** A research coordinator runs a fixed pipeline — search, then analyze, then synthesize, then report — with no step in between that re-evaluates whether coverage is actually adequate. On topically broad requests (e.g., "AI regulation across multiple jurisdictions"), the resulting reports keep coming back with real regional gaps, even though every individual subagent completed its assigned piece without error. What architectural change addresses this?

- A) Give the search subagent access to more search tools so it can generate extra results upfront
- B) After synthesis, have the coordinator evaluate whether real coverage gaps remain and, if so, conditionally spawn targeted follow-up searches before finalizing the report
- C) Simply increase the number of initial parallel search queries at the start
- D) Let each subagent decide on its own whether to spawn additional follow-up investigations

**Q22.** A coordinator runs three subagents in parallel — web search, document analysis, and source synthesis — then passes all three outputs into a single, very long block of text for a final synthesis pass. The resulting report draws heavily on the search and document-analysis findings, but almost never references the source-synthesis subagent's output, even though that subagent completed successfully and returned substantive material. What's the most likely cause?

- A) The third subagent's output was never actually included in what was sent to the final synthesis step
- B) A separate follow-up turn is required before synthesis can incorporate a third input source
- C) The third subagent's findings ended up buried in the middle of a very long combined prompt, with nothing structurally marking them as important, so they got less attention than the material at the start and end
- D) The document-analysis subagent's output silently overwrote the third subagent's data before synthesis ran

**Q23.** A coordinator has access to a `discover_available_sources` tool that returns a static, pre-curated catalog of about 150 approved research sources. In practice, the coordinator calls this tool near the start of almost every research task just to see what's available, before doing anything else — an extra round-trip nearly every time, for content that barely changes. What's the most appropriate fix?

- A) Improve the tool's description so its purpose is clearer
- B) Expose the source catalog as an MCP **resource** instead of a tool, since it's read-only reference material the coordinator needs to see, not an action the model is actively deciding to take
- C) Force `tool_choice` so the discovery call always happens as the very first step
- D) Hard-code the entire source list directly into the coordinator's system prompt

**Q24.** A coordinator delegates "research recent regulatory changes on topic X" to one subagent and "research historical precedent for topic X" to a second subagent, reusing the exact same prompt template for both and only swapping the topic phrase. The "recent changes" report later turns out to reference "established historical patterns" and "prior precedent," despite being explicitly scoped to recent developments only. What's the most likely cause?

- A) The two subagents share some kind of common memory pool that lets findings bleed between them
- B) Reusing the identical prompt template for both tasks carries unintended thematic association from one into the other — the shared phrasing, not any shared state, is what's pulling "precedent" language into the recent-changes report
- C) The coordinator's own system prompt wasn't specific enough to keep the two request types apart
- D) The two delegations should have run sequentially instead of in parallel

**Q25.** In a coordinator's pipeline, the report-generation subagent is meant to run only after the synthesis subagent has returned its findings — but the pipeline itself has no runtime mechanism enforcing that order, only an implicit assumption. During testing, report generation occasionally starts before synthesis has actually completed, producing polished-looking sections with citations that can't be verified against anything synthesis was supposed to have vetted. What's the most reliable way to prevent this?

- A) Add explicit ordering language to both subagents' own system prompts
- B) Add a hook on the coordinator's dispatch step that blocks a report-generation call from proceeding until synthesis's result is actually present
- C) Add several few-shot examples showing the two steps happening in the correct order
- D) Increase the coordinator's context window so it "remembers" the intended order better

**Q26.** A synthesis subagent frequently needs to verify simple facts mid-synthesis — a publication date, an author's name, a cited statistic — and today every single one of these routes through the coordinator to a full search subagent and back, even though roughly 85% of these checks are genuinely simple lookups. The remaining 15% require real investigative depth. What's the best fix?

- A) Give the synthesis subagent unrestricted access to the same full search and analysis tools every other subagent uses
- B) Give the synthesis subagent one narrowly scoped `verify_fact`-style tool for the common, simple case, while still routing the rarer, genuinely complex checks through the coordinator
- C) Batch every verification and run them all in one dedicated pass only after synthesis has otherwise finished
- D) Drop fact verification from the synthesis step entirely to reduce latency

**Q27. (Select TWO)** A synthesis step processes findings drawn from 40+ source documents in one pass to produce a report outline. The result is coherent overall, but source-specific detail steadily disappears as the report goes on: early sections name exact publication dates and sample sizes, while later sections describe their sources only in vague, generic terms. Which TWO changes would most directly improve this?

- A) Require every source to carry structured metadata (date, methodology, sample size) and require the synthesis output to preserve that metadata alongside whatever claim it's attached to, rather than letting it fall away during synthesis
- B) Process all 40+ sources within a single, maximally long context window, on the theory that more surrounding text improves coherence
- C) Require subagents to hand off structured claim-source mappings (claim text, source, date, a short excerpt) that synthesis is required to preserve rather than paraphrase away
- D) Add a coordinator-level quality gate that checks the finished report for citation mismatches before it's considered final

**Q28.** A search subagent times out partway through and returns structured context: "provider timeout, transient, retryable, 60 of an expected 150 results collected." The coordinator now has to decide whether to return the partial 60 results, retry, or escalate to a human. What should actually drive that decision?

- A) Always return the partial results immediately, since some information beats none
- B) Always escalate, since any incomplete research inherently needs a human to weigh in
- C) Judge whether the 60 results already collected are enough to satisfy what the user actually asked for; if the missing 90 would plausibly change the conclusions, retry or escalate instead of quietly returning a report built on an incomplete picture
- D) Keep retrying indefinitely until the full 150 results are eventually collected

**Q29.** A document-analysis subagent hits transient errors (timeouts, rate limits) reasonably often, and the coordinator's current policy is simply "retry once, then fail the whole run." As a result, roughly 8–10% of research runs fail outright because of one subagent's temporary hiccup. What's a more effective error-recovery design here?

- A) Retry every subagent indefinitely until it eventually succeeds, no matter how long that takes
- B) Use a graduated retry policy with exponential backoff (e.g., 100ms, then 500ms, then 2s) up to a small fixed attempt limit, and only then escalate or continue with a documented partial result
- C) Remove retries entirely and fail the run immediately on the very first transient error
- D) Always escalate any transient error straight to a human without attempting any recovery first

**Q30.** A synthesis pass works through 50 research documents in one long invocation to build a report outline. Reviewers notice a clear pattern: the first 15 sources are cited with real specificity (exact dates, study design, sample sizes), while by document 40 the synthesis is only extracting broad, generic themes. Early report sections are well-supported; later ones are coherent but noticeably vaguer about their sources. What's the most effective architectural fix?

- A) Increase the context window so the model can hold onto specificity across all 50 documents at once
- B) Split synthesis into two phases: a "map" phase that extracts detailed, specific claims from each source independently, followed by a "reduce" phase that reconciles and synthesizes across those per-source outputs
- C) Simply process fewer source documents per run, trimming to whatever the model's effective attention span seems to be
- D) Have the model attach a confidence score to each claim and drop everything below a cutoff from the final report

---

## Scenario 4: Developer Productivity with Claude

**Q31.** A code-search MCP tool intermittently returns timeouts, but the agent has no way to tell whether a retry is likely to help or whether the underlying query itself is simply malformed — every failure comes back as `{"isError": true, "message": "Operation failed"}`. As a result, the agent sometimes retries a hopeless malformed query indefinitely, and sometimes gives up too early on a call that would have succeeded with one more attempt. What's the most direct fix?

- A) Add an internal timeout to the tool itself so it fails faster on every kind of error
- B) Add `errorCategory` (e.g. "transient" vs. "validation") and an `isRetryable` boolean to the tool's error responses, so the agent has an actual basis for deciding whether to retry
- C) Remove the tool and have the agent fall back to `Grep` instead
- D) Add a system-prompt instruction telling the agent to "always retry timeouts, never retry validation errors"

**Q32.** A `list_available_migrations` MCP tool returns a catalog of known database migrations. An agent calls it near the start of nearly every migration-related task just to see what's available, before doing any real analysis — an extra round-trip each time for content that's largely static within a session. What's the most efficient fix?

- A) Remove the tool from the agent's available tools and require the migration to be named explicitly upfront in every request
- B) Expose the available migrations as an MCP **resource** the agent can read directly, without spending a tool-call decision on pure discovery
- C) Merge every migration-related tool into one larger, more general tool
- D) Cache the tool's result in `CLAUDE.md` so at least the second call within a session can be skipped

**Q33.** An MCP server offers `list_all_tasks` (returns every task in the system) and `search_tasks` (filters by keyword). Agents sometimes still reach for `list_all_tasks` on large task inventories when `search_tasks` would clearly serve better — most often on genuinely ambiguous requests like "find tasks updated in the last week." The team has already rewritten both descriptions with explicit use/non-use guidance and example queries, and the remaining mistakes are concentrated in exactly these edge cases. What's the next lever to try?

- A) Remove `list_all_tasks` from the toolset entirely
- B) Add 2–3 few-shot examples with explicit reasoning showing correct tool selection specifically for these ambiguous, edge-case queries
- C) Rename `search_tasks` to something that sounds more appealing
- D) Force `tool_choice` so `search_tasks` is always selected regardless of the request

**Q34.** An MCP tool `compute_code_metrics` bundles three distinct capabilities — complexity scoring, test-coverage percentage, and dependency counting — behind one generic description that lists all three. A much lighter, purpose-built `count_functions` tool also exists for the narrower job of just counting functions, and is meaningfully faster for that specific need. Logs show agents reaching for the heavier, generic tool even for requests the lightweight tool would answer just fine. What's the issue, and the fix?

- A) `compute_code_metrics` is simply too slow and should be deprecated
- B) The generic tool's description gives no signal about when a narrower, faster tool would serve better, so it reads as the safe general-purpose default; the fix is making that boundary explicit in the descriptions
- C) The model needs more few-shot examples covering this exact case
- D) The two tools should be merged into a single combined tool

**Q35.** An MCP tool `fetch_repository_metadata` returns a repo's `package.json` contents, top-level README, and directory-tree structure — data that essentially never changes within a session. A productivity agent calls it near the start of almost every codebase-exploration task, adding latency to every single session even though the underlying data was already fetched the last time. What's a more efficient design here?

- A) Embed the metadata directly into the system prompt for every session
- B) Cache the metadata inside the agent's `CLAUDE.md` file
- C) Expose the repository metadata as an MCP **resource** instead of a tool, so it can be referenced directly without a tool-call decision each time
- D) Require developers to paste the metadata into their initial request manually

**Q36.** A code-complexity MCP tool expects a single file path and returns detailed per-function metrics. On a vague request like "analyze the whole codebase," the agent sometimes passes a directory path by mistake, and the tool responds with an enormous combined JSON blob covering every file in that tree — overwhelming the context window and burying whatever signal actually mattered. What's the best way to prevent this?

- A) Validate the input inside the tool itself — reject anything that isn't a single file path, with a clear error explaining the expected input shape
- B) Add a `PostToolUse` hook that trims the response down to top-level metrics after the fact
- C) Expand the tool's description with a warning against passing directories
- D) Remove the tool and require this kind of analysis to be done manually instead

**Q37.** A productivity agent has 22 tools available at once — a handful of built-ins plus 19 different MCP integrations for code analysis. Given the narrow task "find memory leaks in this service," evaluation runs show the agent frequently reaching for debugging, profiling, and monitoring tools in various combinations, and only occasionally landing on the one static-analysis tool that's actually best suited to this exact job — a tool that, used alone, produces better results 80% of the time in manual comparisons. What does this pattern suggest, and what's the fix?

- A) The prompt needs clearer language specifically about memory-leak detection
- B) Too many simultaneously available, similar-looking tools increase selection complexity; narrowing which tools are actually available for this kind of focused task (rather than leaving all 22 live at once) directly reduces the chance of picking a worse combination
- C) The static-analysis tool's description needs to be more generic so it stands out less
- D) The agent needs a larger context window to properly weigh all 22 options

**Q38.** An MCP server exposes `fetch_openapi_spec` (the full spec, on the order of 200KB) and `search_api_endpoints` (a keyword-filtered search over endpoint definitions, typically a few KB). For a query like "find the endpoint that returns user profiles," logs show the agent frequently pulling the entire spec and searching through it manually, when the dedicated search tool would answer the same question directly. Both tools work correctly and neither is erroring. What's the most direct fix?

- A) Remove `fetch_openapi_spec` since the search tool is more efficient
- B) Make `fetch_openapi_spec` return only a summary instead of the full document
- C) Sharpen `search_api_endpoints`'s description to explicitly explain when it's the better choice over fetching the whole spec, with example queries it handles well
- D) Raise the model's temperature to encourage broader tool exploration

**Q39.** A generic `refactor_code` tool handles three unrelated jobs — renaming symbols globally, restructuring module boundaries, and updating dependency declarations — and CI/CD runs occasionally apply the wrong one of the three (e.g., a symbol-rename operation gets applied where a module-boundary restructure was actually needed, causing cascading breakage). The team splits it into three purpose-specific tools: `rename_symbols`, `restructure_modules`, `update_dependencies`. To further reduce the odds of the wrong tool being applied to the wrong kind of change specifically in CI/CD, what should also be added?

- A) A `PreToolUse` hook that inspects which of the three new tools is being invoked together with its target path, and blocks the call if that combination doesn't make sense for the kind of change actually being made (e.g., blocking a `rename_symbols` call whose target sits inside a migrations directory)
- B) Set `tool_choice` to force one specific tool for every CI/CD invocation, regardless of task
- C) Increase `max_tokens` so the agent has more room to reason before choosing
- D) Move all refactoring guidance out of `CLAUDE.md` and into a custom `/refactor` skill that must be invoked manually every time

**Q40.** A coordinator splits codebase exploration across several subagents, each with `Read`, `Grep`, and its own specialized MCP tools. When something goes wrong, the three subagents report failures in three different shapes: one returns structured JSON with `error_type`/`is_recoverable` fields, another returns free-text error prose, and a third returns an empty result set marked as a plain success. The coordinator's recovery logic can't reliably decide whether to retry, escalate, or proceed with partial data, because it's working from three incompatible failure formats. What should be fixed first, and why does it span two domains at once?

- A) Add normalization logic inside the coordinator that translates all three formats into one internal shape
- B) Standardize what every subagent's underlying tools report on failure — a consistent `errorCategory`, `isRetryable`, and actionable context — which is a tool-design fix that in turn is what makes a reliable, consistent coordinator-level retry/escalation policy possible in the first place
- C) Merge all the subagents into one larger agent so there's only one place errors can come from
- D) Give each subagent its own `PostToolUse` hook that normalizes its own errors before reporting back to the coordinator

---

## Scenario 5: Claude Code for Continuous Integration

**Q41.** A CI review agent must only ever perform read operations — `Read`, `Glob`, `Grep` — and should never be able to modify files, run shell commands, or reach out through any MCP tool, no matter who runs it or how the invocation is configured. The team wants this enforced consistently for every developer who clones the repo, not left to individual discipline. What's the most direct mechanism?

- A) Add a prominent note in `CLAUDE.md` instructing Claude to avoid `Write` and `Bash`
- B) Add a broad-matcher `PreToolUse` hook in `.claude/settings.json` that intercepts every tool call and manually re-implements the same allow logic each time
- C) Configure permissions in `.claude/settings.json` so only `Read`, `Glob`, and `Grep` are allowed and everything else is denied by default
- D) Remove `Write`, `Bash`, and every MCP tool from the project's tool registry entirely

**Q42.** A team runs five review agents in parallel across a large monorepo, each covering a different subsystem, then merges all five sets of findings into one consolidated PR comment. Which specific design choice here is what actually prevents the "a session reviewing its own generated code" bias?

- A) Running the analyses in parallel, since parallel work is inherently more thorough than sequential work
- B) Each of the five review agents is its own fully independent Claude Code invocation, carrying no context from whatever session originally generated the code under review
- C) Consolidating the five sets of findings afterward, which lets duplicate issues get filtered out
- D) Using JSON output format, which makes findings more reliable regardless of how the sessions themselves are structured

**Q43.** A review finding schema defines `{"violation_type": ..., "description": ..., "remediation": ...}`. Every finding validates against the schema successfully, but in practice, proposed fixes routinely end up written into `description` while `remediation` gets a vague one-liner like "add validation" — exactly backwards from what each field is meant to hold. The model clearly understands the JSON structure itself. What's the actual problem here?

- A) The fields should be marked required when they're currently optional; tightening that constraint will fix the mix-up
- B) The model understands the shape of the schema but not the intended purpose of each individual field; adding 2–3 few-shot examples showing correct field assignment per violation type teaches that distinction directly
- C) An `evidence_required` list should be added to force more precision automatically
- D) Force `tool_choice` onto the findings tool to remove any remaining ambiguity

**Q44.** Over three sprints, the "possible inconsistency in error-handling patterns" finding category has a 35% developer dismissal rate, while actual bug findings sit under 5%. The prompt already says "only report high-confidence issues." What's the most effective next step to protect developer trust in the review overall?

- A) Add even stronger wording: "be even more conservative about pattern consistency"
- B) Temporarily disable the specific "inconsistency" category, keep the well-performing categories (bugs, crashes, security) active, and only bring it back once its criteria have been tightened and re-measured
- C) Lower the model's temperature to make output more deterministic
- D) Require developers to write a detailed justification every time they dismiss a comment

**Q45.** Your team wants materially different review standards for code PRs (correctness, performance, security) versus documentation-only PRs (accuracy, link validity, tone), but both currently load the exact same root `CLAUDE.md`, so doc-only PRs end up getting flagged with irrelevant guidance about concurrency and database migrations. Where should the code-specific guidance move so it only loads when actual code files are involved?

- A) A `.claude/rules/code-standards.md` file with `paths` frontmatter scoped to source file patterns (e.g. `src/**/*.{js,ts}`), so it only loads when those files are actually being touched
- B) Two separate root files, `code-review-CLAUDE.md` and `docs-review-CLAUDE.md`, with CI deciding which one to load based on PR labels
- C) Move the code standards into an MCP tool the model can optionally call if it thinks it's relevant
- D) Leave everything in the root `CLAUDE.md` and trust the model to disregard whatever doesn't apply

**Q46.** A review job's MCP tool config in `.mcp.json` includes `"auth_token": "${COMPLIANCE_API_TOKEN}"`. The CI runner's job definition sets `COMPLIANCE_API_TOKEN` as an environment variable for the job overall, but the Claude Code invocation inside that job still fails to authenticate against the compliance tool. What's the most likely cause?

- A) `.mcp.json` doesn't actually support `${VAR}`-style expansion at all; the token needs to be hardcoded instead
- B) The variable is set at the CI job level, but the specific process Claude Code runs in doesn't automatically inherit it unless it's actually exported into that process's own environment before Claude Code starts
- C) The MCP server's URL is misconfigured
- D) Claude Code's permission system is independently blocking this specific MCP tool

**Q47.** A PR accumulates new commits as a developer responds to earlier feedback. Each commit triggers a fresh review run, but because upstream lines were deleted, several newly-generated findings reference line numbers that belonged to the *previous* commit's version of the file — so a comment reading "line 215 has a concurrency bug" now points at code that isn't even related to that issue anymore. How should the pipeline handle this across commits?

- A) Stop re-running review after the first commit and only ever review the final version once
- B) After each run, export findings (with their file/line references) to a state file; on the next run, before posting anything new, drop any previously-tracked finding whose referenced line no longer exists in the current diff, and only post genuinely new issues
- C) Regenerate a full-context diff and manually recompute every old line reference by hand before each new review
- D) Post every finding as-is, with a blanket disclaimer that line numbers may have shifted since it was originally flagged

**Q48.** A review schema includes a `performance_impact_ms` integer field. A finding claims "this change saves 15ms," and the JSON is perfectly valid with every required field present — but the PR in question contains no benchmark, profiler output, or any other measurement backing that number up; it's pure speculation dressed as data. The schema itself allows any integer. Where should a check for this actually go?

- A) Add stricter JSON-schema-level constraints that ban integers outside some plausible range
- B) Add a post-generation validation step that checks whether a performance claim is actually backed by concrete evidence present in the PR (a benchmark, a profiler trace, a measurement comment) before it's allowed to stand
- C) Remove the `performance_impact_ms` field from the schema entirely to eliminate the possibility of speculation
- D) Lower the model's temperature to reduce how speculative its claims are

**Q49. (Select TWO)** A CI review agent occasionally needs to explain *why* a finding matters using a short supporting quote from the relevant internal policy or style-guide document, in addition to producing its structured JSON findings for downstream automation. A teammate suggests enabling the API's citations feature alongside the existing JSON-schema tool-use output so every explanation comes with an auditable source excerpt. Which TWO statements about this idea are accurate?

- A) Citations and structured JSON tool-use output can't be combined in the same request; if grounded excerpts are needed alongside structured findings, the schema itself should include an explicit evidence/excerpt field instead
- B) The right fix is to add a `source_excerpt` (or similarly named) string field directly to the findings schema, populated from whatever policy text was actually provided in context, rather than trying to layer the citations feature on top of schema-enforced tool use
- C) Citations work seamlessly together with structured, schema-enforced tool-use output in the same request, so the teammate's suggestion can be implemented exactly as proposed
- D) Enabling citations will automatically populate every finding's `remediation` field with the correct fix, regardless of what schema is in use

**Q50.** Review standards genuinely differ by PR type — "breaking-changes" PRs need strict API-compatibility analysis, "performance-optimization" PRs need benchmarking evidence, "documentation" PRs need no code review at all — and a single do-everything prompt has become unmaintainable. The team wants to load the right guidance for the right PR type without hand-rolling a large conditional block inside one prompt. How should this actually be structured?

- A) Use shell environment variables in the CI job to swap in a different `CLAUDE.md` file depending on PR type before invoking Claude Code
- B) Add a `labels` field to `.claude/rules/` frontmatter so Claude Code automatically detects the PR's GitHub labels and loads the matching rule file on its own
- C) Create separate skills for each review type (e.g., `/review-breaking-changes`, `/review-performance`, `/review-docs`), each with its type-specific guidance built in, and have the CI job read the PR's actual labels (via the GitHub API) and invoke whichever skill matches
- D) Keep everything in one prompt and add `if`/`then` conditional logic to the review-invocation script itself

---

## Scenario 6: Structured Data Extraction

**Q51.** An expense-extraction schema requires an `approval_date` field on every document. Testing shows the model fabricates a plausible-looking date on cost estimates that explicitly say "to be determined upon approval" — documents that genuinely have no approval date yet — while purchase orders, which do contain a real approval date, extract that field correctly. What change best addresses this without losing the field where it's genuinely available?

- A) Make the field nullable across the board, for every document type
- B) Classify the document's subtype first (estimate vs. purchase order), and only require `approval_date` once that classification confirms it's the kind of document that should actually have one
- C) Add stricter validation requiring the date to match a known approver's signature date
- D) Lower the model's temperature to reduce fabrication

**Q52.** A vendor tax-ID field keeps returning plausible, correctly-formatted values that pass a regex check but fail when cross-referenced against the company's actual vendor registry — spot checks show some extracted IDs are off by a single digit from the real registered value. What change would most improve accuracy here?

- A) Make the field optional and validate it downstream instead of at extraction time
- B) Tighten the regex further to reject more implausible-looking formats
- C) Cross-check extracted tax IDs against the vendor registry before accepting them, or require a source-location/evidence field so the model has to point to exactly where in the document it read the ID
- D) Raise the model's temperature to encourage more varied output

**Q53. (Select TWO)** An extraction pipeline processes 50 supplier contracts as one long sequence of turns within a single conversation. Audit logs show a clear pattern: starting partway through the batch, some later contracts return a vendor name, payment term, or clause structure that actually belongs to an earlier contract in the same batch, not the one currently being extracted — roughly 7% of the batch shows this kind of cross-document leakage. Which TWO changes would most directly eliminate this?

- A) Process each contract as its own separate, isolated call rather than continuing all 50 within one shared conversation
- B) Split the 50-contract batch into several smaller batches (e.g., 10 contracts per conversation instead of 50)
- C) Add a validation pass that checks whether each extracted vendor name actually appears in that specific document's text
- D) Lower the model's temperature to reduce variance between extractions

**Q54.** A retry loop currently resends a failed extraction with only "please fix the invalid fields and try again." The actual validation failure is specific: `"line_items structure invalid: expected an array of {quantity: number, price: number} objects; received a mix of strings and nested objects."` Repeated retries keep failing on the same document. What change would most improve the retry success rate?

- A) Add 3–5 few-shot examples showing correctly structured `line_items`
- B) Include the original document, the failed extraction output, and the specific validation error message itself in the retry prompt
- C) Lower the model's temperature so retries are more conservative
- D) Increase `max_tokens` to give the model more room to reconsider

**Q55.** A contract-extraction pipeline requires a `dispute_resolution_clause` field. Testing shows 11% of extractions return null for it even though human review confirms the clause is genuinely present — consistently on pages 6–8 of longer, multi-page contracts. Logs show the model's actual output starts trailing off in detail around page 4, well before those later pages get proper attention, and `max_tokens` is already set high enough that raising it further would meaningfully increase cost. What's the best way to reliably capture required fields that live late in long documents?

- A) Make the field optional instead of required
- B) Keep raising `max_tokens` regardless of the cost impact
- C) Run multi-page documents through extraction in two separate passes — one focused on early-page fields, one focused on fields expected later in the document
- D) Ask the upstream system to strip contracts down to only their early pages before extraction

**Q56.** Two extraction tools — one for software license agreements, one for software purchase orders — both have clear, detailed descriptions with examples and non-examples. Documents that are genuinely both at once (e.g., "we are purchasing 50 seats of Software X under the following license terms...") still get routed to the wrong single tool often enough to cause schema mismatches, and neither more prompt clarification nor more few-shot examples has closed the gap. What architectural change would most reliably handle documents that are genuinely, structurally ambiguous like this?

- A) Add an explicit document-type classification step first — licensing, purchase, or hybrid — and route based on that classification's result rather than asking either extraction tool to also do double duty as a classifier
- B) Switch from `tool_choice: "any"` to `"auto"` so the model can decline to extract at all if it's unsure
- C) Force `tool_choice` to always select one specific tool (say, the purchase-order tool) regardless of content
- D) Merge both tools into a single, multi-purpose extraction tool

**Q57. (Select TWO)** A QA process auto-approves high-confidence extractions and sends low-confidence ones to human review. Audits find real errors slipping through in both directions — some high-confidence extractions turn out to have values with no real basis in the document, and some low-confidence ones sent to review turn out to have actually been correct all along. Which TWO additional checks would best catch the specific class of problem that confidence scoring is missing here?

- A) Route to review if the extracted vendor name doesn't actually appear anywhere in the source document's text
- B) Route to review if extracted dates fail a basic business-rule check (e.g., a renewal date that falls before the effective date)
- C) Lower the confidence threshold so a larger share of extractions get routed to review, without adding any new structural check
- D) Route to review whenever the source document is flagged as handwritten or heavily scanned, based on OCR metadata alone

**Q58.** A team processes 8,000 invoices daily. Processing currently kicks off at 2 PM and results must be loaded into the accounting system by 5 PM the same day — a roughly 3-hour window. A cost-reduction proposal suggests moving this workload to the Message Batches API to capture a real cost discount. Is this workflow, as currently timed, a good fit?

- A) Yes — process the full daily batch via the Batches API; the window will comfortably cover it
- B) Partially — only use the Batches API for the portion submitted early enough in the day that a worst-case delay still lands before 5 PM, and keep the rest on synchronous calls
- C) No — the Batches API has no latency SLA and can, in the worst case, take up to 24 hours; that's fundamentally incompatible with a same-day, hard-deadline workflow like this one, so it should stay on synchronous calls entirely
- D) Yes, but only if every individual invoice document stays under a certain file size

**Q59.** A schema extracts procurement data from both supplier quotes and purchase orders, and adds a new `bulk_discount_percentage` field meant to apply to both — but many real quotes and purchase orders simply don't have a bulk discount at all. Because the field is marked required, the model fabricates a plausible discount percentage whenever the source document doesn't actually mention one. What change most directly fixes this?

- A) Make the field optional/nullable, so its genuine absence in a source document no longer forces the model to invent a value
- B) Change the field to a free-text string that can describe a discount in prose, e.g. "10% off for bulk orders"
- C) Build entirely separate schemas for quotes and purchase orders, each handling discounts independently
- D) Remove the field from the schema and compute any discount downstream from other extracted values instead

**Q60.** A team processes 4,000 invoices weekly and already categorizes extraction errors by type — "date format inconsistency" (6%), "currency mismatch" (4%), "line-item count off by one" (3%) — but has no way to tell whether, say, date errors cluster around handwritten invoices, particular vendors, particular countries, or scanned-vs-native documents. That makes it hard to know where to actually invest effort on the prompt or validation rules. What should be added to the structured output to make that kind of root-cause analysis possible?

- A) A random UUID attached to each extraction, purely for tracing a record back to its source
- B) A `source_metadata` field recording document characteristics alongside each extraction — format (handwritten/scanned/digital), an OCR-confidence signal where relevant, vendor name, and vendor country — so errors can actually be grouped and analyzed by the characteristics of the input that produced them
- C) A free-text note field where the model can explain its own extraction in its own words
- D) A counter tracking how many retries a given extraction needed before it succeeded

---

*End of Exam 6. Check your answers against the [Answer Key](exam-6-answers.md).*
