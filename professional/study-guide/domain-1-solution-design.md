# Domain 1: Solution Design and Architecture (18%)

This domain tests the decisions you make before anyone writes a prompt: what Claude should own, which pattern and runtime to use, where the system will break, and whether it pays for itself. At 18% of the v1.1 blueprint it is about **11 of the 60 scored items**, and its reasoning carries into every other domain. Almost every item gives you a scenario plus an artifact, such as a process map, an architecture sketch, a trace or a cost table. Your job is to find the **binding constraint** (the one requirement that rules options out) and pick the simplest design that meets all of the stated requirements.

## At a glance

| Skill | What the exam asks you to do | The one-line rule |
|---|---|---|
| 1.1 Task Delegation Between Claude and Humans | Split a business process into Claude-owned, human-owned and collaborative steps | Assign by **reversibility, stakes and accountability**, enforce it through the tool surface, and check that reviewers have the capacity |
| 1.2 End-to-End Architecture Evaluation | Find the component that fails first under a stated load or trust condition | Walk input → processing → output → feedback and compute the headroom. Anything the model can choose is untrusted |
| 1.3 Architectural Pattern Selection | Choose workflow, agent, augmented LLM or Skills-based, and state the delegation boundary | **Least autonomy that works.** Say what Claude decides and what code decides |
| 1.4 Orchestrator and Subagent Decomposition | Find where task boundaries, control flow or synthesis will break | Subagents see only their brief. Code checks structured results. Audit records come from the runtime |
| 1.5 Value-Based Architectural Decisions | Pick the option that maximizes business value under a ceiling | **Constraint first, then optimize**: drop options that break a ceiling, then maximize the named metric |
| 1.6 Deployment Surface and Agent Runtime Selection | Choose a surface (Anthropic API, Claude Platform on AWS, Bedrock, Vertex AI, Foundry) and a runtime (Messages loop, self-hosted Agent SDK or headless Claude Code, Managed Agents) | Hard constraints (residency, ZDR, custody, ops capacity) eliminate cells of the surface × runtime matrix. State what the survivor costs you |

---

## 1.1 Task Delegation Between Claude and Humans

**What the exam is testing.** You get a business process. For each part, decide whether Claude does it, a human keeps it, or they share it, and justify each choice by reversibility, stakes and accountability.

### Concept

Three questions decide where a step belongs:

1. **Reversibility.** If the step is wrong, can you undo it cheaply and in time? A rescheduled meeting, yes. A wire transfer or a sent legal notice, no.
2. **Stakes.** How much harm does one error do: money, safety, legal exposure, trust?
3. **Accountability.** Must a named person own the outcome by law, regulation, contract or policy? If someone will ask "who decided?", the answer must be a human. Anthropic's Usage Policy also requires meaningful review by a qualified person for high-risk AI recommendations (credit, employment, housing, insurance and similar).

These give you four delegation modes, not two:

| Mode | Use it when | Example |
|---|---|---|
| **Claude acts** | Reversible, low stakes, covered by clear policy | Tag and route an inbound email |
| **Claude acts, human reviews within a window** | Waiting causes harm, and the action is cheap to reverse before a deadline | Issue a goodwill bill credit that can be reversed until the invoice closes |
| **Claude prepares, human decides** | Irreversible, discretionary, or a named person is accountable | Draft a claim-denial letter with evidence; the adjuster signs |
| **Human only** | Judgment or relationships that you cannot specify well enough to evaluate | Negotiating a settlement with a distressed customer |

Two rules turn this into a design:

- **Enforce the boundary, don't describe it.** If Claude must not take an irreversible action, don't give the agent that tool, or gate it with a deterministic control (deny rule, `PreToolUse` hook, `canUseTool` callback, server-side check). "Never refund over $500" in a system prompt is advice, not a control.
- **Do the reviewer-capacity arithmetic.** If **arrivals × minutes per review** exceeds **reviewers × productive minutes**, the queue grows, reviewers rubber-stamp, and the control becomes theater.

### Simple worked example

*Harbor Lane Insurance* (fictional) wants Claude in its home-claims process. The architect's delegation map:

| Step | Reversible? | Stakes | Accountable owner | Mode |
|---|---|---|---|---|
| Classify claim type from photos and the description | Yes (re-label) | Low | None | Claude acts |
| Schedule a loss adjuster visit | Yes (free reschedule up to 24 h before) | Low | None | Claude acts |
| Approve emergency payments ≤ $1,000 (hotel nights) | Mostly (recoverable from the next settlement) | Medium | Claims ops | Claude acts, human reviews same day |
| Deny a claim | No (regulatory complaint, legal exposure) | High | Licensed adjuster | Claude prepares, adjuster decides |

Now check capacity for the "human reviews" and "human decides" rows:

```text
Daily arrivals:   1,800 claims
Emergency payments:  14% → 252/day × 2 min review   =   504 min
Denial drafts:        6% → 108/day × 12 min decide  = 1,296 min
Total human load                                     = 1,800 min = 30 h/day

Capacity: 4 adjusters × 6 productive h = 24 h/day   → 6 h/day short
```

The design doesn't fit. Honest fixes change the numbers: add staff, speed up review (a one-screen evidence summary that cuts denials to 8 minutes gives 1,368 minutes, or 22.8 hours), or shrink a queue for a principled reason. Prompting the model to "flag fewer claims" is not a fix.

### Decision table

| When… | Choose… | Because… |
|---|---|---|
| Irreversible, or a named person is accountable | Claude prepares, human decides; the agent has no execute tool | Prevent what you can't undo |
| Reversible within a window, and waiting causes harm | Claude acts; a named human reviews every action before the window closes | Speed now, correction while it's still possible |
| Reversible, low stakes, fully covered by policy | Claude acts, with sampled audits | Don't spend scarce reviewer time |
| Enumerable policy (thresholds, eligibility tables) | Code decides; Claude extracts the inputs | Exact, testable, auditable |

### Anti-pattern → fix

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| "Auto-execute when model confidence ≥ 0.9" | Self-reported confidence isn't calibrated evidence, and the agent still holds the tool | Gate by action type in code; remove irreversible tools |
| Split purely by dollar amount | A $50 action can be irreversible or legally owned | Split by reversibility and accountability; amount is secondary |
| Human approves everything "to be safe" | Exceeds capacity, causes fatigue, blocks low-risk paths | Gate only irreversible or high-stakes steps |
| Weekly sample audit of irreversible actions | Finds harm after it can't be undone | Pre-execution gate |

