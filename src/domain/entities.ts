export type SessionMode = 'exam' | 'practice' | 'sprint' | 'review'
/** A Round is any non-exam Session (CONTEXT.md). */
export type RoundMode = Exclude<SessionMode, 'exam'>
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
  exam: ExamState | null                // null for every Round
}

export interface Answer {
  id: string
  sessionId: string
  questionId: string
  /**
   * Non-empty everywhere except a Sprint timeout, which records an incorrect
   * Answer with whatever was picked — possibly nothing (ADR-0004). Unanswered
   * exam questions still produce NO Answer.
   */
  selected: string[]
  correct: boolean
  submittedAt: string
  /** XP earned by this Answer, fixed at submission (ADR-0005). Absent on legacy Answers = 0. */
  xp?: number
}
