import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RoundProgress from '@/components/RoundProgress.vue'

describe('RoundProgress', () => {
  it('renders one segment per Question with pass/fail/current/todo states', () => {
    const wrapper = mount(RoundProgress, { props: { total: 5, index: 2, outcomes: [true, false], neutral: false } })
    const segs = wrapper.findAll('.seg')
    expect(segs).toHaveLength(5)
    expect(segs[0]!.classes()).toContain('seg--pass')
    expect(segs[1]!.classes()).toContain('seg--fail')
    expect(segs[2]!.classes()).toContain('seg--current')
    expect(segs[3]!.classes()).toContain('seg--todo')
    expect(segs[4]!.classes()).toContain('seg--todo')
    expect(wrapper.attributes('aria-valuenow')).toBe('2')
    expect(wrapper.attributes('aria-valuemax')).toBe('5')
  })

  it('hides verdicts behind a neutral done state in end-of-round mode', () => {
    const wrapper = mount(RoundProgress, { props: { total: 3, index: 2, outcomes: [true, false], neutral: true } })
    const segs = wrapper.findAll('.seg')
    expect(segs[0]!.classes()).toContain('seg--done')
    expect(segs[1]!.classes()).toContain('seg--done')
    expect(segs[0]!.classes()).not.toContain('seg--pass')
  })
})
