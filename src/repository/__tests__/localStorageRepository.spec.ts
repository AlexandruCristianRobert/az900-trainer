import { beforeEach, describe, it, expect } from 'vitest'
import type { Answer, Session } from '@/domain/entities'
import { LocalStorageRepository } from '../LocalStorageRepository'
import type { StudyRepository } from '../StudyRepository'

const STORAGE_KEY = 'az900-trainer/progress/v1'

describe('LocalStorageRepository', () => {
  let repository: StudyRepository

  beforeEach(() => {
    localStorage.clear()
    repository = new LocalStorageRepository()
  })

  describe('getQuestions', () => {
    it('returns the full question bank (≥ 90 questions)', async () => {
      const questions = await repository.getQuestions()
      expect(questions.length).toBeGreaterThanOrEqual(90)
    })

    it('returns Question objects with required fields', async () => {
      const questions = await repository.getQuestions()
      expect(questions[0]).toHaveProperty('id')
      expect(questions[0]).toHaveProperty('domain')
      expect(questions[0]).toHaveProperty('topic')
      expect(questions[0]).toHaveProperty('stem')
      expect(questions[0]).toHaveProperty('options')
      expect(questions[0]).toHaveProperty('correct')
    })
  })

  describe('Sessions', () => {
    it('round-trips a session via saveSession and getSessions', async () => {
      const session: Session = {
        id: 'session-1',
        mode: 'practice',
        status: 'in-progress',
        startedAt: '2026-08-27T00:00:00Z',
        endedAt: null,
        exam: null,
      }

      await repository.saveSession(session)
      const sessions = await repository.getSessions()

      expect(sessions).toHaveLength(1)
      expect(sessions[0]).toEqual(session)
    })

    it('round-trips a session via getSession', async () => {
      const session: Session = {
        id: 'session-1',
        mode: 'exam',
        status: 'completed',
        startedAt: '2026-08-27T00:00:00Z',
        endedAt: '2026-08-27T01:00:00Z',
        exam: {
          deadline: '2026-08-27T02:00:00Z',
          questionIds: ['q1', 'q2'],
          selections: { q1: ['a'], q2: ['b', 'c'] },
        },
      }

      await repository.saveSession(session)
      const retrieved = await repository.getSession('session-1')

      expect(retrieved).toEqual(session)
    })

    it('upserts sessions by id (save same id twice → one session, updated fields)', async () => {
      const session1: Session = {
        id: 'session-1',
        mode: 'practice',
        status: 'in-progress',
        startedAt: '2026-08-27T00:00:00Z',
        endedAt: null,
        exam: null,
      }

      const session1Updated: Session = {
        id: session1.id,
        mode: session1.mode,
        status: 'completed',
        startedAt: session1.startedAt,
        endedAt: '2026-08-27T01:00:00Z',
        exam: session1.exam,
      }

      await repository.saveSession(session1)
      await repository.saveSession(session1Updated)

      const sessions = await repository.getSessions()
      expect(sessions).toHaveLength(1)
      expect(sessions[0]!.status).toBe('completed')
      expect(sessions[0]!.endedAt).toBe('2026-08-27T01:00:00Z')
    })

    it('returns null for missing session', async () => {
      const result = await repository.getSession('non-existent')
      expect(result).toBeNull()
    })

    it('returns empty array when no sessions exist', async () => {
      const sessions = await repository.getSessions()
      expect(sessions).toEqual([])
    })
  })

  describe('Answers', () => {
    it('appends answer batches cumulatively', async () => {
      const batch1: Answer[] = [
        {
          id: 'answer-1',
          sessionId: 'session-1',
          questionId: 'q1',
          selected: ['a'],
          correct: true,
          submittedAt: '2026-08-27T00:00:00Z',
        },
      ]

      const batch2: Answer[] = [
        {
          id: 'answer-2',
          sessionId: 'session-1',
          questionId: 'q2',
          selected: ['b'],
          correct: false,
          submittedAt: '2026-08-27T00:01:00Z',
        },
      ]

      await repository.saveAnswers(batch1)
      await repository.saveAnswers(batch2)

      const answers = await repository.getAnswers()
      expect(answers).toHaveLength(2)
      expect(answers[0]!.id).toBe('answer-1')
      expect(answers[1]!.id).toBe('answer-2')
    })

    it('saveAnswers([]) is a no-op', async () => {
      const answer: Answer = {
        id: 'answer-1',
        sessionId: 'session-1',
        questionId: 'q1',
        selected: ['a'],
        correct: true,
        submittedAt: '2026-08-27T00:00:00Z',
      }

      await repository.saveAnswers([answer])
      const initialCount = (await repository.getAnswers()).length

      await repository.saveAnswers([])
      const finalCount = (await repository.getAnswers()).length

      expect(initialCount).toBe(1)
      expect(finalCount).toBe(1)
    })

    it('returns empty array when no answers exist', async () => {
      const answers = await repository.getAnswers()
      expect(answers).toEqual([])
    })
  })

  describe('replaceAll', () => {
    it('replaces both sessions and answers wholesale', async () => {
      // Add some initial data
      const session1: Session = {
        id: 'session-1',
        mode: 'practice',
        status: 'in-progress',
        startedAt: '2026-08-27T00:00:00Z',
        endedAt: null,
        exam: null,
      }

      await repository.saveSession(session1)

      const answer1: Answer = {
        id: 'answer-1',
        sessionId: 'session-1',
        questionId: 'q1',
        selected: ['a'],
        correct: true,
        submittedAt: '2026-08-27T00:00:00Z',
      }

      await repository.saveAnswers([answer1])

      // Replace with new data
      const newSession: Session = {
        id: 'session-2',
        mode: 'exam',
        status: 'completed',
        startedAt: '2026-08-27T10:00:00Z',
        endedAt: '2026-08-27T11:00:00Z',
        exam: null,
      }

      const newAnswer: Answer = {
        id: 'answer-2',
        sessionId: 'session-2',
        questionId: 'q2',
        selected: ['b'],
        correct: false,
        submittedAt: '2026-08-27T10:00:00Z',
      }

      await repository.replaceAll([newSession], [newAnswer])

      const sessions = await repository.getSessions()
      const answers = await repository.getAnswers()

      expect(sessions).toHaveLength(1)
      expect(sessions[0]!.id).toBe('session-2')
      expect(answers).toHaveLength(1)
      expect(answers[0]!.id).toBe('answer-2')
    })

    it('replaceAll([], []) empties both sessions and answers', async () => {
      const session: Session = {
        id: 'session-1',
        mode: 'practice',
        status: 'in-progress',
        startedAt: '2026-08-27T00:00:00Z',
        endedAt: null,
        exam: null,
      }

      await repository.saveSession(session)

      const answer: Answer = {
        id: 'answer-1',
        sessionId: 'session-1',
        questionId: 'q1',
        selected: ['a'],
        correct: true,
        submittedAt: '2026-08-27T00:00:00Z',
      }

      await repository.saveAnswers([answer])

      await repository.replaceAll([], [])

      const sessions = await repository.getSessions()
      const answers = await repository.getAnswers()

      expect(sessions).toEqual([])
      expect(answers).toEqual([])
    })
  })

  describe('Corruption handling', () => {
    it('returns empty arrays when JSON is corrupt', async () => {
      localStorage.setItem(STORAGE_KEY, '{oops')

      const sessions = await repository.getSessions()
      const answers = await repository.getAnswers()

      expect(sessions).toEqual([])
      expect(answers).toEqual([])
    })

    it('returns empty arrays when version is wrong', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 2,
        sessions: [],
        answers: [],
      }))

      const sessions = await repository.getSessions()
      const answers = await repository.getAnswers()

      expect(sessions).toEqual([])
      expect(answers).toEqual([])
    })

    it('returns empty arrays when sessions is not an array', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        sessions: 'not-an-array',
        answers: [],
      }))

      const sessions = await repository.getSessions()
      expect(sessions).toEqual([])
    })

    it('returns empty arrays when answers is not an array', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        sessions: [],
        answers: 'not-an-array',
      }))

      const answers = await repository.getAnswers()
      expect(answers).toEqual([])
    })

    it('does not throw when reading corrupt data', async () => {
      localStorage.setItem(STORAGE_KEY, '{invalid json')

      await expect(repository.getSessions()).resolves.toEqual([])
      await expect(repository.getAnswers()).resolves.toEqual([])
      await expect(repository.getSession('any-id')).resolves.toBeNull()
    })
  })
})
