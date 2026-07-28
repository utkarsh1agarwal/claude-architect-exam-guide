# Mock Exam 1 — Questions

> Every question here is original material written against the public CCAR-F blueprint — none of it is drawn from or paraphrased from real exam content. See [CONTRIBUTING.md](../CONTRIBUTING.md#the-one-hard-rule) for why that boundary matters and how to add more questions the right way.

## How to take it

- **Mirrors the real format:** 60 questions, organized around all 6 official scenarios (10 questions each), so you get full coverage regardless of which 4 the real exam draws for you. For a closer simulation of an actual sitting — a random 4-of-6 draw instead of full coverage — take [Exam 2](exam-2-questions.md) and [Exam 3](exam-3-questions.md) too.
- **Set a timer for 120 minutes.** That's ~2 minutes per item — tight enough that you need to move on from anything you're stuck on, just like the real thing.
- **No notes, no search, no assistant.** Simulate real conditions as closely as you can.
- Some items are multiple-response ("select two"). Most items are single-select, but read the stem carefully.
- Score yourself against [exam-1-answers.md](exam-1-answers.md) afterward. Anything you missed, go re-read that section in the [study guide](../study-guide/) — don't just read the rationale and call it learned.

## Scoring guide

Rough gut-check only — not the real exam's scaled scoring.

| Raw score (out of 60) | Rough read |
|---|---|
| 50+ | Likely in good shape — do a final cheat-sheet skim and go |
| 40–49 | Solid, but review your weakest domain(s) before scheduling |
| Below 40 | Not ready yet — go back through the study guide and study plan first |

The real exam's cut score is a scaled 720/1000, set through a formal standard-setting study — this table is just a rough gut-check for a practice set.

**More exams welcome:** even six 60-question sets get stale after enough run-throughs. If you'd like to contribute another one, see [CONTRIBUTING.md](../CONTRIBUTING.md#adding-a-practice-question) — use [template.md](template.md) for the format.

---

## Scenario 1: Customer Support Resolution Agent

**Q1.** Your resolution agent occasionally calls `process_refund` before `get_customer` has returned a verified identity, even though the system prompt says identity verification is mandatory first. What is the most reliable fix?

- A) Rewrite the system prompt in bold, capitalized text
- B) Add a programmatic prerequisite that blocks `process_refund` until `get_customer` returns a verified ID
- C) Lower the model's temperature
- D) Add five few-shot examples showing correct ordering

**Q2.** `get_account_status` and `get_account_details` have nearly identical one-line descriptions. The agent frequently calls the wrong one for billing questions. What's the most effective first step?

- A) Merge the two tools into one
- B) Expand both descriptions with input formats, example queries, and explicit "use this vs. that" boundaries
- C) Add a keyword pre-router in front of the agent
- D) Force `tool_choice` to a single named tool

**Q3.** A lookup for "Utkarsh Agarwal" returns three matching customer records. What should the agent do?

- A) Pick the most recently active account
- B) Pick the account with the most orders
- C) Ask the customer for an additional identifier (email, order number, zip code)
- D) Process the request against all three accounts and let the customer confirm afterward

**Q4.** A customer says, "I want to speak to a human right now," about a routine, easily resolvable issue. What should the agent do?

- A) Attempt to resolve the issue first, and escalate only if the customer repeats the request
- B) Escalate immediately, honoring the explicit request
- C) Explain why a human isn't necessary and continue autonomously
- D) Ask the customer to describe the issue in more detail before deciding

**Q5.** A case is escalated to a human agent who cannot see the prior conversation. The handoff contains only a ticket number and the words "customer upset." What's missing?

- A) A sentiment classification score
- B) A structured summary: customer details, root cause, recommended action
- C) The full unedited transcript
- D) A timestamp of when escalation occurred

**Q6.** Your team wants to block any refund over $500 from being auto-approved, regardless of what the model decides. What's the most reliable mechanism?

