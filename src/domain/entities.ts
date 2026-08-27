export type SessionMode = 'exam' | 'practice' | 'review'
export type SessionStatus = 'in-progress' | 'completed' | 'expired'

export interface ExamState {
  deadline: string                      // ISO-8601 UTC; the Deadline (CONTEXT.md)
  questionIds: string[]                 // drawn form, presentation order
  selections: Record<string, string[]>  // Selection per Question (CONTEXT.md)
}

export interface Session {
  id: string
  mode: SessionMode
  status: SessionStatus
  startedAt: string
  endedAt: string | null
  exam: ExamState | null                // null for practice/review
}

export interface Answer {
  id: string
  sessionId: string
  questionId: string
  selected: string[]                    // always non-empty; unanswered exam questions produce NO Answer
  correct: boolean
  submittedAt: string
}
