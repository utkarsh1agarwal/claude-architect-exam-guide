# Study Plan — CCAR-P (Professional, v1.1)

## How this guide is organized

Every domain file follows the same shape, **one section per official v1.1 skill** (39 in total):

1. **What the exam is testing** — the skill in one or two sentences
2. **Concept** — plain English, no assumed jargon
3. **Worked example** — a realistic artifact (a config, a trace, an eval table, a usage report, an ADR) because v1.1 questions ask you to *reason from artifacts*
4. **Decision table** — "when you see X, choose Y, because Z"
5. **Anti-pattern → fix table** — the shape most exam distractors take
6. **Exam traps** — the distractor families to watch for
7. **Practice questions** — original, v1.1-style, with rationale
8. **Official docs** — where to go deeper

## Recommended order

Weights are uneven — Integration alone is ~1 in 5 items — so study in this order:

| # | Read | Why this position |
|---|---|---|
| 0 | [About the exam](about-the-exam.md) | Format, weights, the 39 skills, what changed in v1.1 |
| 1 | [Domain 1 — Solution Design](domain-1-solution-design.md) (18%) | The frame every other domain hangs on: patterns, delegation, runtimes |
| 2 | [Domain 3 — Integration](domain-3-integration.md) (21%) | Largest domain; least privilege, retrieval, reliability |
| 3 | [Domain 2 — Models, Prompting, Context](domain-2-models-prompting-context.md) (13%) | Caching, tiers, effort, context lifecycle — feeds D3 and D4 |
| 4 | [Domain 4 — Evaluation](domain-4-evaluation-testing.md) (17%) | Judge bias, trials, root cause, migration |
| 5 | [Domain 5 — Governance](domain-5-governance-safety.md) (16%) | Injection, HITL gates, compliance controls |
| 6 | [Domain 7 — Dev Productivity](domain-7-dev-productivity.md) (8%) | Plugins, managed settings, permission modes |
| 7 | [Domain 6 — Stakeholder & Lifecycle](domain-6-stakeholder-lifecycle.md) (7%) | SLAs, ADRs, handoffs — quick once you know D1–D5 |
| 8 | [Cheat sheet](cheat-sheet.md) | One-page review |
| 9 | [Mock exams](../mock-exam/) | 3 × 70 questions — ideally in the [Interactive Player](https://utkarsh1agarwal.github.io/claude-architect-exam-guide/mock-exam/interactive/#professional) |

**New to Claude architecture?** Foundations is assumed knowledge. Read this repo's [Foundations cheat sheet](../../study-guide/cheat-sheet.md) and [Domain 1 (agentic loop)](../../study-guide/domain-1-agentic-architecture.md) before starting.

## How to read a CCAR-P question

v1.1 items are long and evidence-heavy. Use the same five steps every time:

1. **Read the last sentence first.** What is actually being asked — a fix, a pattern, a ranking, a revision? How many answers (one or two)?
2. **Underline the binding constraint.** Latency SLA? Budget ceiling? Residency? Unattended run? Irreversible action? A legitimate use that must keep working? This is what eliminates options.
3. **Find the deciding evidence.** Usually one number or one line: `cache_read_input_tokens: 0`, a p95 that's over the timeout, a pass rate that flips when outputs are swapped, a config line with `bypassPermissions`.
4. **Eliminate by family.** Cross out options that *instruct instead of enforce*, *detect instead of prevent* (for irreversible harm), *break a stated constraint*, *answer a different question* (e.g., ZDR offered for a location requirement), or *scale up* (bigger model, more retries) when the evidence points elsewhere.
5. **Pick the simplest option that satisfies every constraint and is honest about its trade-off.** If two remain, the one that fixes the root cause — not the symptom — wins.

**Pacing:** 70 items in 120 minutes is ~1 min 43 s each. Do a first pass at ~1:30 per item, flag anything over 2 minutes, and come back. Unscored items are hidden among the 70 — never burn five minutes on one.

## Pick a track

### 4 weeks (~6 h/week)

| Week | Focus | Do this, not just read |
|---|---|---|
| 1 | D1 + D2 | Build a tiny agent on the Messages API with two tools. Put a 3k-token policy in the system prompt with a cache breakpoint; watch `cache_creation_input_tokens` vs `cache_read_input_tokens` in the usage block, then break it by putting a timestamp first. |
| 2 | D3 | Add an MCP server to Claude Code with only two tools enabled. Write a retry wrapper with exponential backoff + jitter and an idempotency key. Sketch the retrieval ladder for a corpus you know. |
| 3 | D4 + D5 | Build a 30-case eval for your agent with a code grader and an LLM judge; swap answer order and see whether the judge flips. Add a PreToolUse hook that blocks one irreversible action. |
| 4 | D6 + D7 + mocks | Write one honest ADR for a real decision. Package a skill + hook as a plugin. Take Mock Exam 1 untimed, then Exams 2 and 3 timed on separate days. Re-read the domain sections behind every miss. |

### 10 days (~2 h/day)

| Day | Focus |
|---|---|
| 1 | About the exam + D1 |
| 2 | D3 (first half: least privilege, auth, performance, monitoring) |
| 3 | D3 (second half: retrieval, connection mechanism, progressive discovery, reliability) |
| 4 | D2 |
| 5 | D4 |
| 6 | D5 |
| 7 | D6 + D7, then the cheat sheet |
| 8 | Mock Exam 1 (timed) + review every miss |
| 9 | Mock Exam 2 (timed) + review |
| 10 | Mock Exam 3 (timed), cheat sheet, logistics check |

### 3 days (you already ship Claude in production)

- **Day 1:** About the exam (especially *What changed*), then the **At a glance**, **Decision**, and **Anti-pattern** tables of every domain. Skip prose you already know.
- **Day 2:** Mock Exam 2 timed. For each miss, read that skill's section in full.
- **Day 3:** Mock Exam 3 timed, review, cheat sheet. Confirm ID and exam setup.

## Readiness signals

| Signal | Ready? |
|---|---|
| ≥ 80% on Mock Exams 2 **and** 3 (timed) | Likely in good shape |
| 70–79% | Close — target your two weakest domains, then retake one mock |
| < 70%, or any domain under 60% | Not yet — go back to that domain's tables and practice questions |

Mock scores are a gut check, not a prediction — the real exam is scaled (720/1000) and only 60 of its 70 items count.

## Regardless of track

- **Build something.** The guide recommends delivering at least one end-to-end production solution. The exam rewards judgment you get from seeing real usage reports, traces, and eval results.
- **Practice reading other people's artifacts** — configs, traces, ADRs, eval tables. That's literally how v1.1 items are written.
- **Re-answer, don't re-read.** After each mock, cover the rationale and answer missed items again a day later.
