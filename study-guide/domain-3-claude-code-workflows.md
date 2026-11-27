# Domain 3: Claude Code Configuration & Workflows (20%)

This domain is heavily config- and workflow-focused, and it maps cleanly onto skills most engineers already have — configuration hierarchies, YAML frontmatter, environment variables, CI flags. If you've configured a linter, a monorepo build tool, or a CI pipeline before, a lot of this will feel familiar.

## 3.1 CLAUDE.md Hierarchy

**Concept.** `CLAUDE.md` files are plain Markdown instructions that Claude Code loads into context automatically. Where a file lives decides who gets it and when it loads. The exam uses three levels:

```text
~/.claude/CLAUDE.md         # user-level: YOU only, every project, not shared via git
CLAUDE.md (repo root) or    # project-level: committed to version control,
  .claude/CLAUDE.md         #   applies to everyone who clones the repo
packages/billing/CLAUDE.md  # directory-level: scoped to that subdirectory
```

- **User-level** is personal. Nothing in `~/.claude/CLAUDE.md` reaches a teammate, because it never goes into git. Use it for your own preferences ("I prefer terse explanations").
- **Project-level** is the team contract: build commands, coding standards, review criteria. It is committed, so every clone and every CI run gets it.
- **Directory-level** files add instructions for one part of the tree. Claude loads `CLAUDE.md` files in the directories above where you started it at launch, and picks up a subdirectory's `CLAUDE.md` when it starts reading or editing files in that subdirectory.

All the loaded files are combined, not overridden; more specific files are read later. If two files contradict each other, Claude may follow either, so keep them consistent.

> Current Claude Code also supports `CLAUDE.local.md` (personal, project-specific, gitignored) and an organisation-managed `CLAUDE.md`. The exam focuses on the three levels above.

**Diagnostic pattern the exam loves:** "a new teammate isn't getting the team's conventions" → the conventions are probably in someone's **user-level** file (personal, not committed) instead of the **project-level** file.

### Keeping it modular: `@import` and `.claude/rules/`

A single 900-line `CLAUDE.md` is hard to maintain and wastes context on instructions that don't apply. Two tools split it up:

- **`@path/to/file.md` imports** pull another file into a `CLAUDE.md`. Relative paths resolve from the file that contains the import. Imported files can import others (up to four hops deep). Imports organise content but don't shrink it: the imported text still loads with the parent file.
- **`.claude/rules/*.md`** holds topic-specific rule files (`testing.md`, `api-conventions.md`, `deployment.md`). A rule file with no frontmatter loads every session, just like the project `CLAUDE.md`. A rule file with a `paths:` field loads only for matching files — that's [§3.3](#33-path-specific-rules).

**Worked example — monorepo with per-package imports.** A payments monorepo has three packages. The maintainers of each package know which shared standards apply to them, so each package's `CLAUDE.md` imports only those:

```markdown
<!-- packages/billing-api/CLAUDE.md -->
# Billing API
Maintainers: payments-platform team.

@../../docs/standards/api-conventions.md
@../../docs/standards/money-handling.md
@../../docs/standards/postgres-migrations.md

- Run `pnpm --filter billing-api test` before declaring a change done.
```

```markdown
<!-- packages/checkout-web/CLAUDE.md -->
# Checkout web app
@../../docs/standards/react-components.md
@../../docs/standards/accessibility.md
```

The React standards never load while someone works on the billing API, and the money-handling rules never load in the web app. Writing a path in backticks (`` `@docs/x.md` ``) mentions it without importing it.

**Worked example — splitting a monolithic root file.** The root `CLAUDE.md` had grown sections for testing, API design and deployment. Split it:

```text
CLAUDE.md                     # short: project overview, build/test commands
.claude/rules/
  testing.md                  # test framework, fixtures, naming
  api-conventions.md          # error format, pagination, versioning
  deployment.md               # release steps, feature flags
```

Each topic now has one owner and one file, diffs are easy to review, and any file can later gain a `paths:` field so it loads only where relevant.

### Debugging with `/memory`

When Claude follows a convention in one session but ignores it in another, check what was actually loaded before rewriting instructions. Run `/memory` inside the session: it lists the user and project memory files Claude Code knows about and lets you open them. A file you expected but don't see, or a file that lives under `~/.claude/` when it should be in the repo, usually explains the inconsistency. (`/context` also shows which memory files are in the current context.)

Typical causes of "works on my machine, not on theirs":

- the instruction is in your `~/.claude/CLAUDE.md`, not the project file;
- it's in a subdirectory `CLAUDE.md` that only loads when Claude touches that subdirectory;
- an `@import` points at a path that doesn't exist on the other machine.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Team conventions in `~/.claude/CLAUDE.md` | Only you get them; new hires and CI don't | Move them to the committed project `CLAUDE.md` |
| One giant root `CLAUDE.md` for every package | Irrelevant instructions in every session; merge conflicts | Per-package `CLAUDE.md` with selective `@import`s, or `.claude/rules/` topic files |
| Rewriting instructions "more firmly" when behavior differs between sessions | The file may not be loaded at all | Run `/memory` and confirm which files are loaded first |
| Copy-pasting the same standards into five package files | Copies drift apart | One shared standards file, imported where needed |

**Practice.** A developer joined the team last week. Claude Code follows the team's commit-message format perfectly for the tech lead but ignores it for the new developer, even in the same repository on the same branch. What is the most likely cause?

