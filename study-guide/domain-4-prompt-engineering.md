# Domain 4: Prompt Engineering & Structured Output (20%)

This domain tests whether you know how to get reliable, structured output out of Claude — and, just as importantly, whether you know the *limits* of each technique (schema compliance ≠ semantic correctness, retries fix some errors but not others).

## 4.1 Explicit Criteria to Reduce False Positives

**Concept.** Precision comes from telling the model *exactly which issues count*, not from telling it how cautious to feel. Instructions like "be conservative" or "only report high-confidence findings" sound sensible but don't measurably cut false positives: the model has no shared definition of "high confidence", so it keeps reporting the same borderline items. What works is **explicit, categorical criteria**: what to report, what to skip, and how to assign severity.

Compare:

| Vague instruction | Explicit criterion |
|---|---|
| "Check that comments are accurate." | "Flag a comment only when the behavior it claims contradicts what the code actually does (wrong return value, wrong units, a removed parameter still documented)." |
| "Only report important security issues." | "Report: user input reaching SQL, shell or file paths without validation; secrets in source; missing auth checks on new endpoints. Skip: theoretical issues in test fixtures." |
| "Be conservative about style." | "Do not report naming, formatting or import order. The linter owns those." |

**Why false positives matter so much.** Developers don't judge findings one category at a time. If the "style" category is wrong half the time, people start skimming or ignoring *all* findings, including the accurate security ones. A high false-positive category damages trust in every other category.

### Report vs. skip criteria

**Worked example — CI code-review prompt, before and after.**

Before:

```text
Review this pull request. Be thorough but conservative.
Only report issues you are highly confident about.
```

After:

```text
Review this pull request diff. Report ONLY these categories:

REPORT
1. Bugs: logic that produces wrong results for a reachable input
   (off-by-one, null dereference, wrong comparison, unhandled error path).
2. Security: untrusted input reaching a query, shell command, file path
   or HTML output without validation/escaping; credentials in code;
   new endpoints without an authorization check.
3. Comment/code contradictions: a comment or docstring whose claimed
   behavior contradicts what the code does.

SKIP (never report)
- Formatting, naming, import order (enforced by the linter).
- Patterns that match the surrounding file's existing conventions,
  even if you would write them differently.
- Suggestions for refactoring that do not fix a bug.
- Code outside the diff.

If nothing meets the REPORT criteria, return an empty findings list.
```

The "after" version replaces confidence-based filtering with a definition of scope. "Return an empty list" matters too: without it, the model tends to find *something* to say.

### Severity criteria with concrete code examples

Labels like "high/medium/low" drift unless each level is anchored to examples.

```text
SEVERITY
critical — exploitable or data-losing in production.
  e.g. query = f"SELECT * FROM users WHERE id = {request.args['id']}"
high — wrong results or crash on a normal, reachable path.
  e.g. for i in range(1, len(items)):   # skips items[0]
medium — wrong behavior only on an edge case.
  e.g. avg = total / len(rows)           # ZeroDivisionError when rows is empty
low — misleading comment or doc that could cause a future bug.
  e.g. # returns seconds   ->  return elapsed_ms
```

With one concrete snippet per level, two runs over the same diff classify the same issue the same way.

### Protecting developer trust: disable noisy categories

If one category has a high false-positive rate and the others are fine, **temporarily disable that category** while you rewrite its criteria and test against a labeled sample. Shipping fewer, accurate findings restores trust faster than shipping everything and asking developers to filter. Turn it back on once its precision is acceptable.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| "Only report high-confidence findings" | No shared definition of confidence; precision barely moves | List the categories to report and to skip |
| "Check that comments are accurate" | Invites nitpicks about wording | "Flag only when claimed behavior contradicts actual behavior" |
| Severity levels defined by adjectives only | Same issue gets different severity across runs | Give a concrete code example for each level |
| Keeping a noisy category on while iterating | Erodes trust in the accurate categories too | Temporarily disable it, fix its criteria, re-enable |
| Lowering temperature to cut false positives | Makes output more repeatable, not more correct | Fix the criteria |


**Practice.** Developers report 40% of automated code-review findings are false positives, concentrated in one category ("style consistency"). The prompt already says "only flag high-confidence issues." Best next step?

- A) Add "be even more conservative" to the prompt
- B) Define explicit categorical criteria for that finding type, and consider temporarily disabling the category while iterating
- C) Lower the model's temperature
- D) Remove the category permanently

**Answer: B.** Explicit criteria are what actually improve precision, and temporarily disabling the noisy category stops it from dragging down trust in the accurate categories while you fix it. A is another confidence-style instruction, which is exactly what already failed. C makes output more repeatable but doesn't change what the model considers worth reporting. D throws away a category that may be valuable once its criteria are fixed; disabling should be temporary.


**Practice.** A review bot classifies the same unchecked division-by-zero as "high" on one run and "low" on the next. The prompt defines severity as "critical: very serious; high: serious; medium: moderate; low: minor." What will most improve consistency?

- A) Ask the model to state its confidence next to each severity
- B) Run the review three times and take the majority severity
- C) Add a fourth sentence telling the model to be consistent
- D) Define each severity level with explicit criteria and a concrete code example of an issue at that level

**Answer: D.** Severity drifts because the levels are defined only by adjectives; anchoring each level to a criterion and a concrete code example gives the model a fixed reference to compare against. A adds information but doesn't change how the level is chosen. B triples the cost and still averages over an undefined scale. C is a vague instruction that doesn't give the model anything new to decide with.


