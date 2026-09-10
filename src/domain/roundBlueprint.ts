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
