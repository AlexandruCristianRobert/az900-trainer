import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import { isCorrect } from '@/domain/scoring'
import { useProgressStore } from './progress'

export type PracticeMode = 'practice' | 'review'

export const usePracticeStore = defineStore('practiceSession', () => {
  const progress = useProgressStore()
  const sessionId = ref<string | null>(null)
  const mode = ref<PracticeMode>('practice')

  // A Session is created lazily on the FIRST Answer, not on begin (no empty-session litter).
  function begin(newMode: PracticeMode): void {
    mode.value = newMode
    sessionId.value = null
  }

  async function submitAnswer(question: Question, selected: string[]): Promise<Answer> {
    if (!sessionId.value) {
      const now = new Date().toISOString()
      const newSession: Session = {
        id: crypto.randomUUID(),
        mode: mode.value,
        status: 'in-progress',
        startedAt: now,
        endedAt: null,
        exam: null,
      }
      await progress.saveSession(newSession)
      sessionId.value = newSession.id
    }

    const answer: Answer = {
      id: crypto.randomUUID(),
      sessionId: sessionId.value,
      questionId: question.id,
      selected,
      correct: isCorrect(question, selected),
      submittedAt: new Date().toISOString(),
    }
    await progress.recordAnswers([answer])
    return answer
  }

  async function finish(): Promise<void> {
    const id = sessionId.value
    if (!id) return // no session was created: no-op
    const current = progress.sessions.find((s) => s.id === id)
    if (!current || current.status !== 'in-progress') return // idempotent: nothing left to complete
    await progress.saveSession({ ...current, status: 'completed', endedAt: new Date().toISOString() })
    sessionId.value = null
  }

  return {
    sessionId,
    mode,
    begin,
    submitAnswer,
    finish,
  }
})
