import { DOMAINS, TOPICS, type DomainId, type Question, type TopicId } from '@/data/types'
import type { Answer, Session } from './entities'
import { PASS_LINE } from './examBlueprint'
import { estimatedScore } from './scoring'

export const WEAK_AREA_MIN_ANSWERS = 4
export const WEAK_AREA_ACCURACY_THRESHOLD = 0.7

export interface TopicStats {
  topic: TopicId
  answered: number
  correct: number
  accuracy: number | null
  verdict: 'weak' | 'ok' | 'not-enough-data'
}

export interface DomainStats {
  domain: DomainId
  answered: number
  correct: number
  accuracy: number | null
}

export interface ExamHistoryEntry {
  sessionId: string
  startedAt: string
  endedAt: string
  status: 'completed' | 'expired'
  correctCount: number
  answeredCount: number
  score: number
  passed: boolean
}

export function latestAnswerByQuestion(answers: Answer[]): Map<string, Answer> {
  const latest = new Map<string, Answer>()
  for (const answer of answers) {
    const prev = latest.get(answer.questionId)
    if (!prev || answer.submittedAt > prev.submittedAt) latest.set(answer.questionId, answer)
  }
  return latest
}

export function reviewDeck(bank: Question[], answers: Answer[]): Question[] {
  const latest = latestAnswerByQuestion(answers)
  return bank.filter((question) => latest.get(question.id)?.correct === false)
}

export function topicStats(bank: Question[], answers: Answer[]): TopicStats[] {
  const byId = new Map(bank.map((q) => [q.id, q]))
  const tally = new Map<TopicId, { answered: number; correct: number }>()
  for (const topic of Object.keys(TOPICS) as TopicId[]) tally.set(topic, { answered: 0, correct: 0 })
  for (const answer of answers) {
    const question = byId.get(answer.questionId)
    if (!question) continue // dangling Answer: skipped, never counted (ADR-0003)
    const bucket = tally.get(question.topic)!
    bucket.answered += 1
    if (answer.correct) bucket.correct += 1
  }
  return (Object.keys(TOPICS) as TopicId[]).map((topic) => {
    const { answered, correct } = tally.get(topic)!
    const accuracy = answered === 0 ? null : correct / answered
    const verdict =
      answered < WEAK_AREA_MIN_ANSWERS
        ? 'not-enough-data'
        : (accuracy as number) < WEAK_AREA_ACCURACY_THRESHOLD
          ? 'weak'
          : 'ok'
    return { topic, answered, correct, accuracy, verdict }
  })
}

export function domainStats(bank: Question[], answers: Answer[]): DomainStats[] {
  const byId = new Map(bank.map((q) => [q.id, q]))
  const tally = new Map<DomainId, { answered: number; correct: number }>()
  for (const domain of Object.keys(DOMAINS) as DomainId[]) tally.set(domain, { answered: 0, correct: 0 })
  for (const answer of answers) {
    const question = byId.get(answer.questionId)
    if (!question) continue
    const bucket = tally.get(question.domain)!
    bucket.answered += 1
    if (answer.correct) bucket.correct += 1
  }
  return (Object.keys(DOMAINS) as DomainId[]).map((domain) => {
    const { answered, correct } = tally.get(domain)!
    return { domain, answered, correct, accuracy: answered === 0 ? null : correct / answered }
  })
}

export function examHistory(sessions: Session[], answers: Answer[]): ExamHistoryEntry[] {
  const bySession = new Map<string, Answer[]>()
  for (const answer of answers) {
    const list = bySession.get(answer.sessionId)
    if (list) list.push(answer)
    else bySession.set(answer.sessionId, [answer])
  }
  return sessions
    .filter((s): s is Session & { status: 'completed' | 'expired' } =>
      s.mode === 'exam' && s.status !== 'in-progress')
    .map((s) => {
      const list = bySession.get(s.id) ?? []
      const correctCount = list.filter((a) => a.correct).length
      const score = estimatedScore(correctCount)
      return {
        sessionId: s.id, startedAt: s.startedAt, endedAt: s.endedAt ?? s.startedAt,
        status: s.status, correctCount, answeredCount: list.length,
        score, passed: score >= PASS_LINE,
      }
    })
    .sort((a, b) => (a.endedAt < b.endedAt ? 1 : -1))
}
