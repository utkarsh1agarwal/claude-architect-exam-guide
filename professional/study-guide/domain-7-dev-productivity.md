# Domain 7: Developer Productivity and Operational Enablement (8%)

This domain is small — about **5 scored items** — but it is the most product-specific part of the exam. It went up slightly from 7% in v1.0, and the content moved from general "configure tools for teams" advice to concrete Claude Code and Agent SDK mechanics: **plugins, marketplaces, managed settings, permission modes (including `auto` and `dontAsk`), hooks, subagents, headless/CI runs**, and a new skill on **human accountability for AI-generated code**.

Expect artifacts: a plugin directory, a `settings.json` or managed-settings file, a CI job, a branch-protection setup. The exam's core rule applies more strongly here than anywhere else: **enforce, don't instruct**. Text in a prompt or `CLAUDE.md` shapes what Claude *tries* to do. Permission rules, hooks, managed settings and repository controls decide what *can* happen.

## At a glance

| # | Skill | Core question | Strongest answers usually involve |
|---|---|---|---|
| 7.1 | Packaging and distributing Claude Code workflows | How does a workflow that works for one team reach 40 teams — and stay safe when nobody is watching? | Plugin + internal marketplace + managed settings for the non-negotiable parts |
| 7.2 | Agent SDK and Claude Code configuration | Which mode, rules, hooks and subagent definitions meet the stated guardrails? | The least-permissive mode that still finishes the job; deny/ask rules; hooks for checks a pattern can't express; isolation for bypass |
| 7.3 | Accountability for AI-generated code | Who owns code Claude wrote, and what forces a human to stand behind it? | Repository-enforced named human approval, engineer recorded as author, stale approvals dismissed |

---

## 7.1 Packaging and Distributing Claude Code Workflows

**What the exam is testing.** A team has a workflow that works: a skill, a review subagent, a safety hook, an MCP server. Leadership wants it everywhere. You must choose **how to package it** (a plugin), **how to distribute it** (a marketplace), and **which parts to enforce centrally** (managed settings) versus leave to teams — so that the workflow still behaves safely in headless runs where nobody can approve a prompt.

**Concept.**

- **Plugin** — a directory that bundles Claude Code extensions so they install as one unit: skills, subagents (agents), slash commands, hooks and MCP server configuration. Components are namespaced under the plugin name (an agent `reviewer` in plugin `release-kit` appears as `release-kit:reviewer`). The manifest `.claude-plugin/plugin.json` is optional; without it, Claude Code loads components from the standard layout.
- **Marketplace** — a catalog of plugins (for example, a Git repository) that users or admins add as a source. Internal marketplaces are how an organization publishes its own plugins.
- **Managed settings** — settings deployed by administrators (via MDM, a managed file, or the admin console as server-managed settings) that take precedence over user and project settings. This is where the *non-negotiable* parts live.

Key managed-settings controls (all confirmed in current docs):

| Setting | What it does |
|---|---|
| `extraKnownMarketplaces` | Adds your internal marketplace for everyone |
| `enabledPlugins` | In managed scope, `true` force-enables a plugin; `false` blocks it everywhere |
| `strictKnownMarketplaces` | Restricts which marketplaces users may add |
| `allowManagedHooksOnly` | Only managed hooks, Agent SDK hooks and hooks from **force-enabled** plugins run |
| `allowManagedPermissionRulesOnly` / `allowManagedMcpServersOnly` | Only managed permission rules / MCP servers apply |
| `strictPluginOnlyCustomization` | `true`, or a list from `"skills"`, `"agents"`, `"hooks"`, `"mcp"`, restricting those customization types to plugins — use the list form to lock only what must be locked |
| `permissions.deny` | Deny rules that apply in every permission mode |

Two mechanics that the exam likes:

1. **Plugin subagents ignore `hooks`, `mcpServers` and `permissionMode` frontmatter** (a security decision in Claude Code). If a plugin's safety check lives in a subagent's frontmatter, it silently doesn't run. Put hooks in the plugin's `hooks/hooks.json`, which applies to the session.
2. **Headless runs install plugins in the background.** In `-p` mode, plugins may not be ready on the first turn — so the first turn can run *without* the plugin's hooks. Set `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1` to wait for installation (optionally bounded by `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`), or deliver the critical rule through managed settings, which don't depend on plugin install.

