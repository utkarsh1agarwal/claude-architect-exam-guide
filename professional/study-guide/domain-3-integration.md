# Domain 3: Integration (21%)

Integration is the **largest domain on CCAR-P v1.1**: about 21% of the exam, or roughly **13 of the 60 scored items**. It covers the places where a Claude system touches everything else: tools, credentials, MCP servers, retrieval indexes, telemetry pipelines, and production traffic.

Most items give you an evidence block (a tool config, a latency trace, an error log, a retrieval eval) and ask for the change that fixes the stated problem **without breaking another stated constraint**. Four habits score most of the points:

1. **Enforce, don't instruct.** Tool surface, credentials and config beat system-prompt rules.
2. **Find the binding constraint.** Sum the trace, compute the headroom, find the failing stage, and fix that stage.
3. **Shrink what the model sees.** Fewer tools, less raw data, and only the context the task needs.
4. **Never cause a side effect twice.** Retries, fallbacks and resumes must be safe to repeat.

## At a glance

| # | Skill | What the exam asks | One-line rule |
|---|---|---|---|
| 3.1 | Least-privilege tool configuration | Which tool or connection to remove, scope down, or replace | **Remove > scope down > log.** Keep bulk data out of model context. |
| 3.2 | Authentication and authorization posture | Where credentials leak or privileges escalate, and the fix | Act **as the user**, keep secrets out of prompts and sandboxes, use short-lived identity. |
| 3.3 | Relieving the binding performance constraint | Which config change fixes accuracy or latency at least cost to the other | Decompose first (TTFT vs generation vs tools), then pick the lever for that part. |
| 3.4 | Instrumentation and monitoring gaps | Why a failure went unseen, and which signal would have caught it | You can't get a span for a call that never happened. Monitor absence, age and outliers. |
| 3.5 | Retrieval architecture selection | Full-context vs RAG vs agentic search; contextual retrieval and fallback config | Small corpus → full context + caching. Large → hybrid + contextual + rerank + fallback. |
| 3.6 | Connection mechanism selection | MCP vs direct API/CLI vs agent-to-agent handoff | Pick by consumer count, network reachability, trust boundary and state. |
| 3.7 | Progressive discovery vs monolithic loading | Tool search, Skills, scoped servers vs load-everything | Load on demand when the catalog is big and mostly unused; keep hot tools loaded. |
| 3.8 | Production reliability controls | Which control fixes 429s, retry storms or duplicate side effects | One retry layer, backoff + jitter + cap, idempotency keys, checkpoint/resume. |

---

## 3.1 Least-Privilege Tool Configuration

**What the exam is testing.** Can you look at an agent's or subagent's tool list and decide which connections to **remove**, which to **scope down**, and which to **replace with a context-efficient access pattern**? The official skill pairs "least privilege" (only the permissions the task needs) with "minimal footprint" (only the tools and data the model needs to see).

### Concept

Every tool is both a **capability** (anything it can do, a confused or injected agent can do) and a **context cost** (definitions are input tokens on every request, and large results can carry sensitive data into the model's view). So the ranking of fixes is:

1. **Remove** the tool if the task does not need it. A tool that is not there cannot be misused.
2. **Scope it down** if the task needs part of it: a narrow, fixed-query tool instead of a general one, a read-only credential instead of read-write, only the fields the task needs.
3. **Log or alert** only when you can't remove or scope. Logging detects misuse after it happens. It does not prevent it.

Scoping patterns the exam rewards:

- **Narrow fixed-query tools on a read-only credential.** Replace `run_sql(query)` with `get_invoice(invoice_id)` and `list_overdue_invoices(customer_id)`, which run parameterized queries on a **read-only database credential** and return only the needed columns. The credential is the enforcement, not the prompt.
- **Enable only the MCP tools you need.** With the API's MCP connector, set the toolset's `default_config` to `enabled: false` and enable named tools in `configs` (default off + allowlist).
- **Scope MCP servers per subagent.** In Claude Code, subagent frontmatter has an `mcpServers` field, and an inline definition there keeps the server out of the main conversation entirely. The main agent loses both the definitions' context cost and the ability to call the server's write tools.
- **Keep bulk or sensitive data out of model context.** To "archive all inactive accounts", the model needs to decide *what* to move, not read 40,000 records. Options: a **backend tool** that takes a filter, acts in code, and returns a count (`{"archived": 4127}`); **programmatic tool calling**, where Claude-written code in a code execution sandbox calls your tools and only what the script prints comes back; or **code execution** that keeps large intermediate results in the sandbox. The trade-off: you operate a sandbox, and programmatic tool calling and code execution are **not** zero-data-retention (ZDR) eligible (containers are kept up to 30 days). Under a ZDR constraint, use the backend tool.

### Simple worked example

A finance-ops subagent has this tool config (Messages API with the MCP connector):

```json
{
  "mcp_servers": [
    {
      "type": "url",
      "name": "ledger",
      "url": "https://mcp.ledger.example.com/mcp",
      "authorization_token": "<token for this user>"
    }
  ],
  "tools": [
    {
      "type": "mcp_toolset",
      "mcp_server_name": "ledger"
    },
    {
      "name": "run_sql",
      "description": "Run any SQL against the finance warehouse.",
      "input_schema": { "type": "object", "properties": { "query": { "type": "string" } }, "required": ["query"] }
    }
  ]
}
```

The task is "answer questions about overdue invoices". Problems:

- The `ledger` toolset has no config, so **all** of its tools are enabled by default (including `post_journal_entry` and `void_invoice`).
- `run_sql` is unbounded. The system prompt says "only run SELECT statements", but that is an instruction, not a control.

Fixed version:

```json
{
  "tools": [
    {
      "type": "mcp_toolset",
      "mcp_server_name": "ledger",
      "default_config": { "enabled": false },
      "configs": {
        "get_invoice": { "enabled": true },
        "list_overdue_invoices": { "enabled": true }
      }
    },
    {
      "name": "overdue_summary",
      "description": "Return count and total of overdue invoices for one customer. Read-only.",
      "input_schema": { "type": "object", "properties": { "customer_id": { "type": "string" } }, "required": ["customer_id"] }
    }
  ]
}
```

`overdue_summary` runs a fixed query on a read-only credential and returns two numbers. `run_sql` is gone.

### Decision table

| Situation | Best move |
|---|---|
| Tool not used by this agent's task | Remove it |
| Agent needs reads only, tool can write | Read-only credential + narrow fixed-query tools |
| MCP server exposes many tools, agent uses a few | `default_config.enabled: false` + allowlist the few |
| Only one subagent uses an MCP server | Define the server on that subagent, not the main session |
| Task moves or transforms many records | Backend tool that acts in code and returns a count |
| Task needs flexible multi-step processing over large data | Programmatic tool calling / code execution (not ZDR-eligible) |
| You truly can't narrow the tool | Then add approval gates or audit logging |

### Anti-pattern → fix

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| "Only run SELECT" in the system prompt on a read-write credential | Instruction, not enforcement | Read-only credential + fixed queries |
| Hook that blocks SQL containing `DELETE`, `DROP`, `UPDATE` | Denylists are incomplete (`TRUNCATE`, `MERGE`, stored procs) | Remove the general tool; use allowlisted narrow tools |
| Every MCP tool enabled "in case it's useful" | Larger attack surface and selection confusion | Default off + allowlist |
| Paging 40,000 records through the model | Context bloat; PII in the model's view | Backend tool returns a count |
| Human approval on every call in an unattended nightly run | Breaks the "unattended" constraint | Remove/scope the tool instead |

### Exam traps

- **Logging is not least privilege.** If an option says "log all calls to `void_invoice` and alert", ask whether the agent needs `void_invoice` at all. If not, removing it wins.
- **Subagents and context editing don't keep data out of model context.** A subagent is another model's context, and context editing clears results the model has already read.
- **Least-privilege credentials are the right practice for the wrong problem** when the problem is context bloat. Read both findings in the stem.

### Practice

**Q3.1-a.** Marlowe Logistics runs a nightly unattended agent that reconciles shipment exceptions. It uses Claude Code with a project-level MCP server `wms` (warehouse management) that exposes 46 tools, including `cancel_shipment` and `adjust_inventory`. Only the `exceptions-triage` subagent reads from `wms`, using 4 read tools. A review finds two issues: (1) the main session's context carries about 18,000 tokens of `wms` tool definitions on every turn; (2) last week the main agent called `adjust_inventory` while "tidying up" a record. **Select TWO** changes that most directly fix both findings.

A) Add a line to CLAUDE.md: "Never call `adjust_inventory` or `cancel_shipment`."
B) Remove `wms` from the project config and define it inline in the `exceptions-triage` subagent's `mcpServers`.
C) Within the subagent's `wms` connection, allow only the 4 read tools it uses and deny the rest.
D) Add a PostToolUse hook that logs every `wms` call to the audit table for weekly review.