- A) The new developer's model version is older than the tech lead's
- B) The commit-message rules are in the tech lead's `~/.claude/CLAUDE.md` rather than the project's `CLAUDE.md`
- C) The project `CLAUDE.md` is too long and is being truncated
- D) The new developer needs to run `/compact` before committing

**Answer: B.** Same repo and branch but different behavior per person points to configuration that only one person has, and user-level `CLAUDE.md` is never committed, so moving the rules into the project file fixes it for everyone. A is unlikely and wouldn't single out one convention, C would affect both developers equally, and D compresses conversation history rather than loading missing instructions.

**Practice.** A monorepo has `services/ledger` (Go) and `apps/portal` (TypeScript). Shared standards live in `docs/standards/` as separate files. The team wants each package to get only the standards its maintainers consider relevant, without duplicating text. What should they do?

- A) Paste all standards into the root `CLAUDE.md` so every package sees them
- B) Put each package's standards in the developers' user-level `CLAUDE.md`
- C) Give each package its own `CLAUDE.md` that uses `@import` to pull in only the relevant standards files
- D) Ask developers to mention the relevant standards in each prompt

**Answer: C.** Per-package `CLAUDE.md` files with selective `@import`s keep one source of truth per standard and let maintainers choose what applies, which is exactly what the import syntax is for. A loads irrelevant standards everywhere, B isn't shared through version control, and D depends on every developer remembering every time.

**Practice.** Claude Code applied the team's API error-format rule yesterday but not today, and nobody changed the rule. What is the best first step?

- A) Run `/memory` to check which memory files are loaded in today's session
- B) Add "IMPORTANT" and capital letters to the rule
- C) Move the rule into a custom slash command
- D) Restart the machine to clear cached instructions

**Answer: A.** Inconsistent behavior across sessions is first a loading question, and `/memory` shows which memory files Claude Code actually has, for example revealing that the rule lives in a subdirectory file that hasn't loaded yet. B treats a possible loading problem as a wording problem, C makes an always-on standard depend on manual invocation, and D does nothing useful because the files are read from disk each session.

## 3.2 Custom Slash Commands & Skills

**Concept.** Slash commands and skills package a repeatable workflow behind a name you can type, such as `/review` or `/release-notes`. Scope works like `CLAUDE.md`: project-level files are committed and shared, user-level files are personal.

| Scope | Location | Invoked as | Shared with team? |
|---|---|---|---|
| Project command | `.claude/commands/review.md` | `/review` | Yes — version-controlled |
| Personal command | `~/.claude/commands/review.md` | `/review` | No |
| Project skill | `.claude/skills/review/SKILL.md` | `/review` (or loaded by Claude when relevant) | Yes — version-controlled |
| Personal skill | `~/.claude/skills/review-strict/SKILL.md` | `/review-strict` | No |

> In current Claude Code, custom commands have been merged into skills: `.claude/commands/` files keep working and are treated like skills, while the `.claude/skills/<name>/SKILL.md` layout adds a folder for supporting files and more frontmatter options.

**Worked example — a team command.** Commit this file and everyone who clones the repo gets `/review`:

```markdown
<!-- .claude/commands/review.md -->
---
description: Run the team's PR review checklist on the current branch
argument-hint: [base-branch]
---
Review the diff between the current branch and $ARGUMENTS (default: main).

Check, in order:
1. Every new endpoint validates input and uses the standard error format.
2. Database migrations are reversible.
3. New code has tests; no test was deleted without a reason in the PR description.

Report findings as a numbered list with file:line references. Say "No issues" if there are none.
```

`$ARGUMENTS` is replaced by whatever follows the command (`/review release/2.4`). `$0`, `$1`, … pick out individual arguments.

### `SKILL.md` frontmatter

The exam names three frontmatter options:

- **`context: fork`** — run the skill in an **isolated sub-agent context**. The sub-agent does the noisy work (reading dozens of files, generating ten design alternatives) and only its final result comes back, so the main conversation's context stays clean. The forked sub-agent doesn't see your conversation history, so the skill's instructions must stand on their own. An optional `agent:` field picks which sub-agent type runs it (for example `Explore`).
- **`allowed-tools`** — controls tool access while the skill runs. The exam's framing is restriction: list only what the skill needs (e.g., file writes for a doc generator, no `Bash`) so it can't take destructive actions.
- **`argument-hint`** — tells the developer what parameters the skill expects, e.g. `[issue-number]` or `[service-name] [environment]`, so someone who invokes it with no arguments knows what to supply.

> Current Claude Code detail: `allowed-tools` pre-approves the listed tools (no permission prompt) for that skill's turn; to remove tools outright, current versions add `disallowed-tools`. `argument-hint` is shown during autocomplete. Learn the exam's framing, but know the mechanics.

**Worked example — a forked analysis skill.**

```markdown
<!-- .claude/skills/dependency-map/SKILL.md -->
---
name: dependency-map
description: Trace which modules depend on a given package and summarise the blast radius of changing it
argument-hint: [package-name]
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob
---
Find every import of $ARGUMENTS across the repository.
Group callers by service. For each service, list the functions that use it.
Return only a summary table (service | call sites | risk notes), not raw search output.
```

The tracing may touch hundreds of files; the main session receives one table.

**Worked example — a narrow doc-generation skill.**

