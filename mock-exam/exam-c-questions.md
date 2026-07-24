# Mock Exam C — Questions

> Every question here is original material written against the public CCAR-F blueprint — none of it is drawn from or paraphrased from real exam content. See [CONTRIBUTING.md](../CONTRIBUTING.md#the-one-hard-rule) for why that boundary matters and how to add more questions the right way.

## How to take it

- **A closer simulation of the real draw than Exam A:** this mock pulls 60 questions from **4 of the 6** official scenarios — **Code Generation with Claude Code · Claude Code for Continuous Integration · Customer Support Resolution Agent · Structured Data Extraction** — rather than covering all 6. It deliberately weights toward two areas that are easy to under-study: iterative refinement techniques and validation/retry feedback loops.
- **Set a timer for 120 minutes.** That's ~2 minutes per item — tight enough that you need to move on from anything you're stuck on, just like the real thing.
- **No notes, no search, no assistant.** Simulate real conditions as closely as you can.
- Some items are marked **"(Select TWO)"** — treat these as multiple-response; you must get both parts correct to receive credit. Don't treat section labels as a scoring hint.
- Score yourself against [exam-c-answers.md](exam-c-answers.md) afterward — it includes a per-domain breakdown, which is a more useful diagnostic than the raw score alone.
- **Run this alongside Exam B:** Exam B leans D1/D5 in its scenario draw, this one leans D3/D4 — together their combined per-domain totals approximate the real 27/18/20/20/15 split more closely than either alone.

## Scoring guide

Simulated passing score: **48/60 (≈720 scaled)** — matches the real exam's scaled cut score. Rough gut-check only, not the real exam's formal standard-setting result.

| Raw score (out of 60) | Rough read |
|---|---|
| 50+ | Likely in good shape — do a final cheat-sheet skim and go |
| 40–49 | Solid, but review your weakest domain(s) before scheduling |
| Below 40 | Not ready yet — go back through the study guide and study plan first |

---

## Scenario 1: Code Generation with Claude Code (Items 1-15)

**1.** A developer asks Claude to "clean up this parsing function" with no further detail. Three separate attempts produce three meaningfully different refactors, each reasonable in isolation but inconsistent with each other. What is the most effective way to converge on a consistent result?
- A) Repeat the same request with stronger emphasis ("please be consistent this time")
- B) Provide 2–3 concrete before/after examples showing exactly what "cleaned up" means for this codebase's style
- C) Reduce `max_tokens` so the model has less room to improvise
- D) Ask for five more attempts and pick the best one

**2.** Before implementing a rate-limiting feature in a service Claude hasn't seen before, a developer wants Claude to first ask about traffic patterns, failure behavior under load, and whether limits should be per-user or global. What technique does this describe, and when is it most valuable?
- A) Prompt chaining — valuable for any multi-step task regardless of familiarity
- B) The interview pattern — most valuable in unfamiliar domains where the developer may not have anticipated key design considerations
- C) Test-driven iteration — valuable only when a test suite already exists
- D) Plan mode — but only for single-file changes

**3.** A team wants Claude to build a data-migration script and has already written a test suite covering expected behavior, edge cases (including null values), and performance constraints. What is the recommended way to use these tests during development?
- A) Show Claude the tests once at the start, then ignore test results during implementation
- B) Iterate by sharing test failures with Claude after each attempt, letting it progressively correct the implementation
- C) Withhold the tests until the implementation is "done" so Claude isn't biased toward passing them narrowly
- D) Convert the tests into prose requirements instead of running them

**4.** A pull request fixes three bugs that interact — fixing bug 1 changes the correct approach to fixing bug 2. Which approach to communicating these to Claude is better?
- A) Report each bug in a separate message, waiting for a fix before mentioning the next
- B) Describe all three interacting issues together in one detailed message
- C) Only describe the most severe bug and let Claude discover the other two independently
- D) Ask Claude to guess which bugs might be related before describing any of them

**5.** A team is deciding between a single-file bug fix (clear stack trace, one obvious cause) and a cross-service authentication redesign (multiple valid approaches, dozens of files). Which pairing is correct?
- A) Plan mode for both, since plan mode is always safer
- B) Direct execution for the bug fix; plan mode for the authentication redesign
- C) Direct execution for both, since Claude Code doesn't meaningfully benefit from planning
- D) Plan mode for the bug fix; direct execution for the redesign

