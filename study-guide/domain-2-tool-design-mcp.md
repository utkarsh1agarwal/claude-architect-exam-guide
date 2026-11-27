# Domain 2: Tool Design & MCP Integration (18%)

Tools are how agents actually *do* things in the world. This domain is about designing tool interfaces and MCP integrations that a model can use reliably — most of it comes down to writing better descriptions and structuring errors well, which is cheap to fix once you know to look for it.

## 2.1 Tool Description Quality Is the #1 Selection Lever

**Concept.** When Claude decides which tool to call, the tool **description** is the main thing it reads. Not the name alone, not the parameter schema alone, and not a routing rule buried in the system prompt. A minimal description ("Retrieves customer information") works when there is only one tool that could plausibly fit. As soon as two tools overlap, short descriptions make selection unreliable: the model guesses, and it guesses differently on similar inputs.

A good description answers the questions the model would otherwise have to guess at:

- **What it does** and what it returns (fields, shape, units).
- **Input format**: which identifier, in what format (`ORD-` prefix, email vs. customer ID, ISO dates).
- **Example queries** it should handle ("Where is my order?", "Has ORD-48213 shipped?").
- **Edge cases**: what happens with partial IDs, multiple matches, cancelled records.
- **Boundaries**: when *not* to use it, and which tool to use instead.

Anthropic's tool-use docs call detailed descriptions "by far the most important factor in tool performance" and suggest at least 3–4 sentences per tool, more for complex ones.

**Worked example.** A support agent has `get_customer` and `lookup_order`. Logs show it calls `get_customer` for "where is my order?" questions about a third of the time.

Before:

```json
[
  { "name": "get_customer", "description": "Retrieves customer information" },
  { "name": "lookup_order", "description": "Retrieves order details" }
]
```

After:

```json
[
  {
    "name": "get_customer",
    "description": "Look up a customer's account profile: name, email, account status, loyalty tier, and the list of their order IDs (IDs only, no order contents). Input is either customer_id (format CUS-123456) or the email on the account. Use this to verify identity or to find a customer's order IDs when they don't know them. Do NOT use this for shipping status, items, or refund eligibility of a specific order; use lookup_order for that. Returns {found: false} when no account matches; that is a valid result, not an error.",
    "input_schema": {
      "type": "object",
      "properties": {
        "customer_id": { "type": "string", "description": "Customer ID, e.g. CUS-104233" },
        "email": { "type": "string", "description": "Account email, used when customer_id is unknown" }
      }
    }
  },
  {
    "name": "lookup_order",
    "description": "Get the full record for ONE order: line items, totals, payment status, shipping carrier and tracking status, delivery date, and whether it is inside the 30-day refund window. Input is an order_id in the format ORD-12345 (5+ digits). Use for questions like 'Where is my order?', 'Has ORD-48213 shipped?', 'Can I return this?'. If the customer gives no order ID, call get_customer first to list their order IDs. Do not use for account-level questions (email changes, loyalty tier).",
    "input_schema": {
      "type": "object",
      "properties": {
        "order_id": { "type": "string", "description": "Order ID, e.g. ORD-48213" }
      },
      "required": ["order_id"]
    }
  }
]
```

The two descriptions now point at each other. Each says what it returns, what input it expects, and when to hand off to the other tool.

### Fix ladder for misrouting

Start at the top. It is the cheapest change and usually the one that fixes the problem.