```markdown
<!-- .claude/skills/adr/SKILL.md -->
---
name: adr
description: Draft an Architecture Decision Record in docs/adr/
argument-hint: [short-title]
allowed-tools: Read, Write
---
Create docs/adr/NNNN-$ARGUMENTS.md using the next free number.
Use the sections: Context, Decision, Consequences, Alternatives considered.
```

### Personal variants

You want a stricter version of the team's `/review` for your own work. Don't edit `.claude/skills/review/` — that changes it for everyone on the next pull. Copy it to `~/.claude/skills/review-strict/SKILL.md` and change it there. Give it a **different name**: if a personal and a project skill share a name, one hides the other, which confuses anyone debugging "why does `/review` behave differently for you?".

### Skills vs `CLAUDE.md`

| Put it in `CLAUDE.md` (always loaded) | Put it in a skill (on demand) |
|---|---|
| Universal standards: naming, error format, "run tests before done" | Task-specific workflows: release notes, migration scaffolding, PR review checklist |
| Short facts Claude needs in every session | Multi-step procedures that only matter sometimes |
| Build and test commands | Anything with its own tool limits or that should run in a fork |

Rule of thumb: if it would be wrong for Claude not to know it during *any* task, it's `CLAUDE.md`. If it's a procedure you run *sometimes*, it's a skill.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Team command saved in `~/.claude/commands/` | Teammates never get it | Move to `.claude/commands/` (or `.claude/skills/`) and commit |
| Verbose analysis skill running in the main context | Floods the conversation, crowds out task context | `context: fork` |
| 200-line release procedure in `CLAUDE.md` | Loaded every session for a task done monthly | Make it a skill |
| Editing the shared skill to suit personal taste | Changes behavior for the whole team | Personal copy in `~/.claude/skills/` under a different name |

**Practice.** You want a `/review` command that runs your team's code review checklist, available to everyone who clones the repo. Where do you put it?

- A) `.claude/commands/` in the repo
- B) `~/.claude/commands/` on your machine
- C) Inside `CLAUDE.md`
- D) `.claude/config.json`

**Answer: A.** Project-scoped commands in `.claude/commands/` are committed with the repo, so every clone gets `/review`. B is personal and never shared, C would load the checklist into every session instead of on demand and doesn't create a command, and D is not a file Claude Code uses for commands.

**Practice.** You're building a "codebase exploration" skill that produces very long, noisy output as it traces dependencies, and you don't want this to clutter the main conversation context. Which frontmatter option addresses this?

- A) `argument-hint`
- B) `allowed-tools`
- C) `context: fork`
- D) `paths`

**Answer: C.** `context: fork` runs the skill in an isolated sub-agent and returns only its result, so the tracing noise stays out of the main conversation. A only tells the user what arguments to pass, B controls tool access rather than where output lands, and D is a rules-file field for conditional loading, not a skill isolation option.

**Practice.** A team's `/changelog` skill sometimes ran `git push` during testing. They want it to only read the git log and write `CHANGELOG.md`. What is the most direct change?

- A) Add "never push" to the project `CLAUDE.md`
- B) Set `allowed-tools` in the skill's frontmatter to the read and write tools it needs, leaving out general `Bash`
- C) Add `context: fork` so pushes happen in a sub-agent
- D) Move the skill to `~/.claude/skills/`

**Answer: B.** Scoping the skill's tool access in its own frontmatter is the targeted control for what a skill may do while it runs (in current Claude Code, pair it with `disallowed-tools` or permission deny rules to remove tools outright). A is a soft instruction loaded into every session, C still lets the sub-agent push, and D only changes who can see the skill.

**Practice.** Which content belongs in a skill rather than in the project `CLAUDE.md`?

- A) "All monetary values are integers in minor units (cents)"
- B) The command to run the test suite
- C) A 12-step procedure for cutting a release branch, used twice a month
- D) "Never commit directly to main"

**Answer: C.** A long, occasional procedure is exactly what on-demand skills are for, and keeping it out of `CLAUDE.md` saves context in every other session. A, B and D are short universal rules that should apply to every task, so they belong in the always-loaded `CLAUDE.md`.

## 3.3 Path-Specific Rules

**Concept.** A file in `.claude/rules/` can declare which files it applies to with a `paths:` field in YAML frontmatter. The rule loads into context only when Claude works with a file that matches one of the glob patterns (reading, editing or writing it). Until then it costs no tokens and adds no noise.

```markdown
<!-- .claude/rules/terraform.md -->
---
paths: ["terraform/**/*"]
---
# Terraform conventions
- Every resource gets `owner` and `cost_center` tags.
- No hard-coded regions; use `var.region`.
- Run `terraform fmt` and `terraform validate` after edits.
```

