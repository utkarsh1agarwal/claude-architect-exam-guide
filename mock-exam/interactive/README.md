# Interactive Mock Exam Player

A static HTML/CSS/JS player for **both** certifications — Foundations (CCAR-F, `mock-exam/`)
and Professional (CCAR-P v1.1, `professional/mock-exam/`). It reads the `exam-*-questions.md` /
`exam-*-answers.md` files directly and turns them into a timed, one-question-at-a-time
practice test — one question at a time, timer, question map, and a results screen
with a per-scenario/per-domain breakdown and rationale. It's read-only: nothing here
modifies the `.md` files.

## Running it

**Option A — serve it (recommended, fully automatic):**

```bash
# from the repo root
python3 -m http.server 8000
```

Then open `http://localhost:8000/mock-exam/interactive/` (or `…/interactive/#professional`
for CCAR-P). The page fetches the matching questions and answer files automatically.

**Option B — just double-click `index.html`:**

Browsers block a page opened via `file://` from fetching local files, so the app
detects that and falls back to a small file picker — select the two exam files
manually (it tells you which filenames to pick) and it works the same way from there.

## Features

- **Two certifications** — Foundations / Professional tabs; `#professional` deep-links to CCAR-P.
- **Timed mock exam** — countdown, question map, **flag for review**, autosave and resume (answers and flags).
- **Study mode** — no timer; pick an answer, press *Check answer* (or Enter) to see the key and the full rationale.
- **Practice by domain** — choose a domain and a set size; questions are drawn at random from every exam in the track (needs the page served over http).
- **Results** — score, per-domain table (plus per-scenario for Foundations), review filters *All / Incorrect / Flagged*, and *Show all options* on every review card.
- **Shareable score card** — a 1200×630 PNG drawn client-side, with Download, native Share, LinkedIn, X and Copy-text buttons. Nothing is uploaded.

## Notes

- Progress autosaves to `localStorage` per exam, so a reload mid-attempt offers to resume.
- Every answer key uses the prose format (`**Q<n>. Answer: X** *(Dn)* — rationale`), so the
  review screen shows the full rationale for every question. The parser still accepts the
  older compact table format.
- Foundations question files group items under `## Scenario N: …` headings; Professional
  files use `## Part N: …` (the real CCAR-P exam isn't grouped by scenario), and results are
  broken down by domain.
- To add an exam later, add one line to that track's `exams` array in `TRACKS` at the top of `app.js`.

<!-- support-footer -->
---

> ⭐ **Found this useful?** [Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) so other candidates can find it · 💼 [Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) for updates and new mock exams.