### Exam traps

- **Instruction or self-report as the boundary**: a prompt rule, a confidence score, the agent's own "risk: low" tag.
- **Over-correction** (human gate on everything, no capacity math) and **detect instead of prevent** (audits for irreversible actions).
- **Wrong axis**: a dollar threshold where the stem stresses reversibility or legal accountability.

### Practice

**Q1.** *Tallis Property Management* (fictional) is automating four steps of its tenancy workflow: (1) classify maintenance requests; (2) book contractor visits, which can be rescheduled free up to 24 hours before; (3) apply deductions to tenants' security deposits, which tenants can dispute to a state regulator and which the licensed property manager is legally accountable for; (4) draft replies to tenants. Which delegation most directly matches each step's reversibility, stakes and accountability **without** creating an unnecessary review burden?

- A) Claude performs all four steps; deposit deductions run automatically only when the model reports confidence of at least 0.9.
- B) A property manager approves the output of all four steps before anything is sent or booked.
- C) Claude classifies, books and drafts autonomously; for deductions it prepares an evidence pack and recommendation, and the property manager applies the deduction in a system the agent cannot call.
- D) Claude performs all four steps; deductions under $200 run automatically and larger ones are queued for the property manager.

**Answer: C.** Steps 1, 2 and 4 are reversible and low-stakes, so Claude can own them. Step 3 is the one with a legally accountable human and regulator exposure, so the human decides and the agent has no tool to act. D is the tempting distractor: a dollar threshold feels like a stakes control, but accountability for a $150 deduction is just as legal as for a $900 one. A relies on self-reported confidence, and B gates reversible steps for no benefit.

**Q2.** *Pellmore Telecom* (fictional) lets an agent recommend bill credits, and today a human approves each credit before it is issued. Evidence: 2,400 credits/day; pre-approval takes 90 seconds each because reviewers open every ticket; the team has 5 reviewers with 6 productive hours each; customers who wait more than 4 hours for a credit churn at twice the normal rate. A credit can be reversed at no cost until the invoice closes 5 days later. In a pilot, reviewers checked a grouped daily list of issued credits at 20 seconds per item. Which change most directly fixes the backlog **without** removing human oversight?

- A) Keep pre-approval and instruct the agent to batch similar credits into one approval request.
- B) Let the agent issue in-policy credits through a tool that enforces the per-credit cap in code, and have a named reviewer clear the grouped list of every issued credit each day, well before invoice close.
- C) Have the agent attach a confidence score and send only low-confidence credits to pre-approval.
- D) Replace pre-approval with a weekly random audit of 5% of issued credits.

**Answer: B.** Pre-approval needs 2,400 × 90 s = 60 hours a day against 30 hours of capacity. Post-hoc list review needs 2,400 × 20 s ≈ 13.3 hours, which fits, and it catches every error inside the 5-day reversal window. D is the tempting option because it is cheap, but a weekly 5% sample misses most errors and often finds them after the invoice has closed. C uses model self-report as the gate, and A leaves the queue arithmetic unchanged.

### Official docs

- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) (human checkpoints and when autonomy fits)
- [Agent SDK permissions](https://platform.claude.com/docs/en/agent-sdk/permissions)
- [Anthropic Usage Policy](https://www.anthropic.com/legal/aup) (high-risk recommendations need meaningful human review)

---

## 1.2 End-to-End Architecture Evaluation

**What the exam is testing.** Judge whether a full architecture (input, processing, output, feedback) meets stated scalability, maintainability and access-control requirements. Then name the component that fails first under a given load or trust condition.

### Concept

Read every architecture as four stages: **input** (users, uploads, events), **processing** (prompts, retrieval, tools, model calls), **output** (responses, writes, downstream systems) and **feedback** (ratings, corrections, evals). At each stage, ask the three requirement questions. *Scalability*: what runs out first at peak? *Maintainability*: is it versioned and tested, and does feedback gate releases? *Access control*: who is the caller, and which security-relevant values can the model choose?

"Fails first" items reward arithmetic and adversarial thinking:

- **Under load**, compute utilization for each limited resource and pick the highest. API rate limits are measured separately for requests (RPM), input tokens (ITPM) and output tokens (OTPM), and any one can trigger a 429. On most models cache reads don't count toward ITPM, so caching relieves input pressure but **does nothing for output tokens**. Work nobody waits for can move to the Message Batches API (asynchronous, its own limits, 50% cheaper).
- **Under a trust condition** (a malicious tenant, an injected document), find the first place where a model-chosen value is trusted. The classic case is a search tool whose `tenant_id` argument the model fills in: one injected sentence and isolation is gone. **Derive identity server-side** from the authenticated session.

### Simple worked example

*Quillstone* (fictional) sells a contract-review assistant to 300 law firms:

```text
[Web app] --JWT--> [API gateway] --> [Orchestrator service]
                                         |  system prompt + tools:
                                         |   search_clauses(tenant_id, query)  <- model fills tenant_id
                                         |   summarize_contract(doc_id)
                                         v
                                   [Claude Messages API]
                                         |
            [Shared vector index, filter: tenant_id]   [Nightly "matter digest" job, same sync path]
                                         |
                                  [Thumbs up/down -> app log, no consumer]
```

Peak-hour load against the stated org limits:

| Dimension | Limit (stated) | Interactive peak | Nightly digest | Total | Utilization |
|---|---|---|---|---|---|
| RPM | 4,000 | 1,300 | 200 | 1,500 | 38% |
| Input TPM (uncached) | 2,000,000 | 1,100,000 | 250,000 | 1,350,000 | 68% |
| Output TPM | 400,000 | 290,000 | 235,000 | 525,000 | **131%** |

Findings, in the order they bite:

1. **Load**: output TPM fails first, and caching wouldn't help. The digest job (45% of output) has no waiting user, so move it to Message Batches. Interactive output drops to 73%.
2. **Trust**: `search_clauses` trusts a model-filled `tenant_id`, so it fails first if a tenant uploads a crafted document. Fix: the tool reads the tenant from the verified JWT claims. Partitioned indexes add defense in depth.
3. **Maintainability**: feedback goes to a log nobody reads. Turn thumbs-down sessions into eval cases that gate prompt changes.

### Decision table

| When the evidence shows… | Choose… | Because… |
|---|---|---|
| One rate-limit dimension above 100% at peak | Relieve that dimension (Batches for async work, shorter outputs) | The others aren't binding |
| A data-scoping value comes from model output | Derive it server-side from the authenticated identity | Model arguments are attacker-influenced under injection |
| Output feeds automated systems | Validate `stop_reason` and schema before handoff | Truncated or refused output otherwise flows downstream |
| Feedback is collected but unused | Turn it into versioned eval sets that gate releases | Otherwise regressions ship silently |

### Anti-pattern → fix

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Prompt caching to fix output-TPM 429s | Caching relieves input, not output | Offload or shorten output |
| Alert when a tool's `tenant_id` mismatches the session | Detects the leak after data is returned | Remove the argument; derive tenant server-side |
| An injection classifier as the isolation control | Probabilistic | Deterministic scoping; the classifier is an extra layer |
| Scaling app workers when an API limit binds | Fixes a non-bottleneck | Compute per-dimension utilization first |

### Exam traps

- **Caching as a false cure** for output limits, accuracy or memory.
- **Detect instead of prevent** for cross-tenant access.
- **Scale-up reflex**: more workers or a bigger model when a different resource binds.

### Practice

**Q3.** *Ostara HR Cloud* (fictional) runs a multi-tenant policy assistant. Architecture: the gateway validates a session token; the orchestrator gives Claude a `lookup_policy(org_id, question)` tool; the tool queries a shared index filtered by `org_id`; answers stream back to the user; a nightly job re-embeds new documents. Each tenant's admins can upload documents. The security review asks which component fails first if a tenant admin uploads a document crafted to steer the assistant. Which answer is correct?

- A) The embedding model, because crafted text produces vectors that rank above legitimate documents.
- B) The gateway, because session tokens can be replayed by a malicious admin.
- C) The nightly re-embedding job, because it processes untrusted uploads without review.
- D) The `lookup_policy` tool, because it scopes the search by an `org_id` value the model writes, so injected text can redirect the query to another tenant.