- A) A system prompt clause stating the $500 limit
- B) A pre-call tool-interception hook that blocks `process_refund` above $500 and redirects to escalation
- C) A few-shot example showing a refund being denied at $501
- D) Reducing `max_tokens` so large numbers can't be generated

**Q7.** Multiple heterogeneous MCP tools return dates in different formats (Unix timestamps, ISO-8601, and localized strings). This is causing the agent to misinterpret order age. What's the best fix?

- A) A `PostToolUse` hook that normalizes all date formats before the model sees them
- B) A system prompt instructing the model to "convert dates carefully"
- C) Removing date fields from tool responses entirely
- D) Asking the customer to always state dates in ISO-8601 format

**Q8.** A customer has two unrelated concerns in one message: a billing dispute and a shipping delay. What's the best approach?

- A) Address only the first concern mentioned and ask the customer to submit the second separately
- B) Decompose into distinct concerns, investigate each with shared context, then synthesize one unified response
- C) Escalate immediately since multi-concern messages are inherently too complex
- D) Pick whichever concern seems more urgent and ignore the other

**Q9.** Your team currently escalates cases when the model's self-reported confidence score falls below 6/10. First-contact resolution remains far below target, with easy cases escalated and hard cases handled autonomously. What's wrong with this design?

- A) The threshold is set too high and should be lowered
- B) Self-reported confidence is poorly calibrated — the model is often confidently wrong on exactly the hardest cases
- C) Confidence scores should be averaged over the whole conversation, not per-turn
- D) The threshold should instead be based on the number of tool calls made

**Q10.** An MCP tool returns `{"isError": true, "message": "Operation failed"}` for every kind of failure — timeouts, invalid input, and policy violations alike. What's the problem, and the fix?

- A) No problem; `isError: true` is sufficient signal
- B) The agent can't distinguish retryable from non-retryable failures; add `errorCategory` and `isRetryable` fields
- C) Replace `isError` with an HTTP status code instead
- D) Log the error server-side only, since the agent doesn't need to see it

---

## Scenario 2: Code Generation with Claude Code

**Q11.** A new engineer joins the team and doesn't seem to follow the team's established code style, even though it's documented. Investigation shows the conventions live in `~/.claude/CLAUDE.md` on the tech lead's machine. What's the fix?

- A) Ask the new engineer to manually copy the file
- B) Move the conventions to a project-level `CLAUDE.md` committed to the repo
- C) Repeat the conventions verbally in stand-up each day
- D) Add the conventions to the README instead

**Q12.** Testing conventions need to apply to every `*.test.tsx` file in a large monorepo, regardless of which directory it lives in. What's the most maintainable approach?

- A) A `CLAUDE.md` file in every directory containing tests
- B) A `.claude/rules/testing.md` file with `paths: ["**/*.test.tsx"]` frontmatter
- C) One giant root `CLAUDE.md` with a "Testing" section
- D) A skill that must be manually invoked before writing any test

**Q13.** You're building a skill that performs deep dependency tracing and produces very long, noisy output. You don't want this output cluttering the main conversation. Which `SKILL.md` frontmatter option addresses this?

- A) `argument-hint`
- B) `allowed-tools`
- C) `context: fork`
- D) `paths`

**Q14.** A task involves restructuring a monolithic service into 3 microservices, touching 50+ files, with multiple valid ways to draw service boundaries. What's the right approach?

- A) Direct execution, refining the boundary as you go
- B) Plan mode, to explore and design boundaries before committing to changes
- C) A single, extremely detailed upfront prompt specifying every file change
- D) Direct execution, switching to plan mode only if something unexpected comes up

**Q15.** A developer asks Claude to "clean up this data transformation function," and across three attempts, the definition of "cleaned up" varies each time (sometimes renaming variables, sometimes restructuring logic, sometimes both). What's the most effective fix?

- A) Repeat the same instruction more forcefully
- B) Provide 2–3 concrete before/after examples that pin down what "cleaned up" means here
- C) Lower `max_tokens`
- D) Request five attempts and pick the best one manually