1. **Rewrite descriptions**: input formats, example queries, edge cases, explicit "use this vs. that" boundaries.
2. **Rename tools** to remove conceptual overlap (`analyze_content` → `extract_web_results`, scoped explicitly to web content).
3. **Split an overly generic tool** into purpose-specific tools with clear input/output contracts (`analyze_document` → `extract_data_points` + `summarize_content` + `verify_claim_against_source`).
4. *(Only if still needed)* Add few-shot examples for genuinely ambiguous residual cases. See [Domain 4](domain-4-prompt-engineering.md#42-few-shot-prompting).

### Renaming and splitting overlapping tools

Two tools with near-identical descriptions are a routing coin flip. A research system might have:

```text
analyze_content   "Analyzes content and returns insights."
analyze_document  "Analyzes a document and returns key information."
```

Nothing tells the model which to pick for a PDF it fetched from the web. Two fixes, often used together:

**Rename to reflect the real job.** If `analyze_content` is really only ever used on web search results, call it `extract_web_results` and say so: "Extracts title, URL, publication date, and the relevant passage from web search results. Input is the raw result list from web_search. Not for uploaded files or PDFs."

**Split the generic tool.** A single `analyze_document` that "does analysis" invites the model to use it for anything. Break it into tools with defined contracts:

| Tool | Input | Output | Use when |
|---|---|---|---|
| `extract_data_points` | `document_id`, `fields[]` (e.g. `["revenue", "fiscal_year"]`) | `{field: value, page, confidence}` per field | You need specific facts pulled out |
| `summarize_content` | `document_id`, `max_words` | Plain-text summary with section references | You need an overview, not specific values |
| `verify_claim_against_source` | `claim` (one sentence), `document_id` | `{supported: true/false/partial, quote, page}` | You need to check a statement against a source |

Each tool now has one purpose, a predictable output shape, and an obvious trigger. The model no longer has to infer what "analyze" means this time.

> **Note:** Anthropic's docs also recommend *consolidating* related operations (e.g. `create_pr`, `review_pr`, `merge_pr` into one tool with an `action` parameter). That doesn't contradict splitting. Consolidate when operations share one clear purpose and one object. Split when one tool hides several unrelated jobs behind a vague name. The goal in both cases is the same: no two tools that could plausibly answer the same request.

### System prompt wording can override good descriptions

The system prompt is read alongside the tool descriptions, and keyword-heavy instructions create associations the model follows. Example from a support agent:

```text
System prompt (before):
"Whenever a customer mentions their account, always pull their account details first."
```

Customers say "account" constantly ("my account shows the order hasn't shipped"). The model now calls `get_customer` before almost every `lookup_order`, even when the order ID is already in the message. The tool descriptions were fine; the system prompt overrode them.

```text
System prompt (after):
"Verify the customer's identity once per conversation before any refund or account change.
For order questions, use the order ID if the customer provides one."
```

When reviewing a system prompt, look for:

- Words that also appear in tool names or descriptions ("document", "account", "search", "analyze").
- "Always" / "whenever" rules tied to a keyword rather than to a situation.
- Instructions that name a tool for a broad category of requests ("use search for anything factual").

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| One-line descriptions on similar tools | Model can't tell them apart, so selection is inconsistent | Add inputs, outputs, example queries, edge cases, and "use X instead when…" |
| Two tools with near-identical descriptions (`analyze_content` / `analyze_document`) | Selection becomes effectively random | Rename to the specific job and scope each description |
| One generic "do analysis" tool | No defined contract; the model uses it for everything | Split into purpose-specific tools with clear input/output |
| Jumping straight to few-shot examples or a router | Costly and brittle when the real problem is the description | Fix descriptions first; add examples only for residual ambiguity |
| Keyword-triggered rules in the system prompt | Creates tool associations that override descriptions | Rewrite rules around situations, not keywords |

**Practice.** `get_customer` ("Retrieves customer information") and `lookup_order` ("Retrieves order details") are frequently confused by the agent for order-status queries. What's the most effective *first* step?

- A) 5–8 few-shot examples of correct routing
- B) Expand both descriptions with input formats, example queries, and explicit boundary conditions
- C) A keyword-based pre-routing layer
- D) Merge into one `lookup_entity` tool

**Answer: B.** Description quality is the first, lowest-effort, highest-leverage fix because descriptions are what the model reads to choose a tool. A adds tokens and only patches symptoms while the descriptions stay ambiguous; C is brittle extra infrastructure that bypasses the model's own selection; D removes the distinction instead of clarifying it and leaves a vaguer tool with mixed outputs.

**Practice.** A research pipeline has one tool, `analyze_document`, described as "Analyzes a document and returns relevant information." The agent uses it for summaries, fact extraction, and claim checking, and downstream code keeps failing because the output shape changes from call to call. What change best addresses the root cause?

- A) Add "Return JSON" to the tool description
- B) Increase `max_tokens` so the tool output isn't truncated
- C) Split it into `extract_data_points`, `summarize_content`, and `verify_claim_against_source`, each with a defined input and output contract
- D) Tell the agent in the system prompt to always summarize first and then extract

**Answer: C.** The tool has no single purpose, so its output varies with whatever the model asked it to do; splitting gives each job a predictable contract and an obvious trigger. A asks for JSON but still doesn't define which JSON for which job; B has nothing to do with shape changes; D forces an unnecessary step on every call and still leaves one overloaded tool.

**Practice.** After rewriting every tool description in a support agent, misrouting drops but one pattern remains: whenever a customer writes "refund", the agent calls `process_refund` immediately, even for questions like "what is your refund policy?". The system prompt contains "If the customer mentions a refund, handle it with the refund tool." What should you do?

- A) Add more detail to the `process_refund` description
- B) Rewrite the system prompt rule so it applies to an actual refund request for a specific order, not to the keyword "refund"
- C) Remove `process_refund` and require a human for all refunds
- D) Set `tool_choice` to `"auto"`

**Answer: B.** The keyword-sensitive instruction in the system prompt is creating the association and overriding a good description, so the fix is to reword the rule around the situation. A doesn't help because the description was already rewritten and the prompt rule wins; C removes a legitimate capability to fix a wording problem; D is already the default and doesn't change which tool the model picks.

## 2.2 Structured MCP Error Responses

**Concept.** An MCP tool reports a failure by returning a normal tool result with **`isError: true`**. The MCP spec separates two kinds of failure:

- **Protocol errors**: standard JSON-RPC errors for an unknown tool or a malformed request. The model usually can't fix these.
- **Tool execution errors**: returned in the result with `isError: true`. This covers API failures, input validation errors, and business-logic errors. Clients should pass these to the model so it can correct itself.

`isError` only says "this failed". It doesn't say *why* or *what to do next*. A generic message like `"Operation failed"` leaves the agent with three bad choices: retry blindly, give up, or make something up. Give it structured metadata in the result content so it can choose the right recovery:

- `errorCategory`: what kind of failure
- `isRetryable`: whether trying the same call again could work
- a human-readable `message` (and, for customer-facing agents, a `customerMessage` it can safely repeat)

`errorCategory` and `isRetryable` are **your** conventions inside the result content. They aren't MCP protocol fields; only `isError` is. Pick one spelling (`isRetryable` or `retriable`) and use it in every tool.

| Category | Example | Retryable? | What the agent should do |
|---|---|---|---|
| `transient` | Timeout, 503, rate limit | Yes, after a short wait | Retry with backoff, then escalate |
| `validation` | Order ID in the wrong format, date in the past | Not as-is | Fix the input and call again |
| `business` | Refund outside the 30-day window, amount over limit | No | Explain the policy to the user, offer alternatives |
| `permission` | Agent's token can't access this record | No | Escalate or ask a human; don't retry |

**Worked example.** `process_refund` in a support agent.

Bad (uniform error):

```json
{ "content": [{ "type": "text", "text": "Operation failed" }], "isError": true }
```

Good (business rule violation):

```json
{
  "content": [{
    "type": "text",
    "text": "{\"errorCategory\": \"business\", \"isRetryable\": false, \"code\": \"REFUND_WINDOW_EXPIRED\", \"message\": \"ORD-48213 was delivered 41 days ago; refunds are allowed within 30 days.\", \"customerMessage\": \"This order is outside our 30-day refund window, but it may still qualify for store credit or a warranty repair.\"}"
  }],
  "isError": true
}
```

Good (transient failure):

```json
{
  "content": [{
    "type": "text",
    "text": "{\"errorCategory\": \"transient\", \"isRetryable\": true, \"message\": \"Payments service timed out after 10s.\", \"retryAfterSeconds\": 5}"
  }],
  "isError": true
}
```

With the first, the agent stops retrying and tells the customer something accurate and useful. With the second, it waits and tries again. Neither is possible from `"Operation failed"`.

If you build tools directly on the Claude API rather than through MCP, the equivalent is a `tool_result` block with `"is_error": true` and the same structured content.

### Local recovery in subagents, structured propagation to the coordinator

In a multi-agent system, a subagent should handle what it can locally and escalate only what it can't. Transient failures are the classic local case: retry a couple of times with backoff. If that doesn't work, return a structured report to the coordinator. Don't return a bare failure, and don't return an empty success.

```python
def run_search(queries):
    results, failed = [], []
    for q in queries:
        for attempt in range(3):
            r = call_tool("web_search", {"query": q})
            if not r.is_error:
                results.append(r.data)
                break
            err = r.error
            if not err["isRetryable"]:
                failed.append({"query": q, "error": err, "attempts": attempt + 1})
                break
            time.sleep(2 ** attempt)
        else:
            failed.append({"query": q, "error": err, "attempts": 3})

    return {
        "status": "partial" if failed else "complete",
        "results": results,              # partial results are still useful
        "failed": failed,                # what was attempted and why it failed
        "suggestion": "Retry failed queries later or use the archive source" if failed else None,
    }
```

The coordinator gets the partial results, knows exactly which queries failed and why, and can decide whether to retry, use another source, or carry on with a noted gap.

### Access failure vs. valid empty result

These look similar and mean opposite things:

```json
// Access failure: the search did NOT happen
{ "content": [{ "type": "text", "text": "{\"errorCategory\": \"transient\", \"isRetryable\": true, \"message\": \"Orders DB unreachable\"}" }], "isError": true }

// Valid empty result: the search happened and found nothing
{ "content": [{ "type": "text", "text": "{\"orders\": [], \"matched\": 0, \"searchedBy\": \"email\"}" }], "isError": false }
```

If a timeout comes back as `{"orders": []}`, the agent tells the customer "you have no orders", which is wrong. If an empty result comes back as an error, the agent wastes retries on a query that already succeeded.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| `"Operation failed"` for every failure | Agent can't tell retry from rephrase from escalate | Return `errorCategory`, `isRetryable`, and a clear message |
| Catching a timeout and returning an empty list | Failure looks like a real "no matches" answer | Return `isError: true` with `errorCategory: "transient"` |
| Business rule violation marked retryable (or not marked) | Agent retries a refund that will never succeed | `isRetryable: false` plus a `customerMessage` |
| Subagent escalates every transient blip | Coordinator gets flooded with noise | Retry locally first; escalate only unresolved failures |
| Subagent escalates with just "failed" | Coordinator loses partial results and context | Include partial results, what was attempted, and suggested alternatives |

**Practice.** A search subagent times out mid-query. What's the best way for it to report this to the coordinator?

- A) Return an empty result set marked as success
- B) Retry silently forever until it succeeds
- C) Return structured error context: failure type, what was attempted, any partial results, possible alternatives
- D) Terminate the entire multi-agent workflow immediately

**Answer: C.** Structured context lets the coordinator make an informed recovery decision and keeps whatever partial work succeeded. A disguises a failure as a valid "no results" answer; B can hang the workflow and hides the problem; D over-reacts to a single, possibly recoverable failure.

**Practice.** A customer asks for a refund on an order delivered 45 days ago. `process_refund` returns `{"isError": true, "content": [{"type": "text", "text": "Refund failed"}]}`. The agent retries three times, then tells the customer "there was a technical problem, please try again later". What tool change would most directly fix this behavior?