**Answer: B and C.** B removes the server from the main session, which removes both the 18K tokens of definitions and the main agent's ability to call `adjust_inventory`. C applies least privilege inside the subagent so it can't write either. A is an instruction, not a control, and D detects a bad write after it has happened instead of preventing it. In an unattended run, prevention matters even more.

**Q3.1-b.** A support agent for Pellham Bank needs to answer "how many of this customer's cards were reissued last year?" Today it calls `search_card_events`, which returns up to 5,000 raw events with full card numbers. Responses are slow and the security team objects to card numbers entering the model's context. ZDR is a contractual requirement. What is the best change?

A) Add context editing so old card-event results are cleared after each turn.
B) Use programmatic tool calling so a script filters the events in a sandbox and returns only the count.
C) Add a backend tool `count_reissued_cards(customer_id, year)` that runs the query in your service and returns a number.
D) Move `search_card_events` to a subagent that summarizes the events for the main agent.

**Answer: C.** The model only needs the count, so the work belongs in code that returns a number. Card numbers never reach any model, and the setup stays ZDR-eligible. B also keeps data out of Claude's context, but code execution containers are not ZDR-eligible, which breaks the stated constraint. A clears results only after the model has read them, and D just moves the card numbers into a different model's context.

**Official docs**
- MCP connector (toolset allowlists): https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
- Programmatic tool calling: https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling
- Claude Code subagents (`mcpServers`): https://code.claude.com/docs/en/sub-agents
- Writing tools for agents: https://www.anthropic.com/engineering/writing-tools-for-agents
- Code execution with MCP: https://www.anthropic.com/engineering/code-execution-with-mcp

---

## 3.2 Authentication and Authorization Posture

**What the exam is testing.** Given an integration design, can you spot (a) **credential exposure**, where a secret can be read or used by something that shouldn't have it, and (b) **privilege escalation**, where a caller gets more access than they are entitled to, and name the specific fix for each?

### Concept

**Authentication (authn)** answers "who is calling?" **Authorization (authz)** answers "what may this caller do?" Keep three callers apart: the **end user**, the **agent/workload**, and the **model's tool calls**.

**1. The confused deputy.** If your agent calls the CRM with one shared service account that can read every account, any user can ask the agent for any account, and the CRM can't enforce the user's own rights. The fix is **per-user delegated authorization**: the user signs in through OAuth and the agent passes that user's token downstream (for example, the MCP connector's per-request `authorization_token`), so the backend enforces the user's real permissions.

**2. Never let the model supply identity.** A model-filled `tenant_id` or `user_id` can be changed by an injection or a confused model. Bind identity from the authenticated session, server-side. The model chooses *what* to look up, never *whose* data.

```python
# Wrong: identity comes from the model
def get_orders(tenant_id: str, status: str): ...

# Right: identity comes from the session; the model controls only the filter
def get_orders(status: str, *, session):
    return db.orders(tenant_id=session.tenant_id, status=status)
```

**3. Secrets never in the prompt, never in the sandbox environment.** Context can be echoed into output or logs, and a sandbox's environment can be read by code the model writes. If a Managed Agents sandbox holds a raw Claude API key, generated code can **call the API directly** and bypass the session's permission policies, approvals and budget, which govern only the session's own tool calls. Remove the key and expose the capability as a tool on your own service. Store MCP credentials for Managed Agents in a **vault** (Anthropic handles OAuth refresh), not in config or prompts.

**4. Replace static keys with short-lived identity.** **Workload Identity Federation (WIF)**, which is generally available, exchanges a token from the workload's own identity provider (AWS IAM, Google Cloud, Kubernetes, GitHub Actions or any OIDC provider) for a Claude API token that expires in minutes. The SDK refreshes it, and there is no stored key to leak. Also note that a **personal** API key acts as its creator and stops working when that person leaves.

**5. Native apps can't keep a secret.** A key shipped in an iOS or macOS app can be extracted. **App Attest** lets the device prove it is a genuine install (through Apple App Attest) and get a short-lived token: scoped to one workspace, valid for 1 hour, Messages API only, direct Claude API only, and carrying no end-user identity. The classic alternative is to proxy through your own backend.

### Simple worked example

Design under review for Quillfeather HR's internal assistant:

```text
User (SSO) ──► Assistant backend ──► Claude API      (key: sk-... in .env, personal key of dev lead)
                    │
                    └──► HR MCP server  (auth: shared svc account "hr-bot", role HR_ADMIN)
Tool: get_employee_record(employee_id)   # model fills employee_id
Sandbox env: ANTHROPIC_API_KEY=sk-...    # for "helper scripts"
```

| Finding | Risk type | Fix |
|---|---|---|
| Personal key in `.env` | Credential exposure; breaks when dev lead leaves | WIF from the platform identity; delete the key |
| Shared `HR_ADMIN` service account | Privilege escalation (confused deputy) | Per-user delegated OAuth token to the MCP server |
| Model fills `employee_id` with no check | Escalation: any user can read any record | Backend authorizes the requested ID against the user's token, or binds "self" from the session |
| API key in sandbox env | Exposure + control bypass | Remove; expose a tool on your service instead |

### Decision table

| Need | Mechanism |
|---|---|
| Server workload calling the Claude API without stored secrets | Workload Identity Federation |
| Native iOS/macOS app calling Claude directly | App Attest (or proxy through your backend) |
| Agent acting on a user's data in another system | Per-user delegated OAuth token |
| Multi-tenant data access | Tenant bound server-side from the session |
| Managed Agents needs MCP credentials | Vault credential, not config or prompt |
| Sandbox code needs a privileged action | A tool on your service that holds the secret |

### Anti-pattern → fix

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| "Only show the user their own records" in the system prompt | Instruction; injection can override | Backend authorizes with the user's identity |
| Static key in a secrets manager, rotated every 90 days | Better, but still a long-lived bearer secret | WIF short-lived tokens |
| Separate low-limit workspace for the sandbox key | Caps cost only; the bypass remains | Remove the key from the sandbox |
| Shared service account plus an audit log | Detects misuse; doesn't stop it | Delegated per-user auth |

### Exam traps

- **Rotation is not removal.** If an option rotates a static key and another removes the need for one (WIF), the second wins unless the stem rules it out.
- **"Separate workspace" answers a cost question,** not an authorization one.
- **App Attest tokens carry no user identity.** They prove "real app", not "real user". If per-user authorization matters, you still need user auth.

### Practice

**Q3.2-a.** Tarnwick Legal deploys a matter-search agent. All users' requests reach the document system through one MCP server that authenticates with a service account able to read every matter. A junior associate asked the agent about a sealed matter and got a summary. Matter-level permissions already exist in the document system. Which change most directly fixes this?

