import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShotClock from '@/components/ShotClock.vue'

const START = Date.parse('2026-09-10T10:00:00.000Z')
const DURATION = 20_000

function mountClock() {
  return mount(ShotClock, { props: { deadline: new Date(START + DURATION).toISOString(), durationMs: DURATION } })
}
async function advance(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

describe('ShotClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(START)
  })
  afterEach(() => vi.useRealTimers())

  it('starts full and counts down from the wall clock', async () => {
    const wrapper = mountClock()
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:20')
    expect(wrapper.find('.shot-clock__fill').attributes('style')).toContain('width: 100%')
    expect(wrapper.attributes('role')).toBe('timer')

    await advance(5_000)
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:15')
    expect(wrapper.find('.shot-clock__fill').attributes('style')).toContain('width: 75%')
    expect(wrapper.classes()).not.toContain('shot-clock--low')
  })

  it('turns low at five seconds and emits expired exactly once at zero', async () => {
    const wrapper = mountClock()
    await advance(15_000)
    expect(wrapper.classes()).toContain('shot-clock--low')
    expect(wrapper.emitted('expired')).toBeUndefined()

    await advance(5_100)
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:00')
    expect(wrapper.emitted('expired')).toHaveLength(1)

    await advance(2_000)
    expect(wrapper.emitted('expired')).toHaveLength(1)
  })

  it('re-arms for the next Question so a new deadline expires once more', async () => {
    const wrapper = mountClock()
    await advance(20_000)
    expect(wrapper.emitted('expired')).toHaveLength(1)

    await wrapper.setProps({ deadline: new Date(Date.now() + DURATION).toISOString() })
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:20')
    expect(wrapper.emitted('expired')).toHaveLength(1)

    await advance(20_100)
    expect(wrapper.emitted('expired')).toHaveLength(2)

    await advance(2_000)
    expect(wrapper.emitted('expired')).toHaveLength(2)
  })
})
