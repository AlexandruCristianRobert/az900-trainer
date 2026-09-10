# AZ-900 Trainer v2 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the AZ-900 Trainer around 10-question Rounds (Practice, Sprint, Review) that earn XP, Streaks and Levels, demote the exam to a strip, and adopt the dark design language from `docs/design/AZ-900 Trainer v3.dc.html`.

**Architecture:** Vue 3 + Pinia + vue-router SPA, local-first. Pure domain modules (`src/domain/*`) are extended first (XP formula, Round drawing, Round summaries, Preferences) and unit-tested; the Pinia `progress` store gains XP aggregates, preferences and optimistic writes; a new `roundSession` store replaces the practice store + runner; then components and views are rebuilt on new CSS tokens. Every Answer carries the XP it earned (ADR-0005); nothing else is stored.

**Tech Stack:** Vue 3.5, Pinia 4, vue-router 5, TypeScript 6, Vite 8, Vitest 4 (jsdom), @vue/test-utils, @fontsource/nunito-sans, @fontsource/jetbrains-mono.

**Spec:** `docs/superpowers/specs/2026-09-10-az900-trainer-v2-redesign-spec.md` (behavior), `CONTEXT.md` (vocabulary), `docs/adr/0004-*.md` and `docs/adr/0005-*.md` (decisions). The 2026-08-27 spec still governs the exam engine.

## Global Constraints

- Vocabulary in code, copy and tests follows `CONTEXT.md`: Round, Pool, Sprint, Shot clock, Feedback timing, XP, Level, Streak, Review deck, Weak area, Estimated score. Never "combo", "missed questions", "timer", "quiz".
- Round size is the constant `ROUND_SIZE = 10`. Shot clock is `SHOT_CLOCK_MS = 20_000`. XP: base 10, +2 per Streak step capped at +10, +5 in Sprint, exam correct = flat 10, incorrect = 0. Level: 150 XP for the first step, +50 per step after.
- Storage key stays `az900-trainer/progress/v1`, export format stays `version: 1`. Preferences use their own key `az900-trainer/preferences/v1`. Only `src/repository/LocalStorageRepository.ts` touches `localStorage` (ADR-0002).
- Dark theme only. Tokens: bg `#14141F`, header `#181826`, surface `#1C1C2B`, border `#2A2A3E`, text `#E6E6F0`, muted `#9494B0`, purple `#8B5CF6`, gold `#FFC53D`, cyan `#22D3EE`, green `#34D399`, red `#F87171`. Fonts Nunito Sans + JetBrains Mono via fontsource; nothing from a CDN.
- Options stay real `<input type="radio|checkbox">` inside a `<fieldset>` with the stem as `<legend>`. `prefers-reduced-motion` disables every animation (global rule already in `main.css`).
- Commands: `npm run test:unit -- --run <path>` runs a test file once; `npm run type-check` runs vue-tsc; `npm run lint` runs oxlint + eslint; `npm run build` type-checks and bundles. All four must pass before the final commit.
- Tests follow the existing pattern: `RouterHost` + real `routes` + memory history + `useProgressStore().init()`; `localStorage.clear()` in `beforeEach`; a `settle()` helper yields one real macrotask then `nextTick()`.
- Commit after every task with a conventional message and the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File Structure

**Domain (pure, no Vue):**
- Modify `src/domain/entities.ts` — add `'sprint'` to `SessionMode`, `RoundMode` type, optional `xp` on `Answer`.
- Create `src/domain/xp.ts` — XP formula, Level curve, total XP, Streak scans.
- Create `src/domain/roundBlueprint.ts` — `ROUND_SIZE`, `SHOT_CLOCK_MS`, `PoolSpec`, `resolvePool`, `drawRound`, `poolLabel`.
- Create `src/domain/roundSummary.ts` — `summarizeRound` for the results page.
- Create `src/domain/preferences.ts` — `Preferences` type, defaults, sanitizer.
- Modify `src/domain/scoring.ts` — `finalizeExamAnswers` stamps flat XP.
- Modify `src/data/types.ts` — `shortLabel` per Domain for chips.

**Repository:**
- Modify `src/repository/StudyRepository.ts` — `getPreferences`, `savePreferences`.
- Modify `src/repository/LocalStorageRepository.ts` — second key for preferences.

**Stores:**
- Modify `src/stores/progress.ts` — preferences, XP aggregates, optimistic writes + `saveFailed`.
- Create `src/stores/roundSession.ts` — the Round state machine (replaces `practiceSession.ts` and `composables/usePracticeRunner.ts`, both deleted).

**Styles and shell:**
- Rewrite `src/assets/main.css` — dark tokens, utilities, keyframes.
- Modify `src/main.ts` — font imports.
- Modify `src/App.vue` — header with `XpMeter`, `SaveNotice`, no nav.
- Create `src/components/XpMeter.vue`, `src/components/SaveNotice.vue`.

**Components:**
- Rewrite `src/components/QuestionCard.vue` — letter chips, tags, `showVerdict`, `emptyVerdictLabel`.
- Create `src/components/RoundProgress.vue`, `src/components/ShotClock.vue`, `src/components/BreakdownList.vue`, `src/components/StatTile.vue`.
- Create `src/components/dashboard/ModeCards.vue`, `ExamStrip.vue`, `DomainAccuracy.vue`, `WeakAreas.vue`, `DataControls.vue`.
- Create `src/components/results/RoundResults.vue`, `src/components/results/ExamResults.vue`.
- Keep `ExamTimer.vue`, `QuestionGrid.vue`, `ScoreScale.vue`, `HistorySparkline.vue` (restyled by tokens only).

**Views and routing:**
- Create `src/views/RoundView.vue` (routes `/practice`, `/sprint`, `/review`); delete `PracticeView.vue`, `ReviewView.vue`.
- Rewrite `src/views/DashboardView.vue`, `src/views/ResultsView.vue`; modify `src/views/ExamView.vue`.
- Modify `src/router/index.ts`.

**Docs:** `README.md`, `.gitignore`.

---

### Task 1: Entities and the XP module

**Files:**
- Modify: `src/domain/entities.ts`
- Create: `src/domain/xp.ts`
- Modify: `src/domain/scoring.ts:31-54` (`finalizeExamAnswers`)
- Test: `src/domain/__tests__/xp.spec.ts`, `src/domain/__tests__/scoring.spec.ts`

**Interfaces:**
- Produces: `SessionMode = 'exam' | 'practice' | 'sprint' | 'review'`, `RoundMode = Exclude<SessionMode, 'exam'>`, `Answer.xp?: number`.
- Produces: `xpForAnswer(mode: SessionMode, correct: boolean, streak: number): number`, `levelOf(totalXp: number): LevelProgress`, `totalXp(answers: Answer[]): number`, `longestStreak(answersInOrder: Answer[]): number`, `bestStreak(sessions: Session[], answers: Answer[]): number`, constants `BASE_XP, STREAK_STEP_XP, STREAK_BONUS_CAP_XP, SPRINT_BONUS_XP, FIRST_LEVEL_XP, LEVEL_STEP_XP`.

- [ ] **Step 1: Update the entities**

Replace the contents of `src/domain/entities.ts` with:

```ts
export type SessionMode = 'exam' | 'practice' | 'sprint' | 'review'
/** A Round is any non-exam Session (CONTEXT.md). */
export type RoundMode = Exclude<SessionMode, 'exam'>
export type SessionStatus = 'in-progress' | 'completed' | 'expired'

export interface ExamState {
  deadline: string                      // ISO-8601 UTC; the Deadline (CONTEXT.md)
  questionIds: string[]                 // drawn form, presentation order
  selections: Record<string, string[]>  // Selection per Question (CONTEXT.md)
}

export interface Session {
  id: string
  mode: SessionMode
  status: SessionStatus
  startedAt: string
  endedAt: string | null
  exam: ExamState | null                // null for every Round
}

export interface Answer {
  id: string
  sessionId: string
  questionId: string
  /**
   * Non-empty everywhere except a Sprint timeout, which records an incorrect
   * Answer with whatever was picked — possibly nothing (ADR-0004). Unanswered
   * exam questions still produce NO Answer.
   */
  selected: string[]
  correct: boolean
  submittedAt: string
  /** XP earned by this Answer, fixed at submission (ADR-0005). Absent on legacy Answers = 0. */
  xp?: number
}
```

- [ ] **Step 2: Write the failing XP tests**

Create `src/domain/__tests__/xp.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Answer, Session } from '@/domain/entities'
import {
  BASE_XP,
  bestStreak,
  FIRST_LEVEL_XP,
  LEVEL_STEP_XP,
  levelOf,
  longestStreak,
  SPRINT_BONUS_XP,
  totalXp,
  xpForAnswer,
} from '@/domain/xp'

function answer(sessionId: string, correct: boolean, xp?: number): Answer {
  return {
    id: crypto.randomUUID(),
    sessionId,
    questionId: 'cc-001',
    selected: correct ? ['b'] : ['a'],
    correct,
    submittedAt: '2026-09-01T00:00:00.000Z',
    ...(xp === undefined ? {} : { xp }),
  }
}

function session(id: string, mode: Session['mode']): Session {
  return { id, mode, status: 'completed', startedAt: '2026-09-01T00:00:00.000Z', endedAt: '2026-09-01T00:10:00.000Z', exam: null }
}

describe('xpForAnswer', () => {
  it('pays nothing for an incorrect Answer in any mode', () => {
    expect(xpForAnswer('practice', false, 0)).toBe(0)
    expect(xpForAnswer('sprint', false, 0)).toBe(0)
    expect(xpForAnswer('exam', false, 0)).toBe(0)
  })

  it('pays the base for the first correct Answer of a Round', () => {
    expect(xpForAnswer('practice', true, 1)).toBe(BASE_XP)
    expect(xpForAnswer('review', true, 1)).toBe(BASE_XP)
  })

  it('adds 2 per Streak step, capped at +10', () => {
    expect(xpForAnswer('practice', true, 2)).toBe(12)
    expect(xpForAnswer('practice', true, 3)).toBe(14)
    expect(xpForAnswer('practice', true, 6)).toBe(20)
    expect(xpForAnswer('practice', true, 40)).toBe(20)
  })

  it('adds the Sprint bonus on top of the Streak bonus', () => {
    expect(xpForAnswer('sprint', true, 1)).toBe(BASE_XP + SPRINT_BONUS_XP)
    expect(xpForAnswer('sprint', true, 6)).toBe(20 + SPRINT_BONUS_XP)
  })

  it('pays a flat base for a correct exam Answer regardless of streak', () => {
    expect(xpForAnswer('exam', true, 1)).toBe(BASE_XP)
    expect(xpForAnswer('exam', true, 9)).toBe(BASE_XP)
  })
})

describe('levelOf', () => {
  it('starts at level 1 needing 150', () => {
    expect(levelOf(0)).toEqual({ level: 1, into: 0, need: FIRST_LEVEL_XP })
    expect(levelOf(149)).toEqual({ level: 1, into: 149, need: FIRST_LEVEL_XP })
  })

  it('steps up at 150, then needs 50 more each level', () => {
    expect(levelOf(150)).toEqual({ level: 2, into: 0, need: FIRST_LEVEL_XP + LEVEL_STEP_XP })
    expect(levelOf(350)).toEqual({ level: 3, into: 0, need: FIRST_LEVEL_XP + 2 * LEVEL_STEP_XP })
    expect(levelOf(360)).toEqual({ level: 3, into: 10, need: 250 })
  })
})

describe('totalXp', () => {
  it('sums xp, treating legacy Answers without xp as zero', () => {
    expect(totalXp([])).toBe(0)
    expect(totalXp([answer('s', true, 10), answer('s', true), answer('s', false, 0), answer('s', true, 14)])).toBe(24)
  })
})

describe('longestStreak', () => {
  it('finds the longest run of consecutive correct Answers', () => {
    const run = [true, true, false, true, true, true, false].map((c) => answer('s', c))
    expect(longestStreak(run)).toBe(3)
    expect(longestStreak([])).toBe(0)
    expect(longestStreak([answer('s', false)])).toBe(0)
  })
})

describe('bestStreak', () => {
  it('scans each Round in submission order and ignores exam Sessions', () => {
    const sessions = [session('p1', 'practice'), session('sp', 'sprint'), session('ex', 'exam')]
    const answers = [
      answer('p1', true), answer('p1', true),
      answer('sp', true), answer('sp', true), answer('sp', true), answer('sp', false),
      answer('ex', true), answer('ex', true), answer('ex', true), answer('ex', true), answer('ex', true),
    ]
    expect(bestStreak(sessions, answers)).toBe(3)
  })

  it('does not chain Streaks across Sessions', () => {
    const sessions = [session('a', 'practice'), session('b', 'practice')]
    const answers = [answer('a', true), answer('a', true), answer('b', true), answer('b', true)]
    expect(bestStreak(sessions, answers)).toBe(2)
  })

  it('skips Answers whose Session is unknown', () => {
    expect(bestStreak([], [answer('ghost', true), answer('ghost', true)])).toBe(0)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test:unit -- --run src/domain/__tests__/xp.spec.ts`
Expected: FAIL — cannot resolve `@/domain/xp`.

- [ ] **Step 4: Implement `src/domain/xp.ts`**

```ts
import type { Answer, Session, SessionMode } from './entities'

export const BASE_XP = 10
export const STREAK_STEP_XP = 2
export const STREAK_BONUS_CAP_XP = 10
export const SPRINT_BONUS_XP = 5
export const FIRST_LEVEL_XP = 150
export const LEVEL_STEP_XP = 50

export interface LevelProgress {
  level: number
  /** XP earned inside the current level. */
  into: number
  /** XP the current level needs in total to step up. */
  need: number
}

/**
 * XP an Answer earns, fixed at submission (ADR-0005). `streak` is the count of
 * consecutive correct Answers INCLUDING this one (1 for the first correct).
 * Exam Answers all share a timestamp, so a streak there is meaningless: flat base.
 */
export function xpForAnswer(mode: SessionMode, correct: boolean, streak: number): number {
  if (!correct) return 0
  if (mode === 'exam') return BASE_XP
  const streakBonus = Math.min(STREAK_STEP_XP * Math.max(streak - 1, 0), STREAK_BONUS_CAP_XP)
  return BASE_XP + streakBonus + (mode === 'sprint' ? SPRINT_BONUS_XP : 0)
}

/** 150 XP for the first step up, 50 more for each step after (CONTEXT.md: Level). */
export function levelOf(total: number): LevelProgress {
  let level = 1
  let need = FIRST_LEVEL_XP
  let into = Math.max(0, total)
  while (into >= need) {
    into -= need
    level += 1
    need = FIRST_LEVEL_XP + LEVEL_STEP_XP * (level - 1)
  }
  return { level, into, need }
}

/** Legacy Answers (no xp field) count as zero; dangling Answers still count — earned is earned. */
export function totalXp(answers: Answer[]): number {
  let sum = 0
  for (const answer of answers) sum += answer.xp ?? 0
  return sum
}

export function longestStreak(answersInOrder: Answer[]): number {
  let best = 0
  let run = 0
  for (const answer of answersInOrder) {
    run = answer.correct ? run + 1 : 0
    if (run > best) best = run
  }
  return best
}

/** Best Streak ever, read off the Answer log per Round (array order = submission order). */
export function bestStreak(sessions: Session[], answers: Answer[]): number {
  const modeById = new Map(sessions.map((s) => [s.id, s.mode]))
  const bySession = new Map<string, Answer[]>()
  for (const answer of answers) {
    const mode = modeById.get(answer.sessionId)
    if (!mode || mode === 'exam') continue
    const list = bySession.get(answer.sessionId)
    if (list) list.push(answer)
    else bySession.set(answer.sessionId, [answer])
  }
  let best = 0
  for (const list of bySession.values()) best = Math.max(best, longestStreak(list))
  return best
}
```

- [ ] **Step 5: Run the XP tests**

Run: `npm run test:unit -- --run src/domain/__tests__/xp.spec.ts`
Expected: PASS (13 tests).

- [ ] **Step 6: Add a failing test for exam XP stamping**

Append to `src/domain/__tests__/scoring.spec.ts` (inside the file, after the existing `finalizeExamAnswers` describe or as a new describe at the end):

```ts
describe('finalizeExamAnswers XP', () => {
  it('stamps a flat 10 XP on correct Answers and 0 on incorrect ones', () => {
    const session: Session = {
      id: 's', mode: 'exam', status: 'completed',
      startedAt: '2026-09-01T00:00:00.000Z', endedAt: '2026-09-01T00:45:00.000Z',
      exam: { deadline: '2026-09-01T00:45:00.000Z', questionIds: ['cc-001', 'cc-002'], selections: { 'cc-001': ['b'], 'cc-002': ['a', 'b'] } },
    }
    const answers = finalizeExamAnswers(session, new Map([[single.id, single], [multi.id, multi]]), session.endedAt!)
    expect(answers.map((a) => [a.questionId, a.correct, a.xp])).toEqual([
      ['cc-001', true, 10],
      ['cc-002', false, 0],
    ])
  })
})
```

Run: `npm run test:unit -- --run src/domain/__tests__/scoring.spec.ts`
Expected: FAIL — `xp` is `undefined`.

- [ ] **Step 7: Stamp XP in `finalizeExamAnswers`**

In `src/domain/scoring.ts`, add `import { xpForAnswer } from './xp'` and change the pushed object to:

```ts
    const correct = isCorrect(question, selected)
    answers.push({
      id: crypto.randomUUID(),
      sessionId: session.id,
      questionId,
      selected,
      correct,
      submittedAt,
      xp: xpForAnswer('exam', correct, 1),
    })
```

- [ ] **Step 8: Run scoring and the whole suite**

Run: `npm run test:unit -- --run`
Expected: all green (previous 148 + new tests). `analytics.spec.ts` builds Sessions with a mode union literal type — it still compiles because `'sprint'` is additive.

- [ ] **Step 9: Commit**

```bash
git add src/domain/entities.ts src/domain/xp.ts src/domain/scoring.ts src/domain/__tests__/xp.spec.ts src/domain/__tests__/scoring.spec.ts
git commit -m "feat(domain): sprint mode, XP on Answers, XP formula and Level curve

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Round blueprint — Pools and drawing

**Files:**
- Create: `src/domain/roundBlueprint.ts`
- Modify: `src/data/types.ts` (add `shortLabel` to each Domain)
- Test: `src/domain/__tests__/roundBlueprint.spec.ts`

**Interfaces:**
- Consumes: `reviewDeck(bank, answers)` from `src/domain/analytics.ts`; `shuffleInPlace` from `src/domain/examBlueprint.ts`.
- Produces: `ROUND_SIZE = 10`, `SHOT_CLOCK_MS = 20_000`, `type PoolSpec = { kind: 'all' } | { kind: 'domain'; domain: DomainId } | { kind: 'topic'; topic: TopicId } | { kind: 'review' }`, `resolvePool(bank: Question[], answers: Answer[], spec: PoolSpec): Question[]`, `drawRound(pool: Question[], answers: Answer[], rng?: () => number): string[]`, `poolLabel(spec: PoolSpec): string`, `DOMAINS[id].shortLabel`.

- [ ] **Step 1: Add short Domain labels**

In `src/data/types.ts`, add a `shortLabel` to each entry of `DOMAINS`:

```ts
export const DOMAINS = {
  'cloud-concepts': {
    label: 'Describe cloud concepts',
    shortLabel: 'Cloud concepts',
    weight: '25–30%',
    examQuestions: 12,
  },
  'architecture-services': {
    label: 'Describe Azure architecture and services',
    shortLabel: 'Architecture & services',
    weight: '35–40%',
    examQuestions: 15,
  },
  'management-governance': {
    label: 'Describe Azure management and governance',
    shortLabel: 'Management & governance',
    weight: '30–35%',
    examQuestions: 13,
  },
} as const
```

- [ ] **Step 2: Write the failing tests**

Create `src/domain/__tests__/roundBlueprint.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Question } from '@/data/types'
import type { Answer } from '@/domain/entities'
import { drawRound, poolLabel, resolvePool, ROUND_SIZE, SHOT_CLOCK_MS } from '@/domain/roundBlueprint'

function q(id: string, domain: Question['domain'], topic: Question['topic']): Question {
  return {
    id, domain, topic, kind: 'single', stem: id,
    options: ['a', 'b', 'c', 'd'].map((o) => ({ id: o, text: o, explanation: 'why this is or is not right' })),
    correct: ['a'],
  }
}

const bank: Question[] = [
  ...Array.from({ length: 12 }, (_, i) => q(`cc-${i}`, 'cloud-concepts', 'describe-cloud-computing')),
  ...Array.from({ length: 6 }, (_, i) => q(`arch-${i}`, 'architecture-services', 'storage')),
  ...Array.from({ length: 4 }, (_, i) => q(`gov-${i}`, 'management-governance', 'cost-management')),
]

function answered(questionId: string, submittedAt: string, correct = true): Answer {
  return { id: crypto.randomUUID(), sessionId: 's', questionId, selected: ['a'], correct, submittedAt }
}

describe('constants', () => {
  it('fixes the Round size at 10 and the Shot clock at 20 seconds', () => {
    expect(ROUND_SIZE).toBe(10)
    expect(SHOT_CLOCK_MS).toBe(20_000)
  })
})