`paths` accepts a YAML list, written inline as above or one pattern per line:

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "src/api/**/*.sql"
---
```

Patterns are relative to the project root (the directory that holds `.claude/`). A rule file without `paths` loads every session, like `CLAUDE.md`.

### Glob patterns that match by file type, not folder

| Pattern | Matches |
|---|---|
| `**/*.test.tsx` | Every `.test.tsx` file, at any depth |
| `**/*.{test,spec}.ts` | Test and spec files anywhere (brace expansion) |
| `terraform/**/*` | Everything under `terraform/` |
| `src/api/**/*.ts` | TypeScript files under `src/api/` |
| `**/migrations/*.sql` | SQL files in any `migrations/` folder |

**Worked example — test conventions across a monorepo.**

```markdown
<!-- .claude/rules/testing.md -->
---
paths: ["**/*.test.tsx", "**/*.test.ts"]
---
# Testing conventions
- Use React Testing Library, not Enzyme.
- Mock HTTP with MSW handlers from `test/msw/handlers.ts`.
- One behavior per `it` block; name it "does X when Y".
```

This loads when Claude edits `apps/web/src/Cart.test.tsx` or `packages/ui/Button.test.tsx` — wherever the test lives. A subdirectory `CLAUDE.md` can't do that: it is tied to one folder, so covering forty folders of tests would need forty copies.

### Path rules vs subdirectory `CLAUDE.md`

| Situation | Better choice |
|---|---|
| Convention applies to one self-contained folder (`packages/billing/`) | Subdirectory `CLAUDE.md` or a rule with `paths: ["packages/billing/**/*"]` — either works |
| Convention applies to a file type spread everywhere (tests, migrations, `.proto` files) | Path-specific rule with a `**/` glob |
| Convention applies to everything | Project `CLAUDE.md` or a rule file with no `paths` |

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Copying a `CLAUDE.md` into every folder that has tests | Doesn't scale, copies drift, new folders are missed | One `.claude/rules/testing.md` with `paths: ["**/*.test.*"]` |
| Putting Terraform rules in the root `CLAUDE.md` | Loaded while editing React components; wasted tokens | `paths: ["terraform/**/*"]` |
| Glob too narrow, e.g. `src/*.test.ts` | Misses nested folders | Use `**/` for any depth |
| Expecting a path rule to load before any matching file is touched | It loads on demand | Put rules needed for planning in `CLAUDE.md` or an unscoped rule |

**Practice.** Test files (`*.test.tsx`) are scattered across dozens of directories throughout a large monorepo, and you want consistent testing conventions applied regardless of location, without bloating the root `CLAUDE.md`. Best approach?

- A) Add a `CLAUDE.md` to every directory containing test files
- B) Put everything in the root `CLAUDE.md` under a "Testing" header
- C) Create a `.claude/rules/testing.md` file with `paths: ["**/*.test.tsx"]` frontmatter
- D) Create a custom skill that must be manually invoked before writing tests

**Answer: C.** Glob-scoped rules solve exactly the "convention tied to file type, not directory" problem and load only when a matching file is in play. A doesn't scale and misses new folders, B loads testing rules into every session, and D relies on someone remembering to invoke it instead of applying automatically.

**Practice.** An infrastructure team keeps all Terraform under `infra/terraform/`. Their conventions are being loaded into every session, including front-end work, and developers complain about wasted context. Which frontmatter fixes this in `.claude/rules/terraform.md`?

- A) `paths: ["**/*.tsx"]`
- B) `context: fork`
- C) `allowed-tools: Read`
- D) `paths: ["infra/terraform/**/*"]`

**Answer: D.** Scoping the rule to `infra/terraform/**/*` makes it load only when Claude works with Terraform files, which removes it from front-end sessions. A targets the wrong files entirely, B is a skill option for isolated execution and has no meaning in a rules file, and C controls tool access rather than when instructions load.

**Practice.** A team wants rules for SQL migration files. Migrations live in `services/orders/migrations/`, `services/users/migrations/` and six other service folders, and new services are added monthly. Which approach keeps working as services are added?

- A) A `CLAUDE.md` inside each `migrations/` folder
- B) A rule file with `paths: ["**/migrations/*.sql"]`
- C) A rule file with `paths: ["services/orders/migrations/*.sql"]`
- D) A note in each service's README

**Answer: B.** A `**/` glob matches migration files in any service, including ones created later, with a single rule file. A needs a new copy for every service and silently misses new ones, C only covers one service, and D isn't loaded by Claude Code as instructions.

## 3.4 Plan Mode vs. Direct Execution

**Concept.** In **plan mode**, Claude reads files and explores the codebase, then proposes a plan; it does not edit your source until you approve. You enter it with Shift+Tab during a session, by starting with `claude --permission-mode plan`, or (in current versions) by prefixing a prompt with `/plan`. **Direct execution** is the normal mode: Claude makes the change straight away.

The choice is about how much is still unknown and how expensive a wrong start would be.

| Use plan mode when... | Use direct execution when... |
|---|---|
| Multi-file changes, architectural decisions | Single-file, well-understood bug fix |
| Multiple valid implementation approaches exist | Clear stack trace, obvious one-line fix |
| Large-scale restructuring (e.g., monolith → microservices) | Adding one validation check to one function |
| A library migration touching 45+ files | Adding a date-range conditional to a form validator |
| Choosing between integrations with different infrastructure needs (e.g., webhooks vs a queue) | Renaming a variable in one module |

Plan mode prevents costly rework: discovering halfway through 30 edited files that the chosen approach can't work is far more expensive than discovering it during a read-only investigation.

### The Explore subagent

Long tasks have a discovery phase — "find every caller of `LegacyHttpClient`", "how does auth flow through these services?" — that can produce huge amounts of output. The built-in **Explore** subagent is a read-only agent for search and codebase analysis. It runs in its own context and hands back a summary, so the main conversation keeps room for the actual work. Claude can call it at different thoroughness levels (quick, medium, very thorough). Use it to stop multi-phase tasks from exhausting the context window during discovery.

### Plan first, then execute

The two modes combine. A common pattern:

1. **Plan mode:** investigate and agree on an approach.
2. **Approve the plan:** Claude leaves plan mode.
3. **Direct execution:** implement the agreed steps, ideally in batches you can test.

**Worked example — migrating from `moment` to `date-fns` in a 60-file legacy app.**

```text
[plan mode]
> We need to replace moment with date-fns. Find every usage, group them by pattern
  (parsing, formatting, timezone math, durations), and propose a migration order.
  Flag anything date-fns can't do directly. Use the Explore subagent for the search.

Claude: (Explore returns a summary: 61 files, 4 usage patterns, 3 files use
moment-timezone, which needs date-fns-tz)
Plan: 1) add a thin src/lib/dates.ts wrapper  2) migrate formatting (38 files)
      3) parsing (14)  4) timezone math (6, needs date-fns-tz)  5) remove moment

[approve plan → direct execution]
> Do step 1 and step 2. Run the date tests after each package.
```

Planning settled the open questions (timezone support, migration order); execution is now mechanical.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Direct execution on a cross-cutting migration, "let the structure emerge" | Early edits lock in an approach before the scope is known | Plan mode first, then execute the plan |
| Plan mode for a one-line fix with a clear stack trace | Adds ceremony with nothing to decide | Direct execution |
| Running a broad search in the main session | Raw output fills the context window before implementation starts | Explore subagent, which returns a summary |
| Staying in plan mode forever | Nothing ships | Approve the plan and switch to execution |

**Practice.** You're assigned to split a monolith into microservices — dozens of files, undetermined service boundaries, multiple valid dependency-management approaches. What's the right approach?

- A) Direct execution, let structure emerge incrementally
- B) Plan mode first, to explore and design before committing to changes
- C) Direct execution with a very long, fully detailed upfront prompt
- D) Direct execution, switch to plan mode only if surprises appear

**Answer: B.** The complexity is already known upfront, which is precisely plan mode's use case: explore and settle the boundaries before any edits. A locks in early decisions without investigation, C asks you to write the design before you've explored the code, and D treats predictable complexity as something to discover reactively, after rework has already happened.

**Practice.** A production error shows a stack trace pointing to `parseInvoiceDate()` in one file; the function doesn't handle an empty string. What should the developer do?

- A) Enter plan mode and ask for three alternative designs
- B) Use the Explore subagent to map every date function in the codebase first
- C) Ask Claude to fix it directly, adding the empty-string check and a test
- D) Write a custom skill for date-parsing fixes

**Answer: C.** The cause, the location and the fix are all clear and confined to one function, so direct execution is right. A and B add investigation where there is nothing to investigate, and D builds reusable tooling for a one-off fix.

**Practice.** During a multi-phase refactor, the session's context fills up while Claude searches hundreds of files for usages of a deprecated logger, leaving little room for the implementation. What should you do differently next time?

- A) Run the discovery through the Explore subagent so only a summary returns to the main conversation
- B) Switch to direct execution so Claude searches less
- C) Paste the list of files into the prompt manually
- D) Put the logger migration steps in the user-level `CLAUDE.md`

**Answer: A.** The Explore subagent does the verbose search in its own context and returns a summary, which protects the main session's context for the implementation phase. B doesn't reduce the amount of discovery needed, C moves the same volume of text into the main context, and D is about persistent instructions, not search output.

## 3.5 Iterative Refinement Techniques

Once you're actually building with Claude Code, output quality on the first pass is rarely the point — *how you iterate* is. The exam tests four distinct refinement techniques, and critically, **when each is the right tool**.

| Technique | When it's the right call | What it looks like |
|---|---|---|
| **Concrete input/output examples** | Prose descriptions of a transformation are being interpreted *inconsistently* across attempts | Instead of "clean up this function," show 2–3 before/after pairs that pin down exactly what "cleaned up" means here |
| **Test-driven iteration** | You can define expected behavior, edge cases, and performance requirements up front | Write the test suite first; iterate by feeding Claude the *failures*, not just the tests, after each attempt |
| **The interview pattern** | Working in an unfamiliar domain where you might not have anticipated every design consideration | Ask Claude to interview *you* — surface open design questions — before it writes any implementation |
| **Batching vs. sequencing feedback** | Multiple issues found in one pass | If issues **interact**, give them all in one detailed message. If they're **independent**, sequential fix-then-next is fine |

### Concrete examples beat repeated prose

```text
Prose (produces inconsistent results across attempts):
"Normalize the phone numbers in this dataset."

Concrete (produces consistent results):
"+1 (555) 123-4567"      -> "5551234567"
"555.123.4567 ext 12"    -> "5551234567"   (drop extensions)
"1-555-123-4567"         -> "5551234567"   (drop leading country code)
```

Two or three pairs that cover the disputed cases are usually enough. Pick examples at the edges (extensions, country codes), not three easy ones.

The same works for fixing a single edge case. If a data migration script mishandles nulls, give a specific test case with input and expected output rather than "handle nulls properly":

```text
Input row:   { "id": 42, "middle_name": null, "signup_date": null }
Expected:    INSERT ... (42, '', NULL)   -- empty string for names, NULL for dates
Currently:   INSERT ... (42, 'null', '1970-01-01')
```

### Test-driven iteration

**Worked example — a rate limiter.** Write the tests before asking for the implementation:

```ts
// rateLimiter.test.ts
it("allows 100 requests per minute per key", ...);
it("rejects the 101st request with retryAfter in seconds", ...);
it("tracks keys independently", ...);
it("resets after the window passes", ...);       // edge case
it("handles 10k keys in under 50ms", ...);       // performance requirement
```

