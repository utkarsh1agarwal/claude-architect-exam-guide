# Domain 2: Tool Design & MCP Integration (18%)

Tools are how agents actually *do* things in the world. This domain is about designing tool interfaces and MCP integrations that a model can use reliably — most of it comes down to writing better descriptions and structuring errors well, which is cheap to fix once you know to look for it.

## 2.1 Tool Description Quality Is the #1 Selection Lever

**Concept.** The tool **description** — not the name, not the system prompt — is the primary signal the model uses to choose between tools. Minimal descriptions ("Retrieves customer information") cause misrouting whenever two tools overlap in purpose.

**Fix ladder — always start at the top, since it's the lowest-effort, highest-leverage move:**

1. Rewrite descriptions: include input formats, example queries, edge cases, explicit "use this vs. that" boundaries.
2. Rename tools to eliminate conceptual overlap (`analyze_content` → `extract_web_results`, scoped explicitly to web content).
3. Split an overly generic tool into purpose-specific tools (`analyze_document` → `extract_data_points` + `summarize_content` + `verify_claim_against_source`).
4. *(Only if still needed)* Add few-shot examples for genuinely ambiguous residual cases — see [Domain 4](domain-4-prompt-engineering.md#few-shot-prompting).

**Watch for:** system-prompt wording that creates unintended keyword associations, silently overriding otherwise-good tool descriptions.


**Practice.** `get_customer` ("Retrieves customer information") and `lookup_order` ("Retrieves order details") are frequently confused by the agent for order-status queries. What's the most effective *first* step?

A) 5–8 few-shot examples of correct routing
B) Expand both descriptions with input formats, example queries, and explicit boundary conditions
C) A keyword-based pre-routing layer
D) Merge into one `lookup_entity` tool

**Answer: B.** Description quality is always the first, lowest-effort, highest-leverage fix — before few-shot examples, before architectural changes.

## 2.2 Structured MCP Error Responses

**Concept.** MCP tools signal failure via the `isError` flag. Generic errors ("Operation failed") strip the agent of the context it needs to react appropriately. Structure errors instead with:

- `errorCategory`: `transient` | `validation` | `business` | `permission`
- `isRetryable`: boolean
- A human-readable description

**Critical distinction:** an **access failure** (a timeout — needs a retry decision) is not the same as a **valid empty result** (the query succeeded; there's just nothing there). Conflating these is a common anti-pattern.


**Practice.** A search subagent times out mid-query. What's the best way for it to report this to the coordinator?

A) Return an empty result set marked as success
B) Retry silently forever until it succeeds
C) Return structured error context: failure type, what was attempted, any partial results, possible alternatives
D) Terminate the entire multi-agent workflow immediately

**Answer: C.** Option A masks failure as success; D over-reacts to a single, possibly recoverable failure. Structured context lets the coordinator make an informed recovery decision.

## 2.3 Tool Distribution & `tool_choice` Across Agents

**Concept.** Giving one agent too many tools (say, 18 instead of 4–5) degrades tool-selection reliability — more options mean more decision complexity and more misuse (e.g., a synthesis agent attempting web searches it has no business doing). **Scope tools per role.**

**But:** for a *high-frequency* cross-role need (e.g., a synthesis agent needing simple fact verification 85% of the time), it's reasonable to give that agent **one scoped tool** (`verify_fact`) rather than routing every single verification through the coordinator — while still routing the rarer, complex 15% through the coordinator as before.

`tool_choice` options worth knowing:

| Value | Behavior |
|---|---|
| `"auto"` | Model may respond with plain text instead of calling a tool |
| `"any"` | Model must call *some* tool, but picks which |
| `{"type": "tool", "name": "X"}` | Model must call tool `X` specifically (forced) |


**Practice.** A synthesis agent needs simple fact-checks (dates, names, stats) constantly, currently routed through the coordinator → web-search agent → back, adding 40% latency. 85% of these checks are simple; 15% need deep investigation. Best fix?

A) Give the synthesis agent full access to all web search tools
B) Give the synthesis agent one scoped `verify_fact` tool for the simple 85%; keep coordinator-routed delegation for the complex 15%
C) Batch all verification requests to send at the end
D) Have the search agent proactively cache extra context speculatively

**Answer: B.** This applies the principle of least privilege — give the agent exactly what it needs for the common case, without over-provisioning it for everything.

## 2.4 MCP Server Scoping & Configuration

| Scope | File | Use case |
|---|---|---|
| Project | `.mcp.json` | Shared team tooling, version-controlled |
| User | `~/.claude.json` | Personal/experimental servers |

- Supports environment-variable expansion (`${GITHUB_TOKEN}`) so secrets never get committed.
- All configured servers' tools are discovered and available **simultaneously**.
- Prefer an existing, well-maintained community MCP server (e.g., for Jira, GitHub, Slack) over building a custom one, unless the integration is genuinely team-specific.

```json
// .mcp.json — project-scoped, version-controlled
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "@example/jira-mcp-server"],
      "env": { "JIRA_TOKEN": "${JIRA_TOKEN}" }
    }
  }
}
```


