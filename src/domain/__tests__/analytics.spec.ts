import { describe, expect, it } from 'vitest'
import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import {
  WEAK_AREA_ACCURACY_THRESHOLD,
  WEAK_AREA_MIN_ANSWERS,
  domainStats,
  examHistory,
  latestAnswerByQuestion,
  reviewDeck,
  topicStats,
} from '@/domain/analytics'

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

function answerFor(questionId: string, submittedAt: string, correct: boolean = true): Answer {
  return { id: crypto.randomUUID(), sessionId: 's', questionId, selected: ['a'], correct, submittedAt }
}

function makeSession(id: string, mode: 'exam' | 'practice' | 'review', status: 'in-progress' | 'completed' | 'expired', endedAt?: string): Session {
  return {
    id,
    mode,
    status,
    startedAt: '2026-08-01T00:00:00.000Z',
    endedAt: endedAt ?? (status === 'in-progress' ? null : '2026-08-01T01:00:00.000Z'),
    exam: mode === 'exam' ? { deadline: '2026-08-01T01:00:00.000Z', questionIds: [], selections: {} } : null,
  }
}

describe('analytics', () => {
  describe('latestAnswerByQuestion', () => {
    it('returns the latest answer for each question', () => {
      const answers = [
        answerFor('q1', '2026-08-01T00:00:00.000Z'),
        answerFor('q1', '2026-08-01T00:01:00.000Z'),
        answerFor('q2', '2026-08-01T00:00:00.000Z'),
      ]
      const latest = latestAnswerByQuestion(answers)
      expect(latest.get('q1')!.submittedAt).toBe('2026-08-01T00:01:00.000Z')
      expect(latest.get('q2')!.submittedAt).toBe('2026-08-01T00:00:00.000Z')
    })
  })

  describe('reviewDeck (case a)', () => {
    it('single question cycles: wrong → out, correct → out, wrong → back in', () => {
      const bank = makeBank()
      const question = bank[0]!

      // t1: submit wrong answer → should be in deck
      let answers = [answerFor(question.id, '2026-08-01T00:00:00.000Z', false)]
      let deck = reviewDeck(bank, answers)
      let deckIds = new Set(deck.map((q) => q.id))
      expect(deckIds.has(question.id)).toBe(true) // wrong answer → in deck

      // t2: submit correct answer → should leave deck
      answers.push(answerFor(question.id, '2026-08-01T00:01:00.000Z', true))
      deck = reviewDeck(bank, answers)
      deckIds = new Set(deck.map((q) => q.id))
      expect(deckIds.has(question.id)).toBe(false) // correct answer (latest) → out of deck

      // t3: submit wrong answer again → should re-enter deck
      answers.push(answerFor(question.id, '2026-08-01T00:02:00.000Z', false))
      deck = reviewDeck(bank, answers)
      deckIds = new Set(deck.map((q) => q.id))
      expect(deckIds.has(question.id)).toBe(true) // wrong answer (latest) → back in deck
    })
  })

  describe('reviewDeck and topicStats/domainStats (case b)', () => {
    it('excludes dangling answers from deck and tallies', () => {
      const bank = makeBank()
      const q1 = bank[0]!
      // Answer with questionId not in bank
      const answers = [
        answerFor(q1.id, '2026-08-01T00:00:00.000Z', false),
        answerFor('DANGLING-ID', '2026-08-01T00:00:00.000Z', true),
      ]
      const deck = reviewDeck(bank, answers)
      const deckIds = new Set(deck.map((q) => q.id))
      expect(deckIds.has(q1.id)).toBe(true)  // q1 is in deck (incorrect)
      expect(deckIds.has('DANGLING-ID')).toBe(false) // dangling never appears
      expect(deck.length).toBe(1)

      // Dangling shouldn't be counted in tallies
      const topics = topicStats(bank, answers)
      const describeCloudComputing = topics.find((t) => t.topic === 'describe-cloud-computing')!
      expect(describeCloudComputing.answered).toBe(1) // only q1, not dangling
      expect(describeCloudComputing.correct).toBe(0)
    })
  })

  describe('topicStats (case c)', () => {
    it('returns 11 topics in order', () => {
      const bank = makeBank()
      const stats = topicStats(bank, [])
      expect(stats).toHaveLength(11)
      expect(stats[0]!.topic).toBe('describe-cloud-computing')
      expect(stats[10]!.topic).toBe('monitoring-tools')
    })

    it('verdict: 3 answers 0 correct → not-enough-data', () => {
      const bank = makeBank()
      const q1 = bank.filter((q) => q.topic === 'describe-cloud-computing')[0]!
      const q2 = bank.filter((q) => q.topic === 'describe-cloud-computing')[1]!
      const q3 = bank.filter((q) => q.topic === 'describe-cloud-computing')[2]!
      const answers = [
        answerFor(q1.id, '2026-08-01T00:00:00.000Z', false),
        answerFor(q2.id, '2026-08-01T00:00:00.000Z', false),
        answerFor(q3.id, '2026-08-01T00:00:00.000Z', false),
      ]
      const stats = topicStats(bank, answers)
      const topic = stats.find((t) => t.topic === 'describe-cloud-computing')!
      expect(topic.answered).toBe(3)
      expect(topic.correct).toBe(0)
      expect(topic.accuracy).toBe(0)
      expect(topic.verdict).toBe('not-enough-data') // answered < 4
    })

    it('verdict: 4 answers 2 correct (50%) → weak', () => {
      const bank = makeBank()
      const qs = bank.filter((q) => q.topic === 'describe-cloud-computing').slice(0, 4)
      const answers = [
        answerFor(qs[0]!.id, '2026-08-01T00:00:00.000Z', true),
        answerFor(qs[1]!.id, '2026-08-01T00:00:00.000Z', true),
        answerFor(qs[2]!.id, '2026-08-01T00:00:00.000Z', false),
        answerFor(qs[3]!.id, '2026-08-01T00:00:00.000Z', false),
      ]
      const stats = topicStats(bank, answers)
      const topic = stats.find((t) => t.topic === 'describe-cloud-computing')!
      expect(topic.answered).toBe(4)
      expect(topic.correct).toBe(2)
      expect(topic.accuracy).toBe(0.5)
      expect(topic.verdict).toBe('weak') // 0.5 < 0.7
    })

    it('verdict: 4 answers 3 correct (75%) → ok', () => {
      const bank = makeBank()
      const qs = bank.filter((q) => q.topic === 'describe-cloud-computing').slice(0, 4)
      const answers = [
        answerFor(qs[0]!.id, '2026-08-01T00:00:00.000Z', true),
        answerFor(qs[1]!.id, '2026-08-01T00:00:00.000Z', true),
        answerFor(qs[2]!.id, '2026-08-01T00:00:00.000Z', true),
        answerFor(qs[3]!.id, '2026-08-01T00:00:00.000Z', false),
      ]
      const stats = topicStats(bank, answers)
      const topic = stats.find((t) => t.topic === 'describe-cloud-computing')!
      expect(topic.answered).toBe(4)
      expect(topic.correct).toBe(3)
      expect(topic.accuracy).toBe(0.75)
      expect(topic.verdict).toBe('ok') // 0.75 >= 0.7
    })

    it('verdict: 0 answers → accuracy null + not-enough-data', () => {
      const bank = makeBank()
      const stats = topicStats(bank, [])
      const topic = stats.find((t) => t.topic === 'describe-cloud-computing')!
      expect(topic.answered).toBe(0)
      expect(topic.correct).toBe(0)
      expect(topic.accuracy).toBe(null)
      expect(topic.verdict).toBe('not-enough-data')
    })
  })

  describe('domainStats', () => {
    it('returns 3 domains in order', () => {
      const bank = makeBank()
      const stats = domainStats(bank, [])
      expect(stats).toHaveLength(3)
      expect(stats[0]!.domain).toBe('cloud-concepts')
      expect(stats[1]!.domain).toBe('architecture-services')
      expect(stats[2]!.domain).toBe('management-governance')
    })

    it('computes accuracy correctly', () => {
      const bank = makeBank()
      const cc = bank.filter((q) => q.domain === 'cloud-concepts').slice(0, 2)
      const answers = [
        answerFor(cc[0]!.id, '2026-08-01T00:00:00.000Z', true),
        answerFor(cc[1]!.id, '2026-08-01T00:00:00.000Z', false),
      ]
      const stats = domainStats(bank, answers)
      const domain = stats.find((d) => d.domain === 'cloud-concepts')!
      expect(domain.answered).toBe(2)
      expect(domain.correct).toBe(1)
      expect(domain.accuracy).toBe(0.5)
    })

    it('accuracy is null when answered === 0', () => {
      const bank = makeBank()
      const stats = domainStats(bank, [])
      const domain = stats.find((d) => d.domain === 'cloud-concepts')!
      expect(domain.answered).toBe(0)
      expect(domain.accuracy).toBe(null)
    })
  })

  describe('examHistory (case d)', () => {
    it('includes completed exam sessions', () => {
      const sessions = [
        makeSession('exam-1', 'exam', 'completed', '2026-08-01T01:00:00.000Z'),
      ]
      const answers = [
        answerFor('q1', '2026-08-01T00:30:00.000Z', true),
        answerFor('q2', '2026-08-01T00:30:00.000Z', true),
      ]
      answers[0]!.sessionId = 'exam-1'
      answers[1]!.sessionId = 'exam-1'

      const history = examHistory(sessions, answers)
      expect(history).toHaveLength(1)
      expect(history[0]!.status).toBe('completed')
    })

    it('includes expired exam sessions', () => {
      const sessions = [
        makeSession('exam-1', 'exam', 'expired', '2026-08-01T01:00:00.000Z'),
      ]
      const answers = [
        answerFor('q1', '2026-08-01T00:30:00.000Z', true),
      ]
      answers[0]!.sessionId = 'exam-1'

      const history = examHistory(sessions, answers)
      expect(history).toHaveLength(1)
      expect(history[0]!.status).toBe('expired')
    })

    it('excludes in-progress exam sessions', () => {
      const sessions = [
        makeSession('exam-1', 'exam', 'in-progress'),
      ]
      const answers: Answer[] = []

      const history = examHistory(sessions, answers)
      expect(history).toHaveLength(0)
    })

    it('excludes practice sessions', () => {
      const sessions = [
        makeSession('practice-1', 'practice', 'completed', '2026-08-01T01:00:00.000Z'),
      ]
      const answers: Answer[] = []

      const history = examHistory(sessions, answers)
      expect(history).toHaveLength(0)
    })

    it('computes score via estimatedScore and passed = score >= 700', () => {
      const sessions = [
        makeSession('exam-1', 'exam', 'completed', '2026-08-01T01:00:00.000Z'),
      ]
      // 30 correct answers → estimatedScore(30) = round((1000 * 30) / 40) = 750
      const answers: Answer[] = []
      for (let i = 0; i < 30; i++) {
        answers.push({
          id: crypto.randomUUID(),
          sessionId: 'exam-1',
          questionId: `q${i}`,
          selected: ['a'],
          correct: true,
          submittedAt: '2026-08-01T00:30:00.000Z',
        })
      }

      const history = examHistory(sessions, answers)
      expect(history[0]!.correctCount).toBe(30)
      expect(history[0]!.answeredCount).toBe(30)
      expect(history[0]!.score).toBe(750)
      expect(history[0]!.passed).toBe(true) // 750 >= 700
    })

    it('computes passed = false when score < 700', () => {
      const sessions = [
        makeSession('exam-1', 'exam', 'completed', '2026-08-01T01:00:00.000Z'),
      ]
      // 28 correct → score = round((1000 * 28) / 40) = 700
      // 27 correct → score = round((1000 * 27) / 40) = 675
      const answers: Answer[] = []
      for (let i = 0; i < 27; i++) {
        answers.push({
          id: crypto.randomUUID(),
          sessionId: 'exam-1',
          questionId: `q${i}`,
          selected: ['a'],
          correct: true,
          submittedAt: '2026-08-01T00:30:00.000Z',
        })
      }

      const history = examHistory(sessions, answers)
      expect(history[0]!.score).toBe(675)
      expect(history[0]!.passed).toBe(false) // 675 < 700
    })

    it('sorted newest-first by endedAt', () => {
      const sessions = [
        makeSession('exam-1', 'exam', 'completed', '2026-08-01T00:30:00.000Z'),
        makeSession('exam-2', 'exam', 'completed', '2026-08-01T02:00:00.000Z'),
        makeSession('exam-3', 'exam', 'completed', '2026-08-01T01:00:00.000Z'),
      ]
      const answers: Answer[] = []

      const history = examHistory(sessions, answers)
      expect(history).toHaveLength(3)
      expect(history[0]!.sessionId).toBe('exam-2') // newest
      expect(history[1]!.sessionId).toBe('exam-3')
      expect(history[2]!.sessionId).toBe('exam-1') // oldest
    })

    it('endedAt defaults to startedAt for sessions without endedAt', () => {
      const sessions = [
        makeSession('exam-1', 'exam', 'completed'), // will use the default endedAt
      ]
      const answers: Answer[] = []

      const history = examHistory(sessions, answers)
      expect(history[0]!.endedAt).toBe('2026-08-01T01:00:00.000Z')
    })
  })
})