describe('resolvePool', () => {
  it('returns the whole bank for "all"', () => {
    expect(resolvePool(bank, [], { kind: 'all' })).toHaveLength(22)
  })
  it('filters by Domain and by Topic', () => {
    expect(resolvePool(bank, [], { kind: 'domain', domain: 'architecture-services' }).map((x) => x.id)).toEqual(
      ['arch-0', 'arch-1', 'arch-2', 'arch-3', 'arch-4', 'arch-5'],
    )
    expect(resolvePool(bank, [], { kind: 'topic', topic: 'cost-management' })).toHaveLength(4)
  })
  it('returns the review deck for "review"', () => {
    const answers = [answered('cc-1', '2026-09-01T00:00:00Z', false), answered('cc-2', '2026-09-01T00:00:00Z', true)]
    expect(resolvePool(bank, answers, { kind: 'review' }).map((x) => x.id)).toEqual(['cc-1'])
  })
})

describe('drawRound', () => {
  it('draws at most ROUND_SIZE distinct ids from the pool', () => {
    const drawn = drawRound(bank, [])
    expect(drawn).toHaveLength(ROUND_SIZE)
    expect(new Set(drawn).size).toBe(ROUND_SIZE)
  })
  it('draws the whole pool when it is smaller than ROUND_SIZE', () => {
    const pool = resolvePool(bank, [], { kind: 'topic', topic: 'cost-management' })
    expect(drawRound(pool, []).sort()).toEqual(['gov-0', 'gov-1', 'gov-2', 'gov-3'])
  })
  it('prefers never-answered Questions, then least-recently-answered', () => {
    const pool = resolvePool(bank, [], { kind: 'domain', domain: 'cloud-concepts' }) // 12
    const answers = [
      answered('cc-0', '2026-09-03T00:00:00Z'), // most recent -> excluded
      answered('cc-1', '2026-09-02T00:00:00Z'), // second most recent -> excluded
      answered('cc-2', '2026-09-01T00:00:00Z'), // oldest answered -> included (10 fresh + ... no: 9 fresh)
      answered('cc-3', '2026-08-30T00:00:00Z'),
    ]
    // 8 never-answered (cc-4..cc-11) always in; then the 2 least recent of the answered: cc-3, cc-2.
    const drawn = drawRound(pool, answers)
    expect(drawn).toHaveLength(10)
    for (let i = 4; i < 12; i++) expect(drawn).toContain(`cc-${i}`)
    expect(drawn).toContain('cc-3')
    expect(drawn).toContain('cc-2')
    expect(drawn).not.toContain('cc-0')
    expect(drawn).not.toContain('cc-1')
  })
  it('returns an empty draw for an empty pool', () => {
    expect(drawRound([], [])).toEqual([])
  })
})

