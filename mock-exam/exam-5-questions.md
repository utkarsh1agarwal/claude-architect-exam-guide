# Mock Exam 5 — Questions (Hard Mode)

> Every question here is original material written against the public CCAR-F blueprint — none of it is drawn from or paraphrased from real exam content. See [CONTRIBUTING.md](../CONTRIBUTING.md#the-one-hard-rule) for why that boundary matters and how to add more questions the right way.

## How to take it

- **Full 6-scenario coverage, like Exams 1 and 4** — 60 questions, 10 per official scenario, so every domain area gets drilled regardless of which 4 scenarios the real exam draws for you.
- **Difficulty: HARD**, same calibration as [Exam 4](exam-4-questions.md) — finer mechanism-level distractors, denser scenario stems, a few SLA/timing calculations, and select-two items. This set draws on a different, larger pool of source material than Exam 4, so it's a good second hard-mode pass once you've exhausted that one.
- **Set a timer for 120 minutes anyway.** The time pressure doesn't go away just because the questions get harder.
- **No notes, no search, no assistant.** Simulate real conditions as closely as you can.
- Four items are marked **"(Select TWO)"** — treat these as multiple-response; you must get both parts correct to receive credit.
- Score yourself against [exam-5-answers.md](exam-5-answers.md) afterward. Anything you missed, go back to the relevant [study guide](../study-guide/) domain page and re-derive the mechanism yourself — don't just read the rationale and call it learned.

## Scoring guide

Rough gut-check only — and *don't* benchmark it against Exams 1–3's bands or the real exam's scaled 720/1000 cut. This set is intentionally harder than the real thing, so a lower raw score here is expected and normal.

| Raw score (out of 60) | Rough read |
|---|---|
| 45+ | Strong — you're holding up well against distractors sharper than the real exam is likely to throw at you |
| 33–44 | Solid foundation, but the domains where you missed clusters of questions need another pass before you sit Exam 1/2/3 or the real thing |
| Below 33 | Expected on a first attempt at hard mode — this is a diagnostic, not a verdict. Go re-drill the missed domains, then retake |

---

## Scenario 1: Customer Support Resolution Agent

**Q1.** Your support agent has an intake subagent that classifies incoming requests (simple: tracking/password/status | complex: refund/damage/billing), and an investigation subagent that handles complex cases. The intake subagent correctly marks requests as "simple" about 85% of the time, but 40% of requests marked simple still reach the investigation subagent, adding unnecessary latency. The system prompt says "skip investigation for simple cases," but logs show it's ignored. What's the most reliable fix?

- A) Increase the intake classification model's temperature to make decisions more decisive
- B) Add a step in the coordinator that reads the intake classification and only invokes the investigation subagent for cases marked complex
- C) Include 5 few-shot examples in the intake prompt showing requests classified as simple
- D) Increase the token budget for the intake subagent so it has more confidence in its decisions

**Q2.** Your `process_refund` and `request_refund_exception` tools have descriptions: "Process a refund" and "Request an exception for refund eligibility." Both accept the same inputs (order_id, amount, reason). The agent calls the wrong one 25% of the time on policy-edge cases. You've already tried improving the descriptions with input formats, but misrouting persists. What's the next step on the fix ladder?

- A) Add 8 few-shot examples showing correct tool selection for ambiguous cases
- B) Rename `request_refund_exception` to `escalate_refund_exception_review` and add explicit "use this when policy does NOT allow the refund" guidance
- C) Merge both tools into one and add an internal `action: "approve" | "request_exception"` input parameter
- D) Split the tools into separate subagents, each with their own tool, to eliminate the choice entirely

**Q3.** After 12 turns investigating a disputed charge, your agent has verified the customer, retrieved three years of billing history, and identified the root issue ($200 overcharge on order #7743 from March). But when asked to "process the refund," it hesitates and asks "just to confirm, the order with the issue was...?" instead of recalling the specific order number. What's the problem, and how should it be fixed?

- A) The model's context window is too small; increase it to preserve history better
- B) Extract a persistent "case facts" block containing critical details (customer ID, order number, issue amount, dates) that's carried separately from the narrative conversation history
- C) Reduce the number of turns allowed before summarization
- D) Require the customer to re-state the order number before proceeding

**Q4.** You've split the support system into a coordinator plus two subagents: one for order investigation and one for risk assessment. A case arrives: "I want a $500 refund due to damaged goods." Both subagents run, but the coordinator receives only risk-assessment findings ("Low risk, proceed") and no findings from the order-investigation subagent. Production logs show the order-investigation subagent ran but hit a backend timeout. The coordinator can't distinguish "no issues found" from "investigation failed," so it proceeds with incomplete information. What change would best solve this?

- A) Restructure the case so order investigation always runs first, and risk assessment only if investigation succeeds
- B) Require both subagents to output a status field indicating success/failure/partial, plus structured error context (`errorCategory`, `isRetryable`) when something goes wrong
- C) Merge the two subagents into one
- D) Add a retry loop in the coordinator that automatically re-invokes failed subagents

**Q5.** The MCP backend exposes tools that list available refund policies, approved return-reason codes, escalation-queue names, and supported regions. In production, every new case triggers 4 discovery tool calls to learn what exists, consuming roughly 800ms of latency before any customer-specific lookup happens. These lists change weekly but are read-only. Logs show the agent burns token budget on discovery before it can act. What's the most appropriate integration change?

- A) Cache the tool outputs in a `CLAUDE.md` file so the agent reads them once
- B) Expose these catalogs as MCP **resources** (URI-addressable reference data) rather than **tools**, so the agent can read them directly without consuming a model decision or a round-trip
- C) Create a single `get_system_metadata` tool that returns all four catalogs at once
- D) Require the agent to skip discovery entirely and rely on its training knowledge of policies

**Q6.** A case is escalated to a human agent with a 72% confidence score and a note saying "case seems complex." But investigation shows: customer identity is verified, order exists, refund window is open, damage evidence is clear, and refund amount is within policy. The escalation was triggered by an engineer's "confidence < 80% → escalate" rule. The confidence actually dropped to 72% only because the agent was uncertain whether a small warehouse fee was refundable, not because the case itself was complex. What's fundamentally wrong with this escalation signal?

