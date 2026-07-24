# Domain 3: Claude Code Configuration & Workflows (20%)

This domain is heavily config- and workflow-focused, and it maps cleanly onto skills most engineers already have — configuration hierarchies, YAML frontmatter, environment variables, CI flags. If you've configured a linter, a monorepo build tool, or a CI pipeline before, a lot of this will feel familiar.

## 3.1 CLAUDE.md Hierarchy

```text
~/.claude/CLAUDE.md         # user-level: YOU only, not shared via git
.claude/CLAUDE.md (or       # project-level: shared via version control,
   root CLAUDE.md)          #   applies to the whole team
subdir/CLAUDE.md            # directory-level: scoped to that subdirectory
```

**Diagnostic pattern the exam loves:** "a new teammate isn't getting the team's conventions" → they probably have instructions in their **user-level** file (personal, not committed) instead of **project-level**.

**Modularity tools:**

- `@import path/to/file.md` — pull in external files to keep `CLAUDE.md` from becoming a monolith (e.g., import only the standards file relevant to a given package).
- `.claude/rules/*.md` with YAML frontmatter `paths: ["src/api/**/*"]` — **conditional, glob-based** rule loading. This beats a directory-level `CLAUDE.md` when a convention (e.g., "all test files") is scattered across many directories rather than confined to one folder.
- `/memory` command — inspect which memory files are actually loaded, for debugging inconsistent behavior across sessions.

```yaml
---
paths: ["**/*.test.tsx", "**/*.test.ts"]
---
# Testing Conventions
- Use React Testing Library, not Enzyme
- Mock API calls with MSW
- One assertion focus per test block
```

This loads *only* when Claude is editing a matching test file, regardless of which directory it's in — unlike a subdirectory `CLAUDE.md`, which is bound to one location.


**Practice.** Test files (`*.test.tsx`) are scattered across dozens of directories throughout a large monorepo, and you want consistent testing conventions applied regardless of location, without bloating the root `CLAUDE.md`. Best approach?

A) Add a `CLAUDE.md` to every directory containing test files
B) Put everything in the root `CLAUDE.md` under a "Testing" header
C) Create a `.claude/rules/testing.md` file with `paths: ["**/*.test.tsx"]` frontmatter
D) Create a custom skill that must be manually invoked before writing tests

**Answer: C.** Glob-scoped rules solve exactly the "convention tied to file type, not directory" problem; A doesn't scale, B relies on inference, D requires manual invocation instead of automatic application.

## 3.2 Custom Slash Commands & Skills

| Scope | Location | Shared with team? |
|---|---|---|
| Project command | `.claude/commands/` | Yes — version-controlled |
| Personal command | `~/.claude/commands/` | No |
| Skill | `.claude/skills/<name>/SKILL.md` | Yes, if project-scoped |

**`SKILL.md` frontmatter options worth knowing:**

- `context: fork` — run the skill in an **isolated sub-agent context**, so verbose or exploratory output doesn't pollute the main conversation (e.g., a "brainstorm alternatives" skill, or a codebase-analysis skill).
- `allowed-tools` — restrict which tools the skill can use while running (e.g., limit a doc-generation skill to file-write only, no `Bash`/delete capability).
- `argument-hint` — prompts the developer for required parameters if they invoke the skill with no arguments.


**Practice.** You want a `/review` command that runs your team's code review checklist, available to everyone who clones the repo. Where do you put it?

A) `.claude/commands/` in the repo
B) `~/.claude/commands/` on your machine
C) Inside `CLAUDE.md`
D) `.claude/config.json`

**Answer: A.**


**Practice.** You're building a "codebase exploration" skill that produces very long, noisy output as it traces dependencies, and you don't want this to clutter the main conversation context. Which frontmatter option addresses this?

A) `argument-hint`
B) `allowed-tools`
C) `context: fork`
D) `paths`

**Answer: C.**

## 3.3 Claude Code's Hook System (`settings.json`)

**Concept.** Don't confuse this with [Domain 1's Agent SDK hooks](domain-1-agentic-architecture.md#14-hooks-posttooluse-and-tool-interception) — those are Python callbacks inside a custom agentic loop you're building. Claude Code itself ships its own, separate hook system: shell commands configured in `settings.json` that fire at lifecycle events during a Claude Code session, regardless of what agent code you've written.

```json
// .claude/settings.json — project-scoped, version-controlled
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "./scripts/block-prod-db.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "npx prettier --write \"$CLAUDE_FILE_PATH\"" }]
      }
    ]
  }
}
```

- **`matcher`** scopes a hook to specific tools (by name or regex) so it only fires for relevant tool calls.
- Hooks run as real shell commands with exit-code-based control — a non-zero exit from a `PreToolUse` hook blocks the tool call outright, which is what makes this a *deterministic* enforcement point rather than a suggestion.
- `settings.json` at the project level is shared/version-controlled; `~/.claude/settings.json` at the user level is personal, mirroring the `CLAUDE.md` scope split in [§3.1](#31-claudemd-hierarchy).

**Exam distinction to get right:** if a question describes hard-coded Python/TypeScript logic intercepting your own agent's tool-call loop, that's Domain 1's Agent SDK hooks. If it describes a `.claude/settings.json` entry with a `matcher` and a shell `command` firing during an interactive or CI Claude Code session, that's this section.


**Practice.** A team wants every `Bash` command Claude Code runs in a shared repo to be blocked automatically if it targets the production database connection string, without relying on the model to police itself. Where does this belong?

A) A stronger warning in `CLAUDE.md`
B) A `PreToolUse` hook in `.claude/settings.json` matched to `Bash`, exiting non-zero to block the call
C) A few-shot example showing a refusal
D) An `AgentDefinition`-level system prompt clause

