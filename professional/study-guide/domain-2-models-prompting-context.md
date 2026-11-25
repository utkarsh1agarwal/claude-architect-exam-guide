# Domain 2: Claude Models, Prompting, and Context Engineering (13%)

This domain is worth about **8 scored items**, but its ideas show up all over the exam. Cost, latency, and architecture questions in other domains often turn on a Domain 2 fact: which tier clears the bar, why the cache never hits, or why a long-running agent forgets an early value.

Items share one shape: a workload, some evidence (eval table, usage report, prompt, trace), and a constraint. You pick the change that fixes the *observed* failure at the *lowest* cost. Most wrong options are real best practices aimed at a different symptom.

> **Product facts move fast.** Model names, prices, defaults, and beta headers below were checked against Anthropic's docs in November 2026. The exam favors **tier language**: smallest/fastest tier (Haiku-class), balanced tier (Sonnet-class), most capable tier (Opus-class and above). When a number matters, the question states it in the scenario. Learn the reasoning, not the price list.

## At a glance

| Skill | What the exam asks | One-line rule |
|---|---|---|
| 2.1 Model tier selection | Which tier meets every latency, cost, and quality constraint? Why does each other tier fail? | Pick the **cheapest tier that clears every constraint**. Compare **cost per completed task**, not price per token. |
| 2.2 System prompt diagnosis and revision | What is missing from this prompt, and which revision fixes it without over-constraining? | Name the missing rule, give the **reason**, define the output. Use calm, plain wording, not ALL-CAPS. |
| 2.3 Prompting technique selection | Zero-shot, few-shot, prompted reasoning, native thinking, or structured output: which one fixes this failure? | Match the technique to the failure: wrong **style** → examples. Wrong **shape** → structured outputs. Wrong **reasoning** → thinking. Missing **rule** → state it. |
| 2.4 Context composition and token economics | Where do the tokens go, and what can be cut without losing needed information? | Measure each part of the context. Cut what the task never uses. Cache what repeats. |
| 2.5 Cache breakpoints and reusable packaging | Where should `cache_control` go? When is a Skill the right package? | **Stable before volatile.** Order is tools → system → messages. Skills hold procedures that are only *sometimes* needed. |
| 2.6 Reasoning effort and context lifecycle | What effort level? Context editing, memory tool, or compaction? | Use the **lowest effort that holds the eval**. Clear bulky stale results, persist exact facts, summarize the rest. |

---

## 2.1 Model Tier Selection

**What the exam is testing.** Given a workload with a quality floor, a latency limit, and a budget, can you choose the tier that meets *all* of them? Can you also say why each rejected tier fails? Some options pick the right tier for the wrong reason, or claim it "gives up nothing". Those are wrong.

**Concept.** The smallest tier is fastest and cheapest. The balanced tier trades a little speed for much more capability. The most capable tiers are best at long, hard, agentic work, and cost more and respond more slowly. Selection has four steps:

1. **Quality is a floor, not a score to maximize.** Any tier below the eval floor is out, however cheap.
2. **Hard constraints filter next.** A p95 latency SLA or a fixed monthly budget removes more tiers.
3. **Among the survivors, pick the cheapest.** Measure **cost per completed task**: the token cost *plus* the cost of handling failures (retries, human escalation, rework). A cheap tier that fails often can cost more per finished task than a pricier one.
4. **If every tier fails the same cases, the cause is not capability.** It is usually **missing context**: a rule nobody stated or a document that wasn't retrieved. Fix the context and keep the cheapest passing tier. A bigger model can't know a fact you never gave it.

In a multi-agent system, choose a tier **per role**, swapping one role at a time and re-running the eval. "Capable lead, cheap workers" is a habit, not a method.

Two side levers are not tiers. **Fast mode** (some top-tier models) runs the *same* model with faster output generation (not faster time to first token) at a premium price. The **Batch API** halves the price but is asynchronous, with up to 24 hours to complete, so it never fits an interactive user.

**Simple worked example — cost per completed task.** Northwind Freight drafts replies to shipping-dispute emails. Constraints: accuracy on the 400-case eval **≥ 94%**, p95 latency **≤ 4 s**, and a failed draft goes to a human at **$2.00** per escalation. Each task uses about 3,000 input and 400 output tokens. *(Prices in this example are illustrative.)*

| Tier | Price (input / output per MTok) | Token cost per task | Eval pass rate | p95 latency | Failure cost (fail rate × $2.00) | **Cost per completed task** | Verdict |
|---|---|---|---|---|---|---|---|
| Small | $1 / $5 | $0.003 + $0.002 = **$0.005** | 78% | 1.2 s | 0.22 × 2.00 = $0.44 | **$0.445** | Fails quality floor |
| Balanced | $3 / $15 | $0.009 + $0.006 = **$0.015** | 95% | 3.1 s | 0.05 × 2.00 = $0.10 | **$0.115** | **Clears every constraint** |
| Most capable | $5 / $25 | $0.015 + $0.010 = **$0.025** | 96% | 6.1 s | 0.04 × 2.00 = $0.08 | **$0.105** | Fails latency SLA |

The most capable tier is slightly cheaper *per completed task*, which is a nice trap. But it breaks the 4-second SLA, so it is out. The balanced tier wins. The honest trade-off: it costs about 3× the small tier per call, and it accepts a 1-point lower pass rate than the top tier.

Now suppose the 5% of balanced-tier failures and the 4% of top-tier failures are **the same cases**, all disputes about a "force majeure" clause. Then the gap is missing context, not capability. Add the clause policy to the prompt and re-test. The small tier might then clear 94% too.

**Decision table**

| Evidence in the stem | Choose |
|---|---|
| High volume, simple classification or routing, tight latency, small tier passes the eval | Smallest tier |
| Small tier below floor; balanced passes; latency SLA rules out top tier | Balanced tier |
| Long, multi-step agentic work where only the top tier passes | Most capable tier (state the cost) |
| All tiers fail the same cases | Add the missing context; keep the cheapest passing tier |
| No user waiting; results needed by tomorrow | Batch API on the cheapest passing tier |

