# Domain 6: Stakeholder Communication and Lifecycle Management (7%)

In v1.0 this domain was worth **14%** and covered discovery workshops, feedback loops and lifecycle phases in broad terms. In **v1.1 it drops to 7%** (about **4 scored items**) and narrows to three **artifact-review** skills. You will be shown a document — a draft SLA, an architecture decision record (ADR), a handoff package — and asked what is wrong with it and how to fix it.

The good news: these items reward the same reasoning you use everywhere else on the exam. The document is just a new place to spot it. Three questions solve most of them:

1. **Can the architecture actually deliver what this document promises?** (SLA, requirements)
2. **Does the document claim more certainty than the evidence supports?** (ADR)
3. **Could a different team run this at 3 a.m. with only this document?** (handoff)

## At a glance

| # | Skill | You are shown… | You must… | Typical wrong answer |
|---|---|---|---|---|
| 6.1 | Unsupportable commitments in requirements and SLAs | Discovery notes or a draft SLA | Find the clause the architecture can't meet; clarify the requirement or change the architecture | Quietly weaken the promise, or make *everything* synchronous / premium |
| 6.2 | Architecture decision records | A draft ADR plus a stakeholder constraint | Pick the revision that states the trade-off and residual risk honestly | "The model will never…", "Risks: none", a clean rerun as proof |
| 6.3 | Operational handoff completeness | A handoff package for an ops team | Find the missing owner, dependency or runbook step that blocks the receiving team | More monitoring dashboards; "the platform handles it" |

---

## 6.1 Unsupportable Commitments in Requirements and SLAs

**What the exam is testing.** Can you read a business promise and check it against the mechanics of the proposed design? The item hides one clause that the chosen API, endpoint, model lifecycle or eval evidence cannot support. The best answer either **changes the architecture** for the part that needs it or **rewrites the requirement into something measurable and true**. It does not silently drop the promise, and it does not upgrade the whole system to fix one tier.

**Concept.** Most unsupportable commitments fall into five families. Learn the mechanic behind each one.

| Family | Promise that sounds fine | Why the design can't keep it |
|---|---|---|
| **Latency vs async processing** | "Each document scored within 5 minutes of upload" | Message Batches is asynchronous. Most batches finish in under an hour, but results can take up to 24 hours. There is no per-request latency guarantee. |
| **Location vs routing** | "Data is processed only in the EU" | A *global* endpoint (for example, Bedrock global cross-region inference) routes dynamically across regions. Only a regional or geography-scoped endpoint keeps processing in a region, and it usually costs more (Bedrock regional endpoints carry a 10% premium). On the Claude API, `inference_geo` currently offers only `global` and `us`. |
| **Model permanence** | "We will run the same model version for 3 years" | Models move from active to deprecated to retired. Publicly released models get at least 60 days' notice before retirement, and once retired, requests fail. Pinning a model ID does not extend its life. |
| **Statefulness** | "The assistant remembers everything a customer has ever said" | The Messages API is stateless. Memory exists only if *your* app stores and re-sends it (history, summaries, a memory tool backed by your storage), within a finite context window. |
| **Accuracy vs evidence** | "99.9% accuracy on all claims" | Eval results show 97% overall and 91% on the handwritten-forms segment. A blended number hides the weak segment, and no eval can prove "all claims". |

**Simple worked example — a draft SLA.**

```text
DRAFT SLA — Lumen Freight "DocDesk" assistant (v0.3)

Architecture (from design doc): uploads queued nightly into Message Batches;
Bedrock global cross-region inference profile; Sonnet-class model pinned by ID;
stateless Messages calls, no conversation store.

§2.1  Customs documents are classified within 10 minutes of upload.
§2.2  All processing of customer data occurs within the EU.
§2.3  The classification model will remain unchanged for the 36-month contract.
§2.4  The assistant remembers each shipper's history across sessions.
§2.5  Classification accuracy: 99.9%.
```

Review, clause by clause:

