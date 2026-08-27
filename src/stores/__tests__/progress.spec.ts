import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Answer, Session } from '@/domain/entities'
import { repository } from '@/repository'
import { useProgressStore } from '../progress'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(),
    mode: 'practice',
    status: 'in-progress',
    startedAt: '2026-08-01T00:00:00.000Z',
    endedAt: null,
    exam: null,
    ...overrides,
  }
}

describe('progress store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('(a) initializes on empty storage', async () => {
    const store = useProgressStore()
    await store.init()

    expect(store.ready).toBe(true)
    expect(store.sessions).toEqual([])
    expect(store.answers).toEqual([])
    expect(store.domains.length).toBeGreaterThanOrEqual(3)
    expect(store.history).toEqual([])
  })

  it('(b) lazy finalization completes stranded non-exam sessions', async () => {
    const session = makeSession({ mode: 'practice', status: 'in-progress' })
    await repository.saveSession(session)

    const store = useProgressStore()
    await store.init()

    const saved = store.sessions.find((s) => s.id === session.id)
    expect(saved?.status).toBe('completed')
    expect(saved?.endedAt).not.toBeNull()
  })

  it('(c) lazy finalization expires overdue exam sessions and grades one Answer', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T12:00:00.000Z'))

    const q = questionBank[0]!
    const deadline = '2026-08-27T11:00:00.000Z' // in the past relative to system time
    const session = makeSession({
      mode: 'exam',
      status: 'in-progress',
      startedAt: '2026-08-27T10:00:00.000Z',
      exam: {
        deadline,
        questionIds: [q.id],
        selections: { [q.id]: q.correct },
      },
    })
    await repository.saveSession(session)

    const store = useProgressStore()
    await store.init()

    const saved = store.sessions.find((s) => s.id === session.id)
    expect(saved?.status).toBe('expired')
    expect(saved?.endedAt).toBe(deadline)

    const graded = store.answers.filter((a) => a.sessionId === session.id)
    expect(graded).toHaveLength(1)
    expect(graded[0]!.questionId).toBe(q.id)
    expect(graded[0]!.correct).toBe(true)
  })

  it('(d) leaves an in-progress exam with a future deadline untouched', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T12:00:00.000Z'))

    const q = questionBank[0]!
    const deadline = '2026-08-27T13:00:00.000Z' // in the future
    const session = makeSession({
      mode: 'exam',
      status: 'in-progress',
      startedAt: '2026-08-27T12:00:00.000Z',
      exam: { deadline, questionIds: [q.id], selections: {} },
    })
    await repository.saveSession(session)

    const store = useProgressStore()
    await store.init()

    const saved = store.sessions.find((s) => s.id === session.id)
    expect(saved?.status).toBe('in-progress')
    expect(store.inProgressExam?.id).toBe(session.id)
    expect(store.answers.filter((a) => a.sessionId === session.id)).toHaveLength(0)
  })

  it('(e) export -> reset -> import round-trips sessions and answers', async () => {
    const q = questionBank[0]!
    const session = makeSession({
      mode: 'practice',
      status: 'completed',
      endedAt: '2026-08-01T00:05:00.000Z',
    })
    await repository.saveSession(session)
    const answer: Answer = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      questionId: q.id,
      selected: q.correct,
      correct: true,
      submittedAt: '2026-08-01T00:05:00.000Z',
    }
    await repository.saveAnswers([answer])

    const store = useProgressStore()
    await store.init()

    const exported = store.exportProgress()
    const parsed = JSON.parse(exported)
    expect(parsed.version).toBe(1)
    expect(parsed.sessions).toHaveLength(1)
    expect(parsed.answers).toHaveLength(1)

    await store.resetProgress()
    expect(store.sessions).toEqual([])
    expect(store.answers).toEqual([])
    expect(await repository.getSessions()).toEqual([])

    await store.importProgress(exported)
    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0]!.id).toBe(session.id)
    expect(store.answers).toHaveLength(1)
    expect(store.answers[0]!.id).toBe(answer.id)
    expect(await repository.getSessions()).toHaveLength(1)
  })

  it('(f) importProgress rejects malformed input and leaves data intact', async () => {
    const session = makeSession({ mode: 'practice', status: 'completed', endedAt: '2026-08-01T00:05:00.000Z' })
    await repository.saveSession(session)

    const store = useProgressStore()
    await store.init()

    await expect(store.importProgress('not json')).rejects.toThrow('Invalid progress file')
    await expect(store.importProgress('{"version":2}')).rejects.toThrow('Invalid progress file')

    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0]!.id).toBe(session.id)
    expect(await repository.getSessions()).toHaveLength(1)
  })

  it('init is idempotent (a second call does not re-sweep)', async () => {
    const session = makeSession({ mode: 'practice', status: 'in-progress' })
    await repository.saveSession(session)

    const store = useProgressStore()
    await store.init()
    const firstEndedAt = store.sessions.find((s) => s.id === session.id)?.endedAt

    await store.init()
    const secondEndedAt = store.sessions.find((s) => s.id === session.id)?.endedAt

    expect(secondEndedAt).toBe(firstEndedAt)
  })
})