**Practice.** A security-review prompt says "Report security issues. Ignore minor stuff." Developers complain about findings like "consider using a constant for this string" and "this local variable name could be clearer." Which rewrite best fixes the problem?

- A) "Report only security issues you are at least 90% confident about."
- B) "Report: untrusted input reaching SQL, shell or file paths unvalidated; hard-coded credentials; missing authorization checks. Skip: naming, constants, formatting and patterns already used elsewhere in the file."
- C) "Be strict and professional. Avoid trivial feedback."
- D) "Report security issues and minor stuff in separate sections."

**Answer: B.** It defines exactly what to report and lists the specific kinds of noise to skip, so the model doesn't have to guess what "minor" means. A is confidence-based filtering, which doesn't reliably improve precision. C is another vague instruction. D keeps the noise and just moves it to its own section.

## 4.2 Few-Shot Prompting

**Concept.** When detailed instructions still produce inconsistent output, **few-shot examples** are the most effective next step. Examples show the model the format you want, how to handle **ambiguous cases**, and where the line falls between acceptable and problematic. Good examples teach a *judgment* the model can apply to new cases, not a lookup table of the cases shown.

Use few-shot when:

- Output format varies between runs (some findings have a fix, some don't; locations in different formats).
- The model has to choose between plausible options (two similar tools, "is this a real test coverage gap or not").
- Extraction from varied documents returns hallucinated or empty values.

**Sizing rule:** 2–4 targeted examples. Each one should cover a case the model gets wrong, and show the *reasoning* for why one action was chosen over a plausible alternative. Ten near-identical easy examples teach less than three well-chosen hard ones.

### Ambiguous cases: show the reasoning

**Worked example — tool selection for ambiguous requests.** An agent has `search_orders` and `get_customer_history`, and keeps picking the wrong one when a request could fit both.

```text
<example>
Request: "Did Maria's last package arrive?"
Choice: search_orders(customer="Maria", limit=1)
Why: the question is about one specific shipment's status.
get_customer_history returns account-level events (sign-ups, plan
changes), not delivery status.
</example>

<example>
Request: "Has this customer had problems before?"
Choice: get_customer_history(customer_id=...)
Why: "problems before" spans complaints, refunds and escalations
across the whole account. search_orders would only show orders,
missing complaints that weren't tied to an order.
</example>
```

The "Why" lines are the point. They state the distinguishing rule (one shipment vs. account history), so the model can apply it to a request it hasn't seen, like "Was the refund for order 512 ever processed?"

**Same idea for code review — branch-level test coverage gaps:**

```text
<example>
Change: adds `if user.is_suspended: return 403` to get_profile().
Tests: test_get_profile_ok only.
Finding: REPORT. The new suspended branch has no test.
</example>

<example>
Change: renames local variable `res` to `response` in get_profile().
Tests: test_get_profile_ok only.
Finding: SKIP. No new branch or behavior; existing test still covers it.
</example>
```

### Showing the output format

To get consistent, actionable findings, show the exact shape once or twice:

```text
<example_finding>
location: billing/invoice.py:88
issue: `discount` is applied after tax, so customers are overcharged
       tax on the discounted amount.
severity: high
suggested_fix: apply discount to subtotal before calling compute_tax().
</example_finding>
```

Every later finding follows the same four fields in the same order.

### Separating acceptable patterns from genuine issues

Pair a pattern that *looks* suspicious but is fine with one that is a real problem:

```text
<example>
Code: except KeyError: return default    # in a config lookup helper
Verdict: ACCEPTABLE. Narrow exception, documented fallback.
</example>
<example>
Code: except Exception: pass             # around a payment call
Verdict: ISSUE (high). Swallows every failure, so a declined
payment is silently treated as success.
</example>
```

This cuts false positives ("never flag every `except`") while still teaching the underlying rule (broad + silent = problem), so the model generalizes to `catch (Throwable t) {}` in Java.

### Few-shot for extraction: varied documents and missing fields

Extraction prompts hallucinate or return empty values when documents don't look like the one the prompt was written for. Examples fix both.

**Worked example — research-paper extraction.** Papers put citations inline or in a bibliography, and describe methods in a dedicated section or scattered through the results.

```text
<example>
Document excerpt: "...as shown by Chen et al. (2021), sample sizes
under 30 ... [no References section]"
Extraction: citations = [{"authors": "Chen et al.", "year": 2021,
  "source": "inline"}]
Note: no bibliography exists; inline citations are still citations.
</example>

<example>
Document excerpt: "Results: ... participants (n=212, recruited via
campus email) completed..." [no Methods heading]
Extraction: sample_size = 212, recruitment = "campus email"
Note: methodology details embedded in Results count. Do not return
null just because there is no "Methods" section.
</example>
```

**Worked example — informal measurements.** A field-inspection form says "about 2 and a half feet" and "roughly a foot and change":

```text
<example>
Text: "crack is about 2 and a half feet long"
Extraction: length_value = 2.5, length_unit = "ft", approximate = true
</example>
<example>
Text: "gap of maybe a hand's width"
Extraction: length_value = null, length_unit = null,
  raw_text = "maybe a hand's width"
Note: no numeric measurement is stated. Do not convert to a guess.
</example>
```

The second example is what prevents hallucination: it shows that null is the correct answer when the value isn't actually there.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Adding more paragraphs of instructions when output is still inconsistent | Prose alone hasn't worked; more prose rarely changes that | Add 2–4 examples of the cases that fail |
| Bare input → output pairs | Model copies surface features, not the decision rule | Include a short "why this, not that" for each |
| Many easy, similar examples | Burns tokens, teaches nothing about the hard cases | Pick examples at the decision boundary |
| Only "positive" extraction examples | Model learns that every field always has a value | Include an example where the correct value is null |
| Examples all in one document layout | Fails on other layouts | Cover the layouts you actually receive (inline vs. bibliography, etc.) |


**Practice.** Two tools have nearly identical one-line descriptions, and the agent frequently picks the wrong one for ambiguous requests. You've already rewritten the descriptions (see [Domain 2](domain-2-tool-design-mcp.md)), but selection is still inconsistent in genuinely ambiguous edge cases. Next step?

- A) Add 2–4 few-shot examples showing correct selection with reasoning for edge cases
- B) Force `tool_choice` to always pick one specific tool
- C) Merge both tools into one mega-tool
- D) Increase `max_tokens`