A) Add to the system prompt: "Refuse questions about matters the user isn't staffed on."
B) Have users sign in with OAuth and pass each user's delegated token to the MCP server, so the document system enforces their own matter permissions.
C) Log every document the agent reads and have a partner review the log weekly.
D) Add an output classifier that blocks responses mentioning sealed matters.

**Answer: B.** This is a confused deputy: the backend sees only the all-powerful service account, so its existing permissions can't apply. Passing the user's delegated token lets the real access control do its job. A is an instruction, C detects the leak after it happens, and D is a partial filter that will miss leaks that don't use the word "sealed".

**Q3.2-b.** A team gives a Managed Agents session a cloud sandbox and puts an `ANTHROPIC_API_KEY` environment variable in it so "helper scripts can call Claude for summarization". The session has permission policies and a budget. What is the main risk, and the fix?

A) The key may appear in logs; mask environment variables in log output.
B) Costs may spike; move the key to a separate workspace with a low spend limit.
C) The key may expire mid-session and break the helper scripts; switch to a key with no expiration date.
D) Sandbox code can call the API directly, bypassing session policies and budget; remove the key and expose summarization as a tool.

**Answer: D.** Session controls apply to the session's tool calls, not to arbitrary HTTP calls made by code that holds a real key. Removing the key closes the bypass, and a tool on your service keeps the capability under your controls. B is tempting because it limits the damage, but it only caps cost. The policy and approval bypass is still there.

**Official docs**
- Workload Identity Federation: https://platform.claude.com/docs/en/manage-claude/workload-identity-federation
- API authentication and key types: https://platform.claude.com/docs/en/manage-claude/authentication
- App Attest: https://platform.claude.com/docs/en/manage-claude/app-attest
- Managed Agents vaults: https://platform.claude.com/docs/en/managed-agents/vaults
- MCP authorization spec: https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization

---

## 3.3 Relieving the Binding Performance Constraint

**What the exam is testing.** A system misses an accuracy target or a latency target. You get candidate changes: retrieval depth, model tier, caching, call pattern, fast mode, streaming. You must pick the one that fixes the **binding constraint** (the one actually being violated) at the **least cost** to the other.

### Concept

First, **decompose**. End-to-end latency for one request is roughly:

```text
total = tool/retrieval time + time to first token (TTFT) + generation time
TTFT ≈ queueing + processing the input prefix
generation time ≈ output tokens ÷ output tokens per second
```

Then match the lever to the part that dominates:

| Lever | What it reduces | What it does *not* reduce |
|---|---|---|
| **Prompt caching** | TTFT on long, repeated prefixes; input cost | Generation time; window occupancy |
| **Streaming** | *Perceived* latency (first words appear sooner) | Total time to the full answer |
| **Fast mode** (`speed: "fast"`) | Generation time: up to ~2.5× faster output tokens per second on supported models, same model and intelligence | TTFT. It costs a premium per token and has its own rate limits. |
| **Smaller/faster tier** | Both TTFT and generation | May fail the accuracy floor |
| **Lower effort** | Output and thinking tokens | Can reduce quality on hard tasks |
| **Parallel tool calls** | Sum of independent tool round trips → the max of them | Dependent or ordered steps |
| **Fewer retrieved chunks** | Input tokens and TTFT | Can drop recall |

For **accuracy** constraints, the levers run the other way: deeper retrieval (top-k), a reranker, a more capable tier, or higher effort. Try the cheap fix first. If the gold passage ranks 24th and you pass 20, raising k beats a bigger model. If the latency budget has room, **spend it on accuracy**.

### Simple worked example

A claims-summary endpoint has a p95 SLA of **6.0 s**. It is measured at **8.6 s**. The accuracy floor is met only by the current balanced-tier model (the smallest tier scored 9 points lower on the eval). One p95 trace:

```text
span                                   start    duration
get_policy(policy_id)                  0.0 s    0.9 s
get_claim_history(policy_id)           0.9 s    1.1 s     # independent of get_policy
get_adjuster_notes(claim_id)           2.0 s    0.8 s     # independent of both
model: TTFT (32K-token stable prefix)  2.8 s    1.4 s
model: generation (700 output tokens)  4.2 s    4.4 s
total                                           8.6 s
```

Decompose: tools 2.8 s (sequential), TTFT 1.4 s, generation 4.4 s.

- **Parallel tool calls:** the three lookups are independent, so they take max(0.9, 1.1, 0.8) = 1.1 s. That saves **1.7 s** → 6.9 s. Still over.
- **Caching** the 32K stable prefix might take TTFT from 1.4 s to around 0.5 s (illustrative) → about 6.0 s. Borderline.
- **Fast mode** at up to 2.5× output speed: 4.4 s → about 1.8 s, saving up to 2.6 s. It costs a premium per token.
- **Streaming:** the downstream system parses the full JSON, so it saves nothing.
- **Smaller tier:** fails the accuracy floor.

Parallel calls plus caching is the cheapest combination, but it only just reaches 6.0 s. If the stem asks for the **single** change that targets the largest component without breaking accuracy, the answer is fast mode, because generation is 4.4 of 8.6 s and the tier is locked.

### Decision table

| Binding constraint + evidence | Best lever |
|---|---|
| Latency; generation dominates; tier locked by accuracy | Fast mode (same model, premium price) |
| Latency; long repeated prefix dominates TTFT | Prompt caching |
| Latency; sequential independent tool calls | Parallel tool calls |
| Latency is *perceived* (chat UI); user reads as text arrives | Streaming |
| Accuracy; gold passage just outside top-k | Raise k / add a reranker |
| Accuracy; retrieval is correct, reasoning fails | More capable tier or higher effort |
| Neither binding (overnight job) | Capable model + Batch API |

### Anti-pattern → fix

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Streaming to fix an SLA on a machine-consumed JSON response | Only changes perceived latency | Fast mode, parallelization or caching |
| Caching to fix slow generation | Caching only speeds up prefix processing | Fast mode or fewer output tokens |
| Bigger model when the gold passage was never retrieved | Model can't use what it never saw | Fix retrieval depth or ranking |
| Smaller tier to hit latency, below the eval floor | Breaks the accuracy constraint | Same model + fast mode |

### Exam traps

- **Sum the trace.** Many items include numbers so that only one lever can close the gap. Do the arithmetic.
- **Fast mode isn't a different model.** "Switch to fast mode" keeps intelligence the same. "Switch to a faster tier" may not.
- **The right option states its cost** ("at a premium per token", "adds ~300 ms"). Even fast mode has a hidden one: switching speed invalidates the prompt cache.

### Practice

**Q3.3-a.** Brindle Insurance's underwriting assistant meets its 4-second latency budget with 1.6 s to spare (p95 2.4 s). The accuracy eval shows 12% of wrong answers come from cases where the correct clause ranked between 11th and 25th, while the pipeline passes the top 10 chunks. A reranker adds about 250 ms. What should the architect do?

A) Retrieve 50 candidates, rerank them, and pass the top 25, using part of the latency headroom.
B) Move to the most capable tier to reason better over the 10 chunks.
C) Enable prompt caching on the retrieved chunks to reduce latency further.
D) Add streaming so users see answers sooner while accuracy is investigated.

**Answer: A.** Accuracy is the binding constraint, and the evidence points at retrieval depth: the right clause exists but falls just outside the top 10. Reranking and passing more chunks uses headroom the system already has. B is the scale-up reflex: a better model can't use a clause it never sees. C and D improve latency, which isn't the problem.

**Q3.3-b.** A code-review bot posts one complete review comment per pull request. Its p95 is 41 s against a 25 s target. The trace shows TTFT of 3 s and generation of 36 s for about 3,000 output tokens. Smaller tiers fail the review-quality eval. Which change best meets the target?