describe('poolLabel', () => {
  it('names every Pool kind', () => {
    expect(poolLabel({ kind: 'all' })).toBe('All domains')
    expect(poolLabel({ kind: 'domain', domain: 'cloud-concepts' })).toBe('Cloud concepts')
    expect(poolLabel({ kind: 'topic', topic: 'storage' })).toBe('Describe Azure storage services')
    expect(poolLabel({ kind: 'review' })).toBe('Review deck')
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npm run test:unit -- --run src/domain/__tests__/roundBlueprint.spec.ts`
Expected: FAIL — cannot resolve `@/domain/roundBlueprint`.

- [ ] **Step 4: Implement `src/domain/roundBlueprint.ts`**

```ts
import { DOMAINS, TOPICS, type DomainId, type Question, type TopicId } from '@/data/types'
import { reviewDeck } from './analytics'
import type { Answer } from './entities'
import { shuffleInPlace } from './examBlueprint'

/** A Round is a fixed draw of up to 10 Questions (CONTEXT.md: Round). */
export const ROUND_SIZE = 10
/** The Shot clock: 20 seconds per Question in a Sprint (CONTEXT.md: Shot clock). */
export const SHOT_CLOCK_MS = 20_000

/** The set of Questions a Round draws from (CONTEXT.md: Pool). */
export type PoolSpec =
  | { kind: 'all' }
  | { kind: 'domain'; domain: DomainId }
  | { kind: 'topic'; topic: TopicId }
  | { kind: 'review' }

export function resolvePool(bank: Question[], answers: Answer[], spec: PoolSpec): Question[] {
  switch (spec.kind) {
    case 'all':
      return bank.slice()
    case 'domain':
      return bank.filter((q) => q.domain === spec.domain)
    case 'topic':
      return bank.filter((q) => q.topic === spec.topic)
    case 'review':
      return reviewDeck(bank, answers)
  }
}

/**
 * Never-answered first, then least-recently-answered, shuffled, capped at
 * ROUND_SIZE — the exam blueprint's per-domain rule, applied to one Pool.
 */
export function drawRound(pool: Question[], answers: Answer[], rng: () => number = Math.random): string[] {
  const lastSeen = new Map<string, string>()
  for (const answer of answers) {
    const prev = lastSeen.get(answer.questionId)
    if (!prev || answer.submittedAt > prev) lastSeen.set(answer.questionId, answer.submittedAt)
  }
  const fresh = shuffleInPlace(pool.filter((q) => !lastSeen.has(q.id)), rng)
  const seen = shuffleInPlace(pool.filter((q) => lastSeen.has(q.id)), rng).sort((a, b) => {
    const seenA = lastSeen.get(a.id)!
    const seenB = lastSeen.get(b.id)!
    return seenA < seenB ? -1 : seenA > seenB ? 1 : 0
  })
  const picked = fresh.concat(seen).slice(0, ROUND_SIZE).map((q) => q.id)
  return shuffleInPlace(picked, rng)
}

export function poolLabel(spec: PoolSpec): string {
  switch (spec.kind) {
    case 'all':
      return 'All domains'
    case 'domain':
      return DOMAINS[spec.domain].shortLabel
    case 'topic':
      return TOPICS[spec.topic].label
    case 'review':
      return 'Review deck'
  }
}
```

- [ ] **Step 5: Run the tests**

Run: `npm run test:unit -- --run src/domain/__tests__/roundBlueprint.spec.ts src/data`
Expected: PASS. The question-bank suite still passes (it reads `examQuestions`, not `shortLabel`).

- [ ] **Step 6: Commit**

```bash
git add src/domain/roundBlueprint.ts src/data/types.ts src/domain/__tests__/roundBlueprint.spec.ts
git commit -m "feat(domain): Round blueprint — Pools, draw order, Shot clock constant

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Round summary for the results page

**Files:**
- Create: `src/domain/roundSummary.ts`
- Test: `src/domain/__tests__/roundSummary.spec.ts`

**Interfaces:**
- Consumes: `totalXp`, `longestStreak`, `levelOf` from `src/domain/xp.ts`.
- Produces:
  ```ts
  export interface RoundSummary {
    session: Session
    answers: Answer[]          // this Session's Answers, submission order
    total: number
    correctCount: number
    accuracyPercent: number    // rounded; 0 when total is 0
    xpGained: number
    bestStreak: number
    xpBefore: number           // total XP of Answers outside this Session
    levelBefore: number
    levelAfter: number
    leveledUp: boolean
    headline: 'Perfect round!' | 'Round complete' | 'Keep at it'
  }
  export function summarizeRound(session: Session, allAnswers: Answer[]): RoundSummary
  ```

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/roundSummary.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Answer, Session } from '@/domain/entities'
import { summarizeRound } from '@/domain/roundSummary'

const round: Session = {
  id: 'r1', mode: 'practice', status: 'completed',
  startedAt: '2026-09-01T00:00:00.000Z', endedAt: '2026-09-01T00:05:00.000Z', exam: null,
}

function a(sessionId: string, correct: boolean, xp: number, questionId = 'cc-001'): Answer {
  return { id: crypto.randomUUID(), sessionId, questionId, selected: correct ? ['b'] : ['a'], correct, submittedAt: '2026-09-01T00:01:00.000Z', xp }
}

describe('summarizeRound', () => {
  it('tallies this Session only, in submission order', () => {
    const answers = [a('other', true, 10), a('r1', true, 10, 'cc-001'), a('r1', false, 0, 'cc-002'), a('r1', true, 10, 'cc-003'), a('r1', true, 12, 'cc-004')]
    const s = summarizeRound(round, answers)
    expect(s.answers.map((x) => x.questionId)).toEqual(['cc-001', 'cc-002', 'cc-003', 'cc-004'])
    expect(s.total).toBe(4)
    expect(s.correctCount).toBe(3)
    expect(s.accuracyPercent).toBe(75)
    expect(s.xpGained).toBe(32)
    expect(s.bestStreak).toBe(2)
    expect(s.xpBefore).toBe(10)
  })

  it('detects a level-up from XP outside the Session to XP including it', () => {
    const before = Array.from({ length: 14 }, () => a('old', true, 10)) // 140 XP before
    const s = summarizeRound(round, [...before, a('r1', true, 10), a('r1', true, 12)])
    expect(s.levelBefore).toBe(1)
    expect(s.levelAfter).toBe(2)
    expect(s.leveledUp).toBe(true)
  })

  it('picks the headline from accuracy', () => {
    expect(summarizeRound(round, [a('r1', true, 10), a('r1', true, 12)]).headline).toBe('Perfect round!')
    expect(summarizeRound(round, [a('r1', true, 10), a('r1', true, 12), a('r1', false, 0)]).headline).toBe('Keep at it')
    const seven = [...Array.from({ length: 7 }, () => a('r1', true, 10)), a('r1', false, 0), a('r1', false, 0), a('r1', false, 0)]
    expect(summarizeRound(round, seven).headline).toBe('Round complete')
    expect(summarizeRound(round, []).headline).toBe('Keep at it')
    expect(summarizeRound(round, []).accuracyPercent).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- --run src/domain/__tests__/roundSummary.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/domain/roundSummary.ts`**

```ts
import type { Answer, Session } from './entities'
import { levelOf, longestStreak, totalXp } from './xp'

export interface RoundSummary {
  session: Session
  answers: Answer[]
  total: number
  correctCount: number
  accuracyPercent: number
  xpGained: number
  bestStreak: number
  xpBefore: number
  levelBefore: number
  levelAfter: number
  leveledUp: boolean
  headline: 'Perfect round!' | 'Round complete' | 'Keep at it'
}

const COMPLETE_THRESHOLD = 0.7

/** Everything the Round results page shows, rebuilt from the Session and the Answer log. */
export function summarizeRound(session: Session, allAnswers: Answer[]): RoundSummary {
  const answers: Answer[] = []
  const outside: Answer[] = []
  for (const answer of allAnswers) (answer.sessionId === session.id ? answers : outside).push(answer)

  const total = answers.length
  const correctCount = answers.filter((a) => a.correct).length
  const xpGained = totalXp(answers)
  const xpBefore = totalXp(outside)
  const levelBefore = levelOf(xpBefore).level
  const levelAfter = levelOf(xpBefore + xpGained).level
  const ratio = total === 0 ? 0 : correctCount / total

  return {
    session,
    answers,
    total,
    correctCount,
    accuracyPercent: Math.round(ratio * 100),
    xpGained,
    bestStreak: longestStreak(answers),
    xpBefore,
    levelBefore,
    levelAfter,
    leveledUp: levelAfter > levelBefore,
    headline: total > 0 && correctCount === total ? 'Perfect round!' : ratio >= COMPLETE_THRESHOLD ? 'Round complete' : 'Keep at it',
  }
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test:unit -- --run src/domain/__tests__/roundSummary.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/roundSummary.ts src/domain/__tests__/roundSummary.spec.ts
git commit -m "feat(domain): summarizeRound for the Round results page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Preferences through the repository

**Files:**
- Create: `src/domain/preferences.ts`
- Modify: `src/repository/StudyRepository.ts`
- Modify: `src/repository/LocalStorageRepository.ts`
- Test: `src/domain/__tests__/preferences.spec.ts`, `src/repository/__tests__/localStorageRepository.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type FeedbackTiming = 'instant' | 'end-of-round'
  export type DomainChoice = DomainId | 'all'
  export interface Preferences { feedbackTiming: FeedbackTiming; domain: DomainChoice }
  export const DEFAULT_PREFERENCES: Preferences
  export function sanitizePreferences(value: unknown): Preferences
  // StudyRepository
  getPreferences(): Promise<Preferences>
  savePreferences(preferences: Preferences): Promise<void>
  ```

- [ ] **Step 1: Write the failing sanitizer test**

Create `src/domain/__tests__/preferences.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, sanitizePreferences } from '@/domain/preferences'

describe('sanitizePreferences', () => {
  it('returns defaults for garbage', () => {
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences('nope')).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences({ feedbackTiming: 'later', domain: 'mars' })).toEqual(DEFAULT_PREFERENCES)
  })

  it('keeps valid fields and defaults the rest', () => {
    expect(sanitizePreferences({ feedbackTiming: 'end-of-round' })).toEqual({ feedbackTiming: 'end-of-round', domain: 'all' })
    expect(sanitizePreferences({ domain: 'cloud-concepts' })).toEqual({ feedbackTiming: 'instant', domain: 'cloud-concepts' })
  })

  it('defaults to instant feedback and all domains', () => {
    expect(DEFAULT_PREFERENCES).toEqual({ feedbackTiming: 'instant', domain: 'all' })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:unit -- --run src/domain/__tests__/preferences.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/domain/preferences.ts`**

```ts
import { DOMAINS, type DomainId } from '@/data/types'

/** When a Practice Round reveals (CONTEXT.md: Feedback timing). */
export type FeedbackTiming = 'instant' | 'end-of-round'
export type DomainChoice = DomainId | 'all'

/** Per-device UI preferences — never part of the progress export, never cleared by reset. */
export interface Preferences {
  feedbackTiming: FeedbackTiming
  domain: DomainChoice
}

export const DEFAULT_PREFERENCES: Preferences = { feedbackTiming: 'instant', domain: 'all' }

function isFeedbackTiming(value: unknown): value is FeedbackTiming {
  return value === 'instant' || value === 'end-of-round'
}

function isDomainChoice(value: unknown): value is DomainChoice {
  return value === 'all' || (typeof value === 'string' && value in DOMAINS)
}

export function sanitizePreferences(value: unknown): Preferences {
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_PREFERENCES }
  const candidate = value as Record<string, unknown>
  return {
    feedbackTiming: isFeedbackTiming(candidate.feedbackTiming) ? candidate.feedbackTiming : DEFAULT_PREFERENCES.feedbackTiming,
    domain: isDomainChoice(candidate.domain) ? candidate.domain : DEFAULT_PREFERENCES.domain,
  }
}
```

- [ ] **Step 4: Run the sanitizer test**

Run: `npm run test:unit -- --run src/domain/__tests__/preferences.spec.ts`
Expected: PASS.

- [ ] **Step 5: Write failing repository tests**

Append a describe block to `src/repository/__tests__/localStorageRepository.spec.ts` (inside the outer `describe('LocalStorageRepository')`):

```ts
  describe('Preferences', () => {
    it('returns defaults when nothing is stored', async () => {
      expect(await repository.getPreferences()).toEqual({ feedbackTiming: 'instant', domain: 'all' })
    })

    it('round-trips preferences under their own key, untouched by replaceAll', async () => {
      await repository.savePreferences({ feedbackTiming: 'end-of-round', domain: 'storage' as never })
      // an invalid domain is sanitized on read
      expect(await repository.getPreferences()).toEqual({ feedbackTiming: 'end-of-round', domain: 'all' })

      await repository.savePreferences({ feedbackTiming: 'end-of-round', domain: 'management-governance' })
      await repository.replaceAll([], [])
      expect(await repository.getPreferences()).toEqual({ feedbackTiming: 'end-of-round', domain: 'management-governance' })
      expect(localStorage.getItem('az900-trainer/preferences/v1')).not.toBeNull()
      expect(localStorage.getItem(STORAGE_KEY)).not.toContain('feedbackTiming')
    })

    it('survives corrupt preference JSON', async () => {
      localStorage.setItem('az900-trainer/preferences/v1', '{nope')
      expect(await repository.getPreferences()).toEqual({ feedbackTiming: 'instant', domain: 'all' })
    })
  })
```

Run: `npm run test:unit -- --run src/repository`
Expected: FAIL — `getPreferences is not a function`.

- [ ] **Step 6: Extend the interface and the implementation**

`src/repository/StudyRepository.ts`:

```ts
import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import type { Preferences } from '@/domain/preferences'

export interface StudyRepository {
  getQuestions(): Promise<Question[]>
  getSessions(): Promise<Session[]>
  getSession(id: string): Promise<Session | null>
  saveSession(session: Session): Promise<void>            // upsert by id
  saveAnswers(answers: Answer[]): Promise<void>           // append batch; [] is a no-op
  getAnswers(): Promise<Answer[]>
  replaceAll(sessions: Session[], answers: Answer[]): Promise<void> // import/reset; Questions and Preferences unaffected
  getPreferences(): Promise<Preferences>                  // per-device UI preferences; defaults when absent
  savePreferences(preferences: Preferences): Promise<void>
}
```

In `src/repository/LocalStorageRepository.ts` add, next to `STORAGE_KEY`:

```ts
// Also private to this module (ADR-0002). Preferences are device-local, not progress.
const PREFERENCES_KEY = 'az900-trainer/preferences/v1'
```

import `{ sanitizePreferences, type Preferences } from '@/domain/preferences'`, and add two methods to the class:

```ts
  async getPreferences(): Promise<Preferences> {
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY)
      return sanitizePreferences(raw ? JSON.parse(raw) : null)
    } catch {
      return sanitizePreferences(null)
    }
  }
  async savePreferences(preferences: Preferences): Promise<void> {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  }
```

- [ ] **Step 7: Run repository tests and type-check**

Run: `npm run test:unit -- --run src/repository && npm run type-check`
Expected: PASS; type-check green (no other implementer of `StudyRepository` exists).

- [ ] **Step 8: Commit**

```bash
git add src/domain/preferences.ts src/domain/__tests__/preferences.spec.ts src/repository
git commit -m "feat(repository): per-device Preferences under their own storage key

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Progress store — preferences, XP aggregates, optimistic writes

**Files:**
- Modify: `src/stores/progress.ts`
- Test: `src/stores/__tests__/progress.spec.ts`

**Interfaces:**
- Consumes: `totalXp`, `levelOf`, `bestStreak` (Task 1); `Preferences`, `DEFAULT_PREFERENCES` (Task 4).
- Produces on `useProgressStore()`: `preferences: Ref<Preferences>`, `updatePreferences(patch: Partial<Preferences>): Promise<void>`, `totalXp: ComputedRef<number>`, `level: ComputedRef<LevelProgress>`, `bestStreak: ComputedRef<number>`, `saveFailed: Ref<boolean>`, `dismissSaveFailure(): void`. `saveSession` and `recordAnswers` update the cache synchronously before awaiting the repository and never throw on a write failure; they set `saveFailed` instead.

- [ ] **Step 1: Write the failing tests**

Append to `src/stores/__tests__/progress.spec.ts` inside `describe('progress store')`:

```ts
  it('(g) loads default preferences and persists updates through the repository', async () => {
    const store = useProgressStore()
    await store.init()
    expect(store.preferences).toEqual({ feedbackTiming: 'instant', domain: 'all' })

    await store.updatePreferences({ domain: 'cloud-concepts' })
    expect(store.preferences).toEqual({ feedbackTiming: 'instant', domain: 'cloud-concepts' })
    expect(await repository.getPreferences()).toEqual({ feedbackTiming: 'instant', domain: 'cloud-concepts' })

    // Reset never touches preferences.
    await store.resetProgress()
    expect(store.preferences.domain).toBe('cloud-concepts')
  })

  it('(h) derives total XP, Level and best Streak from the Answer log', async () => {
    const round = makeSession({ mode: 'practice', status: 'completed', endedAt: '2026-08-01T00:05:00.000Z' })
    await repository.saveSession(round)
    const q = questionBank[0]!
    const mk = (correct: boolean, xp: number): Answer => ({
      id: crypto.randomUUID(), sessionId: round.id, questionId: q.id,
      selected: q.correct, correct, submittedAt: '2026-08-01T00:01:00.000Z', xp,
    })
    await repository.saveAnswers([mk(true, 10), mk(true, 12), mk(false, 0), mk(true, 10)])

    const store = useProgressStore()
    await store.init()
    expect(store.totalXp).toBe(32)
    expect(store.level).toEqual({ level: 1, into: 32, need: 150 })
    expect(store.bestStreak).toBe(2)
  })

  it('(i) keeps the cache and flags saveFailed when the repository write rejects', async () => {
    const store = useProgressStore()
    await store.init()
    const spy = vi.spyOn(repository, 'saveAnswers').mockRejectedValueOnce(new Error('quota'))

    const q = questionBank[0]!
    const answer: Answer = {
      id: crypto.randomUUID(), sessionId: crypto.randomUUID(), questionId: q.id,
      selected: q.correct, correct: true, submittedAt: '2026-08-01T00:00:00.000Z', xp: 10,
    }
    await expect(store.recordAnswers([answer])).resolves.toBeUndefined()
    expect(store.answers).toContainEqual(answer)
    expect(store.saveFailed).toBe(true)

    store.dismissSaveFailure()
    expect(store.saveFailed).toBe(false)
    spy.mockRestore()
  })

  it('(j) recordAnswers updates the cache before the repository write settles', async () => {
    const store = useProgressStore()
    await store.init()
    const q = questionBank[0]!
    const answer: Answer = {
      id: crypto.randomUUID(), sessionId: crypto.randomUUID(), questionId: q.id,
      selected: q.correct, correct: true, submittedAt: '2026-08-01T00:00:00.000Z', xp: 10,
    }
    const pending = store.recordAnswers([answer])
    expect(store.answers).toContainEqual(answer) // synchronous, optimistic
    await pending
    expect(await repository.getAnswers()).toContainEqual(answer)
  })
```

Run: `npm run test:unit -- --run src/stores/__tests__/progress.spec.ts`
Expected: FAIL — `preferences`, `totalXp`, `saveFailed` undefined.

- [ ] **Step 2: Implement the store changes**

In `src/stores/progress.ts`:

Add imports:

```ts
import { DEFAULT_PREFERENCES, type Preferences } from '@/domain/preferences'
import { bestStreak as bestStreakOf, levelOf, totalXp as totalXpOf, type LevelProgress } from '@/domain/xp'
```

Add state and computeds after `answers`:

```ts
  const preferences = ref<Preferences>({ ...DEFAULT_PREFERENCES })
  /** Set when a repository write rejected; the UI shows a "couldn't save" notice. */
  const saveFailed = ref(false)

  const totalXp = computed<number>(() => totalXpOf(answers.value))
  const level = computed<LevelProgress>(() => levelOf(totalXp.value))
  const bestStreak = computed<number>(() => bestStreakOf(sessions.value, answers.value))
```

In `reloadCaches()`, add `preferences.value = await repository.getPreferences()`.

Replace `saveSession` and `recordAnswers` with the optimistic versions:

```ts
  /**
   * Optimistic: the cache changes first so the screen updates immediately; the
   * repository write follows. A rejected write flags `saveFailed` instead of
   * throwing — a learner must never be stranded on a graded Question.
   */
  async function saveSession(session: Session): Promise<void> {
    const index = sessions.value.findIndex((s) => s.id === session.id)
    if (index === -1) sessions.value.push(session)
    else sessions.value[index] = session
    try {
      await repository.saveSession(session)
    } catch {
      saveFailed.value = true
    }
  }

  async function recordAnswers(newAnswers: Answer[]): Promise<void> {
    answers.value.push(...newAnswers)
    try {
      await repository.saveAnswers(newAnswers)
    } catch {
      saveFailed.value = true
    }
  }

  function dismissSaveFailure(): void {
    saveFailed.value = false
  }

  async function updatePreferences(patch: Partial<Preferences>): Promise<void> {
    preferences.value = { ...preferences.value, ...patch }
    try {
      await repository.savePreferences(preferences.value)
    } catch {
      saveFailed.value = true
    }
  }
```

Add `preferences, saveFailed, totalXp, level, bestStreak, updatePreferences, dismissSaveFailure` to the returned object.

- [ ] **Step 3: Run the store tests and the whole suite**

Run: `npm run test:unit -- --run`
Expected: all green. The exam store's `terminate` still writes the Session before its Answers because each call awaits the repository in turn.

- [ ] **Step 4: Commit**

```bash
git add src/stores/progress.ts src/stores/__tests__/progress.spec.ts
git commit -m "feat(store): preferences, XP/Level/Streak aggregates, optimistic writes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: The Round store (replaces the practice store and runner)

**Files:**
- Create: `src/stores/roundSession.ts`
- Delete: `src/stores/practiceSession.ts`, `src/stores/__tests__/practiceSession.spec.ts`, `src/composables/usePracticeRunner.ts`
- Test: `src/stores/__tests__/roundSession.spec.ts`

Deleting the old store breaks `PracticeView.vue` and `ReviewView.vue` until Task 10 replaces them. That is acceptable inside this task **only if** you also delete those two views and their specs here and remove their routes, so the suite stays green. Do exactly that: delete `src/views/PracticeView.vue`, `src/views/ReviewView.vue`, `src/views/__tests__/PracticeView.spec.ts`, `src/views/__tests__/ReviewView.spec.ts`, and remove the `/practice` and `/review` entries from `src/router/index.ts` (Task 10 adds the new ones back). `App.vue` still links to `/practice` and `/review`; leave it, RouterLink to an unknown path renders fine and Task 7 rewrites the header.

**Interfaces:**
- Consumes: `drawRound`, `resolvePool`, `SHOT_CLOCK_MS`, `PoolSpec` (Task 2); `xpForAnswer` (Task 1); `isCorrect`, `isCompleteSelection` (scoring); progress store (Task 5).
- Produces `useRoundStore()`:
  ```ts
  export interface RoundResultEntry { questionId: string; selected: string[]; correct: boolean; xp: number }
  export interface RoundState {
    sessionId: string | null; mode: RoundMode; pool: PoolSpec; questionIds: string[]; index: number
    picked: string[]; graded: boolean; results: RoundResultEntry[]
    streak: number; bestStreak: number; xpGained: number; lastGain: number
    lastCorrect: boolean | null; timedOut: boolean; shotClockDeadline: string | null
  }
  round: Ref<RoundState | null>
  currentQuestion: ComputedRef<Question | null>
  total: ComputedRef<number>
  isLast: ComputedRef<boolean>
  canSubmit: ComputedRef<boolean>
  revealsInstantly: ComputedRef<boolean>   // mode !== 'practice' || feedbackTiming === 'instant'
  showReveal: ComputedRef<boolean>         // graded && (revealsInstantly || timedOut)
  startRound(mode: RoundMode, pool: PoolSpec): boolean  // false when the Pool is empty
  setPicked(optionIds: string[]): void
  togglePick(optionId: string): void       // keyboard: single replaces, multi toggles up to the pick count
  submit(): Promise<string | null>         // grades; reveals, or advances (end-of-round); returns sessionId when the Round finished
  timeout(): Promise<void>                 // Sprint: grades the current pick as-is (ADR-0004) and reveals
  advance(): Promise<string | null>        // next Question, or finish → sessionId
  exit(): Promise<void>                    // finish the Session (idempotent) and clear the Round
  ```

- [ ] **Step 1: Delete the superseded files and routes**

```bash
git rm src/stores/practiceSession.ts src/stores/__tests__/practiceSession.spec.ts src/composables/usePracticeRunner.ts src/views/PracticeView.vue src/views/ReviewView.vue src/views/__tests__/PracticeView.spec.ts src/views/__tests__/ReviewView.spec.ts
```

In `src/router/index.ts` delete the two route objects for `/practice` and `/review`.

- [ ] **Step 2: Write the failing store tests**

Create `src/stores/__tests__/roundSession.spec.ts`:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import { SHOT_CLOCK_MS, type PoolSpec } from '@/domain/roundBlueprint'
import { repository } from '@/repository'
import { useProgressStore } from '../progress'
import { useRoundStore } from '../roundSession'

const MONITORING: PoolSpec = { kind: 'topic', topic: 'monitoring-tools' }

function byId(id: string): Question {
  return questionBank.find((q) => q.id === id)!
}
function wrongPick(q: Question): string[] {
  return q.options.filter((o) => !q.correct.includes(o.id)).slice(0, q.correct.length).map((o) => o.id)
}
async function seedIncorrect(questionId: string): Promise<void> {
  const now = new Date().toISOString()
  const session: Session = { id: crypto.randomUUID(), mode: 'practice', status: 'completed', startedAt: now, endedAt: now, exam: null }
  await repository.saveSession(session)
  const q = byId(questionId)
  const answer: Answer = { id: crypto.randomUUID(), sessionId: session.id, questionId, selected: wrongPick(q), correct: false, submittedAt: now, xp: 0 }
  await repository.saveAnswers([answer])
}

describe('round store', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    await useProgressStore().init()
  })
  afterEach(() => vi.useRealTimers())

  it('(a) refuses to start on an empty Pool', () => {
    const round = useRoundStore()
    expect(round.startRound('review', { kind: 'review' })).toBe(false)
    expect(round.round).toBeNull()
  })

  it('(b) grades a practice Round with instant reveal, stamping XP and a Streak, creating one Session on the first Answer', async () => {
    const progress = useProgressStore()
    const round = useRoundStore()
    expect(round.startRound('practice', MONITORING)).toBe(true)
    expect(round.total).toBe(7)
    expect(progress.sessions).toHaveLength(0)

    const q1 = round.currentQuestion!
    round.setPicked([...q1.correct])
    expect(round.canSubmit).toBe(true)
    expect(await round.submit()).toBeNull()
    expect(round.showReveal).toBe(true)
    expect(round.round!.streak).toBe(1)
    expect(round.round!.lastGain).toBe(10)
    expect(progress.sessions).toHaveLength(1)
    expect(progress.sessions[0]!.mode).toBe('practice')
    expect(progress.answers.at(-1)).toMatchObject({ questionId: q1.id, correct: true, xp: 10 })

    expect(await round.advance()).toBeNull()
    expect(round.round!.index).toBe(1)
    expect(round.showReveal).toBe(false)
    const q2 = round.currentQuestion!
    round.setPicked([...q2.correct])
    await round.submit()
    expect(round.round!.streak).toBe(2)
    expect(round.round!.lastGain).toBe(12)
    expect(round.round!.xpGained).toBe(22)

    await round.advance()
    const q3 = round.currentQuestion!
    round.setPicked(wrongPick(q3))
    await round.submit()
    expect(round.round!.streak).toBe(0)
    expect(round.round!.bestStreak).toBe(2)
    expect(round.round!.lastGain).toBe(0)
    expect(progress.answers.at(-1)).toMatchObject({ questionId: q3.id, correct: false, xp: 0 })
    expect(progress.sessions).toHaveLength(1)
  })

  it('(c) end-of-round Feedback timing records silently and advances; finishing returns the Session id', async () => {
    const progress = useProgressStore()
    await progress.updatePreferences({ feedbackTiming: 'end-of-round' })
    const round = useRoundStore()
    round.startRound('practice', MONITORING)
    expect(round.revealsInstantly).toBe(false)

    for (let i = 0; i < 6; i++) {
      round.setPicked([...round.currentQuestion!.correct])
      expect(await round.submit()).toBeNull()
      expect(round.showReveal).toBe(false)
      expect(round.round!.index).toBe(i + 1)
    }
    round.setPicked([...round.currentQuestion!.correct])
    const sessionId = await round.submit()
    expect(sessionId).not.toBeNull()
    expect(round.round).toBeNull()
    const session = (await repository.getSessions()).find((s) => s.id === sessionId)!
    expect(session.status).toBe('completed')
    expect((await repository.getAnswers()).filter((a) => a.sessionId === sessionId)).toHaveLength(7)
  })

  it('(d) review Rounds always reveal, whatever the preference', async () => {
    await seedIncorrect('gov-001')
    setActivePinia(createPinia()) // fresh store so init() loads the seeded Answer
    const progress = useProgressStore()
    await progress.init()
    await progress.updatePreferences({ feedbackTiming: 'end-of-round' })
    const round = useRoundStore()
    expect(round.startRound('review', { kind: 'review' })).toBe(true)
    expect(round.total).toBe(1)
    expect(round.revealsInstantly).toBe(true)
    round.setPicked([...round.currentQuestion!.correct])
    await round.submit()
    expect(round.showReveal).toBe(true)
    expect(useProgressStore().deck).toHaveLength(0) // one correct Answer clears it
  })

  it('(e) a Sprint arms the Shot clock and a timeout records an incorrect Answer with the partial pick', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T10:00:00.000Z'))
    const progress = useProgressStore()
    const round = useRoundStore()
    round.startRound('sprint', MONITORING)
    expect(round.round!.shotClockDeadline).toBe(new Date(Date.now() + SHOT_CLOCK_MS).toISOString())

    await round.timeout()
    expect(round.showReveal).toBe(true)
    expect(round.round!.timedOut).toBe(true)
    expect(round.round!.lastCorrect).toBe(false)
    expect(round.round!.shotClockDeadline).toBeNull()
    expect(progress.answers.at(-1)).toMatchObject({ correct: false, selected: [], xp: 0 })

    await round.advance()
    expect(round.round!.timedOut).toBe(false)
    expect(round.round!.shotClockDeadline).toBe(new Date(Date.now() + SHOT_CLOCK_MS).toISOString())

    round.setPicked([...round.currentQuestion!.correct])
    await round.submit()
    expect(round.round!.lastGain).toBe(15) // base 10 + sprint 5, streak 1
  })

  it('(f) exit completes the Session mid-Round, and is a no-op before any Answer', async () => {
    const progress = useProgressStore()
    const round = useRoundStore()
    round.startRound('practice', MONITORING)
    await round.exit()
    expect(progress.sessions).toHaveLength(0)
    expect(round.round).toBeNull()

    round.startRound('practice', MONITORING)
    round.setPicked([...round.currentQuestion!.correct])
    await round.submit()
    await round.exit()
    expect(progress.sessions).toHaveLength(1)
    expect(progress.sessions[0]!.status).toBe('completed')
    expect(progress.sessions[0]!.endedAt).not.toBeNull()
    await round.exit() // idempotent
    expect(progress.sessions).toHaveLength(1)
  })

  it('(g) togglePick replaces for single and toggles up to the pick count for multi', () => {
    const round = useRoundStore()
    round.startRound('practice', { kind: 'all' })
    const single = questionBank.find((q) => q.kind === 'single')!
    const multi = questionBank.find((q) => q.kind === 'multi' && q.correct.length === 2)!
    round.round!.questionIds = [single.id, multi.id]
    round.round!.index = 0
    round.togglePick('a'); round.togglePick('b')
    expect(round.round!.picked).toEqual(['b'])
    round.round!.index = 1; round.round!.picked = []
    round.togglePick('a'); round.togglePick('b'); round.togglePick('c')
    expect(round.round!.picked).toEqual(['a', 'b'])
    round.togglePick('a')
    expect(round.round!.picked).toEqual(['b'])
  })
})
```

Run: `npm run test:unit -- --run src/stores/__tests__/roundSession.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/stores/roundSession.ts`**

```ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Question } from '@/data/types'
import type { Answer, RoundMode, Session } from '@/domain/entities'
import { drawRound, resolvePool, SHOT_CLOCK_MS, type PoolSpec } from '@/domain/roundBlueprint'
import { isCompleteSelection, isCorrect } from '@/domain/scoring'
import { xpForAnswer } from '@/domain/xp'
import { useProgressStore } from './progress'

export interface RoundResultEntry {
  questionId: string
  selected: string[]
  correct: boolean
  xp: number
}

/** In-memory only: a Round is never resumed (CONTEXT.md). */
export interface RoundState {
  sessionId: string | null
  mode: RoundMode
  pool: PoolSpec
  questionIds: string[]
  index: number
  picked: string[]
  graded: boolean
  results: RoundResultEntry[]
  streak: number
  bestStreak: number
  xpGained: number
  lastGain: number
  lastCorrect: boolean | null
  timedOut: boolean
  shotClockDeadline: string | null
}

export const useRoundStore = defineStore('roundSession', () => {
  const progress = useProgressStore()
  const round = ref<RoundState | null>(null)
  // Repository writes chain here so finish() can wait for them before closing the Session.
  let pending: Promise<void> = Promise.resolve()

  const currentQuestion = computed<Question | null>(() => {
    const r = round.value
    if (!r) return null
    return progress.questionById.get(r.questionIds[r.index] ?? '') ?? null
  })
  const total = computed(() => round.value?.questionIds.length ?? 0)
  const isLast = computed(() => round.value !== null && round.value.index >= total.value - 1)
  const canSubmit = computed(() => {
    const r = round.value
    const q = currentQuestion.value
    return r !== null && q !== null && !r.graded && isCompleteSelection(q, r.picked)
  })
  /** Practice honours Feedback timing; Sprint and Review always reveal (CONTEXT.md). */
  const revealsInstantly = computed(() => {
    const r = round.value
    return r === null || r.mode !== 'practice' || progress.preferences.feedbackTiming === 'instant'
  })
  const showReveal = computed(() => {
    const r = round.value
    return r !== null && r.graded && (revealsInstantly.value || r.timedOut)
  })

  function shotClockFor(mode: RoundMode): string | null {
    return mode === 'sprint' ? new Date(Date.now() + SHOT_CLOCK_MS).toISOString() : null
  }

  function startRound(mode: RoundMode, pool: PoolSpec): boolean {
    const questionIds = drawRound(resolvePool(progress.questions, progress.answers, pool), progress.answers)
    if (questionIds.length === 0) {
      round.value = null
      return false
    }
    round.value = {
      sessionId: null, mode, pool, questionIds, index: 0, picked: [], graded: false, results: [],
      streak: 0, bestStreak: 0, xpGained: 0, lastGain: 0, lastCorrect: null, timedOut: false,
      shotClockDeadline: shotClockFor(mode),
    }
    return true
  }

  function setPicked(optionIds: string[]): void {
    const r = round.value
    if (!r || r.graded) return
    r.picked = optionIds
  }

  function togglePick(optionId: string): void {
    const r = round.value
    const q = currentQuestion.value
    if (!r || !q || r.graded) return
    if (q.kind === 'single') {
      r.picked = [optionId]
    } else if (r.picked.includes(optionId)) {
      r.picked = r.picked.filter((id) => id !== optionId)
    } else if (r.picked.length < q.correct.length) {
      r.picked = [...r.picked, optionId]
    }
  }

  /** The Session is created on the FIRST Answer — no empty-session litter. */
  async function ensureSession(r: RoundState): Promise<string> {
    if (r.sessionId) return r.sessionId
    const now = new Date().toISOString()
    const session: Session = { id: crypto.randomUUID(), mode: r.mode, status: 'in-progress', startedAt: now, endedAt: null, exam: null }
    r.sessionId = session.id
    await progress.saveSession(session)
    return session.id
  }

  /** Grades synchronously (the screen updates now); the writes are queued. */
  function grade(r: RoundState, q: Question, timedOut: boolean): void {
    const selected = r.picked.slice()
    const correct = isCorrect(q, selected)
    const streak = correct ? r.streak + 1 : 0
    const xp = xpForAnswer(r.mode, correct, streak)
    r.results.push({ questionId: q.id, selected, correct, xp })
    r.streak = streak
    r.bestStreak = Math.max(r.bestStreak, streak)
    r.xpGained += xp
    r.lastGain = xp
    r.lastCorrect = correct
    r.timedOut = timedOut
    r.graded = true
    r.shotClockDeadline = null
    pending = pending.then(async () => {
      const sessionId = await ensureSession(r)
      const answer: Answer = {
        id: crypto.randomUUID(), sessionId, questionId: q.id, selected, correct,
        submittedAt: new Date().toISOString(), xp,
      }
      await progress.recordAnswers([answer])
    })
  }

  async function submit(): Promise<string | null> {
    const r = round.value
    const q = currentQuestion.value
    if (!r || !q || !canSubmit.value) return null
    grade(r, q, false)
    if (revealsInstantly.value) {
      await pending
      return null
    }
    return advance()
  }

  /** Sprint timeout: an incorrect Answer with whatever was picked, possibly nothing (ADR-0004). */
  async function timeout(): Promise<void> {
    const r = round.value
    const q = currentQuestion.value
    if (!r || !q || r.graded || r.mode !== 'sprint') return
    grade(r, q, true)
    await pending
  }

  async function advance(): Promise<string | null> {
    const r = round.value
    if (!r || !r.graded) return null
    if (r.index >= r.questionIds.length - 1) return finish()
    r.index += 1
    r.picked = []
    r.graded = false
    r.lastCorrect = null
    r.timedOut = false
    r.shotClockDeadline = shotClockFor(r.mode)
    await pending
    return null
  }

  async function finish(): Promise<string | null> {
    const r = round.value
    round.value = null
    if (!r) return null
    await pending
    const id = r.sessionId
    if (!id) return null
    const current = progress.sessions.find((s) => s.id === id)
    if (current && current.status === 'in-progress') {
      await progress.saveSession({ ...current, status: 'completed', endedAt: new Date().toISOString() })
    }
    return id
  }

  async function exit(): Promise<void> {
    await finish()
  }

  return {
    round, currentQuestion, total, isLast, canSubmit, revealsInstantly, showReveal,
    startRound, setPicked, togglePick, submit, timeout, advance, exit,
  }
})
```

- [ ] **Step 4: Run the store tests, then the whole suite**

Run: `npm run test:unit -- --run src/stores/__tests__/roundSession.spec.ts && npm run test:unit -- --run`
Expected: PASS. Test (d) re-creates the pinia so the seeded incorrect Answer is loaded by `init()`; if `deck` is still 1 after the correct Answer, check `grade()` pushes to `progress.answers` via `recordAnswers` (it must, because `reviewDeck` reads the store cache).

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: PASS. If `App.vue` or `DashboardView.vue` reference removed routes by name, they do not — they use path strings.

- [ ] **Step 6: Commit**

```bash
git add -A src/stores src/composables src/views src/router
git commit -m "feat(store): Round state machine replaces practice store and runner

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Dark tokens, fonts, and the app shell (XpMeter, SaveNotice)

**Files:**
- Rewrite: `src/assets/main.css`
- Modify: `src/main.ts`, `package.json` (deps), `src/App.vue`
- Create: `src/components/XpMeter.vue`, `src/components/SaveNotice.vue`
- Test: `src/components/__tests__/XpMeter.spec.ts`, `src/components/__tests__/SaveNotice.spec.ts`

**Interfaces:**
- Consumes: `progress.totalXp`, `progress.saveFailed`, `progress.dismissSaveFailure()` (Task 5); `levelOf` (Task 1).
- Produces: global CSS classes used by every later task: `.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-outline` (color from `--btn-color`), `.mono`, `.eyebrow`, `.tile`/`.tile__label`/`.tile__value`/`.tile__sub`, `.chip`/`.chip--pass`/`.chip--fail`/`.chip--muted`/`.chip--warn`, `.page`, `.page--narrow`, `.visually-hidden`, `.fade-up`; keyframes `fade-up`, `pulse-seg`, `pop`. CSS variables listed in Step 2. `<XpMeter :total-xp="number" />`.

- [ ] **Step 1: Swap the font packages**

```bash
npm uninstall @fontsource/space-grotesk @fontsource/public-sans @fontsource/ibm-plex-mono
npm install @fontsource/nunito-sans@^5.3.0 @fontsource/jetbrains-mono@^5.3.0
```

Replace the font imports at the top of `src/main.ts` with:

```ts
import '@fontsource/nunito-sans/400.css'
import '@fontsource/nunito-sans/600.css'
import '@fontsource/nunito-sans/700.css'
import '@fontsource/nunito-sans/800.css'
import '@fontsource/nunito-sans/900.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
import './assets/main.css'
```

- [ ] **Step 2: Rewrite `src/assets/main.css`**

```css
:root {
  color-scheme: dark;
  --bg: #14141f;
  --bg-header: #181826;
  --surface: #1c1c2b;
  --surface-raised: #232335;
  --track: #26263a;
  --line: #2a2a3e;
  --line-strong: #3a3a52;
  --ink: #e6e6f0;
  --ink-soft: #b9bdd4;
  --ink-muted: #9494b0;
  --accent: #8b5cf6;
  --accent-hover: #7c4ddb;
  --accent-text: #c4b5fd;
  --accent-soft: rgb(139 92 246 / 0.12);
  --accent-ink: #ffffff;
  --gold: #ffc53d;
  --gold-deep: #ff9f1c;
  --gold-soft: rgb(255 197 61 / 0.12);
  --cyan: #22d3ee;
  --cyan-soft: rgb(34 211 238 / 0.12);
  --pass: #34d399;
  --pass-ink: #0b2b1e;
  --pass-soft: rgb(52 211 153 / 0.1);
  --fail: #f87171;
  --fail-ink: #3a0d0d;
  --fail-soft: rgb(248 113 113 / 0.08);
  --warn: #ffc53d;
  --radius: 12px;
  --radius-large: 14px;
  --radius-small: 8px;
  --shadow: none;
  --font-body: 'Nunito Sans', 'Segoe UI', system-ui, sans-serif;
  --font-display: 'Nunito Sans', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, monospace;
  --dur-fast: 0.12s;
  --dur: 0.25s;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  overflow-x: hidden;
}

body {
  min-height: 100vh;
  margin: 0;
  overflow-x: hidden;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.55;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1,
h2,
h3,
h4 {
  margin: 0 0 0.5em;
  font-family: var(--font-display);
  font-weight: 800;
  line-height: 1.15;
}

a {
  color: var(--accent-text);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes pulse-seg {
  50% {
    opacity: 0.45;
  }
}
@keyframes pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1);
  }
}

.fade-up {
  animation: fade-up var(--dur) ease-out;
}

.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-large);
}

.tile {
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.tile__label {
  margin-bottom: 10px;
}
.tile__value {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
}
.tile__sub {
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-muted);
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  padding: 14px 30px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: none;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  text-decoration: none;
  transition: background-color var(--dur-fast) ease, border-color var(--dur-fast) ease, color var(--dur-fast) ease;
}
.btn:hover {
  text-decoration: none;
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-primary {
  background: var(--accent);
  color: var(--accent-ink);
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn-ghost {
  border-color: var(--line);
  color: var(--ink-muted);
}
.btn-ghost:hover:not(:disabled) {
  border-color: var(--ink-muted);
  color: var(--ink);
}
.btn-outline {
  --btn-color: var(--accent);
  border-color: var(--btn-color);
  color: var(--btn-color);
}
.btn-outline:hover:not(:disabled) {
  background: color-mix(in srgb, var(--btn-color) 12%, transparent);
}
.btn-small {
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  border-radius: var(--radius-small);
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  background: var(--track);
  color: var(--ink-muted);
}
.chip--pass {
  background: var(--pass);
  color: var(--pass-ink);
}
.chip--fail {
  background: var(--fail);
  color: var(--fail-ink);
}
.chip--muted {
  background: var(--track);
  color: var(--ink-muted);
}
.chip--warn {
  background: var(--gold-soft);
  color: var(--gold);
}

.page {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  padding: 48px 28px 72px;
}
.page--narrow {
  max-width: 780px;
  padding-top: 32px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 3: Write the failing XpMeter test**

Create `src/components/__tests__/XpMeter.spec.ts`:

```ts
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import XpMeter from '@/components/XpMeter.vue'

describe('XpMeter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows the Level, XP into the level and the bar width', () => {
    const wrapper = mount(XpMeter, { props: { totalXp: 30 } })
    expect(wrapper.find('.xp-meter__level').text()).toBe('LVL 1')
    expect(wrapper.find('.xp-meter__count').text()).toBe('30/150')
    expect(wrapper.find('.xp-meter__fill').attributes('style')).toContain('width: 20%')
  })

  it('counts up to a new total and re-levels when the total crosses 150', async () => {
    const wrapper = mount(XpMeter, { props: { totalXp: 140 } })
    await wrapper.setProps({ totalXp: 160 })
    await nextTick()
    // mid-animation the count is between the two values
    vi.advanceTimersByTime(300)
    await nextTick()
    const mid = Number(wrapper.find('.xp-meter__count').text().split('/')[0])
    expect(mid).toBeGreaterThanOrEqual(0)
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.find('.xp-meter__level').text()).toBe('LVL 2')
    expect(wrapper.find('.xp-meter__count').text()).toBe('10/200')
    expect(wrapper.find('.xp-meter__fill').attributes('style')).toContain('width: 5%')
  })
})
```

Run: `npm run test:unit -- --run src/components/__tests__/XpMeter.spec.ts`
Expected: FAIL — component missing.

- [ ] **Step 4: Implement `src/components/XpMeter.vue`**

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { levelOf } from '@/domain/xp'

const props = defineProps<{ totalXp: number }>()

const STEPS = 12
const STEP_MS = 50

/** The number on screen; eases toward `totalXp` so a finished Round visibly pays out. */
const shown = ref(props.totalXp)
let timer: ReturnType<typeof setTimeout> | undefined

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

watch(
  () => props.totalXp,
  (target) => {
    clearTimeout(timer)
    if (reducedMotion()) {
      shown.value = target
      return
    }
    const from = shown.value
    let step = 0
    const tick = (): void => {
      step += 1
      shown.value = step >= STEPS ? target : Math.round(from + ((target - from) * step) / STEPS)
      if (step < STEPS) timer = setTimeout(tick, STEP_MS)
    }
    timer = setTimeout(tick, STEP_MS)
  },
)

onBeforeUnmount(() => clearTimeout(timer))

const progress = computed(() => levelOf(shown.value))
const percent = computed(() => Math.round((progress.value.into / progress.value.need) * 100))
</script>

<template>
  <div class="xp-meter" role="group" aria-label="Level and XP">
    <span class="xp-meter__level mono">LVL {{ progress.level }}</span>
    <div class="xp-meter__bar">
      <div class="xp-meter__labels">
        <span>XP</span>
        <span class="xp-meter__count">{{ progress.into }}/{{ progress.need }}</span>
      </div>
      <div class="xp-meter__track">
        <div class="xp-meter__fill" :style="{ width: `${percent}%` }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.xp-meter {
  display: flex;
  align-items: center;
  gap: 20px;
}
.xp-meter__level {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid #4a3a68;
  border-radius: 999px;
  background: #2a2338;
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}
.xp-meter__bar {
  width: 160px;
}
.xp-meter__labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-muted);
}
.xp-meter__track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--track);
}
.xp-meter__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--gold), var(--gold-deep));
  transition: width var(--dur) ease;
}
</style>
```