**Simple worked example — a plugin directory tree.**

```text
release-kit/
├── .claude-plugin/
│   └── plugin.json          # name, version, description, author
├── skills/
│   └── changelog/
│       └── SKILL.md         # how to write release notes (team can extend)
├── agents/
│   └── migration-reviewer.md  # read-only reviewer subagent (tools: Read, Grep, Glob)
├── commands/
│   └── release-check.md     # /release-kit:release-check (skills/ preferred for new work)
├── hooks/
│   └── hooks.json           # PreToolUse: block writes to db/migrations/applied/**
├── scripts/
│   └── guard-migrations.sh  # called by the hook
└── .mcp.json                # internal "deploy-status" MCP server
```

```json
// .claude-plugin/plugin.json
{
  "name": "release-kit",
  "version": "2.3.0",
  "description": "Release checks, changelog skill, migration reviewer",
  "author": { "name": "Platform Enablement" }
}
```

```json
// hooks/hooks.json  (note the top-level "hooks" wrapper)
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|Bash",
        "hooks": [
          { "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/guard-migrations.sh" }
        ]
      }
    ]
  }
}
```

**Simple worked example — managed settings.**

```json
{
  "extraKnownMarketplaces": {
    "northwind-internal": {
      "source": { "source": "github", "repo": "northwind/claude-plugins" }
    }
  },
  "enabledPlugins": {
    "release-kit@northwind-internal": true,
    "unvetted-helper@community-market": false
  },
  "allowManagedHooksOnly": true,
  "strictPluginOnlyCustomization": ["hooks", "mcp"],
  "permissions": {
    "deny": ["Bash(git push --force *)", "Read(./.env)", "Read(./secrets/**)"]
  }
}
```

What this achieves: everyone sees the internal marketplace; `release-kit` is force-enabled (so its hooks still run under `allowManagedHooksOnly`) and users can't turn it off; a known-bad plugin is blocked; only vetted hooks and MCP servers load; a few deny rules hold in every mode. Skills and agents are **not** locked, so teams can still add their own.

**Decision table — central vs team control.**

| Control | Central (managed) | Team (project/plugin, overridable) |
|---|---|---|
| Safety hook that must run in unattended jobs | ✔ force-enabled plugin or managed hook | |
| Deny rules for secrets, force-push, production credentials | ✔ | |
| Which marketplaces are trusted | ✔ | |
| MCP servers that reach internal systems | ✔ (if risk is high) | |
| Coding-style skills, changelog templates | | ✔ |
| Extra read-only subagents | | ✔ |
| Formatting hooks with no safety role | | ✔ |

Rule of thumb: **centralize what must not fail, delegate what teams need to adapt.** Full lockdown (`strictPluginOnlyCustomization: true`) is an over-correction when the stem says teams need flexibility.

**Anti-pattern → fix.**

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Safety check in a plugin subagent's `hooks:` frontmatter | Ignored for plugin subagents | Move it to `hooks/hooks.json` |
| Share the workflow as a wiki page + "copy this `.claude/` folder" | Drifts; no versioning; users can delete it | Plugin in an internal marketplace |
| Rely on a project-scope install for a mandatory hook | Users or repos can disable it | Force-enable via managed `enabledPlugins` |
| Headless CI job assumes plugin hooks are active on turn 1 | Background install race | `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1`, or managed hook |
| Put the rule in `CLAUDE.md` ("never edit applied migrations") | Context, not enforcement | PreToolUse hook or deny rule |
| Marketplace allowlist used to make a hook run | Controls *where plugins come from*, not *whether a hook runs* | Force-enable + managed hooks |

**Exam traps.**
- A **telemetry alert** on plugin load (Claude Code emits a `plugin_loaded` event) detects a missing plugin after the fact; it doesn't prevent the unprotected run.
- `allowManagedHooksOnly` will also switch off a plugin's hooks **unless that plugin is force-enabled** — easy to miss in a two-setting question.
- `commands/` still works, but current docs prefer `skills/` for new plugin content.

**Practice.**

