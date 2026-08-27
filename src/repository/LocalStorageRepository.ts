import type { Question } from '@/data/types'
import { questionBank } from '@/data/questions'
import type { Answer, Session } from '@/domain/entities'
import type { StudyRepository } from './StudyRepository'

// Private to this module — the ONLY localStorage access in the app (ADR-0002).
const STORAGE_KEY = 'az900-trainer/progress/v1'

interface StoredProgress {
  version: 1
  sessions: Session[]
  answers: Answer[]
}

function emptyProgress(): StoredProgress {
  return { version: 1, sessions: [], answers: [] }
}

export class LocalStorageRepository implements StudyRepository {
  private read(): StoredProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return emptyProgress()
      const parsed = JSON.parse(raw) as StoredProgress
      if (parsed.version !== 1 || !Array.isArray(parsed.sessions) || !Array.isArray(parsed.answers)) {
        return emptyProgress()
      }
      return parsed
    } catch {
      return emptyProgress()
    }
  }
  private write(progress: StoredProgress): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }
  async getQuestions(): Promise<Question[]> { return questionBank }
  async getSessions(): Promise<Session[]> { return this.read().sessions }
  async getSession(id: string): Promise<Session | null> {
    return this.read().sessions.find((s) => s.id === id) ?? null
  }
  async saveSession(session: Session): Promise<void> {
    const progress = this.read()
    const index = progress.sessions.findIndex((s) => s.id === session.id)
    if (index === -1) progress.sessions.push(session)
    else progress.sessions[index] = session
    this.write(progress)
  }
  async saveAnswers(answers: Answer[]): Promise<void> {
    if (answers.length === 0) return
    const progress = this.read()
    progress.answers.push(...answers)
    this.write(progress)
  }
  async getAnswers(): Promise<Answer[]> { return this.read().answers }
  async replaceAll(sessions: Session[], answers: Answer[]): Promise<void> {
    this.write({ version: 1, sessions, answers })
  }
}
