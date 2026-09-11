export const EXAM_QUESTION_COUNT = 40
export const EXAM_DURATION_MS = 45 * 60 * 1000
export const PASS_LINE = 700

import { DOMAINS, type DomainId, type Question } from '@/data/types'
import type { Answer } from './entities'

export function shuffleInPlace<T>(items: T[], rng: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[items[i], items[j]] = [items[j]!, items[i]!]
  }
  return items
}

/** Question id → the timestamp of its most recent Answer. Drives every "least recently seen" draw. */
export function lastSeenByQuestion(answers: Answer[]): Map<string, string> {
  const lastSeen = new Map<string, string>()
  for (const answer of answers) {
    const prev = lastSeen.get(answer.questionId)
    if (!prev || answer.submittedAt > prev) lastSeen.set(answer.questionId, answer.submittedAt)
  }
  return lastSeen
}

export function drawExamQuestions(
  bank: Question[],
  answers: Answer[],
  rng: () => number = Math.random,
): string[] {
  const lastSeen = lastSeenByQuestion(answers)
  const drawn: string[] = []
  for (const domain of Object.keys(DOMAINS) as DomainId[]) {
    // Shuffle first so the stable sort breaks ties randomly.
    const pool = shuffleInPlace(bank.filter((q) => q.domain === domain), rng)
    pool.sort((a, b) => {
      const seenA = lastSeen.get(a.id)
      const seenB = lastSeen.get(b.id)
      if (seenA === seenB) return 0
      if (seenA === undefined) return -1
      if (seenB === undefined) return 1
      return seenA < seenB ? -1 : 1
    })
    drawn.push(...pool.slice(0, DOMAINS[domain].examQuestions).map((q) => q.id))
  }
  return shuffleInPlace(drawn, rng)
}