**6.** A `/deploy-check` slash command should run the team's pre-deployment checklist and be available to every developer immediately after cloning the repo. Where should it live?
- A) `~/.claude/commands/deploy-check.md`
- B) `.claude/commands/deploy-check.md` in the repository
- C) Inside the root `CLAUDE.md` file as a named section
- D) A `.claude/config.json` commands array

**7.** A "brainstorm alternative approaches" skill tends to produce long, exploratory output that isn't useful to keep in the main conversation once a decision is made. Which frontmatter setting addresses this?
- A) `argument-hint`
- B) `paths`
- C) `context: fork`
- D) `allowed-tools`

**8.** Two engineers on the same team have different personal preferences for commit-message style, but the team's actual required conventions live correctly in the project-level CLAUDE.md. One engineer also has their personal preferences saved in `~/.claude/CLAUDE.md`. What's true about this setup?
- A) It's broken — user-level and project-level CLAUDE.md files cannot coexist
- B) It's fine — the user-level file applies only to that engineer and doesn't affect teammates via version control
- C) The user-level file will silently overwrite the project-level file for everyone
- D) Only one CLAUDE.md file can be active per repository

**9.** A large monorepo has different testing conventions for unit tests, integration tests, and end-to-end tests, each identifiable by filename pattern but scattered across many directories. What's the best way to load the right convention automatically based on which file is being edited?
- A) One root CLAUDE.md with three sections and hope Claude infers the right one
- B) Three separate `.claude/rules/*.md` files, each with `paths` frontmatter matching the relevant filename pattern
- C) Three separate skills that must be manually invoked before editing each test type
- D) Three separate directory-level CLAUDE.md files, duplicated into every directory containing tests

**10.** A developer wants to compare two different caching strategies starting from the same point in their investigation of a codebase, without redoing the initial exploration twice. What capability supports this?
- A) `--resume` with two different session names created independently
- B) `fork_session`, branching two parallel explorations from the shared baseline
- C) Restarting from scratch for each strategy
- D) `/compact` run twice

**11.** A developer resumes a two-day-old session to continue a refactor, but teammates modified several of the files Claude had already analyzed in that session. Claude's suggestions reference outdated function signatures. What should have been done?
- A) Used `fork_session` instead of `--resume`
- B) Informed the resumed session explicitly about which files changed, prompting targeted re-analysis
- C) Started an entirely new session with zero context
- D) Increased `max_tokens` for the resumed session

**12.** A skill for generating boilerplate files should never be allowed to run destructive shell commands, even accidentally. Which frontmatter field enforces this restriction directly?
- A) `context: fork`
- B) `allowed-tools`
- C) `argument-hint`
- D) `paths`

**13.** A developer needs to trace how a specific exported utility function is used across a codebase, including through re-export wrapper modules with different names. What's the most effective approach?
- A) `Read` every file in the repository upfront to build full context before searching
- B) First identify all exported names for the function (including wrapper re-exports), then `Grep` for each name across the codebase
- C) `Glob` for `**/*.ts` and manually scan the output
- D) Ask the user to supply the call sites manually

**14.** During a long exploration session tracing a legacy codebase's dependency graph, Claude starts giving vague answers referencing "typical patterns" instead of the specific classes it examined 90 minutes earlier. What's the most direct fix?
- A) Restart with zero context and re-explore from scratch
- B) Have the agent maintain a scratchpad file recording key findings, and reference it for subsequent questions
- C) Switch to a different underlying model mid-session
- D) Increase `max_tokens` on each subsequent call

**15.** A task requires exploring an unfamiliar codebase's structure without exhausting the main session's context on verbose file-by-file discovery output. Which capability is designed for this?
- A) `fork_session`
- B) The Explore subagent
- C) `/memory`
- D) `context: fork` applied to CLAUDE.md

---

## Scenario 2: Claude Code for Continuous Integration (Items 16-30)

**16.** A CI job runs `claude "Review this PR for security issues"` and hangs indefinitely. What's the fix?
- A) `claude -p "Review this PR for security issues"`
- B) Set `CLAUDE_HEADLESS=true` as an environment variable
- C) Redirect `/dev/null` into stdin
- D) Add a `--batch` flag

