# Mock Exam 4 — Questions (Hard Mode)

> Every question here is original material written against the public CCAR-F blueprint — none of it is drawn from or paraphrased from real exam content. See [CONTRIBUTING.md](../CONTRIBUTING.md#the-one-hard-rule) for why that boundary matters and how to add more questions the right way.

## How to take it

- **Full 6-scenario coverage, like Exam 1** — 60 questions, 10 per official scenario, so every domain area gets drilled regardless of which 4 scenarios the real exam draws for you.
- **Difficulty: HARD.** This set is calibrated noticeably harder than [Exam 1](exam-1-questions.md), [Exam 2](exam-2-questions.md), and [Exam 3](exam-3-questions.md). Distractors are deliberately more plausible — expect options that are "right in general, wrong for this specific reason," fine distinctions between two similarly-named mechanisms, and a few items that require a short SLA/timing calculation instead of pure recall.
- **Set a timer for 120 minutes anyway.** The real exam's time pressure doesn't go away just because the questions get harder — if anything, budget your two-minutes-per-item more carefully here.
- **No notes, no search, no assistant.** Simulate real conditions as closely as you can.
- Four items are marked **"(Select TWO)"** — treat these as multiple-response; you must get both parts correct to receive credit. Don't treat section labels as a scoring hint.
- Score yourself against [exam-4-answers.md](exam-4-answers.md) afterward. Anything you missed, don't just read the rationale — go back to the relevant [study guide](../study-guide/) domain page and re-derive the mechanism yourself.

## Scoring guide

Rough gut-check only — and *don't* benchmark it against Exam 1/2/3's bands or the real exam's scaled 720/1000 cut. This set is intentionally harder than the real thing, so a lower raw score here is expected and normal.

| Raw score (out of 60) | Rough read |
|---|---|
| 45+ | Strong — you're holding up well against distractors sharper than the real exam is likely to throw at you |
| 33–44 | Solid foundation, but the domains where you missed clusters of questions need another pass before you sit Exam 1/2/3 or the real thing |
| Below 33 | Expected on a first attempt at hard mode — this is a diagnostic, not a verdict. Go re-drill the missed domains, then retake |

---

## Scenario 1: Customer Support Resolution Agent

**Q1.** Your resolution agent has a `PreToolUse` hook that blocks `process_refund` calls exceeding $750. Logs show the hook is working correctly — every blocked refund is correctly identified. However, first-contact resolution dropped 12% in the last month. Investigation reveals that many customers' refund requests between $400–$750 are now being incorrectly escalated even though policy allows them, and the agent is calling `escalate_to_human` before ever attempting `process_refund`. What's the issue?

- A) The threshold is set too high; lower it to $500 to prevent false escalations
- B) The hook is correct, but the agent's premature escalation suggests the `process_refund` tool description doesn't make clear that it handles amounts up to the threshold
- C) The hook should use `PostToolUse` instead of `PreToolUse` to allow the refund attempt first
- D) Replace the hook with a system-prompt instruction that lists the threshold explicitly

**Q2.** Your support agent integrates with two MCP tools: `lookup_legacy_order` (for orders from 2+ years ago) and `lookup_recent_order` (for current orders). Both return `{"isError": true, "message": "Lookup failed"}` for any failure — timeout, invalid order ID, or permission denied. The agent sometimes retries timeouts unnecessarily and sometimes gives up on permission errors that should escalate instead. What's the root cause?

- A) The tools need better descriptions so the agent picks the correct one first
- B) The tool results lack structured error metadata (`errorCategory`, `isRetryable`); the agent can't distinguish a retryable timeout from a non-retryable permission failure
- C) The agent should use `tool_choice: "any"` to force it to select one of the two tools
- D) The MCP server is responding too quickly; add artificial delays so the model sees a timeout signal

**Q3.** A customer named "Utkarsh Agarwal" matches 5 accounts in the system: four inactive, one active from last month. The agent selects the active account without asking for clarification. That account belongs to a different customer with the same name — the agent processes a $340 refund for the wrong person. What's the correct behavior when a lookup returns multiple matches?

- A) Pick the most recently active account, since it's the most likely match
- B) Ask the customer for an additional identifier before proceeding
- C) Process the request against all matching accounts and let the customer confirm afterward
- D) Escalate immediately, since multi-match lookups are inherently too ambiguous to handle autonomously

**Q4.** A customer messages: "I need to return a wireless headset AND I'm being charged twice for my subscription." The agent decomposes this into two concerns and investigates the billing dispute first, finding a duplicate charge and auto-refunding $15. Only afterward does it address the return, discovering the headset was purchased as part of a non-refundable promotional bundle 45 days ago, and escalates the return. The customer is upset because the billing refund had already gone through before the return was found to be ineligible. What went wrong?

- A) The agent should have escalated both concerns immediately instead of attempting autonomous resolution
- B) The agent should have investigated eligibility/prerequisites across both concerns before issuing any refund, not resolve one item to completion before even starting to investigate the other
- C) The agent picked the wrong concern to address first; pure ordering shouldn't matter otherwise
- D) The agent needed stronger prompting to handle multi-concern messages

**Q5.** Your agent has access to four tools: `get_customer`, `lookup_order`, `process_refund`, and `escalate_to_human`. Metrics show 65% of cases that call `escalate_to_human` are actually routine refunds that could have been auto-resolved, while autonomous resolution succeeds 78% of the time on the clear-cut cases it does attempt. The agent is over-escalating standard cases while handling some genuinely ambiguous ones autonomously. What's the most direct structural fix?

- A) Rewrite tool descriptions to be more explicit about when to escalate
- B) Remove `get_customer` and `lookup_order` from the toolset, leaving only `process_refund` and `escalate_to_human`, to reduce tool confusion
- C) Keep all four tools, but restrict `escalate_to_human` so it can only be called after both `get_customer` and `lookup_order` have already returned substantive data
- D) Rewrite the system prompt's escalation criteria in more detail

