import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXAM_DURATION_MS } from '@/domain/examBlueprint'
import ExamTimer from '@/components/ExamTimer.vue'

const START_MS = Date.parse('2026-08-27T10:00:00.000Z')
const SECOND = 1000
const MINUTE = 60 * SECOND

function deadlineIn(ms: number): string {
  return new Date(START_MS + ms).toISOString()
}

function mountTimer(remainingMs = EXAM_DURATION_MS) {
  return mount(ExamTimer, { props: { deadline: deadlineIn(remainingMs) } })
}

async function advance(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

function announcement(wrapper: VueWrapper): string {
  return wrapper.find('[aria-live="polite"]').text()
}

describe('ExamTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(START_MS)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the full 45:00 at the start of an exam', () => {
    expect(mountTimer().text()).toContain('45:00')
  })

  it('ticks down once a second, padding both fields', async () => {
    const wrapper = mountTimer(9 * MINUTE + 5 * SECOND)
    expect(wrapper.text()).toContain('09:05')

    await advance(SECOND)
    expect(wrapper.text()).toContain('09:04')

    await advance(4 * SECOND)
    expect(wrapper.text()).toContain('09:00')

    await advance(SECOND)
    expect(wrapper.text()).toContain('08:59')
  })

  it('recomputes from the clock, so it survives a time jump instead of drifting', async () => {
    const wrapper = mountTimer()

    // One interval tick, but ten minutes of wall clock passed (sleeping tab).
    await advance(10 * MINUTE)
    expect(wrapper.text()).toContain('35:00')
  })

  it('emits expired exactly once at zero and never again', async () => {
    const wrapper = mountTimer()

    await advance(EXAM_DURATION_MS - SECOND)
    expect(wrapper.text()).toContain('00:01')
    expect(wrapper.emitted('expired')).toBeUndefined()

    await advance(SECOND)
    expect(wrapper.text()).toContain('00:00')
    expect(wrapper.emitted('expired')).toHaveLength(1)

    await advance(30 * SECOND)
    expect(wrapper.text()).toContain('00:00')
    expect(wrapper.emitted('expired')).toHaveLength(1)
  })

  it('never renders a negative remaining time', async () => {
    const wrapper = mountTimer(30 * SECOND)
    await advance(2 * MINUTE)
    expect(wrapper.text()).toContain('00:00')
    expect(wrapper.text()).not.toContain('-')
  })

  it('announces the five-minute and one-minute marks exactly once each', async () => {
    const wrapper = mountTimer()
    expect(announcement(wrapper)).toBe('')

    await advance(EXAM_DURATION_MS - 5 * MINUTE - SECOND)
    expect(announcement(wrapper)).toBe('')

    await advance(SECOND)
    expect(announcement(wrapper)).toBe('5 minutes remaining')

    // Per-second ticks below the mark must not re-announce.
    await advance(SECOND)
    expect(announcement(wrapper)).toBe('5 minutes remaining')
    await advance(3 * MINUTE)
    expect(announcement(wrapper)).toBe('5 minutes remaining')

    await advance(MINUTE - SECOND)
    expect(announcement(wrapper)).toBe('1 minute remaining')

    await advance(SECOND)
    expect(announcement(wrapper)).toBe('1 minute remaining')
  })

  it('keeps the announcement out of sight', () => {
    const region = mountTimer().find('[aria-live="polite"]')
    expect(region.exists()).toBe(true)
    expect(region.classes()).toContain('visually-hidden')
  })

  it('marks the last five minutes as low, and only then', async () => {
    const wrapper = mountTimer(5 * MINUTE + SECOND)
    expect(wrapper.classes()).not.toContain('timer--low')

    await advance(SECOND)
    expect(wrapper.classes()).toContain('timer--low')
  })

  it('stops its interval on unmount', () => {
    const wrapper = mountTimer()
    expect(vi.getTimerCount()).toBeGreaterThan(0)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
