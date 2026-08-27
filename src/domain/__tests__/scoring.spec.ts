import { describe, expect, it } from 'vitest'
import type { Question } from '@/data/types'
import type { Session } from '@/domain/entities'
import { estimatedScore, finalizeExamAnswers, isCompleteSelection, isCorrect } from '@/domain/scoring'

const single: Question = {
  id: 'cc-001', domain: 'cloud-concepts', topic: 'describe-cloud-computing', kind: 'single',
  stem: 'What is cloud computing?',
  options: [
    { id: 'a', text: 'A', explanation: 'x' }, { id: 'b', text: 'B', explanation: 'x' },
    { id: 'c', text: 'C', explanation: 'x' }, { id: 'd', text: 'D', explanation: 'x' },
  ],
  correct: ['b'],
}
const multi: Question = {
  ...single, id: 'cc-002', kind: 'multi', stem: 'Select two things.', correct: ['a', 'c'],
}

describe('isCorrect', () => {
  it('accepts the exact correct set regardless of order', () => {
    expect(isCorrect(single, ['b'])).toBe(true)
    expect(isCorrect(multi, ['c', 'a'])).toBe(true)
  })
  it('is all-or-nothing for multi-select', () => {
    expect(isCorrect(multi, ['a'])).toBe(false)
    expect(isCorrect(multi, ['a', 'b'])).toBe(false)
    expect(isCorrect(multi, ['a', 'b', 'c'])).toBe(false)
  })
})

describe('isCompleteSelection', () => {
  it('requires exactly one for single and exactly correct-count for multi', () => {
    expect(isCompleteSelection(single, [])).toBe(false)
    expect(isCompleteSelection(single, ['a'])).toBe(true)
    expect(isCompleteSelection(multi, ['a'])).toBe(false)
    expect(isCompleteSelection(multi, ['a', 'b'])).toBe(true)
  })
})

describe('estimatedScore', () => {
  it('maps correct counts onto 0–1000', () => {
    expect(estimatedScore(0)).toBe(0)
    expect(estimatedScore(28)).toBe(700)
    expect(estimatedScore(40)).toBe(1000)
  })
})

describe('finalizeExamAnswers', () => {
  const bank = new Map([[single.id, single], [multi.id, multi]])
  const session: Session = {
    id: 's1', mode: 'exam', status: 'in-progress', startedAt: '2026-08-27T10:00:00.000Z', endedAt: null,
    exam: {
      deadline: '2026-08-27T10:45:00.000Z',
      questionIds: ['cc-001', 'cc-002'],
      selections: { 'cc-001': ['b'], 'cc-002': ['a'] }, // multi incomplete (1 of 2)
    },
  }
  it('converts complete Selections to graded Answers and drops incomplete ones', () => {
    const answers = finalizeExamAnswers(session, bank, '2026-08-27T10:45:00.000Z')
    expect(answers).toHaveLength(1)
    expect(answers[0]!).toMatchObject({
      sessionId: 's1', questionId: 'cc-001', selected: ['b'], correct: true,
      submittedAt: '2026-08-27T10:45:00.000Z',
    })
    expect(answers[0]!.id).toMatch(/^[0-9a-f-]{36}$/)
  })
  it('skips questions missing from the bank (dangling protection)', () => {
    const partialBank = new Map([[multi.id, multi]])
    expect(finalizeExamAnswers(session, partialBank, 'x')).toHaveLength(0)
  })
})
