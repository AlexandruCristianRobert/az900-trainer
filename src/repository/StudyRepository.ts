import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'

export interface StudyRepository {
  getQuestions(): Promise<Question[]>
  getSessions(): Promise<Session[]>
  getSession(id: string): Promise<Session | null>
  saveSession(session: Session): Promise<void>            // upsert by id
  saveAnswers(answers: Answer[]): Promise<void>           // append batch; [] is a no-op
  getAnswers(): Promise<Answer[]>
  replaceAll(sessions: Session[], answers: Answer[]): Promise<void> // import/reset; Questions unaffected
}