- [ ] **Step 5: Write the failing SaveNotice test**

Create `src/components/__tests__/SaveNotice.spec.ts`:

```ts
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import SaveNotice from '@/components/SaveNotice.vue'
import { useProgressStore } from '@/stores/progress'

describe('SaveNotice', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders nothing until a write fails, then an alert with a dismiss button', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const progress = useProgressStore()
    const wrapper = mount(SaveNotice, { global: { plugins: [pinia] } })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    progress.saveFailed = true
    await nextTick()
    expect(wrapper.find('[role="alert"]').text()).toContain("Couldn't save")

    await wrapper.find('button').trigger('click')
    expect(progress.saveFailed).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
```

- [ ] **Step 6: Implement `src/components/SaveNotice.vue`**

```vue
<script setup lang="ts">
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
</script>

<template>
  <div v-if="progress.saveFailed" class="save-notice" role="alert">
    <span>Couldn't save your last answer to this browser. What you see is still correct for this tab.</span>
    <button type="button" class="btn btn-ghost btn-small" @click="progress.dismissSaveFailure()">Dismiss</button>
  </div>
</template>

<style scoped>
.save-notice {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(420px, calc(100vw - 32px));
  padding: 12px 14px;
  border: 1px solid var(--fail);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  animation: fade-up var(--dur) ease-out;
}
</style>
```

- [ ] **Step 7: Rewrite `src/App.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import SaveNotice from '@/components/SaveNotice.vue'
import XpMeter from '@/components/XpMeter.vue'
import { useProgressStore } from '@/stores/progress'

const route = useRoute()
const progress = useProgressStore()

/** The exam room strips chrome: no meter, nothing to look at but the clock. */
const isExamRoom = computed(() => route.name === 'exam' && progress.inProgressExam !== null)
const initFailed = ref(false)

onMounted(() => {
  void progress.init().catch(() => {
    initFailed.value = true
  })
})
</script>

<template>
  <div class="app-shell">
    <header class="app-bar">
      <RouterLink to="/" class="wordmark">
        <span class="wordmark__mark mono" aria-hidden="true">A</span>
        <span>AZ-900 Trainer</span>
      </RouterLink>
      <XpMeter v-if="progress.ready && !isExamRoom" :total-xp="progress.totalXp" />
    </header>

    <RouterView v-if="progress.ready" />
    <p v-else-if="initFailed" class="loading">
      Couldn't load your data. Try reloading, or clear this site's storage.
    </p>
    <p v-else class="loading eyebrow">Loading question bank…</p>

    <SaveNotice />
    <AppFooter />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 14px 28px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-header);
}
.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
  text-decoration: none;
}
.wordmark__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--accent), #6d28d9);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.loading {
  padding: 120px 32px;
  text-align: center;
  color: var(--ink-muted);
}
</style>
```

Also update `src/components/AppFooter.vue` styles to the new width: change `max-width: 960px` to `max-width: 1040px`, add `border-top: 1px solid var(--line); text-align: center; font-size: 12px;` and `padding: 18px 28px 28px;`.

- [ ] **Step 8: Run the new tests, then everything**

Run: `npm run test:unit -- --run src/components && npm run test:unit -- --run && npm run type-check`
Expected: PASS. `DashboardView.spec` and `ResultsView.spec` still pass: they assert text and classes, not colors.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/main.ts src/assets/main.css src/App.vue src/components/AppFooter.vue src/components/XpMeter.vue src/components/SaveNotice.vue src/components/__tests__/XpMeter.spec.ts src/components/__tests__/SaveNotice.spec.ts
git commit -m "feat(ui): dark design tokens, Nunito Sans + JetBrains Mono, XP meter and save notice in the shell

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: QuestionCard in the new language — letter chips and tags

**Files:**
- Rewrite: `src/components/QuestionCard.vue`
- Test: `src/components/__tests__/QuestionCard.spec.ts`

**Interfaces:**
- Produces props: `question: Question`, `modelValue: string[]`, `graded?: boolean`, `showQuestionId?: boolean`, `showVerdict?: boolean` (default `true`), `emptyVerdictLabel?: string` (default `'Unanswered'`). Emits `update:modelValue: [string[]]`. Preserved class hooks used by view tests: `.question-card`, `.question-card__id`, `.question-card__verdict`, `.question-card__verdict--pass|--fail|--muted`, `.option`, `.option--correct`, `.option--incorrect`, `.option__explanation`, `a.learn-more`, input ids `${question.id}-${option.id}`. New: `.option--picked`, `.option__letter`, `.option__tag` with `option__tag--pass|--fail`.

- [ ] **Step 1: Update the tests first**

In `src/components/__tests__/QuestionCard.spec.ts`:

Replace the test `'shows the topic label and a domain-colored dot'` with:

```ts
  it('shows the topic label and letters the options a, b, c, d', () => {
    const wrapper = mount(QuestionCard, { props: { question: single, modelValue: [] } })
    expect(wrapper.text()).toContain(TOPICS['describe-cloud-computing'].label)
    expect(wrapper.findAll('.option__letter').map((el) => el.text())).toEqual(['a', 'b', 'c', 'd'])
  })
```

In `'shows a pick-count badge for multi questions, none for single'` change `'Pick 2'` to `'Select 2'` and `.not.toContain('Pick')` to `.not.toContain('Select')`.

Append to the `'QuestionCard graded state'` describe:

```ts
  it('tags the correct option, the correct-but-unpicked option, and the wrong pick', () => {
    const wrong = mount(QuestionCard, { props: { question: single, modelValue: ['a'], graded: true } })
    const tags = wrong.findAll('.option').map((row) => row.find('.option__tag').exists() ? row.find('.option__tag').text() : '')
    expect(tags).toEqual(['Your pick', 'Correct answer', '', ''])

    const right = mount(QuestionCard, { props: { question: single, modelValue: ['b'], graded: true } })
    expect(right.findAll('.option')[1]!.find('.option__tag').text()).toBe('Correct')
  })

  it('marks the picked option before grading', () => {
    const wrapper = mount(QuestionCard, { props: { question: single, modelValue: ['c'] } })
    expect(wrapper.findAll('.option')[2]!.classes()).toContain('option--picked')
    expect(wrapper.find('.option__tag').exists()).toBe(false)
  })

  it('hides the verdict line when showVerdict is false and renames the empty verdict', () => {
    const hidden = mount(QuestionCard, { props: { question: single, modelValue: ['b'], graded: true, showVerdict: false } })
    expect(hidden.find('.question-card__verdict').exists()).toBe(false)

    const noPick = mount(QuestionCard, { props: { question: single, modelValue: [], graded: true, emptyVerdictLabel: 'No pick' } })
    expect(noPick.find('.question-card__verdict').text()).toBe('No pick')
  })
```

Run: `npm run test:unit -- --run src/components/__tests__/QuestionCard.spec.ts`
Expected: the four new/changed tests FAIL.

- [ ] **Step 2: Rewrite `src/components/QuestionCard.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/data/types'
import { TOPICS } from '@/data/types'
import { isCorrect } from '@/domain/scoring'

const props = withDefaults(
  defineProps<{
    question: Question
    modelValue: string[]
    graded?: boolean
    showQuestionId?: boolean
    showVerdict?: boolean
    emptyVerdictLabel?: string
  }>(),
  { graded: false, showQuestionId: false, showVerdict: true, emptyVerdictLabel: 'Unanswered' },
)

const emit = defineEmits<{
  'update:modelValue': [string[]]
}>()

const topicLabel = computed(() => TOPICS[props.question.topic].label)
const radioName = computed(() => `option-${props.question.id}`)
const verdictIsCorrect = computed(() => isCorrect(props.question, props.modelValue))
/** An empty pick is its own verdict — never graded as "Incorrect". */
const verdictLabel = computed(() => {
  if (props.modelValue.length === 0) return props.emptyVerdictLabel
  return verdictIsCorrect.value ? 'Correct' : 'Incorrect'
})
const verdictModifier = computed(() => {
  if (props.modelValue.length === 0) return 'question-card__verdict--muted'
  return verdictIsCorrect.value ? 'question-card__verdict--pass' : 'question-card__verdict--fail'
})

function letter(index: number): string {
  return String.fromCharCode(97 + index)
}

function optionInputId(optionId: string): string {
  return `${props.question.id}-${optionId}`
}

function isSelected(optionId: string): boolean {
  return props.modelValue.includes(optionId)
}

function optionClasses(optionId: string): Record<string, boolean> {
  const correct = props.question.correct.includes(optionId)
  const selected = isSelected(optionId)
  if (!props.graded) return { 'option--picked': selected }
  return {
    'option--correct': correct,
    'option--incorrect': !correct && selected,
    'option--dim': !correct && !selected,
  }
}

/** Correct / Correct answer / Your pick — the design's three reveal tags. */
function tagFor(optionId: string): { label: string; modifier: string } | null {
  if (!props.graded) return null
  const correct = props.question.correct.includes(optionId)
  const selected = isSelected(optionId)
  if (correct) return { label: selected ? 'Correct' : 'Correct answer', modifier: 'option__tag--pass' }
  if (selected) return { label: 'Your pick', modifier: 'option__tag--fail' }
  return null
}

function onRadioChange(optionId: string): void {
  emit('update:modelValue', [optionId])
}

function onCheckboxChange(optionId: string, event: Event): void {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    if (props.modelValue.length >= props.question.correct.length) {
      // Pick count already reached: revert the native toggle and ignore the change.
      target.checked = false
      return
    }
    emit('update:modelValue', [...props.modelValue, optionId])
  } else {
    emit('update:modelValue', props.modelValue.filter((id) => id !== optionId))
  }
}
</script>

<template>
  <fieldset class="question-card">
    <div class="question-card__meta">
      <span class="question-card__topic eyebrow">{{ topicLabel }}</span>
      <span v-if="showQuestionId" class="question-card__id mono">{{ question.id }}</span>
      <span v-if="question.kind === 'multi'" class="question-card__badge chip">
        Select {{ question.correct.length }}
      </span>
    </div>

    <legend class="question-card__stem">{{ question.stem }}</legend>

    <p v-if="graded && showVerdict" class="question-card__verdict" :class="verdictModifier">
      {{ verdictLabel }}
    </p>

    <div class="question-card__options">
      <label
        v-for="(option, index) in question.options"
        :key="option.id"
        class="option"
        :class="optionClasses(option.id)"
      >
        <input
          v-if="question.kind === 'single'"
          type="radio"
          class="option__input visually-hidden"
          :id="optionInputId(option.id)"
          :name="radioName"
          :checked="isSelected(option.id)"
          :disabled="graded"
          @change="onRadioChange(option.id)"
        />
        <input
          v-else
          type="checkbox"
          class="option__input visually-hidden"
          :id="optionInputId(option.id)"
          :checked="isSelected(option.id)"
          :disabled="graded"
          @change="onCheckboxChange(option.id, $event)"
        />
        <span class="option__letter mono" aria-hidden="true">{{ letter(index) }}</span>
        <span class="option__body">
          <span class="option__row">
            <span class="option__text">{{ option.text }}</span>
            <span v-if="tagFor(option.id)" class="option__tag chip" :class="tagFor(option.id)!.modifier">
              {{ tagFor(option.id)!.label }}
            </span>
          </span>
          <span v-if="graded" class="option__explanation">{{ option.explanation }}</span>
        </span>
      </label>
    </div>

    <a
      v-if="graded && question.learnMore"
      class="learn-more"
      :href="question.learnMore"
      target="_blank"
      rel="noreferrer"
    >
      Learn more →
    </a>
  </fieldset>
</template>

<style scoped>
.question-card {
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
}
.question-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.question-card__id {
  font-size: 11px;
  color: var(--ink-muted);
}
.question-card__badge {
  background: var(--track);
  color: var(--accent-text);
}
.question-card__stem {
  padding: 0;
  margin-bottom: 24px;
  font-family: var(--font-display);
  font-size: clamp(18px, 2.6vw, 23px);
  font-weight: 800;
  line-height: 1.4;
  color: var(--ink);
}
.question-card__verdict {
  margin: -8px 0 16px;
  font-weight: 800;
}
.question-card__verdict--pass {
  color: var(--pass);
}
.question-card__verdict--fail {
  color: var(--fail);
}
.question-card__verdict--muted {
  color: var(--ink-muted);
}
.question-card__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.option {
  position: relative;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 15px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  cursor: pointer;
  transition: border-color var(--dur-fast), background var(--dur-fast);
}
.option:hover:not(:has(input:disabled)) {
  border-color: var(--accent);
}
.option:has(input:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.option:has(input:disabled) {
  cursor: default;
}
.option__letter {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-small);
  color: var(--ink-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
.option__body {
  flex: 1;
  min-width: 0;
}
.option__row {
  display: flex;
  gap: 12px;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
}
.option__text {
  flex: 1;
  min-width: 200px;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.5;
}
.option__explanation {
  display: block;
  max-width: 66ch;
  margin-top: 8px;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.55;
}
.option--picked {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.option--picked .option__letter {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}
.option--correct {
  border-color: var(--pass);
  background: var(--pass-soft);
}
.option--correct .option__letter {
  border-color: var(--pass);
  background: var(--pass);
  color: var(--pass-ink);
}
.option--incorrect {
  border-color: var(--fail);
  background: var(--fail-soft);
}
.option--incorrect .option__letter {
  border-color: var(--fail);
  background: var(--fail);
  color: var(--fail-ink);
}
.option--dim .option__text {
  color: var(--ink-muted);
}
.option--dim .option__explanation {
  color: var(--ink-muted);
}
.option__tag--pass {
  background: var(--pass);
  color: var(--pass-ink);
}
.option__tag--fail {
  background: var(--fail);
  color: var(--fail-ink);
}
.learn-more {
  display: inline-block;
  margin-top: 16px;
  font-size: 13px;
  font-weight: 700;
}
</style>
```

- [ ] **Step 3: Run the card tests and the suite**

