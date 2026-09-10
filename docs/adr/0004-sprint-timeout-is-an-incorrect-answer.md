# A Sprint timeout is an incorrect Answer, even with nothing picked

When the Shot clock reaches zero in a Sprint, the app records an incorrect Answer carrying whatever the learner had picked, which may be nothing. This is the one place an Answer's picks can be empty; everywhere else an incomplete pick produces no Answer (the exam's finalization drops them). We chose it over "a timeout records nothing" because a Sprint whose failures leave no trace has no stakes, and a Question the learner could not commit to in 20 seconds belongs in the review deck and in the Topic's accuracy. We rejected the split rule (partial pick counts, empty pick doesn't) because the learner cannot predict which timeouts count.

## Consequences

- Analytics and the review deck treat a timeout exactly like a wrong pick; there is no separate "too slow" verdict.
- Code that assumed `selected` is non-empty must tolerate `[]` on Sprint Answers.
- Reverting this later means deciding what to do with stored empty-pick Answers, so it is recorded here rather than left implicit.