**Answer: D.** The first trust failure is where an attacker-influenced value (the model's tool argument) decides whose data is read. The fix is to derive `org_id` from the validated session inside the tool. A is tempting because ranking manipulation is real, but it stays inside the attacker's own tenant. B and C describe risks the scenario gives no evidence for.

**Q4. (Select TWO.)** A review of *Quillstone's* system (from the example above) finds two problems. (1) At peak, output tokens run at 131% of the org's OTPM limit, and 45% of output comes from a nightly digest job that runs on the synchronous path. (2) Last month a prompt change cut answer quality for one contract type, and nobody noticed for three weeks, although users had been clicking thumbs-down throughout. Which **two** changes most directly address these findings?

- A) Move the nightly digest generation to the Message Batches API.
- B) Add prompt-caching breakpoints after the system prompt and tool definitions.
- C) Turn thumbs-down sessions into labeled eval cases and run that suite as a required gate before any prompt change ships.
- D) Move all traffic to the most capable model tier to reduce quality variance.

**Answer: A and C.** A moves work nobody waits for onto Batches, which has its own limits, so peak output drops to about 73%. C closes the feedback loop, so a regression like finding 2 fails a gate before release. B is tempting because caching is good practice, but it reduces input, and output is the binding dimension. D is the scale-up reflex and fixes neither finding.

### Official docs