**Q6.** A 12-turn conversation about a disputed order involves: the customer claims a $60 charge on order #7742, the agent verifies the charge exists, and by turn 8 a running summary has condensed the details down to "customer disputes a charge." On turn 11, the customer references "like the $50 I got back last month for the same vendor," but the agent has lost the original $60 figure in the summarized history and asks the customer to repeat the amount. What fix would prevent this?

- A) Never summarize; keep the full raw conversation history in every turn
- B) Maintain a persistent "case facts" block (amount, order ID, dates) carried alongside every message, outside the narrative summary that gets condensed
- C) Increase the context window size
- D) Lower the temperature to make behavior more consistent across long conversations

**Q7.** Your policy requires that refunds under $100 can be auto-approved, but refunds of $100+ must first have the customer's identity verified via `get_customer`. Some `get_customer` calls fail due to network timeouts, and the agent currently retries the same call several times before eventually calling `escalate_to_human`. You want to *guarantee* that `process_refund` can never be called for $100+ unless `get_customer` has already returned a verified ID in the conversation — not just make it likely. Which mechanism enforces this?

- A) A `PostToolUse` hook that appends a reminder to the agent after `process_refund` succeeds, noting that identity should have been verified first
- B) A `PreToolUse` hook that blocks `process_refund` for amounts at or above $100 until a verified-ID flag from `get_customer` is present in the conversation
- C) A `PostToolUse` hook that normalizes `get_customer` results into a canonical verified/unverified format
- D) A system-prompt instruction stating that identity verification is required before large refunds

**Q8. (Select TWO)** Your team wants to fix confusion between `check_return_eligibility` and `check_warranty_status`, two tools that return similar-looking metadata but serve different purposes and are frequently called for the wrong purpose. You're applying the standard tool-description fix ladder before reaching for anything more disruptive. Which TWO of the following are appropriate first-step improvements?

- A) Rename the tools to `is_return_eligible` and `is_product_under_warranty`, and add descriptions that explain when to use each, including explicit non-use cases
- B) Add 5 few-shot examples showing correct routing between the two tools, in a dedicated prompt section, before touching the tool definitions themselves
- C) Merge both tools into a single `check_product_status` tool that returns eligibility and warranty status in one call
- D) Expand both descriptions with input formats (e.g., "accepts order ID + SKU"), example queries, and explicit boundaries (e.g., "use this for return eligibility only, not refund amounts")

**Q9.** Your team escalates any case that reaches 8 conversational turns, on the theory that long conversations indicate complex cases. Data shows this rule escalates many routine multi-step refunds (identity verification + refund processing routinely takes 6–8 turns) while some genuinely ambiguous policy-exception cases stay in autonomous resolution because they happen to resolve in fewer turns. What's wrong with using turn count as an escalation signal?

- A) It's actually a reasonable proxy for complexity; just raise the threshold to 12 turns
- B) Turn count is orthogonal to case complexity — the same routine workflow can take 3 turns or 10 depending on how the customer communicates. Escalation should trigger on an actual policy gap or ambiguity the agent can't resolve, not on conversation length
- C) Escalate based on customer sentiment instead of turn count
- D) Add a per-turn confidence score and escalate when the average drops below a threshold

**Q10.** A case is escalated to a human with a structured handoff containing: customer ID, disputed order number, refund amount, and a recommended action ("Approve $85 refund, order is within the 30-day window"). The human approves the refund. Two days later, the customer says the refund never arrived and demands to know why the agent didn't just process it. Investigation shows the AI agent never actually called `process_refund` — it only reasoned that a human should approve one. What element is missing from the escalation structure that would have prevented this confusion?

- A) The full unedited transcript, so the human can re-trace the entire investigation themselves
- B) A field documenting exactly what the agent already attempted, and explicitly stating that no refund action was taken by the agent itself — only a recommendation
- C) The customer's original message, verbatim, to confirm the request was genuine
- D) A confidence score, so the human knows how uncertain the agent was

---

## Scenario 2: Code Generation with Claude Code

**Q11.** A developer runs `/memory` during a long Claude Code session and sees that both the project-level `CLAUDE.md` and a `.claude/rules/database.md` rule (with `paths: ["src/db/**/*.ts"]`) are listed as loaded. Yet the rule isn't applying to `src/db/migration.ts`, a file the developer created moments ago mid-session — even though the path clearly matches the glob. What's the most likely cause?

- A) Path-scoped rules are evaluated against the file set at session start, before the new file existed, and don't re-evaluate dynamically as new files are created
- B) The `paths` glob requires an exact filename match, not a directory wildcard pattern
- C) The file must be committed to git before glob-based rules will apply to it
- D) The developer needs to re-run `/memory` to refresh the rule cache

**Q12.** A team creates a `/document-api` skill with `allowed-tools: ["Write"]` in its `SKILL.md` frontmatter, intending to restrict the skill to only generating documentation files. When invoked, the skill fails because it can't query a connected MCP server that provides live API schema information. Why doesn't `allowed-tools` prevent this failure from being a restriction problem in the first place?

- A) `allowed-tools` restricts built-in tools but does not gate MCP tool access, which the skill inherits from the parent session regardless of the frontmatter list
- B) MCP tools must be separately allowlisted via a dedicated `allowed-servers` frontmatter field, which is missing here
- C) The MCP call is blocked, and the fix is to add `tool_choice: "required"` to the frontmatter instead
- D) Skill invocation automatically escalates all tool restrictions from the skill to the parent session

**Q13.** A `.claude/settings.json` hook is configured with `matcher: "Bash"`, `type: "command"`, intended to block any Bash invocation that references production credentials. The hook's script correctly detects and prints the matched credential key name in logs, but Bash commands referencing those credentials still execute anyway. What's the most likely fix?

- A) Change the matcher from `"Bash"` to a regex like `"Bash.*"` so it matches the tool name correctly
- B) Make sure the hook's script actually exits with a non-zero exit code when it detects a match — printing a log line alone does not block the tool call
- C) Move the hook from `PreToolUse` to `PostToolUse`, since that's when the final decision on the Bash call is made
- D) Add a separate `{"type": "approval"}` hook entry alongside the existing command hook

