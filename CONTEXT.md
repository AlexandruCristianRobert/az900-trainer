# AZ-900 Trainer

A study app for the Microsoft Azure Fundamentals (AZ-900) exam: an original question bank practiced through timed exam simulations, instant-feedback practice, and a review deck, with weak-area analytics.

## Language

### Content

**Question**:
An immutable, authored bank item: a stem, its options, the correct option(s), a per-option explanation, and exactly one Topic.
_Avoid_: item, card, exercise

**Domain**:
One of the three top-level skill groups of the official exam: Cloud concepts; Azure architecture and services; Azure management and governance.
_Avoid_: section, module, category

**Topic**:
One of the eleven named skill areas in Microsoft's official AZ-900 study guide (e.g. "Describe cloud computing"). A fixed set; every Question has exactly one.
_Avoid_: tag, skill, subcategory

### Study flow

**Session**:
One run of a study mode — `exam`, `practice`, or `review` — with status `in-progress`, `completed`, or `expired`.
_Avoid_: attempt, run, quiz, test

**Answer**:
One response to one Question within one Session. Immutable once submitted; the atomic unit all analytics derive from. A dangling Answer (its Question no longer in the bank) is skipped by analytics, never counted or crashed on.
_Avoid_: response, submission, result

**Selection**:
The mutable, provisional choice(s) a user holds on a Question during an in-progress exam Session; persisted on the Session so resume works, and converted to immutable Answers only when the Session terminates. An incomplete multi-select Selection converts to unanswered. Practice and review modes have no Selections.
_Avoid_: draft answer, pending answer

**Deadline**:
The wall-clock instant, fixed when an exam Session starts, at which the Session auto-submits. It never pauses; abandoning an exam truncates the Deadline to now.
_Avoid_: timer, countdown

**Expired**:
The terminal status of an exam Session that reached its Deadline without being completed (including explicit abandonment). Unanswered Questions score as incorrect.
_Avoid_: abandoned, forfeited, failed

**Lazy finalization**:
The sweep at app load that completes stranded non-exam Sessions and expires overdue exam Sessions (converting their Selections to Answers) before anything reads history.
_Avoid_: cleanup, garbage collection

### Progress

**Estimated score**:
The displayed exam result, `round(1000 × correct / 40)` against the 700 pass line. Explicitly an estimate — Microsoft's real scaled-scoring model is unpublished.
_Avoid_: scaled score, score (unqualified, in exam results)

**Review deck**:
The set of Questions whose latest Answer was incorrect. Membership is binary: an incorrect Answer in any mode adds a Question, a correct Answer in any mode removes it.
_Avoid_: mistakes, missed questions, wrong answers

**Weak area**:
A Topic with at least 4 submitted Answers and accuracy below 70%. A Topic with fewer than 4 Answers has no verdict ("not enough data"), never a positive one.
_Avoid_: weak topic, problem area