- A) The confidence threshold is too strict; raise it to 60%
- B) Self-reported model confidence is poorly calibrated — it correlates weakly with actual case complexity and can be confidently wrong on the easiest cases while uncertain on genuinely simple ones
- C) Confidence scores should be averaged across the whole case, not reported per-turn
- D) Use turn count instead of confidence; escalate after 6 turns regardless of complexity

**Q7.** A customer asks, "Can you process my refund now?" The agent's response includes a tool-use block for `process_refund` with correct parameters, but the response text also says "I've processed your refund — you should see it in 3–5 business days." The application's agentic loop terminates after seeing this final text and never executes the pending tool call, so the customer gets a confirmation message but no refund is actually issued. What's the design flaw?

- A) The model should never generate customer-facing text in the same response as a tool call
- B) The loop must check whether `stop_reason` is `"tool_use"` to know a tool call is pending; if so, it must execute the tool and continue the loop rather than treating the response as final just because text is also present
- C) The response should be split into two separate API calls to avoid mixing concerns
- D) Add a deterministic check for phrases like "processed" in the text to prevent premature loop termination

**Q8. (Select TWO)** Your tools `validate_refund_eligibility` (checks policy, return window, customer history — slower, high compute) and `quick_eligibility_check` (under-48-hours, no prior returns — fast, lightweight) are frequently chosen incorrectly for each other's use case. Additionally, both tools return a generic `{"error": "backend unavailable"}` for timeouts, invalid input, and permission errors alike, so the coordinator can't distinguish retryable from non-retryable failures. Which TWO changes would best improve reliability?

- A) Consolidate into a single tool with a `check_level: "quick" | "full"` input parameter
- B) Expand both tool descriptions with explicit use cases: e.g., "`quick_eligibility_check`: under-48-hour simple returns only; `validate_refund_eligibility`: all other cases, including policy exceptions"
- C) Structure error responses to include `errorCategory: "timeout" | "validation" | "permission" | "policy"` and `isRetryable: true | false`
- D) Give both tools identical descriptions so the agent has flexibility in choosing

**Q9.** Production analysis shows an inverted pattern: simple requests (resend tracking link, password reset) are escalated 35% of the time, while complex policy cases (international damage claims, subscription billing disputes) are resolved autonomously 28% of the time — both wrong outcomes. Investigation reveals the agent escalates using a heuristic: "if the conversation has more than 5 turns, escalate." But simple cases often need 6–8 turns for data gathering (a customer didn't provide an order number initially, or an email needed clarifying), while some policy cases resolve in 3–4 turns given the right expertise. Why is this heuristic unreliable, and what should replace it?

- A) Use conversation length but adjust the threshold per case type; simple cases get a higher turn limit
- B) Escalation should be based on explicit, measurable criteria — policy ambiguity in the documentation, required customer data the customer can't provide, or conflicting information from backend systems — not proxy metrics like turn count
- C) Escalate only when the model's confidence score drops below 50%
- D) Always escalate cases with more than 4 tool calls, since tool-call count indicates complexity

**Q10.** A coordinator invokes a refund-decision subagent with a highly prescriptive prompt: "Check if customer is verified AND order exists AND refund window is open AND damage evidence is provided. If all true, approve. If any false, escalate. If customer is verified but evidence is unclear, gather more details." On standard, well-documented cases this works, but on unusual cases (a customer claims damage but has no photo, or the return window is ambiguous due to international shipping), the subagent either escalates unnecessarily or asks for details the coordinator already tried to gather. What's the architectural flaw?

- A) The subagent needs the full conversation history passed explicitly
- B) The prompt over-specifies decision steps with rigid if-then-else logic, leaving no room for the subagent to reason about nuanced cases; it should instead receive investigation tools and clear decision criteria, but be allowed to assess independently whether those criteria are met
- C) The coordinator should call a different subagent for unusual cases
- D) The refund-decision subagent shouldn't have access to investigation tools at all

---

## Scenario 2: Code Generation with Claude Code

**Q11.** A team creates a `/generate-component` skill with `argument-hint` in its SKILL.md frontmatter, requiring a component-name argument. Invoking `/generate-component` without arguments prompts for the component name. Later, the team adds feature-flags as a second required argument and updates SKILL.md. Developers who start a brand-new session after the edit get prompted for both arguments; a developer who had a session open from before the edit only ever gets prompted for component-name, never feature-flags, for the rest of that session. Why do the prompts differ?

- A) `argument-hint` only supports a maximum of two arguments
- B) SKILL.md frontmatter is read once when a session starts; a session already running doesn't pick up an edit made to the file after that point
- C) The feature-flags argument name conflicts with a reserved keyword
- D) Developers need to manually run a reload command before new arguments take effect in any session

**Q12.** A `/refactor-tests` skill encodes a company's standard test-refactoring pattern. It was originally created at `~/.claude/skills/refactor-tests/SKILL.md` to test locally. Now 40 engineers need to use it consistently. What's wrong with the current location, and what's the correct migration path?

- A) Personal skills are faster; keep it at the user level and have each engineer copy the file manually to their own machine
- B) The user-level location is personal and not version-controlled; the skill should move to `.claude/skills/refactor-tests/SKILL.md` in the repo so every engineer inherits it via git and uses identical logic
- C) Create a duplicate at the project level while keeping the user-level version, so team members can use either
- D) Convert the skill into a slash command instead, since skills can't be shared across a team

**Q13.** During a long codebase exploration, a developer accumulates a large volume of context from verbose grep output, file reads, and traces. Claude starts answering vaguely — "typical patterns" instead of specific class names. The developer runs a context-compaction command with a verbose/debug flag enabled and sees no improvement; specific answers only return once they run the same command without that flag. Why did dropping the flag fix it?

- A) The compaction command requires two successive invocations regardless of flags; the first only validates configuration
- B) The verbose/debug flag re-expands the very content the compaction step is trying to condense, working against the goal; without it, the command can actually compact context and free up room for specific detail
- C) Compaction only takes effect if the session is fully restarted afterward
- D) The verbose flag is required for the compaction step to analyze context at all, so removing it should have broken the mechanism, not fixed it

