import type { Answer, Session, SessionMode } from './entities'

export const BASE_XP = 10
export const STREAK_STEP_XP = 2
export const STREAK_BONUS_CAP_XP = 10
export const SPRINT_BONUS_XP = 5
export const FIRST_LEVEL_XP = 150
export const LEVEL_STEP_XP = 50

export interface LevelProgress {
  level: number
  /** XP earned inside the current level. */
  into: number
  /** XP the current level needs in total to step up. */
  need: number
}

/**
 * XP an Answer earns, fixed at submission (ADR-0005). `streak` is the count of
 * consecutive correct Answers INCLUDING this one (1 for the first correct).
 * Exam Answers all share a timestamp, so a streak there is meaningless: flat base.
 */
export function xpForAnswer(mode: SessionMode, correct: boolean, streak: number): number {
  if (!correct) return 0
  if (mode === 'exam') return BASE_XP
  const streakBonus = Math.min(STREAK_STEP_XP * Math.max(streak - 1, 0), STREAK_BONUS_CAP_XP)
  return BASE_XP + streakBonus + (mode === 'sprint' ? SPRINT_BONUS_XP : 0)
}

/** 150 XP for the first step up, 50 more for each step after (CONTEXT.md: Level). */
export function levelOf(total: number): LevelProgress {
  let level = 1
  let need = FIRST_LEVEL_XP
  let into = Math.max(0, total)
  while (into >= need) {
    into -= need
    level += 1
    need = FIRST_LEVEL_XP + LEVEL_STEP_XP * (level - 1)
  }
  return { level, into, need }
}

/** Legacy Answers (no xp field) count as zero; dangling Answers still count — earned is earned. */
export function totalXp(answers: Answer[]): number {
  let sum = 0
  for (const answer of answers) sum += answer.xp ?? 0
  return sum
}

export function longestStreak(answersInOrder: Answer[]): number {
  let best = 0
  let run = 0
  for (const answer of answersInOrder) {
    run = answer.correct ? run + 1 : 0
    if (run > best) best = run
  }
  return best
}

/** Best Streak ever, read off the Answer log per Round (array order = submission order). */
export function bestStreak(sessions: Session[], answers: Answer[]): number {
  const modeById = new Map(sessions.map((s) => [s.id, s.mode]))
  const bySession = new Map<string, Answer[]>()
  for (const answer of answers) {
    const mode = modeById.get(answer.sessionId)
    if (!mode || mode === 'exam') continue
    const list = bySession.get(answer.sessionId)
    if (list) list.push(answer)
    else bySession.set(answer.sessionId, [answer])
  }
  let best = 0
  for (const list of bySession.values()) best = Math.max(best, longestStreak(list))
  return best
}