**17.** The team wants automated review findings posted as individual inline PR comments by a script, requiring machine-parseable output rather than free-form prose. Which combination of flags supports this?
- A) `-p` alone is sufficient
- B) `--output-format json` combined with `--json-schema`
- C) `--resume` with a named session
- D) `fork_session` for each file reviewed

**18.** A CI pipeline re-runs code review after each new commit to a PR, and developers complain about receiving duplicate comments for issues already flagged (and already acknowledged as "won't fix") in the previous run. What should change?
- A) Nothing — duplicate comments are unavoidable with automated review
- B) Include prior review findings in context on re-runs, and instruct Claude to report only new or still-unaddressed issues
- C) Disable review entirely after the first commit
- D) Switch to `--output-format json` only, without changing the prompt

**19.** A CI-triggered test-generation step keeps suggesting test cases that duplicate scenarios already covered in the existing test suite. What's the most direct fix?
- A) Increase the model's `max_tokens` for test generation
- B) Provide the existing test files in context so generation avoids already-covered scenarios
- C) Run test generation twice and manually deduplicate
- D) Switch to a different CI runner

**20.** The same Claude Code session that generated a bug fix is also used, immediately afterward, to review that fix before merge — and subtle logic errors keep slipping through to a human reviewer instead. What's the underlying issue?
- A) `--output-format json` wasn't enabled during review
- B) The session retains reasoning from generation and is less likely to challenge its own prior decisions; use an independent instance for review
- C) The context window is too small to hold both the fix and the review
- D) The prompt needs more few-shot examples of what bugs look like

**21.** Your CI system wants Claude to auto-generate high-value tests rather than generic boilerplate assertions. What should be documented in CLAUDE.md to improve this?
- A) Nothing — test quality is purely a function of model capability
- B) Testing standards, valuable test criteria, and available fixtures/conventions
- C) The full list of every function in the codebase
- D) The CI provider's internal infrastructure details

**22.** A 14-file PR review produces contradictory findings — a pattern flagged as a bug in one file and approved as fine in another file within the same PR. What's the best structural fix?
- A) Use a model with a larger context window and re-run as a single pass
- B) Split the review into focused per-file passes for local issues, plus a separate cross-file integration pass
- C) Require three full-PR passes and keep majority-vote findings
- D) Ask developers to manually pre-split the PR into under-4-file chunks

**23.** A team wants to move their nightly automated code-review job for `main` (no human waiting on results) to reduce API costs. Which approach fits, and why?
- A) Message Batches API — it's non-blocking and latency-tolerant, well suited to overnight jobs, at 50% lower cost
- B) Message Batches API is inappropriate here since it lacks multi-turn tool calling
- C) Keep it fully synchronous, since batch jobs cannot run unattended
- D) Batch it, but only if a real-time SLA under one hour can be guaranteed

**24.** Developers report that automated review flags a specific pattern as a "style" issue 40% of the time incorrectly, eroding trust in the tool overall — including in categories that are actually accurate. What should be done?
- A) Nothing; false positives in one category don't affect trust in others
- B) Define explicit criteria for that category and consider temporarily disabling it while iterating, to protect trust in the accurate categories
- C) Turn off all automated review categories permanently
- D) Add "please be more careful" to the prompt

**25.** A CI review prompt currently says "flag anything that seems off." What change would most reduce false positives?
- A) Add "only flag things you're very confident about"
- B) Replace the vague instruction with specific, categorical criteria (e.g., "flag a comment only when claimed behavior contradicts actual code behavior")
- C) Lower the sampling temperature to 0
- D) Require unanimous agreement from three separate runs before flagging anything

**26.** A CI pipeline needs Claude to generate a PR summary, then a set of suggested reviewers, then a risk score — as three separate, dependent steps where each step's output feeds the next. Which pattern best matches this?
- A) Dynamic/adaptive decomposition, since the steps are open-ended
- B) Prompt chaining — a fixed sequential pipeline of well-understood, ordered steps
- C) Parallel subagent spawning via the Task tool
- D) `fork_session` to branch each step independently

**27.** Which CLI flag is specifically intended to prevent a CI job from hanging on interactive prompts?
- A) `--json-schema`
- B) `-p` / `--print`
- C) `--resume`
- D) `--output-format`

