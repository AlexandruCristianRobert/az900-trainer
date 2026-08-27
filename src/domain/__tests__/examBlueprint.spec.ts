import { describe, expect, it } from 'vitest'
import type { Question } from '@/data/types'
import type { Answer } from '@/domain/entities'
import { drawExamQuestions, EXAM_QUESTION_COUNT } from '@/domain/examBlueprint'

function makeQuestion(id: string, domain: Question['domain'], topic: Question['topic']): Question {
  return {
    id, domain, topic, kind: 'single', stem: `stem ${id}`,
    options: ['a', 'b', 'c', 'd'].map((o) => ({ id: o, text: o, explanation: 'x' })),
    correct: ['a'],
  }
}
function makeBank(): Question[] {
  const bank: Question[] = []
  for (let i = 0; i < 25; i++) bank.push(makeQuestion(`cc-${i}`, 'cloud-concepts', 'describe-cloud-computing'))
  for (let i = 0; i < 34; i++) bank.push(makeQuestion(`arch-${i}`, 'architecture-services', 'storage'))
  for (let i = 0; i < 31; i++) bank.push(makeQuestion(`gov-${i}`, 'management-governance', 'cost-management'))
  return bank
}
function answerFor(questionId: string, submittedAt: string): Answer {
  return { id: crypto.randomUUID(), sessionId: 's', questionId, selected: ['a'], correct: true, submittedAt }
}

describe('drawExamQuestions', () => {
  it('draws exactly 40 unique ids split 12/15/13 by domain', () => {
    const bank = makeBank()
    const ids = drawExamQuestions(bank, [])
    expect(ids).toHaveLength(EXAM_QUESTION_COUNT)
    expect(new Set(ids).size).toBe(EXAM_QUESTION_COUNT)
    const byId = new Map(bank.map((q) => [q.id, q]))
    const count = (d: string) => ids.filter((id) => byId.get(id)!.domain === d).length
    expect(count('cloud-concepts')).toBe(12)
    expect(count('architecture-services')).toBe(15)
    expect(count('management-governance')).toBe(13)
  })
  it('prefers never-answered questions over recently answered ones', () => {
    const bank = makeBank()
    // Mark 13 of the 25 cloud-concepts questions as answered → the 12 never-answered MUST all be drawn.
    const answered = bank.filter((q) => q.domain === 'cloud-concepts').slice(0, 13)
    const answers = answered.map((q) => answerFor(q.id, '2026-08-01T00:00:00.000Z'))
    const drawn = new Set(drawExamQuestions(bank, answers))
    const neverAnswered = bank.filter((q) => q.domain === 'cloud-concepts').slice(13)
    for (const q of neverAnswered) expect(drawn.has(q.id)).toBe(true)
  })
  it('prefers the least recently answered when all have been seen', () => {
    const bank = makeBank().filter((q) => q.domain === 'cloud-concepts')
    // 25 questions all answered; the 12 with the oldest timestamps must win.
    const answers = bank.map((q, i) =>
      answerFor(q.id, `2026-08-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`))
    const drawn = new Set(drawExamQuestions(bank.concat(makeBank().filter((q) => q.domain !== 'cloud-concepts')), answers))
    for (let i = 0; i < 12; i++) expect(drawn.has(bank[i]!.id)).toBe(true)
  })
})
