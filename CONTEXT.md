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
One run of a study mode — `exam`, `practice`, `sprint`, or `review` — with status `in-progress`, `completed`, or `expired`.
_Avoid_: attempt, run, quiz, test

**Round**:
A practice, sprint, or review Session as the learner experiences it: a fixed draw of up to 10 Questions from one pool, answered in order, ended by a results screen. The exam is a Session but never a Round; a Round is never resumed.
_Avoid_: quiz, set, lesson, batch, run

**Pool**:
The set of Questions a Round draws from: the whole bank, one Domain, one Topic, or the review deck. A Round draws never-answered Questions first, then least-recently-answered, shuffled, up to 10. A Topic Pool is reached only by choosing a weak area, never from a picker.
_Avoid_: filter, scope, category, question set

**Answer**:
One response to one Question within one Session. Immutable once submitted; the atomic unit all analytics derive from. Its picks are never empty except for a Sprint timeout, which records an incorrect Answer with whatever was picked, possibly nothing. A dangling Answer (its Question no longer in the bank) is skipped by analytics, never counted or crashed on.
_Avoid_: response, submission, result

**Selection**:
The mutable, provisional choice(s) a user holds on a Question during an in-progress exam Session; persisted on the Session so resume works, and converted to immutable Answers only when the Session terminates. An incomplete multi-select Selection converts to unanswered. Rounds have no Selections: a pick in a Round lives in memory only until it becomes an Answer.
_Avoid_: draft answer, pending answer

**Sprint**:
A Round in which every Question runs against the Shot clock. Reaching zero records an incorrect Answer. A Sprint always reveals after each Question, whatever the feedback setting.
_Avoid_: timed practice, speed round, blitz

**Shot clock**:
The fixed 20-second countdown each Question gets in a Sprint. Derived from the wall clock, never paused, reset on every Question. Not the Deadline, which belongs to the exam.
_Avoid_: timer, countdown, question timer, deadline

**Feedback timing**:
When a Practice Round reveals a Question's correct options and explanations: after each Answer (instant, the default) or only on the results screen (end of round). Sprint and Review Rounds always reveal instantly. A per-device preference, not progress.
_Avoid_: feedback mode, quiz mode, test mode

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

**XP**:
Experience points an Answer earned, computed when it was submitted and stored on the Answer for good: the formula in force at that moment is final. Correct Answers earn XP, with Streak and Sprint bonuses; exam Answers earn the flat base. Total XP is the sum over every Answer, dangling ones included.
_Avoid_: points, score (for XP), experience

**Level**:
The rank total XP has reached: 150 XP for the first step up, 50 more for each step after. Never stored; always read off total XP.
_Avoid_: rank, tier, grade

**Streak**:
Consecutive correct Answers within one Round. A wrong Answer or a new Round resets it to zero. Best streak is the longest ever, read off the Answer log.
_Avoid_: combo, chain, run