A) Enable streaming so the review starts appearing after 3 s.
B) Cache the repository's style guide in the system prompt.
C) Enable fast mode on the current model, accepting a higher per-token price.
D) Run two reviews in parallel and post whichever finishes first.

**Answer: C.** Generation is 36 of 41 seconds, and the model tier is locked by quality, so speeding up output generation on the same model is the lever. At up to 2.5× output speed, 36 s drops to roughly 15 s. A doesn't help because the bot posts one complete comment, so streaming changes nothing the user sees. B reduces TTFT, which is only 3 s, and D doubles cost without changing generation speed.

**Official docs**
- Fast mode: https://platform.claude.com/docs/en/build-with-claude/fast-mode
- Prompt caching: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Parallel tool use: https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use
- Effort: https://platform.claude.com/docs/en/build-with-claude/effort
- Choosing a model: https://platform.claude.com/docs/en/about-claude/models/choosing-a-model

---

## 3.4 Instrumentation and Monitoring Gaps

**What the exam is testing.** A scaled agentic system failed and **nobody noticed**. You must work out *why the existing monitoring couldn't see it*, and pick the signal that would have surfaced it.

### Concept

**Monitoring sees only the events that happen.** Most gaps are one of five patterns:

1. **The missing call.** A span exists only for a call that happened. If an MCP server fails to connect at startup, the Agent SDK session **continues without that server's tools**. The `system`/`init` message reports each server's status (`connected`, `failed`, `needs-auth`, `pending`, `disabled`), but nothing errors. **Fix:** check per-server status at run start and alert on `failed` or `needs-auth` (`pending` is not a failure), plus per-tool call-volume floors.
2. **The hung item.** Work that never finishes never emits a completion event, so error rate and p99 duration look perfect. **Fix:** emit **start events**, track `started − finished`, alert on the **age of the oldest open item**, and add tool timeouts.
3. **The outlier in an average.** One session in 500 loops for 300 tool calls, and the average barely moves. **Fix:** per-session tool-call, token and cost metrics with p99/max alerts, plus hard caps (`maxTurns` / `--max-turns`, budget caps).
4. **The wrong layer.** API-side tracing covers model requests and **API-run** tools (server tools, MCP connector tools), **not custom tools your app runs**. If your wrapper turns a database timeout into `[]`, the model faithfully says "out of stock" and every model span is green. **Fix:** instrument the tool code (per-dependency error and empty-result rates) and return explicit errors (`is_error: true`).
5. **The blended dashboard.** 97% global success can hide one tenant or prompt version at 60%. **Fix:** per-segment dashboards and alerts.

Also: the **Usage and Cost Analytics API** aggregates by workspace, key, model and time, which is too coarse to find one runaway session. **Refusals** (`stop_reason: "refusal"`) arrive as HTTP 200, so monitor them as their own signal.

### Simple worked example

Cobalt Travel's rebooking agent. Incident: for 9 hours, the agent told customers "no alternative flights available". Dashboards stayed green.

```text
09:00:02  session s-81 init  mcp_servers=[{name:"fares", status:"failed"},
                                         {name:"crm",   status:"connected"}]
09:00:05  span model.request  200  1.9s
09:00:07  span tool crm.get_booking  200  0.3s
09:00:09  span model.request  200  2.2s   -> "No alternative flights are available."
...
dashboard: error rate 0.2%, p99 latency 6.1s, CSAT judge score 4.6/5
```

Why it was invisible: `fares` failed at startup, so `fares.search` was **never called**. With no span, there was no error. The model's answer was fluent and consistent with what it had, so the judge scored it well.

Signals that would have caught it:

- An alert on any `status: "failed"` in the init message (direct).
- A per-tool call-volume floor: "`fares.search` calls per hour dropped to 0" (an absence alert).
- A business metric segmented by outcome: "% of rebookings ending in 'no alternatives'" jumped from 4% to 100%.

### Decision table

| Failure that went unseen | Signal that surfaces it |
|---|---|
| Tool/server never available | Startup connection status; per-tool call-volume floor |
| Work hangs without finishing | Start events; oldest-open-item age; in-flight count; timeouts |
| Rare runaway sessions | Per-session tool-call/token/cost p99 + hard caps |
| Failure inside app-run custom tool | Your own spans/metrics in the tool code; explicit error returns |
| One tenant/segment degraded | Per-segment dashboards |
| Answers faithful to bad data | Data-quality checks at the tool (empty-result rate), not output judges |
| Refusals counted as success | Monitor `stop_reason: "refusal"` separately |

### Anti-pattern → fix

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Alerting on error rate for a tool that never ran | No calls → no errors | Alert on missing calls / failed status |
| p99 duration for hung jobs | Hung jobs never complete, so they're never measured | Oldest-open-item age |
| Monitoring only averages | Outliers vanish | Per-session distribution + caps |
| Relying on API tracing for client tools | They're run by your app, outside API spans | Instrument tool code |
| LLM judge to catch bad tool data | The answer *is* faithful to its (bad) input | Validate tool results at the source |

### Exam traps

- "**Add more tracing**" is tempting but often wrong. More spans on calls that happen don't reveal calls that don't.
- "**Lower the error-rate threshold**" assumes errors exist.
- **Detect vs prevent:** monitoring is right here because the question asks what would have *surfaced* the failure. If the stem asks how to stop an irreversible action, a monitor is the wrong family.

### Practice

**Q3.4-a.** Harbor Freight Analytics runs 2,000 document-processing agents a day. A finance review finds that about 0.5% of sessions each made 250+ tool calls in a retry loop, and these account for 30% of monthly spend. Dashboards show average tool calls per session (14, steady) and workspace cost per day. **Select TWO** changes that would have surfaced the problem early and limited the damage.

A) Alert on the p99 and max of per-session tool-call count and cost.
B) Set the daily workspace cost alert threshold 10% lower.
C) Enforce a per-session turn cap and budget cap so runaway sessions stop.
D) Add an LLM judge to score the quality of each final summary.

**Answer: A and C.** The loops hide inside an average, so A watches the distribution tail per session, and C bounds each runaway session. B still watches an aggregate: 0.5% of sessions growing slowly may never cross a daily threshold, and it says nothing about which sessions are at fault. D measures output quality, but these sessions may still produce acceptable summaries.

**Q3.4-b.** An agent's custom `lookup_price` tool, run by the application, began returning empty lists when its upstream database timed out. For two days the agent told customers items were "not currently priced". OpenTelemetry API tracing was on, and all model request spans showed success. What monitoring would have caught this?

A) Alert on model-request error rate in the API trace.
B) Use the Usage and Cost Analytics API to spot token anomalies.
C) Run an LLM judge to check that answers are consistent with tool results.
D) Instrument `lookup_price` with error and empty-result-rate metrics, and return an explicit error on timeout.

**Answer: D.** The failure was inside an application-run custom tool, which API-side tracing doesn't cover, and model calls really were succeeding. C fails because the answers were consistent with the tool's (empty) results. B sees aggregate usage, which barely changes when a tool returns `[]`.

**Official docs**
- OpenTelemetry tracing: https://platform.claude.com/docs/en/manage-claude/opentelemetry
- Agent SDK observability: https://code.claude.com/docs/en/agent-sdk/observability
- Agent SDK MCP (server status): https://code.claude.com/docs/en/agent-sdk/mcp
- Usage and Cost Analytics API: https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api
- Claude Code monitoring: https://code.claude.com/docs/en/monitoring-usage

---

## 3.5 Retrieval Architecture Selection

**What the exam is testing.** Choose among **full-corpus context**, a **pre-built RAG pipeline**, and **agentic search with tools**, based on corpus size, query pattern, and latency and cost limits. When you choose indexing, specify the **contextual retrieval** and **fallback** configuration that maximizes quality within those limits.

