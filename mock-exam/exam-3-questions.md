# Mock Exam 3 — Questions

> Every question here is original material written against the public CCAR-F blueprint — none of it is drawn from or paraphrased from real exam content. See [CONTRIBUTING.md](../CONTRIBUTING.md#the-one-hard-rule) for why that boundary matters and how to add more questions the right way.

## How to take it

- **A closer simulation of the real draw than Exam 1:** this mock pulls 60 questions from **4 of the 6** official scenarios — **Code Generation with Claude Code · Claude Code for Continuous Integration · Customer Support Resolution Agent · Structured Data Extraction** — rather than covering all 6. It deliberately weights toward two areas that are easy to under-study: iterative refinement techniques and validation/retry feedback loops.
- **Set a timer for 120 minutes.** That's ~2 minutes per item — tight enough that you need to move on from anything you're stuck on, just like the real thing.
- **No notes, no search, no assistant.** Simulate real conditions as closely as you can.
- Some items are marked **"(Select TWO)"** — treat these as multiple-response; you must get both parts correct to receive credit. Don't treat section labels as a scoring hint.
- Score yourself against [exam-3-answers.md](exam-3-answers.md) afterward — it includes a per-domain breakdown, which is a more useful diagnostic than the raw score alone.
- **Run this alongside Exam 2:** Exam 2 leans D1/D5 in its scenario draw, this one leans D3/D4 — together their combined per-domain totals approximate the real 27/18/20/20/15 split more closely than either alone.

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
- A) Reduce `max_tokens` so the model has less room to improvise
- B) Ask for five more attempts and pick the best one
- C) Repeat the same request with stronger emphasis ("please be consistent this time")
- D) Provide 2–3 concrete before/after examples showing exactly what "cleaned up" means for this codebase's style

**2.** Before implementing a rate-limiting feature in a service Claude hasn't seen before, a developer wants Claude to first ask about traffic patterns, failure behavior under load, and whether limits should be per-user or global. What technique does this describe, and when is it most valuable?
- A) Prompt chaining — valuable for any multi-step task regardless of familiarity
- B) Plan mode — but only for single-file changes
- C) Test-driven iteration — valuable only when a test suite already exists
- D) The interview pattern — most valuable in unfamiliar domains where the developer may not have anticipated key design considerations

**3.** A team wants Claude to build a data-migration script and has already written a test suite covering expected behavior, edge cases (including null values), and performance constraints. What is the recommended way to use these tests during development?
- A) Show Claude the tests once at the start, then ignore test results during implementation
- B) Iterate by sharing test failures with Claude after each attempt, letting it progressively correct the implementation
- C) Convert the tests into prose requirements instead of running them
- D) Withhold the tests until the implementation is "done" so Claude isn't biased toward passing them narrowly

**4.** A pull request fixes three bugs that interact — fixing bug 1 changes the correct approach to fixing bug 2. Which approach to communicating these to Claude is better?
- A) Report each bug in a separate message, waiting for a fix before mentioning the next
- B) Only describe the most severe bug and let Claude discover the other two independently
- C) Ask Claude to guess which bugs might be related before describing any of them
- D) Describe all three interacting issues together in one detailed message

**5.** A team is deciding between a single-file bug fix (clear stack trace, one obvious cause) and a cross-service authentication redesign (multiple valid approaches, dozens of files). Which pairing is correct?
- A) Direct execution for the bug fix; plan mode for the authentication redesign
- B) Plan mode for both, since plan mode is always safer
- C) Direct execution for both, since Claude Code doesn't meaningfully benefit from planning
- D) Plan mode for the bug fix; direct execution for the redesign

**6.** A `/deploy-check` slash command should run the team's pre-deployment checklist and be available to every developer immediately after cloning the repo. Where should it live?
- A) `.claude/commands/deploy-check.md` in the repository
- B) A `.claude/config.json` commands array
- C) `~/.claude/commands/deploy-check.md`
- D) Inside the root `CLAUDE.md` file as a named section

**7.** A "brainstorm alternative approaches" skill tends to produce long, exploratory output that isn't useful to keep in the main conversation once a decision is made. Which frontmatter setting addresses this?
- A) `context: fork`
- B) `allowed-tools`
- C) `paths`
- D) `argument-hint`