Run: `npm run test:unit -- --run src/components/__tests__/QuestionCard.spec.ts && npm run test:unit -- --run`
Expected: PASS. `ResultsView.spec` still finds `.question-card__verdict--fail` and `.question-card__verdict--muted`.

- [ ] **Step 4: Commit**

```bash
git add src/components/QuestionCard.vue src/components/__tests__/QuestionCard.spec.ts
git commit -m "feat(ui): QuestionCard with letter chips, reveal tags, optional verdict

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: RoundProgress and ShotClock components

**Files:**
- Create: `src/components/RoundProgress.vue`, `src/components/ShotClock.vue`
- Test: `src/components/__tests__/RoundProgress.spec.ts`, `src/components/__tests__/ShotClock.spec.ts`

**Interfaces:**
- Produces: `<RoundProgress :total="number" :index="number" :outcomes="boolean[]" :neutral="boolean" />` — one `.seg` per Question with exactly one of `seg--pass`, `seg--fail`, `seg--done` (neutral), `seg--current`, `seg--todo`.
- Produces: `<ShotClock :deadline="isoString" :duration-ms="number" @expired />` — `.shot-clock__fill` width %, `.shot-clock__value` text `0:SS`, `.shot-clock--low` at ≤ 5 s, `role="timer"`. Emits `expired` exactly once when remaining hits 0. Ticks every 100 ms from the wall clock.

- [ ] **Step 1: Write the failing tests**

`src/components/__tests__/RoundProgress.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RoundProgress from '@/components/RoundProgress.vue'

describe('RoundProgress', () => {
  it('renders one segment per Question with pass/fail/current/todo states', () => {
    const wrapper = mount(RoundProgress, { props: { total: 5, index: 2, outcomes: [true, false], neutral: false } })
    const segs = wrapper.findAll('.seg')
    expect(segs).toHaveLength(5)
    expect(segs[0]!.classes()).toContain('seg--pass')
    expect(segs[1]!.classes()).toContain('seg--fail')
    expect(segs[2]!.classes()).toContain('seg--current')
    expect(segs[3]!.classes()).toContain('seg--todo')
    expect(segs[4]!.classes()).toContain('seg--todo')
    expect(wrapper.attributes('aria-valuenow')).toBe('2')
    expect(wrapper.attributes('aria-valuemax')).toBe('5')
  })

  it('hides verdicts behind a neutral done state in end-of-round mode', () => {
    const wrapper = mount(RoundProgress, { props: { total: 3, index: 2, outcomes: [true, false], neutral: true } })
    const segs = wrapper.findAll('.seg')
    expect(segs[0]!.classes()).toContain('seg--done')
    expect(segs[1]!.classes()).toContain('seg--done')
    expect(segs[0]!.classes()).not.toContain('seg--pass')
  })
})
```

`src/components/__tests__/ShotClock.spec.ts`:

```ts
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShotClock from '@/components/ShotClock.vue'

const START = Date.parse('2026-09-10T10:00:00.000Z')
const DURATION = 20_000

function mountClock() {
  return mount(ShotClock, { props: { deadline: new Date(START + DURATION).toISOString(), durationMs: DURATION } })
}
async function advance(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

describe('ShotClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(START)
  })
  afterEach(() => vi.useRealTimers())

  it('starts full and counts down from the wall clock', async () => {
    const wrapper = mountClock()
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:20')
    expect(wrapper.find('.shot-clock__fill').attributes('style')).toContain('width: 100%')
    expect(wrapper.attributes('role')).toBe('timer')

    await advance(5_000)
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:15')
    expect(wrapper.find('.shot-clock__fill').attributes('style')).toContain('width: 75%')
    expect(wrapper.classes()).not.toContain('shot-clock--low')
  })

  it('turns low at five seconds and emits expired exactly once at zero', async () => {
    const wrapper = mountClock()
    await advance(15_000)
    expect(wrapper.classes()).toContain('shot-clock--low')
    expect(wrapper.emitted('expired')).toBeUndefined()

    await advance(5_100)
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:00')
    expect(wrapper.emitted('expired')).toHaveLength(1)

    await advance(2_000)
    expect(wrapper.emitted('expired')).toHaveLength(1)
  })
})
```

Run: `npm run test:unit -- --run src/components/__tests__/RoundProgress.spec.ts src/components/__tests__/ShotClock.spec.ts`
Expected: FAIL — components missing.

- [ ] **Step 2: Implement `src/components/RoundProgress.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  index: number
  /** Outcome per answered Question, in order. */
  outcomes: boolean[]
  /** End-of-round Feedback timing: answered segments show done, not pass/fail. */
  neutral: boolean
}>()

const segments = computed(() =>
  Array.from({ length: props.total }, (_, i) => {
    if (i < props.outcomes.length) {
      if (props.neutral) return 'seg--done'
      return props.outcomes[i] ? 'seg--pass' : 'seg--fail'
    }
    return i === props.index ? 'seg--current' : 'seg--todo'
  }),
)
</script>

<template>
  <div
    class="round-progress"
    role="progressbar"
    aria-label="Round progress"
    :aria-valuemin="0"
    :aria-valuenow="outcomes.length"
    :aria-valuemax="total"
  >
    <span v-for="(modifier, i) in segments" :key="i" class="seg" :class="modifier"></span>
  </div>
</template>

<style scoped>
.round-progress {
  display: flex;
  gap: 5px;
}
.seg {
  flex: 1;
  height: 7px;
  border-radius: 999px;
  background: var(--track);
  transition: background var(--dur-fast);
}
.seg--pass {
  background: var(--pass);
}
.seg--fail {
  background: var(--fail);
}
.seg--done {
  background: #4a4a66;
}
.seg--current {
  background: var(--accent);
  animation: pulse-seg 1.4s ease-in-out infinite;
}
</style>
```

- [ ] **Step 3: Implement `src/components/ShotClock.vue`**

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  /** ISO instant the Shot clock hits zero (CONTEXT.md: Shot clock). */
  deadline: string
  durationMs: number
}>()

const emit = defineEmits<{ expired: [] }>()

const TICK_MS = 100
const LOW_MS = 5_000

const nowMs = ref(Date.now())
let intervalId: ReturnType<typeof setInterval> | undefined
let expiredFor: string | null = null

/** Always the wall clock, never a decremented counter — a throttled tab must not gain time. */
const remainingMs = computed(() => Math.max(0, Date.parse(props.deadline) - nowMs.value))
const percent = computed(() => Math.round((remainingMs.value / props.durationMs) * 100))
const isLow = computed(() => remainingMs.value <= LOW_MS)
const display = computed(() => `0:${String(Math.ceil(remainingMs.value / 1000)).padStart(2, '0')}`)

function tick(): void {
  nowMs.value = Date.now()
  if (remainingMs.value === 0 && expiredFor !== props.deadline) {
    expiredFor = props.deadline
    emit('expired')
  }
}

watch(() => props.deadline, () => tick())

onMounted(() => {
  tick()
  intervalId = setInterval(tick, TICK_MS)
})
onBeforeUnmount(() => clearInterval(intervalId))
</script>

<template>
  <div class="shot-clock" :class="{ 'shot-clock--low': isLow }" role="timer" aria-label="Shot clock">
    <div class="shot-clock__track">
      <div class="shot-clock__fill" :style="{ width: `${percent}%` }"></div>
    </div>
    <span class="shot-clock__value mono">{{ display }}</span>
  </div>
</template>

<style scoped>
.shot-clock {
  --clock-color: var(--cyan);
  display: flex;
  align-items: center;
  gap: 12px;
}
.shot-clock--low {
  --clock-color: var(--fail);
}
.shot-clock__track {
  flex: 1;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--track);
}
.shot-clock__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--clock-color);
  transition: width 0.1s linear;
}
.shot-clock__value {
  min-width: 44px;
  text-align: right;
  color: var(--clock-color);
  font-size: 15px;
  font-weight: 700;
}
</style>
```

- [ ] **Step 4: Run the tests**

Run: `npm run test:unit -- --run src/components`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/RoundProgress.vue src/components/ShotClock.vue src/components/__tests__/RoundProgress.spec.ts src/components/__tests__/ShotClock.spec.ts
git commit -m "feat(ui): RoundProgress segments and the Sprint ShotClock

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: RoundView — one view for Practice, Sprint and Review

**Files:**
- Create: `src/views/RoundView.vue`
- Modify: `src/router/index.ts`, `src/App.vue` (key the RouterView by path)
- Test: `src/views/__tests__/RoundView.spec.ts`

**Interfaces:**
- Consumes: `useRoundStore()` (Task 6), `QuestionCard` (Task 8), `RoundProgress`, `ShotClock` (Task 9), `poolLabel`, `SHOT_CLOCK_MS`, `PoolSpec` (Task 2), `progress.preferences.domain` (Task 5).
- Produces routes `/practice`, `/sprint`, `/review` → `RoundView` with static prop `mode`. Pool comes from the query: `?topic=<TopicId>` beats `?domain=<DomainId>` beats the remembered Domain preference; `/review` always uses the review deck. Finishing navigates to `/results/:sessionId`. Copy: `Submit`, `Next`, `See results`, `Finish`, `Exit`, `Correct +N XP`, `Incorrect`, `Time up`, `STREAK ×N`.

- [ ] **Step 1: Routes and RouterView key**

In `src/router/index.ts` add, after the dashboard route:

```ts
  {
    path: '/practice',
    name: 'practice',
    component: () => import('../views/RoundView.vue'),
    props: { mode: 'practice' },
  },
  {
    path: '/sprint',
    name: 'sprint',
    component: () => import('../views/RoundView.vue'),
    props: { mode: 'sprint' },
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('../views/RoundView.vue'),
    props: { mode: 'review' },
  },
```

In `src/App.vue` change `<RouterView v-if="progress.ready" />` to `<RouterView v-if="progress.ready" :key="route.path" />` so `/practice` → `/sprint` remounts the view and starts a fresh Round.

- [ ] **Step 2: Write the failing view tests**

Create `src/views/__tests__/RoundView.spec.ts`:

```ts
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import { repository } from '@/repository'
import { routes } from '@/router'
import { useProgressStore } from '@/stores/progress'

const realSetTimeout = globalThis.setTimeout

const RouterHost = defineComponent({ name: 'RouterHost', setup: () => () => h(RouterView) })

interface Harness { wrapper: VueWrapper; router: Router }

async function mountRoute(path: string): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useProgressStore().init()
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
  await nextTick()
  return { wrapper, router }
}

async function settle(): Promise<void> {
  await new Promise((resolve) => realSetTimeout(resolve, 0))
  await nextTick()
}

async function waitForPath(router: Router, prefix: string): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (router.currentRoute.value.fullPath.startsWith(prefix)) return
    await settle()
  }
  throw new Error(`Never navigated to ${prefix} (at ${router.currentRoute.value.fullPath})`)
}

function findButton(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const button = wrapper.findAll('button').find((b) => b.text() === label)
  if (!button) throw new Error(`No button labelled "${label}"`)
  return button
}
function hasButton(wrapper: VueWrapper, label: string): boolean {
  return wrapper.findAll('button').some((b) => b.text() === label)
}
function findLink(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const link = wrapper.findAll('a').find((a) => a.text() === label)
  if (!link) throw new Error(`No link labelled "${label}"`)
  return link
}
function shownQuestion(wrapper: VueWrapper): Question {
  const id = wrapper.find('.question-card__id').text()
  return questionBank.find((q) => q.id === id)!
}
async function answerCorrectly(wrapper: VueWrapper, q: Question): Promise<void> {
  for (const optionId of q.correct) await wrapper.find(`#${q.id}-${optionId}`).setValue(true)
}
async function answerIncorrectly(wrapper: VueWrapper, q: Question): Promise<void> {
  const wrong = q.options.filter((o) => !q.correct.includes(o.id)).slice(0, q.correct.length)
  for (const o of wrong) await wrapper.find(`#${q.id}-${o.id}`).setValue(true)
}
async function seedIncorrect(q: Question): Promise<void> {
  const now = new Date().toISOString()
  const session: Session = { id: crypto.randomUUID(), mode: 'practice', status: 'completed', startedAt: now, endedAt: now, exam: null }
  await repository.saveSession(session)
  const wrong = q.options.find((o) => !q.correct.includes(o.id))!
  const answer: Answer = { id: crypto.randomUUID(), sessionId: session.id, questionId: q.id, selected: [wrong.id], correct: false, submittedAt: now, xp: 0 }
  await repository.saveAnswers([answer])
}

const MONITORING = questionBank.filter((q) => q.topic === 'monitoring-tools') // 7

describe('RoundView', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('(a) shows the empty state when the review deck is empty', async () => {
    const { wrapper } = await mountRoute('/review')
    expect(wrapper.text()).toContain('Nothing to review yet')
    expect(findLink(wrapper, 'Dashboard').attributes('href')).toBe('/')
    expect(wrapper.find('.question-card').exists()).toBe(false)
  })

  it('(b) runs a topic Practice Round with instant reveal through to the results page', async () => {
    const { wrapper, router } = await mountRoute('/practice?topic=monitoring-tools')
    expect(wrapper.text()).toContain('01/7')
    expect(wrapper.text()).toContain('Describe monitoring tools in Azure')
    expect(wrapper.findAll('.seg')).toHaveLength(7)
    expect(findButton(wrapper, 'Submit').attributes('disabled')).toBeDefined()

    const first = shownQuestion(wrapper)
    await answerCorrectly(wrapper, first)
    expect(findButton(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
    await findButton(wrapper, 'Submit').trigger('click')
    await settle()
    expect(wrapper.text()).toContain('Correct +10 XP')
    expect(wrapper.find('.option--correct').exists()).toBe(true)
    expect(wrapper.text()).toContain('+10 XP')
    expect(wrapper.findAll('.seg')[0]!.classes()).toContain('seg--pass')

    await findButton(wrapper, 'Next').trigger('click')
    await settle()
    expect(wrapper.text()).toContain('02/7')

    const second = shownQuestion(wrapper)
    await answerCorrectly(wrapper, second)
    await findButton(wrapper, 'Submit').trigger('click')
    await settle()
    expect(wrapper.text()).toContain('STREAK ×2')
    expect(wrapper.text()).toContain('Correct +12 XP')

    for (let i = 2; i < MONITORING.length; i++) {
      await findButton(wrapper, 'Next').trigger('click')
      await settle()
      await answerIncorrectly(wrapper, shownQuestion(wrapper))
      await findButton(wrapper, 'Submit').trigger('click')
      await settle()
      expect(wrapper.text()).toContain('Incorrect')
    }
    expect(hasButton(wrapper, 'See results')).toBe(true)
    await findButton(wrapper, 'See results').trigger('click')
    await waitForPath(router, '/results/')

    const sessions = await repository.getSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]!.mode).toBe('practice')
    expect(sessions[0]!.status).toBe('completed')
    const answers = await repository.getAnswers()
    expect(answers).toHaveLength(7)
    expect(answers.map((a) => a.xp)).toEqual([10, 12, 0, 0, 0, 0, 0])
  })

  it('(c) end-of-round Feedback timing never reveals; Finish goes to the results page', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    await useProgressStore().init()
    await useProgressStore().updatePreferences({ feedbackTiming: 'end-of-round' })
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/practice?topic=monitoring-tools')
    await router.isReady()
    const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
    await nextTick()

    for (let i = 0; i < MONITORING.length - 1; i++) {
      await answerCorrectly(wrapper, shownQuestion(wrapper))
      await findButton(wrapper, 'Next').trigger('click')
      await settle()
      expect(wrapper.text()).not.toContain('Correct +')
      expect(wrapper.find('.option--correct').exists()).toBe(false)
      expect(wrapper.findAll('.seg')[i]!.classes()).toContain('seg--done')
    }
    await answerCorrectly(wrapper, shownQuestion(wrapper))
    await findButton(wrapper, 'Finish').trigger('click')
    await waitForPath(router, '/results/')
    expect((await repository.getAnswers())).toHaveLength(7)
  })

  it('(d) a Sprint shows the Shot clock and a timeout records an incorrect Answer with no pick', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.parse('2026-09-10T10:00:00.000Z'))
    const { wrapper } = await mountRoute('/sprint?topic=monitoring-tools')
    expect(wrapper.find('.shot-clock').exists()).toBe(true)
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:20')

    await vi.advanceTimersByTimeAsync(20_200)
    await settle()
    expect(wrapper.text()).toContain('Time up')
    expect(wrapper.find('.shot-clock').exists()).toBe(false)
    const answers = await repository.getAnswers()
    expect(answers).toHaveLength(1)
    expect(answers[0]).toMatchObject({ correct: false, selected: [], xp: 0 })

    await findButton(wrapper, 'Next').trigger('click')
    await settle()
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:20')
  })

  it('(e) leaving mid-Round completes the Session', async () => {
    const { wrapper, router } = await mountRoute('/practice?topic=monitoring-tools')
    await answerCorrectly(wrapper, shownQuestion(wrapper))
    await findButton(wrapper, 'Submit').trigger('click')
    await settle()
    await router.push('/')
    await settle()
    const sessions = await repository.getSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]!.status).toBe('completed')
    expect(await repository.getAnswers()).toHaveLength(1)
  })

  it('(f) a review Round clears a Question from the deck on a correct Answer', async () => {
    const q = MONITORING[0]!
    await seedIncorrect(q)
    const { wrapper } = await mountRoute('/review')
    expect(wrapper.text()).toContain('01/1')
    expect(wrapper.text()).toContain('Review deck')
    await answerCorrectly(wrapper, q)
    await findButton(wrapper, 'Submit').trigger('click')
    await settle()
    expect(useProgressStore().deck).toHaveLength(0)
    expect(hasButton(wrapper, 'See results')).toBe(true)
  })

  it('(g) number keys pick and Enter submits', async () => {
    const { wrapper } = await mountRoute('/practice?topic=monitoring-tools')
    const q = shownQuestion(wrapper)
    const correctIndex = q.options.findIndex((o) => o.id === q.correct[0])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: String(correctIndex + 1) }))
    await nextTick()
    expect(wrapper.findAll('.option')[correctIndex]!.classes()).toContain('option--picked')
    if (q.kind === 'multi') {
      for (const id of q.correct.slice(1)) {
        const idx = q.options.findIndex((o) => o.id === id)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: String(idx + 1) }))
      }
      await nextTick()
    }
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await settle()
    expect(wrapper.text()).toContain('Correct +10 XP')
  })
})
```

Run: `npm run test:unit -- --run src/views/__tests__/RoundView.spec.ts`
Expected: FAIL — view missing.

- [ ] **Step 3: Implement `src/views/RoundView.vue`**

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, RouterLink, useRoute, useRouter } from 'vue-router'
import QuestionCard from '@/components/QuestionCard.vue'
import RoundProgress from '@/components/RoundProgress.vue'
import ShotClock from '@/components/ShotClock.vue'
import { DOMAINS, TOPICS, type DomainId, type TopicId } from '@/data/types'
import type { RoundMode } from '@/domain/entities'
import { poolLabel, SHOT_CLOCK_MS, type PoolSpec } from '@/domain/roundBlueprint'
import { useProgressStore } from '@/stores/progress'
import { useRoundStore } from '@/stores/roundSession'

const props = defineProps<{ mode: RoundMode }>()

const route = useRoute()
const router = useRouter()
const progress = useProgressStore()
const roundStore = useRoundStore()

const HEADING: Record<RoundMode, string> = { practice: 'Practice round', sprint: 'Sprint', review: 'Review' }

/** `?topic=` beats `?domain=` beats the remembered Domain chip; Review always uses the deck. */
function poolFromRoute(): PoolSpec {
  if (props.mode === 'review') return { kind: 'review' }
  const topic = route.query.topic
  const domain = route.query.domain
  if (typeof topic === 'string' && topic in TOPICS) return { kind: 'topic', topic: topic as TopicId }
  if (typeof domain === 'string' && domain in DOMAINS) return { kind: 'domain', domain: domain as DomainId }
  const remembered = progress.preferences.domain
  return remembered === 'all' ? { kind: 'all' } : { kind: 'domain', domain: remembered }
}

const started = roundStore.startRound(props.mode, poolFromRoute())
const finishing = ref(false)

const round = computed(() => roundStore.round)
const position = computed(() => String((round.value?.index ?? 0) + 1).padStart(2, '0'))
const outcomes = computed(() => round.value?.results.map((r) => r.correct) ?? [])

const primaryLabel = computed(() => {
  if (roundStore.showReveal) return roundStore.isLast ? 'See results' : 'Next'
  if (!roundStore.revealsInstantly) return roundStore.isLast ? 'Finish' : 'Next'
  return 'Submit'
})
const primaryDisabled = computed(() => !roundStore.showReveal && !roundStore.canSubmit)

const revealMessage = computed(() => {
  const r = round.value
  if (!r || !roundStore.showReveal) return ''
  if (r.lastCorrect) return `Correct +${r.lastGain} XP`
  return r.timedOut ? 'Time up' : 'Incorrect'
})
const showStreak = computed(() => {
  const r = round.value
  return r !== null && r.streak >= 2 && !(roundStore.showReveal && !r.lastCorrect)
})

const emptyMessage =
  props.mode === 'review' ? 'Nothing to review yet. A wrong Answer lands here.' : 'No Questions in this Pool yet.'

async function leaveToResults(sessionId: string | null): Promise<void> {
  finishing.value = true
  if (sessionId) await router.push({ name: 'results', params: { sessionId } })
  else await router.push('/')
}

async function primary(): Promise<void> {
  if (finishing.value || !round.value) return
  const sessionId = roundStore.showReveal ? await roundStore.advance() : await roundStore.submit()
  if (!roundStore.round) await leaveToResults(sessionId)
}

/** 1–5 pick an option, Enter is the primary action — unless a button or link has focus. */
function onKeydown(event: KeyboardEvent): void {
  if (!round.value) return
  if (event.key === 'Enter') {
    const target = event.target as HTMLElement | null
    if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) return
    event.preventDefault()
    void primary()
    return
  }
  const n = Number(event.key)
  if (n >= 1 && n <= 5) {
    const option = roundStore.currentQuestion?.options[n - 1]
    if (option) roundStore.togglePick(option.id)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  void roundStore.exit()
})
onBeforeRouteLeave(() => {
  void roundStore.exit()
  return true
})
</script>

<template>
  <main v-if="!started" class="page page--narrow fade-up">
    <div class="card empty">
      <h1>{{ HEADING[mode] }}</h1>
      <p class="empty__copy">{{ emptyMessage }}</p>
      <RouterLink class="btn btn-ghost" to="/">Dashboard</RouterLink>
    </div>
  </main>

  <main v-else-if="round && roundStore.currentQuestion" class="page page--narrow">
    <div class="round-bar">
      <div class="round-bar__group">
        <span class="round-bar__position mono">{{ position }}/{{ roundStore.total }}</span>
        <span class="eyebrow">{{ poolLabel(round.pool) }}</span>
      </div>
      <div class="round-bar__group">
        <span v-if="showStreak" :key="round.streak" class="streak-badge mono">STREAK ×{{ round.streak }}</span>
        <span class="round-bar__xp mono">+{{ round.xpGained }} XP</span>
        <RouterLink class="btn btn-ghost btn-small" to="/">Exit</RouterLink>
      </div>
    </div>

    <RoundProgress
      class="round-progress"
      :total="roundStore.total"
      :index="round.index"
      :outcomes="outcomes"
      :neutral="!roundStore.revealsInstantly"
    />

    <ShotClock
      v-if="round.mode === 'sprint' && round.shotClockDeadline"
      class="round-clock"
      :deadline="round.shotClockDeadline"
      :duration-ms="SHOT_CLOCK_MS"
      @expired="roundStore.timeout()"
    />

    <QuestionCard
      :key="roundStore.currentQuestion.id"
      class="round-question"
      :question="roundStore.currentQuestion"
      :model-value="round.picked"
      :graded="roundStore.showReveal"
      :show-verdict="false"
      show-question-id
      @update:model-value="roundStore.setPicked"
    />

    <div class="round-actions">
      <span
        v-if="revealMessage"
        class="reveal-pill mono"
        :class="round.lastCorrect ? 'reveal-pill--pass' : 'reveal-pill--fail'"
        role="status"
      >
        {{ revealMessage }}
      </span>
      <span v-else></span>
      <button class="btn btn-primary" type="button" :disabled="primaryDisabled" @click="primary">
        {{ primaryLabel }}
      </button>
    </div>
  </main>

  <main v-else class="page page--narrow">
    <p class="eyebrow ending-note">Scoring your round…</p>
  </main>
</template>

<style scoped>
.empty {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.empty__copy {
  margin: 0;
  color: var(--ink-muted);
}
.round-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.round-bar__group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.round-bar__position {
  font-size: 12px;
  font-weight: 700;
}
.round-bar__xp {
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
}
.streak-badge {
  padding: 5px 10px;
  border: 1px solid var(--accent);
  border-radius: 999px;
  background: rgb(139 92 246 / 0.18);
  color: var(--accent-text);
  font-size: 11px;
  font-weight: 700;
  animation: pop var(--dur) ease-out;
}
.round-progress {
  margin-top: 16px;
}
.round-clock {
  margin-top: 12px;
}
.round-question {
  margin-top: 26px;
}
.round-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.reveal-pill {
  padding: 8px 12px;
  border: 1px solid currentColor;
  border-radius: var(--radius-small);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  animation: pop var(--dur) ease-out;
}
.reveal-pill--pass {
  color: var(--pass);
  background: rgb(52 211 153 / 0.14);
}
.reveal-pill--fail {
  color: var(--fail);
  background: rgb(248 113 113 / 0.12);
}
.ending-note {
  text-align: center;
  padding: 80px 0;
}
</style>
```

