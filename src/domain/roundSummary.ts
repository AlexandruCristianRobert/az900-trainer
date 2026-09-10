import type { Answer, Session } from './entities'
import { levelOf, longestStreak, totalXp } from './xp'

export interface RoundSummary {
  session: Session
  answers: Answer[]
  total: number
  correctCount: number
  accuracyPercent: number
  xpGained: number
  bestStreak: number
  xpBefore: number
  levelBefore: number
  levelAfter: number
  leveledUp: boolean
  headline: 'Perfect round!' | 'Round complete' | 'Keep at it'
}

const COMPLETE_THRESHOLD = 0.7

/** Everything the Round results page shows, rebuilt from the Session and the Answer log. */
export function summarizeRound(session: Session, allAnswers: Answer[]): RoundSummary {
  const answers: Answer[] = []
  const outside: Answer[] = []
  for (const answer of allAnswers) (answer.sessionId === session.id ? answers : outside).push(answer)

  const total = answers.length
  const correctCount = answers.filter((a) => a.correct).length
  const xpGained = totalXp(answers)
  const xpBefore = totalXp(outside)
  const levelBefore = levelOf(xpBefore).level
  const levelAfter = levelOf(xpBefore + xpGained).level
  const ratio = total === 0 ? 0 : correctCount / total

  return {
    session,
    answers,
    total,
    correctCount,
    accuracyPercent: Math.round(ratio * 100),
    xpGained,
    bestStreak: longestStreak(answers),
    xpBefore,
    levelBefore,
    levelAfter,
    leveledUp: levelAfter > levelBefore,
    headline: total > 0 && correctCount === total ? 'Perfect round!' : ratio >= COMPLETE_THRESHOLD ? 'Round complete' : 'Keep at it',
  }
}
