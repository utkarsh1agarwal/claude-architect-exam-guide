# Claude Architect Exam Guide

A free, community-built study guide for Anthropic's **Claude Certified Architect – Foundations (CCAR-F)** exam.

Plain-English explanations, worked examples, anti-pattern tables, and three 60-question mock exams. No fluff, no build step — just markdown you can read straight from GitHub.

**Unofficial and independent.** Not affiliated with, endorsed by, or reviewed by Anthropic. Built from Anthropic's publicly published Exam Guide. Contains no leaked or reproduced exam questions — see [CONTRIBUTING.md](CONTRIBUTING.md) for the rule that keeps it that way.

## Start here

| If you want... | Go to... |
|---|---|
| The exam basics (cost, format, scoring, retakes) | [study-guide/about-the-exam.md](study-guide/about-the-exam.md) |
| How to move through this guide, by how much time you have | [study-guide/study-plan.md](study-guide/study-plan.md) |
| Deep-dive material per domain, with code | [study-guide/domain-1-agentic-architecture.md](study-guide/domain-1-agentic-architecture.md) → domain-5 |
| How the 6 exam scenarios map to domains | [study-guide/scenarios.md](study-guide/scenarios.md) |
| A one-page skim before exam day | [study-guide/cheat-sheet.md](study-guide/cheat-sheet.md) |
| Timed practice questions with an answer key | [mock-exam/exam-a-questions.md](mock-exam/exam-a-questions.md) (all 6 scenarios) · [exam-b](mock-exam/exam-b-questions.md) & [exam-c](mock-exam/exam-c-questions.md) (realistic 4-of-6 draws — run all three for the fullest coverage) |
| Official docs, other community guides, further reading | [study-guide/resources.md](study-guide/resources.md) |
| Quick answers to common questions | [study-guide/faq.md](study-guide/faq.md) |

## The exam at a glance

| | |
|---|---|
| Items | 60 scenario-based multiple-choice / multiple-response |
| Structure | 4 scenarios drawn at random from a bank of 6 |
| Time limit | 120 minutes |
| Passing score | Scaled 720 / 1000 |
| Fee | $125 USD |
| Validity | 12 months |
| Delivery | Online proctored or Pearson VUE test center |

## Domain weights — where to spend your time

| # | Domain | Weight |
|---|---|---|
| 1 | Agentic Architecture & Orchestration | 27% |
| 3 | Claude Code Configuration & Workflows | 20% |
| 4 | Prompt Engineering & Structured Output | 20% |
| 2 | Tool Design & MCP Integration | 18% |
| 5 | Context Management & Reliability | 15% |

Domain 5 is the smallest slice, but it threads through almost every scenario (error handling, escalation, context loss), so it gets reinforced no matter which domain you're nominally studying.

## The single most useful idea in this whole guide

> **When a question is about deterministic guarantees — money, identity, ordering, schema compliance — a structural or programmatic fix (a hook, a prerequisite, a `tool_use` schema, a scoped tool) beats a prompt-based fix almost every time.**
>
> Second: **the root cause is usually upstream of the symptom.** A synthesis agent's report looks broken, but the actual bug is the coordinator's task decomposition. A subagent looks like it failed, but it executed exactly what it was (badly) assigned.

If you read nothing else before the exam, read the [cheat sheet](study-guide/cheat-sheet.md) — it's built entirely around this pattern.

## Repo structure

```
claude-architect-exam-guide/
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
├── study-guide/
│   ├── about-the-exam.md
│   ├── domain-1-agentic-architecture.md
│   ├── domain-2-tool-design-mcp.md
│   ├── domain-3-claude-code-workflows.md
│   ├── domain-4-prompt-engineering.md
│   ├── domain-5-context-reliability.md
│   ├── scenarios.md
│   ├── study-plan.md
│   ├── cheat-sheet.md
│   ├── resources.md
│   └── faq.md
└── mock-exam/
    ├── exam-a-questions.md
    ├── exam-a-answers.md
    ├── exam-b-questions.md
    ├── exam-b-answers.md
    ├── exam-c-questions.md
    ├── exam-c-answers.md
    └── template.md
```

That's it — two folders, both one level deep. Everything is plain markdown; open any file directly on GitHub.

## Contributing

Corrections, new practice questions, better explanations, and translations are all welcome. There's exactly one hard rule: **no real/leaked exam content, ever.** See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

"Claude," "Claude Code," and "Claude Certified Architect" are trademarks of Anthropic, PBC. This is an independent, community-maintained study aid, not a substitute for Anthropic's official Exam Guide — read that in full before scheduling your exam. Passing this guide's mock exam does not guarantee passing the real one.

## License

MIT — see [LICENSE](LICENSE).