**Q16.** A code review surfaces three interacting bugs in a module — fixing bug 1 changes what the correct fix for bug 2 should be. How should this be communicated to Claude?

- A) One bug per message, sequentially
- B) All three interacting issues together in one detailed message
- C) Only the most severe bug; let Claude find the rest
- D) A summary count of bugs without describing any of them

**Q17.** Before implementing a rate-limiting layer in an unfamiliar service, a developer wants Claude to first surface design questions (burst handling, per-user vs. global limits, failure behavior) rather than jump straight to code. What technique fits best?

- A) Test-driven iteration
- B) The interview pattern
- C) Prompt chaining
- D) Direct execution with a longer prompt

**Q18.** A project-scoped `/deploy-checklist` command should be available to every developer who clones the repo. Where should it live?

- A) `.claude/commands/`
- B) `~/.claude/commands/`
- C) `CLAUDE.md`
- D) `.claude/config.json`

**Q19.** You want Claude to write a test suite, then iteratively improve an implementation based on which tests fail. What should you feed back after each attempt?

- A) Only the original instructions, repeated
- B) The actual test failures from that attempt
- C) A new, unrelated set of instructions each time
- D) Nothing — Claude should be able to infer failures without being told

**Q20.** A developer is unsure whether to use `.claude/rules/` or a subdirectory `CLAUDE.md` for a convention that applies to all files under `src/api/`. Which favors `.claude/rules/`?

- A) The convention only ever applies within that one directory
- B) The convention needs to apply based on file path patterns that might extend beyond one directory in the future
- C) The convention is short enough to fit in one line
- D) There's no meaningful difference between the two options

---

## Scenario 3: Multi-Agent Research System

**Q21.** A coordinator decomposes "renewable energy policy trends" into three subtasks, all focused on solar policy in a single country. Each subagent executes its assigned task correctly, but the final report is extremely narrow. Where's the defect?

- A) The synthesis agent's summarization quality
- B) The coordinator's task decomposition
- C) The web search agent's query construction
- D) The document analysis agent's relevance filtering

**Q22.** Which statement about subagent context is correct?

- A) Subagents automatically inherit the coordinator's full conversation history
- B) Subagents share memory across invocations by default
- C) Subagents require context to be explicitly included in their invocation prompt
- D) Subagents inherit context if invoked within the same API call

**Q23.** A coordinator needs both a web search subagent and a document analysis subagent to run concurrently rather than one after another. How should the coordinator invoke them?

- A) Two separate Task tool calls made in two separate coordinator turns
- B) Multiple Task tool calls emitted in a single coordinator response
- C) One combined subagent that does both jobs
- D) Sequential invocation is the only supported pattern

**Q24.** A search subagent times out. What should it report back to the coordinator?

- A) An empty result set marked as a success
- B) Structured error context: failure type, what was attempted, any partial results, possible alternatives
- C) A generic "search unavailable" string
- D) Nothing — silently retry indefinitely without reporting

**Q25.** The synthesis subagent needs to verify simple facts (dates, names, statistics) very frequently — 85% of verification needs are simple, 15% require deep investigation. Routing every check through the coordinator adds significant latency. What's the best fix?

- A) Give the synthesis agent full access to all search tools
- B) Give the synthesis agent one scoped `verify_fact` tool for the common case; keep coordinator routing for complex cases
- C) Batch all verifications to run at the very end of the pipeline
- D) Remove verification entirely to save time

**Q26.** Two credible sources report different figures for the same statistic. What should the synthesis output do?

- A) Use whichever source is more recent, silently
- B) Average the two figures
- C) Preserve both values with source attribution and flag the discrepancy
- D) Omit the statistic entirely

**Q27.** A subagent's findings are passed to the synthesis agent as a single block of unstructured prose, and the final report loses track of which claim came from which source. What's the fix?

- A) Have the coordinator manually re-attribute claims after the fact
- B) Require subagents to output structured claim-source mappings (claim, excerpt, source, date) that synthesis preserves
- C) Reduce the number of subagents to avoid attribution complexity
- D) Have the synthesis agent guess the most likely source based on writing style

