import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Question } from '@/data/types'
import { repository } from '@/repository'
import { routes } from '@/router'
import { useProgressStore } from '@/stores/progress'

/** Hosts the real RouterView so PracticeView mounts exactly as the app mounts it. */
const RouterHost = defineComponent({
  name: 'RouterHost',
  setup: () => () => h(RouterView),
})

interface Harness {
  wrapper: VueWrapper
  router: Router
}

async function mountPracticeRoute(): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useProgressStore().init()

  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push('/practice')
  await router.isReady()

  const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
  await nextTick()
  return { wrapper, router }
}

/**
 * Yields a real event-loop turn and flushes Vue's render queue, so awaited store
 * writes (which chain multiple internal awaits) and the re-render have all landed.
 */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

function findButton(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === label)
  if (!button) throw new Error(`No button labelled "${label}"`)
  return button
}

function questionById(id: string): Question {
  const question = questionBank.find((q) => q.id === id)
  if (!question) throw new Error(`Unknown question id ${id}`)
  return question
}

async function selectDomainAndTopic(wrapper: VueWrapper, domain: string, topic: string): Promise<void> {
  await wrapper.find('#practice-domain').setValue(domain)
  await wrapper.find('#practice-topic').setValue(topic)
}

/** Fills in every correct option for the given question (works for single and multi). */
async function answerCorrectly(wrapper: VueWrapper, question: Question): Promise<void> {
  for (const optionId of question.correct) {
    await wrapper.find(`#${question.id}-${optionId}`).setValue(true)
  }
}

const MONITORING_TOOLS = questionBank.filter((q) => q.topic === 'monitoring-tools')

describe('PracticeView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('(a) narrows the question count by domain and topic, keeping Start enabled', async () => {
    const { wrapper } = await mountPracticeRoute()

    expect(wrapper.text()).toContain('Practice')
    // Topic select is disabled until a domain is chosen.
    expect(wrapper.find('#practice-topic').attributes('disabled')).toBeDefined()

    await selectDomainAndTopic(wrapper, 'management-governance', 'monitoring-tools')
    await nextTick()

    expect(MONITORING_TOOLS).toHaveLength(7)
    expect(wrapper.text()).toContain(`${MONITORING_TOOLS.length} questions match`)
    expect(findButton(wrapper, 'Start practicing').attributes('disabled')).toBeUndefined()
  })

  it('resets the topic back to "All topics" when the domain changes', async () => {
    const { wrapper } = await mountPracticeRoute()

    await selectDomainAndTopic(wrapper, 'management-governance', 'monitoring-tools')
    await nextTick()
    expect((wrapper.find('#practice-topic').element as HTMLSelectElement).value).toBe(
      'monitoring-tools',
    )

    await wrapper.find('#practice-domain').setValue('cloud-concepts')
    await nextTick()
    expect((wrapper.find('#practice-topic').element as HTMLSelectElement).value).toBe('')
  })

  it('(b) runs a full practice session on the 7-question monitoring-tools topic through to the summary', async () => {
    const { wrapper } = await mountPracticeRoute()

    await selectDomainAndTopic(wrapper, 'management-governance', 'monitoring-tools')
    await nextTick()
    await findButton(wrapper, 'Start practicing').trigger('click')
    await settle()

    expect(wrapper.text()).toContain(`Question 1 of ${MONITORING_TOOLS.length}`)
    expect(wrapper.text()).toContain('0 correct so far')

    // Answer the first question and check its graded state on its own, unconditionally.
    const firstQuestion = questionById(wrapper.find('.question-card__id').text())
    await answerCorrectly(wrapper, firstQuestion)
    expect(findButton(wrapper, 'Check answer').attributes('disabled')).toBeUndefined()
    await findButton(wrapper, 'Check answer').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('1 correct so far')
    expect(wrapper.find('.question-card__verdict--pass').exists()).toBe(true)
    // The graded card is final — no re-answering.
    expect(hasButton(wrapper, 'Check answer')).toBe(false)

    await findButton(wrapper, 'Next question').trigger('click')
    await settle()

    // Answer the rest, straight through to the summary.
    for (let i = 1; i < MONITORING_TOOLS.length; i++) {
      const questionId = wrapper.find('.question-card__id').text()
      const question = questionById(questionId)

      await answerCorrectly(wrapper, question)
      await findButton(wrapper, 'Check answer').trigger('click')
      await settle()

      const isLast = i === MONITORING_TOOLS.length - 1
      await findButton(wrapper, isLast ? 'See summary' : 'Next question').trigger('click')
      await settle()
    }

    expect(wrapper.text()).toContain(`${MONITORING_TOOLS.length} of ${MONITORING_TOOLS.length} correct`)
    expect(wrapper.text()).toContain('100% accuracy')

    const sessions = await repository.getSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]!.mode).toBe('practice')
    expect(sessions[0]!.status).toBe('completed')

    const answers = await repository.getAnswers()
    expect(answers).toHaveLength(MONITORING_TOOLS.length)
  })

  it('(c) leaving mid-run completes the practice session in the repository', async () => {
    const { wrapper, router } = await mountPracticeRoute()

    await selectDomainAndTopic(wrapper, 'management-governance', 'monitoring-tools')
    await nextTick()
    await findButton(wrapper, 'Start practicing').trigger('click')
    await settle()

    const firstQuestion = questionById(wrapper.find('.question-card__id').text())
    await answerCorrectly(wrapper, firstQuestion)
    await findButton(wrapper, 'Check answer').trigger('click')
    await settle()

    // Only 1 of 7 Questions answered; leaving the view still finishes the Session.
    await router.push('/')
    await settle()

    const sessions = await repository.getSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]!.mode).toBe('practice')
    expect(sessions[0]!.status).toBe('completed')
    expect(sessions[0]!.endedAt).not.toBeNull()

    const answers = await repository.getAnswers()
    expect(answers).toHaveLength(1)
  })
})

function hasButton(wrapper: VueWrapper, label: string): boolean {
  return wrapper.findAll('button').some((candidate) => candidate.text() === label)
}