**Q14.** A developer needs to add one new database index to speed up a slow, already-diagnosed query. The change touches one file, is 5–10 lines, and the team has already agreed on which index to add. Should this go through plan mode first?

- A) Yes — plan mode should review the indexing strategy before any implementation
- B) No — plan mode is built for exploring multiple valid approaches on complex, multi-file work; a single well-understood, already-decided change doesn't need that overhead
- C) Yes — plan mode is required to check the index doesn't affect other queries
- D) No, but only because this is a bug fix; any new feature work should always go through plan mode

**Q15.** A `/release-notes` skill converts raw commit messages into user-facing changelog entries. Across five runs on similar commits, the results vary: sometimes technical jargon that should be simplified is kept as-is, other times breaking-change details are oversimplified into vague language. The prompt already says "write for a non-technical audience while preserving important details." What's the most effective next fix?

- A) Add a stronger prompt clause: "Always balance technical accuracy with customer-friendly language"
- B) Add 2–3 concrete before/after examples that show exactly which terms to simplify, which details must survive simplification (e.g., breaking changes), and how each should be phrased
- C) Generate five variants per commit and have a human manually pick the best one each time
- D) Split the skill into two skills — one for breaking changes, one for routine fixes — to reduce the range of cases each has to handle

**Q16.** A convention that all new database migrations follow a specific naming/structure pattern needs to apply to files under both `migrations/` and `tools/legacy-migrations/` — two directories with no other relationship. What's the most maintainable way to enforce this?

- A) Create `migrations/CLAUDE.md` and `tools/legacy-migrations/CLAUDE.md`, each repeating the same convention
- B) Create a single `.claude/rules/migrations.md` with `paths: ["**/migrations/**/*.sql", "**/legacy-migrations/**/*.sql"]` frontmatter
- C) Add a "Migration" section to the root `CLAUDE.md`
- D) Build a custom `/migration-check` skill that developers must remember to run before creating a migration file

**Q17.** A developer spends 90 minutes exploring a legacy data-processing module before asking Claude to write a new version of a core function. The generated code is syntactically clean and passes a quick smoke test, but it silently violates a constraint documented in a code comment the developer read in the first 20 minutes of exploration — a comment Claude never referenced when generating the new version. What should have been set up during the exploration phase to prevent this?

- A) Use the `Explore` subagent to keep verbose discovery output out of the main context, and have Claude maintain a scratchpad file recording critical constraints found along the way
- B) Start a brand-new session for the implementation step so old exploration context doesn't interfere
- C) Ask for a larger context window so nothing needs to be dropped during the session
- D) Switch to plan mode specifically to review the findings before implementation begins

**Q18.** An automated PR review pipeline deliberately uses a fresh, independent Claude Code instance to review code rather than reusing the session that generated the fix. A reviewer complains that this independent reviewer still misses a subtle cross-function interaction bug that seems obvious once pointed out. Is the independent-instance design itself the problem?

- A) Yes — the independent instance should be given the original session's generation reasoning so it has more context to work with
- B) No — the point of an independent instance is specifically to avoid the generation session's own reasoning bias, which otherwise makes it less likely to challenge its own prior decisions; this particular miss is a separate issue, not evidence the pattern is wrong
- C) Yes — both steps should run in the same session so context carries over cleanly
- D) No, but the reviewer instance should switch models between runs to add perspective diversity

**Q19.** A skill's `SKILL.md` sets `context: fork` and `argument-hint: "Describe the target API"`. Invoking it with no arguments prompts the developer to describe the target API. Invoking it with a description already supplied as an argument runs the skill silently, with no follow-up prompt. Is this the correct, documented behavior of `argument-hint`?

- A) No — `argument-hint` should always prompt regardless of whether arguments were supplied; the missing prompt is a bug
- B) Yes — `argument-hint` is autocomplete guidance shown when no arguments are given; it assumes the user has supplied what's needed once an argument is present, and does not re-validate or force a prompt
- C) No — `context: fork` disables prompting behavior for any skill run as a sub-agent
- D) Yes, but only because `argument-hint` silently validates the argument against a schema before deciding whether to prompt

**Q20.** A developer spends over two hours exploring a large, unfamiliar monorepo — reading 40+ files, tracing call chains, and building a mental model of a thread-safety requirement documented in a file read early in the session. Near the end of the session, they ask Claude to refactor the module for readability. The refactor passes unit tests but breaks a downstream integration test because it violates that early thread-safety requirement — which Claude never cites or references while making the change. What should have been done differently during exploration?

- A) Run `/compact` after every new file is read, aggressively trimming context to make room for new information
- B) Maintain a scratchpad file recording critical constraints, assumptions, and invariants discovered during exploration, so they can be explicitly rechecked before any later implementation step
- C) Restart the session every 90 minutes to avoid context window saturation
- D) Only ever use the `Explore` subagent for discovery, and always implement in a completely fresh session afterward

---

## Scenario 3: Multi-Agent Research System

**Q21.** A coordinator delegates research on climate-policy evolution to five subagents — recent legislative news, long-form policy documents, emerging green-tech companies, synthesis, and report generation. All five complete without errors. The synthesis subagent's output is coherent, but the final report heavily emphasizes legislative updates and barely mentions green-tech market dynamics, despite the coordinator having requested balanced coverage. Each subagent's individual findings contain relevant material on their assigned topic. Where is the defect most likely located?

- A) The green-tech subagent silently failed to execute its task properly
- B) The synthesis subagent's tool access is too narrow to retrieve the green-tech material it needs
- C) The coordinator's decomposition never established weighting or integration instructions, so synthesis had no guidance on how to balance the two domains
- D) The report-generation subagent is intentionally suppressing green-tech findings due to its writing style