**Anti-pattern → fix**

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| "It's safety-relevant, so use the most capable tier" | Safety is enforced by controls, not by tier | Pick on the eval floor and constraints; add guardrails separately |
| Comparing price per million tokens only | Ignores failure-handling cost | Compute cost per completed task |
| Upgrading tier when every tier fails the same cases | Capability isn't the gap | Supply the missing rule or document |
| Swapping every agent's tier at once | You can't tell which change helped | Change one role at a time, re-run evals |

**Exam traps**
- "Gives up nothing" or "no trade-off" in an option means it is almost always wrong.
- Batch discount offered for an interactive chat. It breaks the latency constraint.
- Raising effort or thinking to fix a missing fact. More reasoning doesn't create information.
- The right tier chosen for the wrong reason (for example "because it's fastest" when speed wasn't the binding constraint).

**Practice**

**Q2.1a.** Lakeside Insurance classifies incoming claim emails into 14 queues. It handles 1.2 million emails a month, needs p95 ≤ 1.5 s, and has a quality floor of 97% routing accuracy. Eval results: small tier 97.4% (p95 0.9 s), balanced tier 98.1% (p95 2.2 s), most capable tier 98.3% (p95 4.0 s). Which choice is correct, with the right reason?

- A) Balanced tier, because it has the best accuracy-to-cost ratio and gives up nothing
- B) Small tier, because it clears the 97% floor and is the only tier inside the latency SLA; it accepts ~0.7 points lower accuracy than the balanced tier
- C) Most capable tier, because misrouted claims carry regulatory risk
- D) Small tier, because routing is always a small-tier task regardless of evals

**Answer: B.** The small tier is the only one that clears both the quality floor and the 1.5 s SLA. It also states its trade-off honestly. A is the tempting choice, but the balanced tier breaks the latency constraint, and "gives up nothing" is a red flag. C uses risk as a reason to upgrade even though the top tier breaks the SLA. D reaches the right tier with an invalid rule that ignores evidence.

**Q2.1b.** A contract-review assistant fails the same 31 of 500 eval cases on all three tiers. Every failing case involves a client-specific indemnity cap that is in the client's playbook, and the playbook is not sent to the model. What should the architect do first?

- A) Move to the most capable tier and raise effort to `max`
- B) Add more few-shot examples of correct indemnity reviews
- C) Retrieve the relevant playbook clause into context, then re-run the eval and keep the cheapest tier that passes
- D) Run each case three times and take the majority answer

**Answer: C.** Identical failures across tiers point to missing information, not missing capability. A is the scale-up reflex: no tier or effort level can recall a cap it was never given. B teaches format, not client-specific facts. D adds cost and still lacks the fact.

**Official docs:** [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview) · [Pricing](https://platform.claude.com/docs/en/about-claude/pricing) · [Optimizing for cost and intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence) · [Fast mode](https://platform.claude.com/docs/en/build-with-claude/fast-mode) · [Batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing)

---

## 2.2 System Prompt Diagnosis and Revision

**What the exam is testing.** You see a system prompt and some degraded or inconsistent outputs. You must find the *underspecification*, meaning the missing rule, audience, format, or scope. Then pick the revision that fixes it **without over-constraining** legitimate variation.

**Concept.** Newer Claude models follow instructions **precisely and literally**. That changes how prompts fail:

- **Vague prompts give inconsistent output.** If you never say who the reader is, what order to use, or what to do when data is missing, the model guesses, and guesses vary from run to run.
- **Over-emphatic prompts over-trigger.** Words like "CRITICAL", "MUST", "ALWAYS", and "EVERY" were once needed to get older models' attention. On newer models they cause over-application: a tool gets called when it isn't needed, or a required field gets *invented* when the source has no value. Anthropic's prompting guidance says to dial this language back. **Fix:** use plain, conditional wording ("Use the lookup tool when the customer gives an order number") and state the reason.
- **Rules without reasons generalize badly.** "Never mention competitor prices" is brittle. "Don't quote competitor prices, because they change daily and we can't verify them. Link to our price-match policy instead" lets the model handle cases the rule didn't name.

A useful test: **would a capable new colleague, given only this prompt, produce what you want?** If they'd ask "who is this for?" or "what if the field is missing?", the prompt is underspecified. Use XML tags (`<instructions>`, `<context>`, `<policy>`) to separate parts, give a fixed output order, say what to write when information is "not stated", and name what is out of scope.

But don't over-correct. A rigid template with a word cap and twenty "never" rules kills useful variation. The right revision constrains **scope, format, and behavior** and leaves content judgment to the model.

**Simple worked example — bad vs revised system prompt.** Brightpath Health's discharge-summary assistant produces summaries that vary in order. It sometimes invents a follow-up date, and it is sometimes written for doctors and sometimes for patients.

```text
# BEFORE
You are a medical assistant. ALWAYS produce a COMPLETE summary.
EVERY summary MUST include the follow-up date. Be thorough!!!
```

What's wrong: no audience, no order, no rule for missing data, and "MUST include the follow-up date" pushes a literal model to *fabricate* one when the notes have none.

```text
# AFTER
<role>You write discharge summaries for patients and their families.
Readers have no medical training, so use plain language and
explain any medical term in a few words.</role>

<format>
Use these four sections, in this order:
1. Why you were in the hospital
2. What was done
3. Medicines (name, dose, when to take)
4. Follow-up (who, when)
</format>

<missing_information>
If the notes do not give a value, write "Not stated in your
discharge notes — ask your care team." Do not estimate dates or
doses, because a wrong date or dose can cause real harm.
</missing_information>

<scope>Do not give new medical advice beyond what the notes say.</scope>
```

The revision sets the audience, fixes the order, handles the missing case, and explains why. It does not cap length or script each sentence, so a complex stay can still get a longer summary.

**Decision table**

| Symptom | Likely underspecification | Revision |
|---|---|---|
| Output order/sections vary run to run | No format stated | Fixed section list in a stated order |
| Invented values for required fields | Field demanded with no "missing" rule; emphatic wording | Explicit "not stated" behavior + reason |
| Wrong reading level or tone | Audience not stated | Name the reader and their background |
| Tool called on every turn | "ALWAYS use the tool" | Conditional: "use X when …" |
| Errors cluster on one business case | Unstated business rule | State the rule and its motivation |

**Anti-pattern → fix**

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| ALL-CAPS "CRITICAL/MUST" everywhere | Newer models over-apply it | Plain, conditional wording with a reason |
| Rigid template + word cap to fix inconsistency | Over-constrains legitimate variation | Constrain structure and scope only |
| A rule with no reason | Brittle at the edges | Add one sentence of motivation |
| Conditioning behavior on the model's self-rated confidence | Self-reported confidence isn't evidence | Condition on observable facts in the input |

**Exam traps**
- "Lower the temperature for consistency." Current API versions reject `temperature`, `top_p`, and `top_k`. Consistency comes from the prompt, examples, and output constraints. Outputs still vary run to run, which is why evals use several trials per case.
- "Add MUST/IMPORTANT to the rule that's being ignored." On newer models this often makes things worse elsewhere.
- Structured outputs offered for a *content* failure. A wrong value can still be a schema-valid value.

**Practice**

**Q2.2a.** After a model upgrade, a support agent calls `lookup_order` on almost every turn, including "thanks, bye!". The system prompt says: "You MUST ALWAYS call lookup_order to verify EVERY customer claim." Which revision best fixes this without losing legitimate lookups?

- A) "Call lookup_order only if you are more than 80% confident the customer mentioned an order."
- B) "Call lookup_order when the customer refers to a specific order or delivery, so your answer reflects current status. Greetings and general policy questions don't need it."
- C) "CRITICAL: Do NOT call lookup_order unless absolutely necessary."
- D) Remove `lookup_order` from the tool list and paste the order database into the system prompt

