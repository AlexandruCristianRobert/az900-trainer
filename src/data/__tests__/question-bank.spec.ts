import { describe, expect, it } from 'vitest'
import { questionBank } from '@/data/questions'
import { DOMAINS, TOPICS, type DomainId } from '@/data/types'

const EXPECTED_DOMAIN_COUNTS: Record<DomainId, number> = {
  'cloud-concepts': 25,
  'architecture-services': 34,
  'management-governance': 31,
}
const EXPECTED_TOPIC_COUNTS: Record<string, number> = {
  'describe-cloud-computing': 9, 'benefits-of-cloud-services': 8, 'cloud-service-types': 8,
  'core-architectural-components': 8, 'compute-networking': 9, storage: 8, 'identity-access-security': 9,
  'cost-management': 8, 'governance-compliance': 8, 'managing-deploying-resources': 8, 'monitoring-tools': 7,
}
const ID_PREFIX: Record<DomainId, RegExp> = {
  'cloud-concepts': /^cc-\d{3}$/,
  'architecture-services': /^arch-\d{3}$/,
  'management-governance': /^gov-\d{3}$/,
}

describe('question bank structure', () => {
  it('has at least 90 questions with the resolved domain split', () => {
    expect(questionBank.length).toBeGreaterThanOrEqual(90)
    for (const [domain, expected] of Object.entries(EXPECTED_DOMAIN_COUNTS)) {
      expect(questionBank.filter((q) => q.domain === domain)).toHaveLength(expected)
    }
  })
  it('matches the per-topic distribution', () => {
    for (const [topic, expected] of Object.entries(EXPECTED_TOPIC_COUNTS)) {
      expect(questionBank.filter((q) => q.topic === topic)).toHaveLength(expected)
    }
  })
  it('has unique, domain-prefixed ids', () => {
    expect(new Set(questionBank.map((q) => q.id)).size).toBe(questionBank.length)
    for (const q of questionBank) expect(q.id).toMatch(ID_PREFIX[q.domain])
  })
  it('has no duplicate stems', () => {
    const stems = questionBank.map((q) => q.stem.trim().toLowerCase())
    expect(new Set(stems).size).toBe(stems.length)
  })
  it('assigns each question a topic belonging to its domain', () => {
    for (const q of questionBank) expect(TOPICS[q.topic].domain).toBe(q.domain)
  })
  it('shapes single-select questions as 4 options / 1 correct', () => {
    for (const q of questionBank.filter((q) => q.kind === 'single')) {
      expect(q.options, q.id).toHaveLength(4)
      expect(q.correct, q.id).toHaveLength(1)
    }
  })
  it('shapes multi-select questions per the resolved bar and states the pick count in the stem', () => {
    for (const q of questionBank.filter((q) => q.kind === 'multi')) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(4)
      expect(q.correct.length, q.id).toBeGreaterThanOrEqual(2)
      expect(q.correct.length, q.id).toBeLessThan(q.options.length)
      const match = q.stem.match(/select (two|three)/i)
      expect(match, `${q.id} stem must state the pick count`).not.toBeNull()
      const expected = match![1]?.toLowerCase() === 'two' ? 2 : 3
      expect(q.correct.length, q.id).toBe(expected)
    }
  })
  it('uses valid option ids and correct references', () => {
    for (const q of questionBank) {
      const optionIds = q.options.map((o) => o.id)
      expect(new Set(optionIds).size, q.id).toBe(optionIds.length)
      for (const id of optionIds) expect(id, q.id).toMatch(/^[a-e]$/)
      for (const id of q.correct) expect(optionIds, q.id).toContain(id)
    }
  })
  it('explains every option substantively', () => {
    for (const q of questionBank)
      for (const option of q.options)
        expect(option.explanation.trim().length, `${q.id}:${option.id}`).toBeGreaterThanOrEqual(20)
  })
  it('links only to learn.microsoft.com when a link is present', () => {
    for (const q of questionBank)
      if (q.learnMore) expect(q.learnMore, q.id).toMatch(/^https:\/\/learn\.microsoft\.com\//)
  })
  it('keeps DOMAINS exam counts summing to 40', () => {
    const total = Object.values(DOMAINS).reduce((sum, d) => sum + d.examQuestions, 0)
    expect(total).toBe(40)
  })
})