**Q1.** Brightline's platform team distributes a `secure-ci` plugin whose `agents/deployer.md` subagent declares a `hooks:` block that blocks `terraform apply`. In a headless nightly job, the subagent ran `terraform apply` on staging. **Select TWO** changes that make the block reliable.

A) Move the PreToolUse hook into the plugin's `hooks/hooks.json`.
B) Add "Never run terraform apply" to the subagent's prompt in capital letters.
C) Set `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1` in the nightly job so the plugin is installed before the first turn.
D) Add the marketplace to `strictKnownMarketplaces`.

**Answer: A and C.** Plugin subagents ignore `hooks` frontmatter, so the hook must live in `hooks/hooks.json` (A). In `-p` mode the plugin may still be installing on the first turn, so C closes the race. B is an instruction, not enforcement. D controls where plugins come from, not whether a hook runs.

**Q2.** An enterprise wants every engineer to have the `release-kit` plugin with its migration-guard hook, while letting teams add their own skills and read-only subagents. It already sets `allowManagedHooksOnly: true`. Which configuration fits?

A) Managed `enabledPlugins: {"release-kit@internal": true}` plus `extraKnownMarketplaces` for the internal marketplace.
B) `strictPluginOnlyCustomization: true` and ask teams to request plugin changes.
C) Project-level `.claude/settings.json` enabling the plugin in each repo.
D) Keep the plugin optional and add a `CLAUDE.md` reminder to install it.

**Answer: A.** Force-enabling via managed settings means users can't disable it, and hooks from force-enabled plugins still run under `allowManagedHooksOnly`. C is tempting, but a project-scope enable isn't force-enabled, so under `allowManagedHooksOnly` its hook wouldn't run, and repos can change it anyway. B over-locks against the flexibility requirement. D is an instruction.