**28.** A batch code-review job covering 500 files returns partial failures. What's the correct remediation?
- A) Resubmit the entire batch of 500 files
- B) Identify failures by `custom_id` and resubmit only those, adjusting for the specific failure cause
- C) Discard failed files permanently, since batches can't be retried
- D) Switch the entire job to synchronous calls going forward

**29.** A CI test-generation job has an SLA requiring results within 30 hours of PR creation, using the Message Batches API's 24-hour processing window. How should submission timing be handled?
- A) Submit immediately when the PR opens and hope it completes in time
- B) Submit at a frequency (e.g., every 4–6 hours) that guarantees any given PR's batch completes within the 24-hour window, leaving buffer against the 30-hour SLA
- C) Submit only once daily at midnight regardless of PR volume
- D) Switch to real-time calls entirely, since batch has no SLA guarantee

**30. (Select TWO)** Which two statements about the Message Batches API are accurate?
- A) It supports multi-turn tool calling within a single batch request
- B) It offers roughly 50% cost savings compared to synchronous calls
- C) Processing may take up to 24 hours, with no guaranteed latency SLA
- D) Batch requests are correlated to responses using session names via `--resume`

---

## Scenario 3: Customer Support Resolution Agent (Items 31-45)

**31.** Production logs show the agent skips `get_customer` in 15% of cases when the customer volunteers their name, occasionally leading to an incorrect account being modified. What is the most reliable fix?
- A) Strengthen the system prompt's wording around verification being "mandatory"
- B) Add a programmatic prerequisite that blocks `lookup_order`/`process_refund` until `get_customer` returns a verified ID
- C) Add few-shot examples showing correct verification order
- D) Build a routing classifier to detect which tools are relevant per request

**32.** A support agent has tools `get_customer` and `lookup_order` with minimal descriptions, and misroutes order-status questions to `get_customer`. What should be tried first, before adding few-shot examples or restructuring tools?
- A) Merge the tools into one generic tool
- B) Expand both descriptions with input formats, example queries, and explicit boundaries distinguishing the two
- C) Force `tool_choice` to always select `lookup_order`
- D) Build a pre-processing keyword router

**33.** A `PostToolUse` hook is used to convert `lookup_order`'s Unix timestamps and `get_customer`'s ISO 8601 dates into one consistent format before the model reasons about them. What category of problem does this solve?
- A) Tool selection ambiguity
- B) Data-format inconsistency across tools feeding into the model's context
- C) Escalation calibration
- D) Batch request correlation

**34.** A refund-processing hook blocks any `process_refund` call above $500 and redirects to `escalate_to_human`. Which statement correctly characterizes this design choice?
- A) It's unnecessary since the system prompt already states the $500 limit
- B) It provides deterministic, guaranteed enforcement of a business rule that a prompt alone cannot guarantee
- C) It should be replaced by a confidence-score threshold instead
- D) It only works if paired with the Message Batches API

**35.** A multi-issue customer message (a billing dispute and a delivery delay) is handled by resolving only the first-mentioned issue and silently dropping the second. What's the correct decomposition approach instead?
- A) Escalate immediately since multi-issue messages are too complex
- B) Decompose into the distinct items, investigate each with shared context, then synthesize one unified resolution covering both
- C) Ask the customer to resend their message with only one issue at a time
- D) Randomly pick which issue to address based on severity keywords

**36.** `lookup_order` returns multiple matching orders for the identifiers given. What's the correct handling, and why?
- A) Select heuristically (e.g., most recent), since customers usually mean their latest order
- B) Ask for an additional identifier to disambiguate, rather than guessing
- C) Process the request against the first match returned
- D) Escalate immediately without attempting disambiguation

**37.** When escalating a case to a human agent who has no access to the conversation transcript, what should the structured handoff include?
- A) Just a one-line description of the customer's mood
- B) Customer details, root cause analysis, and a recommended action
- C) The full raw conversation log, unformatted, with no summary
- D) Only the ticket's timestamp

**38.** An agent is given 18 tools spanning billing, shipping, loyalty programs, and account management, and tool-selection accuracy for its core support tasks has dropped. What's the most appropriate fix?
- A) Add more few-shot examples covering every possible tool combination
- B) Scope the agent to only the 4–6 tools relevant to its actual role
- C) Force `tool_choice: "any"` to guarantee some tool gets called
- D) Increase `max_tokens` for reasoning about tool choice