**Q14.** A skill spawns a subagent with `context: fork` to explore third-party API documentation and produce a long reference document summarizing it. When control returns to the main session, the developer asks Claude to use that reference for code generation, and Claude says it has no knowledge of any such reference. What's the underlying issue?

- A) `context: fork` writes to an isolated temporary sandbox, and any file the fork creates never exists outside it
- B) A forked subagent's internal reasoning and any artifacts it produced are not automatically available to the parent session; whatever the fork returns as its final result must be explicitly passed back as context (or written somewhere the main session actually reads) for the main session to use it
- C) Subagents are not permitted to produce long-form output when `context: fork` is set
- D) The reference exists, but the developer must use a memory-inspection command to view fork-isolated outputs

**Q15.** A project has two `PostToolUse` hooks configured in `.claude/settings.json` for the same `Edit|Write` matcher: one runs a formatter, the other validates the edited file against the team's linter. After an edit, the formatter reformats the code, but the linter — which ran moments earlier, before the formatter — reports a false violation based on the pre-formatted version of the file. What's the most likely cause, and the fix?

- A) Multiple hooks on the same matcher fire in a nondeterministic order; the fix is to combine both actions into a single hook script so ordering can't vary
- B) The hooks are configured to run in an order where the linter executes before the formatter; the fix is to reorder them (or have the linter re-read the file after the formatter has run) so validation happens against the final, formatted version
- C) Hooks always run concurrently regardless of configuration, so this failure is unavoidable
- D) This is expected; the linter should be configured to tolerate whatever formatting prettier-style tools produce

**Q16.** A `/code-review` skill is configured with `allowed-tools: ["Read", "Grep"]` in its frontmatter, and the team's intent is that it must never be able to run Bash, even though Bash is enabled in the parent session. During a review, Claude suggests running a diagnostic script and requests to use Bash. What actually happens?

- A) The request is silently blocked, because Bash isn't in `allowed-tools`
- B) Claude can still request Bash — `allowed-tools` pre-approves the listed tools for frictionless use, it doesn't remove every other tool from what Claude may ask for — so the request goes through the normal approval path (or succeeds if Bash happens to already be broadly approved)
- C) The request is blocked only if the user is not present to approve it in real time
- D) `allowed-tools` and `disallowedTools` are equivalent; listing tools in one automatically excludes every other tool

**Q17.** A developer is implementing a distributed caching layer in a service they've never worked with before. They ask Claude to implement it directly, with a long, detailed prompt describing the desired behavior. After review, they discover the design doesn't account for TTL-based expiry, an important pattern in that service, forcing a rework. On a second, similar task in the same unfamiliar service, they instead ask Claude to first surface open design questions before writing any code; Claude asks about TTL handling, consistency guarantees, and cache scope, all of which shape the eventual implementation. Why did this approach work better here?

- A) Interviewing Claude before implementation always produces objectively better code, regardless of context
- B) In an unfamiliar domain where the relevant tradeoffs and constraints aren't already known, surfacing design questions before coding catches gaps that a single detailed upfront prompt is likely to miss, since the prompt-writer doesn't yet know what they don't know
- C) The interview approach is faster because it skips implementation
- D) The interview approach forces more thorough documentation as a side effect

**Q18.** A developer is refactoring a function signature used across 30 files and updating its 15 call sites. After 12 files, they discover the new signature breaks an edge case they hadn't planned for and need to work out a fix. Should they fork the session to explore the fix, or keep working in the main session?

- A) Fork the session to explore the fix in isolation, then bring the result back into the main refactoring
- B) Continue in the main session — it retains full context of the 12 files already changed, avoiding lost work; forking here would isolate the fix but strip away the surrounding refactoring context the fix actually needs
- C) Restart the whole task from scratch with updated requirements
- D) Forking is only appropriate for documentation work, never for code changes

**Q19.** A `.claude/rules/api-validation.md` file has frontmatter `paths: ["src/api/**/*.ts"]`, containing rules about validating all API inputs. A developer creates `src/api-client/index.ts` — a sibling directory, not a subdirectory of `src/api/` — and asks Claude to implement an API client there. The validation rules never apply to this file. Why?

- A) The glob `src/api/**/*.ts` only matches paths under `src/api/`; `src/api-client/` is a different directory that happens to share a name prefix, so the pattern simply doesn't match it — a broader pattern would be needed to cover both
- B) `.claude/rules/` files only apply to files that already existed when the session started
- C) Glob patterns are case-sensitive and the path casing doesn't match
- D) Rule paths require an exact directory match, and sibling directories are always excluded by design

**Q20.** A developer spends four hours refactoring a component library. Two hours in, Claude reads and correctly restates an explicit architectural constraint: "all async operations must use Suspense; no raw promises directly in JSX." At hour four, asked to add a new async feature, Claude writes a component that awaits a promise directly inside a `useEffect`, violating that constraint without comment. The developer points it out, Claude fixes it, and then the same category of violation resurfaces an hour later in a different component. What would most reliably prevent this recurrence?

- A) Restart the session every two hours to keep context "fresh"
- B) Maintain a scratchpad file (e.g., a running constraints doc) recording critical architectural invariants as they're discovered, and have Claude reference it before generating new async code — giving the constraint a durable source of truth instead of relying on it staying salient in a long, growing conversation
- C) Run a context-compaction command every hour regardless of what's happening
- D) Ask Claude to restate the constraint out loud every 30 minutes

---

## Scenario 3: Multi-Agent Research System

**Q21.** A coordinator needs to explore two mutually exclusive research hypotheses at once: one line of investigation assuming "policy X accelerates adoption" and another assuming "policy X has no measurable effect." Using ordinary named subagents, each spawned fresh with only its own hypothesis in its prompt, the coordinator still finds that reasoning clearly built on one hypothesis leaks into the write-up for the other — findings that should only make sense under "accelerates" show up justifying "no effect" too. What's the most direct fix for exploring genuinely incompatible branches like this?

- A) Add `allowedTools: ["Task"]` to the coordinator's configuration, since parallel spawn requires it
- B) Fork the session at the point where the branches diverge, so each hypothesis is explored in its own isolated copy of the accumulated investigation state, then compare the two forks' conclusions afterward
- C) Parallel `Task` calls cannot accept differing prompts; switch to strictly sequential delegation instead
- D) Have the synthesis agent automatically detect and remove cross-hypothesis contamination after the fact

