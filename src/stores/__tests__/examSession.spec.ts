import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXAM_DURATION_MS } from '@/domain/examBlueprint'
import { repository } from '@/repository'
import { useExamStore } from '../examSession'
import { useProgressStore } from '../progress'

describe('exam session store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('(a) startExam creates a persisted in-progress exam session; a second call rejects', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-08-27T10:00:00.000Z')
    vi.setSystemTime(start)

    const progress = useProgressStore()
    await progress.init()
    const exam = useExamStore()

    await exam.startExam()

    const session = exam.session
    expect(session).not.toBeNull()
    expect(session!.mode).toBe('exam')
    expect(session!.status).toBe('in-progress')
    expect(session!.startedAt).toBe(start.toISOString())
    expect(session!.endedAt).toBeNull()
    expect(session!.exam!.questionIds).toHaveLength(40)
    expect(new Set(session!.exam!.questionIds).size).toBe(40)
    expect(session!.exam!.deadline).toBe(new Date(start.getTime() + EXAM_DURATION_MS).toISOString())
    expect(session!.exam!.selections).toEqual({})

    const persisted = await repository.getSession(session!.id)
    expect(persisted).toEqual(session)

    await expect(exam.startExam()).rejects.toThrow('An exam is already in progress')
  })

  it('(b) select persists selections; answeredCount counts only complete Selections', async () => {
    const progress = useProgressStore()
    await progress.init()
    const exam = useExamStore()

    await exam.startExam()

    const single = exam.examQuestions.find((q) => q.kind === 'single')!
    expect(single).toBeDefined()
    await exam.select(single.id, [single.options[0]!.id])

    expect(exam.answeredCount).toBe(1)
    expect(exam.isQuestionAnswered(single.id)).toBe(true)

    const persistedAfterSingle = await repository.getSession(exam.session!.id)
    expect(persistedAfterSingle!.exam!.selections[single.id]).toEqual([single.options[0]!.id])

    const multi = exam.examQuestions.find((q) => q.kind === 'multi')
    if (multi) {
      await exam.select(multi.id, [multi.options[0]!.id]) // needs 2, only 1 selected: incomplete
      expect(exam.answeredCount).toBe(1)
      expect(exam.isQuestionAnswered(multi.id)).toBe(false)

      const persistedAfterMulti = await repository.getSession(exam.session!.id)
      expect(persistedAfterMulti!.exam!.selections[multi.id]).toEqual([multi.options[0]!.id])
    }
  })

  it('(c) submitExam completes the session, records Answers for complete Selections only, clears inProgressExam', async () => {
    const progress = useProgressStore()
    await progress.init()
    const exam = useExamStore()

    await exam.startExam()
    const sessionId = exam.session!.id

    const single = exam.examQuestions.find((q) => q.kind === 'single')!
    await exam.select(single.id, [single.options[0]!.id])

    const multi = exam.examQuestions.find((q) => q.kind === 'multi')
    if (multi) {
      await exam.select(multi.id, [multi.options[0]!.id]) // incomplete: leaves 1 of 2 selected
    }

    const returnedId = await exam.submitExam()
    expect(returnedId).toBe(sessionId)

    const persisted = await repository.getSession(sessionId)
    expect(persisted!.status).toBe('completed')
    expect(persisted!.endedAt).not.toBeNull()

    const answers = (await repository.getAnswers()).filter((a) => a.sessionId === sessionId)
    expect(answers).toHaveLength(1)
    expect(answers[0]!.questionId).toBe(single.id)

    expect(progress.inProgressExam).toBeNull()
    expect(exam.session).toBeNull()
  })

  it('(d) abandonExam truncates the stored deadline to now and marks the session expired', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-08-27T10:00:00.000Z')
    vi.setSystemTime(start)

    const progress = useProgressStore()
    await progress.init()
    const exam = useExamStore()
    await exam.startExam()
    const sessionId = exam.session!.id

    const fiveMinutesLater = new Date(start.getTime() + 5 * 60 * 1000)
    vi.setSystemTime(fiveMinutesLater)

    const returnedId = await exam.abandonExam()
    expect(returnedId).toBe(sessionId)

    const persisted = await repository.getSession(sessionId)
    expect(persisted!.status).toBe('expired')
    expect(persisted!.endedAt).toBe(fiveMinutesLater.toISOString())
    expect(persisted!.exam!.deadline).toBe(fiveMinutesLater.toISOString())
  })

  it('(e) expireExam ends the session at the original deadline (unchanged)', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-08-27T10:00:00.000Z')
    vi.setSystemTime(start)

    const progress = useProgressStore()
    await progress.init()
    const exam = useExamStore()
    await exam.startExam()
    const sessionId = exam.session!.id
    const originalDeadline = exam.session!.exam!.deadline

    vi.setSystemTime(new Date(start.getTime() + EXAM_DURATION_MS + 60_000)) // past deadline

    const returnedId = await exam.expireExam()
    expect(returnedId).toBe(sessionId)

    const persisted = await repository.getSession(sessionId)
    expect(persisted!.status).toBe('expired')
    expect(persisted!.endedAt).toBe(originalDeadline)
    expect(persisted!.exam!.deadline).toBe(originalDeadline)
  })

  it('(f) remainingMs clamps at 0 once past the deadline', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-08-27T10:00:00.000Z')
    vi.setSystemTime(start)

    const progress = useProgressStore()
    await progress.init()
    const exam = useExamStore()
    await exam.startExam()

    const deadlineMs = Date.parse(exam.session!.exam!.deadline)
    expect(exam.remainingMs(deadlineMs - 1000)).toBe(1000)
    expect(exam.remainingMs(deadlineMs)).toBe(0)
    expect(exam.remainingMs(deadlineMs + 5000)).toBe(0)
  })

  it('navigation via goTo/next/prev clamps to [0, examQuestions.length - 1]', async () => {
    const progress = useProgressStore()
    await progress.init()
    const exam = useExamStore()
    await exam.startExam()

    const last = exam.examQuestions.length - 1

    exam.prev()
    expect(exam.currentIndex).toBe(0)

    exam.goTo(-5)
    expect(exam.currentIndex).toBe(0)
    expect(exam.currentQuestion?.id).toBe(exam.examQuestions[0]!.id)

    exam.goTo(last + 10)
    expect(exam.currentIndex).toBe(last)
    expect(exam.currentQuestion?.id).toBe(exam.examQuestions[last]!.id)

    exam.next()
    expect(exam.currentIndex).toBe(last)

    exam.goTo(1)
    exam.prev()
    expect(exam.currentIndex).toBe(0)
  })
})