**Answer: B.** The emphatic "ALWAYS … EVERY" wording is being followed literally. A plain, conditional rule with a reason restores judgment. A depends on the model's self-rated confidence, which isn't reliable evidence. C swaps one emphatic over-trigger for another and will likely suppress real lookups. D bloats context with stale data.

**Q2.2b.** A procurement assistant's summaries are correct, but 18% of them list cost before risk while the rest list risk first. Reviewers also flag that summaries never say when the vendor's SOC 2 report is missing. Which revision addresses both findings with the least added constraint?

- A) Add a fixed section order (Risk, Cost, Timeline) and the instruction: "If no SOC 2 report is attached, say 'SOC 2 report: not provided', because procurement can't approve without it."
- B) Enforce a 150-word cap and a sentence-by-sentence template
- C) Add 20 example summaries spread across all vendor types
- D) Turn on adaptive thinking so the model reasons about section order

**Answer: A.** One sentence fixes the order and one fixes the missing-data case, and the reason tells the model why it matters. B over-constrains and does nothing about SOC 2. C costs many tokens and still relies on the model inferring an unstated rule. D adds reasoning cost for what is a specification gap.

**Official docs:** [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) · [Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)

---

## 2.3 Prompting Technique Selection

**What the exam is testing.** Given a failure pattern and a task's complexity, can you pick the technique that fixes *that* failure at the lowest token cost? The choices are zero-shot, few-shot, prompted reasoning, native thinking, and structured outputs.

**Concept.** Each technique fixes one kind of failure:

| Technique | What it is | Fixes | Costs |
|---|---|---|---|
| **Zero-shot (clear instructions)** | Instructions only, no examples | Missing rules, scope, audience | Fewest tokens |
| **Few-shot** | 3–5 diverse examples, each in `<example>` tags | Inconsistent **style, tone, format** when the facts are right | Input tokens per request (cacheable) |
| **Prompted reasoning** | Ask Claude to reason in `<thinking>` tags, then answer in `<answer>` tags | Multi-step logic when you need a visible, parseable rationale | Output tokens |
| **Native (adaptive) thinking** | `thinking: {type: "adaptive"}`. The model decides how much to think; effort sets the depth. | Hard reasoning, math, multi-step planning | Thinking tokens, billed as output |
| **Structured outputs** | `output_config.format` with a JSON schema; output is constrained to that shape | Parse failures, missing or extra fields, wrong types | Small overhead; first-use schema compile latency |

Key facts to know:

- **Few-shot: 3–5 examples, diverse, in `<example>` tags.** With **one** example, the model copies it too closely: its length, its opening phrase, and even incidental details like a product name. Several *varied* examples show what is fixed and what can change. With caching, much larger example sets (20+) can pay off, because the repeated examples become cheap cache reads.
- **Native thinking on current models is adaptive.** The older fixed `budget_tokens` setting is removed on the newest models (sending it returns an error). You steer depth with **effort** (see 2.6). Some top models can't turn thinking off at all, so lower the effort instead. Thinking tokens are billed as output, count toward `max_tokens`, and occupy context.
- **Prompted reasoning still has a place** when you need a parseable rationale an auditor can read. On newer models the raw thinking display may be omitted by default (and is still billed), so don't build an audit trail on raw thinking; ask for a brief `rationale` field.
- **Structured outputs guarantee shape, not correctness.** A schema stops broken JSON. It does not stop a wrong value that happens to be valid. Two caveats: a **refusal** (`stop_reason: "refusal"`) or a **`max_tokens` cut-off** can still return output that doesn't match the schema, so keep error handling in the loader. Enum values may also come back with different capitalization, so compare them case-insensitively. The old `output_format` parameter is deprecated; use `output_config.format`.
- **Prefill and forced tool choice are gone on the newest models.** Assistant-message prefill (starting Claude's reply with `{`) is removed on recent model generations. Forcing a specific tool with `tool_choice` (`any` or `tool`) returns an error on the newest top models. Use `tool_choice: auto` with `strict: true` tools, or structured outputs.
- **Long-document layout:** put long documents **first**, wrap each in tags with its source, and put the question **last**. This improves recall on long inputs.

**Simple worked example — matching failure to technique.** Quillmark's invoice extractor shows three separate failures in one week:

```text
Finding 1: 6% of responses fail JSON.parse (trailing prose, missing brace).
Finding 2: Field values are correct, but the "notes" field style varies:
           some are terse, some are chatty paragraphs.
Finding 3: Line-item totals are wrong on invoices with tiered discounts
           (needs multi-step arithmetic).
```

Fixes:

```json
// Finding 1 → structured outputs (shape)
"output_config": {
  "format": {
    "type": "json_schema",
    "schema": { "type": "object",
      "properties": { "vendor": {"type": "string"},
                      "total":  {"type": "number"},
                      "notes":  {"type": "string"} },
      "required": ["vendor", "total", "notes"],
      "additionalProperties": false }
  }
}
```

```xml
<!-- Finding 2 → few-shot (style): 3–5 varied examples -->
<examples>
  <example>…notes: "Net-30. PO matched."…</example>
  <example>…notes: "Partial shipment; balance due on delivery."…</example>
  <example>…notes: "Currency EUR; converted at invoice date."…</example>
</examples>
```

Finding 3 → enable adaptive thinking (or raise effort if it's already on) for the tiered-discount route, or compute totals in code and let the model only extract the line items. Arithmetic you can do deterministically belongs in code.

**Decision table**

| Observed failure | Technique |
|---|---|
| Errors cluster on an unstated business rule | Zero-shot: state the rule + reason |
| Facts right, tone/format/length inconsistent | Few-shot, 3–5 diverse examples |
| Output copies one example's length and phrasing | Replace the single example with several varied ones |
| JSON parse failures, missing fields | Structured outputs |
| Wrong answers on multi-step logic | Native thinking (adaptive) / higher effort |
| Deterministic math or lookup | Do it in code, not in the prompt |

**Anti-pattern → fix**

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Few-shot to fix parse failures | Examples guide, they don't enforce | Structured outputs |
| Structured outputs to fix wrong tone | Shape ≠ style | Few-shot examples |
| One "perfect" example | Over-imitation | 3–5 diverse examples |
| Thinking turned to max for a style problem | Pays reasoning tokens for no gain | Few-shot or clearer instructions |
| Prefill `{` to force JSON on a new model | Prefill is removed on newer models | `output_config.format` |

**Exam traps**
- "Structured outputs guarantee correct data." No. They guarantee shape. Keep validation and refusal handling.
- "Use extended thinking with `budget_tokens: 8000`." That is the older interface; on the newest models use adaptive thinking and effort.
- "Increase effort" offered for inconsistent tone. Effort changes how hard the model works, not what style you want.

**Practice**

**Q2.3a.** An HR assistant writes interview feedback summaries. Facts are accurate, but hiring managers complain that length swings from two lines to a full page. Every summary starts with "Overall, the candidate…", and several mention "Python" even for non-engineering roles. The prompt includes one example summary, for a Python engineer. What's the most direct fix?

- A) Add a JSON schema with a `summary` string field
- B) Raise effort to `high` so the model considers each candidate more carefully
- C) Add "Do not mention Python unless relevant" to the prompt
- D) Replace the single example with four varied examples (different roles, lengths, and openings) in `<example>` tags

**Answer: D.** The repeated opening and the stray "Python" are classic over-imitation of a single example. Several diverse examples show what varies and what stays fixed. C is tempting, but it patches one symptom and leaves the copied opening and length drift. A controls shape, not prose style. B adds reasoning cost for a style problem.

**Q2.3b. (Select TWO.)** A claims-triage service on one of the newest top-tier models has two findings: (1) 4% of responses can't be parsed by the downstream loader, and (2) a fraud-risk field is sometimes wrong on claims where the model must combine three policy conditions. The team's current code prefills `{` and forces `tool_choice` to a `record_triage` tool, and both now return errors. Which TWO changes address the findings?

- A) Set `output_config.format` with the triage JSON schema, and keep loader handling for `stop_reason` values `refusal` and `max_tokens`
- B) Lower `temperature` to 0 to make the fraud field consistent
- C) Use adaptive thinking and evaluate a higher effort level on the fraud-risk route
- D) Add a second model call that repairs any malformed JSON

**Answer: A and C.** A fixes finding 1 at the source and replaces the removed prefill and forced-tool pattern; the caveat about refusals and cut-offs is accurate. C targets finding 2, which is a multi-step reasoning failure. B is invalid: current API versions reject `temperature`, and it was never a correctness lever. D is tempting for finding 1, but it adds a second call and its latency instead of preventing malformed output at the source, and it does nothing for finding 2.