**39.** A `lookup_order` call fails due to a backend timeout. Which response correctly distinguishes this from a valid empty result?
- A) Return an empty array and mark the call successful
- B) Return `isError: true` with `errorCategory: "transient"`, `isRetryable: true`, and a description of what was attempted
- C) Return a generic "no data" string
- D) Silently retry forever without informing the coordinator/caller

**40.** First-contact resolution sits at 55% against an 80% target; logs show the agent escalates simple, well-evidenced cases while attempting to autonomously resolve cases that actually require policy exceptions. What's the most effective fix?
- A) Self-reported confidence-score routing
- B) Explicit escalation criteria with few-shot examples distinguishing escalate-vs-resolve cases
- C) Sentiment-based escalation
- D) A separately trained ML classifier on historical tickets

**41.** A 20-turn support conversation is progressively summarized, and a specific dollar amount and order number mentioned early on are lost from the summary by turn 18, causing the agent to ask the customer to repeat themselves. What's the direct fix?
- A) Disable summarization for the whole conversation
- B) Maintain a persistent "case facts" block (amount, order ID, dates) that rides along outside the summarized narrative
- C) Increase the context window size
- D) Ask the customer to restate key facts every turn as a matter of policy

**42.** A customer explicitly and calmly states, "Please transfer me to a human," at the very start of an otherwise simple, resolvable interaction. What should happen?
- A) Attempt to resolve the issue first, since it appears simple, then transfer if the customer insists again
- B) Escalate immediately, honoring the explicit request without first attempting investigation
- C) Offer an incentive to keep the customer with the automated agent
- D) Ask why they want a human before proceeding either way

**43.** Which best describes the risk of using self-reported model confidence scores as the primary escalation trigger?
- A) Confidence scores are computationally expensive to generate
- B) Self-reported confidence is often poorly calibrated — the model can be confidently wrong precisely on the hardest cases
- C) Confidence scores require the Message Batches API
- D) Confidence scores can't be produced without `context: fork`

**44.** A policy document addresses refund exceptions for damaged goods but says nothing about refund exceptions for goods lost in transit. A customer requests exactly this kind of exception. What should the agent do?
- A) Deny the request since it isn't explicitly authorized
- B) Approve the request since it isn't explicitly denied
- C) Escalate, since this is a policy gap rather than a straightforward case
- D) Apply the damaged-goods policy by analogy without escalating

**45. (Select TWO)** Which two of the following are appropriate, reliable escalation triggers per the exam blueprint?
- A) The customer explicitly requests a human agent
- B) The agent's self-reported confidence drops below an arbitrary threshold
- C) The policy is silent or ambiguous on the customer's specific request
- D) The customer's message contains negative sentiment keywords

---

## Scenario 4: Structured Data Extraction (Items 46-60)

**46.** An extraction pipeline validates against a JSON schema and a required field, `purchase_order_number`, fails validation because it's missing. Investigation confirms the source invoice genuinely never included a PO number. What's the correct interpretation?
- A) Retry with the same prompt; missing-field errors are always retry-fixable
- B) This retry is unlikely to succeed since the information doesn't exist in the source; the field should be nullable instead of required
- C) The schema needs a stricter type constraint
- D) Increase `max_tokens` and retry

**47.** A validation-retry loop needs to correct a structural JSON error (a nested array flattened incorrectly) on the second attempt. What should the follow-up prompt include?
- A) Only a repeated instruction to "format correctly this time"
- B) The original document, the failed extraction output, and the specific validation error describing the structural mismatch
- C) A brand-new, unrelated example document
- D) Nothing — `tool_use` with schemas should never produce structural errors, so no retry should be needed

**48.** Which statement correctly distinguishes what `tool_use` with a JSON schema does and does not guarantee?
- A) It guarantees both syntactic validity and semantic correctness of extracted values
- B) It guarantees syntactic (schema-compliant) validity but not semantic correctness (e.g., values landing in the wrong field or totals not summing)
- C) It guarantees semantic correctness but not syntactic validity
- D) It guarantees neither, and offers no benefit over plain-text JSON output

**49.** An enum field for expense category needs to remain useful even as new, unanticipated categories appear in documents over time. What schema pattern handles this well?
- A) A closed enum with no fallback option
- B) An enum with an `"other"` value paired with a free-text `category_detail` field
- C) A required string field with no enum constraint at all
- D) Multiple boolean flags, one per possible category