**Q22.** A coordinator delegates "research the EU's approach to a regulatory topic" to a named search subagent, and later delegates "research the US's approach to the same regulatory topic" to that same subagent. In between, the coordinator's own conversation has built up 15 turns of discussion establishing shared terminology and which document sources are authoritative for this topic. The second delegation comes back sparse and generic, as if the subagent doesn't share any of that established framing. What's the most accurate explanation?

- A) Subagents automatically inherit the coordinator's full conversation history, so the sparseness must mean the second request itself was too narrow
- B) A subagent only receives what's explicitly included in its own invocation prompt; context the coordinator built up in its own conversation — terminology, source guidance — isn't automatically available to a subagent unless the coordinator restates it in that subagent's prompt
- C) The first delegation exhausted the subagent's usable sources, degrading the second
- D) Subagents share a temporary memory keyed by topic, but that memory had already expired between the two delegations

**Q23.** A synthesis agent constantly needs to fact-check small claims mid-report — "is 2023 the right year for that report," "did that agency actually issue this," "is this within the stated margin of error." Every check currently routes through the coordinator to a full-capability search subagent, adding a few seconds of round-trip latency each time, and the synthesis agent makes 80+ such checks per report. What tool-distribution change is most appropriate?

- A) Give the synthesis agent unrestricted access to the same web-search and document-analysis tools the other subagents use
- B) Give the synthesis agent one narrow, scoped tool built specifically for quick single-fact verification, so the common case resolves locally, while genuinely complex verification still routes through the coordinator
- C) Batch all 80+ checks into one large request sent to the coordinator at the very end
- D) Remove fact verification from the synthesis step entirely to save latency

**Q24.** A research pipeline runs parallel subagents, then sends their combined output straight to a report-writing step with no intermediate check. Reviewers later find citation mismatches (a claim attributed to one source that actually came from another) and outright contradictions between two sections of the same report. Every individual subagent's own output looks reasonable in isolation. Where is the defect, and what's the most effective fix?

- A) One specific subagent must have misattributed a source; re-run that subagent with stricter instructions
- B) The report-writing step is introducing the citation errors itself; add a citation-cleanup pass after report generation
- C) Add an explicit coordinator-level checkpoint that evaluates the combined findings against citation-accuracy and cross-section-consistency criteria before handing off to report generation
- D) The problem is in how tool responses format citations; normalize citation format with a hook

**Q25.** A coordinator launches three subagents in parallel — search, document analysis, and synthesis — for a request that fundamentally depends on reconciling conflicting findings across topics. Search and document analysis both succeed; synthesis crashes partway through with an unrecoverable internal error. The coordinator now has two successful results and one hard failure, for a task where the missing synthesis step was the part actually responsible for resolving the conflicts the user asked about. What should the coordinator do?

- A) Always return the two successful results as a partial report, since some information is better than none
- B) Reason about whether the failed piece was essential to what was actually asked — since here the synthesis step was the entire point (reconciling conflicts), a partial report without it would misrepresent the state of the research, so this case should escalate rather than quietly return partial output
- C) Retry the synthesis step exactly once more and return whatever it produces, succeed or fail
- D) Discard everything and start the whole three-subagent pipeline over

**Q26.** A document-analysis subagent is scoped to extract findings only from a fixed, pre-approved set of internal PDFs. To let it double-check facts against the source text, it's given general-purpose web-search access as well. Within weeks, logs show it routinely uses that web-search access to pull in and cite outside sources the coordinator never approved, expanding scope well past the original document set. What's the most direct fix?

- A) Remove web search entirely and tell the subagent, via the system prompt, to rely only on the approved documents
- B) Replace the general web-search tool with a narrowly scoped verification tool that can only check claims against the specific approved document set, not the open web
- C) Add a stronger prompt warning against using search to expand scope
- D) Let the coordinator strip out any external citations from the subagent's output after the fact

**Q27. (Select TWO)** A synthesis agent is combining three findings on the same projected metric: one from a widely-cited academic paper published years ago, one from a very recent single industry report with no other source corroborating it, and one that's been independently confirmed by three unrelated sources. As currently configured, the synthesis agent assigns its highest confidence to the uncorroborated single industry report simply because it's the most recent, and treats the triple-corroborated finding as merely "one opinion among several." Which TWO changes would most improve synthesis reliability here?

- A) Require every finding subagents pass to synthesis to carry its publication/collection date, methodology notes, and how many independent sources support it
- B) Instruct synthesis to prioritize whichever finding is most recent, regardless of how many sources support it, since newer information supersedes older information by default
- C) Have synthesis explicitly weight corroboration — a finding confirmed by multiple independent sources should be treated as stronger evidence than a single uncorroborated report, recency aside
- D) Instruct synthesis to exclude any finding that isn't from the most recent source, to avoid outdated information entirely

**Q28.** A multi-day research session is interrupted right after the search subagent finishes but before document analysis begins. The team wants to resume without re-running search from scratch. They restart the coordinator, and it sends document analysis a fresh prompt describing the new task — but never tells it what search already found. What's the most maintainable way to resume this kind of interrupted pipeline?

- A) Just resume and let document analysis redo any lookups it needs; some redundant work is an acceptable tradeoff
- B) Have each subagent export its completed state to a known location as it finishes, and have the coordinator load a manifest of that state on resume, re-injecting whatever a subsequent step actually needs
- C) Manually copy-paste the search subagent's raw output into every future prompt for the rest of the session
- D) Discard everything from before the interruption and start the whole pipeline over

**Q29.** A coordinator runs one named search subagent through three sequential, topically distinct tasks in a row — one on a renewable-energy policy, one on a nuclear-regulation topic, one on carbon pricing — clearing its own coordinator-side history between each. Even so, the response to the third task includes stray, unprompted references to the nuclear-regulation topic from the second task, and the second task's response likewise mentions the first task's subject in passing. Each individual response is factually correct about its own topic. Why is this happening?

