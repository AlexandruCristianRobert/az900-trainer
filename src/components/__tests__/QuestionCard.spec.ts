import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Question } from '@/data/types'
import { TOPICS } from '@/data/types'
import QuestionCard from '@/components/QuestionCard.vue'

const single: Question = {
  id: 'cc-001',
  domain: 'cloud-concepts',
  topic: 'describe-cloud-computing',
  kind: 'single',
  stem: 'What is cloud computing?',
  options: [
    { id: 'a', text: 'Option A', explanation: 'Explanation A' },
    { id: 'b', text: 'Option B', explanation: 'Explanation B' },
    { id: 'c', text: 'Option C', explanation: 'Explanation C' },
    { id: 'd', text: 'Option D', explanation: 'Explanation D' },
  ],
  correct: ['b'],
  learnMore: 'https://learn.microsoft.com/azure/cloud-computing',
}

const multi: Question = {
  id: 'arch-001',
  domain: 'architecture-services',
  topic: 'compute-networking',
  kind: 'multi',
  stem: 'Select two compute services.',
  options: [
    { id: 'a', text: 'Option A', explanation: 'Explanation A' },
    { id: 'b', text: 'Option B', explanation: 'Explanation B' },
    { id: 'c', text: 'Option C', explanation: 'Explanation C' },
    { id: 'd', text: 'Option D', explanation: 'Explanation D' },
  ],
  correct: ['a', 'c'],
}

function inputId(question: Question, optionId: string): string {
  return `#${question.id}-${optionId}`
}

describe('QuestionCard rendering', () => {
  it('renders a radio per option for a single-answer question', () => {
    const wrapper = mount(QuestionCard, { props: { question: single, modelValue: [] } })
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(4)
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(0)
  })

  it('renders a checkbox per option for a multi-answer question', () => {
    const wrapper = mount(QuestionCard, { props: { question: multi, modelValue: [] } })
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(4)
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(0)
  })

  it('shows the stem inside the legend', () => {
    const wrapper = mount(QuestionCard, { props: { question: single, modelValue: [] } })
    expect(wrapper.find('legend').text()).toBe(single.stem)
  })

  it('shows the topic label and a domain-colored dot', () => {
    const wrapper = mount(QuestionCard, { props: { question: single, modelValue: [] } })
    expect(wrapper.text()).toContain(TOPICS['describe-cloud-computing'].label)
    expect(wrapper.find('.question-card__domain-dot--cloud').exists()).toBe(true)
  })

  it('shows the mono question id only when showQuestionId is set', () => {
    const withId = mount(QuestionCard, {
      props: { question: single, modelValue: [], showQuestionId: true },
    })
    expect(withId.text()).toContain('cc-001')

    const withoutId = mount(QuestionCard, { props: { question: single, modelValue: [] } })
    expect(withoutId.text()).not.toContain('cc-001')
  })

  it('shows a pick-count badge for multi questions, none for single', () => {
    const multiWrapper = mount(QuestionCard, { props: { question: multi, modelValue: [] } })
    expect(multiWrapper.text()).toContain('Pick 2')

    const singleWrapper = mount(QuestionCard, { props: { question: single, modelValue: [] } })
    expect(singleWrapper.text()).not.toContain('Pick')
  })

  it('gives all radios for a question the same shared name', () => {
    const wrapper = mount(QuestionCard, { props: { question: single, modelValue: [] } })
    const names = wrapper.findAll('input[type="radio"]').map((i) => i.attributes('name'))
    expect(names[0]).toBeTruthy()
    expect(new Set(names).size).toBe(1)
  })

  it('gives each option input a unique id', () => {
    const wrapper = mount(QuestionCard, { props: { question: multi, modelValue: [] } })
    const ids = wrapper.findAll('input').map((i) => i.attributes('id'))
    expect(new Set(ids).size).toBe(ids.length)
    expect(wrapper.find(inputId(multi, 'a')).exists()).toBe(true)
  })
})