**Answer: B.** Same underlying principle as Domain 1's tool-interception hooks — deterministic blocking beats a prompt-level warning — but here the mechanism is Claude Code's own `settings.json` hook config, not custom Agent SDK code.

## 3.4 Plan Mode vs. Direct Execution

| Use plan mode when... | Use direct execution when... |
|---|---|
| Multi-file changes, architectural decisions | Single-file, well-understood bug fix |
| Multiple valid implementation approaches exist | Clear stack trace, obvious one-line fix |
| Large-scale restructuring (e.g., monolith → microservices) | Adding one validation check to one function |

Also know the **Explore subagent**: used to isolate verbose discovery/exploration output during multi-phase tasks, so the main session's context isn't exhausted by exploration noise.


**Practice.** You're assigned to split a monolith into microservices — dozens of files, undetermined service boundaries, multiple valid dependency-management approaches. What's the right approach?

A) Direct execution, let structure emerge incrementally
B) Plan mode first, to explore and design before committing to changes
C) Direct execution with a very long, fully detailed upfront prompt
D) Direct execution, switch to plan mode only if surprises appear

**Answer: B.** The complexity is already known upfront — that's precisely plan mode's use case, not something to discover reactively.

## 3.5 Iterative Refinement Techniques

Once you're actually building with Claude Code, output quality on the first pass is rarely the point — *how you iterate* is. The exam tests four distinct refinement techniques, and critically, **when each is the right tool**.

| Technique | When it's the right call | What it looks like |
|---|---|---|
| **Concrete input/output examples** | Prose descriptions of a transformation are being interpreted *inconsistently* across attempts | Instead of "clean up this function," show 2–3 before/after pairs that pin down exactly what "cleaned up" means here |
| **Test-driven iteration** | You can define expected behavior, edge cases, and performance requirements up front | Write the test suite first; iterate by feeding Claude the *failures*, not just the tests, after each attempt |
| **The interview pattern** | Working in an unfamiliar domain where you might not have anticipated every design consideration | Ask Claude to interview *you* — surface open design questions — before it writes any implementation |
| **Batching vs. sequencing feedback** | Multiple issues found in one pass | If issues **interact**, give them all in one detailed message. If they're **independent**, sequential fix-then-next is fine |

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Repeating the same prose instruction more emphatically when output is inconsistent | Emphasis doesn't resolve genuine ambiguity in what "correct" means | Concrete input/output examples |
| Reporting interacting bugs one at a time | Fixing bug 1 may invalidate the correct fix for bug 2 you already described, forcing rework | One detailed message covering all interacting issues |
| Implementing directly in an unfamiliar domain without surfacing design questions first | Costly rework when an unconsidered failure mode surfaces later | Interview pattern — have Claude ask before it builds |
| Writing tests once and never revisiting failures | No feedback loop to correct against | Share actual test *failures* after each attempt |

```text
Prose (produces inconsistent results across attempts):
"Normalize the phone numbers in this dataset."

Concrete (produces consistent results):
"+1 (555) 123-4567"      -> "5551234567"
"555.123.4567 ext 12"    -> "5551234567"   (drop extensions)
"1-555-123-4567"         -> "5551234567"   (drop leading country code)
```


**Practice.** A developer asks Claude to "normalize the phone numbers in this CSV," but across three attempts, extensions and country codes are handled differently each time. Most effective fix?

A) Repeat the same instruction with stronger wording
B) Provide 2–3 concrete before/after examples covering the specific edge cases
C) Lower `max_tokens` to force a simpler transformation
D) Ask for five attempts and manually pick the best one

**Answer: B.** Ambiguity in a prose spec isn't fixed by repeating it more forcefully — concrete examples remove the ambiguity directly.


**Practice.** Before implementing a new caching layer in an unfamiliar part of the codebase, a developer wants Claude to surface invalidation strategy and failure-mode questions *before* writing code. What technique is this, and why does it fit?

A) Test-driven iteration
B) The interview pattern — well-suited to unfamiliar domains where you may not have anticipated every consideration
C) Prompt chaining
D) Plan mode doesn't apply since this is a single feature, not an architecture-wide change

**Answer: B.**

## 3.6 CI/CD Integration

**Must-know flags:**

- `-p` / `--print` — run Claude Code **non-interactively** (prevents pipeline hangs waiting for stdin).
- `--output-format json` + `--json-schema` — force machine-parseable structured findings for posting as inline PR comments.

**Key reliability pattern:** the **same session** that generated code is a worse reviewer of it than an **independent** review instance, because it retains its own generation reasoning and is less likely to challenge its own decisions. Use a fresh instance for review.

Also feed prior review findings into re-runs so Claude reports only *new/unaddressed* issues (avoiding duplicate PR comments), and document testing standards and available fixtures in `CLAUDE.md` to improve test-generation quality.


**Practice.** `claude "Review this PR"` hangs indefinitely in your CI job. What's the fix?

A) `claude -p "Review this PR"`
B) Set `CLAUDE_HEADLESS=true`
C) Pipe `/dev/null` into stdin
D) Add `--batch`

**Answer: A.** (B and D are not real flags/vars — a classic exam distractor pattern: plausible-sounding but fictional options.)


**Practice.** Your CI pipeline uses the same Claude Code session to both generate a bug fix and immediately review that fix before merge. Reviews from this setup rarely catch subtle logic issues that a human later finds. Why?

A) The model's context window is too small for review tasks
B) The same session retains its generation reasoning, making it less likely to challenge its own decisions
C) `--output-format json` is not enabled
D) The prompt lacks few-shot examples of good reviews

**Answer: B.**

