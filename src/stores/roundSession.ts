import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Question } from '@/data/types'
import type { Answer, RoundMode, Session } from '@/domain/entities'
import { drawRound, resolvePool, SHOT_CLOCK_MS, type PoolSpec } from '@/domain/roundBlueprint'
import { isCompleteSelection, isCorrect } from '@/domain/scoring'
import { xpForAnswer } from '@/domain/xp'
import { useProgressStore } from './progress'

export interface RoundResultEntry {
  questionId: string
  selected: string[]
  correct: boolean
  xp: number
}

/** In-memory only: a Round is never resumed (CONTEXT.md). */
export interface RoundState {
  sessionId: string | null
  mode: RoundMode
  pool: PoolSpec
  questionIds: string[]
  index: number
  picked: string[]
  graded: boolean
  results: RoundResultEntry[]
  streak: number
  bestStreak: number
  xpGained: number
  lastGain: number
  lastCorrect: boolean | null
  timedOut: boolean
  shotClockDeadline: string | null
}

export const useRoundStore = defineStore('roundSession', () => {
  const progress = useProgressStore()
  const round = ref<RoundState | null>(null)
  // Repository writes chain here so finish() can wait for them before closing the Session.
  let pending: Promise<void> = Promise.resolve()

  const currentQuestion = computed<Question | null>(() => {
    const r = round.value
    if (!r) return null
    return progress.questionById.get(r.questionIds[r.index] ?? '') ?? null
  })
  const total = computed(() => round.value?.questionIds.length ?? 0)
  const isLast = computed(() => round.value !== null && round.value.index >= total.value - 1)
  const canSubmit = computed(() => {
    const r = round.value
    const q = currentQuestion.value
    return r !== null && q !== null && !r.graded && isCompleteSelection(q, r.picked)
  })
  /** Practice honours Feedback timing; Sprint and Review always reveal (CONTEXT.md). */
  const revealsInstantly = computed(() => {
    const r = round.value
    return r === null || r.mode !== 'practice' || progress.preferences.feedbackTiming === 'instant'
  })
  const showReveal = computed(() => {
    const r = round.value
    return r !== null && r.graded && (revealsInstantly.value || r.timedOut)
  })

  function shotClockFor(mode: RoundMode): string | null {
    return mode === 'sprint' ? new Date(Date.now() + SHOT_CLOCK_MS).toISOString() : null
  }

  function startRound(mode: RoundMode, pool: PoolSpec): boolean {
    const questionIds = drawRound(resolvePool(progress.questions, progress.answers, pool), progress.answers)
    if (questionIds.length === 0) {
      round.value = null
      return false
    }
    round.value = {
      sessionId: null, mode, pool, questionIds, index: 0, picked: [], graded: false, results: [],
      streak: 0, bestStreak: 0, xpGained: 0, lastGain: 0, lastCorrect: null, timedOut: false,
      shotClockDeadline: shotClockFor(mode),
    }
    return true
  }

  function setPicked(optionIds: string[]): void {
    const r = round.value
    if (!r || r.graded) return
    r.picked = optionIds
  }

  function togglePick(optionId: string): void {
    const r = round.value
    const q = currentQuestion.value
    if (!r || !q || r.graded) return
    if (q.kind === 'single') {
      r.picked = [optionId]
    } else if (r.picked.includes(optionId)) {
      r.picked = r.picked.filter((id) => id !== optionId)
    } else if (r.picked.length < q.correct.length) {
      r.picked = [...r.picked, optionId]
    }
  }

  /** The Session is created on the FIRST Answer — no empty-session litter. */
  async function ensureSession(r: RoundState): Promise<string> {
    if (r.sessionId) return r.sessionId
    const now = new Date().toISOString()
    const session: Session = { id: crypto.randomUUID(), mode: r.mode, status: 'in-progress', startedAt: now, endedAt: null, exam: null }
    r.sessionId = session.id
    await progress.saveSession(session)
    return session.id
  }

  /** Grades synchronously (the screen updates now); the writes are queued. */
  function grade(r: RoundState, q: Question, timedOut: boolean): void {
    const selected = r.picked.slice()
    const correct = isCorrect(q, selected)
    const streak = correct ? r.streak + 1 : 0
    const xp = xpForAnswer(r.mode, correct, streak)
    r.results.push({ questionId: q.id, selected, correct, xp })
    r.streak = streak
    r.bestStreak = Math.max(r.bestStreak, streak)
    r.xpGained += xp
    r.lastGain = xp
    r.lastCorrect = correct
    r.timedOut = timedOut
    r.graded = true
    r.shotClockDeadline = null
    pending = pending.then(async () => {
      const sessionId = await ensureSession(r)
      const answer: Answer = {
        id: crypto.randomUUID(), sessionId, questionId: q.id, selected, correct,
        submittedAt: new Date().toISOString(), xp,
      }
      await progress.recordAnswers([answer])
    })
  }

  async function submit(): Promise<string | null> {
    const r = round.value
    const q = currentQuestion.value
    if (!r || !q || !canSubmit.value) return null
    grade(r, q, false)
    if (revealsInstantly.value) {
      await pending
      return null
    }
    return advance()
  }

  /** Sprint timeout: an incorrect Answer with whatever was picked, possibly nothing (ADR-0004). */
  async function timeout(): Promise<void> {
    const r = round.value
    const q = currentQuestion.value
    if (!r || !q || r.graded || r.mode !== 'sprint') return
    grade(r, q, true)
    await pending
  }

  async function advance(): Promise<string | null> {
    const r = round.value
    if (!r || !r.graded) return null
    if (r.index >= r.questionIds.length - 1) return finish()
    r.index += 1
    r.picked = []
    r.graded = false
    r.lastCorrect = null
    r.timedOut = false
    r.shotClockDeadline = shotClockFor(r.mode)
    await pending
    return null
  }

  async function finish(): Promise<string | null> {
    const r = round.value
    round.value = null
    if (!r) return null
    await pending
    const id = r.sessionId
    if (!id) return null
    const current = progress.sessions.find((s) => s.id === id)
    if (current && current.status === 'in-progress') {
      await progress.saveSession({ ...current, status: 'completed', endedAt: new Date().toISOString() })
    }
    return id
  }

  async function exit(): Promise<void> {
    await finish()
  }

  return {
    round, currentQuestion, total, isLast, canSubmit, revealsInstantly, showReveal,
    startRound, setPicked, togglePick, submit, timeout, advance, exit,
  }
})