**Official docs:** [Multishot prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting) · [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) · [Extended and adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/thinking) · [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

---

## 2.4 Context Composition and Token Economics

**What the exam is testing.** Given a token budget, a call volume, and a breakdown of what's in the context, can you find where tokens can be cut **without losing information the task needs**? And can you tell "make it cheaper" (caching) apart from "make it smaller" (sending fewer tokens)?

**Concept.** Everything in a request counts toward the context window: tools, system prompt, messages, tool results, documents, and the output (including thinking). Each part has its own lever:

| Context part | Typical bloat | Lever |
|---|---|---|
| Tool definitions | Dozens of tools sent every turn | Tool search with `defer_loading`; keep the 3–5 most-used tools loaded |
| System prompt | Rarely used procedures always loaded | Move them into a Skill (loaded on trigger) |
| Retrieved documents | Top-20 chunks when 3 are used | Better ranking, smaller top-k, rerank |
| Conversation history | Old turns kept verbatim | Compaction |
| Tool results | Huge logs/JSON read once | Context editing (clear old results), or return summaries from the tool |
| Output / thinking | Effort higher than needed | Lower effort where evals hold |

Two different goals:

- **Cost per request.** Caching cuts the *price* of repeated input (reads cost a small fraction of base input) and lowers time to first token on long prompts.
- **Context capacity and quality.** Caching does **not** shrink the window. Cached tokens still occupy context and still add to "context rot" (recall degrades as context grows). To free space, **send fewer tokens**.

Two more facts: on most models **cache reads don't count toward input-tokens-per-minute (ITPM) rate limits** (writes do), so caching can relieve ITPM pressure. And **tokenizers change**: Claude 4.7 and later produce roughly 30% more tokens for the same text, so re-measure budgets when you migrate.

**Simple worked example — a per-request budget.** Harborview Bank's internal research agent runs 20,000 requests a day. Its context limit is 200K tokens of working budget, and it's hitting quality problems around turn 30. Here's one late-turn request:

```text
Component                         Tokens    Used by the task?
--------------------------------  -------   ------------------------------
Tool definitions (48 tools)        22,000   ~6 tools used per session
System prompt                       7,500   yes, every turn
  of which: export-to-PDF guide     3,000   ~2% of sessions
Retrieved filings (top-20)         38,000   answers cite 2–4 chunks
Conversation history               41,000   recent turns matter most
Old tool results (raw SQL dumps)   64,000   each read once, then stale
--------------------------------  -------
Total input                       172,500
```

Where to cut, in order of impact:
1. **Old tool results, 64K.** Use context editing to clear stale results (or have the tool return a summary). This saves the most and loses nothing the task still needs.
2. **Retrieved filings, 38K.** Rerank and cut to the top 5–8. Check the eval for recall first.
3. **Tool definitions, 22K.** Defer the long tail with tool search and keep the frequent ones loaded.
4. **PDF guide, 3K.** Move it into a Skill so it loads only when triggered.
5. **System prompt core and recent history.** Keep them, and cache the stable prefix.

Not on the list: "cache the 64K of tool results". Cheaper, but the window stays just as full.

**Decision table**

| Goal stated in the stem | Lever |
|---|---|
| Cut cost of a repeated large prefix | Prompt caching |
| Free context window space | Send fewer tokens: context editing, compaction, retrieval tuning, tool search, subagents |
| Many tool definitions, few used | Tool search with deferred loading |
| Rare procedure always in the prompt | Skill (progressive disclosure) |
| Small, static knowledge base (under ~200K tokens) used on every call | Put it all in the prompt and cache it |

**Anti-pattern → fix**

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Caching to fix a full context window | Cached tokens still occupy context | Remove or clear tokens |
| Bigger context window to fix late-session recall | More tokens, more rot | Trim and structure context |
| Retrieve top-50 "to be safe" | Dilutes attention, costs tokens | Rerank, smaller top-k, measure recall |
| Removing content the task needs to save tokens | Breaks quality | Cut only what the task never uses |

**Exam traps**
- "Caching reduces context usage." No. It reduces price and time to first token.
- Redaction or summarization that removes information the task depends on.

**Practice**

**Q2.4a.** A code-review agent hits the context limit on large pull requests. Usage shows 70% of input tokens are full test-log outputs from earlier tool calls that the agent read once. The prompt prefix is already cached with a high hit rate. What most directly fixes the limit without losing needed information?

- A) Add a second cache breakpoint after the test logs
- B) Switch to a 1-hour cache TTL
- C) Enable context editing to clear old tool results (keeping recent ones), and have the test tool return failures only
- D) Move to a model with a larger context window

**Answer: C.** The window is full of stale, single-use tool output. Clearing it (and returning less in the first place) frees space without dropping anything the agent still needs. A and B are the trap: caching changes price, not occupancy, and nothing is expiring anyway. D postpones the problem and adds context-rot risk.

**Q2.4b.** A tax-guidance chatbot sends a 90,000-token static rules corpus on every request, about 400,000 requests a day, with interactive users. Answers are good. Finance wants input costs down without losing accuracy. What's the best first move?

- A) Mark the end of the static corpus with `cache_control` so repeat requests read it from cache
- B) Send all requests through the Batch API
- C) Retrieve only the top-3 rule chunks per question
- D) Switch to the smallest tier

**Answer: A.** A large, identical prefix repeated at high volume is the textbook caching case. Reads cost a small fraction of base input, and quality doesn't change. B breaks the interactive constraint. C may cut tokens but risks the accuracy that is already good, so it would need evals first. D changes quality without evidence it still passes.