### Concept

Think of it as a ladder. Climb only as far as the corpus forces you.

**Rung 1: Full context + caching.** For a knowledge base under about **200,000 tokens (about 500 pages)**, Anthropic's guidance is to put the whole thing in the prompt and cache it. There are no chunking errors, and the model can connect a rule with an exception 300 pages later. Caching does **not** make a large corpus fit: cached tokens still count toward the context window.

**Rung 2: RAG, done well.** For larger corpora:

- **Hybrid search.** Combine **embeddings** (semantic similarity) with **BM25** (exact lexical matching). BM25 catches exact identifiers like error codes, SKUs and clause numbers that embeddings blur.
- **Contextual Retrieval.** Before indexing, prepend 50–100 tokens of chunk-specific context to each chunk ("This chunk is from Acme's 2025 Q3 10-K, section on revenue recognition…"). Then embed it and build the BM25 index on the contextualized text. In Anthropic's published results, the failed-retrieval rate in the top 20 fell **35%** with contextual embeddings, **49%** with contextual embeddings plus contextual BM25, and **67%** with reranking added on top.
- **Reranking.** Retrieve a wide candidate set (for example, the top 150), rerank it, and pass the top ~**20**. In those experiments, top-20 beat top-10 and top-5. Reranking adds some latency.
- **Metadata and version filters.** Filter by product, region, effective date or document version **before** similarity ranking, so the "most similar" chunk can't come from a superseded policy.
- **Same embedding model at query and index time.** If you change embedding models, **reindex everything**. Vectors from different models live in different spaces and can't be compared.

**Rung 3: Fallback to agentic search.** Agentic search (Claude iteratively using grep, file reads or search APIs) handles multi-hop questions well but is slower and costlier per query. The usual best pattern is **RAG by default with a score-threshold fallback**: if the top reranker score is below a calibrated threshold, route *that query* to the agentic path.

**Fix the failing stage first.** Check whether the right passage was retrieved before changing the model or the prompt.

### Simple worked example

A retrieval eval for Nimbus Devices' support KB (about 28,000 pages, far over 200K tokens). There are 400 labeled questions. Recall@k means "share of questions whose gold passage is in the top k". All numbers are illustrative.

| Config | Recall@5 | Recall@20 | Added p95 latency |
|---|---|---|---|
| Embeddings only | 0.71 | 0.82 | baseline |
| Hybrid (embeddings + BM25) | 0.77 | 0.88 | +20 ms |
| Hybrid + contextual chunks | 0.83 | 0.92 | +20 ms (indexing cost is one-time) |
| Hybrid + contextual + rerank (150 → 20) | 0.90 | 0.95 | +260 ms |

Reading it:

- Error codes like `E-4471` were missed by embeddings alone. BM25 fixed most of those.
- Passing top-20 instead of top-5 adds about 15 recall points in every row. If the budget has room, pass 20.
- The latency budget for retrieval is 500 ms, so the full stack fits.
- Of the 5% still missed, most had a top reranker score below 0.3. Route those queries (about 7% of traffic) to agentic search.

### Decision table

| Corpus / query pattern | Architecture |
|---|---|
| < ~200K tokens, stable, cross-referenced rules | Full context + prompt caching |
| Large corpus, many exact identifiers | Hybrid BM25 + embeddings |
| Chunks lose meaning out of context ("the company", "this section") | Contextual Retrieval |
| Right passage ranked just outside k | Rerank + pass ~20 |
| Multiple versions/regions of the same doc | Metadata/version filter before ranking |
| Rare multi-hop or low-confidence queries | Score-threshold fallback to agentic search |
| Codebase / filesystem, fresh data, exploratory | Agentic search with tools |
| Embedding model upgrade | Reindex the whole corpus with the new model |

### Anti-pattern → fix

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| RAG over a 300-page policy manual | Splits rules from their exceptions | Full context + caching |
| Whole 28,000-page KB in context "with caching" | Doesn't fit; cached tokens still occupy the window | Hybrid RAG |
| Bigger chunks + "ignore irrelevant text" | Dilutes relevance; partial fix | Contextual chunks + rerank |
| Agentic search for every query | Latency and cost for queries RAG handles | RAG default + threshold fallback |
| Mixed old/new embeddings after a model upgrade | Vectors not comparable | Full reindex |

### Exam traps

- "**Top-3 for precision**" is often wrong. Measured recall usually favors passing more reranked chunks.
- "**Verify and regenerate**" loops can't recover a passage that was never retrieved.
- Contextual Retrieval adds a **one-time indexing cost** (a model call per chunk, made cheaper with caching). That's the honest trade-off.

### Practice

**Q3.5-a.** Orchard Health's prior-authorization assistant answers from a 260-page coverage policy (about 150,000 tokens). It is updated quarterly. The current RAG pipeline sometimes applies a coverage rule but misses its exception, which sits 90 pages later. Queries arrive all day. Which architecture fits best?

A) Increase chunk size to 4,000 tokens so rules and exceptions land in the same chunk.
B) Switch to agentic search so Claude can grep for exceptions.
C) Add a reranker and pass the top 30 chunks.
D) Put the full policy in the prompt and cache it as a stable prefix, refreshing the cache when the policy changes.

**Answer: D.** At about 150K tokens the policy fits comfortably in context, so the model sees each rule together with its distant exception. Caching keeps the repeated prefix cheap and fast for all-day traffic. A only helps when the exception happens to fall in the same chunk, and 90 pages apart it won't. B and C add complexity and latency for a corpus that doesn't need retrieval at all.

**Q3.5-b.** Ferrous Parts indexes 2 million product-manual chunks with embeddings only. Questions mentioning part numbers (for example `FP-22817-B`) fail often. The same pipeline also returns superseded torque specs from old manual revisions. **Select TWO** changes that most directly address these findings.

A) Add BM25 lexical search alongside embeddings and merge the results (hybrid search).
B) Filter candidates by the product's current manual revision before similarity ranking.
C) Upgrade to the most capable model tier for answer generation.
D) Ask the model in the system prompt to prefer the newest revision it sees.

**Answer: A and B.** Exact identifiers are what lexical search is good at and embeddings are bad at, so A fixes the part-number misses. B prevents superseded revisions from being candidates at all. D is an instruction that depends on the model noticing revision metadata, and it may never see the current chunk. C is the scale-up reflex aimed at the wrong stage.

**Official docs**
- Introducing Contextual Retrieval: https://www.anthropic.com/news/contextual-retrieval
- Prompt caching: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Search results / citations: https://platform.claude.com/docs/en/build-with-claude/citations
- Effective context engineering for AI agents: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

---

## 3.6 Connection Mechanism Selection

**What the exam is testing.** Evaluate **MCP**, a **direct API or CLI call**, and an **agent-to-agent handoff** against the scenario's constraints on **latency, security and statefulness**, and select the mechanism the constraints favor.

### Concept