- [ ] **Step 4: Run the view tests and the suite**

Run: `npm run test:unit -- --run src/views/__tests__/RoundView.spec.ts && npm run test:unit -- --run && npm run type-check`
Expected: PASS. If (d) never shows "Time up", confirm `ShotClock` ticks under fake timers (`setInterval` is faked by `vi.useFakeTimers()`) and that `advanceTimersByTimeAsync` is used so the awaited `timeout()` chain flushes.

- [ ] **Step 5: Commit**

```bash
git add src/views/RoundView.vue src/views/__tests__/RoundView.spec.ts src/router/index.ts src/App.vue
git commit -m "feat(ui): RoundView for Practice, Sprint and Review with keyboard and Shot clock

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Results — breakdown rows, Round results, exam results

**Files:**
- Create: `src/components/breakdownRows.ts`, `src/components/BreakdownList.vue`, `src/components/results/RoundResults.vue`, `src/components/results/ExamResults.vue`
- Rewrite: `src/views/ResultsView.vue`
- Test: `src/components/__tests__/breakdownRows.spec.ts`, `src/views/__tests__/ResultsView.spec.ts`

**Interfaces:**
- Consumes: `summarizeRound` (Task 3), `QuestionCard` (Task 8), `ScoreScale`, `estimatedScore`, `PASS_LINE`, `totalXp` (Task 1).
- Produces:
  ```ts
  export type BreakdownStatus = 'correct' | 'incorrect' | 'unanswered' | 'no-pick'
  export interface BreakdownRow { key: string; number: number; question: Question | undefined; selected: string[]; status: BreakdownStatus }
  export function examBreakdownRows(session: Session, answers: Answer[], questionById: Map<string, Question>): BreakdownRow[]
  export function roundBreakdownRows(answers: Answer[], questionById: Map<string, Question>): BreakdownRow[]
  ```
  `<BreakdownList :rows="rows" />` keeps the hooks the exam test uses: `.question-row`, `.question-row__summary` (button, `aria-expanded`, `aria-controls`), `.question-row__detail` (id matches), `.question-row__missing` with text "This question was removed from the bank.", `.chip` with `chip--pass|fail|muted` and labels `Correct | Incorrect | Unanswered | No pick`.

- [ ] **Step 1: Write the failing row-builder test**

Create `src/components/__tests__/breakdownRows.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Answer, Session } from '@/domain/entities'
import { examBreakdownRows, roundBreakdownRows } from '@/components/breakdownRows'

const byId = new Map(questionBank.map((q) => [q.id, q]))
const now = '2026-09-10T10:00:00.000Z'
function a(sessionId: string, questionId: string, selected: string[], correct: boolean): Answer {
  return { id: crypto.randomUUID(), sessionId, questionId, selected, correct, submittedAt: now, xp: correct ? 10 : 0 }
}

describe('examBreakdownRows', () => {
  it('follows the drawn order and marks unanswered and dangling ids', () => {
    const session: Session = {
      id: 'e', mode: 'exam', status: 'completed', startedAt: now, endedAt: now,
      exam: { deadline: now, questionIds: ['cc-001', 'arch-001', 'gov-001', 'zzz'], selections: {} },
    }
    const rows = examBreakdownRows(session, [a('e', 'cc-001', ['b'], true), a('e', 'arch-001', ['b'], false)], byId)
    expect(rows.map((r) => [r.number, r.status, r.question?.id])).toEqual([
      [1, 'correct', 'cc-001'], [2, 'incorrect', 'arch-001'], [3, 'unanswered', 'gov-001'], [4, 'unanswered', undefined],
    ])
  })
})

describe('roundBreakdownRows', () => {
  it('follows submission order and marks an empty Sprint pick as no-pick', () => {
    const rows = roundBreakdownRows([a('r', 'gov-001', ['a'], false), a('r', 'cc-001', [], false), a('r', 'cc-002', ['a', 'c', 'e'], true)], byId)
    expect(rows.map((r) => [r.number, r.status])).toEqual([[1, 'incorrect'], [2, 'no-pick'], [3, 'correct']])
    expect(rows[1]!.selected).toEqual([])
  })
})
```

Run: `npm run test:unit -- --run src/components/__tests__/breakdownRows.spec.ts`
Expected: FAIL — module missing.

- [ ] **Step 2: Implement `src/components/breakdownRows.ts`**

```ts
import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'

export type BreakdownStatus = 'correct' | 'incorrect' | 'unanswered' | 'no-pick'

export interface BreakdownRow {
  key: string
  number: number
  question: Question | undefined
  selected: string[]
  status: BreakdownStatus
}

/** One row per drawn Question, in exam order; no Answer means Unanswered (exam rule). */
export function examBreakdownRows(session: Session, answers: Answer[], questionById: Map<string, Question>): BreakdownRow[] {
  const exam = session.exam
  if (!exam) return []
  const answerByQuestion = new Map(answers.filter((a) => a.sessionId === session.id).map((a) => [a.questionId, a]))
  return exam.questionIds.map((questionId, index) => {
    const answer = answerByQuestion.get(questionId)
    return {
      key: questionId,
      number: index + 1,
      question: questionById.get(questionId),
      selected: answer?.selected ?? [],
      status: !answer ? 'unanswered' : answer.correct ? 'correct' : 'incorrect',
    }
  })
}

/** One row per Answer in submission order; an empty pick is a Sprint timeout (ADR-0004). */
export function roundBreakdownRows(answers: Answer[], questionById: Map<string, Question>): BreakdownRow[] {
  return answers.map((answer, index) => ({
    key: answer.id,
    number: index + 1,
    question: questionById.get(answer.questionId),
    selected: answer.selected,
    status: answer.correct ? 'correct' : answer.selected.length === 0 ? 'no-pick' : 'incorrect',
  }))
}
```

- [ ] **Step 3: Implement `src/components/BreakdownList.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import QuestionCard from '@/components/QuestionCard.vue'
import type { BreakdownRow, BreakdownStatus } from './breakdownRows'

defineProps<{ rows: BreakdownRow[] }>()

const expandedKey = ref<string | null>(null)

function toggle(key: string): void {
  expandedKey.value = expandedKey.value === key ? null : key
}

const LABEL: Record<BreakdownStatus, string> = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  unanswered: 'Unanswered',
  'no-pick': 'No pick',
}
const CHIP: Record<BreakdownStatus, string> = {
  correct: 'chip--pass',
  incorrect: 'chip--fail',
  unanswered: 'chip--muted',
  'no-pick': 'chip--muted',
}
const MARK: Record<BreakdownStatus, string> = { correct: '✓', incorrect: '✕', unanswered: '–', 'no-pick': '–' }
</script>

<template>
  <ul class="question-list">
    <li v-for="row in rows" :key="row.key" class="question-row">
      <p v-if="!row.question" class="question-row__missing">
        <span class="question-row__number mono">{{ String(row.number).padStart(2, '0') }}</span>
        This question was removed from the bank.
      </p>
      <template v-else>
        <button
          type="button"
          class="question-row__summary"
          :aria-expanded="expandedKey === row.key"
          :aria-controls="`question-detail-${row.key}`"
          @click="toggle(row.key)"
        >
          <span class="question-row__mark mono" :class="`question-row__mark--${row.status}`" aria-hidden="true">{{ MARK[row.status] }}</span>
          <span class="question-row__number mono">{{ String(row.number).padStart(2, '0') }}</span>
          <span class="question-row__stem">{{ row.question.stem }}</span>
          <span class="chip" :class="CHIP[row.status]">{{ LABEL[row.status] }}</span>
          <span class="question-row__chevron mono" aria-hidden="true">{{ expandedKey === row.key ? '−' : '+' }}</span>
        </button>
        <div v-if="expandedKey === row.key" :id="`question-detail-${row.key}`" class="question-row__detail">
          <QuestionCard
            :question="row.question"
            :model-value="row.selected"
            graded
            show-question-id
            :empty-verdict-label="row.status === 'no-pick' ? 'No pick' : 'Unanswered'"
          />
        </div>
      </template>
    </li>
  </ul>
</template>