**Official docs:** [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) · [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) · [Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) · [Rate limits](https://platform.claude.com/docs/en/api/rate-limits) · [Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)

---

## 2.5 Cache Breakpoints and Reusable Packaging

**What the exam is testing.** Can you place cache breakpoints so stable content comes before dynamic content, read a usage report to spot a broken cache, and decide when to package content as a Skill instead of putting it in the prompt?

**Concept — how the cache works.**

- **Prefix order is fixed: `tools` → `system` → `messages`.** The cache key is everything from the start of the request **up to and including** the block marked with `cache_control`. A hit needs that prefix to be **100% identical**, including text and images.
- **Volatile content before stable content breaks everything.** If a timestamp, user ID, account balance, or per-request tool list sits *before* the stable part, every request has a different prefix. Every request **writes** a new entry and **none read** one. That's worse than no caching, because **writes cost more than uncached input** (1.25× base for the 5-minute cache, 2× for the 1-hour cache).
- **Up to 4 breakpoints.** The system also looks back up to 20 blocks for entries that earlier requests wrote at breakpoints.
- **TTL:** the default is **5 minutes, refreshed free each time the entry is read**. A **1-hour** TTL is available at a higher write price. It helps when gaps between requests exceed 5 minutes. It doesn't help when the prefix keeps changing.
- **Concurrency:** an entry becomes readable only **after the first response starts**. If 50 identical requests fire at once, all 50 write. **Warm the cache with one request first**, then send the burst. Pre-warming with `max_tokens: 0` is documented (not allowed inside batches).
- **Minimum length:** prefixes below a model-specific minimum (512–4,096 tokens) are silently not cached; both cache fields read 0.
- **Things that invalidate the cache:** changing tool definitions (invalidates everything); toggling web search, citations, or fast mode; changing `tool_choice` or adding or removing images (message blocks); changing **effort** or the **thinking** configuration (message blocks at least, and system and tools on some models); switching models (caches are per model). Explicitly sending a model's *default* effort is the same as omitting it.
- **Deferred tools sit outside the prefix.** With tool search, tools marked `defer_loading` are left out of the cached system-prompt prefix (and can't carry `cache_control`). Discovered tools are added inline later, so a varying set of discovered tools doesn't break the prefix.
- **Mid-session changes without breaking the cache:** on supported models, add a `role: "system"` message inside `messages` instead of editing the top-level `system`. A per-message effort setting (beta) also leaves the cached prefix intact.
- **Automatic caching:** a top-level `cache_control` puts the breakpoint on the last cacheable block and moves it forward as the conversation grows. It uses one of the 4 breakpoint slots. It suits multi-turn chats. In a single-turn workload where the last block changes on every call, put an explicit breakpoint at the end of the stable content instead.
- **Cache diagnostics:** pass the previous response's ID and the API reports where consecutive prefixes diverged (model, system, tools, or messages). Debug low hit rates with it instead of guessing.

**Concept — Skills as reusable packaging.** An **Agent Skill** is a folder with a `SKILL.md` file plus optional scripts and resources. It loads in three levels (**progressive disclosure**):

1. **Metadata** (name and description, about 100 tokens per Skill) is always loaded, so Claude knows the Skill exists.
2. **The `SKILL.md` body** loads only when the Skill is triggered by a matching task.
3. **Bundled files** load only when accessed. **Bundled scripts are executed, not read.** Only their *output* enters context.

The exam likes that last point. If the model re-writes the same long program as output tokens on every request, a cached system prompt won't help: the code is still *generated*. A bundled script runs and only its result enters context. On the Claude API, Skills need the **code execution tool** and the **`container`** parameter (API containers have no network access). Custom Skills don't sync across the API, claude.ai, and Claude Code; they follow standard retention (not ZDR-eligible); and third-party Skills should be treated like installed software.

**Rule of thumb:** content that **every** request needs belongs in the cached prompt. Procedures or code needed only **sometimes** belong in a Skill.

**Simple worked example — fixing a broken prefix.** Pinecrest Travel's booking assistant handles 10,000 requests a day with a 12,400-token stable system prompt (policies + fare rules). *(Illustrative pricing: base input $3/MTok, 5-minute write 1.25×, read 0.1×. Read multipliers vary by model.)*

```python
# BEFORE — volatile content first
system=[
  {"type": "text", "text": f"Now: {now_iso}. Agent ID: {agent_id}."},   # changes every call
  {"type": "text", "text": POLICIES_AND_FARE_RULES,                     # 12,400 tokens, stable
   "cache_control": {"type": "ephemeral"}},
]
```

Usage on three consecutive requests:

```text
            cache_creation_input_tokens  cache_read_input_tokens  input_tokens
request 1                        12,430                        0           310
request 2                        12,428                        0           295
request 3                        12,431                        0           322
```

Every request writes and none read. The prefix includes the timestamp, so it never matches. Daily cost of the prefix: 10,000 × 12,430 × $3 × 1.25 / 1M ≈ **$466**. With no caching at all it would be ≈ **$373**. The broken cache costs *more* than no cache.

```python
# AFTER — stable first, breakpoint at the end of stable content,
# volatile data moved after the breakpoint (into the user turn)
system=[
  {"type": "text", "text": POLICIES_AND_FARE_RULES,
   "cache_control": {"type": "ephemeral"}},
]
messages=[{"role": "user", "content":
   f"<request_context>Now: {now_iso}. Agent ID: {agent_id}.</request_context>\n{user_msg}"}]
```

```text
            cache_creation_input_tokens  cache_read_input_tokens  input_tokens
request 1                        12,400                        0           340
request 2                             0                   12,400           325
request 3                             0                   12,400           331
```

With steady traffic the entry stays warm (each read refreshes the 5-minute TTL). The prefix now costs about 10,000 × 12,400 × $3 × 0.1 / 1M ≈ **$37/day**, plus occasional re-writes. Reordering the prompt is still a prompt change, so re-run the evals before shipping.

**Decision table**

| Usage / symptom | Diagnosis | Fix |
|---|---|---|
| High `cache_creation`, ~0 `cache_read`, steady traffic | Volatile content inside the prefix | Move volatile content after the breakpoint |
| Both fields 0 | Prefix below the model's minimum, or no breakpoint | Lengthen or consolidate the prefix; add `cache_control` |
| Misses only after quiet gaps > 5 min | TTL expiry | 1-hour TTL (higher write cost) |
| Burst of identical requests all write | Concurrent writes | Warm with one request, then send the burst |
| Hit rate drops when effort or tool set changes per request | Invalidation | Keep request-level settings stable; use deferred tools; per-message effort |
| Model re-generates the same program every call | Code emitted as output | Skill with a bundled script |
| Rare procedure bloats every prompt | Always-loaded content | Move into a Skill |

**Anti-pattern → fix**

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| 1-hour TTL to fix prefix-order misses | Nothing is expiring; writes cost more | Reorder: stable before volatile |
| Extra breakpoints after the volatile block | Each prefix still contains the changing content | Move the volatile content |
| Per-user tool subset, sorted alphabetically | The set still varies → tools change → all invalidated | Fixed full tool list, or deferred tools |
| Pasting the program into the cached system prompt | Still generated as output to run it | Skill with a bundled, executed script |
| Skill for content every request needs | It triggers and loads anyway | Cached system prompt |

**Exam traps**
- Overnight batch offered to fix a cache problem in an interactive app.
- Cheaper tier offered as the cost fix when the real problem is a 0% hit rate.

**Practice**

**Q2.5a.** A legal research tool sends the same 40,000-token case-law digest to the model. Every weekday at 09:00, 300 analysts' dashboards fire identical requests within two seconds. The usage report shows about 300 cache writes and almost no reads in that window, then a normal hit rate for the rest of the day. What's the most direct fix?

- A) Switch to a 1-hour TTL
- B) Send one warm-up request (for example with `max_tokens: 0`), wait for it to start responding, then release the 09:00 burst
- C) Add a second breakpoint halfway through the digest
- D) Move the digest into a Skill

