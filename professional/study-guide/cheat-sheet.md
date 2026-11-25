# Cheat Sheet — CCAR-P v1.1 Final Skim

One page (well, a long one). Read it the night before, or in the last hour before your appointment.

## The five meta-rules

1. **Name the binding constraint before reading the options.** Latency SLA, budget ceiling, residency, irreversibility, unattended run, accuracy floor, a legitimate use that must keep working.
2. **Enforce, don't instruct.** Permissions, tool surface, hooks, credentials, and code checks beat system-prompt rules, `CLAUDE.md` text, and the model's self-reported confidence.
3. **Prevent beats detect** for irreversible harm. Logs, alerts, and audits are for reversible problems.
4. **Fix the failing stage.** Read the trace. Check retrieval before blaming the model; check the prompt before buying a bigger tier.
5. **Least autonomy, simplest design, honest trade-off.** The right option states what it gives up. "No trade-off" and "guarantees" are red flags.

## Distractor families — cross these out fast

| Family | Looks like |
|---|---|
| Right practice, wrong failure | 1-hour cache TTL when the prefix never matches; backoff for a non-transient error; idempotency keys when the failure happens before the side effect |
| Instruction instead of enforcement | "Add a rule to the system prompt", "mark it IMPORTANT in CLAUDE.md", "tell the agent to check first" |
| Detect instead of prevent | "Log every call and review weekly" for an action that can't be undone |
| Breaks a stated constraint | Batch API for a user who is waiting; a tier below the eval floor; human approval in an unattended overnight run |
| Control answers a different question | ZDR offered for *where* data is processed; a workspace offered for *how long* data is kept |
| Partial fix | Fixes one of the two findings; lowers frequency without removing the cause |
| Over-correction | Gate every step; defer every tool; lock down all customization |
| Scale-up reflex | Bigger model, more thinking, bigger window, more retries — when evidence points to retrieval, prompt, or config |
| Caching as false cure | Caching to free context space, fix accuracy, or act as memory |
| Model self-report as evidence | The agent's confirmation message, its own risk tag, its confidence score |

## D1 — Solution Design (18%)