| Clause | Problem | Fix (requirement change or architecture change) |
|---|---|---|
| §2.1 | Nightly Batch can't meet 10 minutes. | Split tiers: urgent uploads go to synchronous (streaming) calls with the 10-minute target; bulk back-office reclassification stays on Batch with a "next business day" target. |
| §2.2 | Global profile can route outside the EU. | Switch to an EU geography/regional endpoint and accept the price premium and possible capacity limits. Record this in an ADR. |
| §2.3 | Can't promise a model outlives its retirement date. | Rewrite: "We will give 30 days' notice of model changes and re-run the acceptance eval before switching." Add a deprecation-watch owner (see 6.3). |
| §2.4 | Stateless API; no store exists. | Either build a per-shipper history store (retention, access control, deletion — a D5 conversation) or rewrite as "The assistant uses the shipment record and the current session." |
| §2.5 | No evidence for 99.9%; segment gap hidden. | State measured per-segment targets ("≥97% on typed forms, ≥90% on handwritten forms, measured monthly on a 500-document sample; handwritten forms below 0.8 confidence routed to a human"). |

Note that two clauses were fixed by **changing the architecture** (§2.1, §2.2) and three by **changing the promise** (§2.3–§2.5). The exam expects you to tell which is which. If the customer genuinely needs the outcome and the platform can deliver it at a cost, change the architecture. If no architecture can deliver it, make the requirement honest and measurable.

**Decision table.**

| If the clause promises… | And the design uses… | Best response |
|---|---|---|
| Minute-level turnaround | Message Batches | Route the urgent subset to synchronous calls; keep Batch for work nobody waits on |
| In-region processing | A global endpoint | Regional/geography endpoint (accept price and capacity) — not "strip identifiers" |
| A fixed model for years | Any hosted model | Change-notice + re-eval commitment; deprecation monitoring |
| Persistent memory | Stateless calls | Build an explicit store **or** narrow the promise |
| A single blended accuracy number | Eval with segments | Per-segment targets, sample size, measurement cadence, fallback route |
| "Real-time" or "fast" (vague) | Anything | Quantify: p95 latency, measured where, under what load |

**Anti-pattern → fix.**

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Delete the clause and say nothing | The customer still believes it; you've created a silent breach | Raise it, propose a measurable replacement, get sign-off |
| Move *all* traffic to synchronous to save one tier | Loses the Batch discount on work that didn't need speed | Split by urgency |
| Submit one-request batches and poll every minute | Batch still has no latency guarantee | Use the synchronous API for the urgent path |
| "Remove names before sending, so region doesn't matter" | Residency usually covers all customer data, not just identifiers | Use a compliant endpoint |
| Promise "accuracy will improve with the next model" | Unverified forecast written into a contract | Commit to a measurement process, not a future result |

**Exam traps.**
- **Weakening the SLA** is the right move only when no architecture can meet it. If a regional endpoint or a synchronous tier would work, the exam wants the architecture change.
- **ZDR ≠ location.** Zero data retention controls *how long* data is kept, not *where* it is processed.
- **Over-correction.** Upgrading every request to the most expensive path to fix one tier breaks the budget constraint stated elsewhere in the stem.

**Practice.**

**Q1.** Kestrel Insurance's draft SLA says: "Every inbound claim email receives an AI triage decision within 15 minutes." The proposed design submits all emails to Message Batches every hour to save 50% on cost. About 8% of emails are flagged "urgent" by a rules engine before any model call. What should the architect recommend?

A) Keep the hourly batch and change the SLA to "within 24 hours" for all emails.
B) Send urgent-flagged emails to synchronous calls with the 15-minute target; keep the rest on Batch with a longer, stated target.
C) Submit batches every 5 minutes so results arrive sooner.
D) Move all emails to synchronous calls with the fastest model tier.

**Answer: B.** The binding constraint applies only to a known subset, so split by urgency: synchronous for the 8% that need minutes, Batch for the rest. C is the tempting distractor, but smaller, more frequent batches still carry no latency guarantee. A abandons a requirement that is achievable, and D gives up the Batch saving on the 92% that don't need it.

**Q2.** A draft SLA for a multinational retailer reads: "Customer chat transcripts are processed only in Japan." The design uses a global cross-region inference profile on a partner cloud. **Select TWO** actions that resolve this.