**Answer: B.** An entry becomes readable only after the first response starts, so simultaneous identical requests all write. Warming first turns 299 writes into reads. A is the tempting answer, but nothing is expiring: the misses happen within two seconds. C still has 300 concurrent writers. D doesn't fit content every request needs.

**Q2.5b.** A data-quality agent validates uploaded CSVs. On every request, the model writes out the same ~250-line Python validation routine and then runs it through code execution, which adds about 3,500 output tokens per call. The team proposes putting the routine in the cached system prompt. What should the architect recommend instead?

- A) The cached system prompt, since cache reads are cheap
- B) Lower effort so the routine is written more tersely
- C) Package the routine as a Skill with a bundled script that is executed, so only its output enters context
- D) Use structured outputs so the routine always has the same shape

**Answer: C.** The cost is in *output* tokens: the model regenerates the code to run it. A cached prompt (A) makes the *input* copy cheap, but the model would still write the code out. A bundled script runs without its source entering context. On the API this needs the code execution tool and the `container` parameter. B and D don't remove the regeneration.

**Official docs:** [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) · [Cache diagnostics](https://platform.claude.com/docs/en/build-with-claude/cache-diagnostics) · [Mid-conversation system messages](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages) · [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) · [Skills API guide](https://platform.claude.com/docs/en/build-with-claude/skills-guide) · [Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)

---

## 2.6 Reasoning Effort and Context Lifecycle

**What the exam is testing.** For a long-running agent with stated latency and accuracy needs, can you (a) set reasoning effort sensibly and (b) choose how to manage context over the session: context editing, the memory tool, compaction, or a mix?

**Concept — effort.** `output_config.effort` (`low`, `medium`, `high`, `xhigh`, `max`) tells the model how much work to put in. It affects **all output tokens**: text, tool calls and arguments, and thinking. Lower effort means fewer, terser tool calls and less thinking, so lower cost and latency. It is a **behavioral signal, not a hard budget** (`max_tokens` is the hard cap). The default is `high` on most models but `medium` on some newer ones (Opus 5.5 and Haiku 5.5 at the time of writing). Guidance:

- Choose the **lowest effort that holds your eval accuracy**, and tune effort on the current model before adding a second model or cascade.
- Effort and thinking change **how much the model reasons, not what it knows**. Neither fixes missing context.
- **Changing request-level effort mid-conversation invalidates the cache.** Keep one setting, or use the per-message effort option (beta), which leaves the cached prefix intact.
- On newest models, **adaptive thinking** replaces fixed thinking budgets, and effort is the main depth control.

**Concept — context lifecycle.** A long session fills the window. Three tools, each for a different kind of content:

| Tool | What it does | Best for | Watch out |
|---|---|---|---|
| **Context editing** | Server-side clearing of the oldest tool results (and optionally thinking blocks), leaving a placeholder. Your app keeps the full history. | Bulky tool output that was used once and is now stale | Clearing invalidates the cache from that point. Use `clear_at_least` so each clear frees enough to be worth the re-write. |
| **Memory tool** | Claude reads and writes files in storage **your application provides**, outside the window. | Exact facts that must survive: IDs, figures, decisions, progress notes; cross-session continuity | You control storage, retention, and access, so treat it like any data store. |
| **Compaction** | Replaces earlier conversation with a model-written summary (on demand or at a token threshold) | Keeping a long dialogue going with its gist | **Lossy**, and repeated compactions re-summarize summaries, so exact early values can drift or disappear. Not carried into a new conversation unless your app saves it. |

They combine. The usual answer for a long, accurate agent: **context editing for stale bulky results + memory tool for exact must-keep facts + compaction for the rest**, plus effort tuning where evals hold.

**Simple worked example — a 6-hour migration agent.** Ironclad Systems runs an agent that migrates 400 database tables overnight. Requirements: per-step latency is not critical, but the final report must quote **exact** row counts and the three schema exceptions the operator approved in the first ten minutes. Observed after 4 hours:

```text
Turn 212 — context: 181K tokens
  - 140K: raw schema dumps / row-count query output from earlier tables
  - Compaction ran twice. Summary now says "a few exceptions were approved"
    (the three table names are gone).
  - Final report quoted row count 1,204,331 for table orders_2019;
    actual value was 1,240,331.
Effort: max on every turn (p50 turn time 41 s)
```

Diagnosis and plan:

```text
1. Context editing   → clear old schema dumps/query outputs
                       (keep last few results; clear_at_least sized to
                        make each clear worth the cache re-write)
2. Memory tool       → on approval, write /memories/exceptions.md with the
                       3 table names; after each table, append exact
                       row counts to /memories/progress.md
3. Compaction        → keep for dialogue gist; exact values now live
                       in memory, not in the summary
4. Effort            → evaluate high or medium for routine per-table
                       steps; keep a higher level for the final
                       reconciliation if evals show it helps
```

Why not "a better compaction prompt"? Summaries are lossy, and repeated ones lose more. Exact values need exact storage.

**Decision table**

| Symptom in a long session | Strategy |
|---|---|
| Window full of old, single-use tool output | Context editing (clear tool uses) |
| Exact early values lost or altered after compaction | Memory tool for those facts |
| Needs to resume tomorrow or in a new session | Memory tool (compaction doesn't carry over by itself) |
| Long dialogue, gist matters more than exact wording | Compaction |
| Cost/latency high, accuracy has headroom | Lower effort, validated by evals |
| Hard multi-step steps fail, latency allows | Higher effort on those steps only |

**Anti-pattern → fix**

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Better summary instructions to keep exact numbers | Summaries are lossy and repeat | Memory tool for exact facts |
| Bigger context window | Delays the problem; more context rot | Clear, persist, summarize |
| `max` effort on every turn | Pays for reasoning routine steps don't need | Lowest effort that holds evals |
| Raising effort to fix a missing fact | Reasoning doesn't create information | Supply the context |
| Toggling effort per request in a cached conversation | Breaks the cache | Stable setting or per-message effort |

**Exam traps**
- Compaction offered as the fix for lost exact values. It *caused* the loss.
- "Caching will keep the early context available." Caching doesn't free or preserve anything. It is a price mechanism.
- The memory tool described as Anthropic-hosted storage. Your app implements and controls it.
- Extended thinking described as a way to pause for human approval. Thinking happens inside one response. Approval needs a separate step (for example a tool call your app holds).

**Practice**

**Q2.6a.** A compliance-monitoring agent runs 8-hour sessions. Midway through, operators confirm a list of 12 exempt account IDs. By hour 7, after several compactions, the agent flags two exempt accounts. The context is otherwise healthy. Which change most directly fixes this?

- A) Add "Preserve all account IDs exactly" to the compaction instructions
- B) Disable compaction and move to a larger context window
- C) Raise effort to `max` for the rest of the session
- D) Have the agent write the confirmed exempt IDs to the memory tool when confirmed, and check that file before flagging

