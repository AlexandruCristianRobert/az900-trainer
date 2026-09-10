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
    expect(store.domains.length).toBe(3)
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

  it('(f2) importProgress sweeps stranded sessions, expiring an overdue in-progress exam immediately', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T12:00:00.000Z'))

    const q = questionBank[0]!
    const deadline = '2026-08-27T11:00:00.000Z' // in the past relative to system time
    const overdueSession = makeSession({
      mode: 'exam',
      status: 'in-progress',
      startedAt: '2026-08-27T10:00:00.000Z',
      exam: { deadline, questionIds: [q.id], selections: { [q.id]: q.correct } },
    })

    const store = useProgressStore()
    await store.init()

    const exported = JSON.stringify({ version: 1, sessions: [overdueSession], answers: [] })
    await store.importProgress(exported)

    const saved = store.sessions.find((s) => s.id === overdueSession.id)
    expect(saved?.status).toBe('expired')
    expect(saved?.endedAt).toBe(deadline)

    const graded = store.answers.filter((a) => a.sessionId === overdueSession.id)
    expect(graded).toHaveLength(1)
    expect(graded[0]!.correct).toBe(true)
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

  it('saveSession upserts a new session into both the store cache and the repository', async () => {
    const store = useProgressStore()
    await store.init()

    const session = makeSession({ mode: 'practice', status: 'in-progress' })
    await store.saveSession(session)

    expect(store.sessions.find((s) => s.id === session.id)).toEqual(session)
    expect(await repository.getSession(session.id)).toEqual(session)
  })

  it('saveSession upserts an existing session by id (replaced, not duplicated)', async () => {
    const store = useProgressStore()
    await store.init()

    const session = makeSession({ mode: 'practice', status: 'in-progress' })
    await store.saveSession(session)

    const updated: Session = { ...session, status: 'completed', endedAt: '2026-08-01T00:10:00.000Z' }
    await store.saveSession(updated)

    const cacheMatches = store.sessions.filter((s) => s.id === session.id)
    expect(cacheMatches).toHaveLength(1)
    expect(cacheMatches[0]).toEqual(updated)

    const repoSessions = await repository.getSessions()
    expect(repoSessions.filter((s) => s.id === session.id)).toHaveLength(1)
    expect(repoSessions.find((s) => s.id === session.id)).toEqual(updated)
  })

  it('recordAnswers appends batches to both the store cache and the repository, cumulatively', async () => {
    const store = useProgressStore()
    await store.init()

    const q1 = questionBank[0]!
    const q2 = questionBank[1]!
    const sessionId = crypto.randomUUID()
    const batch1: Answer[] = [
      {
        id: crypto.randomUUID(),
        sessionId,
        questionId: q1.id,
        selected: q1.correct,
        correct: true,
        submittedAt: '2026-08-01T00:00:00.000Z',
      },
    ]
    const batch2: Answer[] = [
      {
        id: crypto.randomUUID(),
        sessionId,
        questionId: q2.id,
        selected: q2.correct,
        correct: true,
        submittedAt: '2026-08-01T00:01:00.000Z',
      },
    ]

    await store.recordAnswers(batch1)
    await store.recordAnswers(batch2)

    expect(store.answers).toHaveLength(2)
    expect(store.answers.map((a) => a.id)).toEqual([batch1[0]!.id, batch2[0]!.id])

    const repoAnswers = await repository.getAnswers()
    expect(repoAnswers).toHaveLength(2)
    expect(repoAnswers.map((a) => a.id)).toEqual([batch1[0]!.id, batch2[0]!.id])
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

  it('(g) loads default preferences and persists updates through the repository', async () => {
    const store = useProgressStore()
    await store.init()
    expect(store.preferences).toEqual({ feedbackTiming: 'instant', domain: 'all' })

    await store.updatePreferences({ domain: 'cloud-concepts' })
    expect(store.preferences).toEqual({ feedbackTiming: 'instant', domain: 'cloud-concepts' })
    expect(await repository.getPreferences()).toEqual({ feedbackTiming: 'instant', domain: 'cloud-concepts' })

    // Reset never touches preferences.
    await store.resetProgress()
    expect(store.preferences.domain).toBe('cloud-concepts')
  })

  it('(h) derives total XP, Level and best Streak from the Answer log', async () => {
    const round = makeSession({ mode: 'practice', status: 'completed', endedAt: '2026-08-01T00:05:00.000Z' })
    await repository.saveSession(round)
    const q = questionBank[0]!
    const mk = (correct: boolean, xp: number): Answer => ({
      id: crypto.randomUUID(), sessionId: round.id, questionId: q.id,
      selected: q.correct, correct, submittedAt: '2026-08-01T00:01:00.000Z', xp,
    })
    await repository.saveAnswers([mk(true, 10), mk(true, 12), mk(false, 0), mk(true, 10)])

    const store = useProgressStore()
    await store.init()
    expect(store.totalXp).toBe(32)
    expect(store.level).toEqual({ level: 1, into: 32, need: 150 })
    expect(store.bestStreak).toBe(2)
  })

  it('(i) keeps the cache and flags saveFailed when the repository write rejects', async () => {
    const store = useProgressStore()
    await store.init()
    const spy = vi.spyOn(repository, 'saveAnswers').mockRejectedValueOnce(new Error('quota'))

    const q = questionBank[0]!
    const answer: Answer = {
      id: crypto.randomUUID(), sessionId: crypto.randomUUID(), questionId: q.id,
      selected: q.correct, correct: true, submittedAt: '2026-08-01T00:00:00.000Z', xp: 10,
    }
    await expect(store.recordAnswers([answer])).resolves.toBeUndefined()
    expect(store.answers).toContainEqual(answer)
    expect(store.saveFailed).toBe(true)

    store.dismissSaveFailure()
    expect(store.saveFailed).toBe(false)
    spy.mockRestore()
  })

  it('(j) recordAnswers updates the cache before the repository write settles', async () => {
    const store = useProgressStore()
    await store.init()
    const q = questionBank[0]!
    const answer: Answer = {
      id: crypto.randomUUID(), sessionId: crypto.randomUUID(), questionId: q.id,
      selected: q.correct, correct: true, submittedAt: '2026-08-01T00:00:00.000Z', xp: 10,
    }
    const pending = store.recordAnswers([answer])
    expect(store.answers).toContainEqual(answer) // synchronous, optimistic
    await pending
    expect(await repository.getAnswers()).toContainEqual(answer)
  })
})