A) Switch to a Japan geography or regional inference endpoint.
B) Enable zero data retention so transcripts aren't stored.
C) Record the higher per-token price and possible capacity limits of the regional endpoint in the ADR and cost model.
D) Mask customer names before sending transcripts to the global endpoint.

**Answer: A and C.** A changes where inference runs, which is the actual promise. C makes the cost of that change explicit, so stakeholders sign off on it knowingly. B controls retention, not location. D leaves the rest of the transcript leaving Japan.

**Official docs:**
[Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing) ·
[Data residency](https://platform.claude.com/docs/en/manage-claude/data-residency) ·
[Claude in Amazon Bedrock](https://platform.claude.com/docs/en/build-with-claude/claude-in-amazon-bedrock) ·
[Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations) ·
[Define success criteria](https://platform.claude.com/docs/en/test-and-evaluate/define-success)

---

## 6.2 Architecture Decision Records

**What the exam is testing.** An ADR is a short document that records one decision, the options considered, why one was chosen, and what it costs. The exam gives you a draft ADR and a stakeholder constraint (a compliance officer, a CFO, a customer contract) that the draft ignores or over-promises on. You pick the revision that **states the trade-off and the residual risk plainly**, backed by measured numbers, without claiming certainty about model behavior.

**Concept.** A good ADR for a Claude system has these parts:

| Section | What goes in it |
|---|---|
| Context | The problem and the **binding constraint** (whose constraint, and why) |
| Options considered | At least two real alternatives, with why each lost |
| Decision | The chosen option |
| Trade-off | What we give up (cost, latency, coverage, flexibility) |
| Evidence | Measured rates with sample size and how they were measured |
| Residual risk | What can still go wrong, how often we expect it, and who is affected |
| Controls and monitoring | What catches it, who owns the alert, how outputs are stored for disputes |
| Revisit trigger | The condition that reopens the decision (eval drop, model deprecation, volume change) |

Model behavior is probabilistic. A prompt rule **lowers** a failure rate; it does not eliminate it. Outputs also vary from run to run, so one clean rerun proves very little. Honest wording sounds like "reduced X from 4.1% to 0.6% on 1,200 test cases", not "the model will never X".

**Simple worked example — draft vs honest revision.**

The stakeholder constraint: Harbor Credit Union's compliance lead says members must never receive a rate quote that differs from the published rate sheet.

```text
ADR-014 (DRAFT)
Decision: Use a Sonnet-class model to answer member loan questions.
Rationale: We added "Never quote a rate not in the rate sheet" to the system
prompt. The model will never quote an incorrect rate. We re-ran the 50 failing
test cases and all passed.
Risks: None.
```

What is wrong: "will never" over-claims a probabilistic system; the 50-case rerun is a zero-failure rerun on the *same* cases (and outputs vary per run); "Risks: none" ignores the compliance lead's constraint entirely; no alternatives; no monitoring.

```text
ADR-014 (REVISED)
Context: Compliance requires that quoted rates match the published rate sheet.
  A wrong quote is a member-facing financial statement → high stakes.
Options:
  A. Model writes rates from the prompt (rejected: free-text numbers can drift)
  B. Model calls get_rate(product, term); app inserts the returned value into a
     template; model never types the number (CHOSEN)
  C. No AI for rate questions (rejected: 38% of chat volume)
Decision: Option B.
Trade-off: +1 tool round trip (~400 ms p95); rate answers less conversational.
Evidence: On 1,200 eval cases × 3 trials, rate mismatches fell from 4.1% (A) to
  0.0% observed (B). Residual mismatch risk comes from stale rate-sheet sync,
  not generation.
Residual risk: Rate-sheet sync lag of up to 15 min after a rate change; model may
  still describe eligibility wrongly (2.3% of eligibility answers flagged).
Controls: Post-generation check compares any number in the reply to get_rate
  output and blocks mismatches; all issued replies stored 7 years for disputes;
  eligibility answers marked "advisory — confirm with a loan officer".
Owner/monitoring: Lending ops owns the mismatch alert (>0 per day pages on-call).
Revisit if: rate-sheet API changes, model is deprecated, or mismatch alert fires.
```

The revision moves the guarantee from **instruction** to **enforcement** (the number comes from a tool and a code check), quantifies what was measured, and names what is still risky.

**Decision table — choosing between ADR revisions.**

| A revision that… | Verdict |
|---|---|
| States measured rates with sample size and trial count | Strong |
| Names residual risk and who carries it | Strong |
| Limits reliance ("advisory until confirmed by…") where stakes are high | Strong |
| Stores issued outputs for later disputes | Strong |
| Says "guaranteed", "never", "eliminates" about model output | Reject |
| Uses one clean rerun of failing cases as proof | Reject |
| Promises a future model will score higher | Reject |
| Adds a majority-vote rerun but changes no wording about certainty | Partial at best |

**Anti-pattern → fix.**

| Anti-pattern | Fix |
|---|---|
| "Risks: none" | List residual risk with an estimated rate and the affected party |
| Only the chosen option is described | Record rejected options and why they lost |
| Evidence is "we tested it and it worked" | Number of cases, trials per case, per-segment results |
| Constraint owner (legal, finance) not mentioned | Quote the constraint and show how the decision meets or fails it |
| No revisit trigger | Name the metric threshold or event that reopens the ADR |

**Exam traps.**
- The right ADR is usually **less** confident than the wrong one. If an option sounds the most reassuring, check it for over-claiming.
- "Add a human re-check later" doesn't fix an ADR that already promised something false; the wording has to change.
- Don't confuse an ADR with a runbook. An ADR records *why*; a runbook records *what to do* when something breaks.

**Practice.**

**Q3.** A draft ADR for an HR policy assistant says: "Hallucinated policy citations are eliminated. After adding a 'cite only from retrieved text' instruction, we re-ran the 40 failing questions and none hallucinated." The CHRO's constraint is that employees may act on answers about leave entitlements. Which revision best addresses the gap?

A) Keep the claim but add "Verified by a 40-case regression test."
B) Switch to the most capable model tier and state that it will not hallucinate.
C) Re-run the 40 cases five times and use majority vote to support the claim.
D) Replace the claim with the measured citation-error rate on the full eval set (with trials per case), state the residual rate, mark leave-entitlement answers as advisory until HR confirms, and log issued answers.