**Answer: D.** Exact facts that must survive a long session belong in durable storage outside the window, not in a lossy summary that gets re-summarized. A is the tempting fix, but every compaction pass is another chance to drop or change an ID. C adds reasoning but not the missing information. B trades the problem for context rot and an eventual overflow.

**Q2.6b.** A coding agent's p95 turn latency is 38 s against a 20 s target. Evals: effort `high` scores 91%, `medium` scores 90.5%, `low` scores 82%. The quality floor is 90%. Turn latency at `medium` is 17 s. The agent's prompt is cached, and the team proposes switching effort between `medium` and `high` on each turn based on a keyword heuristic. What should the architect recommend?

- A) Set request-level effort to `medium` for the session and keep it stable. It meets both the floor and the latency target, and a stable setting keeps the cache intact.
- B) Use the keyword heuristic to alternate effort each turn for the best of both
- C) Use `low` effort, since latency is the binding constraint
- D) Move to the most capable tier at `high` effort

**Answer: A.** `medium` clears the 90% floor and the 20 s target, and keeping one request-level value avoids cache invalidation. The trade-off is half a point of accuracy versus `high`. B is the tempting choice, but changing request-level effort mid-conversation invalidates cached message blocks, and the heuristic is untested. If per-turn variation is truly needed, the per-message effort option preserves the cache. C breaks the quality floor. D is the scale-up reflex and likely slower.

**Official docs:** [Effort](https://platform.claude.com/docs/en/build-with-claude/effort) · [Per-message effort](https://platform.claude.com/docs/en/build-with-claude/effort-per-message) · [Extended and adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/thinking) · [Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) · [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool) · [Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction)

---

## Key takeaways

1. **Tier = cheapest that clears every constraint.** Quality is a floor. Compare cost per *completed* task. Identical failures across tiers mean missing context.
2. **Diagnose prompts like a spec review.** Missing audience, order, missing-data rule, or scope causes inconsistency. Fix with plain, conditional wording plus the reason. Skip ALL-CAPS.
3. **Match the technique to the failure.** Rule → state it. Style → 3–5 diverse examples. Shape → structured outputs. Logic → thinking and effort. Deterministic math → code.
4. **Never reach for temperature.** Current API versions reject it. Consistency comes from prompts, examples, and output constraints.
5. **Structured outputs guarantee shape, not truth.** Handle `refusal` and `max_tokens` stop reasons.
6. **Caching changes price, not occupancy.** To free the window, send fewer tokens.
7. **Stable before volatile, in tools → system → messages order.** Writes cost more than uncached input, so a prefix that never repeats is worse than no cache.
8. **Warm before a burst; 1-hour TTL only for real gaps.** Effort, thinking, tool, and model changes invalidate the cache.
9. **Skills = sometimes-needed procedures and executable scripts.** Every-request content goes in the cached prompt.
10. **Long sessions: clear stale results, persist exact facts, summarize the rest.** Use the lowest effort that holds the eval.

## Confused pairs

| Pair | The difference |
|---|---|
| **Prompt caching vs Batch API** | Caching discounts *repeated input* and keeps real-time latency. Batch discounts *all tokens* by 50% but is asynchronous (up to 24 h). They can be combined, but cache hits in batches are best effort. |
| **Caching vs freeing context** | Caching lowers the price of tokens you still send. Freeing context (context editing, compaction, retrieval tuning, tool search) means sending fewer tokens. Only the second fixes a full window or context rot. |
| **Few-shot vs structured outputs** | Few-shot *guides* style and tone by example. Structured outputs *enforce* a JSON shape. Neither guarantees correct values. |
| **Prompted reasoning vs native thinking** | Prompted reasoning is visible text you ask for (`<thinking>`/`<answer>`) and can parse. Native adaptive thinking is a model feature tuned by effort, billed as output, and may not be displayed in full. |
| **Effort vs thinking** | Effort sets how much work goes into *all* output (text, tool calls, thinking). Thinking is the reasoning itself. On newest models, adaptive thinking plus effort replaces fixed thinking budgets. |
| **Compaction vs context editing vs memory tool** | Compaction *summarizes* old conversation (lossy). Context editing *removes* old tool results (placeholder left). The memory tool *persists* exact facts outside the window in storage you control. |
| **Skill vs cached system prompt** | A cached prompt is right for content every request needs. A Skill loads its body only when triggered, and its scripts run without their code entering context. |
| **1-hour TTL vs cache warming** | 1-hour TTL fixes expiry across long gaps. Warming fixes simultaneous first requests that all write. |
| **Automatic caching vs explicit breakpoints** | Automatic caching moves the breakpoint to the last cacheable block, which suits growing chats. Explicit breakpoints mark the end of stable content, which suits single-turn calls where the last block varies. |
| **Deferred tools vs removing tools** | Deferred tools are still sent and callable; they're just outside the cached prefix and loaded on discovery. That saves context, but it is not an access control. |

---

[← Domain 1](domain-1-solution-design.md) · [Domain 3 →](domain-3-integration.md)

<!-- support-footer -->
---

> Created by **Utkarsh Agarwal** — certified Claude Certified Architect (Foundations & Professional).
> Found this useful? [⭐ Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) · [💼 Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) · [☕ Buy me a coffee](https://utkarsh1agarwal.github.io/claude-architect-exam-guide/#support)