- [Rate limits](https://platform.claude.com/docs/en/api/rate-limits)
- [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- [Mitigate jailbreaks and prompt injections](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)

---

## 1.3 Architectural Pattern Selection

**What the exam is testing.** Choose among workflow, agentic, augmented-LLM and Skills-based patterns for a use case with stated reuse, governance and risk constraints. Justify the **delegation boundary** the pattern creates: what Claude decides and what your code decides.

### Concept

Anthropic's *Building Effective Agents* post separates **workflows** (code fixes the path; Claude fills in steps) from **agents** (Claude chooses the path). Its core advice: start simple and add complexity only when it measurably helps. On the exam that becomes **least autonomy that works**. Each step up buys flexibility and costs predictability, latency, spend and auditability.

| Pattern | Shape | Use when | Claude decides | Code decides |
|---|---|---|---|---|
| **Augmented LLM** | One call with retrieval, tools, memory | One step solves the task | The answer and tool calls | Which tools and context exist |
| **Prompt chaining** | Fixed sequence of calls with code "gates" between them | Steps known and ordered | Each step's content | Order and gate checks |
| **Routing** | A classifier call picks a category; code dispatches to a dedicated prompt + tools | Input types that interfere when tuned together, or need different tools or owners | The label | Prompt, tools and model per label |
| **Parallelization: sectioning** | Independent subtasks run at once; code merges | Subtasks known and independent; latency matters | Each section | The split and merge |
| **Parallelization: voting** | Same task runs N times; results aggregated | You need confidence (e.g., several reviewers for risky code) | Each attempt | N and the aggregation rule |
| **Orchestrator-workers** | A lead model decides subtasks at runtime and delegates | Subtasks unknown until the input is read | Decomposition and synthesis | Worker tools, caps, result contract |
| **Evaluator-optimizer** | One call generates, another critiques, loop | Clear criteria, and feedback measurably helps | Draft and critique | Max rounds and stop criteria |
| **Autonomous agent** | Model-driven tool loop until done | Open-ended; each result shapes the next step | The path | Tool surface, caps, permissions |

**Where Skills fit.** An Agent Skill is a folder with a `SKILL.md` file plus optional scripts and resources, loaded by **progressive disclosure**: only the name and description sit in context (about 100 tokens each); the body loads when triggered, and bundled files and script outputs load only when used. A **Skills-based architecture** is one general agent with a governed library of Skills instead of many bespoke agents. Pick it when the constraint is **reuse and governance of know-how**, such as one approved "variance analysis" Skill that many teams invoke, versioned and reviewed like software. Its limits:

- Skills change **instructions and bundled code**, **not** which tools the agent holds. If category A must not reach tool X, you need routing or separate configurations.
- Third-party Skills are an injection and supply-chain surface; treat them like installed software.
- Custom Skills don't sync across surfaces, Agent Skills are **not** ZDR-eligible, and the docs recommend a workspace per tenant for multi-tenant isolation.

### Simple worked example

*Fernway Logistics* (fictional) has three use cases. Here is how the architect matched each to a pattern:

| Use case | Evidence | Pattern | Delegation boundary |
|---|---|---|---|
| Customs declaration from a commercial invoice: extract → validate HS codes against a tariff table → fill the form | Same 3 steps every time; the single-prompt version skipped validation on 7% of documents | **Prompt chain** with a code gate: tariff lookup is a deterministic check between steps 1 and 3 | Claude extracts and drafts; code orders the steps and validates codes |
| Inbound email: rate quote, claim, tracking question or carrier invoice | Four types with different tools and owners; tuning the claim prompt broke quotes | **Routing**, with a separate prompt and tool set per route | Claude labels; code dispatches and controls tool access |
| "Why did on-time delivery drop in the Northeast last month?" | The analysis path depends on what each query reveals | **Agent** (or orchestrator-workers if the question splits into regions) with read-only data tools, a turn cap and a budget cap | Claude chooses the next query; code fixes the tool surface and limits |

All three teams also repeated the same "how we compute dwell time" instructions. Packaging that method as one **Skill** is the reuse answer. It sits **inside** each pattern rather than replacing them.

### Decision table

The pattern table above covers the "use when" cases. These are the pairs the exam most often makes you separate:

| When the stem says… | Choose… | Because… |
|---|---|---|
| "Same steps every time" | Prompt chain, not an agent | Code guarantees every step runs |
| "Categories need different tools or owners" | Routing, not one agent plus Skills | Only separate configurations change tool reach |
| "Subtasks depend on what the input contains" | Orchestrator-workers, not sectioning | The split needs model judgment |
| "Many teams reuse one governed procedure" | Skills inside whichever pattern fits | Versioned know-how, loaded on demand |

### Anti-pattern → fix

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| An autonomous agent for a known sequence | Unbounded cost and p95; steps can be skipped | Prompt chain with gates |
| Orchestrator-workers for fixed subtasks, or sectioning for input-dependent ones | The wrong side of "known vs discovered at runtime" | Sectioning / orchestrator-workers respectively |
| One agent plus per-category Skills where tool reach must differ | Skills don't remove tools | Route to per-category configurations |
| Uncapped evaluator-optimizer to "reduce variance" | Loops cost money and don't target variance | Voting for variance; capped rounds for quality |

### Exam traps

- **The neighboring pattern**: one stem detail (fixed vs runtime subtasks, shared vs separate tools) separates two similar patterns.
- **Right pattern, wrong boundary**: e.g., "Claude decides the order" for a chain.
- **Skills as access control**, and **autonomy as sophistication**: the most agentic option is rarely the key.

### Practice

**Q5.** *Corran Legal Ops* (fictional) processes NDAs with one large prompt: extract parties and terms, compare them with the firm's playbook, draft a redline, and format the output. An eval of 400 NDAs shows that on 9% of documents the playbook comparison was silently skipped. The steps never change order. Which design most directly fixes this, and which correctly states the delegation boundary?

- A) An autonomous agent with extraction, playbook and drafting tools, where Claude decides which steps each NDA needs and in what order.
- B) A prompt chain of four calls, where code checks the extraction output against a schema before calling the playbook step; Claude decides each step's content, and code decides the order and that every step runs.
- C) Orchestrator-workers, where a lead model reads each NDA and decides which subtasks to delegate to worker models.
- D) Run the single prompt three times and take the majority redline, so a skipped comparison is outvoted by the other runs.

**Answer: B.** The steps are fixed and ordered, so a chain with code gates makes skipping impossible, and the boundary is stated correctly: code owns order and completeness. C is tempting because it sounds robust, but it hands an already-known decomposition to the model, so the skip can recur. D treats a structural omission as variance, and A adds autonomy to a fixed sequence.

**Q6.** *Mosswood Bank* (fictional) wants one internal assistant for HR policy questions (reads HR documents), treasury reporting (reads the general-ledger API) and IT help (creates tickets). Governance rule: the ledger API must be unreachable from HR and IT requests. The proposed design is one agent with all three tools and three Skills (`hr-policy`, `treasury-reports`, `it-helpdesk`) whose instructions say which tools to use. Which change most directly satisfies the governance rule **without** splitting the shared know-how?

- A) Keep the design and add to each Skill's instructions: "Never call the ledger API unless this is a treasury request."
- B) Keep the design and have the agent report its request category; block ledger calls when it reports HR or IT.
- C) Keep the design but use the most capable model tier, which follows Skill instructions more reliably.
- D) Add a routing step: a classifier call labels the request, and code dispatches to a per-category configuration whose tool list contains only that category's tools, with the matching Skill loaded.