**Answer: D.** It replaces a certainty claim with measured evidence, names the residual risk, and limits reliance where the CHRO's constraint bites. A and C still rest on the same 40 previously failing cases and keep the over-claim. B is the scale-up reflex plus a new unprovable guarantee.

**Q4.** An ADR chooses a Haiku-class model for invoice-field extraction to meet a CFO's cost ceiling. The draft lists only the chosen option and says "Accuracy is equivalent to larger models." Eval data: 96.8% field accuracy for the Haiku-class model versus 98.9% for a Sonnet-class model on 2,000 invoices, at one-fifth of the cost. Which revision is best?

A) Keep the wording; the cost ceiling justifies the choice.
B) State both measured accuracies and costs, record the 2.1-point gap as the accepted trade-off, route low-confidence fields (by a code check, such as totals that don't add up) to human review, and set a revisit trigger if accuracy drops below 96%.
C) Replace "equivalent" with "nearly equivalent" and add the Sonnet-class model as a footnote.
D) Commit to switching to the next model release, which is expected to close the gap.

**Answer: B.** It records the real alternative, the measured gap, the control that catches residual errors, and when to reopen the decision. C softens the wording but still hides the number the CFO needs to accept the trade-off. D writes an unverified forecast into the record, and A keeps a false claim.