- A) The coordinator didn't fully clear its own history, so the subagent must be inferring context from coordinator-side leftovers
- B) Even though each task is meant to be independent, if the coordinator reuses the same prompt template or phrasing pattern for all three Task invocations, that structural similarity — not shared state — is what's causing the model to draw an unintended thematic connection between them; the fix is to frame each invocation as a genuinely self-contained task
- C) The subagent is configured to automatically retain context across every invocation by default
- D) The underlying search tool is caching and returning stale results from the earlier queries

**Q30.** A team completes a multi-day research project on a fast-moving regulatory topic, citing a dozen sources. Two weeks later, they resume the same line of research to expand on one sub-topic, and simply re-inject all the prior findings as-is into the new session before continuing. A week after publishing the expanded report, they learn that two of the originally-cited sources have since been formally retracted or substantially revised, and the report's now-outdated claims are actively misleading readers. What practice would have caught this before publication?

- A) Store every source as a permanent, stable URL so readers can always find the original text themselves
- B) When resuming research after a significant time gap, explicitly validate whether previously-cited sources are still current before re-using them, rather than re-injecting old findings wholesale and treating them as still authoritative
- C) Have a policy of never citing anything more than six months old
- D) Re-run the entire original research pipeline from scratch every time any new work touches the same topic

---

## Scenario 4: Developer Productivity with Claude

**Q31.** An agent explores a repository using an MCP tool for definition lookup and another for call-site discovery. Some calls fail during a long exploration session, and the integration currently returns every failure as `{"isError": true, "message": "Tool unavailable"}`, whether the cause is a transient network blip, a malformed query, or a rate limit. The agent retries every failure the same way, sometimes looping for a long time on a query that will never succeed no matter how many times it's retried. What must be added to the tool responses to fix the retry logic?

- A) Raise the maximum retry count and add exponential backoff uniformly across all retried calls
- B) Log additional detail in the failure message so a human can read it later
- C) Add an `errorCategory` (e.g. transient / validation / permission) and an `isRetryable` boolean to each error response, so the agent can distinguish a worthwhile retry from a hopeless one
- D) Remove the retry mechanism entirely and fail immediately on any error

**Q32.** A shared catalog of approved integrations (REST APIs, webhook destinations, supported SDK versions) is exposed as an MCP tool, `list_integrations`. During a typical 2-hour exploration session, the agent calls this tool 15+ times just to check what's available, and each call consumes a tool-use decision step even though the underlying list rarely changes within a session. What's the most efficient way to expose this catalog?

- A) Merge several related discovery tools into one larger tool with a more detailed description
- B) Cache the tool's output into `CLAUDE.md` so the agent can reference it as static project memory
- C) Expose the integration catalog as an MCP **resource** rather than a tool, so it can be read directly without spending a tool-use decision each time
- D) Add the integration list as literal text in the system prompt

**Q33.** During analysis, an agent needs the contents of three unrelated source files as baseline context before proposing any changes. It currently reads file A, waits for the result, reads file B, waits, then reads file C — three sequential tool-use round trips for three independent, non-dependent reads. What change improves efficiency here without changing what's actually being read?

- A) Use a single Bash command to concatenate all three files with a shell glob instead of using the file-reading tool
- B) Emit all three read calls together in one response, as separate tool-use blocks, so the client can execute them concurrently and return all three results at once
- C) Split the analysis across three separate sessions, one file per session
- D) Keep reading sequentially, but cache each file's contents locally to avoid reading it again later

**Q34.** One MCP database tool returns `{"isError": true, "errorCategory": "transient", "isRetryable": true}` on one call and `{"isError": true, "errorCategory": "validation", "isRetryable": false}` on a different call. If the agent's recovery logic treats every error identically and simply retries both the same way, what actually happens?

- A) Both eventually succeed on retry; the transient one just takes a bit longer
- B) The transient failure may well succeed on retry, but the validation failure (a malformed query, say) will keep failing identically every time, since retrying with the same bad input doesn't fix the input — wasting attempts and context on a call retrying can't help
- C) Both fail regardless, and the agent should escalate both to a human immediately
- D) Neither will ever succeed, so all retries should simply be disabled everywhere

**Q35.** A developer-productivity agent has 22 tools available at once: 5 built-ins, 12 MCP tools for various kinds of code search (keyword search, cross-reference lookup, type-hierarchy exploration, and more), and 5 more for generating boilerplate. Logs show the agent occasionally reaches for a slower, more generic search tool when a faster, more specific one would clearly have been better — even after descriptions were already improved. What's the next lever to pull?

- A) Cut the least-used tools until the total count is 10 or fewer
- B) Switch to a model with a larger context window so tool-selection reasoning has more room
- C) Narrow which tools are actually available per task type — e.g. an exploration-focused pass gets only a handful of high-signal search tools, while an implementation-focused pass gets the editing and boilerplate tools — reducing the live decision space itself rather than relying on ever-better descriptions alone
- D) Build a separate preprocessing step that decides which tool to call before the agent ever sees the request

**Q36.** A system requires that all file modifications stay within an explicitly approved `workspace_root` directory. A developer asks an agent to "clean up unused dependencies," and without any programmatic boundary check in place, the agent occasionally ends up running Bash commands that touch directories outside that approved root. What is the most reliable way to enforce this boundary?

- A) Add a hook that runs after the Bash command completes, checking whether it touched an out-of-scope path and rolling back if so
- B) Have the agent itself run a path-check command before the real modification, as a self-imposed safeguard
- C) Add a prompt instruction stating the boundary rule and monitor logs afterward for any violations
- D) Add a hook that runs *before* the Bash tool executes, validates the target path against `workspace_root`, and blocks the command outright with feedback if it falls outside that boundary

**Q37.** An MCP tool call returns an error with `errorCategory: "permission"`. What does this most likely indicate, and what should the agent do next?

- A) The operation timed out and will likely succeed if retried with backoff
- B) The agent lacks sufficient authorization for this operation (missing credentials or an insufficient scope); retrying the same call won't change that outcome, so the right move is to escalate, request different credentials, or skip the operation rather than keep retrying
- C) The input was malformed and should be reformatted before retrying
- D) The operation actually succeeded, just with an empty result, and can be treated as a no-op