**Answer: D.** Skills change what the agent knows, not which tools it holds, so only per-route tool lists make the ledger unreachable (the ledger tool should also check the caller's entitlements server-side). B is tempting because it adds a code check, but the check trusts the model's self-reported category. A and C are instructions pretending to be controls.

### Official docs

- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

---

## 1.4 Orchestrator and Subagent Decomposition

**What the exam is testing.** Evaluate an orchestrator/subagent design for a multi-step workload against stated observability and error-recovery requirements. Find where task boundaries, control flow or result synthesis will fail.

### Concept

Subagents are worth having for **context isolation**: each worker explores in a fresh context and returns a condensed result, so the lead's context stays clean. The same isolation causes the usual failures:

- **A subagent sees only its brief.** A (non-fork) subagent doesn't see the lead's system prompt or conversation; it gets the task text the lead writes and returns only its final message. A good brief carries **objective, scope, constraints and decisions already made, and output format**. Save it with the result for audit and rerun.
- **Dependencies must be explicit.** If B needs A's output, B runs after A and receives it. Running both in parallel "to save time" means B guesses.
- **Errors stay inside the subagent.** The parent sees only the final message, which can sound confident over partial work. Workers should return a **structured status**:

```json
{
  "unit": "filings-2025",
  "status": "partial",
  "error_category": "max_turns",
  "completed": ["10-K", "10-Q Q1"],
  "missing": ["10-Q Q2", "10-Q Q3"],
  "findings": [{"claim": "Revenue +12% YoY", "source_id": "edgar:0001-25-000123"}]
}
```

- **Control flow belongs in code.** When orchestration code runs each worker as its own Agent SDK `query()`, the result message carries a `subtype`: `success`, `error_max_turns`, `error_max_budget_usd` or `error_during_execution`. Code reads it, not the lead model. Retry **transient** errors (timeouts, 429s, overloads) with a cap, rerun **only the failed unit**, escalate the rest with its cause, and have synthesis mark gaps as incomplete.
- **The audit record comes from the runtime.** "Which systems did each worker query?" is answered from hooks (`PreToolUse`/`PostToolUse` input carries `agent_id` and `agent_type` for subagent calls) or OpenTelemetry spans, never from the worker's own summary.

### Simple worked example

*Brightwater Capital* (fictional) runs a due-diligence orchestrator. Part of a trace:

```text
lead      plan: units = [filings, litigation, news, pricing]
worker    filings     result.subtype=error_max_turns  turns=40  (stopped mid-10-Q Q2)
worker    litigation  result.subtype=success
worker    news        result.subtype=success
worker    pricing     result.subtype=success   figures in EUR   <- lead had agreed USD with the user
lead      synth: "Complete review of all SEC filings found no material risks..."
```

Three failures, one per category the skill names:

| Category | Failure | Fix |
|---|---|---|
| **Task boundary** | The pricing brief omitted "report in USD"; the user had decided it in the lead's conversation | Template briefs with objective, scope, constraints and output schema; save them with results |
| **Control flow** | No code read `error_max_turns`, so a partial unit looked like a completed one | Code checks `subtype` and status, reruns only `filings` with a narrower scope and capped retries, and escalates if it still fails |
| **Synthesis** | The lead claimed "complete review" from prose summaries | Synthesis consumes structured results, and any unit with status other than `success` is labeled incomplete with its missing items |

### Decision table

| When the requirement says… | Choose… | Because… |
|---|---|---|
| "Never overstate completeness" | Structured status per unit, checked by code before synthesis | Prose confidence hides partial work |
| "Recover without redoing work" | Rerun only the failed unit; retry only transient errors, capped | Permanent errors never succeed on retry |
| "Audit the systems each worker touched" | Hooks or OTel spans keyed by `agent_id`, in an append-only store | The runtime is ground truth |
| "Every figure must be traceable" | Return figures with source record IDs | Reviewers can verify each claim |

### Anti-pattern → fix

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Shared rules only in the lead's system prompt | Workers never see it | Put them in each brief |
| Rerunning a failed worker with the same brief | Same inputs, same failure | Narrow the scope, fix the brief, or escalate |
| Raising `maxTurns` and adding "be thorough" | Fewer failures, but still invisible | Code-checked status plus targeted rerun |
| Tracing dashboards as the recovery plan | Detects but doesn't recover | Recovery in orchestration code; tracing for diagnosis |

### Exam traps

- **Model self-report as evidence**: worker summaries as the audit trail, or a checksum over the model's own report.
- **Detect instead of recover**, and **partial fixes** (higher turn limit, more retries).
- **Shared-context assumption**: any option that expects workers to "know" what the lead knows.

### Practice

**Q7.** In *Brightwater's* trace above, the `filings` worker stopped with `error_max_turns`, yet the final report claimed a "complete review of all SEC filings". The requirements say the report must never claim completeness it doesn't have, and recovery must not repeat finished work. Orchestration code runs each worker as its own SDK `query()`. Which change most directly meets both requirements?

- A) Have orchestration code read each worker's result `subtype` and structured status; on `error_max_turns`, rerun only that unit once with a narrower scope, and if it still fails, mark the section incomplete with the missing items and escalate.
- B) Add to the lead's system prompt: "Before synthesizing, verify that every worker fully completed its task, and do not claim completeness otherwise."
- C) Raise every worker's maximum turns from 40 to 200 so that units like `filings` have room to finish.
- D) Export OpenTelemetry spans for all workers and alert the on-call engineer whenever any worker ends with an error subtype.

**Answer: A.** The completion signal already exists in the result `subtype`, and only code reading it is reliable. Rerunning just the failed unit avoids repeated work. D is tempting because observability sounds rigorous, but an alert fires after the overstated report has shipped and recovers nothing. B trusts the lead to judge completion from prose, and C makes the failure rarer but no more visible.

**Q8. (Select TWO.)** An audit of a *Brightwater* run finds two problems. (1) Compliance's record of "systems each worker queried" comes from a "Sources consulted" line in each worker's final message, and one message listed a database the worker never queried. (2) The `pricing` worker reported in EUR, although the user and the lead agreed on USD early in the session, and the lead's system prompt also says USD. Which **two** changes most directly address these findings?

- A) Ask each worker to append a checksum of its sources list so the auditors can detect tampering.
- B) Record every tool call through `PreToolUse`/`PostToolUse` hooks that log `agent_id`, `agent_type`, tool name and input to an append-only store, and build the compliance record from that.
- C) Repeat the currency rule in the lead's system prompt in capital letters, and mark it as critical.
- D) Have the lead write each brief with objective, scope, constraints already decided (including "report in USD") and an output schema, and store the brief with the result.

**Answer: B and D.** B makes the runtime the source of truth for what was queried. D carries the lead's decisions into the only context the worker sees. A is tempting, but a checksum proves the report wasn't altered, not that it is true. C strengthens text the worker never receives.

### Official docs

- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) (subagents, hooks, agent loop)
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents)

---

## 1.5 Value-Based Architectural Decisions

**What the exam is testing.** Pick the option that maximizes a measurable business outcome under a stated cost or SLA ceiling, and weigh competing proposals against the business value pillars: efficiency, transformation, productivity, solution cost and performance SLAs.

### Concept

Use the **constraint-then-optimize** method:

1. **List the ceilings.** p95 latency, monthly spend and quality floors are pass/fail. An option that breaks one is out.
2. **Name the objective**: the one metric to maximize (resolved tickets, hours saved). Cost is usually **a ceiling, not the objective**.
3. **Maximize among the survivors**, and **state the trade-off you accepted**. "No trade-off" is a red flag.

Two refinements:

- **Cost per completed task, not cost per call.** A cheap model that fails often can cost more once you count retries and human rework:
  `cost per completed task = (model cost + human cost of failures) ÷ tasks completed`.
- **Measure against a baseline.** A business case is the measured delta from the pre-pilot baseline on the sponsor's pillar: **efficiency** (cost or time per unit), **productivity** (output per person), **transformation** (new capability), **solution cost** (model, infra and people) or **performance SLAs** (latency, availability, accuracy floor). Benchmark gains and small caching savings are not business cases.

### Simple worked example

