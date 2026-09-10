import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, sanitizePreferences } from '@/domain/preferences'

describe('sanitizePreferences', () => {
  it('returns defaults for garbage', () => {
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences('nope')).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences({ feedbackTiming: 'later', domain: 'mars' })).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences({ domain: 'toString' })).toEqual(DEFAULT_PREFERENCES)
  })

  it('keeps valid fields and defaults the rest', () => {
    expect(sanitizePreferences({ feedbackTiming: 'end-of-round' })).toEqual({ feedbackTiming: 'end-of-round', domain: 'all' })
    expect(sanitizePreferences({ domain: 'cloud-concepts' })).toEqual({ feedbackTiming: 'instant', domain: 'cloud-concepts' })
  })

  it('defaults to instant feedback and all domains', () => {
    expect(DEFAULT_PREFERENCES).toEqual({ feedbackTiming: 'instant', domain: 'all' })
  })
})