**Official docs:**
[Plugins](https://code.claude.com/docs/en/plugins) ·
[Plugin manifest reference](https://code.claude.com/docs/en/plugins-reference) ·
[Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) ·
[Settings](https://code.claude.com/docs/en/settings) ·
[Subagents](https://code.claude.com/docs/en/sub-agents) ·
[Headless mode](https://code.claude.com/docs/en/headless)

---

## 7.2 Agent SDK and Claude Code Configuration

**What the exam is testing.** Given a team workflow and stated guardrails ("runs unattended in CI", "must never push", "a developer is present", "edits only under `src/`"), pick the permission mode, rules, hooks and subagent definitions that meet them — no more permissive than needed, no so locked that the job can't finish.

**Concept 1 — the evaluation order (Agent SDK).** Each tool call goes through six steps:

```text
1. Hooks (PreToolUse)   → can deny/allow/ask/defer; a hook deny applies even in bypassPermissions
2. Deny rules           → match = blocked, in every mode
3. Ask rules            → match = prompt, in every mode (in dontAsk: denied)
4. Permission mode      → e.g. acceptEdits approves edits; bypassPermissions approves the rest
5. Allow rules          → match = approved
6. canUseTool callback  → your code decides (in dontAsk: becomes a deny)
```

Important consequences:
- A hook `allow` **does not skip** deny and ask rules.
- An explicit **ask-rule match prompts in every mode**, including `bypassPermissions`. No mode auto-approves it.
- Calls approved at step 4 or 5 **never reach `canUseTool`**. If your audit logic lives in `canUseTool`, `bypassPermissions` skips it.

**Concept 2 — permission modes.**

| Mode | Who's present | What runs without asking | Use when |
|---|---|---|---|
| `default` (shown as "Manual") | A developer approving prompts | Reads in working dirs, read-only Bash, allow-listed tools | Unfamiliar repo, sensitive work |
| `acceptEdits` | Developer, reviewing diffs | Above + file edits (and common filesystem commands) | Trusted refactors with a human watching |
| `plan` | Developer | Read-only exploration; Claude proposes a plan, makes no changes | Design before touching code |
| `auto` | Developer, but not approving each step | A classifier model reviews each action before it runs | Long interactive tasks with varied commands. It is the built-in starting mode for interactive terminal/VS Code sessions in recent versions. Not a fit where advance human review of each action is required |
| `dontAsk` | **Nobody** | Only allow-listed tools plus actions that never need approval (reads, read-only Bash); anything that would prompt is **denied** | Locked-down CI with a reviewed allowlist. Set with `--permission-mode dontAsk` |
| `bypassPermissions` | Nobody | Everything not denied, not ask-matched, and not on the "no mode auto-approves" list | **Isolated containers/VMs only** |

**Concept 3 — what rules can't do.**
- Bash pattern rules match **command text**. `Bash(git push *)` doesn't match `git -C . push`, and argument-constraining patterns like `Bash(curl https://api.internal/*)` are fragile. For logic, use a **PreToolUse hook** that inspects the full command.
- Rules approve or block a *call*. They **don't constrain what an approved process does** — `npm test` can run any script in `package.json`, and a Python script can open any file. For that, use **sandboxing or a container**.
- To restrict file writes, write `Edit(path)` rules; Claude Code checks writes against `Edit` and `Read` rules, not `Write(path)`.

**Concept 4 — hooks.** PreToolUse hooks return `permissionDecision`: `allow`, `deny`, `ask`, or `defer` (pause and resume, for apps that run `claude -p` as a subprocess). `PostToolUse` fires only after a **successful** call. A `Stop` hook can force Claude to keep going, but Claude Code overrides it after **8 consecutive** continuations (the count resets when Claude calls a tool), so a Stop hook is not an infinite "keep working until perfect" loop.

**Concept 5 — subagents.** A subagent gets its own context and only the task text; the parent gets its final message. For permissions: a subagent **inherits** `plan`, `acceptEdits`, `auto` or `bypassPermissions` from the parent session, overriding the subagent's own mode. Under a `default` or `dontAsk` parent it uses its own setting — but Claude Code never applies a subagent-defined `bypassPermissions`. **To restrict a subagent under a permissive parent, narrow its `tools` list.**

```markdown
---
name: dependency-auditor
description: Reads lockfiles and reports vulnerable packages. Never edits.
tools: Read, Grep, Glob
---
You audit dependencies and return a table of package, version, advisory.
```

**Simple worked example — a CI job.**

```yaml
# .github/workflows/claude-test-fix.yml (excerpt)
- name: Fix failing unit tests
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    CLAUDE_CODE_SYNC_PLUGIN_INSTALL: "1"
  run: |
    claude -p "Run the unit tests. Fix failures in src/ only. Do not change tests." \
      --permission-mode dontAsk \
      --allowedTools "Read,Grep,Glob,Edit,Bash(npm run test *)" \
      --disallowedTools "Bash(git push *)" \
      --max-turns 20 \
      --max-budget-usd 5 \
      --output-format json > result.json
    jq -e '.subtype == "success"' result.json
```

Why each line is there:

| Flag / setting | Purpose |
|---|---|
| `-p` | Headless (print) mode — no interactive session |
| `--permission-mode dontAsk` | Nobody is there to approve; anything off the allowlist is denied rather than hanging |
| `--allowedTools` | The reviewed allowlist — the job can read, edit and run tests, nothing else |
| `--max-turns`, `--max-budget-usd` | Bound runaway loops and cost (no default turn limit in print mode); results report `error_max_turns` / `error_max_budget_usd` |
| `--output-format json` | Machine-readable result for the next pipeline step |
| `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1` | Plugin hooks are ready before turn 1 |
| Edit restriction to `src/` | Enforce with an `Edit` deny rule or a PreToolUse hook in settings — the prompt text alone doesn't enforce it |

The CI runner itself should be an ephemeral container, because rules don't constrain what `npm run test` executes.

**Simple worked example — Agent SDK (Python sketch).**

```python
options = ClaudeAgentOptions(
    permission_mode="dontAsk",
    allowed_tools=["Read", "Grep", "Glob", "Edit", "Bash(npm run test *)"],
    disallowed_tools=["Bash(git push *)"],
    hooks={"PreToolUse": [HookMatcher(matcher="Edit", hooks=[block_outside_src])]},
    agents={"dependency-auditor": AgentDefinition(
        description="Read-only dependency audit",
        prompt="Report vulnerable packages.",
        tools=["Read", "Grep", "Glob"])},
    max_turns=20,
)
```

**Decision table — pick the mode.**

| Scenario | Mode |
|---|---|
| Nightly CI fixes lint errors; no human; reviewed tool list | `dontAsk` + allowlist |
| Throwaway container, broad task, network-isolated, results reviewed later | `bypassPermissions` (in the container) + deny rules for anything still off-limits |
| Developer pairing on a 2-hour migration with many varied commands | `auto` |
| Developer wants to review every diff but not approve each one | `acceptEdits` |
| Architect wants a proposal before any change | `plan` |
| Security policy: every shell command needs a human's prior approval | `default` (not `auto` — the classifier replaces human review) |

**Anti-pattern → fix.**

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| `bypassPermissions` on a developer laptop with a blocklist of "dangerous" commands | Blocklists miss variants; host isn't isolated | `dontAsk` + allowlist, or bypass only inside a container |
| `dontAsk` for open-ended interactive work | Anything unlisted is denied; the task can't finish | `auto` or `acceptEdits` with a developer present |
| `acceptEdits` + a logging hook to "control" edits | Logs detect; edits already landed | Deny rules / PreToolUse hook that blocks |
| Read-only subagent defined with `permissionMode: plan` under a `bypassPermissions` parent | Parent mode wins | Narrow the subagent's `tools` list |
| Audit logic only in `canUseTool` | Allow-listed and bypass-approved calls never reach it | Put mandatory checks in a PreToolUse hook (step 1) |
| Ask-before-push configured in a headless job | Nobody can answer; under `dontAsk` it becomes a denial | Decide explicitly: deny the push, or let a later human-gated stage push |
| `Bash(curl https://api.internal/*)` as a network control | Pattern rules match text and are easy to sidestep | Deny `curl`/`wget`, use WebFetch domain rules, add the sandbox network allowlist |

**Exam traps.**
- "No mode auto-approves an explicit ask rule" — even `bypassPermissions`.
- **Deny rules apply in every mode**, including bypass.
- A PreToolUse hook that returns `allow` doesn't override a deny rule.
- `auto` is classifier-reviewed, not human-reviewed. If the stem requires human sign-off per action, `auto` is wrong.

**Practice.**

**Q3.** A team runs Claude Code in GitHub Actions to regenerate API client code. Requirements: no human present, may edit only files under `clients/`, may run `make generate`, must never push. Which configuration best meets them?

A) `--permission-mode bypassPermissions` with a CLAUDE.md note "only edit clients/ and never push".
B) `--permission-mode dontAsk`, `--allowedTools "Read,Grep,Glob,Edit,Bash(make generate)"`, an `Edit` deny rule (or PreToolUse hook) for paths outside `clients/`, and a deny rule for `git push`.
C) `--permission-mode default` with an ask rule on `git push`.
D) `--permission-mode auto` so the classifier blocks risky commands.

**Answer: B.** `dontAsk` fits an unattended run, the allowlist bounds what runs, and deny rules or a hook enforce the path and push limits. A relies on instructions in the most permissive mode. C would block waiting for approval with nobody present. D is meant for interactive sessions and replaces explicit rules with a classifier judgment.

**Q4.** An Agent SDK app runs with `permission_mode="bypassPermissions"` inside a sandbox container. It defines a `report-writer` subagent with `permissionMode: plan`, intending it to be read-only. Logs show the subagent editing files. What is the correct fix?

A) Change the subagent's `permissionMode` to `dontAsk`.
B) Add "do not edit files" to the subagent's prompt.
C) Move the check into `canUseTool`.
D) Set the subagent's `tools` list to read-only tools (for example `Read`, `Grep`, `Glob`).

