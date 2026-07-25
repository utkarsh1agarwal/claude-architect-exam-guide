# Resources

## Official Anthropic resources

These are the authoritative sources. When anything in this guide conflicts with them, trust the official source.

- **Official CCAR-F Exam Guide** (v1.0, effective July 2026) — the primary source for this entire repo. Read it in full before scheduling; it's the only document that's authoritative on policy, scoring, and blueprint changes. Available via the Anthropic Partner Academy certification page.
- **Claude Agent SDK docs** — agent definitions, agentic loops, hooks, subagent spawning
- **Claude Code docs** (`code.claude.com/docs`) — `CLAUDE.md`, slash commands, skills, plan mode, CLI flags
- **Model Context Protocol (MCP) spec** — tool/resource design, server configuration
- **Claude API docs** (`platform.claude.com/docs`) — `tool_use`, `tool_choice`, Message Batches API

When skimming official docs, focus on the concepts listed in the Exam Guide's Appendix (Section 17) rather than implementation minutiae — auth, billing, and infrastructure are explicitly out of scope for the exam.

## Community study guides

A number of independent, community-built guides exist for this exam. They vary in depth, currency, and format — some are markdown repos, some are single-page interactive sites, some include mock exams. Worth cross-referencing if you want a second explanation of a concept that isn't clicking:

- Guides built as structured multi-module study courses with runnable SDK/MCP code examples and scenario-based practice questions
- Interactive single-page HTML study guides with visual domain maps and flashcards
- Markdown-based guides that auto-build a PDF/website from source on every commit
- Workshop-style repos pairing reference architectures with exam-mapped notebooks

If you find or maintain one that isn't listed here and it follows the same no-leaked-content standard as this repo, open a PR to add it — see [CONTRIBUTING.md](../CONTRIBUTING.md).

> **Vet before you trust**
>
> Community resources are not reviewed by Anthropic. Cross-check specific factual claims (fees, dates, flag names) against the official Exam Guide, and never trust a resource that claims to contain "real exam questions" — that's a strong signal it violates the exam NDA and shouldn't be used.

## Hands-on practice

The single highest-leverage thing you can do beyond reading: actually build the four Preparation Exercises from the official guide's Section 8, even in throwaway form.

1. Build a multi-tool agent with escalation logic (Domains 1, 2, 5)
2. Configure Claude Code for a team development workflow (Domains 2, 3)
3. Build a structured data extraction pipeline (Domains 4, 5)
4. Design and debug a multi-agent research pipeline (Domains 1, 2, 5)

The exam's questions are shaped like "here's what production logs show, what's the fix" — that's far easier to reason about once you've built even a minimal version of the system being described.

## This repo

- [Domain guides](.) — the five content domains in depth (domain-1 through domain-5 in this folder)
- [Scenarios](scenarios.md) — how the 6 official scenarios map to domains
- [Study Plan](study-plan.md) — 30-day, 9-day, and crunch tracks
- [Cheat Sheet](cheat-sheet.md) — one-page final skim
- [Mock Exams](../mock-exam/exam-1-questions.md) — six 60-question sets ([1](../mock-exam/exam-1-questions.md), [2](../mock-exam/exam-2-questions.md), [3](../mock-exam/exam-3-questions.md), and hard-mode [4](../mock-exam/exam-4-questions.md), [5](../mock-exam/exam-5-questions.md), [6](../mock-exam/exam-6-questions.md)), timed, full answer keys