**Q28.** A coordinator's `allowedTools` list does not include `"Task"`. What happens when it tries to delegate to a subagent?

- A) It works normally; `Task` is always available
- B) It cannot spawn subagents at all
- C) It spawns subagents but without passing context
- D) It falls back to a built-in tool automatically

**Q29.** After a subagent crash mid-run, the coordinator needs to resume without losing prior progress. What's the recommended pattern?

- A) Restart the entire pipeline from scratch every time
- B) Each agent exports state to a known location; the coordinator loads a manifest on resume and re-injects it
- C) Rely on the model's memory of the prior session
- D) Manually re-type a summary of progress into the next prompt

**Q30.** A report needs to include findings from sources published a decade apart, describing what appear to be conflicting figures. What should the synthesis output require to avoid misinterpreting a genuine trend as a contradiction?

- A) Publication or data-collection dates on each finding
- B) A single averaged figure across all sources
- C) Removal of the older sources entirely
- D) A confidence score attached to the more recent figure only

---

## Scenario 4: Developer Productivity with Claude

**Q31.** A developer needs to find every file matching `**/*.config.ts` across a large repository. Which built-in tool is correct?

- A) `Grep`
- B) `Glob`
- C) `Read`
- D) `Edit`

**Q32.** A developer needs to find every place in the codebase that calls a specific function by name. Which built-in tool is correct?

- A) `Grep`
- B) `Glob`
- C) `Write`
- D) `Bash` with no arguments

**Q33.** A connected MCP server exposes a `trace_dependencies` tool that's meaningfully more capable than manually chaining `Grep` and `Read`, but the agent keeps using `Grep` instead. What's the most likely cause?

- A) MCP tools are always deprioritized versus built-ins and this can't be changed
- B) The MCP tool's description doesn't make a strong enough case for its capability relative to the familiar built-in
- C) The MCP server is misconfigured at the network level
- D) `Grep` needs to be removed from the tool list entirely

**Q34.** An `Edit` call fails because the anchor text it's trying to match appears more than once in the file. What's the reliable fallback?

- A) Retry `Edit` with the exact same input
- B) Use `Read` to load the full file, then `Write` the corrected version
- C) Use `Grep` to force a unique match
- D) Skip the edit and ask the user to do it manually

**Q35.** A productivity agent needs credentials for a shared, team-wide MCP server, and the token must never be committed to git. Where should this be configured?

- A) `~/.claude.json` with the token hardcoded
- B) `.mcp.json` with `${TOKEN_NAME}` environment variable expansion
- C) Directly inside `CLAUDE.md`
- D) A comment at the top of the relevant source file

**Q36.** A developer wants a personal, experimental MCP server that only they use, without affecting teammates. Where should it be configured?

- A) `.mcp.json` in the repo
- B) `~/.claude.json`
- C) `.claude/rules/`
- D) A shared team wiki page

**Q37.** After several hours of exploring a large, unfamiliar codebase, Claude starts giving vague answers about "typical patterns" instead of referencing the specific classes it found earlier. What's the most direct fix?

- A) Restart with no context
- B) Maintain a scratchpad file recording key findings for the agent to reference
- C) Switch to a different model mid-session
- D) Increase `max_tokens`

**Q38.** A developer wants to build understanding of an unfamiliar codebase efficiently, without reading every file upfront. What's the recommended exploration pattern?

- A) Use `Read` on every file in the repository first
- B) Start with `Grep` to find entry points, then `Read` to follow imports and trace flow
- C) Use `Bash` to `cat` the entire repo into one context block
- D) Ask the user to describe the codebase verbally instead of exploring it

**Q39.** A generic tool named `process_data` is used for three very different jobs: extracting data points, summarizing content, and verifying claims — and the agent frequently uses it incorrectly. After improving the description doesn't fully resolve the confusion, what's the next step on the fix ladder?

