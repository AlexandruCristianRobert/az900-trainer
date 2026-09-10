# AZ-900 Trainer v2 — Redesign Specification

Product spec resulting from a grilling session (2026-09-10) against the Claude Design mockup `docs/design/AZ-900 Trainer v3.dc.html`. Canonical vocabulary lives in `CONTEXT.md`; architectural decisions in `docs/adr/` (this session added ADR-0004 and ADR-0005). This document records the behavioral decisions. Where it conflicts with the 2026-08-27 spec, this one wins; everything it does not mention is unchanged.

## What changes, in one paragraph

The dashboard becomes a game-like home built around **Rounds** of up to 10 Questions in three modes (Practice, Sprint, Review), earning **XP** with **Streak** bonuses that accumulate into a **Level**. The 40-question exam simulation is kept intact but **demoted**: it leaves the mode cards and lives on a slim strip, with its score history on its own setup screen. The whole app adopts the design's dark visual language.

## Rounds

- A Round is one Session of mode `practice`, `sprint`, or `review`: a fixed draw of up to **10** Questions, answered in order, ended by a results page. The exam is never a Round.
- The Round size is a constant like the exam's 40, not a setting. A Round is shorter only when its Pool has fewer than 10 Questions.
- Rounds are **never resumed**. Leaving mid-Round completes the Session with whatever Answers exist; no resume banner.
- **Pool** = the whole bank, one Domain, one Topic, or the review deck. Draw order for every Pool: never-answered first, then least-recently-answered, shuffled, capped at 10 (the exam blueprint's per-domain logic, generalized).
- Domain is chosen with the four chips on the Practice card (All / three Domains) and is remembered per device. A **Topic Pool is reached only by tapping a weak area**, which starts a Practice Round on that Topic. There is no Topic picker anywhere.
- Sprint uses the same Domain chips as Practice.

## Sprint and the Shot clock

- Every Question in a Sprint runs against a **Shot clock** of **20 seconds**, derived from the wall clock, never paused, reset on each Question.
- Reaching zero records an **incorrect Answer with whatever was picked, possibly nothing** (ADR-0004), then reveals. This is the only case where an Answer's picks may be empty.
- A Sprint always reveals after each Question.

## Feedback timing

- A per-device preference for **Practice Rounds only**: **instant** (default, reveal after each Answer) or **end of round** (record silently on Next, reveal everything on the results page).
- Sprint and Review Rounds always reveal instantly.
- Preferences (feedback timing, Domain chip) are stored through the repository under their own key; they are **not** part of the progress export and **not** cleared by reset.

## XP, Level, Streak

- **XP is stamped on each Answer** at submission (ADR-0005). Totals, Level and best Streak are read off the Answer log; none of them is stored.
- Formula (frozen on the Answer at write time): correct Round Answer = 10 + min(2 × (Streak − 1), 10) + 5 if Sprint; incorrect = 0; correct **exam** Answer = flat 10 (no Streak, no bonus).
- **Level**: 150 XP for the first step up, 50 more for each step after (150, 200, 250, …).
- **Streak**: consecutive correct Answers within one Round; a wrong Answer or a new Round resets it. Best Streak is the longest ever. The word is Streak everywhere; the design's "Combo" is retired.
- Answers written before this version carry no XP and count as zero. No backfill.
- Total XP includes dangling Answers: earned is earned.

## Dashboard

Top to bottom:

1. **Header**: wordmark (links home), Level badge, XP progress bar toward the next Level. No navigation links.
2. **Resume banner** (only when an exam is in progress): remaining time, Resume button. Restyled, otherwise unchanged in behavior.
3. **Hero line** and lede.
4. **Four stat tiles**: Level (with XP to next), Total XP, Best streak, To review.
5. **Three mode cards**: Practice round (Domain chips, feedback toggle, Start round), Sprint (20s per question, Start sprint), Review (deck count, Start review; disabled when the deck is empty). Copy uses review-deck language, never "missed questions".
6. **Exam strip**: one slim row under the cards — "Exam simulation · 40 questions · 45 minutes", the last Estimated score against the 700 line when one exists, and a ghost Start button.
7. **Two panels**: Accuracy by Domain (bars) and Weak areas (each row is a button that starts a Topic Practice Round; empty states unchanged).
8. **Data row**: Export progress, Import progress, Reset all progress as quiet text buttons above the footer. Behavior unchanged.
9. **Footer disclaimer** and study-guide vintage, unchanged.

Dropped from the dashboard: the eleven-Topic bar panel, the score history, the last-exam hero.

## Exam (demoted, not changed)

- Reached only from the strip and the resume banner. Engine, Deadline, Selections, Estimated score, expiry and abandonment are unchanged.
- The **exam setup screen** gains the score history (sparkline and list) above the Start button.
- Exam Answers earn flat XP (above).

## Results

- **One route, `/results/:sessionId`, two layouts by Session mode.** Both are rebuilt from the Session and its Answers, so reload, back and shared links work.
- **Round results**: accuracy percentage, headline (Perfect round! / Round complete / Keep at it), tiles for Correct, XP earned, Best streak; "Level N reached!" banner when the Round crossed a Level (XP before the Round = total XP of Answers outside this Session); collapsible per-question breakdown; actions New round / Start review (when something was missed) / Dashboard.
- **Exam results**: Estimated score on the threshold scale, Domain breakdown, the same collapsible breakdown rows instead of forty expanded cards.
- Breakdown tags: Correct, Correct answer, Your pick, and **No pick** for a Sprint Answer with nothing picked.

## Feel

- **Optimistic UI**: picks and grading update the screen immediately; the storage write follows. A failed write shows a small "couldn't save" notice instead of blocking.
- **Animated, silent**: the design's motion (fade-up on view entry, pulsing current segment, XP bar easing, 120 ms hovers) plus XP count-up in the header when a Round ends, a Streak badge pop on increment, a one-time glow on the level-up banner. No sound.
- **Keyboard**: number keys 1–5 pick options, Enter submits or advances. Escape does nothing.
- Everything above respects `prefers-reduced-motion`.

## Design language (replaces the 2026-08-27 section)

- **Dark only.** Background `#14141F`, header `#181826`, surface `#1C1C2B`, border `#2A2A3E`, text `#E6E6F0`, muted `#9494B0`.
- **Accent purple `#8B5CF6`** (primary actions, Practice, Domain bars), **gold `#FFC53D`** (XP, Level, Review), **cyan `#22D3EE`** (Sprint), **green `#34D399`** / **red `#F87171`** (verdicts). Per-Domain hues are dropped.
- **Type**: Nunito Sans (400–900) for everything textual, JetBrains Mono for numbers, labels, counters and IDs. Shipped via fontsource; nothing loads from a CDN.
- The **threshold line** survives only where it means something: the exam results scale and the last score on the exam strip.

## Persistence

- Storage key stays `az900-trainer/progress/v1`; the export format stays version 1. Changes are additive: `Answer.xp` (optional number) and the `sprint` Session mode. Old exports import unchanged.
- Preferences live under a separate key, through the repository (ADR-0002 still holds: nothing else touches localStorage).

## Deliberately out of v2

Sound effects, confetti, daily goals or calendar streaks, Round history list, Topic picker, light theme, spaced repetition (ADR-0001 stands), per-Round resume.
