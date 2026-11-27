# About the Exam

Everything on this page is drawn directly from Anthropic's official CCAR-F Exam Guide (v1.1, effective November 2026). This page summarizes it for quick reference — the official guide remains the authoritative source, especially for policies that could change.

## Who it's for

The exam targets solution architects and engineers who **design and implement production applications with Claude**, with hands-on experience in:

- Building agentic applications with the Claude Agent SDK (multi-agent orchestration, subagent delegation, tool integration, lifecycle hooks)
- Configuring Claude Code for team workflows (`CLAUDE.md`, Agent Skills, MCP integrations, plan mode)
- Designing MCP tool and resource interfaces
- Engineering prompts for reliable structured output (JSON schemas, few-shot examples)
- Managing context windows across long documents, multi-turn conversations, and multi-agent handoffs
- Integrating Claude into CI/CD for code review, test generation, and PR feedback
- Making escalation and reliability decisions (error handling, human-in-the-loop, self-evaluation)

Typical candidate profile: **6+ months of hands-on experience** with the Claude API, Agent SDK, Claude Code, and MCP.

## Exam details at a glance

| | |
|---|---|
| Credential | Claude Certified Architect – Foundations |
| Exam code | CCAR-F |
| Number of items | 60 |
| Item format | Multiple-choice and multiple-response (each item states how many responses to select) |
| Exam structure | 4 scenarios drawn from a bank of 6 |
| Time limit | 120 minutes |
| Delivery | Online proctored and/or Pearson VUE test center |
| Passing score | Scaled 720 on a 100–1,000 scale |
| Exam fee | $125 USD |
| Validity | 12 months from the date awarded |
| Result reporting | Pass/fail with scaled score, plus percent-correct by domain |

## Content domains and weights

| # | Domain | Weight |
|---|---|---|
| 1 | Agentic Architecture & Orchestration | 27% |
| 2 | Tool Design & MCP Integration | 18% |
| 3 | Claude Code Configuration & Workflows | 20% |
| 4 | Prompt Engineering & Structured Output | 20% |
| 5 | Context Management & Reliability | 15% |

## The 6 exam scenarios

Each exam draws **4 of these 6** scenarios at random; every question in the exam is framed around one of them. See [Scenarios Overview](scenarios.md) for a full breakdown of what each one tests.

1. Customer Support Resolution Agent
2. Code Generation with Claude Code
3. Multi-Agent Research System
4. Developer Productivity with Claude
5. Claude Code for Continuous Integration
6. Structured Data Extraction

## How it's scored

CCAR-F is **criterion-referenced**: you're measured against a fixed performance standard set by subject matter experts, not ranked against other candidates. The cut score (720) was set through a formal standard-setting study. Your score report shows percent-correct by domain, but your pass/fail result is based on your **total scaled score**, not per-domain performance.

> **What changed in v1.1?** Only registration, identification and support details (sections 11–16 of the official guide). The blueprint — domains, weights, scenarios, task statements, sample questions — is identical to v1.0, so everything else in this guide still applies.

## Registration and scheduling

1. Open your certification page on the **Anthropic Partner Academy**, review the exam details, and download the exam guide, the Certification Terms and Conditions and the Certification Exam Policy.
2. Click **Register**, confirm your exam and exam profile, then **Continue to Pearson**.
3. At **Pearson VUE**, choose online proctoring (OnVUE) or a test center, pick a date and time, and check out. The price shown includes any partner discount.
4. Already registered? Use **Go to my Pearson account** to schedule, take the exam, or see results and receipts.

## Cancelling, rescheduling and retakes

- **Cancel or reschedule:** OnVUE (online) exams up to **1 hour** before the appointment; test-center exams up to **48 hours** before. Later changes forfeit the fee.
- Rescheduling keeps your price, including any discount. Cancelling triggers an automatic refund of what you paid at Pearson checkout (7–10 business days).
- **Retakes:** waiting periods grow with each fail — **14 days** after the 1st, **30 days** after the 2nd, **90 days** after the 3rd.
- Maximum **4 attempts per exam** in a rolling 12 months; failing one exam doesn't stop you registering for a different one. The fee applies to each attempt.
- No-shows and late arrivals forfeit the fee and must re-register.

## Exam-day rules worth knowing in advance

- Bring a **valid, unexpired, government-issued photo ID** that matches your registration name exactly.
- **Fix your name before you schedule**, in your exam profile on Partner Academy. You can change it yourself **once** — it locks when you confirm the profile. Online-exam updates sync almost instantly; for a test center, update at least **24 hours** ahead (it syncs once a day).
- If online-proctored: stay in webcam view the whole session, clear workspace, no phone/notes/secondary monitor.
- You'll accept a confidentiality/NDA agreement before starting — this is also why no legitimate study resource (including this one) should ever contain real exam content.
- Accommodations must be requested and **approved by Pearson VUE before scheduling** — don't book until approved.

## Support and appeals

- **certifications-support@anthropic.com** — sign-in problems, reaching Pearson, an exam missing from your Pearson account, a missing partner discount, profile details you can't change, or a refund that hasn't arrived after 10 business days.
- **Pearson VUE support** (pearsonvue.com/us/en/anthropic.html) — exam-day problems, checkout, scheduling, cancelling, accommodations and results.
- **Appeals:** within **14 days** of a decision, or of your exam date for a concern about your result, through Pearson VUE support. Standard-setting outcomes and individual exam items can't be appealed.

## Recertification

The credential is valid for **12 months**. On-time renewal is a **free, non-proctored assessment** on Anthropic Partner Academy covering what's changed since you certified. If it lapses, you retake the full exam at full fee. If exam content changes significantly, Anthropic may require a full retake instead of the renewal assessment.

## Out of scope (don't waste study time here)

Per the official guide's appendix, these are **explicitly not tested**:

- Fine-tuning or training custom models
- API authentication, billing, or account management
- Deep language/framework implementation details
- Deploying/hosting MCP servers (infra, networking, containers)
- Claude's internal architecture, training, or model weights
- Constitutional AI, RLHF, or safety training methodology
- Embeddings or vector database implementation
- Computer use, vision/image analysis
- Streaming API implementation, rate limiting, pricing calculations
- OAuth/API key rotation details, cloud provider specifics
- Benchmarking, prompt caching implementation details, tokenization internals

If a study resource spends a lot of time on these, that's time you probably don't need to spend.

<!-- support-footer -->
---

> Created by **Utkarsh Agarwal** — certified Claude Certified Architect (Foundations & Professional).
> Found this useful? [⭐ Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) · [💼 Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) · [☕ Buy me a coffee](https://utkarsh1agarwal.github.io/claude-architect-exam-guide/#support)
