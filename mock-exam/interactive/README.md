# Interactive Mock Exam Player

A static HTML/CSS/JS player that reads the existing `exam-*-questions.md` /
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

Then open `http://localhost:8000/mock-exam/interactive/`. The page fetches the
matching `../exam-N-questions.md` and `../exam-N-answers.md` files automatically.

**Option B — just double-click `index.html`:**

Browsers block a page opened via `file://` from fetching local files, so the app
detects that and falls back to a small file picker — select the two exam files
manually (it tells you which filenames to pick) and it works the same way from there.

## Notes

- Progress autosaves to `localStorage` per exam, so a reload mid-attempt offers to resume.
- Exams 2 & 3 don't have written rationale in their answer keys (they use a compact
  table format instead of prose) — the review screen shows the domain tag only for those.
- To add a 7th exam later, add one line to the `EXAMS` array at the top of `app.js`.
