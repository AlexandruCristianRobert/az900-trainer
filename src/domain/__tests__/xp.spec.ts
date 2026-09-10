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