**8.** Two engineers on the same team have different personal preferences for commit-message style, but the team's actual required conventions live correctly in the project-level CLAUDE.md. One engineer also has their personal preferences saved in `~/.claude/CLAUDE.md`. What's true about this setup?
- A) It's broken — user-level and project-level CLAUDE.md files cannot coexist
- B) It's fine — the user-level file applies only to that engineer and doesn't affect teammates via version control
- C) Only one CLAUDE.md file can be active per repository
- D) The user-level file will silently overwrite the project-level file for everyone

**9.** A large monorepo has different testing conventions for unit tests, integration tests, and end-to-end tests, each identifiable by filename pattern but scattered across many directories. What's the best way to load the right convention automatically based on which file is being edited?
- A) Three separate skills that must be manually invoked before editing each test type
- B) Three separate directory-level CLAUDE.md files, duplicated into every directory containing tests
- C) One root CLAUDE.md with three sections and hope Claude infers the right one
- D) Three separate `.claude/rules/*.md` files, each with `paths` frontmatter matching the relevant filename pattern

**10.** A developer wants to compare two different caching strategies starting from the same point in their investigation of a codebase, without redoing the initial exploration twice. What capability supports this?
- A) `--resume` with two different session names created independently
- B) `/compact` run twice
- C) `fork_session`, branching two parallel explorations from the shared baseline
- D) Restarting from scratch for each strategy

**11.** A developer resumes a two-day-old session to continue a refactor, but teammates modified several of the files Claude had already analyzed in that session. Claude's suggestions reference outdated function signatures. What should have been done?
- A) Used `fork_session` instead of `--resume`
- B) Started an entirely new session with zero context
- C) Informed the resumed session explicitly about which files changed, prompting targeted re-analysis
- D) Increased `max_tokens` for the resumed session

**12.** A skill for generating boilerplate files should never be allowed to run destructive shell commands, even accidentally. Which frontmatter field enforces this restriction directly?
- A) `argument-hint`
- B) `paths`
- C) `context: fork`
- D) `allowed-tools`

**13.** A developer needs to trace how a specific exported utility function is used across a codebase, including through re-export wrapper modules with different names. What's the most effective approach?
- A) First identify all exported names for the function (including wrapper re-exports), then `Grep` for each name across the codebase
- B) `Read` every file in the repository upfront to build full context before searching
- C) `Glob` for `**/*.ts` and manually scan the output
- D) Ask the user to supply the call sites manually

**14.** During a long exploration session tracing a legacy codebase's dependency graph, Claude starts giving vague answers referencing "typical patterns" instead of the specific classes it examined 90 minutes earlier. What's the most direct fix?
- A) Increase `max_tokens` on each subsequent call
- B) Switch to a different underlying model mid-session
- C) Have the agent maintain a scratchpad file recording key findings, and reference it for subsequent questions
- D) Restart with zero context and re-explore from scratch

**15.** A task requires exploring an unfamiliar codebase's structure without exhausting the main session's context on verbose file-by-file discovery output. Which capability is designed for this?
- A) `fork_session`
- B) `/memory`
- C) The Explore subagent
- D) `context: fork` applied to CLAUDE.md

---

## Scenario 2: Claude Code for Continuous Integration (Items 16-30)

**16.** A CI job runs `claude "Review this PR for security issues"` and hangs indefinitely. What's the fix?
- A) Redirect `/dev/null` into stdin
- B) `claude -p "Review this PR for security issues"`
- C) Set `CLAUDE_HEADLESS=true` as an environment variable
- D) Add a `--batch` flag

**17.** The team wants automated review findings posted as individual inline PR comments by a script, requiring machine-parseable output rather than free-form prose. Which combination of flags supports this?
- A) `--resume` with a named session
- B) `-p` alone is sufficient
- C) `fork_session` for each file reviewed
- D) `--output-format json` combined with `--json-schema`