Then iterate on failures, pasting the actual output:

```text
> 2 tests still fail. Output:
  ✗ resets after the window passes — expected 'allowed', got 'rejected'
  ✗ handles 10k keys in under 50ms — took 340ms
  Fix these without changing the tests.
```

The failures give Claude an exact target; "it still doesn't work" does not.

### The interview pattern

```text
> I need to add caching to our pricing service. I haven't worked on this service
  before. Before writing any code, ask me the questions you need answered
  (invalidation, consistency, failure modes). One question at a time.
```

Claude might ask: how stale can a price be? What invalidates a cached price — a price change event, a TTL, both? What happens if the cache is down — fail open to the database, or fail closed? These are decisions you'd otherwise discover in production.

### Batching vs sequencing

- **Interacting issues → one message.** The date parser returns UTC, the display layer assumes local time, and the report groups by day. Fixing one changes the right fix for the others, so describe all three together.
- **Independent issues → one at a time is fine.** A typo in a log message and a missing index on an unrelated table don't affect each other.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Repeating the same prose instruction more emphatically when output is inconsistent | Emphasis doesn't resolve genuine ambiguity in what "correct" means | Concrete input/output examples |
| Reporting interacting bugs one at a time | Fixing bug 1 may invalidate the correct fix for bug 2 you already described, forcing rework | One detailed message covering all interacting issues |
| Implementing directly in an unfamiliar domain without surfacing design questions first | Costly rework when an unconsidered failure mode surfaces later | Interview pattern — have Claude ask before it builds |
| Writing tests once and never revisiting failures | No feedback loop to correct against | Share actual test *failures* after each attempt |
| "Handle edge cases better" | Doesn't say which case or what the right output is | A specific input and its expected output |

**Practice.** A developer asks Claude to "normalize the phone numbers in this CSV," but across three attempts, extensions and country codes are handled differently each time. Most effective fix?

- A) Repeat the same instruction with stronger wording
- B) Provide 2–3 concrete before/after examples covering the specific edge cases
- C) Lower `max_tokens` to force a simpler transformation
- D) Ask for five attempts and manually pick the best one

**Answer: B.** Ambiguity in a prose spec isn't fixed by repeating it more forcefully; concrete examples that cover extensions and country codes remove the ambiguity directly. A keeps the same ambiguity, C limits output length rather than clarifying the rule, and D picks among inconsistent outputs instead of making them consistent.

**Practice.** Before implementing a new caching layer in an unfamiliar part of the codebase, a developer wants Claude to surface invalidation strategy and failure-mode questions *before* writing code. Which technique fits best?

- A) Test-driven iteration
- B) The interview pattern
- C) Batching all feedback into one message
- D) Direct execution with a detailed prompt

**Answer: B.** The interview pattern has Claude ask about considerations the developer may not have anticipated, such as invalidation and failure modes, before implementation starts, which suits unfamiliar domains. A requires already knowing the expected behavior well enough to write tests, C is about how to deliver review feedback on existing output, and D skips exactly the questioning the developer wants.

**Practice.** After Claude's first attempt at a CSV import, you find three problems: dates are parsed as UTC, the totals column is computed from those dates by day, and the summary email groups by the same day boundary. How should you report them?

- A) One at a time, waiting for each fix before mentioning the next
- B) Only the first one, since the others will likely fix themselves
- C) Restart the session and re-prompt from scratch
- D) All three in one detailed message, explaining how they connect

**Answer: D.** The three problems share a root (the day boundary), so fixing them in isolation risks rework as each fix changes what the next should be, and one message lets Claude fix them coherently. A is right for independent issues but not interacting ones, B assumes a fix that may not happen, and C throws away useful context.

**Practice.** A migration script crashes on some rows. You've told Claude twice to "handle missing values properly" and it still converts null dates to `1970-01-01`. What is the best next message?

- A) "Please be more careful with missing values this time."
- B) A request to rewrite the whole script in a different language
- C) A specific row with nulls, the expected SQL output for it, and the current wrong output
- D) Ask Claude to add more logging and run it again

**Answer: C.** A concrete input with the expected output pins down what "properly" means (NULL stays NULL), which prose didn't do after two tries. A repeats the vague instruction, B is a large change that doesn't define the expected behavior, and D gathers information you already have.

## 3.6 CI/CD Integration

**Concept.** The same Claude Code that runs in your terminal can run in a pipeline: reviewing PRs, generating tests, triaging failures. Four things matter for the exam: running non-interactively, getting machine-readable output, giving it project context, and keeping review independent from generation.

### Run non-interactively with `-p`

`claude -p "<prompt>"` (long form `--print`) runs one task, prints the result and exits. Without it, `claude "<prompt>"` starts an interactive session that waits for input — in CI that means a job that hangs until it times out.

### Structured output for PR comments

`--output-format json` returns a JSON object (the text in `result`, plus `session_id`, cost and usage). Add `--json-schema` with a JSON Schema and the validated output appears in the `structured_output` field, ready for a script to post as inline PR comments.

```bash
claude -p "Review the diff in pr.diff against the criteria in CLAUDE.md." \
  --output-format json \
  --json-schema "$(cat .github/review-schema.json)" \
  --max-turns 15 \
  > review.json

jq '.structured_output.findings' review.json
```