**Q38.** A coordinator delegates codebase analysis across three subagents — one traces API handlers, one traces database writes, one analyzes tests — and each returns its findings as free-form prose summaries. When an implementation-focused step later tries to act on those summaries, it struggles to cite exact file paths, line numbers, or code snippets, since the prose only describes what was found in general terms. What change most improves reliability downstream?

- A) Have the coordinator manually go back through the prose afterward and try to reconstruct file paths and line numbers from it
- B) Reduce the number of subagents to one or two so there's less to reconcile
- C) Require each subagent to return structured findings — the claim, the exact file path, a line range, and a short source excerpt — instead of unstructured prose, so precise attribution survives all the way through to the implementation step
- D) Merge every subagent's findings into a single combined document and have the implementation step search for the referenced code itself

**Q39.** A team wants a slash command that only ever operates on files matching a specific pattern (e.g., generated API client files under a particular directory), regardless of which developer runs it or what else is open in their session. They configure this by adding `disallowedTools` to the command's own definition to block file types outside that pattern. In testing, the command still successfully edits files outside the intended pattern when a developer runs it from a broader working context. What's actually going wrong?

- A) `disallowedTools` blocks entire tools (like `Edit` or `Write`) from being used at all — it has no concept of restricting a tool to only certain file paths, so it cannot enforce a pattern-based boundary on its own; a path-based restriction needs to be enforced elsewhere, such as through a hook that inspects the target path before allowing the edit
- B) `disallowedTools` only applies to MCP tools, never to built-in tools like `Edit` and `Write`
- C) The command definition is being overridden by a broader project-level configuration every time
- D) `disallowedTools` requires an accompanying `allowed-tools` entry to take effect at all

**Q40.** A developer-productivity agent needs to hand off from a broad, exploratory investigation phase to a narrow, high-precision code-modification phase for the same task, without losing the context gathered during exploration. Using two entirely separate agent definitions with no shared context would solve the tool-scoping problem but would also force the modification phase to start blind. What approach best preserves context while still narrowing tool access for the second phase?

- A) Keep a single agent and rely on prompt instructions to describe which tools are appropriate for which phase, without changing what's actually available
- B) Delegate the modification phase to a subagent that receives the exploration phase's key findings explicitly in its invocation prompt, and is scoped to a narrower toolset appropriate for making the actual edits — preserving continuity through the handoff while still tightening tool access for the higher-risk phase
- C) Run the whole task in one phase with all tools available throughout, since narrowing access isn't worth the coordination overhead
- D) Have the developer manually copy relevant findings into a new session before the modification phase begins

---

## Scenario 5: Claude Code for Continuous Integration

**Q41.** A CI pipeline runs two independent jobs against the same PR: one does a general code review, the other runs a security-focused scan. Each spawns its own separate Claude Code invocation, and both happen to flag the same underlying issue (a missing null check on one specific line). Each job posts its own PR comment, so the same line gets two near-identical comments from two different "reviewers." Developers complain about the redundant notifications. What's the most effective way to prevent this specific kind of duplication?

- A) Merge the two jobs into a single long-lived session so both sets of findings are produced together and can be reconciled before either is posted
- B) Have whichever job runs second receive the first job's findings on the same PR as part of its input, with an instruction to skip anything the other job already flagged
- C) Store every finding in a central datastore and run a deduplication pass across all findings from both jobs before anything is posted to GitHub
- D) Force the two jobs to run strictly one after the other rather than in parallel, so the second can read a results file the first one wrote

**Q42.** A test-generation step produces unit tests referencing a fixture path like `/opt/ci-fixtures/seed-data.json`. These tests pass on every developer's local machine, but roughly 60% of them fail once run inside the containerized CI runner, where that absolute path doesn't exist. What's the most likely root cause, and the most direct fix?

- A) The generated code assumes Unix-style paths; rewriting the tests to use Windows-style paths would resolve the CI failures
- B) The test-generation prompt was never told that fixture paths must be relative to the repository root, and the project's `CLAUDE.md` doesn't document the test fixtures, helper utilities, or test-data layout actually available in the CI environment — so generation has no way to know the local absolute path won't exist there
- C) CI containers mount volumes differently than developer machines; the fix belongs in the container configuration, not the generated tests
- D) The test-generation step runs with `context: fork`, which is why it can't see the rest of the repository

**Q43.** A code-review job outputs structured findings (`line_number`, `severity`, `description`) via enforced JSON schema output. Reviewing a sample of findings, several reference line numbers well outside the actual range of lines the PR touched — for example, a finding at line 287 on a PR that only modified lines 42–156. These out-of-range findings still get posted as PR comments, where they read as irrelevant noise. What's the most reliable way to stop out-of-bounds findings from being posted?

- A) Add an instruction to the review prompt: "only report findings within the changed lines of the diff"
- B) Before posting each finding as a comment, validate its `line_number` against the PR diff's actual line range, and discard (or hold for manual review) anything that falls outside it
- C) Switch to a larger model on the theory that it will have a better understanding of file scope
- D) Lower the sampling temperature so line numbers come out "more precise"

**Q44.** A `.claude/rules/security.md` file scoped with `paths: ["src/**/*.ts"]` contains guidance like "wrap all async operations in try/catch." Applied uniformly, this guidance also fires on test files such as `src/auth.test.ts`, where patterns like `expect(promise).rejects.toThrow()` are the idiomatic way to test a rejection and genuinely don't need a surrounding try/catch. Developers have started dismissing these findings as "doesn't apply to tests." What's the best way to separate production guidance from test-file guidance here?

- A) Add an informal exception clause directly into the security guidance's prose: "...except in test files"
- B) Add a second rule file scoped to test files specifically (e.g. `paths: ["src/**/*.test.ts"]`) containing test-aware guidance, so test files get conventions appropriate to tests instead of inheriting production-oriented rules wholesale
- C) Remove all path-scoped rules and rely solely on a single root-level project memory file for every convention
- D) Turn the security guidance off entirely until someone manually reviews every future finding