**Answer: D.** A parent in `bypassPermissions` overrides the subagent's mode, so any mode setting (A) is ignored; the `tools` list still applies. B is an instruction. C fails because bypass-approved calls never reach `canUseTool`.

**Official docs:**
[Agent SDK permissions](https://code.claude.com/docs/en/agent-sdk/permissions) ·
[Permission modes](https://code.claude.com/docs/en/permission-modes) ·
[Configure permissions](https://code.claude.com/docs/en/permissions) ·
[Hooks](https://code.claude.com/docs/en/hooks) ·
[Subagents](https://code.claude.com/docs/en/sub-agents) ·
[Headless mode](https://code.claude.com/docs/en/headless) ·
[CLI reference](https://code.claude.com/docs/en/cli-reference) ·
[Sandboxing](https://code.claude.com/docs/en/sandboxing)

---

## 7.3 Accountability for AI-Generated Code

**What the exam is testing.** A team adopts AI-assisted development. The stem describes their review process and a gap — usually one where AI-written code can reach `main` without a human who is accountable for it. You pick the **control that preserves human ownership**. Strong answers are **repository-enforced** (branch protection, required reviewers), not policies or after-the-fact audits.

**Concept.** Human ownership needs three things:

1. **A named accountable author.** The engineer who directed Claude is recorded as the author of the change (commit author or PR opener; Claude can be credited as co-author). This matters because "authors can't approve their own PR" rules only work if the real author is on record. If a bot account opens the PR, the directing engineer can approve "someone else's" PR — a self-approval loophole.
2. **A required human approval before merge**, enforced by the repository: branch protection with required reviews, plus **CODEOWNERS** so the people who own a path must approve changes to it.
3. **Approvals that stay valid only for what was reviewed.** Turn on **dismiss stale approvals** (and require approval of the most recent push) so if Claude pushes new commits after approval, the approval is cleared.

**Where AI review fits.** Anthropic's managed **Code Review** posts inline findings and a check run that never concludes as a failure — by itself it doesn't approve or block a PR. A repository's **Claude Approvals** policy file can count its result toward approvals for paths the policy names (for example, low-risk test fixtures). That is a deliberate, scoped delegation. For production paths, a named human approver still owns the merge. A second AI reviewer is not a substitute for human accountability.

**Simple worked example — repository controls.**

```text
# .github/CODEOWNERS
/payments/**        @northwind/payments-leads
/infra/terraform/** @northwind/platform-sre
*                   @northwind/eng-reviewers
```

```text
Branch protection for main
  ✔ Require a pull request before merging
  ✔ Require approvals: 1
  ✔ Require review from Code Owners
  ✔ Dismiss stale pull request approvals when new commits are pushed
  ✔ Require approval of the most recent reviewable push
  ✔ Require status checks: unit-tests, lint
  ✔ Do not allow bypassing the above settings
```

```text
Team policy (enforced by tooling, not just written down)
  - Claude-authored commits carry the directing engineer as author and
    "Co-Authored-By: Claude" as co-author.
  - Automation that opens PRs sets the requesting engineer as PR author/assignee.
  - Claude Approvals policy: may count Code Review toward approval for
    tests/fixtures/** only; never for /payments or /infra.
```

**Decision table.**

| Gap in the stem | Control that fixes it |
|---|---|
| AI-authored PRs merged with no human approval | Branch protection requiring human approval + CODEOWNERS |
| Engineer approved a PR their own Claude session wrote | Record the engineer as author so self-approval is blocked |
| Claude pushed fixes after approval; merged unreviewed | Dismiss stale approvals / require approval of latest push |
| Team treats the Code Review check as the approval | Required human reviewer; scope any Claude Approvals policy narrowly |
| Nobody can say who owns a bug in AI-written code | Named author + CODEOWNERS for the path |
| Headless job opens and merges its own PRs | Remove merge rights from the job's identity; human approval gate |

**Anti-pattern → fix.**

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Add a second AI reviewer | Still no accountable human | Required human approval |
| Monthly telemetry audit of AI commits | Detects after merge | Pre-merge required review |
| "Engineers must review AI code carefully" policy doc | Instruction, not enforcement | Branch protection + CODEOWNERS |
| Require two approvers on every PR | Over-correction; slows all work, doesn't fix self-approval | Correct authorship + one owning approver |
| Bot account as PR author | Breaks self-approval rule | Directing engineer as author |
| Ask-before-push in a headless job | Nobody can answer in CI | Let the job open a PR; humans approve the merge |

**Exam traps.**
- "Code Review never blocks a PR" is true **by itself** — but a repo's Claude Approvals policy can count its result. Read the stem for that policy before you answer.
- Accountability controls are **pre-merge**. Logs, dashboards and audits are detection.
- The fix is usually **one repository setting**, not a new process.

**Practice.**

**Q5.** At Tessellate, engineers start Claude Code sessions that open PRs from a shared `ai-bot` account. Branch protection requires one approval and blocks authors from approving their own PRs. An engineer approved and merged a PR their own session created; it later caused an outage. **Select TWO** controls that restore human accountability.

A) Record the directing engineer as the commit/PR author so the self-approval block applies.
B) Add a second AI reviewer that must pass before merge.
C) Require review from CODEOWNERS for the affected paths.
D) Run a weekly report of merges made from the `ai-bot` account.

**Answer: A and C.** A closes the self-approval loophole created by the bot identity. C ensures the path's owners — named humans — must approve. B adds AI review without accountability, and D detects after the outage.

**Q6.** A team's PR was approved by a human reviewer. Claude then pushed three more commits addressing a lint failure, and the PR auto-merged. One commit removed an authorization check. What is the most targeted control?

A) Require two approvals on every PR.
B) Disable auto-merge for the whole organization.
C) Enable "dismiss stale approvals when new commits are pushed" (and require approval of the most recent push).
D) Add the managed Code Review check as a required status check.