**Q22.** A web-search subagent completes research on a regulatory topic and returns its findings to the coordinator. The coordinator then delegates a follow-up task to a synthesis subagent. The synthesis subagent immediately asks what "approval timeline" refers to — a term defined only in the earlier search results, which the coordinator has but did not include in the new invocation. Why is this the expected behavior rather than a bug?

- A) Subagents automatically inherit all prior coordinator messages and tool outputs, but only if explicitly "enabled" in the invocation — which wasn't done here
- B) Subagents have isolated context by design and do not automatically receive prior conversation history; the coordinator must explicitly pass whatever context a subagent needs into its invocation prompt
- C) The synthesis subagent's context window is smaller than the coordinator's, so large search results are silently truncated before being passed along
- D) Passing context explicitly is optional in principle; the model's training data typically fills in plausible prior search results

**Q23.** A coordinator needs to search academic papers, government filings, and corporate financial disclosures on a renewable-energy topic. It currently delegates to one subagent, waits, delegates to a second, waits, then delegates to a third — a fully sequential chain that takes 45 seconds per research cycle. The three lookups don't depend on each other's output. What change reduces elapsed time while keeping the coordinator in control of synthesis?

- A) Combine all three into one subagent that internally parallelizes the three lookups itself
- B) Emit all three `Task` tool calls within a single coordinator turn so the subagents run concurrently
- C) Use `Bash` to shell out to a script that invokes all three subagents in parallel, bypassing the `Task` tool
- D) Reduce each subagent's context window so results come back faster

**Q24.** A document-analysis subagent queries a restricted research database for licensing information. Every failure — expired license, database outage, malformed input, or a valid search with zero matching records — comes back as `{"isError": true, "message": "Request failed"}`. The coordinator can't reliably decide whether to retry, reformat the input, escalate for license renewal, or move on with a documented coverage gap. What should the tool result include instead?

- A) A generic success/failure boolean, leaving recovery logic entirely to the coordinator's judgment
- B) Structured error context: category (expired/timeout/validation/not-found), whether retrying is worthwhile, what was attempted, and a suggested next step
- C) A confidence score reflecting how sure the subagent is that the call actually failed
- D) A verbose internal log of every retry the subagent already attempted, for the coordinator to replay

**Q25.** A research coordinator's usual flow is: search → wait → analysis (with search results) → wait → synthesis. On complex topics, the coordinator sometimes needs analysis and synthesis dispatched together right after search results land; on simple topics, synthesis should start the moment analysis returns, without an extra coordinator round-trip. The right next step genuinely depends on what each stage discovers. What orchestration approach fits best?

- A) A fixed four-step prompt chain that always runs in the same order, on the theory that predictability beats adaptive logic
- B) A dynamic orchestrator that inspects results after each step and decides which subagents to invoke next based on what it finds
- C) Let each specialist subagent independently decide when to hand its output to the next stage, without the coordinator tracking overall progress
- D) Merge search, analysis, and synthesis into one subagent operating in a single context window

**Q26.** A finance-research system has `fetch_market_data` (stock prices, trading volumes, market indices) and `fetch_economic_indicators` (GDP, unemployment, inflation from government sources), described only as "Retrieves market information" and "Retrieves economic information" respectively. Logs show the synthesis subagent frequently calls `fetch_market_data` for inflation figures and `fetch_economic_indicators` for stock prices — both tools work correctly when called, they're just being selected for the wrong job. What's the most effective first fix?

- A) Add 10 few-shot examples showing correct tool selection for each data type
- B) Rewrite both descriptions with specific input formats, example queries, the exact data types each returns, and explicit boundaries (e.g., "use `fetch_market_data` only for prices and trading volumes, never macroeconomic aggregates")
- C) Remove one of the two tools and route all lookups through the survivor
- D) Add a keyword-based pre-router that intercepts the request and picks the tool before the model sees it

**Q27. (Select TWO)** A synthesis task is combining three credible sources on green-energy job creation: a 2019 peer-reviewed study reporting X%, a 2023 government report reporting a different Y%, and a 2024 corporate survey reporting Z%, close to Y%. Which TWO practices best support reliable synthesis without misrepresenting what the evidence actually shows?

- A) Attach the publication/collection date to each figure, so a reader can tell a genuine trend over time apart from a real contradiction between sources
- B) Report only the most recent figure (Z%), since 2024 data is presumably the most accurate
- C) Preserve each figure with its own source attribution, methodology, and date, and explicitly flag the disagreement rather than silently resolving it
- D) Average the three figures into a single blended estimate so the reader gets one clean number

**Q28.** A draft report synthesized from three subagents' findings states a renewable-energy adoption statistic with no source citation, even though the search subagent originally found this figure in a credible government report and passed it along with a source reference. The synthesis subagent had both the number and the source in its input; the citation was simply dropped during synthesis. What should have been required from the start to prevent this?

- A) A confidence score on each claim, so synthesis can prioritize high-confidence findings
- B) Structured claim-source mappings — each assertion explicitly linked to its source document, excerpt, date, and methodology — that synthesis is required to preserve rather than compress away
- C) A checklist forcing the synthesis subagent to manually copy-paste every source reference verbatim into the output
- D) A separate "sources" file kept entirely outside the synthesis subagent's input context

**Q29.** A coordinator delegates in parallel to three subagents: clinical-trial outcomes, healthcare policy documents, and emerging medical technologies. Trials and policy both return successfully. The technology subagent errors out because a source is temporarily unreachable. A report can still be produced, just with a coverage gap on emerging technologies. What should the coordinator do?

- A) Escalate the whole pipeline to a human, since any subagent failure should halt the process regardless of how much useful work the others completed
- B) Produce the partial report from the two completed subagents, clearly annotating the coverage gap and why it exists, and let the reader judge whether that gap matters for their purposes
- C) Retry the failed subagent indefinitely and block the report until it eventually succeeds
- D) Discard the two successful results too, since the three-subagent pipeline was defined as all-or-nothing