- A) Return `errorCategory: "business"`, `isRetryable: false`, and a customer-friendly explanation of the 30-day policy
- B) Return `isError: false` with the message "Refund failed" so the agent doesn't retry
- C) Add "Do not retry refunds" to the system prompt
- D) Lower the agent's retry limit from 3 to 1

**Answer: A.** The agent misread a policy violation as a technical failure because the error carried no category or retry signal; structured metadata lets it stop retrying and explain the real reason. B hides the failure entirely so the agent may tell the customer the refund worked; C is a blanket rule that would also block retries of genuine transient payment timeouts; D still wastes a retry and still gives the customer the wrong explanation.

**Practice.** `lookup_order` searches by email. For an email with no orders it currently returns `isError: true` with "No orders found". What's wrong with this, and what should it return?

- A) Nothing is wrong; "no orders" is an error from the customer's point of view
- B) It should throw a JSON-RPC protocol error instead
- C) It should return `errorCategory: "transient"` so the agent retries in case the data is delayed
- D) A query that ran and found nothing is a valid empty result; return `isError: false` with an empty list so the agent doesn't treat it as a failure

**Answer: D.** The query succeeded, so the correct signal is a successful result with zero matches, which the agent can act on directly (for example, ask for a different email). A conflates a business outcome with a tool failure and invites pointless retries; B is for malformed requests or unknown tools, not for empty results; C makes the agent waste retries on a query that will keep returning the same correct answer.

## 2.3 Tool Distribution & `tool_choice` Across Agents

**Concept.** Every tool you give an agent is another option it has to rule out on every turn. Going from 4–5 tools to 18 makes selection noticeably less reliable: more choices, more near-overlaps, more chances to pick the wrong one. Tools outside an agent's role also get misused. A synthesis agent that has `web_search` will start searching instead of synthesizing what it was given.

**Scope tools per role.** Give each subagent the tools its job needs, and nothing else. Two refinements:

- **Constrained alternatives beat generic tools.** Instead of `fetch_url` (fetches anything), give a document agent `load_document`, which only accepts URLs from approved document hosts or file types and rejects everything else. Same capability for the intended use, much smaller blast radius.
- **Limited cross-role tools for high-frequency needs.** If the synthesis agent needs simple fact checks constantly, a narrow `verify_fact` tool is better than routing every check through the coordinator. Complex verification still goes through the coordinator to the research agent.

**Worked example.** A multi-agent research system. Before: every subagent got the full 18-tool list. After:

| Agent | Tools | Notes |
|---|---|---|
| Coordinator | `Task` (spawn subagents), `read_findings` | Plans, delegates, assembles |
| Web research | `web_search`, `extract_web_results`, `load_document` | `load_document` replaces `fetch_url` |
| Document analysis | `extract_data_points`, `summarize_content`, `verify_claim_against_source` | No web access |
| Synthesis | `read_findings`, `verify_fact` | `verify_fact` is the one scoped cross-role tool |

In Claude Code, a subagent's tool list goes in the `tools` field of its definition file:

```markdown
---
name: synthesis
description: Combines research findings into a cited report. Use after research and analysis subagents finish.
tools: Read, mcp__research__read_findings, mcp__research__verify_fact
---
You write the final report from the findings provided. Do not search for new sources.
For a simple fact check (a date, a name, a number), use verify_fact.
For anything that needs new research, list it under "Open questions" for the coordinator.
```

The Agent SDK equivalent is the `allowedTools` / per-agent `tools` configuration (see [Domain 1](domain-1-agentic-architecture.md)).

### `tool_choice`

`tool_choice` controls whether and how Claude must call a tool on a given request:

| Value | Behavior | Typical use |
|---|---|---|
| `{"type": "auto"}` | Model decides: call a tool or answer in text (default when tools are present) | Normal agent turns |
| `{"type": "any"}` | Model must call *some* tool, but picks which | Guarantee structured output via one of several extraction tools; no conversational reply |
| `{"type": "tool", "name": "X"}` | Model must call tool `X` | Force a required first step |
| `{"type": "none"}` | Model can't call tools | A turn that must be text only |

With `any` or a forced tool, the response starts directly with the `tool_use` block. There's no explanatory text before it.

**Worked example: forcing a first step, then letting the model drive.** A document pipeline must always run `extract_metadata` before any enrichment tools, because enrichment needs the document type and date.

```python
# Turn 1: force metadata extraction
resp = client.messages.create(
    model=MODEL, max_tokens=1024, tools=TOOLS,
    tool_choice={"type": "tool", "name": "extract_metadata"},
    messages=messages,
)
# ...execute extract_metadata, append the tool_result to messages...

# Turn 2+: let the model choose enrichment tools
resp = client.messages.create(
    model=MODEL, max_tokens=1024, tools=TOOLS,
    tool_choice={"type": "auto"},
    messages=messages,
)
```

The forced choice applies only to the request where you set it. Subsequent steps happen in follow-up turns with `auto` (or `any` if a tool call is still mandatory).

