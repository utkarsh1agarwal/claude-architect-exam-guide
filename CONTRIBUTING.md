# Contributing to Claude Architect Exam Guide

Thanks for wanting to make this better. This is a community study aid — it gets good because people who are actually taking (or have taken) the exam fix things, add examples, and catch mistakes.

## The one hard rule

**Never submit real or leaked exam content.**

That means:
- No verbatim or paraphrased-but-recognizable questions from the actual CCAR-F exam
- No answer keys sourced from someone's memory of a real exam session
- No screenshots, transcripts, or "brain dumps" of exam content
- No content that violates Anthropic's exam Non-Disclosure Agreement (Section 14 of the official Exam Guide)

Everything in this repo — every practice question, every scenario, every worked example — must be **original material written to test understanding of the public exam blueprint**, not a reproduction of secure exam content. If you're ever unsure whether something crosses this line, leave it out and open an issue to discuss instead.

Violating this rule gets a PR closed immediately, no exceptions, regardless of how good the rest of the contribution is.

## What's welcome

- **Corrections** — technical inaccuracies, outdated API/CLI details, broken links
- **Clarity improvements** — if an explanation confused you, it'll confuse others; rewrite it
- **New original practice questions** — scenario-based, with a rationale for the correct answer and why each distractor is wrong (see existing questions in `mock-exam/` for the format)
- **Worked examples / code snippets** — runnable Python or config examples that illustrate a concept (Agent SDK, MCP tool definitions, `.mcp.json`, `CLAUDE.md`, hooks, etc.)
- **Anti-pattern → fix entries** — the "system is failing, what's the fix" tables are the highest-value content in this repo; more of them is always good
- **Translations** — open an issue first so we can agree on structure (e.g., `study-guide/i18n/es/`)
- **Study plan variants** — if you prepared on a different timeline or background (e.g., non-engineer, 30-day track), a PR adding that variant is welcome

## Style guidelines

- Plain English first, jargon second. If a term needs the exam's vocabulary, define it inline the first time it's used in a file.
- Every domain page should read the same way: **concept → why it's tested → worked example → anti-pattern table → practice question(s)**. Match this shape when adding sections.
- Code snippets should be short and illustrative, not production-complete. Comment the "why," not just the "what."
- Keep sentences short. This is a study guide, not a whitepaper.
- Cite the official Exam Guide section number when referencing blueprint content (e.g., "see Task Statement 1.3").

## Adding a practice question

Use this template (also in `mock-exam/template.md`). The question goes in the relevant `mock-exam/exam-*-questions.md` file, under the right scenario heading; the answer goes in the matching `mock-exam/exam-*-answers.md` file, same question number:

```markdown
**Q<N>.** [Scenario-grounded question stem, 2–4 sentences of context, then the actual question]

- A) ...
- B) ...
- C) ...
- D) ...
```

```markdown
**Q<N>. Answer: X** *(D<domain number>)* — [2–4 sentence rationale explaining why the
correct answer is correct, and briefly why the most tempting distractor is wrong if it
isn't obvious.]
```

Aim for questions in the "system is failing, pick the fix" shape — that's the dominant pattern in the real exam's public sample questions, and it's the most useful thing to practice.

## Submitting a change

1. Fork the repo and create a branch: `git checkout -b fix/domain-3-hooks-typo`
2. Make your change. Preview it on GitHub (or any markdown previewer) to check formatting, especially tables and code blocks.
3. Update `CHANGELOG.md` under `[Unreleased]` with a one-line summary.
4. Open a PR describing what changed and why. Link any relevant Exam Guide section.
5. Be responsive to review comments — most PRs need one small round of edits.

## Code of conduct

Be kind. Assume good faith. This exists because someone was generous enough to write it down and share it for free — keep that spirit going.
