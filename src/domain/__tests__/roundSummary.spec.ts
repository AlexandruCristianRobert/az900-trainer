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