**Answer: C.** The approval covered code the reviewer saw, not the later commits; dismissing stale approvals forces a human to re-approve. A is an over-correction, and the second approval could still be stale. B removes a useful feature without fixing the cause. D can't do it alone, because the Code Review check never concludes as a failure by itself.

**Official docs:**
[Code Review](https://code.claude.com/docs/en/code-review) ·
[Claude Approvals](https://code.claude.com/docs/en/approvals) ·
[GitHub Actions](https://code.claude.com/docs/en/github-actions) ·
[Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices) ·
GitHub docs on protected branches and CODEOWNERS

---

## Key takeaways

- **Package** proven workflows as **plugins** (skills, agents, commands, `hooks/hooks.json`, `.mcp.json`), **distribute** through an internal **marketplace**, and **enforce** the must-not-fail parts with **managed settings**.
- Plugin subagents **ignore** `hooks`, `mcpServers` and `permissionMode` frontmatter. Headless runs install plugins **in the background** unless `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1`.
- Evaluation order: **hooks → deny → ask → mode → allow → `canUseTool`**. Deny rules apply in every mode; explicit ask rules prompt in every mode.
- Match mode to presence: `dontAsk` for unattended CI with an allowlist; `bypassPermissions` only in isolated containers; `auto` for long interactive sessions; `default` when every action needs human sign-off.
- Pattern rules match command text and don't constrain what an approved process does — use **hooks** for logic and **sandboxes/containers** for blast radius.
- A subagent under a permissive parent inherits the parent's mode — restrict it with its **`tools` list**.
- Human ownership of AI code = **engineer recorded as author + required human (CODEOWNERS) approval + stale approvals dismissed**. AI review is input, not accountability.

## Confused pairs

| Pair | Difference |
|---|---|
| `dontAsk` vs `bypassPermissions` | `dontAsk` denies anything not pre-approved. `bypassPermissions` approves anything not denied or ask-matched. |
| `auto` vs `default` | `auto`: a classifier reviews actions. `default`: a human approves prompts. |
| Deny rule vs ask rule | Deny blocks in every mode. Ask prompts in every mode (and is denied under `dontAsk`). |
| Hook vs permission rule | Rule = pattern match on the call. Hook = your code, sees full input, can deny/allow/ask/defer. |
| Permission rule vs sandbox | Rule decides whether a call runs. Sandbox limits what the running process can touch. |
| `enabledPlugins: true` (managed) vs project enable | Managed force-enables (can't be turned off; hooks survive `allowManagedHooksOnly`). Project enable can be changed. |
| `strictKnownMarketplaces` vs `allowManagedHooksOnly` | First controls where plugins come from. Second controls which hooks run. |
| Subagent `tools` vs subagent `permissionMode` | `tools` always restricts. Mode can be overridden by a permissive parent. |
| Code Review vs Claude Approvals | Code Review posts findings and never fails by itself. Claude Approvals is a policy-driven check that can count Code Review toward approval for named paths. |
| `PostToolUse` vs `PreToolUse` | Post runs after a successful call (detect/format). Pre runs before (can block). |

---

[← Domain 6](domain-6-stakeholder-lifecycle.md) · [Cheat sheet →](cheat-sheet.md)
