import { DOMAINS, type DomainId } from '@/data/types'

/** When a Practice Round reveals (CONTEXT.md: Feedback timing). */
export type FeedbackTiming = 'instant' | 'end-of-round'
export type DomainChoice = DomainId | 'all'

/** Per-device UI preferences — never part of the progress export, never cleared by reset. */
export interface Preferences {
  feedbackTiming: FeedbackTiming
  domain: DomainChoice
}

export const DEFAULT_PREFERENCES: Preferences = { feedbackTiming: 'instant', domain: 'all' }

function isFeedbackTiming(value: unknown): value is FeedbackTiming {
  return value === 'instant' || value === 'end-of-round'
}

function isDomainChoice(value: unknown): value is DomainChoice {
  // hasOwn, not `in`: `in` would accept Object.prototype keys ('toString', '__proto__') as Domain ids.
  return value === 'all' || (typeof value === 'string' && Object.hasOwn(DOMAINS, value))
}

export function sanitizePreferences(value: unknown): Preferences {
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_PREFERENCES }
  const candidate = value as Record<string, unknown>
  return {
    feedbackTiming: isFeedbackTiming(candidate.feedbackTiming) ? candidate.feedbackTiming : DEFAULT_PREFERENCES.feedbackTiming,
    domain: isDomainChoice(candidate.domain) ? candidate.domain : DEFAULT_PREFERENCES.domain,
  }
}
