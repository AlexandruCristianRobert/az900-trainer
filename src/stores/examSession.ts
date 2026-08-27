import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Question } from '@/data/types'
import type { Session } from '@/domain/entities'
import { drawExamQuestions, EXAM_DURATION_MS } from '@/domain/examBlueprint'
import { finalizeExamAnswers, isCompleteSelection } from '@/domain/scoring'
import { useProgressStore } from './progress'

export const useExamStore = defineStore('examSession', () => {
  const progress = useProgressStore()
  const currentIndex = ref(0)

  const session = computed<Session | null>(() => progress.inProgressExam)

  const examQuestions = computed<Question[]>(() => {
    const current = session.value
    if (!current?.exam) return []
    return current.exam.questionIds
      .map((id) => progress.questionById.get(id))
      .filter((q): q is Question => q !== undefined)
  })

  const currentQuestion = computed<Question | null>(
    () => examQuestions.value[currentIndex.value] ?? null,
  )

  const currentSelection = computed<string[]>(() => {
    const current = session.value
    const question = currentQuestion.value
    if (!current?.exam || !question) return []
    return current.exam.selections[question.id] ?? []
  })

  function isQuestionAnswered(questionId: string): boolean {
    const current = session.value
    const question = progress.questionById.get(questionId)
    if (!current?.exam || !question) return false
    const selected = current.exam.selections[questionId] ?? []
    return isCompleteSelection(question, selected)
  }

  const answeredCount = computed<number>(
    () => examQuestions.value.filter((q) => isQuestionAnswered(q.id)).length,
  )

  function remainingMs(nowMs: number): number {
    const current = session.value
    if (!current?.exam) return 0
    return Math.max(0, Date.parse(current.exam.deadline) - nowMs)
  }

  async function startExam(): Promise<void> {
    if (progress.inProgressExam) throw new Error('An exam is already in progress')
    const now = Date.now()
    const newSession: Session = {
      id: crypto.randomUUID(),
      mode: 'exam',
      status: 'in-progress',
      startedAt: new Date(now).toISOString(),
      endedAt: null,
      exam: {
        deadline: new Date(now + EXAM_DURATION_MS).toISOString(),
        questionIds: drawExamQuestions(progress.questions, progress.answers),
        selections: {},
      },
    }
    await progress.saveSession(newSession)
    currentIndex.value = 0
  }

  async function select(questionId: string, optionIds: string[]): Promise<void> {
    const current = session.value
    if (!current?.exam) throw new Error('No exam in progress')
    const updated: Session = {
      ...current,
      exam: { ...current.exam, selections: { ...current.exam.selections, [questionId]: optionIds } },
    }
    await progress.saveSession(updated)
  }

  function goTo(index: number): void {
    const maxIndex = Math.max(examQuestions.value.length - 1, 0)
    currentIndex.value = Math.min(Math.max(index, 0), maxIndex)
  }

  function next(): void {
    goTo(currentIndex.value + 1)
  }

  function prev(): void {
    goTo(currentIndex.value - 1)
  }

  // Termination core (session status FIRST, then answers — same crash-ordering as the sweep).
  async function terminate(kind: 'completed' | 'abandoned' | 'expired'): Promise<string> {
    const current = session.value
    if (!current?.exam) throw new Error('No exam in progress')
    const now = new Date().toISOString()
    const terminated: Session = {
      ...current,
      status: kind === 'completed' ? 'completed' : 'expired',
      endedAt: kind === 'expired' ? current.exam.deadline : now,
      // Abandon truncates the Deadline to now so expired ⟺ now ≥ deadline holds (CONTEXT.md).
      exam: { ...current.exam, deadline: kind === 'abandoned' ? now : current.exam.deadline },
    }
    await progress.saveSession(terminated)
    await progress.recordAnswers(
      finalizeExamAnswers(terminated, progress.questionById, terminated.endedAt!),
    )
    currentIndex.value = 0
    return terminated.id
  }

  async function submitExam(): Promise<string> {
    return terminate('completed')
  }

  async function abandonExam(): Promise<string> {
    return terminate('abandoned')
  }

  async function expireExam(): Promise<string> {
    return terminate('expired')
  }

  return {
    session,
    examQuestions,
    currentIndex,
    currentQuestion,
    currentSelection,
    answeredCount,
    isQuestionAnswered,
    remainingMs,
    startExam,
    select,
    goTo,
    next,
    prev,
    submitExam,
    abandonExam,
    expireExam,
  }
})