**Q45.** A test-generation prompt says "write thorough unit tests," and the resulting tests assert on implementation details — e.g. checking that a specific internal helper function was called a specific number of times — rather than on observable outcomes. The tests pass initially, but as soon as the implementation is reorganized (with identical external behavior), they break, generating churn complaints even though nothing user-facing changed. The prompt already includes "focus on behavior." What's the most effective next step?

- A) Lower `max_tokens` to force shorter, and hopefully simpler, tests
- B) Provide 2–3 concrete before/after examples contrasting an implementation-detail test with a behavior-driven test for the same function, and document the distinction as a standard in `CLAUDE.md`
- C) Switch to a larger model, expecting it to have an inherently better grasp of testing philosophy
- D) Have developers manually rewrite every generated test to remove implementation-detail assertions

**Q46.** A test-generation step is given the existing test file as context specifically to avoid creating duplicate tests. It still generates a new test with the exact same name as an existing one in that file — both are named identically. When the suite runs, the second definition silently overwrites the first, and the original test never executes again without anyone noticing. What's the most direct fix?

- A) Run the test-generation step multiple times and have a developer manually reconcile any conflicts
- B) Adopt a policy requiring every test name in the codebase to be globally unique, enforced by developer discipline
- C) Include an explicit list of the existing test names already present in that file as part of the context, with an instruction to avoid reusing any of them
- D) Disable test generation entirely for any file that already has existing tests

**Q47.** A `PostToolUse` hook runs a code formatter after every file write, keeping the repository consistently formatted. A code-review job separately reads source files to analyze them and produce line-numbered findings as JSON. Because the review job's own file reads don't trigger the formatter, that's not the issue — instead, a separate process reformats the PR's files as part of an unrelated pre-review step, and the review job's line numbers, computed after that reformatting, no longer line up with the original PR diff's line numbers. Posted comments end up pointing at the wrong lines. What's the underlying issue, and the fix?

- A) The review job should read from a snapshot of the files exactly as they existed in the PR diff, before any reformatting step touches them, so its line numbers stay aligned with what reviewers actually see in the diff
- B) The formatter is changing line counts when it shouldn't; configure it to never alter line counts, even when reformatting
- C) This is expected and unavoidable; the review prompt should instruct the model to guess at likely line-number drift
- D) The review job needs a larger context window so it can somehow account for the reformatting on its own

**Q48.** A code-review tool call returns findings with fields including `finding_type` (an enum: bug / style / performance / security) and `description` (free text). Every finding passes schema validation — the JSON is well-formed and every field has a legal value. But some findings are miscategorized: a finding with `finding_type: "security"` has a `description` reading "variable naming could be more concise," which is clearly a style comment, not a security issue. This routes the finding to the wrong downstream review queue, and schema validation doesn't catch it. What's the most reliable fix?

- A) Add more fine-grained values to the `finding_type` enum to reduce ambiguity between categories
- B) Add a deterministic post-generation check that cross-references `finding_type` against keyword/pattern signals in `description`, flagging likely category mismatches before the finding is routed anywhere
- C) Switch to a larger model on the assumption it will have better categorical judgment
- D) Lower `max_tokens` to encourage more concise, and hopefully more accurate, categorization

**Q49. (Select TWO)** A code-review job runs on every new commit pushed to an open PR. After a developer pushes a second commit that doesn't touch the code around a previously-flagged issue, the review re-flags that exact same still-unresolved issue again, posting a duplicate comment on the same line. Which TWO changes would most directly prevent this specific duplicate-across-commits problem?

- A) Include the prior review's findings for this PR as input to the new review run, with an explicit instruction to report only issues that are new or still genuinely unaddressed
- B) Add a deduplication step that compares each new finding against the PR's previously-posted findings and drops exact or near-exact repeats before anything is posted
- C) Run every commit's review inside one long-lived session that persists for the life of the PR, so the model's own memory of prior findings prevents repeats
- D) Post every finding regardless, but append "(also flagged on a previous commit)" so developers can tell it's not new

**Q50.** A test-generation job runs in a completely fresh session for each PR, producing tests that technically pass locally but consistently fail once merged into the team's CI suite — because they use generic ad hoc mocking instead of the repository's established test harness, custom fixtures, and helper utilities. The invocation only receives the changed code; none of the team's testing conventions or available utilities are documented anywhere the generation step can see them. What combination of changes would most improve generated test quality here?

- A) Move testing guidance to an external wiki that developers are expected to read themselves; tests will improve once humans internalize the conventions
- B) Document the team's testing conventions, available fixtures/helpers, and test-harness setup in `CLAUDE.md` so every test-generation invocation has that context available, and include a short example showing correct use of the existing test infrastructure
- C) Restrict test generation to only the simplest, dependency-free utility functions
- D) Stop using Claude Code for test generation on anything that depends on shared test infrastructure

---

## Scenario 6: Structured Data Extraction

**Q51.** An invoice-extraction pipeline using `tool_use` with a strict JSON schema produces syntactically valid JSON every time, but a downstream review flags that a `vendor_name` value like "Acme Corp" sometimes appears in the output even though no such name exists anywhere in the source document. The schema defines `vendor_name` as a required string. What change would most reliably catch this kind of hallucination going forward?

- A) Lower the temperature to force more deterministic output
- B) Make `vendor_name` nullable instead of required
- C) Add a `vendor_source_location` field (e.g., "letterhead," "signature block," "table header," or null) documenting where in the source the vendor name was actually found, forcing the extraction to ground its claim in something checkable
- D) Add a few-shot example that explicitly instructs the model not to hallucinate

**Q52.** A contract-extraction pipeline has two tools: one for prose clauses, one for tabular terms. Many real contracts contain both. The two tool descriptions currently say one extracts "contract text" and the other extracts "document tables," but in practice the model tends to call only one of the two tools even on documents that clearly contain both prose and tables. What's the most direct fix?

- A) Merge the two tools into a single combined extraction tool
- B) Rewrite both descriptions to clearly state which data each tool covers, and explicitly note that documents containing both prose and tables should trigger both tools in sequence
- C) Force `tool_choice` to a single specific named tool
- D) Add a preprocessing step that physically splits every document into separate table-only and prose-only files before extraction

