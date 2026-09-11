import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import { SHOT_CLOCK_MS, type PoolSpec } from '@/domain/roundBlueprint'
import { repository } from '@/repository'
import { useProgressStore } from '../progress'
import { useRoundStore } from '../roundSession'

const MONITORING: PoolSpec = { kind: 'topic', topic: 'monitoring-tools' }

function byId(id: string): Question {
  return questionBank.find((q) => q.id === id)!
}
function wrongPick(q: Question): string[] {
  const wrong = q.options.filter((o) => !q.correct.includes(o.id))
  const filler = q.options.filter((o) => q.correct.includes(o.id))
  return [...wrong, ...filler].slice(0, q.correct.length).map((o) => o.id)
}
async function seedIncorrect(questionId: string): Promise<void> {
  const now = new Date().toISOString()
  const session: Session = { id: crypto.randomUUID(), mode: 'practice', status: 'completed', startedAt: now, endedAt: now, exam: null }
  await repository.saveSession(session)
  const q = byId(questionId)
  const answer: Answer = { id: crypto.randomUUID(), sessionId: session.id, questionId, selected: wrongPick(q), correct: false, submittedAt: now, xp: 0 }
  await repository.saveAnswers([answer])
}

describe('round store', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    await useProgressStore().init()
  })
  afterEach(() => vi.useRealTimers())

  it('(a) refuses to start on an empty Pool', () => {
    const round = useRoundStore()
    expect(round.startRound('review', { kind: 'review' })).toBe(false)
    expect(round.round).toBeNull()
  })

  it('(b) grades a practice Round with instant reveal, stamping XP and a Streak, creating one Session on the first Answer', async () => {
    const progress = useProgressStore()
    const round = useRoundStore()
    expect(round.startRound('practice', MONITORING)).toBe(true)
    expect(round.total).toBe(7)
    expect(progress.sessions).toHaveLength(0)

    const q1 = round.currentQuestion!
    round.setPicked([...q1.correct])
    expect(round.canSubmit).toBe(true)
    expect(await round.submit()).toBeNull()
    expect(round.showReveal).toBe(true)
    expect(round.round!.streak).toBe(1)
    expect(round.round!.lastGain).toBe(10)
    expect(progress.sessions).toHaveLength(1)
    expect(progress.sessions[0]!.mode).toBe('practice')
    expect(progress.answers.at(-1)).toMatchObject({ questionId: q1.id, correct: true, xp: 10 })

    expect(await round.advance()).toBeNull()
    expect(round.round!.index).toBe(1)
    expect(round.showReveal).toBe(false)
    const q2 = round.currentQuestion!
    round.setPicked([...q2.correct])
    await round.submit()
    expect(round.round!.streak).toBe(2)
    expect(round.round!.lastGain).toBe(12)
    expect(round.round!.xpGained).toBe(22)

    await round.advance()
    const q3 = round.currentQuestion!
    round.setPicked(wrongPick(q3))
    await round.submit()
    expect(round.round!.streak).toBe(0)
    expect(round.round!.bestStreak).toBe(2)
    expect(round.round!.lastGain).toBe(0)
    expect(progress.answers.at(-1)).toMatchObject({ questionId: q3.id, correct: false, xp: 0 })
    expect(progress.sessions).toHaveLength(1)
  })

  it('(c) end-of-round Feedback timing records silently and advances; finishing returns the Session id', async () => {
    const progress = useProgressStore()
    await progress.updatePreferences({ feedbackTiming: 'end-of-round' })
    const round = useRoundStore()
    round.startRound('practice', MONITORING)
    expect(round.revealsInstantly).toBe(false)

    for (let i = 0; i < 6; i++) {
      round.setPicked([...round.currentQuestion!.correct])
      expect(await round.submit()).toBeNull()
      expect(round.showReveal).toBe(false)
      expect(round.round!.index).toBe(i + 1)
    }
    round.setPicked([...round.currentQuestion!.correct])
    const sessionId = await round.submit()
    expect(sessionId).not.toBeNull()
    expect(round.round).toBeNull()
    const session = (await repository.getSessions()).find((s) => s.id === sessionId)!
    expect(session.status).toBe('completed')
    expect((await repository.getAnswers()).filter((a) => a.sessionId === sessionId)).toHaveLength(7)
  })

  it('(d) review Rounds always reveal, whatever the preference', async () => {
    await seedIncorrect('gov-001')
    setActivePinia(createPinia()) // fresh store so init() loads the seeded Answer
    const progress = useProgressStore()
    await progress.init()
    await progress.updatePreferences({ feedbackTiming: 'end-of-round' })
    const round = useRoundStore()
    expect(round.startRound('review', { kind: 'review' })).toBe(true)
    expect(round.total).toBe(1)
    expect(round.revealsInstantly).toBe(true)
    round.setPicked([...round.currentQuestion!.correct])
    await round.submit()
    expect(round.showReveal).toBe(true)
    expect(useProgressStore().deck).toHaveLength(0) // one correct Answer clears it
  })

  it('(e) a Sprint arms the Shot clock and a timeout records an incorrect Answer with the partial pick', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T10:00:00.000Z'))
    const progress = useProgressStore()
    const round = useRoundStore()
    round.startRound('sprint', MONITORING)
    expect(round.round!.shotClockDeadline).toBe(new Date(Date.now() + SHOT_CLOCK_MS).toISOString())

    await round.timeout()
    expect(round.showReveal).toBe(true)
    expect(round.round!.timedOut).toBe(true)
    expect(round.round!.lastCorrect).toBe(false)
    expect(round.round!.shotClockDeadline).toBeNull()
    expect(progress.answers.at(-1)).toMatchObject({ correct: false, selected: [], xp: 0 })

    await round.advance()
    expect(round.round!.timedOut).toBe(false)
    expect(round.round!.shotClockDeadline).toBe(new Date(Date.now() + SHOT_CLOCK_MS).toISOString())

    round.setPicked([...round.currentQuestion!.correct])
    await round.submit()
    expect(round.round!.lastGain).toBe(15) // base 10 + sprint 5, streak 1
  })

  it('(f) exit completes the Session mid-Round, and is a no-op before any Answer', async () => {
    const progress = useProgressStore()
    const round = useRoundStore()
    round.startRound('practice', MONITORING)
    await round.exit()
    expect(progress.sessions).toHaveLength(0)
    expect(round.round).toBeNull()

    round.startRound('practice', MONITORING)
    round.setPicked([...round.currentQuestion!.correct])
    await round.submit()
    await round.exit()
    expect(progress.sessions).toHaveLength(1)
    expect(progress.sessions[0]!.status).toBe('completed')
    expect(progress.sessions[0]!.endedAt).not.toBeNull()
    await round.exit() // idempotent
    expect(progress.sessions).toHaveLength(1)
  })

  it('(g) starting a new Round completes the Session the Round it replaces left open', async () => {
    const progress = useProgressStore()
    const round = useRoundStore()
    round.startRound('practice', MONITORING)
    round.setPicked([...round.currentQuestion!.correct])
    await round.submit()

    expect(round.startRound('practice', MONITORING)).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 0)) // let the detached finish land
    expect(progress.sessions).toHaveLength(1)
    expect(progress.sessions[0]!.status).toBe('completed')
    expect(progress.sessions[0]!.endedAt).not.toBeNull()
    expect(round.round).not.toBeNull()
    expect(round.round!.index).toBe(0)
    expect(round.round!.results).toHaveLength(0)
  })

  it('(h) togglePick replaces for single and toggles up to the pick count for multi', () => {
    const round = useRoundStore()
    round.startRound('practice', { kind: 'all' })
    const single = questionBank.find((q) => q.kind === 'single')!
    const multi = questionBank.find((q) => q.kind === 'multi' && q.correct.length === 2)!
    round.round!.questionIds = [single.id, multi.id]
    round.round!.index = 0
    round.togglePick('a'); round.togglePick('b')
    expect(round.round!.picked).toEqual(['b'])
    round.round!.index = 1; round.round!.picked = []
    round.togglePick('a'); round.togglePick('b'); round.togglePick('c')
    expect(round.round!.picked).toEqual(['a', 'b'])
    round.togglePick('a')
    expect(round.round!.picked).toEqual(['b'])
  })
})
