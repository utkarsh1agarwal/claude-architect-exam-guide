# Domain 4: Prompt Engineering & Structured Output (20%)

This domain tests whether you know how to get reliable, structured output out of Claude — and, just as importantly, whether you know the *limits* of each technique (schema compliance ≠ semantic correctness, retries fix some errors but not others).

## 4.1 `tool_use` + JSON Schema = Guaranteed Structure

**Concept.** Using `tool_use` with a JSON schema is the most reliable way to force schema-compliant output — it eliminates **syntax** errors (malformed JSON) but **not semantic** errors (e.g., line items that don't sum to the stated total, or a value landing in the wrong field).

**`tool_choice` options:**

| Value | Behavior |
|---|---|
| `"auto"` | Model may respond with plain text instead of calling a tool |
| `"any"` | Model must call *some* tool, but picks which |
| `{"type": "tool", "name": "X"}` | Model must call tool `X` specifically (forced) |

**Schema design tips:**

- Make fields **optional/nullable** when the source document might not contain them — otherwise the model may **fabricate values** to satisfy a "required" constraint.
- Use `enum` plus an `"other"` + detail-string pattern for extensible categories (avoids both over-fitting to a fixed list and silent misclassification).

```json
{
  "name": "extract_invoice",
  "input_schema": {
    "type": "object",
    "properties": {
      "invoice_number": {"type": "string"},
      "due_date": {"type": ["string", "null"]},
      "line_items": {"type": "array", "items": {"type": "object"}},
      "stated_total": {"type": "number"},
      "calculated_total": {"type": "number"},
      "category": {"type": "string", "enum": ["utilities", "rent", "other"]},
      "category_detail": {"type": ["string", "null"]}
    },
    "required": ["invoice_number", "line_items", "stated_total", "calculated_total"]
  }
}
```

Comparing `calculated_total` against `stated_total` lets you flag semantic mismatches downstream — schema compliance alone wouldn't catch that.


**Practice.** An invoice-extraction pipeline using `tool_use` with a strict JSON schema never produces malformed JSON, but occasionally produces line items that don't sum to the stated total. What does this tell you, and what's the fix?

A) The schema is broken; add stricter `required` fields
B) This is a semantic error, not a syntax error — add a `calculated_total` field to compare against `stated_total` and flag discrepancies
C) Switch from `tool_use` to plain JSON text output
D) Lower `max_tokens` to force conciseness

**Answer: B.**


**Practice.** You have three different extraction schemas (invoice, receipt, contract) and don't know in advance which document type you'll receive. You want to guarantee some structured extraction happens, but let the model choose the right schema. Which `tool_choice` setting?

A) `"auto"`
B) `"any"`
C) `{"type": "tool", "name": "extract_invoice"}`
D) Omit `tool_choice` entirely

**Answer: B.** `"any"` guarantees a tool call happens (so you always get structured output) while still letting the model pick which of the three schemas fits.

## Few-Shot Prompting

**When to reach for few-shot:** when detailed *prose* instructions alone produce inconsistent output — especially for **ambiguous cases** (tool selection among similar tools, edge-case handling, format consistency). Few-shot examples let the model **generalize** the underlying judgment to *novel* patterns, not just memorize the cases shown.

**Sizing rule of thumb:** 2–4 well-chosen examples, each showing *reasoning* for why one action was picked over a plausible alternative — not just bare input/output pairs.


**Practice.** Two tools have nearly identical one-line descriptions, and the agent frequently picks the wrong one for ambiguous requests. You've already rewritten the descriptions (see [Domain 2](domain-2-tool-design-mcp.md#21-tool-description-quality-is-the-1-selection-lever)), but selection is still inconsistent in genuinely ambiguous edge cases. Next step?

A) Add 2–4 few-shot examples showing correct selection with reasoning for edge cases
B) Force `tool_choice` to always pick one specific tool
C) Merge both tools into one mega-tool
D) Increase `max_tokens`

**Answer: A.** Description quality is always the first lever; few-shot is the next one once descriptions alone aren't enough for genuinely ambiguous edge cases.

## Reducing False Positives: Explicit Criteria > Vague Instructions

**Key finding.** General instructions like "be conservative" or "only report high-confidence findings" do **not** meaningfully reduce false positives. What works is **explicit, categorical criteria** — e.g., "flag a comment only when the claimed behavior contradicts actual code behavior," instead of "check that comments are accurate."

If one category of finding has a very high false-positive rate, it's reasonable to **temporarily disable** that category while you improve the prompt — better to under-report than to erode developer trust across *all* categories.


**Practice.** Developers report 40% of automated code-review findings are false positives, concentrated in one category ("style consistency"). The prompt already says "only flag high-confidence issues." Best next step?

A) Add "be even more conservative" to the prompt
B) Define explicit categorical criteria for that finding type, and consider temporarily disabling the category while iterating
C) Lower the model's temperature
D) Remove the category permanently