**Answer: A.** Description quality is the first lever; few-shot examples with reasoning are the next one once descriptions alone aren't enough for genuinely ambiguous cases, and the reasoning lets the model generalize to new requests. B removes the choice entirely, so half the requests go to the wrong tool. C hides the ambiguity inside one tool instead of resolving it. D has nothing to do with which tool gets selected.


**Practice.** A paper-extraction pipeline returns `citations: []` for about 20% of papers. Manual checks show those papers *do* cite sources, but inline ("Smith, 2019") with no References section. The prompt already says "Extract all citations." What's the most effective fix?

- A) Make `citations` a required field with `minItems: 1`
- B) Retry every paper that returns an empty list
- C) Add few-shot examples showing correct extraction from a paper with only inline citations and from one with a bibliography
- D) Add "be thorough" to the prompt

**Answer: C.** The model is treating "citations" as "the bibliography"; examples covering both document structures show it that inline citations count too. A would push the model to invent citations for papers that genuinely have none. B repeats the same misunderstanding with the same prompt. D is a vague instruction that doesn't explain what was being missed.


**Practice.** Review comments are useful, but their format varies: some include a line number, some a fix, some a severity, rarely all three. Developers want every finding to have location, issue, severity and suggested fix. The instructions already list these four fields. What should you add?

- A) One or two example findings that show all four fields in the exact desired format
- B) A higher `max_tokens` so the model has room for every field
- C) A second review pass that rewrites findings into the format
- D) The instruction "Always be consistent"

**Answer: A.** When instructions alone produce inconsistent formatting, few-shot examples of the exact output format are the most effective fix. B only matters if output is being cut off, which isn't the symptom here. C adds cost and latency to patch something a single prompt change solves. D is vague and adds nothing the model can follow.

## 4.3 Structured Output with Tool Use & JSON Schemas

**Concept.** Defining a tool whose `input_schema` is your target JSON schema and having Claude "call" it is the most reliable way to get **schema-compliant output**. You don't execute the tool; you read the structured arguments from the `tool_use` block. This **eliminates JSON syntax errors** (missing braces, trailing commas, unparseable text). It does **not** prevent **semantic errors**: line items that don't sum to the total, a vendor name in the customer field, a plausible-looking date that isn't in the document.

### Defining an extraction tool

**Worked example — invoice extraction.**

```json
{
  "name": "extract_invoice",
  "description": "Record the fields of one supplier invoice. Use null for any field not present in the document. Do not infer or estimate missing values.",
  "input_schema": {
    "type": "object",
    "properties": {
      "invoice_number": {"type": "string"},
      "invoice_date": {"type": "string", "description": "ISO 8601, YYYY-MM-DD"},
      "due_date": {"type": ["string", "null"], "description": "ISO 8601, or null if not stated"},
      "vendor_tax_id": {"type": ["string", "null"]},
      "currency": {"type": "string", "enum": ["USD", "EUR", "GBP", "INR", "other"]},
      "currency_detail": {"type": ["string", "null"], "description": "Currency code if currency is 'other'"},
      "category": {"type": "string", "enum": ["utilities", "rent", "software", "travel", "other", "unclear"]},
      "category_detail": {"type": ["string", "null"], "description": "Short label if category is 'other'; reason if 'unclear'"},
      "line_items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "description": {"type": "string"},
            "amount": {"type": "number"}
          },
          "required": ["description", "amount"]
        }
      },
      "stated_total": {"type": "number"},
      "calculated_total": {"type": "number", "description": "Sum of line_items amounts"},
      "conflict_detected": {"type": "boolean", "description": "True if stated_total differs from calculated_total"}
    },
    "required": ["invoice_number", "invoice_date", "due_date", "vendor_tax_id", "currency", "category", "line_items", "stated_total", "calculated_total", "conflict_detected"]
  }
}
```

Reading the result:

```python
resp = client.messages.create(
    model=MODEL,
    max_tokens=2048,
    tools=[EXTRACT_INVOICE],
    tool_choice={"type": "tool", "name": "extract_invoice"},
    messages=[{"role": "user", "content": f"<invoice>\n{text}\n</invoice>"}],
)
call = next(b for b in resp.content if b.type == "tool_use")
data = call.input   # already a dict that matches the schema's shape
```

