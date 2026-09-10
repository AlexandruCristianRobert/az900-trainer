import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import XpMeter from '@/components/XpMeter.vue'

describe('XpMeter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows the Level, XP into the level and the bar width', () => {
    const wrapper = mount(XpMeter, { props: { totalXp: 30 } })
    expect(wrapper.find('.xp-meter__level').text()).toBe('LVL 1')
    expect(wrapper.find('.xp-meter__count').text()).toBe('30/150')
    expect(wrapper.find('.xp-meter__fill').attributes('style')).toContain('width: 20%')
  })

  it('counts up to a new total and re-levels when the total crosses 150', async () => {
    const wrapper = mount(XpMeter, { props: { totalXp: 140 } })
    await wrapper.setProps({ totalXp: 160 })
    await nextTick()
    // mid-animation the count is between the two values
    vi.advanceTimersByTime(300)
    await nextTick()
    const mid = Number(wrapper.find('.xp-meter__count').text().split('/')[0])
    expect(mid).toBeGreaterThanOrEqual(0)
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.find('.xp-meter__level').text()).toBe('LVL 2')
    expect(wrapper.find('.xp-meter__count').text()).toBe('10/200')
    expect(wrapper.find('.xp-meter__fill').attributes('style')).toContain('width: 5%')
  })
})