**18.** A CI pipeline re-runs code review after each new commit to a PR, and developers complain about receiving duplicate comments for issues already flagged (and already acknowledged as "won't fix") in the previous run. What should change?
- A) Disable review entirely after the first commit
- B) Nothing — duplicate comments are unavoidable with automated review
- C) Include prior review findings in context on re-runs, and instruct Claude to report only new or still-unaddressed issues
- D) Switch to `--output-format json` only, without changing the prompt

**19.** A CI-triggered test-generation step keeps suggesting test cases that duplicate scenarios already covered in the existing test suite. What's the most direct fix?
- A) Increase the model's `max_tokens` for test generation
- B) Run test generation twice and manually deduplicate
- C) Provide the existing test files in context so generation avoids already-covered scenarios
- D) Switch to a different CI runner

**20.** The same Claude Code session that generated a bug fix is also used, immediately afterward, to review that fix before merge — and subtle logic errors keep slipping through to a human reviewer instead. What's the underlying issue?
- A) The context window is too small to hold both the fix and the review
- B) The session retains reasoning from generation and is less likely to challenge its own prior decisions; use an independent instance for review
- C) `--output-format json` wasn't enabled during review
- D) The prompt needs more few-shot examples of what bugs look like

**21.** Your CI system wants Claude to auto-generate high-value tests rather than generic boilerplate assertions. What should be documented in CLAUDE.md to improve this?
- A) The CI provider's internal infrastructure details
- B) Testing standards, valuable test criteria, and available fixtures/conventions
- C) The full list of every function in the codebase
- D) Nothing — test quality is purely a function of model capability

**22.** A 14-file PR review produces contradictory findings — a pattern flagged as a bug in one file and approved as fine in another file within the same PR. What's the best structural fix?
- A) Use a model with a larger context window and re-run as a single pass
- B) Require three full-PR passes and keep majority-vote findings
- C) Ask developers to manually pre-split the PR into under-4-file chunks
- D) Split the review into focused per-file passes for local issues, plus a separate cross-file integration pass

**23.** A team wants to move their nightly automated code-review job for `main` (no human waiting on results) to reduce API costs. Which approach fits, and why?
- A) Message Batches API — it's non-blocking and latency-tolerant, well suited to overnight jobs, at 50% lower cost
- B) Message Batches API is inappropriate here since it lacks multi-turn tool calling
- C) Batch it, but only if a real-time SLA under one hour can be guaranteed
- D) Keep it fully synchronous, since batch jobs cannot run unattended

**24.** Developers report that automated review flags a specific pattern as a "style" issue 40% of the time incorrectly, eroding trust in the tool overall — including in categories that are actually accurate. What should be done?
- A) Turn off all automated review categories permanently
- B) Nothing; false positives in one category don't affect trust in others
- C) Add "please be more careful" to the prompt
- D) Define explicit criteria for that category and consider temporarily disabling it while iterating, to protect trust in the accurate categories

**25.** A CI review prompt currently says "flag anything that seems off." What change would most reduce false positives?
- A) Require unanimous agreement from three separate runs before flagging anything
- B) Add "only flag things you're very confident about"
- C) Lower the sampling temperature to 0
- D) Replace the vague instruction with specific, categorical criteria (e.g., "flag a comment only when claimed behavior contradicts actual code behavior")

**26.** A CI pipeline needs Claude to generate a PR summary, then a set of suggested reviewers, then a risk score — as three separate, dependent steps where each step's output feeds the next. Which pattern best matches this?
- A) `fork_session` to branch each step independently
- B) Parallel subagent spawning via the Task tool
- C) Dynamic/adaptive decomposition, since the steps are open-ended
- D) Prompt chaining — a fixed sequential pipeline of well-understood, ordered steps

**27.** Which CLI flag is specifically intended to prevent a CI job from hanging on interactive prompts?
- A) `--resume`
- B) `--json-schema`
- C) `-p` / `--print`
- D) `--output-format`

**28.** A batch code-review job covering 500 files returns partial failures. What's the correct remediation?
- A) Discard failed files permanently, since batches can't be retried
- B) Identify failures by `custom_id` and resubmit only those, adjusting for the specific failure cause
- C) Switch the entire job to synchronous calls going forward
- D) Resubmit the entire batch of 500 files