**Q53.** A team processes 40 vendor invoices as a single long batch within one conversation. The first 10 or so extract cleanly, but starting partway through the batch, later invoices begin returning vendor names, account numbers, or reference codes that actually belong to an earlier invoice in the same batch, not the one currently being extracted. What change would most reliably eliminate this cross-document carryover?

- A) Increase `max_tokens` to give the model more room to extract carefully
- B) Split the batch into independent single-invoice extraction calls instead of processing all 40 within one shared conversation
- C) Add a scratchpad listing every vendor and reference number seen so far, instructing the model to avoid reusing any value already on the list
- D) Lower the model's temperature

**Q54.** A purchase-order extraction schema requires a `po_number` field and also has a `document_type` enum (`"purchase_order" | "invoice" | "quote"`). In practice, many documents get classified as `"purchase_order"` even though they're actually invoices that never contained a PO number at all — and validation, which runs only after the full extraction is returned, then fails on the missing `po_number`. What change would most reliably improve accuracy here?

- A) Keep retrying the same prompt until validation happens to pass
- B) Make `po_number` nullable so invoices no longer fail validation, while keeping `document_type` required as-is
- C) Restructure extraction into two steps: first classify the document type from its structure/headers, then only require `po_number` when that first step actually confirms the document is a purchase order
- D) Drop the `po_number` requirement from the schema entirely

**Q55.** A contract-extraction schema has a required `contract_start_date` field. Some contracts state both an "executed date" (when the parties signed) and a separate "effective date" (when obligations actually begin), and these differ. The model picks inconsistently between the two across otherwise-similar contracts, and adding a couple of generic few-shot examples hasn't resolved the inconsistency. What's the next step?

- A) Increase `max_tokens` to give the model more room to reason about which date to pick
- B) Merge both dates into a single freeform text field instead of picking one
- C) Add few-shot examples that include the explicit reasoning for the choice (e.g., "when both dates appear, prefer the effective date, since that's when obligations actually begin") plus a schema-level comment stating that precedence rule directly
- D) Switch to a larger model and hope it infers the right precedence on its own

**Q56.** Two extraction tools, one for pulling out defined terms from a contract and one for pulling out the parties' actual obligations, both currently have descriptions that vaguely claim to cover "important contract terms." Developers have observed that the terms-extraction tool is sometimes relied on to also capture obligations, leading to silently incomplete extractions when it doesn't. What's the most effective first fix?

- A) Rewrite both descriptions to explicitly separate their scope — state precisely what each tool does and doesn't cover, with a short example for each, so the overlap in "important contract terms" no longer blurs the boundary
- B) Force the pipeline to always call both tools on every document regardless of content
- C) Merge the two tools into a single combined extraction tool
- D) Add a validation check after extraction that tries to detect whether obligations are missing from the output

**Q57. (Select TWO)** An extraction QA process currently routes only low-confidence extractions to human review. Two systematic failure types have been slipping through at high confidence and going unnoticed until much later: (1) extracted values that don't correspond to anything an independent second read of the source document would find, and (2) values correctly extracted from the document but assigned to the wrong field entirely (right value, wrong slot). Both bypass review because both score high confidence. Which TWO changes would most directly help catch these two failure types?

- A) Add a lightweight second-pass extraction (or reviewer) that checks whether each high-confidence value is actually grounded in the source and assigned to a plausible field, rather than trusting confidence scores alone
- B) Require every extracted field to be paired with a location or evidence reference in the source, so a value with no plausible grounding — or one grounded in a location that doesn't match its assigned field — can be flagged structurally, independent of the model's own confidence score
- C) Raise the confidence threshold across the board so fewer extractions bypass review in general
- D) Rely on the extraction model to self-report when it's uncertain about field assignment, and route only those self-flagged cases to review

**Q58.** A team processes 500 supplier invoices every business day and wants to move extraction to the Message Batches API to capture a meaningful cost discount. Current same-day processing takes about 2 hours from submission. Downstream financial-close processes need results by 9 AM the next business day. The Batches API carries no latency SLA and can, in the worst case, take up to 24 hours. If a batch is submitted at 6 PM, what's the latest it might reasonably return under that worst case, and what does that imply?

- A) Always by 8 AM the next morning, so the move is safe as planned
- B) As late as 6 PM the following day (24 hours after submission) in the worst case — which would blow past the 9 AM downstream deadline entirely, meaning this workflow shouldn't rely on the Batches API for its full volume without a real fallback plan
- C) Within roughly 2 hours, the same as the current synchronous process
- D) There's a documented, guaranteed 18-hour turnaround specifically for financial workloads

**Q59.** A vendor-management schema classifies every vendor with an enum: `"supplier" | "contractor" | "service_provider" | "reseller"`. In practice, some real vendor relationships (joint ventures, co-managed partnerships, regional distributor arrangements) don't cleanly fit any of the four categories, and the model is forced into a misclassification every time one comes up. What schema change best handles this kind of long-tail extensibility?

- A) Drop the enum constraint entirely and make `vendor_category` a free-text string
- B) Add an `"other"` value to the enum, plus an optional `vendor_category_detail` string field for a free-text explanation whenever `"other"` is chosen
- C) Create an entirely separate extraction tool for every additional vendor type as it's discovered
- D) Add a confidence score to the category field and route anything below a threshold to manual review, without changing the enum itself

**Q60.** Six months into production, a team wants to analyze why certain extractions get rejected by downstream reviewers. Current logs record only `document_id`, `field_name`, `extracted_value`, and a final `disposition` of accepted or rejected — nothing about the document itself. The team suspects failures cluster around things like poor-quality scans, handwritten amounts, very long multi-page contracts where key terms appear late in the document, or particular vendor formats, but the existing logs give no way to confirm or prioritize any of that. What should be added to enable real root-cause analysis?

- A) A random UUID per extraction, purely for tracing a record back to its source document
- B) Structured document metadata logged alongside each extraction — source type (scanned vs. native), an OCR-quality signal where applicable, page count, and roughly where in the document the field was found — so rejections can be correlated with the actual characteristics of the input that produced them
- C) A separate machine-learning model trained specifically to predict which documents are likely to fail
- D) A recurring manual review of a random sample of rejections, done by hand, to look for patterns

---

*End of Exam 5. Check your answers against the [Answer Key](exam-5-answers.md).*