| Mechanism | What it is | Best when | Costs |
|---|---|---|---|
| **Direct API / CLI** | Your code (or a tool you define) calls the system directly, or the agent runs an existing CLI | One consumer, a deterministic call, lowest latency, tight control | Not reusable across agents/hosts without re-implementation |
| **MCP** | A standard protocol: an MCP server exposes tools; any MCP client (Claude Code, Agent SDK, the API's MCP connector) can use them | The same system is reused by many agents, apps or teams (many-to-many) | Another service to run, secure and version. Anthropic doesn't security-audit third-party MCP servers. |
| **Agent-to-agent handoff** | Your agent delegates a *task* to another autonomous agent, often owned by another team or company | The other side owns its own reasoning, data and policies (a trust boundary); long-running stateful work | Highest latency; the other side's reasoning is opaque; harder to trace |

**MCP connector vs client tool.** With the API's **MCP connector** (beta), Anthropic's API is the MCP client. The server must be **publicly reachable over HTTP** (Streamable HTTP or SSE; no stdio), only MCP **tool calls** are supported, you pass `mcp_servers` plus an `mcp_toolset` entry in `tools`, and it is not ZDR-eligible. If policy forbids inbound internet access, use a **client tool**: Claude returns `tool_use`, your app executes it **inside the network**, and only outbound calls to the Claude API are needed (or run your own MCP client in the network). The trade-off is that you maintain the execution code.

**Subagent vs agent-to-agent.** A subagent is part of *your* system and trust domain, used for context isolation or parallelism. Agent-to-agent hands a task to someone else's agent. Don't use it inside one team's system just for modularity.

**One agent vs a chain.** Tightly dependent sequential steps belong in **one agent context**. Handoff notes are lossy, and each agent starts fresh.

**Statefulness and CLIs.** A stateless lookup suits a direct call or MCP tool. A stateful, hours-long workflow owned by the other side suits a handoff. In Claude Code, a well-known CLI (such as `gh`) is often more context-efficient than a large MCP server.

### Simple worked example

Three integrations for Larchmont Energy:

1. **Meter-reading lookup** used only by one billing agent, called on every request, latency-sensitive. → **Direct tool** calling the internal REST API.
2. **Asset registry** that five agent apps and Claude Code users across three teams all need. → **MCP server**, versioned and owned by the platform team. It sits inside the corporate network, so the in-network apps use their own MCP clients (Claude Code, Agent SDK). The public MCP connector is not an option.
3. **Grid operator's dispatch agent** (a separate company) that accepts curtailment requests and works them over hours. → **Agent-to-agent handoff** with an explicit task contract. You can't (and shouldn't) see their internal tools.

`.mcp.json` for the Claude Code users (project scope):

```json
{
  "mcpServers": {
    "asset-registry": {
      "type": "http",
      "url": "https://assets.internal.larchmont.example/mcp"
    }
  }
}
```

### Decision table

| Constraint in the stem | Favors |
|---|---|
| Single consumer, deterministic, lowest latency | Direct API / tool |
| Many agents and apps need the same system | MCP server |
| System must not accept inbound internet traffic | Client tool / in-network MCP client (not the MCP connector) |
| Server-side execution, public HTTPS server, tools only | MCP connector |
| Other party owns reasoning, data or policy (trust boundary) | Agent-to-agent handoff |
| Tightly coupled sequential steps | One agent, not a chain |
| Context isolation inside your own system | Subagent |

### Anti-pattern → fix

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| MCP connector to a server inside a no-inbound network | The connector needs a public HTTP endpoint | Client tool executed inside the network |
| "Add OAuth to the connector" to satisfy no-inbound | Auth doesn't change reachability | Client tool |
| Agent-to-agent between two of your own modules | Latency and opacity with no trust boundary | Subagent or direct call |
| Chain of 4 agents passing notes for one tightly coupled task | Lossy handoffs | One agent |

### Exam traps

- **"MCP is the standard, so always MCP"** is wrong when there is one consumer and latency matters.
- **MCP connector vs Claude Code `.mcp.json`:** the connector runs on Anthropic's side. Claude Code and the Agent SDK connect from wherever they run, including stdio servers on the local machine.
- **The connector supports tools only.** If the scenario needs MCP resources or prompts through the API, the connector alone isn't enough.

### Practice

**Q3.6-a.** Vantor Bank must let a Claude-based assistant query a core-banking ledger service. Security policy forbids any inbound connection from the internet to the ledger network. Outbound HTTPS to approved SaaS APIs is allowed. Which design fits, and what does it give up?

A) Expose the ledger through an MCP server and use the API's MCP connector with per-user OAuth tokens; gives up nothing.
B) Use the MCP connector through a reverse proxy placed in the DMZ in front of the ledger; adds one extra network hop.
C) Hand ledger questions to a separate agent hosted in the vendor's cloud; gives up some latency.
D) Define a client tool that the app runs inside the network, calling the Claude API outbound only; the team maintains the tool code.

**Answer: D.** Client tools run where your app runs, so only outbound traffic is needed, and the option honestly states the cost. A and B both need the MCP server to be reachable from Anthropic's side, which means inbound traffic. OAuth and proxies don't change that, and "gives up nothing" is a red flag. C moves banking data and reasoning outside the bank's boundary for no reason.

**Q3.6-b.** A procurement team wants their agent to place orders with a supplier. The supplier runs its own ordering agent that checks stock, negotiates partial fills over several hours, and applies its own credit policy. Which mechanism fits best?

A) An MCP server the procurement team builds against the supplier's database.
B) A subagent in the procurement agent that reproduces the supplier's credit policy.
C) An agent-to-agent handoff with a defined task request and result contract.
D) Direct API calls from the procurement agent to the supplier's internal stock tables.