**Q30.** A multi-turn synthesis is tracking housing-policy changes across a decade — early turns cover 2015–2018 findings, later turns add 2019–2024. By turn 5, the synthesis subagent starts referencing "typical housing-policy patterns" in vague generalities instead of the specific policy names, agencies, and dates it correctly cited in turn 2. The coordinator's messages keep growing, but the output keeps getting vaguer. What's the most direct fix?

- A) Restart the research from scratch with no prior context, since this kind of degradation is unavoidable in long sessions
- B) Maintain a persistent findings-summary artifact (key facts, dates, policy names, sources) that the coordinator re-injects into every synthesis turn, countering attention loss on details buried in the middle of a growing context
- C) Raise `max_tokens` so the model has more room to generate detailed responses
- D) Swap in a larger model mid-session to regain synthesis quality

---

## Scenario 4: Developer Productivity with Claude

**Q31.** A developer asks Claude to "find all places where the request handler deserializes payloads without a null check" while investigating intermittent null-pointer exceptions. Claude runs `Grep`, finds 14 matching files, reads three of them, and concludes with a vague "most callers look safe." Asked for a specific prioritized list of entry points to review, Claude admits it only read a small fraction of the 14 matches. What's the most direct fix for the next investigation?

- A) Increase the context window so Claude can read all 14 files in one pass
- B) Maintain a scratchpad file recording each candidate file's path, line number, and null-check status as it's checked, before synthesizing a final answer
- C) Replace `Grep` with a more elaborate `Bash find` pipeline to pre-filter matches
- D) Add a system-prompt instruction telling Claude to "be thorough" when reviewing security-sensitive code

**Q32.** An MCP server `code_analyzer` exposes `find_pattern` (pattern/regex matching over code) and `trace_dataflow` (semantic, cross-function-boundary analysis that can follow unsanitized input to a security-critical sink). `trace_dataflow` is strictly more capable for this class of investigation, but logs show Claude consistently reaches for `find_pattern` instead, even on tasks that clearly call for cross-boundary tracing. What's the most likely cause?

- A) The built-in `Grep` tool has higher precedence than any MCP tool and is preferred by default
- B) `trace_dataflow`'s description doesn't clearly explain its semantic, cross-boundary capability or when it should be chosen over simple pattern matching
- C) The MCP server needs to be reconfigured at the network level to expose `trace_dataflow` with higher priority
- D) Claude prefers MCP tools over built-ins by default, so some other, unrelated setting must be suppressing that preference here

**Q33.** A developer wants to compare one function's signature across three branches (`main`, `develop`, `staging`) — just the definition line and its parameter list in each. What's the most efficient combination of built-in tools?

- A) Use `Bash` to run `git diff` across the branches and parse the raw output
- B) Use `Grep` to locate the function's definition line in each branch, then `Read` only the small region around each match
- C) Use `Glob` to enumerate every source file first, then `Read` each one looking for the signature
- D) Use `Read` on the entire repository per branch, then search the combined content manually

**Q34.** An `Edit` call's anchor text matches three times in the target file: once in a comment, once in a docstring, and once in the actual executable line the developer wants changed. The call fails because the anchor isn't unique. What's the reliable next step?

- A) Retry `Edit` with a longer anchor string that includes more surrounding context, hoping it becomes unique
- B) Use `Read` to load the full file, manually identify the correct occurrence, then use `Write` to save the corrected full-file version
- C) Use `Bash grep -n` to get the line number, then build a new `Edit` call anchored on that line number
- D) Tell the user ambiguous anchors are a hard limitation and the edit must be done manually

**Q35.** A custom MCP server queries a proprietary internal database for team-wide metrics. It needs credentials that must never be committed to git, and the server configuration itself must be shared across every developer's checkout. Where should this be configured, and how should the credential be referenced?

- A) In `~/.claude.json`, with the credential hardcoded, distributed manually to each teammate
- B) In `.mcp.json`, referencing `${DATABASE_API_KEY}` for environment-variable expansion, with each developer setting that variable locally
- C) In `CLAUDE.md`, inside a fenced code block, with a note asking developers not to commit it
- D) In a root-level `.env` file, referenced from `.mcp.json` by its literal filename

**Q36.** A developer wants to try out a prototype MCP server for dependency-graph analysis that no one else on the team needs yet, and that might be misconfigured and break things while they experiment. Where should this go so it doesn't affect teammates or clutter shared config?

- A) In `.mcp.json` at the repo root, flagged with an `"experimental": true` field
- B) In `~/.claude.json` on their own machine
- C) In a new `.claude/experimental-mcp.json` file in the project
- D) In a `.mcp-local` file added to `.gitignore`

**Q37.** After three hours exploring a monorepo's service-to-service communication, Claude has answered several detailed questions correctly, citing specific classes. On the next question — about the same system — Claude says it "doesn't have enough context to be specific." Asked to recall a class name it named accurately 15 minutes earlier, it now proposes a slightly different, incorrect name. What's happening, and what's the most direct fix?

- A) The context window is full; restart the session
- B) The agent's grip on earlier specifics is degrading as the conversation grows; maintain a scratchpad file recording key class names, interface boundaries, and dependency relationships, and reference it in later prompts
- C) The developer's questions have become too vague; ask more specific, narrowly-scoped questions instead
- D) Reduce `max_tokens` so responses stay short enough to avoid straining context

**Q38.** A developer unfamiliar with a codebase wants to find where HTTP request validation happens before requests reach business logic, without reading every file upfront. What's the recommended exploration order?

- A) Use `Read` on every file under `/handlers` first, to understand overall structure
- B) Use `Grep` for validation-related terms ("validate", "schema", "middleware") to find candidate files, then use `Read` on just those matches, following imports to trace the flow from entry points
- C) Use `Bash find` to list files, pipe the output somewhere, and ask Claude to infer the pattern from the file list alone
- D) Use `Glob` for `**/*.ts`, then `Read` every result and ask Claude to identify validation logic after the fact

**Q39.** A team's custom MCP server for repo analysis is configured in `.mcp.json` with `${GIT_API_TOKEN}` for credential expansion. A teammate launches Claude Code and the server fails to initialize with an error that the environment variable isn't set — even though they've added `export GIT_API_TOKEN=...` to their `~/.bashrc`. What's actually going on, and what's the fix?

