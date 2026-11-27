# Changelog

All notable changes to this repo are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project doesn't use semantic versioning in the software sense, but tags dated releases so you can tell how fresh the content is against the current CCAR-F exam guide version.

## [Unreleased]

### Changed
- Foundations guide updated for the **CCAR-F exam guide v1.1** (November 2026). The blueprint is unchanged; registration, cancellation (OnVUE 1 hour / test center 48 hours), name-correction, support and appeals details now match v1.1. Added a note that newer Claude Code calls the Task tool **Agent**.

### Added
- **Professional (CCAR-P) track, written for exam guide v1.1 (effective 2026-12-07)** under `professional/`: about-the-exam (format, weights, all 39 skills, v1.0 → v1.1 diff), study plan with a question-reading method, seven domain guides (one section per official skill: concept, artifact-based worked example, decision table, anti-pattern table, exam traps, practice questions, official docs), cheat sheet, resources mapped per domain, FAQ
- Three original 70-question CCAR-P mock exams (one medium, two hard) weighted to the v1.1 blueprint, every answer explaining the key and each distractor; product facts checked against Anthropic documentation (November 2026)
- Interactive player now supports both certifications (Foundations / Professional tabs, `#professional` deep link, per-domain names in results)
- Root `index.html` landing page and `sitemap.xml` for GitHub Pages
- Player: **study mode** (instant answer + rationale), **practice by domain** across all exams in a track, **flag for review** (saved with progress), review filters (all / incorrect / flagged), *Show all options* on review cards, and a **shareable score card** (download, LinkedIn, X, native share). Flagging and full-option review were inspired by community PRs #2 and #3 from Thomas Westhead
- Social preview image (`assets/social-preview.png`) used for Open Graph / Twitter cards
- **Study guide on the website** (`guide/`): every Foundations and Professional study-guide page as a themed web page with a sidebar, "On this page" contents, hidden-answer practice questions ("Show answer"), a "Practice this domain" button that opens the player straight into a study-mode set, prev/next navigation and per-page SEO metadata; generated from the Markdown by `node tools/build-guide.mjs` (sitemap now lists all 26 pages)
- Player deep links: `#<track>/practice/<D#>` starts a domain practice set directly
- ☕ Buy me a coffee pop-up (`mock-exam/interactive/support.js`): UPI QR code, an "Open in UPI app" deep link for phones and a copy-UPI-ID button; opened from Buy me a coffee buttons on the landing page, player and guide, or via `…/#support` (linked from every Markdown footer). International options can be added later via `coffee` in the config
- Author credit on every page: an author card on the landing page, bylines on the player, README and every guide page, and an author + support footer (GitHub star, LinkedIn, ☕ Buy me a coffee) on all 44 Markdown pages — all driven by `tools/site.config.json` via `node tools/update-footers.mjs`
- README note that registration requires Claude Partner Network membership (suggested in community PR #1)
- Exam 4: a fourth 60-question mock exam covering all 6 scenarios, calibrated to a harder difficulty than Exams 1–3 (finer mechanism-level distractors, SLA/timing calculations, four select-two items) — complete answer key with domain tagging
- Exam 5 and Exam 6: two more 60-question mock exams at the same hard-mode calibration as Exam 4, each independently verified against every other exam in the set (and against the community-provided reference question banks used to calibrate difficulty) to ensure no duplicate or near-duplicate questions

### Fixed
- Six broken section links in Foundations `scenarios.md` (anchors for headings containing `&`)

### Changed
- Practice-question options in the domain notes are now Markdown list items, so they render one per line on GitHub and the website
- README restructured to cover both certifications up front
- Renamed the existing mock exams from letters to numbers (Exam A → 1, B → 2, C → 3) to accommodate Exams 4–6 and give the set a consistent, open-ended numbering scheme; all internal cross-links and references across the repo updated accordingly

## [1.0.0] — 2026-07-24

### Added
- Five domain guides (Agentic Architecture & Orchestration, Tool Design & MCP Integration, Claude Code Configuration & Workflows, Prompt Engineering & Structured Output, Context Management & Reliability), each with concepts, worked examples, anti-pattern tables, and practice questions
- Domain 2 coverage of MCP resources vs. tools; Domain 3 coverage of Claude Code's `settings.json` hook system (distinct from Agent SDK hooks); Domain 5 coverage of chunking and map-reduce synthesis for long single documents
- Scenario overview mapping all 6 official exam scenarios to domains
- Study plan tracks (30-day, 9-day, crunch)
- One-page cheat sheet organized around the "structural fix vs. prompt fix" heuristic
- Three 60-question mock exams: Exam 1 (full 6-scenario coverage) and Exams 2 & 3 (realistic 4-of-6 scenario draws, leaning D1/D5 and D3/D4 respectively) — each with a complete answer key and domain tagging
- Resources page (official docs + community guides)
- FAQ page
- Built and cross-checked against Exam Guide v1.0 (effective July 2026, exam code CCAR-F)

[Unreleased]: https://github.com/utkarsh1agarwal/claude-architect-exam-guide/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/utkarsh1agarwal/claude-architect-exam-guide/releases/tag/v1.0.0