**50.** Which best describes the purpose of a `detected_pattern` field attached to each automated finding in a review or extraction pipeline?
- A) It stores the model's self-reported confidence
- B) It enables systematic downstream analysis of which specific patterns trigger findings, useful for spotting recurring false-positive causes
- C) It determines whether `tool_choice` should be `"auto"` or `"any"`
- D) It flags whether a finding is retryable

**51.** Few-shot examples are added to an extraction prompt specifically to handle documents with varied structures — some using inline citations, others using bibliographies, some embedding methodology details inline versus in a separate section. What is the main benefit?
- A) Few-shot examples primarily reduce token usage
- B) They demonstrate correct handling of structural variety, helping the model generalize to formats not explicitly shown
- C) They eliminate the need for a JSON schema entirely
- D) They guarantee the model will never omit a field

**52.** An extraction pipeline is being scaled from a 20-document pilot to a 5,000-document production run using the Message Batches API. What should happen before the full run?
- A) Submit all 5,000 immediately to save time
- B) Refine the prompt against a smaller sample set first to maximize first-pass success and reduce costly iterative resubmission at scale
- C) Skip validation entirely for the full run since the pilot already passed
- D) Switch to synchronous calls for the full run instead of batch

**53.** A stakeholder wants to know if a 96% aggregate extraction accuracy is good enough to safely reduce human review across the board. What should be checked first?
- A) Nothing further; 96% aggregate is a strong number on its own
- B) Accuracy broken down by document type and by individual field, since aggregate numbers can mask segment-specific failure
- C) Whether `--json-schema` was used during extraction
- D) The average length of the source documents

**54.** Field-level confidence scores are used to route low-confidence extractions to human reviewers with limited capacity. What should determine the confidence threshold used for routing?
- A) An arbitrary round number chosen for simplicity
- B) Calibration against a labeled validation set so the threshold maps to actual accuracy
- C) The number of required fields in the schema
- D) The size of the review team, independent of accuracy data

**55.** Two extracted values for the same metric conflict because they come from two source documents published a year apart, representing a genuine change over time rather than an error. What structured field, if present, would have prevented this from being misread as a contradiction?
- A) `isRetryable`
- B) Publication or data-collection date fields on each extracted value
- C) `errorCategory`
- D) `tool_choice`

**56.** Which best describes when retrying a failed extraction is NOT likely to help?
- A) When the validation error indicates a structural/format mismatch that's fixable through clearer instructions
- B) When the required information is genuinely absent from the source document entirely
- C) When the model swapped two adjacent fields
- D) When a nested array was flattened incorrectly

**57.** An extraction schema requires `stated_total` and also asks the model to compute `calculated_total` from the line items. What is the purpose of including both?
- A) Redundancy for its own sake
- B) Enabling downstream detection of semantic mismatches (the two numbers disagree) that schema validation alone wouldn't catch
- C) To reduce the number of required fields elsewhere
- D) To satisfy `tool_choice: "any"` requirements

**58.** A synthesis-style extraction task combines financial figures, narrative commentary, and technical specifications from a single source document into one structured output. How should each content type be rendered in the final structured output?
- A) Uniformly as plain paragraphs regardless of content type
- B) Appropriately to its type — e.g., financial data as tables, narrative as prose, technical specs as structured lists
- C) Entirely as a single JSON blob with no formatting distinctions
- D) Only the financial figures should be kept; other content types should be dropped

**59.** A document-extraction pipeline needs to guarantee some structured output happens across three possible schemas, without the model ever responding with plain conversational text instead of calling a tool. Which `tool_choice` value should NOT be used here?
- A) `"auto"`
- B) `"any"`
- C) A forced specific tool name, if the document type is already known
- D) Both B and C are acceptable depending on certainty about document type

**60. (Select TWO)** Which two practices directly help prevent a model from fabricating values during structured extraction?
- A) Marking fields nullable/optional when the source document may not contain them
- B) Making every field required so the model is forced to always provide a value
- C) Including few-shot examples showing correct null/absent-field handling
- D) Increasing `max_tokens` substantially

---


*End of Exam C. Check your answers against the [Answer Key](exam-c-answers.md).*