- A) Credentials referenced via environment-variable expansion only work from `~/.claude.json`, not `.mcp.json`
- B) A variable set in `~/.bashrc` only applies to shells that source that file when they start; if Claude Code was launched from a shell or process that never sourced it, the variable simply isn't in its environment — export it in the current terminal session (or set it at the OS/session level) before launching Claude Code
- C) The syntax is wrong; it must be `${GIT_API_TOKEN:-default}`, since bare `${VAR}` isn't supported
- D) Environment-variable expansion isn't supported in `.mcp.json` at all; the token must be hardcoded or read from a separate `.env` file

**Q40.** A team wants an exploration phase (read-only: `Read`, `Grep`, `Bash` restricted to read-only commands) to hand off to a separate modification phase (`Read`, `Write`, `Edit`) once a refactor target is identified — without maintaining two entirely disconnected agents. What's the best way to enforce this tool scoping?

- A) Configure `allowedTools` at each agent/role definition so exploration and modification each only ever have access to the tools appropriate for that phase
- B) Build two fully separate agent definitions that share no context whatsoever between phases
- C) Use a single agent and rely on prompt instructions telling it which tools to avoid during the exploration phase
- D) Use hooks to dynamically intercept and block any tool call not on the current phase's approved list

---

## Scenario 5: Claude Code for Continuous Integration

**Q41.** A CI pipeline reuses a single Claude Code session across a queue of 6–8 PRs to amortize session startup overhead. By the third PR, review comments start referencing prior PRs ("similar to the previous refactoring"); by the seventh, findings are generic and don't address the actual diff in front of it. Why, and what's the fix?

- A) The session's context window is exhausted; raise `max_tokens` to give each invocation more room
- B) The session is carrying forward reasoning and context from earlier PRs, biasing later reviews toward prior patterns; use a fresh Claude Code session per PR instead
- C) The CI runner is incorrectly caching findings between invocations; clear the runner's cache
- D) Run all PR reviews simultaneously in parallel instead of sequentially, to avoid context accumulation

**Q42.** A `PostToolUse` hook with `matcher: "Bash|Read|Edit"` normalizes tool responses into a consistent JSON structure to make review output more uniform. In CI, the same hook also fires on an unrelated test-execution Bash step that emits raw plain-text test output, and normalizing that output breaks the downstream test-result parser, which now fails the build. What's the most precise fix?

- A) Remove the hook entirely and give up on normalizing tool responses in CI
- B) Narrow the hook's `matcher` (or add a condition) so it only fires on review-related tool invocations, not on the unrelated test-execution step
- C) Move the hook from `PostToolUse` to `PreToolUse`, since that runs earlier and can skip non-review steps
- D) Disable `Bash` tool access for the entire CI review run and use only `Read` and `Edit`

**Q43.** A CI review prompt spells out separate false-positive-reduction criteria for nine finding categories (security, performance, coverage, etc.), totaling roughly 280 tokens of criteria alone. Traces show the model applies these criteria inconsistently and sometimes seems to forget earlier categories' rules by the time it reaches later files in the same pass. What's the underlying issue?

- A) The criteria are too strict; loosen them so the reviewer becomes more confident overall
- B) Packing many fine-grained, per-category rules into a single pass causes attention dilution; split the review into per-category (or per-file) passes, or move some of the criteria into a deterministic post-generation validation layer
- C) Add 5–8 few-shot examples per category showing correct criterion application
- D) Set `temperature: 0` to force strictly rule-following, deterministic behavior regardless of prompt length

**Q44.** A team runs a blocking pre-merge review with an SLA of under 8 minutes, and a separate nightly technical-debt scan with no time constraint. They want to move workloads to the Message Batches API for the 50% cost discount. Which is the correct call?

- A) Batch both; the cost savings are worth accepting whatever latency impact results
- B) Batch only the nightly scan; moving the pre-merge check to the Batches API would only make sense if the team is willing to accept processing delays of up to 24 hours on merge decisions, which conflicts with the stated SLA
- C) Batch the pre-merge check too — the Batches API typically finishes within about 2 hours, which is fine for most teams' merge cadence
- D) Keep both synchronous; the Batches API isn't appropriate for any CI-adjacent workflow

**Q45.** A CI reviewer is configured to emit `--output-format json` with a `--json-schema`, and a downstream bot parses that JSON to post PR comments. The bot has recently started rejecting otherwise-valid runs because a finding's text field contains a literal `{` or `}` (e.g., "O{n} complexity" or "refactor: {old} → {new}"), which trips up a naive bracket-counting step the bot added as an extra sanity check before parsing. What's the most robust fix?

- A) Have the bot search for the first `[` in the raw response and parse only from there onward
- B) Add a prompt instruction: "output JSON only, no prose before or after"
- C) Remove the bot's ad hoc bracket-sanity-check step and parse directly against the enforced `--json-schema`, since schema-enforced output is already structurally reliable and the extra heuristic is what's actually misfiring on legitimate content
- D) Have the bot trigger a second review run with a different prompt whenever the first one fails to parse

**Q46.** A team wants to guarantee that review never runs on a PR lacking a linked issue-tracker ticket — unlinked PRs currently produce findings that just get ignored downstream anyway. The review prompt already says "never review PRs without a linked ticket," but reviews keep running regardless, since prompt instructions are followed probabilistically. What's the most deterministic enforcement point?

- A) Strengthen the prompt further: "CRITICAL: you MUST refuse to review PRs without a confirmed linked ticket. Non-negotiable."
- B) Add a `PreToolUse` hook that checks the ticket-link prerequisite via the issue tracker's API and blocks the review-related tool call outright if the check fails
- C) Build a custom `/review` skill that checks for a linked ticket as a documented step in its instructions before invoking the reviewer
- D) Let review run as normal, then filter out and discard any findings after the fact if the PR turns out to lack a linked ticket

