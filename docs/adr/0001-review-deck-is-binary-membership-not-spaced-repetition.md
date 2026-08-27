# Review deck is binary membership, not spaced repetition

The review deck could have been a spaced-repetition scheduler (SM-2 or similar), which is the default expectation for study apps. We deliberately made it a binary set instead: a Question is in the deck iff its latest Answer was incorrect, regardless of which mode that Answer came from. Scheduling metadata would have to be shaped into the Answer log from day one to be retrofittable, so this is decided now, not deferred silently: v1 optimizes for a short exam-prep window (weeks, not months) where "drill what you last got wrong" is the whole job, and a scheduler's ease/interval bookkeeping adds model complexity with little payoff at a ~100-question bank size.

## Consequences

- Answers record only (question, selection, correctness, timestamp) — no ease factors or due dates.
- A lucky correct guess removes a Question from the deck; this self-heals on the next incorrect Answer.
- Adding spaced repetition later means new scheduling state, not reinterpreting existing Answers.