*Lumen Freight* (fictional) automates customs-query replies. Ceiling: p95 ≤ 8 s. Objective: lowest **cost per completed query**. A failed or escalated query costs $3.00 of human time. Volume is 100,000 queries/month. All numbers come from the team's eval:

| Option | p95 | Model cost / query | Auto-resolved | Monthly model cost | Human cost (failures × $3) | Cost per completed query |
|---|---|---|---|---|---|---|
| Haiku-class single call | 1.5 s | $0.004 | 62% | $400 | 38,000 × $3 = $114,000 | $114,400 ÷ 100,000 = **$1.14** |
| Sonnet-class + retrieval | 4.2 s | $0.030 | 84% | $3,000 | 16,000 × $3 = $48,000 | $51,000 ÷ 100,000 = **$0.51** |
| Opus-class agent | 12.0 s | $0.090 | 88% | — | — | Out: breaks p95 |

(Every query is completed eventually, by Claude or a human, so the denominator is 100,000.) The option that costs 7.5× more per call is about 55% cheaper per completed query. The trade-off accepted: 4 points less automation than the Opus-class agent, to meet the SLA.

### Decision table

| When… | Choose… | Because… |
|---|---|---|
| The best-scoring option breaks a ceiling | Eliminate it | Ceilings are pass/fail |
| Several options pass all ceilings | Maximize the named metric | Spare budget is not value |
| Failures cause rework or escalation | Compare cost per completed task | Per-call cost hides failure cost |
| Someone proposes multi-model routing or an "advisor" model | Accept only if it beats the single model's whole cost-vs-quality curve, including lower effort settings | Extra models add latency and failure modes |

### Anti-pattern → fix

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Cheapest option by default | Cost was a ceiling; value is left on the table | Optimize the named metric within the ceiling |
| "Router for best of both, no trade-off" | Unmeasured; adds latency and complexity | Prove it on the eval and state its cost |
| Business case from benchmark gains or caching savings | Not tied to the sponsor's process | Measured delta against the baseline |

### Exam traps

- **Highest score that breaks a ceiling**: read the latency and spend columns before the quality column.
- **Cheapest option** when the stem names a different objective; **"no trade-off"** or "guarantees" in the option text.
- **Sophistication bias**: multi-agent "for future flexibility" without a measured need.

### Practice

**Q9.** *Northgate Retail* (fictional) is choosing a support-deflection design. Ceilings: p95 ≤ 6 s and model spend ≤ $30,000/month for 400,000 tickets. Objective: the most tickets resolved without a human. Eval results: **Design 1**, Haiku-class single call: p95 1.8 s, $0.012/ticket, 51% resolved. **Design 2**, Sonnet-class with retrieval: p95 4.9 s, $0.060/ticket, 68% resolved. **Design 3**, Opus-class agent: p95 11.5 s, $0.070/ticket, 74% resolved. **Design 4**, Design 2 plus an evaluator pass: p95 8.2 s, $0.110/ticket, 71% resolved. Which choice and justification is correct?

- A) Design 3, because it resolves the most tickets, and latency can be tuned after launch with streaming.
- B) Design 1, because it costs $4,800/month and leaves the most budget for other initiatives.
- C) Route easy tickets to Design 1 and hard ones to Design 3, which captures the best of both with no trade-off.
- D) Design 2, because it resolves the most tickets of the designs that meet both ceilings ($24,000/month, 4.9 s), accepting 6 points fewer resolutions than Design 3.

**Answer: D.** Designs 3 and 4 break the p95 ceiling, and Design 4 also breaks the budget ($44,000). Of the survivors, Design 2 resolves 68% against 51%. A is tempting because its headline metric is highest, but ceilings are pass/fail, and streaming improves perceived latency, not measured p95. C claims "no trade-off" for an untested design whose hard path still exceeds p95.

**Q10.** *Halberd Utilities* (fictional) has engineering capacity for one Claude initiative this quarter. The sponsor's stated pillar is **productivity in the billing-disputes team**. Proposals: (A) migrate to the newest model, which gains 2 points on a public reasoning benchmark; (B) an assisted-drafting workflow that in a 4-week pilot cut dispute handling from 14 to 5 minutes on 3,000 disputes/month, compared with the pre-pilot baseline; (C) re-platform onto a multi-agent architecture "for future flexibility"; (D) prompt-caching work projected to save $300/month in model spend. Which proposal has the strongest business case?

- A) Proposal A, because a stronger model will improve every downstream task.
- B) Proposal B, because it shows a measured, baseline-compared productivity gain of about 450 hours a month on the sponsor's pillar.
- C) Proposal C, because flexibility reduces the cost of future initiatives.
- D) Proposal D, because it is a guaranteed, low-risk cost saving.

**Answer: B.** (14 − 5) min × 3,000 = 27,000 minutes, or 450 hours a month, measured against a baseline on the sponsor's pillar. D is tempting because savings feel safe, but $300/month sits on a different pillar and is small next to 450 staff hours. A and C are potential value with no measured link to disputes productivity.

### Official docs