**Q47.** A team splits large PR reviews into (1) per-file local-analysis passes and (2) a cross-file integration pass for API-contract and shared-type issues — but both stages currently run as two prompts inside one long-lived session. In practice, the integration pass re-flags issues the per-file pass already caught, and by the time the integration prompt runs, the accumulated session context has grown large enough that its findings get noticeably less precise. What's the best architectural fix?

- A) Keep both stages in the same session, separated by a clear divider comment, and instruct the model not to repeat findings from the prior stage
- B) Run each stage as a separate `-p` CLI invocation with fresh context, passing the per-file findings into the integration invocation's input so it can focus only on genuinely new cross-file issues
- C) Merge both stages into one comprehensive prompt that analyzes every file at once for full consistency
- D) Run the per-file passes in parallel, but still run the integration pass afterward inside the same accumulated session

**Q48.** A reviewer keeps flagging functions as "missing error handling" even when a `try/catch` is clearly present. The instruction "flag only critical cases where error handling is missing" hasn't helped, and adding 4–5 illustrative good/bad examples hasn't moved the false-positive rate either. What additional specificity is actually needed?

- A) Increase the example count from 4–5 to 15+, covering more edge cases
- B) Switch to a larger, more capable model
- C) Replace the vague instruction with an explicit, codebase-specific rule — e.g., "flag only when function X is called outside a try/catch, and the uncaught exception types are Y or Z, which can cause data loss or DB inconsistency"
- D) Disable the "missing error handling" category entirely until a dedicated, separately-trained classifier can be built for it

**Q49. (Select TWO)** A team's multi-file PR reviews show inconsistent depth (some files get thorough analysis, others superficial), the same pattern flagged in one file but waved through in another, and missed cross-file dependencies. Which TWO changes address this without ballooning API cost or gutting review depth?

- A) Consolidate everything into one large single-pass prompt covering the whole PR, to force consistent standards
- B) Split into per-file local-analysis passes for focused precision, followed by a dedicated cross-file integration pass to catch consistency and cross-file issues
- C) Reuse one Claude Code session across multiple PRs' reviews to build up consistent standards over time and save on session startup cost
- D) Run each PR's review as an independent Claude Code invocation, so no prior PR's reasoning carries over and biases the current one

**Q50.** A CI-facing project `CLAUDE.md` has grown past 650 lines: API design conventions, a deployment-readiness checklist, test-writing standards, migration guidelines, and detailed false-positive-reduction criteria for 15+ finding categories, all loaded on every single invocation regardless of what's actually being reviewed. Reviews are now missing context from the actual diff and producing vaguer findings, and logs show a large share of the context budget going to configuration rather than the code under review. What's the most effective fix?

- A) Split `CLAUDE.md` into several files connected with `@path` imports, so the content is easier for humans to navigate
- B) Move file-type- or path-specific guidance (e.g., migration rules scoped to `paths: ["**/migrations/*"]`) into `.claude/rules/`, and keep only genuinely universal guidance in `CLAUDE.md`
- C) Cut `CLAUDE.md` down to under 100 lines of high-level guidance and rely on the model's general training knowledge for the rest
- D) Build a custom `/review` skill that dynamically selects which subset of guidance to load based on which files changed in the PR

---

## Scenario 6: Structured Data Extraction

**Q51.** A receipt pipeline adds OCR to pull text from vendor logos on scanned images. The model now confidently fills the vendor field with plausible-sounding names that don't appear anywhere in the OCR text, the original image, or the email body — but schema validation passes, since `vendor` is syntactically a valid string. These hallucinated vendor names carry high confidence scores (0.92) and bypass human review entirely, surfacing only weeks later during downstream reconciliation. What should be added to the schema first to catch this?

- A) A required `ocr_confidence` field, so low-OCR-quality documents can be skipped
- B) A `source_location` field (e.g., "header", "footer", "email_body", "ocr_image") tracking where each extracted value came from, enabling a validation step that checks the value actually appears in the identified location
- C) An `is_hallucinated` boolean that the model self-reports
- D) A higher `max_tokens` budget, giving the model more room to "think" before extracting

**Q52.** A pipeline has `extract_receipt`, `extract_invoice`, and `extract_contract`, each with its own schema, and uses `tool_choice: "any"` so a call is always guaranteed. A borderline document — a receipt-like form that also includes itemized line items — keeps getting routed to `extract_invoice`, whose required fields (like `PO_number`) don't exist on the source, so the model fabricates them. Retrying with the same `tool_choice: "any"` setting produces the same misrouted result again. What's the root issue and the most direct fix?

- A) Add 2–3 few-shot examples distinguishing a borderline receipt from an invoice, then retry
- B) Switch to `tool_choice: "auto"` so the model has the option to fall back to a plain-text response instead of a tool call
- C) `tool_choice: "any"` only guarantees *a* call, not the *right* one; add a validation step that detects field-presence mismatches against the chosen schema, returns a structured error naming the better-fitting schema, and lets the model retry against that feedback
- D) Drop the contract schema — most real documents are receipts or invoices anyway, and fewer options should reduce misrouting

**Q53.** A pipeline routes extractions below 0.70 overall confidence to human review and auto-approves the rest. After 1,000 documents, fabricated vendor names almost never get caught by review — they only surface weeks later downstream — while extractions that land at 0.68–0.72 confidence (right at the boundary) turn out to be correct almost every time they're checked. What's actually wrong with the routing, and what closes the gap?

- A) The threshold is simply too high; drop it to 0.50 so more extractions get reviewed
- B) Confidence is poorly calibrated specifically for fabrication — the model can be very confident about an invented value; add stratified random sampling of a small percentage of *high*-confidence extractions specifically to surface the failure patterns confidence scoring can't see
- C) Field-level confidence is too fine-grained; collapse everything into one binary approve/review decision
- D) Switch from overall confidence to the minimum field-level confidence as the routing signal instead