<style scoped>
.question-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.question-row {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}
.question-row__summary {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 13px 16px;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.question-row__summary:hover {
  background: var(--surface-raised);
}
.question-row__mark {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: var(--track);
  color: var(--ink-muted);
  font-size: 12px;
  font-weight: 700;
}
.question-row__mark--correct {
  background: var(--pass);
  color: var(--pass-ink);
}
.question-row__mark--incorrect {
  background: var(--fail);
  color: var(--fail-ink);
}
.question-row__number {
  color: var(--ink-muted);
  font-size: 11px;
  font-weight: 700;
}
.question-row__stem {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13.5px;
  font-weight: 600;
}
.question-row__chevron {
  color: var(--ink-muted);
  font-size: 15px;
  font-weight: 700;
}
.question-row__detail {
  padding: 16px;
  border-top: 1px solid var(--line);
}
.question-row__missing {
  display: flex;
  gap: 14px;
  align-items: center;
  margin: 0;
  padding: 13px 16px;
  color: var(--ink-muted);
}
</style>
```

- [ ] **Step 4: Implement `src/components/results/ExamResults.vue`**

Move the exam layout out of `ResultsView.vue`. Props: `session: Session` (already known terminated, mode `exam`).

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BreakdownList from '@/components/BreakdownList.vue'
import { examBreakdownRows } from '@/components/breakdownRows'
import ScoreScale from '@/components/ScoreScale.vue'
import { DOMAINS, type DomainId } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import { PASS_LINE } from '@/domain/examBlueprint'
import { estimatedScore } from '@/domain/scoring'
import { totalXp } from '@/domain/xp'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{ session: Session }>()
const progress = useProgressStore()

const endedAtLabel = computed(() => (props.session.endedAt ? new Date(props.session.endedAt).toLocaleString() : ''))
const sessionAnswers = computed<Answer[]>(() => progress.answers.filter((a) => a.sessionId === props.session.id))
const correctCount = computed(() => sessionAnswers.value.filter((a) => a.correct).length)
const score = computed(() => estimatedScore(correctCount.value))
const passed = computed(() => score.value >= PASS_LINE)
const xpEarned = computed(() => totalXp(sessionAnswers.value))
const hasIncorrect = computed(() => sessionAnswers.value.some((a) => !a.correct))

interface DomainBreakdownRow { domain: DomainId; label: string; correct: number; drawn: number; percent: number }

const domainBreakdown = computed<DomainBreakdownRow[]>(() => {
  const exam = props.session.exam
  if (!exam) return []
  const answerByQuestion = new Map(sessionAnswers.value.map((a) => [a.questionId, a]))
  const drawn = new Map<DomainId, number>()
  const correct = new Map<DomainId, number>()
  for (const questionId of exam.questionIds) {
    const question = progress.questionById.get(questionId)
    if (!question) continue // dangling id: excluded from the denominator
    drawn.set(question.domain, (drawn.get(question.domain) ?? 0) + 1)
    if (answerByQuestion.get(questionId)?.correct) correct.set(question.domain, (correct.get(question.domain) ?? 0) + 1)
  }
  return (Object.keys(DOMAINS) as DomainId[]).map((domain) => {
    const d = drawn.get(domain) ?? 0
    const c = correct.get(domain) ?? 0
    return { domain, label: DOMAINS[domain].label, correct: c, drawn: d, percent: d === 0 ? 0 : (c / d) * 100 }
  })
})

const rows = computed(() => examBreakdownRows(props.session, progress.answers, progress.questionById))
</script>

<template>
  <div class="fade-up">
    <header class="results-header">
      <div class="results-header__title">
        <h1>Exam results</h1>
        <span v-if="session.status === 'expired'" class="chip chip--warn">Not finished</span>
      </div>
      <p class="results-header__date mono">{{ endedAtLabel }}</p>
    </header>

    <section class="card score-section">
      <ScoreScale :score="score" :threshold="PASS_LINE" />
      <p class="score-section__verdict" :class="passed ? 'score-section__verdict--pass' : 'score-section__verdict--fail'">
        {{ passed ? 'Estimated pass' : 'Below the pass line' }}
      </p>
      <p class="score-section__caption">Estimated score — Microsoft uses an unpublished scaled model.</p>
      <p class="score-section__caption">Unanswered questions count as incorrect.</p>
    </section>

    <div class="tiles">
      <div class="tile">
        <div class="tile__label eyebrow">Correct</div>
        <div class="tile__value">{{ correctCount }}/{{ session.exam?.questionIds.length ?? 0 }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">XP earned</div>
        <div class="tile__value tile__value--gold">+{{ xpEarned }}</div>
      </div>
    </div>

    <section class="card domain-section">
      <h2 class="eyebrow section-title">Domain breakdown</h2>
      <div v-for="row in domainBreakdown" :key="row.domain" class="domain-row">
        <div class="domain-row__label">
          <span>{{ row.label }}</span>
          <span class="mono">{{ row.correct }} / {{ row.drawn }} correct</span>
        </div>
        <div class="domain-row__bar">
          <div class="domain-row__fill" :style="{ width: `${row.percent}%` }"></div>
        </div>
      </div>
    </section>

    <h2 class="eyebrow section-title">Questions</h2>
    <BreakdownList :rows="rows" />

    <div class="results-actions">
      <RouterLink class="btn btn-primary" to="/exam">Take another exam</RouterLink>
      <RouterLink v-if="hasIncorrect" class="btn btn-outline btn-outline--gold" to="/review">Start review</RouterLink>
      <RouterLink class="btn btn-ghost" to="/">Dashboard</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.results-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.results-header__title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.results-header__date {
  color: var(--ink-muted);
  font-size: 12px;
}
.score-section {
  padding: 24px;
}
.score-section__verdict {
  margin: 16px 0 4px;
  font-weight: 800;
}
.score-section__verdict--pass {
  color: var(--pass);
}
.score-section__verdict--fail {
  color: var(--fail);
}
.score-section__caption {
  margin: 0;
  color: var(--ink-muted);
  font-size: 12px;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-top: 30px;
}
.tile__value--gold {
  color: var(--gold);
}
.section-title {
  margin: 40px 0 14px;
}
.domain-section {
  padding: 24px;
  margin-top: 30px;
}
.domain-section .section-title {
  margin: 0 0 20px;
}
.domain-row + .domain-row {
  margin-top: 16px;
}
.domain-row__label {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 700;
}
.domain-row__label .mono {
  color: var(--ink-muted);
  font-size: 11px;
  font-weight: 600;
}
.domain-row__bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--track);
}
.domain-row__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width var(--dur);
}
.results-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}
.btn-outline--gold {
  --btn-color: var(--gold);
}
</style>
```

- [ ] **Step 5: Implement `src/components/results/RoundResults.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BreakdownList from '@/components/BreakdownList.vue'
import { roundBreakdownRows } from '@/components/breakdownRows'
import type { Session } from '@/domain/entities'
import { summarizeRound } from '@/domain/roundSummary'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{ session: Session }>()
const progress = useProgressStore()

const summary = computed(() => summarizeRound(props.session, progress.answers))
const rows = computed(() => roundBreakdownRows(summary.value.answers, progress.questionById))
const hasMissed = computed(() => summary.value.correctCount < summary.value.total)
const newRoundPath = computed(() => `/${props.session.mode}`)
</script>

<template>
  <div class="fade-up">
    <div v-if="summary.leveledUp" class="level-up" role="status">
      <span class="level-up__text">Level {{ summary.levelAfter }} reached!</span>
    </div>

    <div class="headline">
      <span class="headline__percent mono">{{ summary.accuracyPercent }}<span class="headline__sign">%</span></span>
      <h1 class="headline__title">{{ summary.headline }}</h1>
    </div>

    <div class="tiles">
      <div class="tile">
        <div class="tile__label eyebrow">Correct</div>
        <div class="tile__value">{{ summary.correctCount }}/{{ summary.total }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">XP earned</div>
        <div class="tile__value tile__value--gold">+{{ summary.xpGained }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">Best streak</div>
        <div class="tile__value tile__value--accent">×{{ summary.bestStreak }}</div>
      </div>
    </div>

    <h2 class="eyebrow section-title">Breakdown</h2>
    <BreakdownList :rows="rows" />

    <div class="results-actions">
      <RouterLink class="btn btn-primary" :to="newRoundPath">New round</RouterLink>
      <RouterLink v-if="hasMissed" class="btn btn-outline btn-outline--gold" to="/review">Start review</RouterLink>
      <RouterLink class="btn btn-ghost" to="/">Dashboard</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.level-up {
  padding: 18px 24px;
  margin-bottom: 28px;
  border: 1px solid var(--gold);
  border-radius: var(--radius-large);
  background: linear-gradient(135deg, rgb(255 197 61 / 0.16), rgb(139 92 246 / 0.16));
  animation: pop var(--dur) ease-out;
}
.level-up__text {
  color: var(--gold);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
}
.headline {
  display: flex;
  align-items: baseline;
  gap: 20px;
  flex-wrap: wrap;
}
.headline__percent {
  font-size: clamp(64px, 11vw, 110px);
  font-weight: 700;
  line-height: 0.95;
}
.headline__sign {
  color: var(--accent);
}
.headline__title {
  margin: 0;
  font-size: clamp(24px, 3.6vw, 34px);
  font-weight: 900;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-top: 30px;
}
.tile__value--gold {
  color: var(--gold);
}
.tile__value--accent {
  color: var(--accent);
}
.section-title {
  margin: 40px 0 14px;
}
.results-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}
.btn-outline--gold {
  --btn-color: var(--gold);
}
</style>
```

- [ ] **Step 6: Rewrite `src/views/ResultsView.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ExamResults from '@/components/results/ExamResults.vue'
import RoundResults from '@/components/results/RoundResults.vue'
import type { Session } from '@/domain/entities'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{ sessionId: string }>()
const progress = useProgressStore()

/** Any terminated Session has a results page; in-progress ones don't exist yet. */
const validSession = computed<Session | null>(() => {
  const found = progress.sessions.find((s) => s.id === props.sessionId)
  return !found || found.status === 'in-progress' ? null : found
})
</script>

<template>
  <main class="page" :class="{ 'page--narrow': validSession?.mode !== 'exam' }">
    <div v-if="!validSession" class="card not-found">
      <h1>This results page doesn't exist.</h1>
      <RouterLink class="btn btn-primary" to="/">Back to dashboard</RouterLink>
    </div>
    <ExamResults v-else-if="validSession.mode === 'exam'" :session="validSession" />
    <RoundResults v-else :session="validSession" />
  </main>
</template>

<style scoped>
.not-found {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
</style>
```

- [ ] **Step 7: Update and extend `src/views/__tests__/ResultsView.spec.ts`**

Change both occurrences of `'Review missed questions'` to `'Start review'`.

Append inside `describe('ResultsView')`:

```ts
  it('renders a Round results page from the Session and its Answers, with a No pick tag for a Sprint timeout', async () => {
    const pinia = await setupProgress()
    const progress = useProgressStore()
    const now = '2026-09-10T10:00:00.000Z'
    const before: Session = { id: 'old', mode: 'practice', status: 'completed', startedAt: now, endedAt: now, exam: null }
    const sprint: Session = { id: 'sp', mode: 'sprint', status: 'completed', startedAt: now, endedAt: now, exam: null }
    await progress.saveSession(before)
    await progress.saveSession(sprint)
    const mk = (sessionId: string, questionId: string, selected: string[], correct: boolean, xp: number): Answer =>
      ({ id: crypto.randomUUID(), sessionId, questionId, selected, correct, submittedAt: now, xp })
    await progress.recordAnswers([
      ...Array.from({ length: 14 }, () => mk('old', 'cc-001', ['b'], true, 10)), // 140 XP before
      mk('sp', 'cc-001', ['b'], true, 15),
      mk('sp', 'arch-001', [], false, 0),
      mk('sp', 'gov-001', ['a'], false, 0),
    ])

    const { wrapper } = await mountRoute(pinia, '/results/sp')
    expect(wrapper.text()).toContain('33%')
    expect(wrapper.text()).toContain('Keep at it')
    expect(wrapper.text()).toContain('1/3')
    expect(wrapper.text()).toContain('+15')
    expect(wrapper.text()).toContain('×1')
    expect(wrapper.find('[role="status"]').text()).toBe('Level 2 reached!')

    const chips = wrapper.findAll('.question-row .chip').map((c) => c.text())
    expect(chips).toEqual(['Correct', 'No pick', 'Incorrect'])

    const noPickRow = wrapper.findAll('.question-row')[1]!
    await noPickRow.find('.question-row__summary').trigger('click')
    expect(noPickRow.find('.question-card__verdict').text()).toBe('No pick')

    const links = wrapper.findAll('a').map((a) => [a.text(), a.attributes('href')])
    expect(links).toContainEqual(['New round', '/sprint'])
    expect(links).toContainEqual(['Start review', '/review'])
    expect(links).toContainEqual(['Dashboard', '/'])
  })

  it('shows no level-up banner and no review link after a perfect Round', async () => {
    const pinia = await setupProgress()
    const progress = useProgressStore()
    const now = '2026-09-10T10:00:00.000Z'
    await progress.saveSession({ id: 'p', mode: 'practice', status: 'completed', startedAt: now, endedAt: now, exam: null })
    await progress.recordAnswers([
      { id: crypto.randomUUID(), sessionId: 'p', questionId: 'cc-001', selected: ['b'], correct: true, submittedAt: now, xp: 10 },
    ])
    const { wrapper } = await mountRoute(pinia, '/results/p')
    expect(wrapper.text()).toContain('100%')
    expect(wrapper.text()).toContain('Perfect round!')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.findAll('a').map((a) => a.text())).not.toContain('Start review')
  })
```

- [ ] **Step 8: Run results tests and the suite**

Run: `npm run test:unit -- --run src/views/__tests__/ResultsView.spec.ts src/components/__tests__/breakdownRows.spec.ts && npm run test:unit -- --run && npm run type-check`
Expected: PASS. The exam test's `wrapper.find('[role="img"]')` still hits `ScoreScale` first because it renders before any other `role="img"`.

- [ ] **Step 9: Commit**

```bash
git add src/components/breakdownRows.ts src/components/BreakdownList.vue src/components/results src/views/ResultsView.vue src/components/__tests__/breakdownRows.spec.ts src/views/__tests__/ResultsView.spec.ts
git commit -m "feat(ui): results page with Round and exam layouts and collapsible breakdown

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: The dashboard — tiles, mode cards, exam strip, panels, data row

**Files:**
- Create: `src/components/dashboard/ModeCards.vue`, `src/components/dashboard/ExamStrip.vue`, `src/components/dashboard/DomainAccuracy.vue`, `src/components/dashboard/WeakAreas.vue`, `src/components/dashboard/DataControls.vue`
- Rewrite: `src/views/DashboardView.vue`
- Rewrite: `src/views/__tests__/DashboardView.spec.ts`

**Interfaces:**
- Consumes: `progress.level/totalXp/bestStreak/deck/domains/topics/weakAreas/history/inProgressExam/preferences/updatePreferences` (Task 5), `DOMAINS[id].shortLabel` (Task 2), `exam.remainingMs` (existing), `ScoreScale`-free strip.
- Produces (props/emits):
  - `ModeCards`: props `domain: DomainChoice`, `feedbackTiming: FeedbackTiming`, `reviewCount: number`; emits `update:domain [DomainChoice]`, `update:feedbackTiming [FeedbackTiming]`. Links `Start round → /practice`, `Start sprint → /sprint`, `Start review → /review` (a disabled `<button>` when `reviewCount === 0`). Chips are `<button aria-pressed>` labelled `All` + each Domain's `shortLabel`; toggle buttons `Instant` / `End of round`.
  - `ExamStrip`: props `lastScore: number | null`. Text `Exam simulation`, `40 questions · 45 minutes`, and when present `Last estimated score <n>` with `.exam-strip__score--pass|--fail`; link `Start exam → /exam`.
  - `DomainAccuracy`: props `rows: { domain: DomainId; label: string; percent: number | null; answered: number }[]`. Meta text `"<pct>% · <n>"` or `no data`.
  - `WeakAreas`: props `rows: { topic: TopicId; label: string; percent: number }[]`, `emptyMessage: string`; emits `drill [TopicId]`. Each row is a `<button class="weak-row">`.
  - `DataControls`: no props; the export / import / reset behavior and copy move here unchanged from the old dashboard (`Export progress`, `Import progress`, `Reset all progress`, `Confirm reset — this deletes all sessions and answers`, `That file isn't a valid progress export.`).

- [ ] **Step 1: Rewrite the dashboard test**

Replace `src/views/__tests__/DashboardView.spec.ts` with:

```ts
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Answer, Session } from '@/domain/entities'
import { estimatedScore } from '@/domain/scoring'
import { repository } from '@/repository'
import { routes } from '@/router'
import { useExamStore } from '@/stores/examSession'
import { useProgressStore } from '@/stores/progress'

const realSetTimeout = globalThis.setTimeout
const RESET_LABEL = 'Reset all progress'
const CONFIRM_LABEL = 'Confirm reset — this deletes all sessions and answers'

const RouterHost = defineComponent({ name: 'RouterHost', setup: () => () => h(RouterView) })

async function setupProgress(): Promise<Pinia> {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useProgressStore().init()
  return pinia
}
interface Harness { wrapper: VueWrapper; router: Router }
async function mountDashboard(pinia: Pinia): Promise<Harness> {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
  await nextTick()
  return { wrapper, router }
}
async function settle(): Promise<void> {
  await new Promise((resolve) => realSetTimeout(resolve, 0))
  await nextTick()
}
function findButton(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const button = wrapper.findAll('button').find((b) => b.text() === label)
  if (!button) throw new Error(`No button labelled "${label}"`)
  return button
}
function findLink(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const link = wrapper.findAll('a').find((a) => a.text() === label)
  if (!link) throw new Error(`No link labelled "${label}"`)
  return link
}
function tileValues(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.stats .tile__value').map((t) => t.text())
}

const ISO_OLDER = '2026-08-20T10:00:00.000Z'
const ISO_NEWER = '2026-08-21T10:00:00.000Z'

async function seedTwoExams(): Promise<{ expiredId: string; completedId: string }> {
  const progress = useProgressStore()
  const expiredId = crypto.randomUUID()
  const completedId = crypto.randomUUID()
  await progress.saveSession({ id: expiredId, mode: 'exam', status: 'expired', startedAt: ISO_OLDER, endedAt: ISO_OLDER, exam: { deadline: ISO_OLDER, questionIds: ['cc-001'], selections: {} } })
  await progress.saveSession({ id: completedId, mode: 'exam', status: 'completed', startedAt: ISO_NEWER, endedAt: ISO_NEWER, exam: { deadline: ISO_NEWER, questionIds: ['cc-001'], selections: { 'cc-001': ['b'] } } })
  await progress.recordAnswers([{ id: crypto.randomUUID(), sessionId: completedId, questionId: 'cc-001', selected: ['b'], correct: true, submittedAt: ISO_NEWER, xp: 10 }])
  return { expiredId, completedId }
}

/** Four wrong Answers on four monitoring-tools Questions: enough to flag the Topic weak. */
async function seedWeakMonitoring(): Promise<void> {
  const progress = useProgressStore()
  const session: Session = { id: 'weak', mode: 'practice', status: 'completed', startedAt: ISO_OLDER, endedAt: ISO_OLDER, exam: null }
  await progress.saveSession(session)
  const qs = questionBank.filter((q) => q.topic === 'monitoring-tools').slice(0, 4)
  const answers: Answer[] = qs.map((q) => ({
    id: crypto.randomUUID(), sessionId: 'weak', questionId: q.id,
    selected: [q.options.find((o) => !q.correct.includes(o.id))!.id], correct: false, submittedAt: ISO_OLDER, xp: 0,
  }))
  await progress.recordAnswers(answers)
}

describe('DashboardView', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('greets a new learner with zeroed tiles, the three cards, the exam strip and empty panels', async () => {
    const pinia = await setupProgress()
    const { wrapper } = await mountDashboard(pinia)
    const text = wrapper.text()

    expect(text).toContain('Level up your Azure fundamentals')
    expect(tileValues(wrapper)).toEqual(['1', '0', '×0', '0'])
    expect(text).toContain('150 XP to lvl 2')

    expect(findLink(wrapper, 'Start round').attributes('href')).toBe('/practice')
    expect(findLink(wrapper, 'Start sprint').attributes('href')).toBe('/sprint')
    expect(findButton(wrapper, 'Start review').attributes('disabled')).toBeDefined()
    expect(findButton(wrapper, 'All').attributes('aria-pressed')).toBe('true')
    expect(findButton(wrapper, 'Instant').attributes('aria-pressed')).toBe('true')

    expect(findLink(wrapper, 'Start exam').attributes('href')).toBe('/exam')
    expect(text).toContain('Exam simulation')
    expect(text).not.toContain('Last estimated score')
    expect(wrapper.find('.sparkline__svg').exists()).toBe(false)

    expect(wrapper.findAll('.domain-accuracy__row')).toHaveLength(3)
    expect(text).toContain('no data')
    expect(text).toContain('Not enough data yet — keep practicing.')
    expect(text).not.toContain('missed')
  })

  it('shows the last Estimated score on the exam strip once an exam exists', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)
    const strip = wrapper.find('.exam-strip')
    expect(strip.text()).toContain(`Last estimated score ${estimatedScore(1)}`)
    expect(strip.find('.exam-strip__score--fail').exists()).toBe(true)
    expect(tileValues(wrapper)[1]).toBe('10') // total XP from the one correct exam Answer
  })

  it('offers to resume an exam that is still in progress', async () => {
    const pinia = await setupProgress()
    await useExamStore().startExam()
    const { wrapper } = await mountDashboard(pinia)
    const banner = wrapper.find('.resume')
    expect(banner.exists()).toBe(true)
    expect(banner.find('.resume__line').text()).toMatch(/^Exam in progress — \d\d:\d\d left$/)
    expect(findLink(wrapper, 'Resume exam').attributes('href')).toBe('/exam')
  })

  it('remembers the Domain chip and the Feedback timing as preferences', async () => {
    const pinia = await setupProgress()
    const { wrapper } = await mountDashboard(pinia)

    await findButton(wrapper, 'Cloud concepts').trigger('click')
    await settle()
    expect(findButton(wrapper, 'Cloud concepts').attributes('aria-pressed')).toBe('true')
    expect(findButton(wrapper, 'All').attributes('aria-pressed')).toBe('false')
    expect((await repository.getPreferences()).domain).toBe('cloud-concepts')

    await findButton(wrapper, 'End of round').trigger('click')
    await settle()
    expect(findButton(wrapper, 'End of round').attributes('aria-pressed')).toBe('true')
    expect((await repository.getPreferences()).feedbackTiming).toBe('end-of-round')
  })

  it('lists weak areas as buttons that start a Topic Practice Round', async () => {
    const pinia = await setupProgress()
    await seedWeakMonitoring()
    const { wrapper, router } = await mountDashboard(pinia)

    const row = wrapper.find('.weak-row')
    expect(row.exists()).toBe(true)
    expect(row.text()).toContain('Describe monitoring tools in Azure')
    expect(row.text()).toContain('0%')
    expect(findLink(wrapper, 'Start review').attributes('href')).toBe('/review')
    expect(tileValues(wrapper)[3]).toBe('4')

    await row.trigger('click')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/practice?topic=monitoring-tools')
  })

  it('arms the reset before it deletes anything, then clears all progress', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)

    vi.useFakeTimers()
    await findButton(wrapper, RESET_LABEL).trigger('click')
    await settle()
    expect(await repository.getSessions()).toHaveLength(2)

    vi.advanceTimersByTime(1000)
    await findButton(wrapper, CONFIRM_LABEL).trigger('click')
    await settle()
    expect(await repository.getSessions()).toHaveLength(0)
    expect(await repository.getAnswers()).toHaveLength(0)
    expect(tileValues(wrapper)).toEqual(['1', '0', '×0', '0'])
    expect(wrapper.findAll('button').map((b) => b.text())).toContain(RESET_LABEL)
  })

  it('survives a double-click on reset, and disarms itself after the confirm window', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)

    vi.useFakeTimers()
    await findButton(wrapper, RESET_LABEL).trigger('click')
    await findButton(wrapper, CONFIRM_LABEL).trigger('click')
    await settle()
    expect(await repository.getSessions()).toHaveLength(2)
    expect(wrapper.findAll('button').map((b) => b.text())).toContain(CONFIRM_LABEL)

    vi.advanceTimersByTime(6000)
    await settle()
    expect(wrapper.findAll('button').map((b) => b.text())).toContain(RESET_LABEL)
    expect(await repository.getSessions()).toHaveLength(2)
  })

  it('reports an unreadable import in place, without touching stored progress', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)
    const input = wrapper.find<HTMLInputElement>('input[type="file"]')
    expect(input.attributes('accept')).toContain('.json')
    const file = new File(['this is not progress json'], 'nope.json', { type: 'application/json' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await settle()
    expect(wrapper.text()).toContain("That file isn't a valid progress export.")
    expect(await repository.getSessions()).toHaveLength(2)
  })
})
```

Run: `npm run test:unit -- --run src/views/__tests__/DashboardView.spec.ts`
Expected: FAIL on the new layout assertions.

- [ ] **Step 2: Create `src/components/dashboard/DataControls.vue`**

Move the data-controls script (constants `CONFIRM_WINDOW_MS`, `CONFIRM_GRACE_MS`, refs `fileInput`, `importFailed`, `confirmingReset`, functions `onExport`, `pickFile`, `onFileChosen`, `disarmReset`, `armReset`, `confirmReset`, and the `onBeforeUnmount(() => clearTimeout(confirmTimeoutId))`) verbatim from the old `DashboardView.vue` into this component, with `const progress = useProgressStore()`. Template:

```vue
<template>
  <section class="data">
    <p class="data__lede">Everything you answer stays in this browser.</p>
    <div class="data__actions">
      <button class="btn btn-ghost btn-small" type="button" @click="onExport">Export progress</button>
      <button class="btn btn-ghost btn-small" type="button" @click="pickFile">Import progress</button>
      <button v-if="!confirmingReset" class="btn btn-ghost btn-small data__reset" type="button" @click="armReset">
        Reset all progress
      </button>
      <button v-else class="btn btn-small data__reset--armed" type="button" @click="confirmReset">
        Confirm reset — this deletes all sessions and answers
      </button>
    </div>
    <input ref="fileInput" class="visually-hidden" type="file" accept=".json,application/json" @change="onFileChosen" />
    <p v-if="importFailed" class="data__error">That file isn't a valid progress export.</p>
  </section>
</template>

<style scoped>
.data {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.data__lede {
  margin: 0;
  color: var(--ink-muted);
  font-size: 12px;
}
.data__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.data__reset:hover {
  border-color: var(--fail);
  color: var(--fail);
}
.data__reset--armed {
  background: var(--fail);
  color: var(--fail-ink);
}
.data__error {
  flex-basis: 100%;
  margin: 0;
  color: var(--fail);
  font-size: 13px;
}
</style>
```

- [ ] **Step 3: Create `src/components/dashboard/ModeCards.vue`**

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { DOMAINS, type DomainId } from '@/data/types'
import { ROUND_SIZE, SHOT_CLOCK_MS } from '@/domain/roundBlueprint'
import type { DomainChoice, FeedbackTiming } from '@/domain/preferences'

defineProps<{
  domain: DomainChoice
  feedbackTiming: FeedbackTiming
  reviewCount: number
}>()

const emit = defineEmits<{
  'update:domain': [DomainChoice]
  'update:feedbackTiming': [FeedbackTiming]
}>()

const CHIPS: { id: DomainChoice; label: string }[] = [
  { id: 'all', label: 'All' },
  ...(Object.keys(DOMAINS) as DomainId[]).map((id) => ({ id, label: DOMAINS[id].shortLabel })),
]
const TIMINGS: { id: FeedbackTiming; label: string }[] = [
  { id: 'instant', label: 'Instant' },
  { id: 'end-of-round', label: 'End of round' },
]
const SHOT_CLOCK_SECONDS = SHOT_CLOCK_MS / 1000
</script>

<template>
  <div class="mode-cards">
    <section class="card mode-card mode-card--practice">
      <h2 class="mode-card__title"><span class="mode-card__dot" aria-hidden="true"></span>Practice round</h2>
      <p class="mode-card__lede">{{ ROUND_SIZE }} questions with Streak bonuses and an explanation for every option.</p>
      <div>
        <div class="eyebrow mode-card__label">Domains</div>
        <div class="chips">
          <button
            v-for="chip in CHIPS"
            :key="chip.id"
            type="button"
            class="chip-button"
            :aria-pressed="domain === chip.id"
            @click="emit('update:domain', chip.id)"
          >
            {{ chip.label }}
          </button>
        </div>
      </div>
      <div>
        <div class="eyebrow mode-card__label">Feedback</div>
        <div class="segmented">
          <button
            v-for="timing in TIMINGS"
            :key="timing.id"
            type="button"
            class="segmented__option"
            :aria-pressed="feedbackTiming === timing.id"
            @click="emit('update:feedbackTiming', timing.id)"
          >
            {{ timing.label }}
          </button>
        </div>
      </div>
      <RouterLink class="btn btn-primary mode-card__cta" to="/practice">Start round</RouterLink>
    </section>

    <section class="card mode-card mode-card--sprint">
      <h2 class="mode-card__title"><span class="mode-card__dot" aria-hidden="true"></span>Sprint</h2>
      <p class="mode-card__lede">Beat the Shot clock. Correct answers earn a speed bonus. No pausing.</p>
      <p class="mode-card__big"><span class="mono mode-card__number">{{ SHOT_CLOCK_SECONDS }}s</span><span class="eyebrow">per question</span></p>
      <RouterLink class="btn btn-outline mode-card__cta" to="/sprint">Start sprint</RouterLink>
    </section>

    <section class="card mode-card mode-card--review">
      <h2 class="mode-card__title"><span class="mode-card__dot" aria-hidden="true"></span>Review</h2>
      <p class="mode-card__lede">
        {{ reviewCount > 0 ? 'Questions in your review deck. One correct answer clears each.' : 'Your review deck is empty. A wrong answer lands here.' }}
      </p>
      <p class="mode-card__big"><span class="mono mode-card__number">{{ reviewCount }}</span></p>
      <RouterLink v-if="reviewCount > 0" class="btn btn-outline mode-card__cta" to="/review">Start review</RouterLink>
      <button v-else class="btn btn-outline mode-card__cta" type="button" disabled>Start review</button>
    </section>
  </div>
</template>

<style scoped>
.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 32px;
}
.mode-card {
  --card-color: var(--accent);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  transition: border-color var(--dur-fast);
}
.mode-card:hover {
  border-color: var(--card-color);
}
.mode-card--sprint {
  --card-color: var(--cyan);
}
.mode-card--review {
  --card-color: var(--gold);
}
.mode-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 19px;
}
.mode-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--card-color);
}
.mode-card__lede {
  margin: 0;
  color: var(--ink-muted);
  font-size: 14px;
}
.mode-card__label {
  margin-bottom: 8px;
}
.mode-card__big {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0;
}
.mode-card__number {
  color: var(--card-color);
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
}
.mode-card__cta {
  width: 100%;
  margin-top: auto;
  --btn-color: var(--card-color);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip-button {
  padding: 7px 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-muted);
  font: 700 12px/1 var(--font-body);
  cursor: pointer;
  transition: all var(--dur-fast);
}
.chip-button[aria-pressed='true'] {
  border-color: var(--accent);
  background: rgb(139 92 246 / 0.2);
  color: var(--accent-text);
}
.segmented {
  display: flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: var(--radius-small);
  background: var(--bg);
}
.segmented__option {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-muted);
  font: 700 12px/1 var(--font-body);
  cursor: pointer;
  transition: all var(--dur-fast);
}
.segmented__option[aria-pressed='true'] {
  background: var(--accent);
  color: #fff;
}
</style>
```

- [ ] **Step 4: Create `ExamStrip.vue`, `DomainAccuracy.vue`, `WeakAreas.vue`**

`src/components/dashboard/ExamStrip.vue`:

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { EXAM_DURATION_MS, EXAM_QUESTION_COUNT, PASS_LINE } from '@/domain/examBlueprint'

defineProps<{ lastScore: number | null }>()
const MINUTES = EXAM_DURATION_MS / 60_000
</script>

<template>
  <section class="card exam-strip">
    <div class="exam-strip__text">
      <span class="exam-strip__title">Exam simulation</span>
      <span class="exam-strip__meta mono">{{ EXAM_QUESTION_COUNT }} questions · {{ MINUTES }} minutes</span>
      <span v-if="lastScore !== null" class="exam-strip__last">
        Last estimated score
        <span class="mono exam-strip__score" :class="lastScore >= PASS_LINE ? 'exam-strip__score--pass' : 'exam-strip__score--fail'">{{ lastScore }}</span>
        <span class="exam-strip__meta mono">· pass line {{ PASS_LINE }}</span>
      </span>
    </div>
    <RouterLink class="btn btn-ghost btn-small" to="/exam">Start exam</RouterLink>
  </section>
</template>

<style scoped>
.exam-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding: 14px 20px;
}
.exam-strip__text {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
.exam-strip__title {
  font-weight: 800;
}
.exam-strip__meta {
  color: var(--ink-muted);
  font-size: 11px;
  font-weight: 600;
}
.exam-strip__last {
  color: var(--ink-muted);
  font-size: 13px;
}
.exam-strip__score {
  font-weight: 700;
}
.exam-strip__score--pass {
  color: var(--pass);
}
.exam-strip__score--fail {
  color: var(--fail);
}
</style>
```