describe('QuestionCard selection', () => {
  it('emits the clicked option id on radio click, replacing any prior selection', async () => {
    const wrapper = mount(QuestionCard, { props: { question: single, modelValue: ['a'] } })
    await wrapper.find(inputId(single, 'b')).setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[['b']]])
  })

  it('toggles a multi option on and off', async () => {
    const wrapper = mount(QuestionCard, { props: { question: multi, modelValue: [] } })
    await wrapper.find(inputId(multi, 'a')).setValue(true)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['a']])

    await wrapper.setProps({ modelValue: ['a'] })
    await wrapper.find(inputId(multi, 'a')).setValue(false)
    expect(wrapper.emitted('update:modelValue')![1]).toEqual([[]])
  })

  it('ignores additional checks once the pick count is reached, without emitting', async () => {
    const wrapper = mount(QuestionCard, { props: { question: multi, modelValue: ['a', 'c'] } })
    const extra = wrapper.find(inputId(multi, 'b'))
    await extra.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect((extra.element as HTMLInputElement).checked).toBe(false)
  })

  it('still allows unchecking when the pick count is already reached', async () => {
    const wrapper = mount(QuestionCard, { props: { question: multi, modelValue: ['a', 'c'] } })
    await wrapper.find(inputId(multi, 'a')).setValue(false)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['c']])
  })
})

describe('QuestionCard graded state', () => {
  it('does not show explanations or disable inputs when not graded', () => {
    const wrapper = mount(QuestionCard, { props: { question: single, modelValue: [] } })
    expect(wrapper.find('.option__explanation').exists()).toBe(false)
    wrapper.findAll('input').forEach((input) => {
      expect((input.element as HTMLInputElement).disabled).toBe(false)
    })
  })

  it('disables all inputs and shows every explanation when graded', () => {
    const wrapper = mount(QuestionCard, {
      props: { question: single, modelValue: ['a'], graded: true },
    })
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBe(4)
    inputs.forEach((input) => expect((input.element as HTMLInputElement).disabled).toBe(true))

    for (const option of single.options) {
      expect(wrapper.text()).toContain(option.explanation)
    }
  })

  it('marks the correct option and the wrongly-selected option', () => {
    const wrapper = mount(QuestionCard, {
      props: { question: single, modelValue: ['a'], graded: true },
    })
    const rows = wrapper.findAll('.option')
    expect(rows[0]!.classes()).toContain('option--incorrect') // selected, wrong
    expect(rows[0]!.classes()).not.toContain('option--correct')
    expect(rows[1]!.classes()).toContain('option--correct') // correct answer
    expect(rows[1]!.classes()).not.toContain('option--incorrect')
    expect(rows[2]!.classes()).not.toContain('option--correct')
    expect(rows[2]!.classes()).not.toContain('option--incorrect')
  })

  it('shows a Correct verdict when the selection matches, Incorrect otherwise', () => {
    const correctWrapper = mount(QuestionCard, {
      props: { question: single, modelValue: ['b'], graded: true },
    })
    expect(correctWrapper.text()).toContain('Correct')
    expect(correctWrapper.find('.question-card__verdict').classes()).toContain(
      'question-card__verdict--pass',
    )

    const wrongWrapper = mount(QuestionCard, {
      props: { question: single, modelValue: ['a'], graded: true },
    })
    expect(wrongWrapper.text()).toContain('Incorrect')
    expect(wrongWrapper.find('.question-card__verdict').classes()).toContain(
      'question-card__verdict--fail',
    )
  })

  it('renders a Learn More link only when graded and learnMore is present', () => {
    const withLink = mount(QuestionCard, {
      props: { question: single, modelValue: ['b'], graded: true },
    })
    const link = withLink.find('a.learn-more')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe(single.learnMore)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noreferrer')

    const noLearnMore: Question = { ...multi, learnMore: undefined }
    const withoutLink = mount(QuestionCard, {
      props: { question: noLearnMore, modelValue: ['a', 'c'], graded: true },
    })
    expect(withoutLink.find('a.learn-more').exists()).toBe(false)
  })

  it('does not render the Learn More link when not graded, even if present', () => {
    const wrapper = mount(QuestionCard, { props: { question: single, modelValue: [] } })
    expect(wrapper.find('a.learn-more').exists()).toBe(false)
  })
})
