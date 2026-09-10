import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import {
  domainStats,
  examHistory,
  reviewDeck,
  topicStats,
  type DomainStats,
  type ExamHistoryEntry,
  type TopicStats,
} from '@/domain/analytics'
import { DEFAULT_PREFERENCES, type Preferences } from '@/domain/preferences'
import { finalizeExamAnswers } from '@/domain/scoring'
import { bestStreak as bestStreakOf, levelOf, totalXp as totalXpOf, type LevelProgress } from '@/domain/xp'
import { repository } from '@/repository'

interface ExportedProgress {
  version: 1
  sessions: Session[]
  answers: Answer[]
}

function isExportedProgress(value: unknown): value is ExportedProgress {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return candidate.version === 1 && Array.isArray(candidate.sessions) && Array.isArray(candidate.answers)
}

export const useProgressStore = defineStore('progress', () => {
  const ready = ref(false)
  const questions = ref<Question[]>([])
  const sessions = ref<Session[]>([])
  const answers = ref<Answer[]>([])
  const preferences = ref<Preferences>({ ...DEFAULT_PREFERENCES })
  /** Set when a repository write rejected; the UI shows a "couldn't save" notice. */
  const saveFailed = ref(false)

  const totalXp = computed<number>(() => totalXpOf(answers.value))
  const level = computed<LevelProgress>(() => levelOf(totalXp.value))
  const bestStreak = computed<number>(() => bestStreakOf(sessions.value, answers.value))

  const questionById = computed<Map<string, Question>>(
    () => new Map(questions.value.map((q) => [q.id, q])),
  )
  const inProgressExam = computed<Session | null>(
    () => sessions.value.find((s) => s.mode === 'exam' && s.status === 'in-progress') ?? null,
  )
  const topics = computed<TopicStats[]>(() => topicStats(questions.value, answers.value))
  const domains = computed<DomainStats[]>(() => domainStats(questions.value, answers.value))
  const weakAreas = computed<TopicStats[]>(() => topics.value.filter((t) => t.verdict === 'weak'))
  const deck = computed<Question[]>(() => reviewDeck(questions.value, answers.value))
  const history = computed<ExamHistoryEntry[]>(() => examHistory(sessions.value, answers.value))

  /**
   * Lazy finalization (CONTEXT.md): completes stranded non-exam Sessions and
   * expires overdue exam Sessions before anything reads history. Order matters —
   * the terminal session status is written BEFORE its Answers so a crash can
   * never double-write Answers.
   */
  async function sweepStrandedSessions(): Promise<void> {
    const now = new Date().toISOString()
    const bank = new Map((await repository.getQuestions()).map((q) => [q.id, q]))
    for (const session of await repository.getSessions()) {
      if (session.status !== 'in-progress') continue
      if (session.mode !== 'exam') {
        // Answers were already written incrementally; the container just closes.
        await repository.saveSession({ ...session, status: 'completed', endedAt: now })
      } else if (session.exam && session.exam.deadline <= now) {
        const expired: Session = { ...session, status: 'expired', endedAt: session.exam.deadline }
        await repository.saveSession(expired)
        await repository.saveAnswers(finalizeExamAnswers(expired, bank, session.exam.deadline))
      }
    }
  }

  async function reloadCaches(): Promise<void> {
    questions.value = await repository.getQuestions()
    sessions.value = await repository.getSessions()
    answers.value = await repository.getAnswers()
    preferences.value = await repository.getPreferences()
  }

  async function init(): Promise<void> {
    if (ready.value) return
    await sweepStrandedSessions()
    await reloadCaches()
    ready.value = true
  }

  /**
   * Optimistic: the cache changes first so the screen updates immediately; the
   * repository write follows. A rejected write flags `saveFailed` instead of
   * throwing — a learner must never be stranded on a graded Question.
   */
  async function saveSession(session: Session): Promise<void> {
    const index = sessions.value.findIndex((s) => s.id === session.id)
    if (index === -1) sessions.value.push(session)
    else sessions.value[index] = session
    try {
      await repository.saveSession(session)
    } catch {
      saveFailed.value = true
    }
  }

  async function recordAnswers(newAnswers: Answer[]): Promise<void> {
    answers.value.push(...newAnswers)
    try {
      await repository.saveAnswers(newAnswers)
    } catch {
      saveFailed.value = true
    }
  }

  function dismissSaveFailure(): void {
    saveFailed.value = false
  }

  async function updatePreferences(patch: Partial<Preferences>): Promise<void> {
    preferences.value = { ...preferences.value, ...patch }
    try {
      await repository.savePreferences(preferences.value)
    } catch {
      saveFailed.value = true
    }
  }

  function exportProgress(): string {
    return JSON.stringify({ version: 1, sessions: sessions.value, answers: answers.value }, null, 2)
  }

  async function importProgress(json: string): Promise<void> {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new Error('Invalid progress file')
    }
    if (!isExportedProgress(parsed)) throw new Error('Invalid progress file')

    await repository.replaceAll(parsed.sessions, parsed.answers)
    // Same lazy finalization init runs at load: an imported in-progress exam
    // that's already past its deadline is expired immediately, not left stale
    // until the next full app load.
    await sweepStrandedSessions()
    await reloadCaches()
    ready.value = true
  }

  async function resetProgress(): Promise<void> {
    await repository.replaceAll([], [])
    await reloadCaches()
    ready.value = true
  }

  return {
    ready,
    questions,
    sessions,
    answers,
    preferences,
    saveFailed,
    totalXp,
    level,
    bestStreak,
    questionById,
    inProgressExam,
    topics,
    domains,
    weakAreas,
    deck,
    history,
    init,
    saveSession,
    recordAnswers,
    updatePreferences,
    dismissSaveFailure,
    exportProgress,
    importProgress,
    resetProgress,
  }
})