**Answer: C.** The supplier owns the reasoning, state and policy, and the work is long-running and stateful across a trust boundary. That is the case agent-to-agent handoff exists for. A and D need access to the supplier's internal systems that they won't (and shouldn't) grant. B duplicates a policy you don't own and will drift from it.

**Official docs**
- MCP connector: https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
- Tool use overview (client tools): https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- Claude Code MCP: https://code.claude.com/docs/en/mcp
- MCP specification: https://modelcontextprotocol.io/specification/2025-11-25
- Claude Code security (MCP servers not audited): https://code.claude.com/docs/en/security

---

## 3.7 Progressive Discovery vs. Monolithic Context Loading

**What the exam is testing.** For a task with stated context demands and latency tolerance, should you **load everything up front** (monolithic) or **discover on demand** (progressive)? Pick the strategy whose context economics fit the workload.

### Concept

**Monolithic loading** puts all tool definitions, instructions and reference material in every request. There is no discovery step and the stable prefix caches well, but everything occupies the window and is billed as input every turn, and tool-selection accuracy tends to degrade past about **30–50 tools**.

**Progressive discovery** loads a small index up front and pulls in the rest when needed:

- **Tool search (`defer_loading`).** Mark most tools `defer_loading: true` and add a tool search tool (regex or BM25 variant); matching tools load inline when Claude searches. Search matches tool **names, descriptions, argument names and argument descriptions**, so write them in users' vocabulary with service prefixes (`hr_`, `crm_`). Keep the **3–5 most-used tools non-deferred** (at least one must be). It pays off at roughly 10+ tools or 10K+ tokens of definitions, and each search costs **an extra turn**. **It is not an access control:** deferred tools are still sent and callable, so restrict tools by disabling them (for example MCP toolset `enabled: false`).
- **Agent Skills.** Only each Skill's name and description (~100 tokens) is always loaded; the `SKILL.md` body and bundled files load when needed, and scripts' output (not their code) enters context.
- **Scoped MCP servers per subagent** (see 3.1) and **just-in-time retrieval** (keep paths or IDs in context; fetch content with tools).

**Caching is not a substitute for discovery.** It cuts the price and TTFT of a big prefix, but the tokens still fill the window and selection among 200 tools is still hard.

### Simple worked example

Cresset Systems' internal IT agent connects 9 MCP servers with **214 tools**, about **96,000 tokens** of definitions. Logs show:

- 80% of requests use only `it_reset_password`, `it_get_ticket`, `it_create_ticket` and `it_lookup_user`.
- Selection errors (wrong tool chosen) occur in 11% of requests.
- The context window is 1M tokens, but long troubleshooting sessions hit compaction early.

Config sketch:

```json
{
  "tools": [
    { "type": "tool_search_tool_bm25_20251119", "name": "tool_search_tool_bm25" },
    { "name": "it_reset_password", "description": "...", "input_schema": { } },
    { "name": "it_get_ticket",     "description": "...", "input_schema": { } },
    { "name": "it_create_ticket",  "description": "...", "input_schema": { } },
    { "name": "it_lookup_user",    "description": "...", "input_schema": { } },
    { "name": "net_vpn_reset_profile", "description": "Reset a user's VPN profile when VPN won't connect...",
      "input_schema": { }, "defer_loading": true }
  ]
}
```

The other ~210 tools are also `defer_loading: true`, and tools nobody should use are disabled at the server or toolset level.

Context economics:

- **Before:** 96K tokens of definitions on every request.
- **After:** about 4 loaded tools plus the search tool, say 3K tokens. Deferred tools are loaded only when found.
- **Cost:** about 20% of requests now add a search turn.

That is a good trade: a large context and accuracy win for a small latency cost on the minority path.

### Decision table

| Workload | Strategy |
|---|---|
| Small tool set (~5–10), all used often | Monolithic; cache the stable prefix |
| Large catalog (dozens to thousands), most unused per request | Tool search, with hot tools kept loaded |
| Large catalog *and* strict per-turn latency | Hybrid: hot tools loaded, rest deferred; measure the extra turn |
| Lots of procedural know-how, used occasionally | Skills |
| Bulky reference data needed by one step | Just-in-time retrieval or a scoped subagent |

### Anti-pattern → fix

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Defer *everything*, including the 4 hot tools | Search turn added to 80% of requests | Keep hot tools loaded |
| Tool search for a 6-tool agent | Extra turn for no context gain | Load all; cache the prefix |
| Longer cache TTL to "fix" 200-tool bloat | Window and selection problem unchanged | Tool search |
| Context editing to remove tool definitions | Context editing clears tool *results*, not definitions | Tool search / scoping |
| Only allowlisting the top 10 tools | Breaks valid rare requests | Defer the long tail instead |
| Tool names like `do_action_7` | Search can't match them | Descriptive names/descriptions in user vocabulary |
| Prompt "search again if you can't find it" | Doesn't fix unsearchable metadata | Rewrite names and descriptions |

### Exam traps

- **"Tool search + caching, no trade-off"** is wrong. A search turn still costs latency.
- **Tool search does not restrict access.** If the stem is about an agent calling a dangerous tool, the answer is disabling or removing it.
- **Skills on the API need the code execution tool.** If code execution is ruled out, Skills are too.

### Practice

**Q3.7-a.** A sales-ops agent has 7 tools, all used in most conversations. Its definitions total 4,500 tokens. A teammate proposes adding tool search with all 7 deferred to "save context". The SLA is tight on per-turn latency. What should the architect decide?

A) Keep all 7 tools loaded and cache the stable tool-and-system prefix.
B) Adopt tool search; any context savings are worth it.
C) Defer 5 tools and keep 2 loaded to balance the trade-off.
D) Merge all 7 tools into one `do_sales_op(action, args)` tool.

**Answer: A.** With a few frequently used tools, deferral adds a search turn to most requests and saves very little, which is the wrong trade under a tight latency SLA. Caching handles the fixed cost. C still adds search turns to the common path. D hurts tool selection and makes least-privilege scoping harder.

**Q3.7-b.** A platform agent integrates 600 tools. Tool search is enabled, but users report it often fails to find `fin_close_period_reopen` when they ask to "reopen last month's books". The tool's description is "Reverses FP lock state." Which change most directly helps?

A) Raise the tool search result limit from 5 to 50.
B) Add a system prompt line: "If search fails, try different keywords."
C) Make `fin_close_period_reopen` non-deferred along with all other finance tools.
D) Rewrite the description and parameter descriptions in users' terms ("reopen a closed accounting month/period, unlock the books") and keep the `fin_` prefix.

**Answer: D.** Tool search matches on names, descriptions and argument names and descriptions, so jargon like "FP lock state" never matches the user's words. A returns more weak matches without fixing the vocabulary gap. C works around the issue but loads a whole category up front, which defeats the purpose. B is an instruction that doesn't change what can be matched.

**Official docs**
- Tool search tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool
- Advanced tool use: https://www.anthropic.com/engineering/advanced-tool-use
- Agent Skills overview: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Effective context engineering for AI agents: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

---

## 3.8 Production Reliability Controls

**What the exam is testing.** You get error traces or throughput data from production. Name the failure pattern and specify the control (**rate-limit handling, retry and backoff, idempotency for side-effecting tools, or fallback routing**) that fixes it **without introducing duplicate effects**.

### Concept

**Rate limits.** The API limits **requests per minute (RPM)**, **input tokens per minute (ITPM)** and **output tokens per minute (OTPM)** per model class. Exceeding any one returns **429 `rate_limit_error`** with a **`retry-after`** header. The token bucket refills continuously, so bursts can 429 under the per-minute average, and sharp usage increases can hit "ramp limits". On most models, cache reads don't count toward ITPM.

**Overload.** **529 `overloaded_error`** is transient, API-wide load. Back off, and optionally route to another model or deployment.

**SDK retries.** The official SDKs already retry connection errors, 408, 409, 429 and 5xx with backoff and honor `retry-after`, **2 retries by default** (`max_retries`).

**Retries multiply across layers.** SDK × wrapper × queue redelivery multiplies attempts. Keep **one retry layer** with exponential backoff, **jitter** (so clients don't retry in sync), `retry-after`, a **cap** on attempts or time, and a **dead-letter queue** for exhausted items.

**Idempotency for side effects.** For tools that charge, book, send or write, pass an **idempotency key** (one unique ID per logical operation, not per attempt) so the downstream system ignores duplicates.

**Fallback without re-execution.** When a run fails partway and moves to a fallback model, **checkpoint** message history and tool results after each step and **resume** from the last completed step, with idempotency keys covering completed-but-unrecorded steps.

**Server-side `fallbacks`** (beta) retries on a fallback model **only after a safety-classifier refusal**. Rate limits, overloads and server errors are returned as-is, so it is never the fix for 429 or 529.

**Batch API for work nobody waits on.** Message Batches run asynchronously at **50% of standard prices** under **separate rate limits**. Most finish within an hour, and anything unfinished after 24 hours expires.

**Spend limits are not throughput limits.** Backoff won't help: stop, queue work durably, and alert an admin. (The usage tier's monthly cap returns 429 *without* `retry-after`; a spend limit your org sets for itself returns 400 `invalid_request_error`.)

### Simple worked example: retry multiplication

Incident at Wexford Payments during a 10-minute regional overload (529s):

```text
Layer                       Config                 Attempts per job
Anthropic SDK               max_retries=2          3
App wrapper (tenacity)      stop_after_attempt(4)  × 4
SQS redelivery              maxReceiveCount=3      × 3
                                                   = 36 API attempts per job
Queue depth at incident: 1,200 jobs → up to 43,200 attempts in the window
```

The retry storm kept the service saturated after the overload cleared. Fix: keep the SDK's retries (backoff, jitter, `retry-after` built in) or one explicit layer, not three. Set the wrapper to 1 attempt, let the queue redeliver at most once to a **dead-letter queue**, and cap total time per job.

Second finding in the same post-mortem: 14 customers were charged twice. The `capture_payment` tool had succeeded, but its response timed out, so the agent run was retried. Fix: an **idempotency key** derived from the order and step (`order-8812:capture:1`) passed to the payment processor, plus **checkpointing** so a resumed run starts after the recorded capture.

### Simple worked example: rate-limit headroom

A nightly summarization job processes 24,000 documents. Each produces about 2,500 output tokens, for 60M output tokens in total. The org's OTPM limit for the model is 200,000, and interactive daytime traffic uses about 120,000 OTPM at peak.

