import type { Question } from '@/data/types'
import type { Answer, Session } from './entities'
import { EXAM_QUESTION_COUNT } from './examBlueprint'

/** All-or-nothing: the selected set must equal the correct set. */
export function isCorrect(question: Question, selected: string[]): boolean {
  if (selected.length !== question.correct.length) return false
  const correctSet = new Set(question.correct)
  return selected.every((id) => correctSet.has(id))
}

/** A Selection is complete when it could be submitted: 1 pick for single, exactly correct-count picks for multi. */
export function isCompleteSelection(question: Question, selected: string[]): boolean {
  return question.kind === 'single'
    ? selected.length === 1
    : selected.length === question.correct.length
}

export function estimatedScore(correctCount: number): number {
  return Math.round((1000 * correctCount) / EXAM_QUESTION_COUNT)
}

/**
 * Converts a terminating exam Session's Selections into immutable Answers.
 * Incomplete Selections and Questions missing from the bank produce no Answer.
 */
export function finalizeExamAnswers(
  session: Session,
  questionById: Map<string, Question>,
  submittedAt: string,
): Answer[] {
  if (!session.exam) return []
  const answers: Answer[] = []
  for (const questionId of session.exam.questionIds) {
    const question = questionById.get(questionId)
    const selected = session.exam.selections[questionId] ?? []
    if (!question || !isCompleteSelection(question, selected)) continue
    answers.push({
      id: crypto.randomUUID(),
      sessionId: session.id,
      questionId,
      selected,
      correct: isCorrect(question, selected),
      submittedAt,
    })
  }
  return answers
}