**29.** A CI test-generation job has an SLA requiring results within 30 hours of PR creation, using the Message Batches API's 24-hour processing window. How should submission timing be handled?
- A) Submit at a frequency (e.g., every 4–6 hours) that guarantees any given PR's batch completes within the 24-hour window, leaving buffer against the 30-hour SLA
- B) Switch to real-time calls entirely, since batch has no SLA guarantee
- C) Submit immediately when the PR opens and hope it completes in time
- D) Submit only once daily at midnight regardless of PR volume

**30. (Select TWO)** Which two statements about the Message Batches API are accurate?
- A) It offers roughly 50% cost savings compared to synchronous calls
- B) Batch requests are correlated to responses using session names via `--resume`
- C) Processing may take up to 24 hours, with no guaranteed latency SLA
- D) It supports multi-turn tool calling within a single batch request

---

## Scenario 3: Customer Support Resolution Agent (Items 31-45)

**31.** Production logs show the agent skips `get_customer` in 15% of cases when the customer volunteers their name, occasionally leading to an incorrect account being modified. What is the most reliable fix?
- A) Add few-shot examples showing correct verification order
- B) Build a routing classifier to detect which tools are relevant per request
- C) Add a programmatic prerequisite that blocks `lookup_order`/`process_refund` until `get_customer` returns a verified ID
- D) Strengthen the system prompt's wording around verification being "mandatory"

**32.** A support agent has tools `get_customer` and `lookup_order` with minimal descriptions, and misroutes order-status questions to `get_customer`. What should be tried first, before adding few-shot examples or restructuring tools?
- A) Expand both descriptions with input formats, example queries, and explicit boundaries distinguishing the two
- B) Build a pre-processing keyword router
- C) Merge the tools into one generic tool
- D) Force `tool_choice` to always select `lookup_order`

**33.** A `PostToolUse` hook is used to convert `lookup_order`'s Unix timestamps and `get_customer`'s ISO 8601 dates into one consistent format before the model reasons about them. What category of problem does this solve?
- A) Tool selection ambiguity
- B) Data-format inconsistency across tools feeding into the model's context
- C) Batch request correlation
- D) Escalation calibration

**34.** A refund-processing hook blocks any `process_refund` call above $500 and redirects to `escalate_to_human`. Which statement correctly characterizes this design choice?
- A) It only works if paired with the Message Batches API
- B) It provides deterministic, guaranteed enforcement of a business rule that a prompt alone cannot guarantee
- C) It should be replaced by a confidence-score threshold instead
- D) It's unnecessary since the system prompt already states the $500 limit

**35.** A multi-issue customer message (a billing dispute and a delivery delay) is handled by resolving only the first-mentioned issue and silently dropping the second. What's the correct decomposition approach instead?
- A) Ask the customer to resend their message with only one issue at a time
- B) Randomly pick which issue to address based on severity keywords
- C) Escalate immediately since multi-issue messages are too complex
- D) Decompose into the distinct items, investigate each with shared context, then synthesize one unified resolution covering both

**36.** `lookup_order` returns multiple matching orders for the identifiers given. What's the correct handling, and why?
- A) Escalate immediately without attempting disambiguation
- B) Process the request against the first match returned
- C) Ask for an additional identifier to disambiguate, rather than guessing
- D) Select heuristically (e.g., most recent), since customers usually mean their latest order

**37.** When escalating a case to a human agent who has no access to the conversation transcript, what should the structured handoff include?
- A) Just a one-line description of the customer's mood
- B) Only the ticket's timestamp
- C) The full raw conversation log, unformatted, with no summary
- D) Customer details, root cause analysis, and a recommended action

**38.** An agent is given 18 tools spanning billing, shipping, loyalty programs, and account management, and tool-selection accuracy for its core support tasks has dropped. What's the most appropriate fix?
- A) Add more few-shot examples covering every possible tool combination
- B) Force `tool_choice: "any"` to guarantee some tool gets called
- C) Increase `max_tokens` for reasoning about tool choice
- D) Scope the agent to only the 4–6 tools relevant to its actual role

**39.** A `lookup_order` call fails due to a backend timeout. Which response correctly distinguishes this from a valid empty result?
- A) Return a generic "no data" string
- B) Return `isError: true` with `errorCategory: "transient"`, `isRetryable: true`, and a description of what was attempted
- C) Return an empty array and mark the call successful
- D) Silently retry forever without informing the coordinator/caller