**Answer: B.**

## Validation, Retry & Feedback Loops for Extraction Quality

**Concept.** `tool_use` + JSON schema eliminates *syntax* errors but not *semantic* ones. When a semantic validation check fails, you need a retry loop — but retries are not universally effective, and knowing *when they won't help* is exactly as testable as knowing how to build them.

**Building the retry loop.** On failure, send a follow-up request containing:

1. The original source document
2. The failed extraction output
3. The **specific validation error(s)** that occurred — not just "extraction failed"

**When retry will likely succeed:** the error is a *format or structural* problem — a flattened nested array, a swapped field, a date parsed in the wrong locale format.

**When retry will NOT help:** the required information is **genuinely absent from the source document**. No amount of retrying manufactures information that isn't there — the real fix is upstream, in the schema: make the field nullable/optional.

**Feedback-loop tracking:** attach a `detected_pattern` field to structured findings/extractions so you can later analyze, in aggregate, which specific patterns trigger errors or get dismissed as false positives — turning one-off fixes into a systematic quality-improvement loop.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Retrying with only "please try again" | No new information is given to correct against | Include the document + failed output + specific validation error |
| Retrying indefinitely when a required field is missing from the source | Retrying can't manufacture information never in the document | Recognize the absent-source case; make the field nullable instead |
| Treating every validation failure the same way | Structural errors and missing-source-data errors need different responses | Diagnose the error category before deciding retry vs. schema fix |
| No tracking of *why* findings get dismissed over time | You keep re-discovering the same false-positive patterns from scratch | Add a `detected_pattern` field for systematic dismissal-pattern analysis |


**Practice.** An extraction fails schema validation because a required field, `vendor_tax_id`, is missing. You confirm the source invoice never contained a tax ID anywhere on the document. What should you do?

A) Retry with the same prompt — missing-field errors are usually retry-fixable
B) Recognize the retry will not help since the information is genuinely absent from the source; make the field nullable instead
C) Fabricate a placeholder value so validation passes
D) Increase `max_tokens` and retry

**Answer: B.** Retries fix *format* problems, not the source document not containing the data.


**Practice.** A retry loop needs to correct a case where a nested line-items array was incorrectly flattened into a single string on the first attempt. What should the follow-up prompt contain?

A) Only a repeated instruction to "format correctly this time"
B) The original document, the failed extraction, and the specific validation error describing the flattening problem
C) A different, unrelated example document
D) Nothing — `tool_use` with a schema should never produce this kind of error

**Answer: B.**

## Message Batches API

| Property | Value |
|---|---|
| Cost savings | 50% |
| Processing window | Up to 24 hours, **no latency SLA** |
| Multi-turn tool calling mid-request | **Not supported** |
| Correlation | `custom_id` field |

**Decision rule:** batch = non-blocking, latency-tolerant (overnight reports, weekly audits). Never for blocking workflows (pre-merge checks, anything a human is actively waiting on).


**Practice.** Your manager wants to move both (a) a blocking pre-merge security check and (b) an overnight technical-debt report to the Message Batches API for the 50% cost savings. What's the correct call?

A) Batch both
B) Batch the overnight report only; keep the pre-merge check on synchronous real-time calls
C) Keep both synchronous to avoid `custom_id` correlation complexity
D) Batch both with a real-time fallback if the batch takes too long

**Answer: B.**

## Multi-Instance & Multi-Pass Review Architectures

**Concept.** A model retains reasoning context from generation, making it less likely to question its own decisions within the same session. Independent review instances — without that prior reasoning context — catch subtle issues more reliably than self-review instructions or extended thinking alone.

For large multi-file changes, split reviews into **per-file local passes** plus a separate **cross-file integration pass**, rather than one pass across everything at once — this avoids attention dilution and contradictory findings (see also [Domain 3 → CI/CD Integration](domain-3-claude-code-workflows.md#36-cicd-integration)).


**Practice.** A team has Claude Code generate a bug fix and, in the same session, immediately asks it to review that same fix before merging. The reviews consistently miss subtle logic issues that a second human reviewer catches. A teammate suggests adding "be extra critical of your own work" to the review prompt. Will that fix it?

A) Yes — an explicit self-critical instruction is enough to overcome the same-session bias
B) No — the session still retains its generation reasoning regardless of prompt wording; use an independent review instance instead
C) Yes, but only if combined with a lower temperature
D) No — this can only be fixed by switching to a larger model

**Answer: B.** This is the same finding as [Domain 3 → CI/CD Integration](domain-3-claude-code-workflows.md#36-cicd-integration): the bias comes from the session retaining its own prior reasoning, not from insufficiently forceful wording — an instruction can't undo context the model already has. A fresh, independent instance with no generation history is the reliable fix.