- Real-time, using the full limit at night: 60,000,000 ÷ 200,000 = **300 minutes (5 hours)**. That fits overnight, but any spillover into the morning collides with interactive traffic and causes 429s for users.
- Via the Batch API: separate limits, 50% cost, results within 24 hours. No one waits on these summaries until the next day, so **Batch is the better fit**.

### Decision table

| Evidence | Control |
|---|---|
| 429 with `retry-after` during bursts | Honor `retry-after`; client-side rate shaping/queue; smooth bursts |
| Sustained 429 from background work starving users | Move background work to the Batch API (separate limits) |
| 529 overloaded | Backoff + jitter; optional fallback model/deployment |
| Attempts ≫ jobs; storm continues after recovery | Single retry layer + cap + dead-letter |
| Duplicate charges, emails or tickets after retries | Idempotency keys on side-effecting tools |
| Fallback re-runs earlier tool calls | Checkpoint/resume from the last completed step |
| Refusals on one model need another try | Server-side `fallbacks` (refusal-only, beta) |
| Spend ceiling reached | Stop, queue durably, alert; backoff won't help |

### Anti-pattern → fix

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Raising retries from 3 to 10 | Multiplies load; worsens the storm | One layer, capped, with jitter |
| Retries in SDK + wrapper + queue | Multiplication | Pick one layer |
| Idempotency keys when the failure happens *before* any side effect | Right practice, wrong failure | Fix the retry layering |
| Fixed 1 s retry interval across 500 workers | Synchronized retry waves | Exponential backoff + jitter |
| Server-side `fallbacks` to handle 429/529 | It triggers only on refusals | Client-side routing/backoff |
| Falling back by restarting the whole agent run | Repeats completed side effects | Checkpoint and resume |
| Prompt "check before booking again" | Instruction; the model may not know it booked | Idempotency key at the API |
| Asking for a higher rate limit to fix a retry storm | Treats the symptom | Remove the extra retry layers |

### Exam traps

- **Idempotency vs backoff.** Backoff controls *when* to retry. Idempotency makes the retry *safe*. Duplicate effects → idempotency. Storms or 429s → backoff and layering.
- **A fallback tier inherits your retry layers.** Its attempts multiply onto that tier too.
- **Batch is wrong for anything a user is waiting on.** It has no streaming, and results can take up to 24 hours.
- Server-side `fallbacks` doesn't apply on partner platforms such as Bedrock, which use SDK middleware instead. Don't build an answer around availability details unless the stem states them.

### Practice

**Q3.8-a.** Stellan Clinics' scheduling agent books appointments through `create_booking`. After a network blip, logs show the same patient booked twice in 23 cases. In each case the booking succeeded downstream but the response was lost, and the agent's tool call was retried. **Select TWO** changes that prevent duplicates without losing legitimate bookings.

A) Pass an idempotency key, generated once per logical booking, to the booking API so repeats return the original booking.
B) Disable all retries on `create_booking` calls.
C) Add a system prompt rule: "Before booking, check whether you already booked this slot."
D) Checkpoint each completed tool step so a retried or resumed run continues after the last recorded step.

**Answer: A and D.** A makes a repeated call harmless even when the first success went unrecorded. D keeps resumed runs from replaying steps that are already done. B drops real bookings whenever a transient error happens before the booking is made. C relies on the model knowing about a booking whose response it never received.

**Q3.8-b.** Error logs show bursts of 529 `overloaded_error`. Each job's API attempts average 27 during an incident, and the backlog keeps growing for 20 minutes after the API recovers. The app uses the SDK default retries, a wrapper retrying 3 times, and a queue redelivering 3 times. What is the best fix?

A) Keep a single retry layer with exponential backoff, jitter and a cap, and send exhausted jobs to a dead-letter queue.
B) Add idempotency keys to every Claude API call.
C) Enable server-side `fallbacks` so overloaded requests move to another model.
D) Request a higher rate limit from Anthropic.

**Answer: A.** Three layers multiply attempts (3 × 3 × 3 = 27), so the storm outlives the overload. Collapsing to one capped, jittered layer fixes the pattern. C fails because server-side fallback triggers only on safety refusals, and overloads are returned as-is. B is a real practice for side-effecting tools, but these failures happen before any side effect, and D doesn't address an overload or a self-inflicted storm.

**Official docs**
- Rate limits: https://platform.claude.com/docs/en/api/rate-limits
- Errors: https://platform.claude.com/docs/en/api/errors
- Batch processing: https://platform.claude.com/docs/en/build-with-claude/batch-processing
- Refusals and fallback: https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback
- Parallel tool use (`is_error`, result ordering): https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use

---

## Key takeaways

- **Remove > scope down > log.** Prefer the fix that makes misuse impossible over one that records it.
- **Narrow, fixed-query tools on read-only credentials** beat general tools with prompt rules.
- **MCP: default off + allowlist,** and put servers on the subagent that needs them.
- **Keep bulk and sensitive data out of model context:** a backend tool that acts in code and returns a count, or programmatic tool calling / code execution (note that these are not ZDR-eligible).
- **Act as the user:** per-user delegated OAuth defeats the confused deputy. **Never let the model supply tenant or user IDs.**
- **No secrets in prompts or sandbox environments.** Sandbox code holding a key can bypass every session control.
- **WIF over static keys; App Attest (or a backend proxy) for native apps.**
- **Decompose latency** into tools, TTFT and generation. Caching → TTFT. Fast mode → generation. Streaming → perception only. Parallel calls → independent lookups.
- **Monitoring sees only what happens.** Watch for absence (failed servers, missing calls), age (oldest open item), tails (per-session p99) and segments. Instrument your own tools.
- **Retrieval ladder:** < ~200K tokens → full context + caching. Larger → hybrid + Contextual Retrieval + rerank to ~20 + metadata filters + score-threshold fallback. Same embedding model on reindex.
- **Connection choice:** one consumer → direct; many consumers → MCP; trust boundary + state → agent-to-agent. No inbound access → client tool, not the MCP connector.
- **Progressive discovery** for large, mostly unused catalogs; keep the hot tools loaded. Tool search is not access control.
- **Reliability:** one retry layer, backoff + jitter + cap + dead-letter; idempotency keys for side effects; checkpoint/resume; Batch for work nobody waits on; server-side `fallbacks` is refusal-only.

## Confused pairs

| Pair | The difference |
|---|---|
| **Tool search vs access control** | Tool search hides definitions until needed, but deferred tools are still sent and callable. Access control (disable/remove tools, credentials, permissions) actually stops calls. |
| **Caching vs context capacity** | Caching cuts the price and TTFT of a repeated prefix. Cached tokens still fill the context window, so caching never makes something fit. |
| **Idempotency vs backoff** | Backoff decides *when* to retry and protects the service. Idempotency makes a repeated side effect harmless and protects the data. |
| **Streaming vs total latency** | Streaming shows the first tokens sooner, but the full answer arrives no earlier. It's useless when a machine needs the complete output. |
| **Fast mode vs smaller tier** | Fast mode is the same model and intelligence with faster output, at a premium price. A smaller tier is a different model: cheaper and faster, but possibly less accurate. |
| **MCP connector vs client tool** | The MCP connector has Anthropic's API call your public HTTP MCP server (tools only). A client tool is executed by your app wherever it runs, including private networks. |
| **Subagent vs agent-to-agent** | A subagent is part of your system, inside your trust domain, used for context isolation or parallelism. Agent-to-agent hands a task to another party's autonomous agent across a trust boundary. |
| **Logging vs removing a tool** | Logging detects misuse after the fact. Removing (or scoping) the tool prevents it. For anything irreversible, prevention wins. |

---

[← Domain 2](domain-2-models-prompting-context.md) · [Domain 4 →](domain-4-evaluation-testing.md)
