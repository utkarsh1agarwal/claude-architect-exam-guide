# Practice Question Template

Copy this format when contributing new questions. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full ground rules — most importantly, **no real or leaked exam content**.

## Question (goes in the relevant `mock-exam/exam-*-questions.md` file, under the right scenario heading)

```markdown
**Q<N>.** [2–4 sentences of scenario-grounded context, then the actual question. Prefer the
"here's what's happening in production / in the logs, what's the fix" shape — it's the
dominant pattern in the exam's own published sample questions.]

- A) ...
- B) ...
- C) ...
- D) ...
```

## Answer key entry (goes in the matching `mock-exam/exam-*-answers.md` file, same question number)

```markdown
**Q<N>. Answer: X** *(D<domain number>)* — [2–4 sentence rationale explaining why the
correct answer is right. Briefly note why the most tempting distractor is wrong if it
isn't obvious.]
```

## Checklist before submitting

- [ ] Original scenario and wording — not reproduced or paraphrased from real exam content
- [ ] Grounded in a specific task statement from the official Exam Guide, Section 6
- [ ] Exactly one correct answer (unless explicitly marked multi-select, with the count stated in the stem)
- [ ] Distractors are plausible, not obviously silly — the exam favors "plausible but wrong" over "absurd"
- [ ] Rationale explains *why*, not just *what*
- [ ] Domain tag included in the answer key

