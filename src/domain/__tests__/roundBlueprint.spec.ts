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
