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

## Notes

- Progress autosaves to `localStorage` per exam, so a reload mid-attempt offers to resume.
- Every answer key uses the prose format (`**Q<n>. Answer: X** *(Dn)* — rationale`), so the
  review screen shows the full rationale for every question. The parser still accepts the
  older compact table format.
- Foundations question files group items under `## Scenario N: …` headings; Professional
  files use `## Part N: …` (the real CCAR-P exam isn't grouped by scenario), and results are
  broken down by domain.
- To add an exam later, add one line to that track's `exams` array in `TRACKS` at the top of `app.js`.