Note that `due_date` and `vendor_tax_id` are listed in `required` *and* typed as `["string", "null"]`. The model must always return the key, but `null` is a valid value. That keeps the output shape predictable without forcing a made-up value.

### `tool_choice`: auto, any, forced

| Value | Behavior | Use when |
|---|---|---|
| `{"type": "auto"}` | Model may call a tool **or** reply with plain text | Conversational agents where a text answer is sometimes right |
| `{"type": "any"}` | Model **must** call a tool, but chooses which | Several extraction schemas (invoice, receipt, contract) and the document type is unknown |
| `{"type": "tool", "name": "extract_metadata"}` | Model **must** call that specific tool | A particular extraction must run first, e.g. metadata before enrichment steps |

With `auto`, "please use the tool" in the prompt is a request, not a guarantee. Your code has to handle a text-only response. With `any` or a forced tool, the response starts with the tool call, so there is no text preamble before it.

**Worked example — forcing a step order.** A contract pipeline must extract metadata (parties, effective date, governing law) before an enrichment step looks up each party in a CRM. Request 1 uses `tool_choice={"type": "tool", "name": "extract_metadata"}`; request 2 passes that output to the enrichment prompt with `tool_choice={"type": "auto"}` and the CRM lookup tools.

> **Current API note:** the Claude API also offers strict tool use (`"strict": true` on a tool) and JSON outputs (`output_config.format`), which use constrained decoding to guarantee schema-valid output. They guarantee structure, not correctness, so everything in 4.4 still applies. Manual extended thinking doesn't allow `any` or forced tool choice, and some newer models reject forced tool choice entirely; the docs recommend `auto` plus strict tools in those cases. Check the [define tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools) page for your model.

### Schema design: optional fields, enums, "other" and "unclear"

- **Nullable for anything the source may not contain.** If `vendor_tax_id` must be a non-null string, the model will be pushed to produce *something*, and that something is often fabricated. Allow `null` and say in the description that `null` is correct when the value is absent.
- **`enum` + `"other"` + detail string** for categories that will grow. A closed list without `"other"` forces silent misclassification (a "consulting" invoice becomes "software"). `"other"` plus `category_detail` captures the new value, and you can review the detail strings later to decide which ones deserve their own enum value.
- **`"unclear"`** for genuinely ambiguous inputs. It lets the model say "I can't tell" instead of guessing, and gives you a value to route to human review.
- **`required` means "always present", not "always known".** Combine required keys with nullable types when you want a fixed shape.

### Format normalization rules

The schema says *what shape*; the prompt should say *how to normalize* messy source formats:

```text
Normalization rules:
- Dates: output YYYY-MM-DD. Source dates like "03/04/2026" are
  DD/MM/YYYY for vendors in the UK and EU, MM/DD/YYYY for US vendors.
  If the vendor country is unknown and day <= 12, set the date to null
  and add a note in category_detail.
- Amounts: numbers only, no currency symbols or thousands separators.
  "1.234,50 €" -> 1234.50, currency "EUR".
- Percentages: "12.5%" -> 12.5 (not 0.125).
```

Without these rules, a strict schema still accepts `"2026-04-03"` and `"2026-03-04"` for the same source date — both are valid strings.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Asking for "JSON only" in the prompt and parsing the text | Occasional malformed JSON or extra prose | Use a tool with an `input_schema` (or strict structured outputs) |
| Non-nullable required field for data that's sometimes missing | Model fabricates values to satisfy it | `["string", "null"]` plus "use null if absent" |
| Closed enum with no escape hatch | New categories get forced into the wrong bucket | Add `"other"` + a detail string, and `"unclear"` if ambiguity is real |
| `tool_choice: "auto"` when a structured result is mandatory | Model may answer in text | `"any"` (schema unknown) or forced tool (schema known) |
| Treating schema-valid output as correct | Syntax ≠ semantics | Add semantic validation (see 4.4) |


**Practice.** An invoice-extraction pipeline using `tool_use` with a strict JSON schema never produces malformed JSON, but occasionally produces line items that don't sum to the stated total. What does this tell you, and what's the fix?

- A) The schema is broken; add stricter `required` fields
- B) This is a semantic error, not a syntax error — add a `calculated_total` field to compare against `stated_total` and flag discrepancies
- C) Switch from `tool_use` to plain JSON text output
- D) Lower `max_tokens` to force conciseness

**Answer: B.** Tool use with a schema guarantees the shape of the output, not that the numbers are consistent; extracting `calculated_total` alongside `stated_total` lets your code detect the mismatch and act on it. A doesn't help because the fields are already present, they're just inconsistent. C gives up the syntax guarantee and doesn't address the semantic problem. D could truncate the output and has nothing to do with arithmetic consistency.


**Practice.** You have three different extraction schemas (invoice, receipt, contract) and don't know in advance which document type you'll receive. You want to guarantee some structured extraction happens, but let the model choose the right schema. Which `tool_choice` setting?

- A) `"auto"`
- B) `"any"`
- C) `{"type": "tool", "name": "extract_invoice"}`
- D) Omit `tool_choice` entirely

**Answer: B.** `"any"` guarantees a tool call happens (so you always get structured output) while still letting the model pick which of the three schemas fits. A and D (omitting it defaults to `auto` when tools are provided) allow a plain-text reply, so structured output isn't guaranteed. C forces the invoice schema even when the document is a receipt or a contract.