**40.** First-contact resolution sits at 55% against an 80% target; logs show the agent escalates simple, well-evidenced cases while attempting to autonomously resolve cases that actually require policy exceptions. What's the most effective fix?
- A) A separately trained ML classifier on historical tickets
- B) Self-reported confidence-score routing
- C) Sentiment-based escalation
- D) Explicit escalation criteria with few-shot examples distinguishing escalate-vs-resolve cases

**41.** A 20-turn support conversation is progressively summarized, and a specific dollar amount and order number mentioned early on are lost from the summary by turn 18, causing the agent to ask the customer to repeat themselves. What's the direct fix?
- A) Increase the context window size
- B) Disable summarization for the whole conversation
- C) Maintain a persistent "case facts" block (amount, order ID, dates) that rides along outside the summarized narrative
- D) Ask the customer to restate key facts every turn as a matter of policy

**42.** A customer explicitly and calmly states, "Please transfer me to a human," at the very start of an otherwise simple, resolvable interaction. What should happen?
- A) Attempt to resolve the issue first, since it appears simple, then transfer if the customer insists again
- B) Offer an incentive to keep the customer with the automated agent
- C) Escalate immediately, honoring the explicit request without first attempting investigation
- D) Ask why they want a human before proceeding either way

**43.** Which best describes the risk of using self-reported model confidence scores as the primary escalation trigger?
- A) Confidence scores can't be produced without `context: fork`
- B) Self-reported confidence is often poorly calibrated — the model can be confidently wrong precisely on the hardest cases
- C) Confidence scores require the Message Batches API
- D) Confidence scores are computationally expensive to generate

**44.** A policy document addresses refund exceptions for damaged goods but says nothing about refund exceptions for goods lost in transit. A customer requests exactly this kind of exception. What should the agent do?
- A) Apply the damaged-goods policy by analogy without escalating
- B) Deny the request since it isn't explicitly authorized
- C) Approve the request since it isn't explicitly denied
- D) Escalate, since this is a policy gap rather than a straightforward case

**45. (Select TWO)** Which two of the following are appropriate, reliable escalation triggers per the exam blueprint?
- A) The customer explicitly requests a human agent
- B) The policy is silent or ambiguous on the customer's specific request
- C) The agent's self-reported confidence drops below an arbitrary threshold
- D) The customer's message contains negative sentiment keywords

---

## Scenario 4: Structured Data Extraction (Items 46-60)

**46.** An extraction pipeline validates against a JSON schema and a required field, `purchase_order_number`, fails validation because it's missing. Investigation confirms the source invoice genuinely never included a PO number. What's the correct interpretation?
- A) Increase `max_tokens` and retry
- B) This retry is unlikely to succeed since the information doesn't exist in the source; the field should be nullable instead of required
- C) Retry with the same prompt; missing-field errors are always retry-fixable
- D) The schema needs a stricter type constraint

**47.** A validation-retry loop needs to correct a structural JSON error (a nested array flattened incorrectly) on the second attempt. What should the follow-up prompt include?
- A) Nothing — `tool_use` with schemas should never produce structural errors, so no retry should be needed
- B) The original document, the failed extraction output, and the specific validation error describing the structural mismatch
- C) A brand-new, unrelated example document
- D) Only a repeated instruction to "format correctly this time"

**48.** Which statement correctly distinguishes what `tool_use` with a JSON schema does and does not guarantee?
- A) It guarantees semantic correctness but not syntactic validity
- B) It guarantees syntactic (schema-compliant) validity but not semantic correctness (e.g., values landing in the wrong field or totals not summing)
- C) It guarantees neither, and offers no benefit over plain-text JSON output
- D) It guarantees both syntactic validity and semantic correctness of extracted values

**49.** An enum field for expense category needs to remain useful even as new, unanticipated categories appear in documents over time. What schema pattern handles this well?
- A) Multiple boolean flags, one per possible category
- B) A required string field with no enum constraint at all
- C) A closed enum with no fallback option
- D) An enum with an `"other"` value paired with a free-text `category_detail` field

