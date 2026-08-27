import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Question } from '@/data/types'
import { useProgressStore } from '../progress'
import { usePracticeStore } from '../practiceSession'

function wrongSelection(question: Question): string[] {
  const wrong = question.options.find((o) => !question.correct.includes(o.id))!
  return [wrong.id]
}

describe('practice session store', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const progress = useProgressStore()
    await progress.init()
  })

  it('(a) begin then no submit leaves zero sessions persisted', async () => {
    const progress = useProgressStore()
    const practice = usePracticeStore()

    practice.begin('practice')

    expect(practice.sessionId).toBeNull()
    expect(practice.mode).toBe('practice')
    expect(progress.sessions).toEqual([])
  })

  it('(b) first submitAnswer creates exactly one in-progress Session with the right mode and records a graded Answer (correct and incorrect)', async () => {
    const progress = useProgressStore()
    const practice = usePracticeStore()

    practice.begin('practice')
    const q1 = questionBank[0]!
    const answer1 = await practice.submitAnswer(q1, [...q1.correct])

    expect(progress.sessions).toHaveLength(1)
    const session1 = progress.sessions[0]!
    expect(session1.id).toBe(practice.sessionId)
    expect(session1.mode).toBe('practice')
    expect(session1.status).toBe('in-progress')
    expect(session1.exam).toBeNull()
    expect(answer1.sessionId).toBe(session1.id)
    expect(answer1.questionId).toBe(q1.id)
    expect(answer1.correct).toBe(true)
    expect(progress.answers).toContainEqual(answer1)

    practice.begin('review')
    const q2 = questionBank[1]!
    const answer2 = await practice.submitAnswer(q2, wrongSelection(q2))

    expect(progress.sessions).toHaveLength(2)
    const session2 = progress.sessions.find((s) => s.id === practice.sessionId)!
    expect(session2.mode).toBe('review')
    expect(session2.status).toBe('in-progress')
    expect(answer2.sessionId).toBe(session2.id)
    expect(answer2.correct).toBe(false)
  })

  it('(c) two submits share one sessionId', async () => {
    const progress = useProgressStore()
    const practice = usePracticeStore()

    practice.begin('practice')
    const q1 = questionBank[0]!
    const q2 = questionBank[1]!

    const answer1 = await practice.submitAnswer(q1, [...q1.correct])
    const firstSessionId = practice.sessionId
    const answer2 = await practice.submitAnswer(q2, [...q2.correct])

    expect(practice.sessionId).toBe(firstSessionId)
    expect(answer1.sessionId).toBe(firstSessionId)
    expect(answer2.sessionId).toBe(firstSessionId)
    expect(progress.sessions).toHaveLength(1)
  })

  it('(d) finish completes the session; finish without a session is a no-op', async () => {
    const progress = useProgressStore()
    const practice = usePracticeStore()

    // finish with no session ever created: no-op.
    await practice.finish()
    expect(progress.sessions).toEqual([])
    expect(practice.sessionId).toBeNull()

    practice.begin('practice')
    const q1 = questionBank[0]!
    await practice.submitAnswer(q1, [...q1.correct])
    const sessionId = practice.sessionId!

    await practice.finish()

    const completed = progress.sessions.find((s) => s.id === sessionId)!
    expect(completed.status).toBe('completed')
    expect(completed.endedAt).not.toBeNull()
    expect(practice.sessionId).toBeNull()

    // finish again after a fresh begin() (no submit): no-op, no new session, prior session untouched.
    practice.begin('practice')
    await practice.finish()
    expect(progress.sessions).toHaveLength(1)
    expect(progress.sessions[0]!.id).toBe(sessionId)
  })

  it('(e) an incorrect practice Answer puts the Question into progress.deck; a later correct one removes it', async () => {
    const progress = useProgressStore()
    const practice = usePracticeStore()

    const q = questionBank[0]!

    practice.begin('practice')
    await practice.submitAnswer(q, wrongSelection(q))

    expect(progress.deck.map((d) => d.id)).toContain(q.id)

    await practice.submitAnswer(q, [...q.correct])

    expect(progress.deck.map((d) => d.id)).not.toContain(q.id)
  })
})