**Practice.** A contract-extraction schema has `governing_law` as a required, non-nullable string. Auditors find that for contracts with no governing-law clause, the output often says "State of Delaware," the most common value in the training set. What's the best fix?

- A) Make `governing_law` nullable, and state in its description that null is correct when the contract has no such clause
- B) Add an enum of all 50 US states
- C) Add "do not hallucinate" to the system prompt
- D) Retry any extraction that returns "State of Delaware"

**Answer: A.** A required non-null field forces the model to produce a value even when none exists, so it fills in a plausible one; a nullable field with clear instructions makes "not present" a valid answer. B still forces a choice among states and adds no way to say "none". C is a vague instruction that doesn't remove the pressure the schema creates. D would retry legitimate Delaware contracts and can't create a clause that isn't there.


**Practice.** A document pipeline must always run `extract_metadata` (title, parties, dates) before a second step uses those fields to call enrichment tools. In testing, the model sometimes skips extraction and goes straight to an enrichment tool. Which setting fixes the first request?

- A) `tool_choice: {"type": "auto"}` with a stronger instruction
- B) `tool_choice: {"type": "any"}`
- C) `tool_choice: {"type": "tool", "name": "extract_metadata"}`
- D) Remove the enrichment tools and use `"auto"`

**Answer: C.** Forcing the named tool guarantees that this specific extraction runs on the first request, before any enrichment step. A is still a suggestion the model can ignore. B guarantees *a* tool call but the model could still pick an enrichment tool. D might work by accident, but `auto` still allows a text-only reply, so extraction isn't guaranteed.

## 4.4 Validation, Retry & Feedback Loops for Extraction Quality

**Concept.** Since tool use only guarantees *syntax*, you need your own **semantic validation**, and a plan for what happens when it fails. Two error types need different handling:

| Error type | Example | Prevented by tool use? | Handled by |
|---|---|---|---|
| Schema syntax error | Malformed JSON, wrong type, missing key | Yes | The schema itself |
| Semantic error | Line items don't sum to total; vendor name in `customer` field; end date before start date | No | Your validation code + retry or review |

### Self-correction fields: `calculated_total` and `conflict_detected`

Design the schema so the model's output can be checked against itself:

- Extract **`calculated_total`** (sum of the line items) alongside **`stated_total`** (what the invoice prints). If they differ, either the extraction is wrong or the document is.
- Add a **`conflict_detected`** boolean for source documents that contradict themselves (a contract whose summary says "12-month term" and whose clause 4 says 24 months). This lets the model report the conflict instead of silently picking one value.

### Retry with error feedback

**Worked example — Pydantic validation-retry loop.**

```python
from pydantic import BaseModel, ValidationError, model_validator

class LineItem(BaseModel):
    description: str
    amount: float

class Invoice(BaseModel):
    invoice_number: str
    due_date: str | None
    line_items: list[LineItem]
    stated_total: float
    calculated_total: float
    conflict_detected: bool

    @model_validator(mode="after")
    def check_totals(self):
        actual = round(sum(i.amount for i in self.line_items), 2)
        if abs(actual - self.calculated_total) > 0.01:
            raise ValueError(
                f"calculated_total is {self.calculated_total} but line_items sum to {actual}")
        if abs(self.calculated_total - self.stated_total) > 0.01 and not self.conflict_detected:
            raise ValueError(
                "stated_total differs from calculated_total but conflict_detected is false")
        return self


def extract_invoice(text: str, max_attempts: int = 3) -> Invoice | None:
    messages = [{"role": "user", "content": f"<invoice>\n{text}\n</invoice>\nExtract this invoice."}]
    for _ in range(max_attempts):
        resp = client.messages.create(
            model=MODEL, max_tokens=2048, tools=[EXTRACT_INVOICE],
            tool_choice={"type": "tool", "name": "extract_invoice"},
            messages=messages,
        )
        call = next(b for b in resp.content if b.type == "tool_use")
        try:
            return Invoice.model_validate(call.input)
        except ValidationError as err:
            # The original document (first user turn) and the failed extraction
            # (this assistant turn) stay in the conversation; add the specific errors.
            messages.append({"role": "assistant", "content": resp.content})
            messages.append({"role": "user", "content": [{
                "type": "tool_result",
                "tool_use_id": call.id,
                "is_error": True,
                "content": f"Validation failed:\n{err}\n"
                           "Re-check the invoice and call extract_invoice again. "
                           "If a value is not in the document, use null.",
            }]})
    send_to_human_review(text, messages)
    return None
```

The retry request carries all three things the model needs to correct itself: **the original document, the failed extraction, and the specific validation errors**. "Extraction failed, try again" gives it nothing new to correct against. The loop also has a cap and a human-review exit.

### When retries help and when they don't