- A) Add ten few-shot examples immediately, skipping other options
- B) Split `process_data` into purpose-specific tools: `extract_data_points`, `summarize_content`, `verify_claim`
- C) Remove the tool entirely
- D) Rename it without changing its scope

**Q40.** A team wants to give a productivity agent both `Read`/`Write`/`Bash` and 15 additional MCP tools for various integrations, all available at once. Recent logs show increasing tool misuse. What's the likely cause and fix?

- A) The model needs a larger context window
- B) Too many available tools increases decision complexity and misuse risk; scope tools per task/role instead
- C) `Bash` should be removed since it's the most dangerous tool
- D) The system prompt needs to list all 18 tools more explicitly

---

## Scenario 5: Claude Code for Continuous Integration

**Q41.** A CI job runs `claude "Summarize the diff and flag risky changes"` and hangs indefinitely, waiting for input. What's the fix?

- A) Add the `-p` (or `--print`) flag
- B) Set an environment variable to disable interactivity
- C) Pipe an empty file into the command as a workaround
- D) Add a `--ci` flag

**Q42.** You want automated PR review findings posted as machine-parseable inline comments. What CLI options should you use?

- A) `--verbose` and `--debug`
- B) `--output-format json` combined with `--json-schema`
- C) `--print` alone is sufficient
- D) `--format text`

**Q43.** The same Claude Code session that generated a bug fix is also used to review that fix before merge, and subtle logic issues are consistently missed. Why?

- A) The context window is too small
- B) The same session retains its generation reasoning, making it less likely to challenge its own prior decisions
- C) `--output-format json` wasn't set
- D) The model needs more few-shot examples of "good reviews"

**Q44.** Automated code review is producing a 40% false-positive rate concentrated in one finding category. The prompt already instructs the model to "only report high-confidence issues." What's the most effective next step?

- A) Add "be even more careful" to the prompt
- B) Define explicit, categorical criteria for that finding type, and consider temporarily disabling the category while iterating
- C) Lower the sampling temperature
- D) Permanently disable all review categories

**Q45.** A team wants Claude Code's automated review to avoid duplicate comments across re-runs after new commits are pushed to a PR. What should be included in context on re-runs?

- A) Nothing — each run should be fully independent
- B) The prior review's findings, with instructions to report only new or still-unaddressed issues
- C) The full git history of the repository
- D) A count of how many times the PR has been reviewed

**Q46.** A single-pass review across a 15-file PR produces inconsistent depth — some files get thorough feedback, others get superficial comments, and the same pattern is flagged in one file but approved in another. What's the fix?

- A) Use a model with a larger context window
- B) Split into per-file local-analysis passes, plus a separate cross-file integration pass
- C) Require developers to submit smaller PRs
- D) Run the same single pass three times and vote on findings

**Q47.** A team wants to reduce API costs on two workflows: (1) a blocking pre-merge check developers wait on, and (2) an overnight technical-debt report. Which should move to the Message Batches API?

- A) Both
- B) Only the overnight report; keep the pre-merge check synchronous
- C) Only the pre-merge check
- D) Neither, since batch API doesn't support any CI use case

**Q48.** Test generation is producing many low-value, duplicate tests that already exist in the suite. What's the most direct fix?

- A) Increase `max_tokens` for the generation call
- B) Provide existing test files in context, and document testing standards/fixtures in `CLAUDE.md`
- C) Disable test generation entirely
- D) Ask developers to write all tests manually going forward

**Q49.** A CI review pipeline needs its findings to be reliably parseable by a downstream bot that posts PR comments. Which is the most robust approach?

- A) Ask the model nicely in the prompt to "format your response as JSON"
- B) Use `--output-format json` with a `--json-schema` to enforce structure
- C) Parse the model's free-text output with regular expressions
- D) Manually reformat the output after each run

**Q50.** Documented testing standards live only in a senior engineer's head and aren't written anywhere the CI pipeline's Claude Code invocation can access. What's the fix?

- A) Rely on the model's general knowledge of "good tests"
- B) Document testing standards, valuable test criteria, and available fixtures in `CLAUDE.md`
- C) Ask the senior engineer to review every PR manually instead
- D) Add the standards to a Slack channel pinned message

