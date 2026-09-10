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
