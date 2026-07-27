# Claude Certified Architect – Foundations (CCAF) Exam Guide

![CCAF Certified](https://img.shields.io/badge/CCAF-Certified-6E44FF?style=flat-square)


I'm certified as a **Claude Certified Architect – Foundations** (exam code **CCAR-F**, also called **CCAF**), and I'm sharing the free learning material and mock exams I built while preparing for it.

This repo has two things:

1. **A study guide** — plain-English explanations of everything on the exam blueprint, with worked examples and practice questions
2. **Mock exams** — 6 full-length, timed practice exams (360 questions total) with complete answer keys

| Mock Exam | Difficulty | Coverage | Answer Key |
|---|---|---|---|
| [Exam 1](mock-exam/exam-1-questions.md) | Medium | All 6 scenarios | [Answers](mock-exam/exam-1-answers.md) |
| [Exam 2](mock-exam/exam-2-questions.md) | Medium | 4-of-6 draw (leans D1/D5) | [Answers](mock-exam/exam-2-answers.md) |
| [Exam 3](mock-exam/exam-3-questions.md) | Medium | 4-of-6 draw (leans D3/D4) | [Answers](mock-exam/exam-3-answers.md) |
| [Exam 4](mock-exam/exam-4-questions.md) | Hard | All 6 scenarios | [Answers](mock-exam/exam-4-answers.md) |
| [Exam 5](mock-exam/exam-5-questions.md) | Hard | All 6 scenarios | [Answers](mock-exam/exam-5-answers.md) |
| [Exam 6](mock-exam/exam-6-questions.md) | Hard | All 6 scenarios | [Answers](mock-exam/exam-6-answers.md) |

Everything is plain markdown. Open any file directly on GitHub — no sign-up, no build step, no app to install.

> Built from Anthropic's [official CCAR-F Exam Guide](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf) — read that in full before scheduling your exam; it's the only authoritative source on policy, scoring, and blueprint changes. This repo contains no leaked or reproduced exam questions — see [CONTRIBUTING.md](CONTRIBUTING.md#the-one-hard-rule) for the rule that keeps it that way.

---

## Start here

| If you want... | Go to... |
|---|---|
| The exam basics — cost, format, scoring, retakes | [study-guide/about-the-exam.md](study-guide/about-the-exam.md) |
| A study plan for how much time you have | [study-guide/study-plan.md](study-guide/study-plan.md) |
| The learning material, one file per domain | [domain-1](study-guide/domain-1-agentic-architecture.md) · [domain-2](study-guide/domain-2-tool-design-mcp.md) · [domain-3](study-guide/domain-3-claude-code-workflows.md) · [domain-4](study-guide/domain-4-prompt-engineering.md) · [domain-5](study-guide/domain-5-context-reliability.md) |
| How the 6 exam scenarios map to domains | [study-guide/scenarios.md](study-guide/scenarios.md) |
| A one-page skim before exam day | [study-guide/cheat-sheet.md](study-guide/cheat-sheet.md) |
| Timed practice questions with an answer key | [Exam 1](mock-exam/exam-1-questions.md) (all 6 scenarios) · [Exam 2](mock-exam/exam-2-questions.md) & [Exam 3](mock-exam/exam-3-questions.md) (realistic 4-of-6 draws) · [Exams 4](mock-exam/exam-4-questions.md), [5](mock-exam/exam-5-questions.md) & [6](mock-exam/exam-6-questions.md) (all 6 scenarios each, calibrated **hard mode**) |
| The official Anthropic Exam Guide (source of truth) | [Claude Certified Architect – Foundations Exam Guide (PDF)](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf) |
| Official docs and other resources | [study-guide/resources.md](study-guide/resources.md) |
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

Full details, policies, and retake rules: [study-guide/about-the-exam.md](study-guide/about-the-exam.md).

## Domain weights — where to spend your time

| # | Domain | Weight |
|---|---|---|
| 1 | Agentic Architecture & Orchestration | 27% |
| 3 | Claude Code Configuration & Workflows | 20% |
| 4 | Prompt Engineering & Structured Output | 20% |
| 2 | Tool Design & MCP Integration | 18% |
| 5 | Context Management & Reliability | 15% |

Domain 5 is the smallest slice by weight, but it threads through almost every scenario — error handling, escalation, context loss — so it gets reinforced no matter which domain you're studying that day.

## The one idea to remember

> When a question is about deterministic guarantees — money, identity, ordering, schema compliance — a structural or programmatic fix (a hook, a prerequisite, a `tool_use` schema, a scoped tool) beats a prompt-based fix almost every time. And when something looks broken, the root cause is usually upstream of where the symptom shows up.

Most of the anti-pattern tables in this guide come back to this. See the [cheat sheet](study-guide/cheat-sheet.md) for the full one-page version.

## Repo structure

```
claude-architect-exam-guide/
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
├── study-guide/          ← the learning material
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
└── mock-exam/            ← the practice exams
    ├── exam-1-questions.md
    ├── exam-1-answers.md
    ├── exam-2-questions.md
    ├── exam-2-answers.md
    ├── exam-3-questions.md
    ├── exam-3-answers.md
    ├── exam-4-questions.md
    ├── exam-4-answers.md
    ├── exam-5-questions.md
    ├── exam-5-answers.md
    ├── exam-6-questions.md
    ├── exam-6-answers.md
    └── template.md
```

## Contributing

Corrections, new practice questions, better explanations, and translations are welcome. One hard rule: **no real or leaked exam content, ever.** See [CONTRIBUTING.md](CONTRIBUTING.md).

## About the author

I wrote this guide while studying for and passing the CCAF exam myself. Everything here is built from Anthropic's public Exam Guide and my own notes.

## Disclaimer


Unofficial — I'm certified, this guide isn't. Not affiliated with or reviewed by Anthropic.

"Claude," "Claude Code," and "Claude Certified Architect" are trademarks of Anthropic, PBC. This is an independent, community-maintained study aid — not a substitute for Anthropic's official Exam Guide, which you should read in full before scheduling your exam. Passing these mock exams does not guarantee passing the real one.

## License

MIT — see [LICENSE](LICENSE).