**50.** Which best describes the purpose of a `detected_pattern` field attached to each automated finding in a review or extraction pipeline?
- A) It determines whether `tool_choice` should be `"auto"` or `"any"`
- B) It stores the model's self-reported confidence
- C) It enables systematic downstream analysis of which specific patterns trigger findings, useful for spotting recurring false-positive causes
- D) It flags whether a finding is retryable

**51.** Few-shot examples are added to an extraction prompt specifically to handle documents with varied structures — some using inline citations, others using bibliographies, some embedding methodology details inline versus in a separate section. What is the main benefit?
- A) They demonstrate correct handling of structural variety, helping the model generalize to formats not explicitly shown
- B) They guarantee the model will never omit a field
- C) They eliminate the need for a JSON schema entirely
- D) Few-shot examples primarily reduce token usage

**52.** An extraction pipeline is being scaled from a 20-document pilot to a 5,000-document production run using the Message Batches API. What should happen before the full run?
- A) Switch to synchronous calls for the full run instead of batch
- B) Submit all 5,000 immediately to save time
- C) Refine the prompt against a smaller sample set first to maximize first-pass success and reduce costly iterative resubmission at scale
- D) Skip validation entirely for the full run since the pilot already passed

**53.** A stakeholder wants to know if a 96% aggregate extraction accuracy is good enough to safely reduce human review across the board. What should be checked first?
- A) The average length of the source documents
- B) Accuracy broken down by document type and by individual field, since aggregate numbers can mask segment-specific failure
- C) Whether `--json-schema` was used during extraction
- D) Nothing further; 96% aggregate is a strong number on its own

**54.** Field-level confidence scores are used to route low-confidence extractions to human reviewers with limited capacity. What should determine the confidence threshold used for routing?
- A) Calibration against a labeled validation set so the threshold maps to actual accuracy
- B) The number of required fields in the schema
- C) The size of the review team, independent of accuracy data
- D) An arbitrary round number chosen for simplicity

**55.** Two extracted values for the same metric conflict because they come from two source documents published a year apart, representing a genuine change over time rather than an error. What structured field, if present, would have prevented this from being misread as a contradiction?
- A) Publication or data-collection date fields on each extracted value
- B) `isRetryable`
- C) `tool_choice`
- D) `errorCategory`

**56.** Which best describes when retrying a failed extraction is NOT likely to help?
- A) When the required information is genuinely absent from the source document entirely
- B) When the model swapped two adjacent fields
- C) When the validation error indicates a structural/format mismatch that's fixable through clearer instructions
- D) When a nested array was flattened incorrectly

**57.** An extraction schema requires `stated_total` and also asks the model to compute `calculated_total` from the line items. What is the purpose of including both?
- A) Enabling downstream detection of semantic mismatches (the two numbers disagree) that schema validation alone wouldn't catch
- B) Redundancy for its own sake
- C) To satisfy `tool_choice: "any"` requirements
- D) To reduce the number of required fields elsewhere

**58.** A synthesis-style extraction task combines financial figures, narrative commentary, and technical specifications from a single source document into one structured output. How should each content type be rendered in the final structured output?
- A) Only the financial figures should be kept; other content types should be dropped
- B) Appropriately to its type — e.g., financial data as tables, narrative as prose, technical specs as structured lists
- C) Uniformly as plain paragraphs regardless of content type
- D) Entirely as a single JSON blob with no formatting distinctions

**59.** A document-extraction pipeline needs to guarantee some structured output happens across three possible schemas, without the model ever responding with plain conversational text instead of calling a tool. Which `tool_choice` value should NOT be used here?
- A) `"auto"`
- B) Both B and C are acceptable depending on certainty about document type
- C) `"any"`
- D) A forced specific tool name, if the document type is already known

**60. (Select TWO)** Which two practices directly help prevent a model from fabricating values during structured extraction?
- A) Marking fields nullable/optional when the source document may not contain them
- B) Making every field required so the model is forced to always provide a value
- C) Including few-shot examples showing correct null/absent-field handling
- D) Increasing `max_tokens` substantially

---


*End of Exam 3. Check your answers against the [Answer Key](exam-3-answers.md).*