> **Version note:** Forced tool use (`any` or a named tool) can't be combined with manual extended thinking, and some newer models reject it with a 400 error. On those models, Anthropic recommends `auto` with strict tool use or structured outputs instead. The exam tests the concept: what each option guarantees. Check the [tool-use docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools#forcing-tool-use) for the model you deploy.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Every subagent gets every tool | Lower selection accuracy; agents drift outside their role | Per-role tool lists of 4–5 tools |
| Synthesis agent has `web_search` | It searches instead of synthesizing | Remove it; give a scoped `verify_fact` for simple checks |
| Generic `fetch_url` for document loading | Can fetch anything, including irrelevant or unsafe URLs | `load_document` that validates the URL/type |
| Routing every simple check through the coordinator | Adds latency for the common case | Scoped cross-role tool for high-frequency simple needs |
| Relying on prompt wording to make the model call a tool | Model sometimes replies in text instead | `tool_choice: "any"` or a forced tool |
| Forcing the same tool on every turn | Model can never move to the next step | Force on the first request only, then `auto` |

**Practice.** A synthesis agent needs simple fact-checks (dates, names, stats) constantly, currently routed through the coordinator → web-search agent → back, adding 40% latency. 85% of these checks are simple; 15% need deep investigation. Best fix?

- A) Give the synthesis agent full access to all web search tools
- B) Give the synthesis agent one scoped `verify_fact` tool for the simple 85%; keep coordinator-routed delegation for the complex 15%
- C) Batch all verification requests to send at the end
- D) Have the search agent proactively cache extra context speculatively

**Answer: B.** A narrow cross-role tool covers the high-frequency simple case without giving the synthesis agent a whole new specialization, and complex cases still go through the coordinator. A over-provisions the agent and invites it to start doing research instead of synthesis; C delays verification until after the text is written, so errors get baked in; D adds speculative work and context without addressing the routing cost.

**Practice.** An invoice-extraction service defines three tools: `extract_invoice`, `extract_receipt`, and `extract_purchase_order`. Sometimes Claude answers "This looks like an invoice from Acme Corp" in plain text instead of calling any tool, which breaks the pipeline. You want Claude to pick the right extractor itself. Which `tool_choice` setting fits?

- A) `{"type": "auto"}`
- B) `{"type": "tool", "name": "extract_invoice"}`
- C) `{"type": "any"}`
- D) `{"type": "none"}`

**Answer: C.** `any` guarantees that a tool is called while leaving the choice of which extractor to the model, which is exactly the requirement. A is the current behavior that allows a plain-text reply; B forces the invoice extractor even for receipts and purchase orders; D prevents tool calls entirely.

**Practice.** A coordinator in a research system has 18 tools, including web search, PDF parsing, database queries and report formatting. It often calls `query_database` for questions that need web search and occasionally formats reports mid-research. What's the best structural change?

- A) Move tools into specialized subagents so each has the 4–5 tools its role needs, and keep the coordinator focused on delegation
- B) Add a paragraph to the coordinator's system prompt listing when to use each of the 18 tools
- C) Set `tool_choice: "any"` so the coordinator always uses a tool
- D) Rename all tools with numeric prefixes so the model sees them in priority order

**Answer: A.** Too many tools on one agent increases decision complexity and cross-role misuse, so the fix is to scope tool sets by role. B adds more text for the model to weigh but leaves the 18-way choice in place; C forces a tool call but doesn't make the choice any more accurate; D adds noise to names and doesn't reduce overlap.

## 2.4 Integrating MCP Servers into Claude Code and Agent Workflows

**Concept.** MCP servers give Claude Code (and Agent SDK agents) extra tools and resources. For the exam, you need to know where configuration lives, how to keep secrets out of git, how tools from several servers coexist, and when to use a resource rather than a tool.

### Server scoping: project vs. user

| Scope | Stored in | Shared with team? | Use for |
|---|---|---|---|
| **Project** | `.mcp.json` in the repo root | Yes, committed to version control | Shared team tooling (GitHub, Jira, internal APIs) |
| **User** | `~/.claude.json` | No | Personal or experimental servers you use across all projects |
| Local *(default for `claude mcp add`)* | `~/.claude.json`, under that project's path | No | Personal servers for one project only |

Commands:

```bash
# Shared with the team: writes to .mcp.json
claude mcp add --scope project --transport http github https://api.githubcopilot.com/mcp/

# Just for you, in every project: writes to ~/.claude.json
claude mcp add --scope user --transport stdio scratch-notes -- npx -y my-notes-mcp
```

Claude Code asks for approval before using project-scoped servers from a `.mcp.json` the first time in an interactive session, because the file comes from the repo rather than from you.

### Environment variable expansion for credentials

`.mcp.json` is committed, so it must never contain tokens. Claude Code expands `${VAR}` (and `${VAR:-default}`) in a server's `command`, `args`, `env`, `url`, and `headers`. Each developer sets the variable in their own environment.