**Official docs:**
[Develop test cases](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) ·
[Reduce hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations) ·
[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

---

## 6.3 Operational Handoff Completeness

**What the exam is testing.** The build team is handing a Claude system to an operations or platform team. You get the handoff package and must find the **one missing item that would block the receiving team** — something they cannot discover or fix on their own — and name the documentation that closes it.

**Concept.** A complete handoff answers: *who owns it, what it depends on, how to tell it's healthy, how to fix or roll it back, and what the platform does **not** do for you.* The last one is where exam items hide.

Checklist:

| Area | Must include |
|---|---|
| **Owners and on-call** | Named owner per component; escalation path; on-call rotation |
| **Runbooks** | Common failures (429/529, MCP server down, refusal spike), each with steps, **including rollback** (previous prompt/model/config version and how to restore it) |
| **Eval thresholds** | Which eval runs, how often, the pass threshold, and what happens when it fails |
| **Cost alerts** | Budget, spend-limit behavior, alert thresholds, who gets paged |
| **Dependency list** | API keys and which workspace; rate limits/quotas; MCP servers and their owners; **credential owners** — and whether any credential belongs to a person who has left |
| **Model lifecycle** | Model IDs in use, their deprecation/"not sooner than" dates, and the migration plan (re-eval, prompt review) |
| **State semantics** | What "done" means — e.g., a Managed Agents session that goes `idle` may have stopped with `end_turn`, `requires_action` (waiting on someone) or `budget_reached`; idle ≠ complete |
| **Unenforced components** | What the platform does *not* control. Example: Managed Agents permission policies apply to the built-in and MCP toolsets, **not to custom tools**, so your code must gate those — and someone must own that code |

**Simple worked example — a handoff package with gaps.**

```text
HANDOFF: Orchid Labs "Sample Intake Agent" → Platform Ops   (draft)

1. Architecture diagram ✔
2. Dashboards: latency, token usage, error rate ✔
3. Runbook: "If errors spike, restart the worker." ✔
4. Config: Managed Agents agent `intake-v4`, MCP toolset (LIMS server),
   custom tool `release_sample`; permission policy: MCP toolset always_ask ✔
5. Credentials: LIMS OAuth credential in a vault, created by d.mehta ✔
6. Model: Sonnet-class model ID pinned ✔
```

Gaps the receiving team cannot close alone:

| Gap | Why it blocks Ops | Documentation that closes it |
|---|---|---|
| `release_sample` is a **custom tool** | The permission policy doesn't cover it. Ops may assume the platform gates it. | State which code gates `release_sample`, its approval rule, and its owner |
| Credential created by d.mehta, **who left last month** | When the refresh fails, the agent loses LIMS access and nobody can re-authorize | Move to a service-owned credential; name the owner; alert on refresh failure (Managed Agents emits `vault_credential.refresh_failed`) |
| "Restart the worker" is the only runbook step | No rollback path; no steps for rate limits or MCP outages | Runbooks per failure type, with rollback to `intake-v3` config and prompt |
| Idle sessions treated as finished | Sessions waiting on `requires_action` sit forever | Distinguish idle stop reasons; owner and SLA for pending confirmations; scheduled idle-session check |
| No eval threshold or cost alert | Ops can't tell "degraded" from "normal" | Weekly eval with pass threshold; spend alert with paging target |
| No deprecation plan | Pinned model will retire; requests then fail | Model ID, earliest retirement date, migration owner and re-eval steps |

If the stem asks for the **single most blocking** gap, pick the one that causes silent failure or uncontrolled action — here, the ungated custom tool or the departed user's credential — over nice-to-haves like extra dashboards.

**Decision table.**

| Symptom in the stem | Missing handoff item |
|---|---|
| "Nobody knows who to call when the MCP server fails" | Dependency list with owners and on-call |
| "Agent stopped working the week after the engineer left" | Credential ownership migration and refresh alerting |
| "Bad prompt shipped; took two days to revert" | Rollback runbook with versioned prompts/config |
| "Ops assumed the platform blocked that action" | List of components the platform does not enforce |
| "Tasks marked complete were actually waiting for approval" | Idle vs complete semantics and a pending-action owner |
| "Requests started failing on a known date" | Model deprecation plan |
| "Monthly bill doubled before anyone noticed" | Cost alerts and spend-limit behavior |

**Anti-pattern → fix.**

| Anti-pattern | Fix |
|---|---|
| More dashboards instead of owners | Every alert routes to a named owner |
| "The platform handles permissions" | Document the exact scope of platform enforcement and what your code enforces |
| Personal API keys or OAuth grants in production | Service-owned credentials; personal keys stop working when their creator leaves |

**Exam traps.**
- **Detection vs ownership.** An alert with no owner is not a fix.
- **Partial fix.** Rotating the departed user's credential once, without changing ownership or adding refresh-failure alerts, will fail again.
- **The question asks what blocks the *receiving* team.** Pick the item they can't reconstruct themselves, not the one the build team would find most interesting.

**Practice.**

**Q5.** A handoff package for a procurement agent on Claude Managed Agents lists: dashboards, a restart runbook, the agent config (built-in toolset `always_allow`, MCP toolset `always_ask`) and a custom tool `issue_purchase_order` that the app executes. Three weeks after handoff, the agent issued an unapproved $40,000 order. Ops says "the permission policy should have caught it." **Select TWO** items the handoff should have included.

A) A statement that permission policies don't apply to custom tools, plus the location and owner of the app-side approval check for `issue_purchase_order`.
B) A larger dashboard showing purchase-order volume by hour.
C) Switching the MCP toolset to `always_allow` to reduce approval fatigue.
D) A runbook for disabling `issue_purchase_order` and rolling back to the previous agent version.