`src/components/dashboard/DomainAccuracy.vue`:

```vue
<script setup lang="ts">
import type { DomainId } from '@/data/types'

defineProps<{ rows: { domain: DomainId; label: string; percent: number | null; answered: number }[] }>()
</script>

<template>
  <section class="card panel">
    <h3 class="eyebrow panel__title">Accuracy by domain</h3>
    <div class="domain-accuracy">
      <div v-for="row in rows" :key="row.domain" class="domain-accuracy__row">
        <div class="domain-accuracy__head">
          <span class="domain-accuracy__label">{{ row.label }}</span>
          <span class="domain-accuracy__meta mono">{{ row.percent === null ? 'no data' : `${row.percent}% · ${row.answered}` }}</span>
        </div>
        <div class="domain-accuracy__track">
          <div class="domain-accuracy__fill" :style="{ width: `${row.percent ?? 0}%` }"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  padding: 24px;
}
.panel__title {
  margin: 0 0 20px;
  font-size: 11px;
}
.domain-accuracy {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.domain-accuracy__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}
.domain-accuracy__label {
  font-size: 13px;
  font-weight: 700;
}
.domain-accuracy__meta {
  color: var(--ink-muted);
  font-size: 11px;
  font-weight: 600;
}
.domain-accuracy__track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--track);
}
.domain-accuracy__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width var(--dur);
}
</style>
```

`src/components/dashboard/WeakAreas.vue`:

```vue
<script setup lang="ts">
import type { TopicId } from '@/data/types'

defineProps<{
  rows: { topic: TopicId; label: string; percent: number }[]
  emptyMessage: string
}>()
const emit = defineEmits<{ drill: [TopicId] }>()
</script>

<template>
  <section class="card panel">
    <h3 class="eyebrow panel__title">Weak areas</h3>
    <div v-if="rows.length > 0" class="weak-list">
      <button v-for="row in rows" :key="row.topic" type="button" class="weak-row" @click="emit('drill', row.topic)">
        <span class="weak-row__label">{{ row.label }}</span>
        <span class="weak-row__percent mono">{{ row.percent }}%</span>
        <span class="weak-row__hint eyebrow">Drill →</span>
      </button>
    </div>
    <p v-else class="panel__empty">{{ emptyMessage }}</p>
  </section>
</template>

<style scoped>
.panel {
  padding: 24px;
}
.panel__title {
  margin: 0 0 20px;
  font-size: 11px;
}
.panel__empty {
  margin: 0;
  color: var(--ink-muted);
  font-size: 14px;
}
.weak-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.weak-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 11px 14px;
  border: 1px solid #4a2e38;
  border-radius: 10px;
  background: #221a26;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--dur-fast);
}
.weak-row:hover {
  border-color: var(--fail);
}
.weak-row__label {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
}
.weak-row__percent {
  color: var(--fail);
  font-size: 12px;
  font-weight: 700;
}
.weak-row__hint {
  color: var(--ink-muted);
}
</style>
```

- [ ] **Step 5: Rewrite `src/views/DashboardView.vue`**

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import DataControls from '@/components/dashboard/DataControls.vue'
import DomainAccuracy from '@/components/dashboard/DomainAccuracy.vue'
import ExamStrip from '@/components/dashboard/ExamStrip.vue'
import ModeCards from '@/components/dashboard/ModeCards.vue'
import WeakAreas from '@/components/dashboard/WeakAreas.vue'
import { DOMAINS, TOPICS, type DomainId, type TopicId } from '@/data/types'
import { useExamStore } from '@/stores/examSession'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
const exam = useExamStore()
const router = useRouter()

// --- resume banner: wall-clock derived every second, like ExamTimer ------------
const nowMs = ref(Date.now())
let tickId: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  tickId = setInterval(() => {
    if (progress.inProgressExam) nowMs.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => clearInterval(tickId))

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
const remainingLabel = computed(() => {
  const totalSeconds = Math.ceil(exam.remainingMs(nowMs.value) / 1000)
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
})

// --- tiles ---------------------------------------------------------------------
const xpToNext = computed(() => progress.level.need - progress.level.into)

// --- exam strip ----------------------------------------------------------------
const lastScore = computed(() => progress.history[0]?.score ?? null)

// --- panels --------------------------------------------------------------------
const domainRows = computed(() =>
  (Object.keys(DOMAINS) as DomainId[]).map((domain) => {
    const stats = progress.domains.find((d) => d.domain === domain)
    return {
      domain,
      label: DOMAINS[domain].shortLabel,
      percent: stats && stats.accuracy !== null ? Math.round(stats.accuracy * 100) : null,
      answered: stats?.answered ?? 0,
    }
  }),
)
const weakRows = computed(() =>
  progress.weakAreas.map((stats) => ({
    topic: stats.topic,
    label: TOPICS[stats.topic].label,
    percent: Math.round((stats.accuracy ?? 0) * 100),
  })),
)
const weakEmptyMessage = computed(() =>
  progress.topics.some((t) => t.verdict === 'not-enough-data')
    ? 'Not enough data yet — keep practicing.'
    : 'No weak areas. Nice.',
)

function drill(topic: TopicId): void {
  void router.push({ path: '/practice', query: { topic } })
}
</script>

<template>
  <main class="page dashboard fade-up">
    <section v-if="progress.inProgressExam" class="card resume">
      <p class="resume__line">Exam in progress — <span class="mono">{{ remainingLabel }}</span> left</p>
      <RouterLink class="btn btn-primary" to="/exam">Resume exam</RouterLink>
    </section>

    <h1 class="hero">Level up your Azure fundamentals.</h1>
    <p class="hero__lede">
      {{ progress.questions.length }} original questions across all three AZ-900 domains. Ten at a time, one per
      screen — Streaks multiply your XP.
    </p>

    <div class="stats">
      <div class="tile">
        <div class="tile__label eyebrow">Level</div>
        <div class="tile__value tile__value--gold">{{ progress.level.level }}</div>
        <div class="tile__sub">{{ xpToNext }} XP to lvl {{ progress.level.level + 1 }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">Total XP</div>
        <div class="tile__value">{{ progress.totalXp }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">Best streak</div>
        <div class="tile__value tile__value--accent">×{{ progress.bestStreak }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">To review</div>
        <div class="tile__value">{{ progress.deck.length }}</div>
      </div>
    </div>

    <ModeCards
      :domain="progress.preferences.domain"
      :feedback-timing="progress.preferences.feedbackTiming"
      :review-count="progress.deck.length"
      @update:domain="progress.updatePreferences({ domain: $event })"
      @update:feedback-timing="progress.updatePreferences({ feedbackTiming: $event })"
    />

    <ExamStrip :last-score="lastScore" />

    <div class="panels">
      <DomainAccuracy :rows="domainRows" />
      <WeakAreas :rows="weakRows" :empty-message="weakEmptyMessage" @drill="drill" />
    </div>

    <DataControls />
  </main>
</template>

<style scoped>
.resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
  padding: 16px 20px;
  border-color: var(--gold);
}
.resume__line {
  margin: 0;
  font-weight: 700;
}
.hero {
  margin: 0 0 10px;
  font-size: clamp(30px, 4.5vw, 44px);
  font-weight: 900;
}
.hero__lede {
  max-width: 58ch;
  margin: 0 0 36px;
  color: var(--ink-muted);
  font-size: 17px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}
.tile__value--gold {
  color: var(--gold);
}
.tile__value--accent {
  color: var(--accent);
}
.panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 18px;
  margin-top: 32px;
}
</style>
```

- [ ] **Step 6: Run the dashboard tests, then everything**

Run: `npm run test:unit -- --run src/views/__tests__/DashboardView.spec.ts && npm run test:unit -- --run && npm run type-check`
Expected: PASS. If `tileValues` returns five entries, the exam-strip has no `.tile` — check `.stats` scoping in the test selector.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard src/views/DashboardView.vue src/views/__tests__/DashboardView.spec.ts
git commit -m "feat(ui): game-like dashboard — tiles, mode cards, exam strip, tappable weak areas

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: Exam setup screen gains the score history; exam room restyled

**Files:**
- Modify: `src/views/ExamView.vue`
- Test: `src/views/__tests__/ExamView.spec.ts`

**Interfaces:**
- Consumes: `HistorySparkline` (existing), `progress.history` (existing `ExamHistoryEntry[]`, newest first).
- Behavior preserved for the existing tests: copy `Exam simulation`, `40 questions · 45 minutes · pass line 700`, `The clock never pauses. Leaving the exam keeps it running.`, buttons `Start exam`, `Finish exam` / `Confirm finish`, `Abandon` / `Confirm abandon`, text `Question 1 of 40`, timer `45:00`.

- [ ] **Step 1: Add a failing test**

Append to `describe('ExamView')` in `src/views/__tests__/ExamView.spec.ts`:

```ts
  it('lists the score history on the setup screen, newest first, against the 700 line', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const progress = useProgressStore()
    await progress.init()
    const older = '2026-08-20T10:00:00.000Z'
    const newer = '2026-08-21T10:00:00.000Z'
    await progress.saveSession({ id: 'old', mode: 'exam', status: 'expired', startedAt: older, endedAt: older, exam: { deadline: older, questionIds: ['cc-001'], selections: {} } })
    await progress.saveSession({ id: 'new', mode: 'exam', status: 'completed', startedAt: newer, endedAt: newer, exam: { deadline: newer, questionIds: ['cc-001'], selections: { 'cc-001': ['b'] } } })
    await progress.recordAnswers([{ id: crypto.randomUUID(), sessionId: 'new', questionId: 'cc-001', selected: ['b'], correct: true, submittedAt: newer, xp: 10 }])

    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/exam')
    await router.isReady()
    const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
    await nextTick()

    expect(wrapper.find('.sparkline__svg').attributes('aria-label')).toContain('2 exams')
    const rows = wrapper.findAll('.history__row')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.attributes('href')).toBe('/results/new')
    expect(rows[1]!.find('.chip--warn').text()).toBe('Not finished')
    expect(wrapper.text()).toContain('Estimated score — Microsoft uses an unpublished scaled model.')
  })
```

Run: `npm run test:unit -- --run src/views/__tests__/ExamView.spec.ts`
Expected: the new test FAILS (no sparkline on the setup screen).

- [ ] **Step 2: Extend the setup card in `src/views/ExamView.vue`**

Add imports:

```ts
import HistorySparkline from '@/components/HistorySparkline.vue'
import { PASS_LINE } from '@/domain/examBlueprint' // already imported — keep the single import line
import { useProgressStore } from '@/stores/progress'
```

Add to the script:

```ts
const progress = useProgressStore()
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}
/** `history` is newest first; the sparkline reads oldest → newest. */
const sparklinePoints = computed(() =>
  [...progress.history].reverse().map((entry) => ({ score: entry.score, label: formatDate(entry.endedAt) })),
)
```

Replace the setup `<main>` with:

```vue
  <main v-else-if="!activeExam" class="page page--narrow fade-up">
    <div class="card setup">
      <h1 class="setup__heading">Exam simulation</h1>
      <p class="setup__summary mono">{{ EXAM_SUMMARY }}</p>
      <p class="setup__note">The clock never pauses. Leaving the exam keeps it running.</p>
      <button class="btn btn-primary" type="button" :disabled="starting" @click="start">
        Start exam
      </button>
    </div>

    <section v-if="progress.history.length > 0" class="card history-panel">
      <h2 class="eyebrow history-panel__title">Score history</h2>
      <HistorySparkline :points="sparklinePoints" :threshold="PASS_LINE" :threshold-label="String(PASS_LINE)" />
      <ul class="history">
        <li v-for="entry in progress.history" :key="entry.sessionId">
          <RouterLink class="history__row" :to="`/results/${entry.sessionId}`">
            <span class="history__date">{{ formatDate(entry.endedAt) }}</span>
            <span v-if="entry.status === 'expired'" class="chip chip--warn">Not finished</span>
            <span class="history__score mono" :class="entry.passed ? 'history__score--pass' : 'history__score--fail'">
              {{ entry.score }}
            </span>
          </RouterLink>
        </li>
      </ul>
      <p class="history-panel__caption">Estimated score — Microsoft uses an unpublished scaled model.</p>
    </section>
  </main>
```

Import `RouterLink` from `vue-router` alongside `onBeforeRouteLeave, useRouter`. Add styles:

```css
.setup {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
.setup__summary {
  margin: 0;
  color: var(--ink-muted);
  font-size: 12px;
}
.setup__note {
  margin: 0 0 8px;
  color: var(--ink-muted);
}
.history-panel {
  margin-top: 24px;
  padding: 24px;
}
.history-panel__title {
  margin: 0 0 16px;
}
.history-panel__caption {
  margin: 12px 0 0;
  color: var(--ink-muted);
  font-size: 12px;
}
.history {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}
.history__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  color: var(--ink);
  text-decoration: none;
}
.history__date {
  flex: 1;
  font-size: 13px;
}
.history__score {
  font-weight: 700;
}
.history__score--pass {
  color: var(--pass);
}
.history__score--fail {
  color: var(--fail);
}
```

Retune the exam-room styles to the tokens (colors already come from variables; change any hard-coded `--domain-*` or `--surface` fallbacks, and give `.exam-bar` `background: var(--bg-header); border-bottom: 1px solid var(--line);`). Keep all class names and copy.

- [ ] **Step 3: Run the exam tests and the suite**

Run: `npm run test:unit -- --run src/views/__tests__/ExamView.spec.ts && npm run test:unit -- --run && npm run type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/views/ExamView.vue src/views/__tests__/ExamView.spec.ts
git commit -m "feat(ui): exam setup screen carries the score history; exam room on the new tokens

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Docs, ignores, lint, build

**Files:**
- Modify: `README.md`, `.gitignore`
- Verify: `npm run lint`, `npm run type-check`, `npm run test:unit -- --run`, `npm run build`

- [ ] **Step 1: Ignore the design export's bulk**

Append to `.gitignore`:

```
# Claude Design export — keep only the .dc.html mockups and their runtime
docs/design/_ds/
docs/design/src/
docs/design/questions.json
docs/design/.thumbnail
```

Then `git add docs/design` (adds the three `.dc.html` files, `support.js`, `github.md`).

- [ ] **Step 2: Rewrite README sections 1, 2, 4 and 7**

Section 1, replace the first paragraph with:

> AZ-900 Trainer is a local-first Vue 3 study app for the Microsoft Azure Fundamentals (AZ-900) exam: an original question bank drilled in 10-question **Rounds** (Practice, Sprint, Review) that earn **XP**, **Streaks** and **Levels**, plus a full timed exam simulation and weak-area analytics.

Section 2 "Features", replace the list with:

```markdown
- **Rounds** — Practice, Sprint and Review each draw up to 10 Questions (never-answered first, then
  least-recently-answered), answered one per screen, ended by a results page. Rounds are never resumed.
- **XP, Streak, Level** — a correct Answer earns 10 XP, +2 per consecutive correct Answer in the Round
  (capped at +10), +5 in a Sprint; exam Answers earn a flat 10. XP is stamped on each Answer when it is
  written (see [ADR-0005](docs/adr/0005-xp-is-stamped-on-each-answer.md)). Levels need 150 XP, then 50
  more each level. Best Streak and Level are read off the Answer log, never stored.
- **Sprint** — every Question runs against a 20-second Shot clock. A timeout records an incorrect Answer
  with whatever was picked, possibly nothing (see
  [ADR-0004](docs/adr/0004-sprint-timeout-is-an-incorrect-answer.md)).
- **Feedback timing** — Practice Rounds reveal after each Answer (default) or only on the results page.
  Sprint and Review always reveal. Remembered per device with the Domain chip, outside the progress file.
- **Weak areas** — a Topic is flagged weak once it has at least 4 Answers and accuracy below 70%; tapping a
  weak area starts a Practice Round on that Topic. That is the only way to a Topic Pool.
- **Review deck** — the Questions whose latest Answer was incorrect; one correct Answer clears each
  ([ADR-0001](docs/adr/0001-review-deck-is-binary-membership-not-spaced-repetition.md)).
- **Exam simulation** — unchanged 40-question, 45:00 exam with an Estimated score against the 700 pass
  line, reached from the strip under the mode cards; its score history lives on the exam setup screen.
- **Export / import / reset** — from the data row at the bottom of the dashboard. Preferences are not
  included and not reset.
```

Section 4, add after the first paragraph:

> Per-device preferences (Feedback timing, Domain chip) live under a second key, `az900-trainer/preferences/v1`, also private to `LocalStorageRepository`. They are not exported and not cleared by reset.

Section 7 "Deliberately out", replace with:

> Sound effects, confetti, daily goals or calendar streaks, Round history list, Topic picker, light theme, flag-for-review, per-question timing stats, drag-drop/hot-area item types, PWA/offline manifest, spaced repetition, Supabase sync, question-feedback workflow.

Also update section 6 step 2's `mode` column comment to `exam | practice | sprint | review` and add `xp (integer, nullable)` to the `answers` table list.

- [ ] **Step 3: Lint, type-check, test, build**

```bash
npm run lint
npm run type-check
npm run test:unit -- --run
npm run build
```

Expected: lint exits 0 (it auto-fixes formatting; review `git diff` for anything it changed), type-check clean, all tests green, `dist/` produced. If lint flags `vue/multi-word-component-names`, every new component already has two words; if oxlint flags an unused import from a moved block, remove it.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: README for v2 Rounds/XP; ignore design export bulk; lint pass

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review notes (already applied)

- Spec coverage: Rounds (T2, T6, T10), Sprint + Shot clock + timeout (T2, T6, T9, T10, ADR-0004), Feedback timing (T4, T5, T6, T12), XP/Level/Streak on Answers (T1, T3, T5, ADR-0005), dashboard composition incl. resume banner, strip, tappable weak areas, data row, no nav (T7, T12), exam demoted with history on setup (T12, T13), results as pages with two layouts and No pick (T3, T11), optimistic UI + save notice (T5, T7), animated silent + keyboard (T7, T10, T11 CSS), dark tokens + fonts (T7), persistence additive (T1, T4), README (T14).
- Names used across tasks: `xpForAnswer`, `levelOf`, `totalXp`, `longestStreak`, `bestStreak` (T1) → T3, T5, T11; `ROUND_SIZE`, `SHOT_CLOCK_MS`, `PoolSpec`, `resolvePool`, `drawRound`, `poolLabel` (T2) → T6, T10, T12; `summarizeRound` (T3) → T11; `Preferences`, `DomainChoice`, `FeedbackTiming` (T4) → T5, T12; `useRoundStore` API (T6) → T10; `showVerdict`, `emptyVerdictLabel` (T8) → T10, T11; `BreakdownRow` (T11).