- [Choosing a model](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
- [Define success criteria](https://platform.claude.com/docs/en/test-and-evaluate/define-success)
- [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing) (a cost lever for work nobody waits for)

---

## 1.6 Deployment Surface and Agent Runtime Selection

**What the exam is testing.** Pick a deployment surface and an agent runtime that satisfy data residency, compliance, model-availability and operational-ownership constraints. Justify the trade-offs in latency, feature availability, hosting, session state, sandboxing and data custody.

### Concept

There are two independent choices. The **surface** is where Claude is served from and whose terms govern the data. The **runtime** is who runs the agent loop, where tools execute, and where session state lives.

**Surfaces.** The docs now split them into two families:

| Surface | Operated by | Feature timing | Residency lever | Managed Agents |
|---|---|---|---|---|
| **Claude API** (first-party Anthropic API) | Anthropic | New features land here first | `inference_geo` per request or as a workspace default: `"global"` (default) or `"us"`; US-only inference is billed at 1.1× and needs Claude 4.6+ models | Yes (beta) |
| **Claude Platform on AWS** | Anthropic | Same-day parity with the Claude API | Same Anthropic controls | Yes (beta) |
| **Amazon Bedrock** | AWS (partner) | Partner rollout; some features missing | Your AWS region or a geography inference profile; regional endpoints cost about 10% more than the global endpoint | **No** |
| **Google Vertex AI** (Google-managed) | Google (partner) | Partner rollout | Your Google Cloud region | No |
| **Microsoft Foundry** | Listed as Anthropic-operated in current docs | Check the feature list; it isn't the full Claude API set | US Data Zone option, billed at 1.1× | No |

(Google Cloud also offers an **Anthropic-managed** variant that behaves like the Anthropic-operated family, including Managed Agents. Read the stem carefully when it says "on Google Cloud".)

Rules of thumb:

- **Feature availability.** New API features usually reach the first-party API first. "Needs the new feature" plus "must stay on Bedrock" is a real conflict; the right option names it.
- **Residency is not retention.** `inference_geo` and partner regions control *where* processing happens. **Zero Data Retention (ZDR)** controls *whether data is stored*. Real-time Messages calls are ZDR-eligible; Message Batches, the Files API, Agent Skills, the MCP connector, code execution and hosted Managed Agents sessions are not, and the API does **not** block them for ZDR orgs. The architect has to exclude them.
- **Retirement dates** on Anthropic's deprecation page apply to Anthropic-operated platforms; partners publish their own.

**Runtimes.**

| Runtime | You run | Anthropic runs | Session state | Sandbox | Best when |
|---|---|---|---|---|---|
| **Messages API loop** (your code, or the SDK tool runner) | The loop, tool execution, history storage | Inference | Yours: the API is stateless, so you resend history | Yours, if you need one | Short tasks, few tools, no shell or files; you already store history; strict ZDR |
| **Self-hosted Agent SDK / headless Claude Code** (`claude -p`) | Containers, scaling, storage, sandboxing | Inference (on any surface the SDK supports, including Bedrock) | **Local disk by default**: each session is a CLI subprocess with its own transcript, memory files and working directory | Yours | You need the full agent harness (files, shell, subagents, hooks) **and** custody in your own cloud or on a partner surface |
| **Claude Managed Agents** (beta) | Nothing, or just sandbox workers | Loop, session event history, cloud sandbox | Anthropic stores sessions until you delete them | Anthropic cloud, or a **self-hosted sandbox** (your workers run tools; Anthropic still stores history) | Long-running, async, stateful agents with no team to run the infrastructure |

Details the exam likes:

- **Managed Agents is not ZDR-eligible**, except the **self-hosted service** (the whole service runs on your infrastructure and you hold the transcripts). A **self-hosted sandbox** alone is *not* ZDR, because session history still lives with Anthropic. Deleting sessions after each run doesn't change that.
- **Managed Agents availability**: Claude API, Claude Platform on AWS, and Claude Models on Google Cloud (Anthropic-managed). Not Bedrock, Google-managed Vertex AI or Foundry. For US-only inference, `inference_geo` sits on the agent's `model` configuration (billed at 1.1×). Sessions can carry a hard spending `budget`.
- **Self-hosted Agent SDK state is a two-step problem.** Step 1: scale-down loses the transcript, so add a `SessionStore` adapter that mirrors transcripts to durable storage (best-effort; a failed write emits a `mirror_error` message and the session continues). Step 2: the store mirrors **transcripts only**. Memory files and working-directory artifacts need their own durable storage, such as a mounted volume inside your trust boundary.
- **Version-pin long-running sessions.** When the agent definition (prompt, tools, Skills, model) changes, pin each running session to the version it started on, run old and new side by side, and start new sessions on the new version. Swapping config under a live session causes untested behavior drift.

### Simple worked example

Two fictional clients, the same method. List the hard constraints, cross out cells of the matrix, then state what the survivor costs.

**Orrin Bank.** Constraints: all inference and data must stay inside its own AWS account through Amazon Bedrock (procurement and custody policy). Agents run multi-hour reconciliation jobs that write spreadsheets.

```text
Surface:  Bedrock (fixed by constraint)
Runtime:  Managed Agents        -> X  not offered on Bedrock
          Messages loop         -> possible, but rebuilds the file/shell harness
          Self-hosted Agent SDK -> ✓  full harness, runs in Orrin's account on Bedrock
Required: SessionStore -> durable store in-account
          working dir  -> mounted durable volume in-account
          version-pin sessions; caps via maxTurns / budget
Trade-off accepted: Orrin's platform team owns hosting, scaling, sandboxing and patching;
          some first-party features may arrive later on Bedrock.
```

**Kite Labs.** Constraints: no infrastructure team, long-running coding agents with a sandbox, US-only inference, no ZDR obligation, already on the Claude API.

```text
Surface:  Claude API
Runtime:  Managed Agents (cloud sandbox), inference_geo "us" on the agent's model config
Trade-off accepted: beta product; 1.1× pricing for US-only inference;
          Anthropic stores session history (acceptable: no ZDR obligation).
```

If Kite's tools later had to reach a private network, the answer would become a **self-hosted sandbox** (Kite runs the workers; Anthropic still stores history). Add a ZDR obligation, and the options become the **self-hosted Managed Agents service** or Kite's own **Messages API loop**.

### Decision table

| When the binding constraint is… | Choose… | Because… |
|---|---|---|
| Bedrock or own-cloud custody, and an agent harness is needed | Self-hosted Agent SDK (or headless Claude Code) there, with durable state | Managed Agents isn't offered there |
| No ops team; long-running stateful agent; no ZDR obligation | Managed Agents (cloud sandbox) on an Anthropic-operated surface | Anthropic hosts loop, sandbox and state |
| Tools must reach a private network; still no ops for the loop | Managed Agents with a self-hosted sandbox | Your workers run tools; Anthropic runs the loop |
| ZDR obligation plus an agentic workload | Own Messages API loop, or the self-hosted Managed Agents service | Hosted sessions aren't ZDR-eligible |
| Short request/response with a couple of tools | A plain Messages API loop | A full agent runtime is overhead |

### Anti-pattern → fix

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Managed Agents for a Bedrock-only client | Not available on Bedrock | Self-hosted Agent SDK on Bedrock |
| ZDR to satisfy residency, or "delete sessions" to claim ZDR | ZDR is about retention; eligibility is per feature | `inference_geo` or a region; Messages loop or self-hosted service for ZDR |
| `SessionStore` alone, or sticky routing, for an autoscaled SDK fleet | Files vanish; the container itself goes away | Durable mounted storage in your trust boundary |
| Hot-swapping agent config under running sessions | Behavior changes mid-task | Pin sessions to their starting version |

### Exam traps

- **Control answers a different question**: ZDR for location, a region for retention.
- **Breaks a stated constraint**: Managed Agents where the stem says Bedrock, custody or ZDR.
- **"No trade-off"** and **feature lag ignored**: every runtime moves work and risk somewhere, and partner surfaces don't have every Claude API feature.

### Practice

**Q11.** *Kestrel Analytics* (fictional) runs multi-hour data-analysis agents that need a file workspace and a code sandbox. Constraints: (1) model inference must happen in the US; (2) there is no team to run agent infrastructure; (3) there is no ZDR obligation; (4) the company already uses the Claude API. Which runtime and justification is correct?

- A) Managed Agents on Amazon Bedrock in a US region, because the region guarantees US processing and AWS hosts the runtime.
- B) A self-hosted Agent SDK fleet on Kubernetes calling the Claude API with `inference_geo: "us"`, because self-hosting gives full control with no trade-off.
- C) Managed Agents on the Claude API with `inference_geo: "us"` on the agent's model configuration, accepting beta status, 1.1× inference pricing and Anthropic-stored session history.
- D) A Messages API loop with ZDR enabled, because ZDR keeps data within the US.