The schema file, `.github/review-schema.json`:

```json
{
  "type": "object",
  "properties": {
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path":     { "type": "string" },
          "line":     { "type": "integer" },
          "severity": { "type": "string", "enum": ["blocker", "major", "minor"] },
          "message":  { "type": "string" }
        },
        "required": ["path", "line", "severity", "message"]
      }
    }
  },
  "required": ["findings"]
}
```

If a run ends without valid structured output, `structured_output` is missing, so check for it before posting.

### Project context comes from `CLAUDE.md`

A CI-invoked Claude reads the repository's `CLAUDE.md` the same way an interactive session does. That is where review criteria, testing standards and fixture conventions belong, so local and CI runs follow the same rules:

```markdown
<!-- CLAUDE.md (excerpt) -->
## Review criteria
- Flag: missing auth checks on new routes, unparameterised SQL, secrets in code.
- Don't flag: formatting (Prettier handles it), naming preferences.

## Testing standards
- Valuable tests: business rules, error paths, boundary values. Skip trivial getters.
- Fixtures: use `tests/fixtures/factories.ts` (`makeUser`, `makeOrder`); never hit the real Stripe API.
- Each new endpoint needs one happy-path and one auth-failure test.
```

Documenting what a *valuable* test looks like and which fixtures exist cuts low-value output (tests for getters, hand-built mocks duplicating existing factories).

> Note: current Claude Code offers `--bare` for faster scripted runs, but it skips `CLAUDE.md`, hooks and skills. If your pipeline relies on `CLAUDE.md`, don't use `--bare` (or pass the context explicitly, e.g. with `--append-system-prompt-file`).

### Independent review instances

The **same session** that generated code is a worse reviewer of it than an **independent** instance. It still has its own reasoning in context, so it tends to confirm its decisions rather than challenge them. In a pipeline, generate in one run and review in a separate `claude -p` invocation that has no generation history.

### Re-reviews and test generation without duplicates

- **Re-running a review after new commits:** include the previous findings in the prompt and ask for only new or still-unaddressed issues. Otherwise every push re-posts the same comments.
- **Generating tests:** give Claude the existing test files for the module so it doesn't propose scenarios already covered.

```bash
claude -p "Review the new commits in pr.diff.
Previous findings are in prior-findings.json.
Report only issues that are new, or listed there and still not fixed.
Do not repeat findings that have been addressed." \
  --output-format json --json-schema "$(cat .github/review-schema.json)"
```

### Worked example — a PR review workflow

```yaml
# .github/workflows/claude-review.yml
name: Claude PR review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: npm install -g @anthropic-ai/claude-code
      - name: Build the diff
        run: git diff origin/${{ github.base_ref }}...HEAD > pr.diff
      - name: Review (independent instance, structured output)
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude -p "Review pr.diff using the review criteria in CLAUDE.md." \
            --output-format json \
            --json-schema "$(cat .github/review-schema.json)" \
            --allowedTools "Read,Grep,Glob" \
            --max-turns 15 > review.json
      - name: Post inline comments
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          jq -c '.structured_output.findings[]?' review.json | while read -r f; do
            gh api repos/${{ github.repository }}/pulls/${{ github.event.pull_request.number }}/comments \
              -f body="$(echo "$f" | jq -r '"[\(.severity)] \(.message)"')" \
              -f commit_id="${{ github.event.pull_request.head.sha }}" \
              -f path="$(echo "$f" | jq -r .path)" \
              -F line="$(echo "$f" | jq -r .line)" \
              -f side=RIGHT
          done
```

Anthropic also publishes `anthropics/claude-code-action` (set up with `/install-github-app`), which takes a `prompt` and passes extra CLI flags through `claude_args`. The concepts are the same: non-interactive run, `CLAUDE.md` for context, structured findings.

### Enforcing guardrails with Claude Code hooks (`settings.json`)

Hooks are not a separate exam task statement, but they show up wherever Claude Code runs unattended. Don't confuse them with [Domain 1's Agent SDK hooks](domain-1-agentic-architecture.md#15-hooks-posttooluse-and-tool-interception) — those are callbacks inside an agent you build. Claude Code has its own hook system: shell commands configured in `settings.json` that fire at lifecycle events (`PreToolUse`, `PostToolUse`, `Stop`, …) in interactive and CI sessions alike.

```json
// .claude/settings.json — project-scoped, version-controlled
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/block-prod-db.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write" }]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# scripts/block-prod-db.sh — receives the tool call as JSON on stdin
cmd=$(jq -r '.tool_input.command')
if echo "$cmd" | grep -q 'prod-db.internal'; then
  echo "Blocked: commands against the production database are not allowed" >&2
  exit 2   # exit code 2 blocks the tool call; stderr is shown to Claude
fi
exit 0
```

- **`matcher`** scopes a hook to specific tools (exact names like `Bash`, or a pattern like `Edit|Write`).
- The hook receives the event as **JSON on stdin** (for tool events: `tool_name`, `tool_input`, …).
- **Exit code 2** from a `PreToolUse` hook blocks the call. Other non-zero codes are treated as non-blocking errors, so a policy hook must use `exit 2` (or return a JSON `permissionDecision: "deny"`).
- `.claude/settings.json` is shared through git; `~/.claude/settings.json` is personal — the same split as `CLAUDE.md` in [§3.1](#31-claudemd-hierarchy).

**Exam distinction:** Python/TypeScript logic intercepting tool calls in *your own* agent loop → Domain 1 Agent SDK hooks. A `.claude/settings.json` entry with a `matcher` and a shell `command` firing during a Claude Code session → this section. Either way, a hook is deterministic; a `CLAUDE.md` instruction is guidance.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| `claude "Review this PR"` in a CI step | Starts an interactive session; the job hangs | `claude -p "..."` |
| Parsing free-text review output with regex | Breaks whenever wording changes | `--output-format json --json-schema ...`, read `structured_output` |
| Same session generates the fix and then reviews it | Reviewer shares the author's reasoning and blind spots | Separate, independent `claude -p` review run |
| Re-reviewing every push from scratch | Duplicate PR comments on already-fixed issues | Pass prior findings; ask for new or unaddressed issues only |
| Review criteria hard-coded in the CI script prompt | Diverges from what developers see locally | Keep criteria in `CLAUDE.md` |
| Policy enforced only by a `CLAUDE.md` warning | The model can still run the command | `PreToolUse` hook that exits 2 |

**Practice.** `claude "Review this PR"` hangs indefinitely in your CI job. What's the fix?

- A) `claude -p "Review this PR"`
- B) Set `CLAUDE_HEADLESS=true`
- C) Pipe `/dev/null` into stdin
- D) Add `--batch`

