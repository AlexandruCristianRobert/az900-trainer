# AZ-900 Trainer — Converged Specification

Product spec resulting from a grilling session (2026-08-27). Canonical vocabulary lives in `CONTEXT.md`; architectural decisions in `docs/adr/`. This document records the behavioral decisions.

## What this is

A local-first Vue 3 study app for the Microsoft AZ-900 (Azure Fundamentals) exam, modeled on what makes zerotoarchitect.com effective: original practice questions with per-option explanations, domain/topic practice, full timed exam simulation, and weak-area analytics.

**Name**: AZ-900 Trainer. Persistent footer disclaimer: *"Unofficial study aid. Not affiliated with or endorsed by Microsoft. All questions are original, written from the public AZ-900 study guide objectives."* The footer also shows the study-guide vintage the bank was authored against ("AZ-900 skills measured as of July 20, 2026").

## Question bank

- 90 questions minimum, split exactly **25 / 34 / 31** across the domains (cloud-concepts / architecture-services / management-governance); per-topic distribution 9-8-8, 8-9-8-9, 8-8-8-7 over the 11 official Topics.
- Every Question: stem, options with per-option explanations, correct option id(s), exactly one Topic, optional stable MS Learn link (omitted when uncertain). No authored difficulty field.
- `single`: exactly 4 options, 1 correct. `multi`: 4–5 options, 2–3 correct, correct < options; stem states "Select two"/"Select three" matching the correct count.
- Content IDs are stable and human-readable (`cc-001`, `arch-014`, `gov-031`); runtime entities (Session, Answer) use `crypto.randomUUID()` (ADR-0003). Timestamps are ISO-8601 UTC.
- A structural validation test suite enforces all mechanical rules above.
- Dangling Answers (Question later removed/renamed): analytics skip them, review deck drops them, nothing crashes.

## Exam mode

- Fixed blueprint: **40 questions, 45:00, domain split 12 / 15 / 13**, sampled least-recently-answered-first per domain (never-answered first, random tiebreak), no repeats within a Session, presentation order shuffled.
- **Estimated score** = `round(1000 × correct / 40)`, pass line **700**, always captioned "Estimated score — Microsoft uses an unpublished scaled model." Multi-select scores all-or-nothing.
- **Deadline** (wall-clock ISO timestamp, start + 45:00) is stamped at start and never pauses. Countdown renders from `deadline − now` on a 1s interval — never a decremented counter.
- **Selections** (provisional per-question choices) are stored on the in-progress Session and persisted so resume works; they convert to immutable Answers only at termination. An incomplete multi-select Selection converts to **no Answer** (unanswered = incorrect for the score; no analytics impact).
- At most **one in-progress exam Session**. Reopen before Deadline → resume with remaining time. Reopen after → auto-expire. Explicit abandon → truncate Deadline to now, status `expired`. At 00:00 in an open tab → auto-submit in place (complete Selection on the open question commits; incomplete multi discards) and navigate to results.
- Free prev/next navigation plus a question-number grid (answered/unanswered/current states). No flag-for-review in v1. Leaving `/exam` mid-session shows a confirm stating the clock keeps running (leaving does NOT abandon).

## Practice & review modes

- Practice: filter by Domain/Topic, per-question submit (gated on a complete selection), instant grading with all explanations shown.
- Review: identical flow over the **review deck** = Questions whose latest Answer (any mode) was incorrect (ADR-0001 — binary membership, no spaced repetition).
- One Answer per Question per Session; Answers are immutable; no re-answering within a session.
- Practice/review Sessions are created on the **first Answer** (no empty-session litter), are never resumed, and are auto-completed on leaving the screen. Sessions stranded by a killed tab are handled by **lazy finalization**: on app load, in-progress non-exam Sessions are marked completed, and overdue exam Sessions are expired (Selections converted) — before anything reads history.

## Analytics (pure derivations of the Answer log — nothing precomputed)

- **Weak area**: Topic with ≥ 4 submitted Answers AND accuracy < 70%. Fewer than 4 → "not enough data," never green. Domain accuracy always shown.
- Score history: all terminated exam Sessions (completed and expired; expired labeled "Not finished"), never filtered.
- Results page: one shared view for completed/expired; unanswered questions render explicitly as "Unanswered"; score 0 is shown as 0.
- All submitted Answers feed analytics regardless of Session fate.

## Persistence (ADR-0002)

- Single async `StudyRepository`: `getQuestions, getSessions, getSession, saveSession (upsert), saveAnswers (batch), getAnswers, replaceAll(sessions, answers)`. The last backs import (with data) and reset (with empty arrays), added by the completeness sweep.
- Exactly one implementation in v1: `LocalStorageRepository`; the storage key is private to that module. Supabase is a documented future adapter (README "Adding Supabase").
- Settings affordances: **Export progress** (JSON download), **Import progress** (file picker, replaces current data), **Reset all progress** (confirmed; clears Sessions/Answers, never Questions).

## First-run / empty states

- Weak-area panel: "Not enough data yet." Score history: "No exams yet." Review deck: "No missed questions — they'll collect here."
- Primary first-run CTA: **"Take a baseline exam"**; secondary: "Practice by topic."

## Quality floor

- Accessibility baseline: options are real radio/checkbox inputs in a `fieldset` with the stem as `legend`; full keyboard operability with visible focus; timer announces via `aria-live="polite"` at 5:00 and 1:00 only; `prefers-reduced-motion` respected.
- Responsive to mobile; the question grid wraps. Light + dark theme via CSS custom properties honoring `prefers-color-scheme`.
- Deliberately out of v1 (recorded in README): flag-for-review, per-question timing stats, drag-drop/hot-area item types, PWA/offline manifest, spaced repetition, Supabase sync, question-feedback workflow.

## Design language

Cool-paper light / deep-slate dark; ultramarine accent; domain hues teal/ultramarine/plum; Space Grotesk display, Public Sans body, IBM Plex Mono for timer/IDs/data (all via @fontsource). Signature motif: **the threshold line** — a labeled pass-line (700 on score scales, 70% on topic bars) recurring across results and analytics. Exam view strips navigation chrome ("exam room"). Copy: sentence case, plain verbs, empty states as invitations.
