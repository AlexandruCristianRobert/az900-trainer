import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ScoreScale from '@/components/ScoreScale.vue'

describe('ScoreScale', () => {
  it('sets the fill width from score/max, defaulting max to 1000', () => {
    const wrapper = mount(ScoreScale, { props: { score: 450 } })
    expect(wrapper.find('.score-scale__fill').attributes('style')).toContain('width: 45%')
  })

  it('recomputes the fill width against a custom max', () => {
    const wrapper = mount(ScoreScale, { props: { score: 30, max: 40 } })
    expect(wrapper.find('.score-scale__fill').attributes('style')).toContain('width: 75%')
  })

  it('positions the threshold line at threshold/max, defaulting to 70% (700/1000)', () => {
    const wrapper = mount(ScoreScale, { props: { score: 500 } })
    expect(wrapper.find('.score-scale__threshold').attributes('style')).toContain('left: 70%')
  })

  it('repositions the threshold line for a custom threshold/max', () => {
    const wrapper = mount(ScoreScale, { props: { score: 500, max: 40, threshold: 30 } })
    expect(wrapper.find('.score-scale__threshold').attributes('style')).toContain('left: 75%')
  })

  it('exposes an aria-label with the score, max and threshold on the root role=img', () => {
    const wrapper = mount(ScoreScale, { props: { score: 620, max: 1000, threshold: 700 } })
    const root = wrapper.find('[role="img"]')
    expect(root.exists()).toBe(true)
    expect(root.attributes('aria-label')).toBe('Estimated score 620 of 1000; pass line 700')
  })

  it('shows the default threshold label, mono-styled', () => {
    const wrapper = mount(ScoreScale, { props: { score: 500 } })
    expect(wrapper.text()).toContain('700 pass line')
  })

  it('accepts a custom threshold label', () => {
    const wrapper = mount(ScoreScale, {
      props: { score: 500, thresholdLabel: 'custom pass line' },
    })
    expect(wrapper.text()).toContain('custom pass line')
    expect(wrapper.text()).not.toContain('700 pass line')
  })

  it('renders the raw score value large', () => {
    const wrapper = mount(ScoreScale, { props: { score: 620 } })
    expect(wrapper.text()).toContain('620')
  })

  it('marks the fill as passing when score is at or above the threshold', () => {
    const atThreshold = mount(ScoreScale, { props: { score: 700, threshold: 700 } })
    expect(atThreshold.find('.score-scale__fill').classes()).toContain('score-scale__fill--pass')
    expect(atThreshold.find('.score-scale__fill').classes()).not.toContain('score-scale__fill--fail')

    const aboveThreshold = mount(ScoreScale, { props: { score: 900, threshold: 700 } })
    expect(aboveThreshold.find('.score-scale__fill').classes()).toContain('score-scale__fill--pass')
  })

  it('marks the fill as failing when score is below the threshold', () => {
    const wrapper = mount(ScoreScale, { props: { score: 699, threshold: 700 } })
    expect(wrapper.find('.score-scale__fill').classes()).toContain('score-scale__fill--fail')
    expect(wrapper.find('.score-scale__fill').classes()).not.toContain('score-scale__fill--pass')
  })
})