| If you see… | Think… |
|---|---|
| Fixed, known sequence of steps | Prompt chain with code checks between steps |
| Distinct input categories that interfere when tuned together | Routing: classify, then dedicated prompt + tools per category |
| Subtasks unknown until the input is read | Orchestrator-workers |
| Independent subtasks known in advance | Parallelization (sectioning for speed, voting for confidence) |
| Clear criteria + feedback measurably improves output | Evaluator-optimizer, rounds capped in code |
| Open-ended path, next step depends on results | Agent — with turn limit and minimal tools |
| Reusable procedure + script across many requests | Skill |
| Who decides: Claude or a human? | Reversibility × stakes × accountability. Reversible + policy-covered → Claude. Irreversible or discretionary with a named owner → human, with Claude preparing the recommendation |
| Subagent "doesn't know" something | Subagents get only the brief you write — put objective, scope, constraints, output format in it |
| Coordinator trusts subagent output blindly | Structured status + error category; orchestration *code* checks the result subtype (e.g., `error_max_turns`) |
| Audit record of what an agent did | From the runtime (hooks, OpenTelemetry spans), not the agent's own report |
| Tenant/user ID in a tool parameter | Derive it server-side from the authenticated session; never let the model supply it |
| "Best value" decision | Eliminate options over the ceiling first, then maximize the named metric — compare **cost per completed task** |
| Must stay in your own cloud account / Bedrock | Self-hosted Agent SDK (Managed Agents isn't offered on Bedrock) |
| Long-running, stateful, no team to host | Claude Managed Agents (Anthropic hosts loop + session history) |
| Tools must run inside a private network | Managed Agents with a self-hosted sandbox — or a self-hosted runtime |
| ZDR obligation | Real-time Messages loop, or *fully* self-hosted Managed Agents. A self-hosted *sandbox* alone isn't ZDR — session history is still stored |
| Self-hosted Agent SDK loses state on scale-down | Mirror transcripts to durable storage (`SessionStore`) **and** put the working directory on durable storage |

## D2 — Models, Prompting, Context (13%)

| If you see… | Think… |
|---|---|
| `cache_creation_input_tokens` high, `cache_read_input_tokens` ≈ 0 | Something volatile (timestamp, user ID, per-request tool subset, changed effort) sits *before* the breakpoint. Stable first, volatile after |
| Cache prefix order | tools → system → messages, up to and including the block with the breakpoint |
| Burst of identical requests all write the cache | An entry is readable only once the first response starts — send one warm-up request first |
| "Cache it to free context space" | No — cached tokens still occupy the window. Send fewer tokens instead |
| Agent rewrites the same long script every request | Package it as a Skill script — executed, only its output enters context |
| Choosing a tier | Cheapest tier that clears **every** constraint (quality floor, latency, budget). Compare cost per completed task, incl. failure handling |
| Every tier fails the same cases | Missing context, not capability |
| Correct facts, inconsistent format/style | Few-shot: 3–5 diverse examples in `<example>` tags |
| One example → outputs copy its length/details | Use several varied examples |
| Parse failures but correct values | Structured outputs (`output_config.format`) — guarantees shape, not correctness |
| Clustered errors from an unstated business rule | State the rule **and its reason** |
| ALL-CAPS "MUST/ALWAYS" → over-triggering | Newer models follow literally — plain, conditional wording with the reason |
| Long agent session forgets exact early values | Compaction is lossy → pin exact facts with the memory tool; clear bulky single-use tool results with context editing |
| Cost/latency too high but accuracy fine | Try a lower effort level and validate on evals before re-architecting |
| Changing effort mid-conversation | Invalidates the cache |
| `temperature` as a fix | Not on the current API version — and never the answer |

## D3 — Integration (21%)

| If you see… | Think… |
|---|---|
| Agent has tools its role never needs | Remove > scope down > log. Removal prevents; logging only detects |
| General SQL tool | Narrow fixed-query tools on a read-only credential returning only needed fields |
| Shared service account for all users | Confused deputy → per-user delegated OAuth token; backend enforces the user's own permissions |
| Static API key in config/sandbox | Workload Identity Federation (short-lived tokens); never put keys where generated code can read them |
| Latency over SLA | Decompose: prefix processing (→ caching), generation (→ shorter output / fast mode / smaller tier if evals hold), sequential tool calls (→ parallel) |
| Streaming proposed for a latency SLA | Only improves time-to-first-token, not total time |
| Failure went undetected | Spans only exist for calls that happen — MCP server failed at startup, hung jobs, per-session outliers hidden in averages, uninstrumented custom tools |
| Small, stable corpus (< ~200K tokens) | Put it all in the prompt + cache it. No RAG |
| Large corpus with exact IDs/codes | Hybrid (embeddings + BM25) + Contextual Retrieval + reranking (~20 chunks) + low-score fallback to agentic search |
| Right answer exists but isn't retrieved | Retrieval failure — fix the retrieval stage, not the model |
| Many clients need the same tools | MCP server |
| One app, one simple call | Direct API/CLI |
| Other side owns its own decisions/state | Agent-to-agent handoff |
| MCP connector but no inbound internet allowed | Client tool executing inside the network (outbound API calls only) |
| Huge tool catalog, most unused per request | Tool search / `defer_loading`; keep the few always-used tools loaded |
| Four tools used on every request | Load them up front — discovery just adds a step |
| Tool search proposed as a security control | It isn't — deferred tools are still callable. Disable unneeded tools |
| 429 with `retry-after` | Backoff + jitter, honour `retry-after`, **one** retry layer, cap attempts, dead-letter |
| Retries at SDK + wrapper + queue | Retries multiply (3 × 3 × 3 = 27 calls) — keep one layer |
| Retry duplicated a payment/booking | Idempotency key on the side-effecting call; checkpoint and resume from the last completed step |
| Work nobody is waiting on | Message Batches: 50% cheaper, async (≤ 24 h), separate limits |

## D4 — Evaluation (17%)

| If you see… | Think… |
|---|---|
| Failure reached prod, evals all green | Which metric dimension was missing? accuracy · groundedness · latency · cost · safety · security (injection success rate) |
| Eval set ≠ production traffic | Mirror the deployed distribution; add negatives; score rare high-severity slices separately |
| Agent that changes state | Grade the **final environment state** with code, not the agent's confirmation message; reset environment per trial |
| Judge prefers longer answers | Verbosity → content-only rubric |
| Verdict flips when order is swapped | Position → score both orders / randomize |
| Judge inflates its own model family | Self-preference → judge from a different family, validated on human labels |
| Judge favours the one labelled "production"/"new" | Label deference → blind, neutral labels |
| Judge scores shift with nothing else changed | Drift → pin judge model + rubric versions; recalibrate |
| A 3-point win from one run | Outputs vary run to run → several trials per case, same cases, one variable changed |
| Run budget | cases × configs × trials ≤ budget. Spend on fixing systematic error before precision |
| Root-cause order | Was the needed passage retrieved? → Does the answer match what was retrieved? → Tool/subagent errors? → Capability mismatch (replay on a bigger tier) |
| Spend concentrated in output tokens | Shorter output format, validated on evals |
| Model deprecation | Works until retirement, then fails; pinning doesn't extend it. Wrong behaviour → fix prompt + rerun suite. Valid-but-different → fix brittle grader + re-baseline. Cut over **before** retirement |

## D5 — Governance (16%)

| If you see… | Think… |
|---|---|
| Untrusted content (email, web, doc, MCP response, tool result) | Keep it in `tool_result` blocks labelled by source; never in the system prompt; encode it as data |
| Injection risk + write tools | Deterministic hold on irreversible actions; split a reader (no write tools) from an actor that receives validated fixed fields |
| Screening classifier | Structured verdict; fail closed (a screener refusal counts as "flagged"); never the only layer |
| Third-party Skills / MCP servers | Supply chain: vet, pin versions, allowlist tools — Anthropic doesn't audit third-party MCP servers |
| Rank risks | Likelihood × severity × reversibility/reach **after existing controls**. Rare + irreversible + uncontrolled beats frequent + contained |
| Where to put a human gate | Immediately before the irreversible step; approve the **exact call arguments**, not the plan; trigger on a code-readable property, never model confidence |
| Gate stalls everything | Fail closed but park only the gated item; let reversible steps run |
| Obligation → control | Residency = *where* (`inference_geo`, regional endpoints) · ZDR = *how long* · redaction = *what the model sees* · isolation = *who can reach* · audit logs = *who did what* |
| ZDR + Batch / Files / Skills | Not ZDR-eligible → use real-time Messages |
| Disparate results across groups | Noise or bias? Small groups + rerun variance first. Then localise: data sampling vs prompt framing (few-shot examples) vs eval design — fix the source, re-audit the same sample |

## D6 — Stakeholder & Lifecycle (7%)

| If you see… | Think… |
|---|---|
| SLA promises minutes on Batch, a region on a global endpoint, a model pinned for years, "remembers everything" on a stateless API | Unsupportable — clarify the requirement or change the architecture (sync tier, regional endpoint, regression-gated upgrades, app-owned memory) |
| ADR says "the model will never…" / "Risks: none" | Revise: decision, options, measured rates, trade-off, residual risk, monitoring |
| Handoff package | Owners/on-call, runbooks incl. rollback, eval thresholds, cost alerts, dependency list (keys, quotas, MCP servers, credential owners), model deprecation plan |

## D7 — Dev Productivity (8%)

| If you see… | Think… |
|---|---|
| Proven workflow on one team → whole org | Plugin (skills, hooks, subagents, commands, MCP config) in a marketplace; safety-critical hooks delivered via **managed settings** |
| Must not be disabled by users | Managed settings (highest precedence; e.g., `enabledPlugins`, `allowManagedHooksOnly`) |
| Locked-down CI run | `claude -p` with a reviewed allowlist and `dontAsk` (unlisted → denied); never `bypassPermissions` outside an isolated container |
| Long interactive task with varied commands | `auto` mode (classifier reviews actions) |
| Agent SDK permission order | hooks → deny rules → ask rules → permission mode → allow rules → `canUseTool` |
| Ask rule vs `bypassPermissions` | An explicit ask rule still prompts in every mode; deny rules apply in every mode |
| Subagent should be read-only under a permissive parent | Restrict the subagent's `tools` list — its own mode is ignored under `bypassPermissions`/`acceptEdits`/`auto` |
| Rule must always run | Hook, not `CLAUDE.md` |
| AI-written PR merged with no human owner | Repo-enforced named human approval; record the directing engineer as author; dismiss stale approvals on new commits. AI review is advisory |

## Exam-day checklist

- [ ] Read the question's last line first; note "select TWO".
- [ ] Underline the binding constraint.
- [ ] Find the one deciding number/line in the evidence.
- [ ] Cross out prompt-only fixes for security/compliance/money.
- [ ] Cross out gates based on model confidence.
- [ ] Cross out "bigger model" when evidence points to retrieval, prompt, or config.
- [ ] ~1:40 per item; flag anything over 2 minutes.
- [ ] Photo ID matching registration; clear desk if online.

<!-- support-footer -->
---

> ⭐ **Found this useful?** [Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) so other candidates can find it · 💼 [Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) for updates and new mock exams.