**Worked example: a team `.mcp.json`.**

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer ${GITHUB_TOKEN}" }
    },
    "jira": {
      "command": "npx",
      "args": ["-y", "@example/jira-mcp-server"],
      "env": {
        "JIRA_BASE_URL": "${JIRA_BASE_URL:-https://yourco.atlassian.net}",
        "JIRA_TOKEN": "${JIRA_TOKEN}"
      }
    }
  }
}
```

*(The Jira package name is a placeholder; use the server your team actually picks.)*

And a personal experimental server in `~/.claude.json`, which the team never sees:

```json
{
  "mcpServers": {
    "sql-sandbox": {
      "command": "python",
      "args": ["/Users/me/dev/sql-mcp/server.py"],
      "env": { "DB_URL": "${LOCAL_DB_URL}" }
    }
  }
}
```

If a variable isn't set, Claude Code still loads the config, shows a warning, and passes the literal `${VAR}` text. Authentication will then fail, so check the warning first when a server won't connect.

### All servers' tools are available together

At connection time, Claude Code discovers the tools from **every** configured server (project, user, local) and offers them to the agent as one pool, alongside the built-in tools. Tools appear as `mcp__<server>__<tool>`. Two consequences:

- Descriptions have to disambiguate across servers, not just within one. A `search` tool on the Jira server and a `search` tool on the docs server need descriptions that say what each one searches.
- More servers means more tools to choose from, so the scoping advice in 2.3 applies here too.

> **Version note:** Current Claude Code uses *tool search* by default: only MCP tool names load at session start and full definitions load when needed. That reduces context cost but doesn't change the principle. Every configured server's tools are candidates at once, and the description is what gets a tool picked.

### Community servers vs. custom servers

For standard integrations (Jira, GitHub, Slack, Postgres), use an existing, well-maintained MCP server rather than writing your own. It's already built, tested, and maintained, and it handles auth and pagination edge cases you'd otherwise rediscover. Write a custom server only for **team-specific workflows** that no general server covers, for example "open a deploy-approval ticket with our internal checklist and link the last three CI runs".

| Need | Choice |
|---|---|
| Read/create Jira issues | Community Jira server |
| GitHub PRs and issues | Community/official GitHub server |
| Your internal deploy-approval workflow | Custom server |
| Querying your company's proprietary metrics API | Custom server (thin, focused) |

### MCP tool descriptions vs. built-in tool preference

**Concept.** Description quality (2.1) matters between MCP tools, and it also matters **between an MCP tool and a built-in tool**. Claude has strong priors toward familiar built-ins like `Grep`. If a connected server offers something more capable, such as a `search_codebase` tool with semantic, cross-reference-aware search, but describes it thinly, Claude will default to `Grep` even when the MCP tool would give a better result. The MCP tool isn't broken. Its description just doesn't make a case against the familiar option.

**Worked example.**

Before:

```json
{ "name": "search_codebase", "description": "Searches the codebase." }
```

After:

```json
{
  "name": "search_codebase",
  "description": "Semantic code search over the indexed monorepo (all 14 services), including generated code and vendored SDKs that are not checked out locally. Matches by meaning, not just text: 'where do we validate refund amounts' finds validateRefund(), RefundPolicy.check(), and the SQL constraint. Each hit returns file path, symbol name, a 10-line snippet, and the list of callers and callees for that symbol. Prefer this over Grep for 'where/how is X handled' questions and for tracing call chains across services. Use Grep for exact string matches in the current checkout, such as a specific error message or import line."
}
```

The new description says what the tool can do that Grep can't (semantic matching, cross-service index, caller/callee data) and when Grep is still the right choice.

### MCP resources vs. tools

**Concept.** MCP servers expose two primitives you need to tell apart:

| Primitive | What it is | Who drives it |
|---|---|---|
| **Tool** | An action the model *decides* to invoke, with inputs it constructs | Model-controlled: Claude chooses when and how to call it |
| **Resource** | Read-only, URI-addressable content: issue summaries, documentation hierarchies, database schemas, file trees | Application-driven: listed via `resources/list`, read via `resources/read`, surfaced to the model as context |

If an agent has to make an exploratory tool call just to find out *what exists* before it can act, the server should probably expose that catalog as a **resource**.

**Worked example.** A project-tracking server exposes its catalog as resources:

```json
{
  "resources": [
    {
      "uri": "tracker://projects",
      "name": "Project catalog",
      "description": "All active projects with ID, name, owner, and status. Updated hourly.",
      "mimeType": "application/json"
    },
    {
      "uri": "tracker://schema/issues",
      "name": "Issue field schema",
      "description": "Fields, allowed values, and required fields for creating issues.",
      "mimeType": "application/json"
    }
  ]
}
```

In Claude Code you can reference a resource with an `@` mention in the prompt, in the form `@server:protocol://resource/path`. The resource is fetched and attached, so Claude starts with the project list and the issue schema instead of spending calls discovering them. Claude Code also gives the model built-in tools to list and read MCP resources when a server supports them. State-changing actions such as `create_issue` stay as **tools**.

**Fix ladder for resource vs. tool confusion:**