**Q54.** An `amount` field keeps extracting as the string `"1234 dollars"` instead of the required numeric type. A retry loop feeds back the original document, the failed output, and the exact validation error each time, but four consecutive retries reproduce the identical mistake. What should happen next, and why is a fifth retry not the answer?

- A) Retry a fifth time with a larger `max_tokens` budget, in case the model needs more room to reason through the fix
- B) Recognize this as a schema-design problem, not a retry problem: accept `amount` as a string, add a deterministic post-processing step to parse "1234 dollars" into `1234`, and move that specific validation out of the pre-approval retry loop entirely
- C) The tokenizer is likely confusing the word "dollars" with the number; rephrase the validation error using only numerals and currency symbols
- D) Persist through up to 10 retries — enough repetition eventually corrects this class of error

**Q55.** `payment_method` was originally required, and extraction never failed the schema — but downstream audits found it was frequently fabricated (e.g., "Paid by credit card" invented for documents that never mention payment method at all). Making the field nullable stopped the fabrication, but now roughly 5% of receipts extract with `payment_method: null` — and some of those actually do state "Paid by credit card" clearly, which the model simply missed. What schema-design principle addresses both problems at once?

- A) Revert to required and rely on better prompting to make extraction more reliable
- B) Add a `payment_method_confidence` field so low-confidence nulls can be distinguished from high-confidence ones
- C) Keep the field optional, but add a `source_location` (or equivalent evidence field) so "genuinely absent from the source" can be distinguished from "present in source but missed by the model" — the latter is a prompt/extraction bug worth fixing, the former isn't
- D) Default to the string `"unknown"` instead of `null`, so the field is always populated

**Q56.** A single document has both receipt-like fields (vendor, total, date) and invoice-like fields (itemized line items, subtotal). Two purpose-built tools exist — `extract_receipt` and `extract_invoice` — and merging them would bloat both schemas. With `tool_choice: "auto"`, the model sometimes picks receipt (losing line-item detail) and sometimes picks invoice (fabricating a PO number that doesn't exist on the document). The team needs both the line-item data and the receipt-style category field, without a bloated unified schema. What's the best design?

- A) Merge into one universal schema, marking invoice-only fields as optional
- B) Keep `tool_choice: "any"` with sharpened, non-overlapping descriptions distinguishing point-of-sale receipts from formal itemized invoices, and add a validation step: if the extraction doesn't match the detected document type, return a structured error and let the model retry against the corrected schema
- C) Add a `classify_document_type` tool that must run first, before either extractor can be invoked
- D) Keep `tool_choice: "auto"` and just add stronger prompt language about when each tool applies

**Q57. (Select TWO)** A confidence-based review process flags everything below a threshold and auto-approves the rest, but three failure classes never surface through it: vendor hallucinations on less-common vendors, category misclassification on ambiguous purchases, and date-parsing errors in non-US formats — all emerging only in downstream audits weeks later. Which TWO additions would help catch these specific classes of failure?

- A) Stratified random sampling that specifically targets high-confidence extractions the review process would otherwise never look at, to surface patterns confidence scoring structurally can't see
- B) Mandatory human review for any extraction involving a newly-encountered vendor name or document type the model hasn't handled before
- C) Raise the confidence threshold to 0.95 so nearly everything routes to human review
- D) Run a second, independent extraction pass on the same document, and route to human review whenever the two passes disagree on any field

**Q58.** A pipeline computes per-field confidence (amount 0.95, vendor 0.93, category 0.38, date 0.87) and an `overall_confidence` as their geometric mean (0.78), auto-approving anything above 0.75. An audit finds approved receipts where category confidence was as low as 0.32 (masked by high amount/vendor scores) and the category field was wrong in downstream processing — while receipts where every field sits around 0.72, yielding an overall_confidence of 0.72, are correctly categorized every time they're checked. What's the actual design flaw?

- A) Geometric mean is the wrong statistic; switch to arithmetic mean instead
- B) A single very low field can be masked by the rest and still cause a real downstream failure; use a minimum-field threshold (e.g., auto-approve only if every field individually clears 0.70) instead of any single aggregate statistic
- C) Confidence scoring in general is unreliable here; replace it with a fixed percentage-based approval quota instead
- D) The 0.75 threshold is simply too high; lowering it to 0.60 would reduce review workload without changing anything else

**Q59.** A vendor-name extraction repeatedly returns "AMZN" instead of "Amazon." A retry loop re-prompts with "always expand vendor names to their full legal name" and retries, but after five attempts on the same document, the model still returns an abbreviation roughly 20% of the time. On a different, unrelated validation failure ("vendor missing entirely"), a single retry with the error message resolves the issue 85% of the time. What does this contrast suggest, and what's the right fix for the abbreviation case specifically?

- A) Increase retries to 10 for this category too — persistence eventually pays off
- B) The model is reproducing a real-world abbreviation it has strong prior associations with, and re-prompting won't reliably override that; add a deterministic post-processing step — an alias lookup table (e.g., "AMZN" → "Amazon") — applied before downstream validation, instead of relying on the retry loop
- C) This points to a model-capability gap; switch to a different model better suited to entity extraction
- D) Treat any abbreviation as a hard validation failure and reject the extraction outright rather than retrying

**Q60.** After 50,000 documents over three months, the pipeline's error tracking only records `validation_failed: true/false` — nothing about *why*. The team suspects failures cluster around specific vendors, date formats, or document types, but can't confirm it or prioritize fixes with the data they're currently logging. What should be added to enable systematic root-cause analysis?

- A) A random UUID per extraction, to trace failures back to their source documents
- B) A `detected_pattern` field describing what characteristic triggered the extraction path taken (e.g., `"date_format_ddmmyyyy"`, `"vendor_from_email_subject"`, `"amount_with_currency_symbol"`), so failures can be aggregated by pattern and the highest-impact ones prioritized
- C) A `retry_count` field, to deprioritize documents that keep failing repeatedly
- D) A `model_version` field, to compare accuracy across model updates over time

---

*End of Exam 4. Check your answers against the [Answer Key](exam-4-answers.md).*
