# Mock Exam 3 — Answer Key

Domain tags: **D1** Agentic Architecture · **D2** Tool Design & MCP · **D3** Claude Code Workflows · **D4** Prompt Engineering · **D5** Context & Reliability.

## Answer Key

| # | Answer | Domain | # | Answer | Domain | # | Answer | Domain |
|---|---|---|---|---|---|---|---|---|
| 1 | D | D3 | 21 | B | D3 | 41 | C | D5 |
| 2 | D | D3 | 22 | D | D3 | 42 | C | D5 |
| 3 | B | D3 | 23 | A | D4 | 43 | B | D5 |
| 4 | D | D3 | 24 | D | D4 | 44 | D | D5 |
| 5 | A | D3 | 25 | D | D4 | 45 | A, B | D5 |
| 6 | A | D3 | 26 | D | D1 | 46 | B | D4 |
| 7 | A | D3 | 27 | C | D3 | 47 | B | D4 |
| 8 | B | D3 | 28 | B | D4 | 48 | B | D4 |
| 9 | D | D3 | 29 | A | D4 | 49 | D | D4 |
| 10 | C | D1 | 30 | A, C | D4 | 50 | C | D4 |
| 11 | C | D1 | 31 | C | D1 | 51 | A | D4 |
| 12 | D | D3 | 32 | A | D2 | 52 | C | D4 |
| 13 | A | D2 | 33 | B | D1 | 53 | B | D5 |
| 14 | C | D5 | 34 | B | D1 | 54 | A | D5 |
| 15 | C | D5 | 35 | D | D1 | 55 | A | D5 |
| 16 | B | D3 | 36 | C | D5 | 56 | A | D4 |
| 17 | D | D3 | 37 | D | D1 | 57 | A | D4 |
| 18 | C | D3 | 38 | D | D2 | 58 | B | D5 |
| 19 | C | D3 | 39 | B | D2 | 59 | A | D4 |
| 20 | B | D4 | 40 | D | D5 | 60 | A, C | D4 |

## Scoring Your Domain Breakdown

| Domain | Items in this mock | Your score (___/___) | Real exam weight |
|---|---|---|---|
| D1 – Agentic Architecture & Orchestration | ~9 | ___ | 27% |
| D2 – Tool Design & MCP Integration | ~4 | ___ | 18% |
| D3 – Claude Code Configuration & Workflows | ~18 | ___ | 20% |
| D4 – Prompt Engineering & Structured Output | ~19 | ___ | 20% |
| D5 – Context Management & Reliability | ~10 | ___ | 15% |

**Why this mock leans D3/D4:** its scenario draw (Code Generation, CI/CD, Structured Extraction) is naturally D3/D4-heavy — this mirrors how the real exam's random 4-of-6 draw can shift your effective domain mix from attempt to attempt. Run **both mocks** and add your per-domain totals together for a more balanced read on where you actually stand; Exam 2 leaned D1/D5, so the combined 120-item total should approximate the real 27/18/20/20/15 split closely.

---

## Two things worth adding to your prep guide before exam day

Based on this pair of mocks, make sure your prep guide has explicit answers ready for these two patterns — they came up repeatedly above and are currently thin or missing in your notes:

1. **Iterative refinement (3.5):** input/output examples > repeated prose; test-driven iteration (share failures, not just tests); the "interview pattern" for unfamiliar domains; single message for *interacting* issues vs. sequential for *independent* ones.
2. **Validation-retry loops (4.4):** always include the original doc + failed output + specific error in the retry prompt; know the difference between a fixable structural error (retry helps) and genuinely absent source information (retry won't help, field should be nullable); `detected_pattern` fields for tracking dismissal patterns over time.