1. If the model repeatedly makes "list/discover" tool calls before every real action, expose that catalog as an MCP **resource**. That removes a round trip per task.
2. Keep **tools** for anything that takes an action or needs model-constructed parameters (creating an issue, running a query with a specific filter).
3. Don't blur the two. A tool named `list_resources` that returns a static catalog is a resource wearing a tool's clothing, and it still costs a model decision and a round trip.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Token hardcoded in `.mcp.json` | Secret ends up in git history | `${GITHUB_TOKEN}` expansion; each dev sets the env var |
| Team server configured in each person's `~/.claude.json` | Config drifts; new teammates don't get it | Put shared servers in project `.mcp.json` |
| Experimental server added to `.mcp.json` | Pushes your experiment onto the whole team | Use user scope (`~/.claude.json`) |
| Writing a custom Jira server | Rebuilds and maintains what already exists | Use a community server; go custom only for team-specific workflows |
| Thin MCP description next to a familiar built-in | Claude keeps using `Grep` | Describe capabilities, outputs, and when to prefer the MCP tool |
| Every task starts with a `list_projects` tool call | Burns a round trip on pure discovery | Expose the catalog as a **resource** |
| Static reference data (DB schema, doc tree) implemented as tools | Treats read-only data as an action needing a decision | Model it as a resource; reserve tools for actions |
| State-changing operation exposed as a "resource" | Resources are read-only; the side effect is hidden | Keep it as a **tool** |

**Practice.** Which config location is correct for a Jira MCP server your whole team should use, with a token that must never be committed to git?

- A) `~/.claude.json` with the token hardcoded
- B) `.mcp.json` with `${JIRA_TOKEN}` env-var expansion
- C) `CLAUDE.md` with the token in a code block
- D) A `.env` file referenced nowhere in Claude Code config

**Answer: B.** Project-scoped `.mcp.json` is the shared, version-controlled config, and `${JIRA_TOKEN}` is expanded from each developer's environment so the secret never enters the repo. A is personal scope, so teammates don't get the server, and the token is in plain text; C is instructions for the model, not MCP configuration, and would leak the token into git and the context window; D never reaches the server because nothing references it.

**Practice.** A connected MCP server exposes a `search_codebase` tool that performs semantic, cross-reference-aware search, meaningfully more capable than `Grep` for the query type a developer is asking about. Logs show Claude keeps reaching for `Grep` anyway. What's the most likely cause and fix?

- A) MCP tools are always deprioritized versus built-ins by design and this can't be changed
- B) The MCP server needs to be moved from project scope to user scope
- C) `Grep` needs to be removed from the agent's tool list entirely
- D) The MCP tool's description under-sells its capability relative to the well-known built-in; enhance the description to make the capability and output explicit

**Answer: D.** Claude picks tools largely from their descriptions, and a thin description loses to a familiar built-in, so describing the tool's capabilities, outputs and when to prefer it is the fix. A is false; there is no fixed deprioritization; B changes who sees the server, not how Claude chooses between tools; C overcorrects and breaks legitimate exact-match searches.

**Practice.** An MCP server for a project-tracking tool requires the agent to call `list_all_projects` before nearly every task, just to look up which project ID to use. That's an extra round trip almost every time. What's the most appropriate fix?

- A) Rewrite `list_all_projects`'s description to be more detailed
- B) Force `tool_choice` to always call `list_all_projects` first
- C) Expose the project list as an MCP **resource**, since it's read-only reference data the agent needs to see, not an action it decides to take
- D) Cache the tool's output in `CLAUDE.md`

**Answer: C.** Read-only catalogs that exist to be discovered belong in resources, which give the agent visibility without a model decision and a tool round trip. A improves selection but still costs the same call every time; B makes the extra call mandatory rather than removing it; D puts data that changes into a static instruction file that will go stale.

**Practice.** A developer wants to try an early-stage MCP server that summarizes their personal browser bookmarks, in every project they open. The team's repo already has a `.mcp.json` with GitHub and Jira. Where should this server go?

- A) User scope in `~/.claude.json`, so it's available to them in all projects without affecting teammates
- B) The repo's `.mcp.json`, so it's version-controlled
- C) A new `.mcp.json` in their home directory
- D) The `env` block of the GitHub server entry

**Answer: A.** Personal and experimental servers belong in user scope, which applies across the developer's projects and isn't shared. B would push a personal experiment on everyone who clones the repo; C isn't where Claude Code reads user-scoped servers; D is for environment variables passed to the GitHub server, not for defining another server.

## 2.5 Built-in Tools

**Concept.** Claude Code's built-in file tools each have one job. Picking the right one saves calls and context.

| Tool | Use for | Example |
|---|---|---|
| `Grep` | **Content** search: text or regex inside files | Find every caller of `processRefund(`, locate the string `"Refund window expired"`, find `import { logger }` |
| `Glob` | **Path** pattern matching: files by name or extension | `**/*.test.tsx`, `src/**/migrations/*.sql` |
| `Read` | Load a file's full contents | Read `refund_service.py` to follow its logic |
| `Write` | Create a file or overwrite one completely | Generate a new config file; rewrite a file after a Read |
| `Edit` | Targeted change by exact, **unique** text match (`old_string` → `new_string`) | Change one function's timeout from 10 to 30 |
| `Bash` | Run commands | Run tests, `git log`, build scripts |

Quick rule: if the question is "which files *are named*…", use Glob. If it's "which files *contain*…", use Grep.