**Practice.** Which config location is correct for a Jira MCP server your whole team should use, with a token that must never be committed to git?

A) `~/.claude.json` with the token hardcoded
B) `.mcp.json` with `${JIRA_TOKEN}` env-var expansion
C) `CLAUDE.md` with the token in a code block
D) A `.env` file referenced nowhere in Claude Code config

**Answer: B.**

## 2.5 Built-in Tools

| Tool | Use for |
|---|---|
| `Grep` | Content search — find function callers, error strings, imports |
| `Glob` | File-*path* pattern matching — find files by name/extension |
| `Read` / `Write` | Full file load / full file overwrite |
| `Edit` | Targeted change via unique anchor text |
| Read + Write fallback | When `Edit` fails due to a non-unique anchor match |

**Exploration pattern:** start with `Grep` to find entry points, then `Read` to follow imports and trace flow — rather than reading every file upfront.


**Practice.** You need to find every file matching `**/*.test.tsx` across a repo. Which tool?

A) `Grep`
B) `Glob`
C) `Read`
D) `Bash` with `find`

**Answer: B.** `Grep` is content search; `Glob` is path-pattern matching — a common exam confusion pair.

## 2.6 MCP Tool Descriptions vs. Built-in Tool Preference

**Concept.** Description quality (2.1) matters *between* MCP tools, but it also matters **between an MCP tool and a built-in tool**. Claude has strong priors toward well-known built-ins like `Grep`. If a connected MCP server exposes something more capable (e.g., a `search_codebase` tool with semantic, cross-reference-aware search) but describes it thinly, Claude will default to `Grep` even when the MCP tool would give a better result — not because the MCP tool is broken, but because its description doesn't out-compete the built-in's familiarity.

**Fix:** enhance the MCP tool's description to explicitly explain its capabilities and output *in detail* — enough to make the case for why it beats the built-in for a given kind of query.


**Practice.** A connected MCP server exposes a `search_codebase` tool that performs semantic, cross-reference-aware search — meaningfully more capable than `Grep` for the query type a developer is asking about. Logs show Claude keeps reaching for `Grep` anyway. What's the most likely cause and fix?

A) MCP tools are always deprioritized versus built-ins by design and this can't be changed
B) The MCP tool's description under-sells its capability relative to the well-known built-in; enhance the description to make the capability and output explicit
C) The MCP server needs to be moved from project scope to user scope
D) `Grep` needs to be removed from the agent's tool list entirely

**Answer: B.** Removing `Grep` (D) overcorrects and breaks legitimate simple-search use cases; scope (C) isn't the issue — description quality is.

## 2.7 MCP Resources vs. Tools

**Concept.** MCP servers expose two distinct primitives, and the exam expects you to tell them apart:

| Primitive | What it is | How it's used |
|---|---|---|
| **Tool** | An action the model *decides* to invoke, with inputs it constructs | Model-driven — Claude chooses when and how to call it based on the conversation |
| **Resource** | A read-only content catalog — a URI-addressable list of what exists (issue lists, doc hierarchies, DB schemas, file trees) | Application- or user-driven — surfaced *before* the model needs to guess, so it doesn't burn tool calls just discovering what's available |

The practical difference: if an agent has to make an exploratory tool call just to find out *what issues exist* before it can act on one, that's a sign the server should be exposing a **resource** (a catalog it can read directly) rather than forcing discovery through **tool** calls.

**Fix ladder for resource vs. tool confusion:**

1. If the model repeatedly makes "list/discover" tool calls before every real action, expose that catalog as an MCP **resource** instead — it removes a full round trip per task.
2. Keep **tools** for anything that takes an action or requires model-constructed parameters (creating an issue, running a query with a specific filter).
3. Don't conflate the two in one interface — a tool named `list_resources` that returns a static catalog is a resource wearing a tool's clothing, and it still costs a model decision + round trip that a true resource wouldn't.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Every task starts with a `list_projects`-style tool call just to see what's available | Burns a full model round trip on pure discovery, before any real work starts | Expose the project catalog as an MCP **resource** the agent can read directly |
| Static, rarely-changing catalogs (a DB schema, a fixed doc hierarchy) implemented as tools | Treats read-only reference data as if it required a model decision to fetch | Model reference/catalog data as **resources**, reserve tools for actions |
| Resources used for anything that mutates state | Resources are read-only by design; forcing a write through a "resource" hides a side effect the model should reason about explicitly | Keep any state-changing operation as a **tool**, never a resource |


**Practice.** An MCP server for a project-tracking tool requires the agent to call `list_all_projects` before nearly every task, just to look up which project ID to use — burning an extra round trip almost every time. What's the most appropriate fix?

A) Rewrite `list_all_projects`'s description to be more detailed
B) Expose the project list as an MCP **resource** instead of a tool, since it's read-only reference data the agent needs to see, not an action it decides to take
C) Force `tool_choice` to always call `list_all_projects` first
D) Cache the tool's output in `CLAUDE.md`

**Answer: B.** This is a tools-vs-resources modeling problem, not a description-quality problem (2.1) or a caching problem — read-only catalogs that exist to be *discovered* belong in MCP resources, not tools.