**Answer: A and D.** A closes the false assumption (the platform never gated custom tools) and names who owns the real control. D gives Ops a way to stop and roll back. B detects after the fact, and C loosens a different control.

**Q6.** An internal research agent's sessions show `idle` in the Managed Agents console, and the dashboard counts every idle session as "completed". Users complain that some reports never arrive. What should the handoff documentation add?

A) A higher session budget so sessions never stop early.
B) A retry that resends the original task when a session goes idle.
C) A mapping of idle stop reasons (`end_turn`, `requires_action`, `budget_reached`) to actions, with an owner and SLA for sessions waiting on `requires_action` and a scheduled check for stale idle sessions.
D) An instruction in the system prompt to always finish reports.

**Answer: C.** Idle is not complete; the stop reason says why it stopped, and `requires_action` sessions need a person. A addresses only `budget_reached` and drops cost control. B could duplicate work or side effects, and D doesn't touch the missing operational process.

**Official docs:**
[Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) ·
[Permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies) ·
[Events and streaming](https://platform.claude.com/docs/en/managed-agents/events-and-streaming) ·
[Vaults](https://platform.claude.com/docs/en/managed-agents/vaults) ·
[Authentication](https://platform.claude.com/docs/en/manage-claude/authentication) ·
[Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)

---

## Key takeaways

- D6 is now **artifact review**: about 4 items, each built on a draft SLA, ADR or handoff document.
- For SLAs, **match each promise to the mechanism**: Batch ≠ minutes, global endpoint ≠ region-only, pinned model ≠ forever, stateless API ≠ memory, blended eval ≠ per-segment guarantee.
- Change the **architecture** when a design can meet the need at a stated cost; change the **requirement** when nothing can.
- Honest ADRs state **measured rates, residual risk, trade-offs, owners and revisit triggers**. "Never", "guaranteed" and "Risks: none" are red flags.
- Handoffs fail on **ownership and unenforced gaps**: departed users' credentials, custom tools outside permission policies, idle ≠ complete, no rollback, no deprecation plan.

## Confused pairs

| Pair | Difference |
|---|---|
| ZDR vs data residency | ZDR = how long data is kept. Residency = where it's processed/stored. |
| Global vs regional endpoint | Global routes across regions (no residency promise). Regional keeps traffic in a geography at a premium. |
| Deprecated vs retired | Deprecated still works with a retirement date. Retired requests fail. |
| ADR vs runbook | ADR: why we decided, and the risk we accepted. Runbook: what to do when it breaks. |
| Weakening an SLA vs clarifying it | Weakening hides a broken promise. Clarifying makes it measurable and true, with sign-off. |
| Idle vs complete (Managed Agents) | Idle can mean finished, waiting on a person, or out of budget. Check the stop reason. |
| Monitoring vs ownership | A dashboard detects. An owner acts. Handoffs need both. |

---

[← Domain 5](domain-5-governance-safety.md) · [Domain 7 →](domain-7-dev-productivity.md)

<!-- support-footer -->
---

> ⭐ **Found this useful?** [Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) so other candidates can find it · 💼 [Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) for updates and new mock exams.