| Retry will likely **succeed** | Retry will **not** help |
|---|---|
| Nested line items flattened into one string | The field is genuinely absent from the document |
| Day and month swapped in a date | The value is only in an external document you didn't provide ("see Master Agreement §3") |
| Value placed in the wrong field | The document is too blurry/truncated to read the value |
| Arithmetic slip in `calculated_total` | The source itself is contradictory (that's a `conflict_detected` case, not an error) |

For the right-hand column, fix the input (provide the referenced document), fix the schema (make the field nullable), or route to a human. Retrying the same request just spends tokens and, worse, invites the model to invent a value to make the error go away.

### Feedback loops: the `detected_pattern` field

For review and extraction findings, add a **`detected_pattern`** field naming the construct that triggered each one:

```json
{
  "location": "api/users.py:41",
  "issue": "Broad exception swallowed",
  "severity": "medium",
  "detected_pattern": "bare_except_pass",
  "suggested_fix": "Catch the specific exception and log it."
}
```

When developers dismiss findings, log the dismissal with its `detected_pattern`. After a few weeks you can see, for example, that 70% of dismissals are `unused_import_in_init_py`, and add a skip rule for exactly that pattern instead of guessing at what's noisy.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Retrying with only "please try again" | No new information is given to correct against | Include the document + failed output + specific validation error |
| Retrying indefinitely when a required field is missing from the source | Retrying can't manufacture information never in the document | Recognize the absent-source case; make the field nullable instead |
| Treating every validation failure the same way | Structural errors and missing-source-data errors need different responses | Diagnose the error category before deciding retry vs. schema fix |
| Trusting schema-valid output | Semantic errors pass schema validation | Validate sums, field placement, date order in code |
| No tracking of *why* findings get dismissed over time | You keep re-discovering the same false-positive patterns from scratch | Add a `detected_pattern` field for systematic dismissal-pattern analysis |


**Practice.** An extraction fails schema validation because a required field, `vendor_tax_id`, is missing. You confirm the source invoice never contained a tax ID anywhere on the document. What should you do?

- A) Retry with the same prompt — missing-field errors are usually retry-fixable
- B) Increase `max_tokens` and retry
- C) Fabricate a placeholder value so validation passes
- D) Recognize the retry will not help since the information is genuinely absent from the source; make the field nullable instead

**Answer: D.** Retries fix format and structural problems, not a source document that doesn't contain the data; a nullable field makes "not present" a valid, honest answer. A wastes calls and pressures the model to invent a tax ID. C puts false data into your system on purpose. B changes nothing about what's in the document.


**Practice.** A retry loop needs to correct a case where a nested line-items array was incorrectly flattened into a single string on the first attempt. What should the follow-up prompt contain?

- A) Only a repeated instruction to "format correctly this time"
- B) A different, unrelated example document
- C) The original document, the failed extraction, and the specific validation error describing the flattening problem
- D) Nothing — `tool_use` with a schema should never produce this kind of error

**Answer: C.** This is a structural error, which retries handle well, as long as the model can see the source, what it produced, and exactly what was wrong. A gives the model no information about what to fix. B removes the document it needs to re-read. D is wrong in practice: a loosely typed field (or an `items` schema without structure) can still accept a flattened value, and semantic placement errors are never prevented by the schema.


**Practice.** A contract extractor sometimes fails validation because `renewal_terms` is empty. Investigation shows the contracts say "Renewal terms as per the Master Services Agreement," and the MSA isn't included in the request. What's the right response?

- A) Retry up to five times with the validation error appended
- B) Lower the temperature and retry
- C) Instruct the model to infer the most likely renewal terms
- D) Provide the referenced MSA in the request, or record the field as null with a reference to the external document, instead of retrying

**Answer: D.** The information exists only in an external document that wasn't provided, so no retry can recover it; either supply the source or record that it's elsewhere. A and B repeat a request that can't succeed with the given input. C asks the model to fabricate contract terms, which is worse than a null.


**Practice.** An invoice shows a stated total of $1,240.00, but its line items add up to $1,190.00. The model extracts both values correctly. How should the pipeline represent this?

- A) Overwrite `stated_total` with the line-item sum so validation passes
- B) Keep both values and set `conflict_detected: true` so the invoice is flagged for review
- C) Retry until the model returns matching totals
- D) Drop the line items and keep only the stated total

**Answer: B.** The source itself is inconsistent, so the correct extraction preserves both values and flags the conflict for a human to resolve. A hides a real discrepancy (possibly a billing error). C pushes the model to change correct values until they match, which corrupts the data. D throws away the evidence of the problem.

## 4.5 Batch Processing with the Message Batches API

**Concept.** The **Message Batches API** processes many Messages requests asynchronously.