> **Version note:** On macOS, Linux and WSL, current Claude Code leaves `Grep` and `Glob` out of the default tool set and runs the same searches as `grep`/`find` through `Bash`. They come back when a subagent or `--tools` lists them explicitly. The selection logic (content search vs. path matching) is the same either way, and that's what the exam tests. See the [tools reference](https://code.claude.com/docs/en/tools-reference).

### Edit, and the Read + Write fallback

`Edit` does exact string replacement and requires `old_string` to appear **exactly once**. If the anchor text appears several times (a repeated `return None`, a duplicated config block), the edit fails.

1. First, try a longer anchor with enough surrounding context to be unique (or `replace_all` if you really do want every occurrence changed).
2. If you still can't pin down a unique anchor, for example in a file with many near-identical blocks, **Read** the full file, make the change, and **Write** the whole file back.

**Worked example.** `settings.yaml` has three identical `timeout: 10` lines under different services, and you need to change only the `payments` one. `Edit` with `old_string: "timeout: 10"` fails as non-unique. Including the service header in the anchor usually fixes it:

```yaml
# old_string
payments:
  timeout: 10
# new_string
payments:
  timeout: 30
```

If the blocks are generated and even the headers repeat, use Read to load the file, then Write the corrected version.

### Building codebase understanding incrementally

Don't read every file up front. That fills the context with code that doesn't matter. Start narrow and follow the thread:

1. **Grep** for an entry point: the route, the error message, the function name.
2. **Read** that file.
3. Follow its imports and calls with targeted **Read**s (or another **Grep** for a symbol).
4. Stop when you can answer the question.

**Worked example: "Why do some refunds return 'Refund window expired' for orders delivered yesterday?"**

```text
Grep  "Refund window expired"        -> src/refunds/policy.py:88
Read  src/refunds/policy.py          -> uses days_since_delivery() from utils/dates.py
Read  src/utils/dates.py             -> compares a UTC timestamp with a local date
Grep  "days_since_delivery("         -> 3 other callers that may have the same bug
```

Four calls and three files read, out of hundreds.

### Tracing usage through wrapper modules

Searching for a function's original name misses callers that import it through a wrapper or re-export. To find every use:

1. **Read** the wrapper module and list everything it exports, including aliases.
2. **Grep** for each exported name across the codebase.

```ts
// src/lib/payments/index.ts
export { chargeCard as charge, refundCard as refund } from "./stripeClient";
export { refundCard } from "./stripeClient";
```

Grepping for `refundCard` finds some callers. Callers that use `refund` from `lib/payments` only show up when you also grep for `refund(` (narrowed to files that import `lib/payments`).

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Using Grep to find `*.test.tsx` files | Grep searches contents, not paths | Glob `**/*.test.tsx` |
| Using Glob to find who calls a function | Glob matches file names only | Grep for the function name |
| Reading the whole repo before starting | Wastes context, buries the relevant code | Grep for entry points, then Read selectively |
| Retrying the same failing `Edit` | Non-unique anchor won't become unique | Longer anchor; else Read + Write |
| Write to make a one-line change in a big file | Risk of clobbering unrelated content | Edit with a unique anchor |
| Grepping only the original function name | Misses aliased re-exports | List the wrapper's exports, grep each name |

**Practice.** You need to find every file matching `**/*.test.tsx` across a repo. Which tool?

- A) `Grep`
- B) `Glob`
- C) `Read`
- D) `Write`

**Answer: B.** Glob matches file paths against patterns, which is exactly this task. A searches file contents, not names; C loads a file you already know about and can't search; D creates or overwrites files and doesn't search at all.

**Practice.** Claude needs to change one `retries: 3` to `retries: 5` in a generated config file where the same 6-line block, including `retries: 3`, appears 12 times with only a service-name comment above each. Edit has failed twice with a non-unique match. What should it do next?

- A) Retry the same Edit; it may succeed on the next attempt
- B) Use Glob to find the correct block
- C) Use Bash to delete the file and regenerate it from scratch
- D) Read the full file, make the change to the right block, and Write the file back

**Answer: D.** When Edit can't find a unique anchor, Read followed by Write is the reliable fallback because the full content is in hand and the right block can be identified by position. A repeats a deterministic failure; B matches file paths and can't locate text inside a file; C is destructive and doesn't make the targeted change.

**Practice.** You're new to a large service and need to understand how an incoming webhook ends up writing to the `refunds` table. What's the most effective approach?

- A) Read every file in `src/` first so you have full context
- B) Grep for the webhook route to find the handler, Read it, then follow its imports and calls with targeted Reads until you reach the database write
- C) Glob for `**/*.py` and read the results in alphabetical order
- D) Grep for every occurrence of the word "refund" and Read all matching files

**Answer: B.** Starting from a precise entry point and following the actual call chain builds understanding with the fewest reads and keeps irrelevant code out of context. A floods the context window with mostly irrelevant files; C lists files but gives no order of relevance; D matches far too many files on a common word and still requires reading most of them.

<!-- support-footer -->
---

> Created by **Utkarsh Agarwal** — certified Claude Certified Architect (Foundations & Professional).
> Found this useful? [⭐ Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) · [💼 Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) · [☕ Buy me a coffee](https://utkarsh1agarwal.github.io/claude-architect-exam-guide/#support)
