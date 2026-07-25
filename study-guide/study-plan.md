# Study Plan

## How this study guide is organized

Every domain file (`domain-1-...md` through `domain-5-...md`) follows the same shape:

1. **Core concepts** — plain-English explanation, no assumed jargon
2. **Worked example** — a concrete code snippet or config you could actually run
3. **Anti-pattern → fix table** — "the system is broken this way, here's the correct fix." This is the dominant shape of the exam's own published sample questions, so it's the highest-leverage format to practice.
4. **Practice questions** — a few per section, with the answer and rationale right below

Once you're used to the pattern, you can move through it faster.

## Recommended order

1. [About the Exam](about-the-exam.md) — format, scoring, policies
2. [Domain 1: Agentic Architecture](domain-1-agentic-architecture.md) — the largest weight, and the conceptual foundation everything else builds on
3. [Domain 3: Claude Code Workflows](domain-3-claude-code-workflows.md) — config-and-workflow focused, can go early
4. [Domain 2: Tool Design & MCP](domain-2-tool-design-mcp.md)
5. [Domain 4: Prompt Engineering](domain-4-prompt-engineering.md)
6. [Domain 5: Context & Reliability](domain-5-context-reliability.md) — threads through everything else; treat it as a synthesis pass
7. [Scenarios](scenarios.md) — see how the 6 official scenarios map to the domains you just studied
8. [Cheat Sheet](cheat-sheet.md) — one-page skim
9. [Mock Exam 1](../mock-exam/exam-1-questions.md) — 60 questions, timed, all 6 scenarios; then [Exam 2](../mock-exam/exam-2-questions.md) and [Exam 3](../mock-exam/exam-3-questions.md) for realistic 4-of-6 draws

If you already have strong hands-on Claude Code experience, feel free to move Domain 3 earlier or skim it — the tracks below adjust for that too.

## Pick a track based on your timeline

### If you have 30 days

| Week | Focus | Activities |
|---|---|---|
| 1 | Domain 1 (Agentic Architecture) | Read the full domain file. Build the agentic loop in Python for real. Implement a toy coordinator + 2 subagents using the Task pattern. |
| 2 | Domain 3 (Claude Code) + Domain 2 (MCP) | Set up a real `CLAUDE.md` hierarchy, `.claude/rules/`, a project-scoped slash command, and one MCP server with env-var expansion. Write two deliberately overlapping tool descriptions, then fix them per the fix ladder. |
| 3 | Domain 4 (Prompt Engineering) | Build one real extraction schema with nullable fields and an enum/other pattern. Implement a validation-retry loop. Write few-shot examples for an ambiguous tool-selection case. |
| 4 | Domain 5 (Context & Reliability) + review | Read the domain file. Re-read the [Cheat Sheet](cheat-sheet.md). Take [Mock Exam 1](../mock-exam/exam-1-questions.md) untimed first, then [Exam 2](../mock-exam/exam-2-questions.md)/[3](../mock-exam/exam-3-questions.md) timed on separate days in the run-up to your exam date. |

Also do the official guide's four Preparation Exercises (Section 8), even in throwaway form — see [Resources](resources.md).

### If you have 7–9 days

| Day | Focus | Activities |
|---|---|---|
| 1–2 | Domain 3 (Claude Code) | Read the domain file. Set up a throwaway repo: project + user `CLAUDE.md`, `.claude/rules/` with glob paths, one slash command. |
| 3 | Domain 2 (Tool Design & MCP) | Read the domain file. Write two overlapping tool descriptions, then fix them. Set up `.mcp.json` with env-var expansion. |
| 4–5 | Domain 1 (Agentic Architecture) | Build the agentic loop pseudocode for real. Study the coordinator/subagent pattern, hooks, and structured handoffs. |
| 6 | Domain 4 (Prompt Engineering) | Build one extraction schema with nullable fields. Know the retry-helps vs. retry-won't-help distinction cold. |
| 7 | Domain 5 (Context & Reliability) + full review | Read the domain file. Re-read the "recurring pattern" heuristic in the [README](../README.md). Redo every practice question in this guide cold, timed. |
| 8 | Mock exam | Take [Mock Exam 1](../mock-exam/exam-1-questions.md) timed, 120 minutes, no notes. Score against the [Answer Key](../mock-exam/exam-1-answers.md). If time allows, [Exam 2](../mock-exam/exam-2-questions.md) or [3](../mock-exam/exam-3-questions.md) makes a good second timed run for a more realistic 4-of-6 draw. |
| 9 | Weak-spot triage + logistics | Re-read only the domain(s) you missed the most in. Skim the [Cheat Sheet](cheat-sheet.md) once, end to end. Confirm exam logistics: ID, quiet room if online-proctored, no notes/phone. |

**Daily minimum:** ~2 hours reading/building, plus re-answering that day's practice questions cold at the end — don't just re-read explanations, actually answer them again.

### If you have 1–2 days

- **Day 1:** Read the [Cheat Sheet](cheat-sheet.md) end to end. Skim [Scenarios](scenarios.md). Read all five domain files once, focusing on the anti-pattern tables rather than the prose — they're the fastest way to absorb the exam's actual question shape.
- **Day 2 (or final hours):** Take [Mock Exam 1](../mock-exam/exam-1-questions.md) timed. Use every wrong answer to speed-read the relevant domain section. If time allows, work through [Exam 2](../mock-exam/exam-2-questions.md), [Exam 3](../mock-exam/exam-3-questions.md), [Exam 4](../mock-exam/exam-4-questions.md), [Exam 5](../mock-exam/exam-5-questions.md), and [Exam 6](../mock-exam/exam-6-questions.md) in the same way — triage wrong answers between each rather than re-reading full domain sections, since each exam is another 120 minutes. Re-skim the cheat sheet once more before your appointment.

This track carries real risk if you haven't built anything hands-on with Claude before — the exam rewards judgment developed through practice, not just pattern recognition from reading. Use it only if you already have meaningful Claude/Agent SDK/Claude Code experience and just need to close blueprint gaps.

## Regardless of track

- Do the [official guide's Preparation Exercises](resources.md) in at least throwaway form if you have API access. The exam consistently tests "what would you observe in logs, and what's the fix" — much easier to reason about once you've built even a minimal version yourself.
- Take the mock exam under real time pressure at least once (120 minutes, no interruptions) before your actual appointment.
- Confirm exam-day logistics at least 48 hours ahead — see [About the Exam](about-the-exam.md#exam-day-rules-worth-knowing-in-advance).