| Property | Value |
|---|---|
| Cost | 50% of standard prices |
| Processing window | Up to 24 hours, **no guaranteed latency** (most batches finish much sooner, but you can't depend on it) |
| Correlation | `custom_id` on each request; results can come back **in any order** |
| Tool calling | You can include tool definitions (e.g. a forced extraction tool), but there's **no multi-turn tool calling within a request**: if Claude asks for a tool, your code can't run it and return the result mid-request |
| Completion | Poll the batch until `processing_status` is `"ended"`, then read results |
| Per-request result types | `succeeded`, `errored`, `canceled`, `expired` |

**Decision rule:** batch = non-blocking, latency-tolerant work (overnight reports, weekly audits, nightly test generation, backfills). Synchronous API = anything someone or something is waiting on (pre-merge checks, interactive agents, agent loops that execute tools).

### Building a batch with `custom_id`

**Worked example — nightly contract extraction.**

```python
requests = [
    {
        "custom_id": f"contract-{doc.id}",   # 1–64 chars: letters, digits, - and _
        "params": {
            "model": MODEL,
            "max_tokens": 4096,
            "tools": [EXTRACT_CONTRACT],
            "tool_choice": {"type": "tool", "name": "extract_contract"},
            "messages": [{"role": "user", "content": f"<contract>\n{doc.text}\n</contract>"}],
        },
    }
    for doc in todays_contracts
]
batch = client.messages.batches.create(requests=requests)
```

Single-turn extraction with a forced tool works well in a batch: the "tool call" *is* the output, and nothing needs to be executed.

### Handling failures: resubmit only what failed

```python
failed, too_long = [], []
for r in client.messages.batches.results(batch.id):
    if r.result.type == "succeeded":
        save(r.custom_id, r.result.message)
    elif r.result.type == "errored" and r.result.error.error.type == "invalid_request_error":
        too_long.append(r.custom_id)      # e.g. document exceeded the context window
    else:                                   # expired, canceled, server errors
        failed.append(r.custom_id)

retry_requests = (
    [build_request(cid) for cid in failed] +
    [req for cid in too_long for req in build_chunked_requests(cid)]  # split into sections
)
if retry_requests:
    client.messages.batches.create(requests=retry_requests)
```

Key points: match results by `custom_id`, never by position; resubmit **only** the failed items; and **modify** the ones that failed for a reason (chunk an oversized contract into sections with IDs like `contract-123-part2`) rather than resubmitting them unchanged.

### Choosing submission frequency from an SLA

If the business promises results within **30 hours** of a document arriving and the batch window can take up to **24 hours**, the worst case is: document arrives just after a submission, waits for the next one, then takes the full 24 hours.

```text
max wait for next submission + 24h processing  <=  30h
=> submission interval <= 6h
```

Submitting every **4 hours** leaves a 2-hour buffer for collecting results, validating them and resubmitting a few failures. Submitting once a day would break the SLA for anything that arrives just after the daily cutoff.

### Refine the prompt on a sample first

Before sending 50,000 documents, run the prompt on a **representative sample** (a few dozen documents covering each layout and edge case), fix the failures, then batch the full set. A 10% first-pass failure rate on 50,000 documents means 5,000 retries, more cost and another processing window. Tuning first maximizes the first-pass success rate.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Batching a blocking pre-merge check | Up to 24h with no latency guarantee | Synchronous API for anything blocking |
| Batching an agent that executes tools between turns | No multi-turn tool calling within a batch request | Run tool-executing loops synchronously; batch single-turn work |
| Matching results to inputs by order | Results can return in any order | Use `custom_id` |
| Resubmitting the whole batch after a few failures | Pays again for successful items | Resubmit only failed `custom_id`s, modified where needed |
| Running the full volume on an untested prompt | Every prompt flaw is multiplied by the volume | Iterate on a sample set first |


**Practice.** Your manager wants to move both (a) a blocking pre-merge security check and (b) an overnight technical-debt report to the Message Batches API for the 50% cost savings. What's the correct call?

- A) Batch both
- B) Keep both synchronous to avoid `custom_id` correlation complexity
- C) Batch both with a real-time fallback if the batch takes too long
- D) Batch the overnight report only; keep the pre-merge check on synchronous real-time calls

**Answer: D.** The overnight report is latency-tolerant, so it's a good batch candidate, while a blocking pre-merge check needs a predictable response time that the batch API doesn't guarantee. A blocks developers for an unpredictable time of up to 24 hours. B gives up the 50% savings for no reason; `custom_id` correlation is simple. C adds complexity and still delays every merge by the fallback timeout.


**Practice.** A nightly batch of 8,000 invoice extractions finishes with 7,850 `succeeded`, 120 `expired`, and 30 `errored` results whose errors show the prompt exceeded the context window. What should you do next?

- A) Resubmit all 8,000 requests in a new batch
- B) Resubmit all 150 failed requests unchanged
- C) Resubmit the 120 expired requests unchanged, and split the 30 oversized documents into smaller chunks before resubmitting, all identified by `custom_id`
- D) Move the whole workload to the synchronous API

**Answer: C.** Only failed items should be resubmitted, and items that failed for a specific reason need that reason fixed; oversized documents will fail again unless they're chunked. A pays twice for 7,850 successful results. B resubmits the 30 oversized requests unchanged, so they'll fail the same way. D gives up the batch discount for a nightly job that isn't latency-sensitive.


**Practice.** A compliance team promises customers that every uploaded document is analyzed within 30 hours. Analysis runs through the Message Batches API, which can take up to 24 hours per batch. How often should batches be submitted?

- A) Every 4 hours
- B) Once every 24 hours
- C) Every 12 hours
- D) Once every 30 hours

**Answer: A.** In the worst case, a document arrives just after a submission and waits a full interval before 24 hours of processing, so the interval must be at most 6 hours; 4 hours meets that and leaves time to handle failures. B means a document can wait almost 24 hours plus 24 hours of processing, well past 30. C allows up to 36 hours. D can exceed 54 hours.

## 4.6 Multi-Instance & Multi-Pass Review Architectures

**Concept.** A model reviewing its own output **in the same session** still has the reasoning that produced it. It tends to re-confirm that reasoning rather than question it. Telling it to "be critical" or giving it more thinking time doesn't remove that context. A **second, independent instance** — a new request with only the code (and the spec), no generation history — catches subtle issues more reliably.

### Independent review instance

**Worked example — generator/reviewer split in CI.**

