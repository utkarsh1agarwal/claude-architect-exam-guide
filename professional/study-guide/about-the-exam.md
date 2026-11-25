# About the Exam — Claude Certified Architect – Professional (CCAR-P)

Everything on this page is summarized from Anthropic's official **CCAR-P Exam Guide, version 1.1 (effective December 7, 2026)** and the Anthropic Partner Academy certification FAQ. The official guide is the only authoritative source — read it in full before you book, especially for policies that can change.

> **Which version am I sitting?** Exams taken **on or after December 7, 2026** use the v1.1 blueprint (70 items, new weights, 39 skills). Exams taken **before** that date use v1.0 (63 items). This guide is written for **v1.1**; see [What changed in v1.1](#what-changed-from-v10-to-v11) if you studied from older material.

## Who it's for

CCAR-P targets architects who design, deploy, and govern **production** Claude solutions for enterprises. The guide's recommended experience:

- **3+ years** in systems architecture or platform engineering
- **At least 6 months** of hands-on work with Claude in production
- A solid software-engineering foundation — modular design, separation of concerns, scalability

The intended candidate works daily with the Claude Developer Platform, Agent Skills, Claude Code and the Claude Agent SDK, the Model Context Protocol (MCP), and Claude Managed Agents — and understands how the Anthropic API differs from the **Amazon Bedrock, Google Vertex AI, and Microsoft Foundry** deployment surfaces. Typical environments: regulated enterprises with data-residency and audit obligations, multi-tenant SaaS, CI/CD, retrieval infrastructure, observability and eval tooling, and enterprise identity and secrets management.

**Foundations is assumed knowledge.** CCAR-F is not a formal prerequisite, but the v1.1 guide says its scope is assumed knowledge for this exam. If you haven't studied it, skim this repo's [Foundations study guide](../../study-guide/) first — especially the agentic loop, hooks vs. prompts, tool design, and structured output.

## Exam details at a glance

| | v1.1 (from Dec 7, 2026) |
|---|---|
| Credential | Claude Certified Architect – Professional |
| Exam code | CCAR-P |
| Number of items | **70** — **60 scored + 10 unscored** (unscored items are mixed in and not identified) |
| Item format | Scenario-based multiple choice; **each item states how many responses to select** (so "select two" items still exist) |
| Time limit | 120 minutes (~1 min 43 s per item) |
| Delivery | Proctored by Pearson — online (OnVUE) or at a test center |
| Passing score | Scaled **720** on a 100–1,000 scale |
| Fee | $175 USD per attempt |
| Validity | 12 months; free non-proctored renewal assessment if renewed on time |
| Languages | English and Japanese |
| Eligibility | Claude Partner Network members (partner company email domain), 18+ |
| Result reporting | Pass/fail + scaled score + percent-correct per domain |

**No official practice exam exists.** The one on the previous platform was retired in the move to Pearson; the three sample questions in the guide are the only official items. That's one reason this repo's [mock exams](../mock-exam/) exist.

## Content domains and weights (v1.1)

| # | Domain | Weight | ≈ scored items | Study guide |
|---|---|---|---|---|
| 1 | Solution Design and Architecture | **18%** | ~11 | [domain-1](domain-1-solution-design.md) |
| 2 | Claude Models, Prompting, and Context Engineering | **13%** | ~8 | [domain-2](domain-2-models-prompting-context.md) |
| 3 | Integration | **21%** | ~13 | [domain-3](domain-3-integration.md) |
| 4 | Evaluation, Testing, and Optimization | **17%** | ~10 | [domain-4](domain-4-evaluation-testing.md) |
| 5 | Governance, Safety, and Risk Management | **16%** | ~10 | [domain-5](domain-5-governance-safety.md) |
| 6 | Stakeholder Communication and Lifecycle Management | **7%** | ~4 | [domain-6](domain-6-stakeholder-lifecycle.md) |
| 7 | Developer Productivity and Operational Enablement | **8%** | ~5 | [domain-7](domain-7-dev-productivity.md) |

Item counts are approximate (weight × 60 scored items) — the guide publishes weights, not counts. Integration + Solution Design + Evaluation are over half the exam.

## The 39 skills

The v1.1 guide lists 39 named skills "against which exam items are written". Each domain guide in this repo has one section per skill, in the official order:

| Domain | Skills |
|---|---|
| **D1** Solution Design (6) | Task delegation between Claude and humans · End-to-end architecture evaluation · Architectural pattern selection · Orchestrator and subagent decomposition · Value-based architectural decisions · Deployment surface and agent runtime selection |
| **D2** Models & Context (6) | Model tier selection · System prompt diagnosis and revision · Prompting technique selection · Context composition and token economics · Cache breakpoints and reusable packaging · Reasoning effort and context lifecycle |
| **D3** Integration (8) | Least-privilege tool configuration · Authentication and authorization posture · Relieving the binding performance constraint · Instrumentation and monitoring gaps · Retrieval architecture selection · Connection mechanism selection · Progressive discovery vs. monolithic context loading · Production reliability controls |
| **D4** Evaluation (7) | Evaluation coverage gaps · Deriving evaluations from business processes · LLM-as-judge design and bias · Experimental design for configuration comparison · Root-cause isolation from logs and traces · Cost and latency optimization · Model version migration |
| **D5** Governance (6) | Guardrail placement · Prompt injection surface and controls · Risk assessment and ranking · Human-in-the-loop checkpoints · Architectural controls for compliance obligations · Bias source identification and mitigation |
| **D6** Stakeholder (3) | Unsupportable commitments in requirements and SLAs · Architecture decision records · Operational handoff completeness |
| **D7** Dev Productivity (3) | Packaging and distributing Claude Code workflows · Agent SDK and Claude Code configuration · Accountability for AI-generated code |

## What the questions look like

v1.1 objectives are written as **"Analyze / Evaluate / Select … given stated constraints"**, and the guide says scenarios present **artifacts you must reason from**: architecture diagrams, config files, logs and traces, eval results, and code. In practice that means:

- **Long stems with evidence.** Expect ~100-word scenarios with a usage report, trace excerpt, eval table, or config snippet. The decisive fact is usually one number or one line in that evidence.
- **"Most directly … without …"** The right option fixes the stated problem *and* respects every other constraint (latency SLA, budget, an unattended run, a legitimate use case that must keep working).
- **Choice + reason + trade-off.** Many items ask you to pick a pattern/runtime/tier *and* the correct justification. A right choice with the wrong reason, or one that claims "no trade-off", is a distractor.
- **Light arithmetic.** Run budgets (cases × configs × trials), latency path sums, cost per *completed* task, reviewer capacity, retry multiplication across layers.
- **Select-two items** are typically "two findings, two fixes": each correct option fixes exactly one finding.

See the [Study Plan](study-plan.md#how-to-read-a-ccar-p-question) for a step-by-step method for reading these items.

## What changed from v1.0 to v1.1

| | v1.0 (through Dec 6, 2026) | v1.1 (from Dec 7, 2026) |
|---|---|---|
| Items | 63 | 70 (60 scored + 10 unscored) |
| Objectives | 38 short task bullets | 39 scenario-style skills |
| D1 Solution Design | 17% | 18% — **adds** Claude-vs-human task delegation and deployment surface / agent runtime selection (Bedrock, Vertex AI, **Microsoft Foundry**, Managed Agents) |
| D2 Models & Context | 13% | 13% — **adds** reasoning effort and context lifecycle (context editing, memory tool, compaction) and cache breakpoints; guardrails move to D5 |
| D3 Integration | 19% | **21%** — **adds** production reliability controls (rate limits, retry/backoff, idempotency, fallback routing); RAG topics merge into retrieval architecture selection |
| D4 Evaluation | 16% | 17% — **adds** LLM-as-judge bias, model version migration, trials per case; monitoring moves to D3 |
| D5 Governance | 14% | **16%** — **removes** named regulations (GDPR, HIPAA, FedRAMP) in favour of architectural controls (residency, ZDR, PII redaction, audit logs, tenant isolation); **adds** the prompt-injection surface (tool results, MCP responses, third-party Skills) |
| D6 Stakeholder | 14% | **7%** — narrowed to three artifact-review skills: SLAs, ADRs, handoff packages |
| D7 Dev Productivity | 7% | 8% — **adds** plugins, marketplaces, managed settings, permission modes (`auto`, `dontAsk`), accountability for AI-written code |

**What this means for studying:** if your notes are v1.0-era, drop the regulation trivia and the discovery/stakeholder soft-skills material, and add the product mechanics — Managed Agents, the Agent SDK permission model, tool search, effort, context lifecycle, plugins and managed settings.

> **Version-label gotcha:** there are *two* PDFs labelled "Version 1.1". One, "Effective November 2026", only updated registration and ID policy and still carries the v1.0 blueprint. The real content revision is the one titled "Updated Dec 7" / "Effective December 7, 2026". This repo follows the Dec 7 document.

## Registration, retakes, and exam day

- Register through **Anthropic Partner Academy**; delivery and scheduling are handled by **Pearson**.
- Reschedule/cancel: online exams up to 1 hour before, test-center exams up to 48 hours before. Later changes forfeit the fee.
- Retakes: wait **14 days** after the 1st fail, **30** after the 2nd, **90** after the 3rd. Max **4 attempts** per rolling 12 months; full fee each time.
- Bring a valid government photo ID matching your registration name exactly. Online: clear desk, webcam view throughout, no phone/notes/second monitor.
- You accept an NDA before the exam. Don't share or seek real exam content — no legitimate resource, including this one, contains it.

## How it's scored

CCAR-P is **criterion-referenced**: you're measured against a fixed standard, not ranked against other candidates. Your pass/fail is based on the **total scaled score**; the per-domain percentages on your report are for feedback only. The 10 unscored items count for nothing, but you can't tell which they are — treat every item as live.

## Sources

- Official guide (v1.1, Dec 7, 2026): [Claude Certified Architect – Professional Exam Guide (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946420/Claude_Certified_Architect_-_Professional_Exam_Guide_Updated_Dec_7.pdf)
- [Anthropic Partner Academy — certification FAQ](https://anthropic-partners.skilljar.com/page/faq-certifications)
- [Official CCAR-P prep course (partner login)](https://anthropic-partners.skilljar.com/path/claude-certified-architect-professional)

<!-- support-footer -->
---

> ⭐ **Found this useful?** [Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) so other candidates can find it · 💼 [Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) for updates and new mock exams.
