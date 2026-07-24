# Cheat Sheet — Final Skim

One page. Read this the night before, or in the last hour before your appointment.

## The one meta-rule

> **Structural/programmatic fix beats prompt-based fix, whenever the stakes are deterministic** — money, identity, ordering, schema compliance, retries.

Second: **the root cause is usually upstream of where the symptom appears** (e.g., a synthesis agent "looks broken," but the actual cause is the coordinator's bad task decomposition).

## Fast lookups

| If the question is about... | Think... |
|---|---|
| Loop won't stop correctly | `stop_reason` (`tool_use` / `end_turn` / `pause_turn`), not text parsing |
| Refund/order-before-verify ordering bug | Programmatic prerequisite hook, not stronger prompt wording |
| Data format inconsistency across tools | `PostToolUse` hook for normalization |
| Business rule violation risk (e.g., >$500 refund) | Pre-call tool interception hook |
| Subagent "missing" info the coordinator has | Context isn't inherited — pass it explicitly in the prompt |
| Research covers too narrow a slice despite all subagents succeeding | Coordinator's task decomposition, not subagent execution |
| Resuming a session after code changed | Explicitly tell it what changed; don't assume it re-explores |
| New teammate not getting team conventions | User-level vs. project-level `CLAUDE.md` mixup |
| Convention needed for a file-type across many directories | `.claude/rules/` + glob `paths`, not directory `CLAUDE.md` |
| Verbose skill output polluting main conversation | `context: fork` |
| Skill should restrict destructive actions | `allowed-tools` |
| CI pipeline hangs | `-p` / `--print` flag |
| Same session generates AND reviews code | Use an independent instance for review |
| Blocking vs. overnight workflow + cost savings | Batch API only for latency-tolerant, non-blocking work |
| JSON never malformed but values don't add up | Semantic error ≠ syntax error; add a calculated-vs-stated comparison field |
| Model fabricates a value that isn't in the source | Field should be nullable/optional, not required |
| Ambiguous tool selection between 2 similar tools | Fix descriptions FIRST, few-shot SECOND |
| Generic tool error hides useful info | Structured error: `errorCategory`, `isRetryable`, description |
| Agent has 15+ tools and misuses some | Scope tools per agent role |
| High-frequency simple cross-role need | One scoped tool for the 80% case; keep coordinator routing for the rare complex case |
| `Grep` vs. `Glob` | `Grep` = content search; `Glob` = path/filename pattern |
| Long conversation loses a specific number/date | Persistent "case facts" block, kept outside the summary |
| Escalation over- or under-triggering | Explicit criteria + few-shot, not sentiment or self-confidence |
| Multiple customer matches returned | Ask for another identifier; never pick heuristically |
| Long exploration session gives vague "typical pattern" answers | Scratchpad file of findings |
| 97% aggregate accuracy questioned | Check accuracy by document type/field segment, not just aggregate |
| Two sources disagree on a stat | Preserve both + attribution; don't silently pick one |
| Fixing false positives with "be more conservative" | Doesn't work — replace with explicit categorical criteria |
| Human escalation note has only the last message + ticket ID | Compile a real handoff: customer details, root cause, recommended action |
| Model keeps using `Grep` over a clearly more capable MCP tool | The MCP tool's description under-sells it — enhance the description, don't remove `Grep` |
| Prose instructions produce inconsistent output across attempts | Concrete input/output examples, not stronger wording |
| Multiple interacting bugs found in one pass | One detailed message covering all of them, not sequential one-at-a-time |
| Unfamiliar domain, risk of missing a design consideration | Interview pattern — have Claude ask first |
| Retry loop keeps failing on a missing required field | Check if info is genuinely absent from the source — if so, retry won't help; make the field nullable |
| Retry loop on a structural/format error (flattened array, swapped field) | Retry *with* the specific validation error included — this one is fixable |

## Exam-day logistics

- Government-issued photo ID matching registration name exactly
- Clear workspace if online-proctored (no phone, notes, or secondary monitor)
- 24-hour cancellation/reschedule window before forfeiting the fee
- NDA acceptance required before the exam starts — don't ask for or share real exam content afterward, from this guide or anyone else's