```python
# Step 1: generate (session A)
fix = generate_fix(issue_description)          # has all the reasoning context

# Step 2: review in a fresh request (instance B) — no shared messages
review = client.messages.create(
    model=MODEL,
    max_tokens=4096,
    system=REVIEW_CRITERIA,                     # explicit criteria from 4.1
    tools=[REPORT_FINDINGS],
    tool_choice={"type": "tool", "name": "report_findings"},
    messages=[{"role": "user", "content":
        f"<spec>\n{issue_description}\n</spec>\n<diff>\n{fix.diff}\n</diff>"}],
)
```

Instance B sees the diff and the requirement, not the generator's explanation of why the diff is correct. That's the point.

### Multi-pass review for large changes

A 25-file pull request reviewed in one pass gets **diluted attention** (shallow comments on every file, deep analysis of none) and sometimes **contradictory findings** (file 3 "should validate input," file 19 "validation is redundant here, it's done upstream").

Split it:

```text
Pass 1..N  per-file local review (one request per file, can run in parallel)
           -> local bugs, error handling, security issues inside the file
Pass N+1   cross-file integration review
           -> input: the diff summary + per-file findings + interfaces
           -> data flow across files, contract mismatches between caller
              and callee, duplicated or missing validation
```

The integration pass is where the "validated upstream or not" question gets answered once, with the full picture.

### Confidence-based routing with a verification pass

Have each finding carry a self-reported confidence, then route on it:

```json
{"location": "orders/api.py:57", "issue": "Missing auth check on DELETE",
 "severity": "critical", "confidence": 0.92, "detected_pattern": "unprotected_route"}
```

```text
confidence >= 0.85  -> post as a PR comment
0.5 – 0.85          -> verification pass: a separate instance re-checks
                       this one finding against the code, confirm or drop
< 0.5               -> log only (feeds the detected_pattern analysis)
```

Self-reported confidence isn't a filter by itself (see 4.1); it's a **routing signal**. Calibrate the thresholds against a labeled sample of past findings so that "0.85" actually corresponds to a high hit rate.

### Anti-patterns → fixes

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Same-session self-review | Generator's reasoning biases the review | Independent instance without generation context |
| "Be extra critical of your own work" | Wording doesn't remove context the model already has | Fresh request with only the artifact and spec |
| One pass over a large multi-file diff | Attention dilution, contradictory findings | Per-file passes + a cross-file integration pass |
| Using confidence as the only filter | Uncalibrated; drops real issues, keeps confident wrong ones | Use confidence to route to verification or review, calibrated on labeled data |


**Practice.** A team has Claude Code generate a bug fix and, in the same session, immediately asks it to review that same fix before merging. The reviews consistently miss subtle logic issues that a second human reviewer catches. A teammate suggests adding "be extra critical of your own work" to the review prompt. Will that fix it?

- A) Yes — an explicit self-critical instruction is enough to overcome the same-session bias
- B) No — the session still retains its generation reasoning regardless of prompt wording; use an independent review instance instead
- C) Yes, but only if combined with a lower temperature
- D) No — this can only be fixed by switching to a larger model

**Answer: B.** The bias comes from the session retaining its own prior reasoning, not from insufficiently forceful wording, and an instruction can't undo context the model already has; a fresh, independent instance with no generation history is the reliable fix (see also [Domain 3](domain-3-claude-code-workflows.md)). A overestimates what wording can change. C affects output variability, not the anchoring on prior reasoning. D misidentifies the cause: a larger model in the same session has the same context.


**Practice.** An automated reviewer analyzes a 30-file refactor in a single request. Findings are shallow, and two findings contradict each other about whether input validation happens in the controller or the service layer. What's the best redesign?

- A) Run per-file review passes for local issues, then a separate integration pass that looks at cross-file data flow
- B) Increase `max_tokens` so the single pass can write more
- C) Ask the model to "pay equal attention to all files"
- D) Review only the ten largest files

**Answer: A.** Per-file passes give each file focused attention, and a dedicated integration pass resolves cross-file questions such as where validation happens, using the full picture once. B gives more room for output but doesn't fix diluted attention on the input. C is a vague instruction that doesn't change how much each file gets analyzed. D silently skips two-thirds of the change.


**Practice.** A review pipeline produces about 60 findings per week. Posting all of them annoys developers, but dropping low-confidence findings sometimes loses real bugs. Each finding already includes a self-reported confidence score. Which design best uses that score?

- A) Post only findings with confidence above 0.95 and discard the rest
- B) Remove the confidence field because self-reported confidence is meaningless
- C) Post high-confidence findings, send mid-confidence ones to an independent verification pass, and log low-confidence ones, with thresholds calibrated on a labeled sample
- D) Ask the model to raise its confidence threshold in the prompt

**Answer: C.** Confidence works best as a routing signal: confident findings go straight through, uncertain ones get a second independent check, and calibration against labeled data makes the thresholds meaningful. A uses confidence as a hard filter and loses the real bugs the team is worried about. B throws away a useful signal instead of calibrating it. D is confidence-based filtering in the prompt, which doesn't reliably improve precision.

<!-- support-footer -->
---

> Created by **Utkarsh Agarwal** — certified Claude Certified Architect (Foundations & Professional).
> Found this useful? [⭐ Star the repo on GitHub](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) · [💼 Follow me on LinkedIn](https://www.linkedin.com/in/utkarsh-agarwal-ua0235/) · [☕ Buy me a coffee](https://utkarsh1agarwal.github.io/claude-architect-exam-guide/#support)