**Answer: A.** The `-p` (`--print`) flag runs Claude Code non-interactively, so it completes the task, prints the result and exits instead of waiting for input. B and D are not real Claude Code options (a classic distractor pattern: plausible-sounding but fictional), and C is a workaround that doesn't switch Claude Code into its supported non-interactive mode.

**Practice.** Your CI pipeline uses the same Claude Code session to both generate a bug fix and immediately review that fix before merge. Reviews from this setup rarely catch subtle logic issues that a human later finds. Why?

- A) The model's context window is too small for review tasks
- B) The same session retains its generation reasoning, making it less likely to challenge its own decisions
- C) `--output-format json` is not enabled
- D) The prompt lacks few-shot examples of good reviews

**Answer: B.** A session that wrote the code still holds the reasoning behind it, so it tends to confirm rather than question its choices, and an independent review instance avoids that. A is not the cause in a single-fix review, C only changes the output format and not review quality, and D might help a little but doesn't address the shared-context bias.

**Practice.** A team wants Claude's PR review findings posted as inline comments by a script. The free-text output keeps changing shape and the script's parser breaks. What should they change?

- A) Ask Claude in the prompt to "always use the same format"
- B) Switch to `--output-format stream-json` and parse each line
- C) Add `--output-format json` with a `--json-schema` describing the findings, and read the `structured_output` field
- D) Run the review twice and keep the output that parses

**Answer: C.** A schema-validated JSON result gives the script a stable structure (path, line, severity, message) to post as inline comments. A is a soft instruction that can still drift, B streams events but doesn't enforce a findings schema, and D doubles cost while still allowing unparseable output.

**Practice.** After a developer pushes fixes, the CI review runs again and re-posts eight comments, five of which were already resolved. What is the best fix?

- A) Turn off the review on `synchronize` events
- B) Lower `--max-turns` so the review finds fewer issues
- C) Include the previous findings in the prompt and instruct Claude to report only new or still-unaddressed issues
- D) Delete all old comments before each run

**Answer: C.** Giving the reviewer its prior findings lets it tell resolved issues from open ones and report only what is new or still unfixed, which removes the duplicates. A stops reviewing new commits altogether, B cuts the review short arbitrarily rather than targeting duplicates, and D wipes the discussion history while still re-posting the same findings.

**Practice.** Claude-generated tests in CI keep duplicating scenarios the suite already covers and building hand-rolled mocks instead of using the project's factories. Which change helps most?

- A) Document testing standards and available fixtures in `CLAUDE.md`, and include the module's existing test files in context
- B) Increase `--max-turns`
- C) Use a personal `~/.claude/CLAUDE.md` on the CI runner
- D) Ask for "high-quality tests" in the prompt

**Answer: A.** Documented standards and fixtures in the committed `CLAUDE.md` tell CI-invoked Claude what a valuable test is and which factories exist, and seeing the existing tests stops it proposing scenarios already covered. B gives more turns but no new information, C puts project knowledge where developers and other runners can't see or maintain it, and D is too vague to change behavior.

**Practice.** A team wants every `Bash` command Claude Code runs in a shared repo to be blocked automatically if it targets the production database host, without relying on the model to police itself. Where does this belong?

- A) A stronger warning in `CLAUDE.md`
- B) A few-shot example showing a refusal
- C) An `AgentDefinition`-level system prompt clause
- D) A `PreToolUse` hook in `.claude/settings.json` matched to `Bash`, exiting with code 2 to block the call

**Answer: D.** A `PreToolUse` hook runs as code before every matching tool call and exit code 2 blocks it deterministically, and putting it in the committed `.claude/settings.json` applies it to the whole team and CI. A, B and C are all prompt-level guidance that the model can still fail to follow, and C belongs to the Agent SDK rather than Claude Code session configuration.

<!-- support-footer -->
---

> Created by **Utkarsh Agarwal** — certified Claude Certified Architect (Foundations & Professional).
> Found this useful? [⭐ Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) · [💼 Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) · [☕ Buy me a coffee](https://utkarsh1agarwal.github.io/claude-architect-exam-guide/#support)