**Answer: C.** Managed Agents hosts the loop, sandbox and state (constraint 2), `inference_geo` meets constraint 1, constraint 3 makes stored history acceptable, and the option names its trade-offs. B is tempting because it meets residency, but it breaks the no-ops constraint and claims "no trade-off". A fails because Managed Agents isn't on Bedrock, and D confuses retention with location.

**Q12.** *Ridgeback Insurance* (fictional) self-hosts the Agent SDK on Amazon Bedrock in autoscaling containers inside its AWS account. After autoscale-downs, resumed sessions lost their history, so the team added a `SessionStore` backed by an in-account database. Now resumed sessions remember the conversation, but the agent reports that draft spreadsheets it wrote earlier in the session no longer exist. Which change most directly fixes this **without** breaking the custody requirement?

- A) Put each session's working directory on durable shared storage mounted from within Ridgeback's AWS account, so files survive container replacement.
- B) Enable sticky routing so a resumed session always returns to the container that created it.
- C) Add to the system prompt: "If files from earlier in the session are missing, regenerate them from the conversation history."
- D) Move the agents to Claude Managed Agents, which persists session state automatically.

**Answer: A.** `SessionStore` mirrors transcripts only; working-directory artifacts need their own durable storage, and keeping it in-account preserves custody. B is tempting because routing feels like a state fix, but after scale-down the original container no longer exists. D isn't offered on Bedrock and would move custody out, and C asks the model to rebuild artifacts it may not reproduce faithfully.

### Official docs

- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Data residency](https://platform.claude.com/docs/en/build-with-claude/data-residency) and [Zero data retention](https://platform.claude.com/docs/en/build-with-claude/zero-data-retention)
- [Claude on Amazon Bedrock](https://platform.claude.com/docs/en/build-with-claude/claude-in-amazon-bedrock) · [Vertex AI](https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai) · [Microsoft Foundry](https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry) · [Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

---

## Key takeaways

- **Name the binding constraint first.** Residency, ZDR, custody, p95, the spend ceiling or reviewer capacity usually eliminates most options before you compare quality.
- **Delegate by reversibility, stakes and accountability**, and enforce the split through the tool surface and code, never through prompt wording or model confidence.
- **Every human gate needs capacity arithmetic.** Arrivals × minutes per review must fit within reviewers × productive minutes, or the gate becomes a rubber stamp.
- **To find what fails first**, compute per-dimension utilization (RPM, input TPM, output TPM) for load, and find the first model-chosen value that is trusted for trust conditions. Derive tenant identity server-side.
- **Least autonomy that works.** Use a chain for fixed steps, routing for conflicting categories, sectioning for known independent subtasks, orchestrator-workers for subtasks found at runtime, and an agent only for open-ended paths. Skills package reusable know-how but do not restrict tools.
- **Subagents see only their brief and return only their final message.** Use structured status, have code check the result `subtype` (e.g., `error_max_turns`), rerun only failed units, and audit from hooks or OTel rather than self-reports.
- **Constraint, then optimize.** Drop options that break a ceiling, maximize the named metric, compare cost per completed task, and state the trade-off.
- **Surface × runtime.** New features land first on Anthropic-operated surfaces. Managed Agents isn't on Bedrock, Google-managed Vertex AI or Foundry. Hosted Managed Agents isn't ZDR, though the self-hosted service can be. Residency and ZDR answer different questions.
- **Self-hosted Agent SDK state needs two fixes**: `SessionStore` for transcripts *and* durable storage for working directories. Pin long-running sessions to the version they started on.

## Confused pairs

| Pair | The difference |
|---|---|
| Prompt chaining vs orchestrator-workers | A chain's steps are fixed in code; an orchestrator decides the subtasks at runtime |
| Sectioning vs voting | Sectioning splits *different* subtasks for speed; voting runs the *same* task several times for confidence |
| Routing vs Skills | Routing changes which prompt **and tools** handle a request; Skills change instructions only |
| "Claude acts, human reviews" vs "Claude prepares, human decides" | The first is for reversible actions reviewed within a window; the second is for irreversible or accountable decisions |
| `success` vs `error_max_turns` | Only `success` means the worker finished; the other is partial work that may *read* as complete |
| Hook/OTel audit vs worker self-report | Runtime records show what actually ran; a self-report shows what the model says ran |
| Self-hosted sandbox vs self-hosted Managed Agents service | The sandbox runs only tools on your side (history stays with Anthropic, not ZDR); the service runs everything on your side (can be ZDR) |
| `inference_geo` vs ZDR | Where processing happens vs whether data is retained |
| Claude Platform on AWS vs Amazon Bedrock | Anthropic-operated (same-day parity, Managed Agents) vs partner-operated (own rollout, no Managed Agents) |
| `SessionStore` vs a durable working directory | Transcripts vs files and memory; a self-hosted fleet needs both |
| Cost ceiling vs objective | A ceiling eliminates options; the objective ranks the survivors |

---

[← About the exam](about-the-exam.md) · [Domain 2 →](domain-2-models-prompting-context.md)

<!-- support-footer -->
---

> ⭐ **Found this useful?** [Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) so other candidates can find it · 💼 [Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) for updates and new mock exams.
