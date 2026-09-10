import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'

export type BreakdownStatus = 'correct' | 'incorrect' | 'unanswered' | 'no-pick'

export interface BreakdownRow {
  key: string
  number: number
  question: Question | undefined
  selected: string[]
  status: BreakdownStatus
}

/** One row per drawn Question, in exam order; no Answer means Unanswered (exam rule). */
export function examBreakdownRows(
  session: Session,
  answers: Answer[],
  questionById: Map<string, Question>,
): BreakdownRow[] {
  const exam = session.exam
  if (!exam) return []
  const answerByQuestion = new Map(
    answers.filter((a) => a.sessionId === session.id).map((a) => [a.questionId, a]),
  )
  return exam.questionIds.map((questionId, index) => {
    const answer = answerByQuestion.get(questionId)
    return {
      key: questionId,
      number: index + 1,
      question: questionById.get(questionId),
      selected: answer?.selected ?? [],
      status: !answer ? 'unanswered' : answer.correct ? 'correct' : 'incorrect',
    }
  })
}

/** One row per Answer in submission order; an empty pick is a Sprint timeout (ADR-0004). */
export function roundBreakdownRows(
  answers: Answer[],
  questionById: Map<string, Question>,
): BreakdownRow[] {
  return answers.map((answer, index) => ({
    key: answer.id,
    number: index + 1,
    question: questionById.get(answer.questionId),
    selected: answer.selected,
    status: answer.correct ? 'correct' : answer.selected.length === 0 ? 'no-pick' : 'incorrect',
  }))
}