---

## Scenario 6: Structured Data Extraction

**Q51.** An extraction pipeline using `tool_use` with a strict JSON schema never produces malformed JSON, but sometimes produces line items that don't sum to the stated total. What does this indicate, and what's the fix?

- A) The schema itself is broken; add more `required` fields
- B) This is a semantic error, not a syntax error; add a `calculated_total` field to compare against `stated_total`
- C) Switch away from `tool_use` to plain text JSON
- D) Reduce `max_tokens` to force shorter output

**Q52.** You have three separate extraction schemas (invoice, receipt, contract) and don't know the document type in advance, but want to guarantee some structured extraction occurs. Which `tool_choice` setting is correct?

- A) `"auto"`
- B) `"any"`
- C) A forced call to one specific schema's tool
- D) Omitting `tool_choice`

**Q53.** A required field, `purchase_order_number`, keeps failing validation because the source document genuinely never contains a PO number anywhere. What should you do?

- A) Keep retrying with the same prompt
- B) Make the field nullable/optional instead of required
- C) Fabricate a placeholder value so validation passes
- D) Increase `max_tokens` and try again

**Q54.** A retry is needed because a nested array of line items was incorrectly flattened into a single string on the first extraction attempt. What should the retry prompt include?

- A) Only a repeated instruction to "format correctly this time"
- B) The original document, the failed extraction, and the specific validation error describing the flattening problem
- C) A completely different, unrelated example document
- D) Nothing further — the model should self-correct silently

**Q55.** Two tools have nearly identical descriptions, causing selection confusion, and you've already rewritten both descriptions with clear boundaries — but genuinely ambiguous edge cases still cause mistakes. What's the next lever?

- A) 2–4 few-shot examples showing correct selection with reasoning for the ambiguous cases
- B) Force `tool_choice` to always pick one tool
- C) Merge the tools into one
- D) Increase `max_tokens`

**Q56.** An extraction pipeline reports 97% overall field accuracy. A stakeholder wants to reduce human review before fully trusting this number. What should happen first?

- A) Immediately reduce human review across the board, since 97% is high
- B) Validate accuracy broken down by document type and field, since aggregate accuracy can mask segment-level failure
- C) Round the accuracy up to 100% for reporting purposes
- D) Stop measuring accuracy since it's already high enough

**Q57.** You want to catch novel extraction error patterns that wouldn't normally be reviewed, since your review process currently only samples low-confidence extractions. What should you add?

- A) Stratified random sampling of high-confidence extractions
- B) A rule to never review high-confidence extractions
- C) A fixed weekly quota of 10 reviews regardless of confidence
- D) Removing confidence scoring entirely

**Q58.** Your team wants to move a blocking, pre-merge invoice-validation workflow to the Message Batches API to save 50% on cost. Is this appropriate?

- A) Yes, always — batch API should be used wherever possible for cost savings
- B) No — batch processing has no latency SLA and can take up to 24 hours, making it unsuitable for a blocking workflow
- C) Yes, as long as `custom_id` is set correctly
- D) Only if the invoices are small in size

**Q59.** An extraction schema needs to categorize expenses, but the fixed set of categories won't cover every real-world case that will eventually appear. What schema design pattern handles this best?

- A) A required `category` string field with no constraints
- B) An `enum` field with a defined set of categories plus an `"other"` value and a `category_detail` string field
- C) A free-text field parsed later with regular expressions
- D) Omitting the category field entirely

**Q60.** After several extraction pipeline iterations, the team wants to systematically analyze which document patterns most often trigger validation errors or get dismissed as false positives by downstream reviewers. What should be added to each structured finding?

- A) A random UUID per finding
- B) A `detected_pattern` field describing what triggered the finding
- C) A free-text comment box with no structure
- D) Nothing — this requires a separate ML model to analyze

---

*End of Exam 1. Check your answers against the [Answer Key](exam-1-answers.md).*

