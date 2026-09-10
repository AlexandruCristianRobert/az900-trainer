import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { questionBank } from '@/data/questions'
import type { DomainId, Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import { repository } from '@/repository'
import { routes } from '@/router'
import { useProgressStore } from '@/stores/progress'

const realSetTimeout = globalThis.setTimeout

const RouterHost = defineComponent({ name: 'RouterHost', setup: () => () => h(RouterView) })

interface Harness { wrapper: VueWrapper; router: Router }

async function mountRoute(path: string): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useProgressStore().init()
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
  await nextTick()
  return { wrapper, router }
}

async function mountRouteRemembering(path: string, domain: DomainId): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const progress = useProgressStore()
  await progress.init()
  await progress.updatePreferences({ domain })
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
  await nextTick()
  return { wrapper, router }
}

/** The first `.eyebrow` in the Round is the Pool label. */
function poolLabelOf(wrapper: VueWrapper): string {
  return wrapper.find('.eyebrow').text()
}

async function settle(): Promise<void> {
  await new Promise((resolve) => realSetTimeout(resolve, 0))
  await nextTick()
}

async function waitForPath(router: Router, prefix: string): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (router.currentRoute.value.fullPath.startsWith(prefix)) return
    await settle()
  }
  throw new Error(`Never navigated to ${prefix} (at ${router.currentRoute.value.fullPath})`)
}

function findButton(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const button = wrapper.findAll('button').find((b) => b.text() === label)
  if (!button) throw new Error(`No button labelled "${label}"`)
  return button
}
function hasButton(wrapper: VueWrapper, label: string): boolean {
  return wrapper.findAll('button').some((b) => b.text() === label)
}
function findLink(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const link = wrapper.findAll('a').find((a) => a.text() === label)
  if (!link) throw new Error(`No link labelled "${label}"`)
  return link
}
function shownQuestion(wrapper: VueWrapper): Question {
  const id = wrapper.find('.question-card__id').text()
  return questionBank.find((q) => q.id === id)!
}
async function answerCorrectly(wrapper: VueWrapper, q: Question): Promise<void> {
  for (const optionId of q.correct) await wrapper.find(`#${q.id}-${optionId}`).setValue(true)
}
/**
 * A COMPLETE but wrong selection — Submit stays disabled until the pick count is
 * met. Wrong options first, topped up with correct ones when a multi Question has
 * fewer wrong options than picks (gov-028: 5 options, 3 correct, 2 wrong).
 */
async function answerIncorrectly(wrapper: VueWrapper, q: Question): Promise<void> {
  const wrong = q.options.filter((o) => !q.correct.includes(o.id))
  const filler = q.options.filter((o) => q.correct.includes(o.id))
  const picks = [...wrong, ...filler].slice(0, q.correct.length)
  for (const o of picks) await wrapper.find(`#${q.id}-${o.id}`).setValue(true)
}
async function seedIncorrect(q: Question): Promise<void> {
  const now = new Date().toISOString()
  const session: Session = { id: crypto.randomUUID(), mode: 'practice', status: 'completed', startedAt: now, endedAt: now, exam: null }
  await repository.saveSession(session)
  const wrong = q.options.find((o) => !q.correct.includes(o.id))!
  const answer: Answer = { id: crypto.randomUUID(), sessionId: session.id, questionId: q.id, selected: [wrong.id], correct: false, submittedAt: now, xp: 0 }
  await repository.saveAnswers([answer])
}

const MONITORING = questionBank.filter((q) => q.topic === 'monitoring-tools') // 7

describe('RoundView', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('(a) shows the empty state when the review deck is empty', async () => {
    const { wrapper } = await mountRoute('/review')
    expect(wrapper.text()).toContain('Nothing to review yet')
    expect(findLink(wrapper, 'Dashboard').attributes('href')).toBe('/')
    expect(wrapper.find('.question-card').exists()).toBe(false)
  })

  it('(b) runs a topic Practice Round with instant reveal through to the results page', async () => {
    const { wrapper, router } = await mountRoute('/practice?topic=monitoring-tools')
    expect(wrapper.text()).toContain('01/7')
    expect(wrapper.text()).toContain('Describe monitoring tools in Azure')
    expect(wrapper.findAll('.seg')).toHaveLength(7)
    expect(findButton(wrapper, 'Submit').attributes('disabled')).toBeDefined()

    const first = shownQuestion(wrapper)
    await answerCorrectly(wrapper, first)
    expect(findButton(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
    await findButton(wrapper, 'Submit').trigger('click')
    await settle()
    expect(wrapper.text()).toContain('Correct +10 XP')
    expect(wrapper.find('.option--correct').exists()).toBe(true)
    expect(wrapper.text()).toContain('+10 XP')
    expect(wrapper.findAll('.seg')[0]!.classes()).toContain('seg--pass')

    await findButton(wrapper, 'Next').trigger('click')
    await settle()
    expect(wrapper.text()).toContain('02/7')

    const second = shownQuestion(wrapper)
    await answerCorrectly(wrapper, second)
    await findButton(wrapper, 'Submit').trigger('click')
    await settle()
    expect(wrapper.text()).toContain('STREAK ×2')
    expect(wrapper.text()).toContain('Correct +12 XP')

    for (let i = 2; i < MONITORING.length; i++) {
      await findButton(wrapper, 'Next').trigger('click')
      await settle()
      await answerIncorrectly(wrapper, shownQuestion(wrapper))
      await findButton(wrapper, 'Submit').trigger('click')
      await settle()
      expect(wrapper.text()).toContain('Incorrect')
    }
    expect(hasButton(wrapper, 'See results')).toBe(true)
    await findButton(wrapper, 'See results').trigger('click')
    await waitForPath(router, '/results/')

    const sessions = await repository.getSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]!.mode).toBe('practice')
    expect(sessions[0]!.status).toBe('completed')
    const answers = await repository.getAnswers()
    expect(answers).toHaveLength(7)
    expect(answers.map((a) => a.xp)).toEqual([10, 12, 0, 0, 0, 0, 0])
  })

  it('(c) end-of-round Feedback timing never reveals; Finish goes to the results page', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    await useProgressStore().init()
    await useProgressStore().updatePreferences({ feedbackTiming: 'end-of-round' })
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/practice?topic=monitoring-tools')
    await router.isReady()
    const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
    await nextTick()

    for (let i = 0; i < MONITORING.length - 1; i++) {
      await answerCorrectly(wrapper, shownQuestion(wrapper))
      await findButton(wrapper, 'Next').trigger('click')
      await settle()
      expect(wrapper.text()).not.toContain('Correct +')
      expect(wrapper.find('.option--correct').exists()).toBe(false)
      expect(wrapper.findAll('.seg')[i]!.classes()).toContain('seg--done')
    }
    await answerCorrectly(wrapper, shownQuestion(wrapper))
    await findButton(wrapper, 'Finish').trigger('click')
    await waitForPath(router, '/results/')
    expect((await repository.getAnswers())).toHaveLength(7)
  })

  it('(d) a Sprint shows the Shot clock and a timeout records an incorrect Answer with no pick', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.parse('2026-09-10T10:00:00.000Z'))
    const { wrapper } = await mountRoute('/sprint?topic=monitoring-tools')
    expect(wrapper.find('.shot-clock').exists()).toBe(true)
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:20')

    await vi.advanceTimersByTimeAsync(20_200)
    await settle()
    expect(wrapper.text()).toContain('Time up')
    expect(wrapper.find('.shot-clock').exists()).toBe(false)
    const answers = await repository.getAnswers()
    expect(answers).toHaveLength(1)
    expect(answers[0]).toMatchObject({ correct: false, selected: [], xp: 0 })

    await findButton(wrapper, 'Next').trigger('click')
    await settle()
    expect(wrapper.find('.shot-clock__value').text()).toBe('0:20')
  })

  it('(e) leaving mid-Round completes the Session', async () => {
    const { wrapper, router } = await mountRoute('/practice?topic=monitoring-tools')
    await answerCorrectly(wrapper, shownQuestion(wrapper))
    await findButton(wrapper, 'Submit').trigger('click')
    await settle()
    await router.push('/')
    await settle()
    const sessions = await repository.getSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]!.status).toBe('completed')
    expect(await repository.getAnswers()).toHaveLength(1)
  })

  it('(f) a review Round clears a Question from the deck on a correct Answer', async () => {
    const q = MONITORING[0]!
    await seedIncorrect(q)
    const { wrapper } = await mountRoute('/review')
    expect(wrapper.text()).toContain('01/1')
    expect(wrapper.text()).toContain('Review deck')
    await answerCorrectly(wrapper, q)
    await findButton(wrapper, 'Submit').trigger('click')
    await settle()
    expect(useProgressStore().deck).toHaveLength(0)
    expect(hasButton(wrapper, 'See results')).toBe(true)
  })

  it('(g) number keys pick and Enter submits', async () => {
    const { wrapper } = await mountRoute('/practice?topic=monitoring-tools')
    const q = shownQuestion(wrapper)
    const correctIndex = q.options.findIndex((o) => o.id === q.correct[0])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: String(correctIndex + 1) }))
    await nextTick()
    expect(wrapper.findAll('.option')[correctIndex]!.classes()).toContain('option--picked')
    if (q.kind === 'multi') {
      for (const id of q.correct.slice(1)) {
        const idx = q.options.findIndex((o) => o.id === id)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: String(idx + 1) }))
      }
      await nextTick()
    }
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await settle()
    expect(wrapper.text()).toContain('Correct +10 XP')
  })

  it('(h) takes the Pool from ?topic=, then ?domain=, then the remembered Domain', async () => {
    const byTopic = await mountRouteRemembering('/practice?topic=storage&domain=cloud-concepts', 'management-governance')
    expect(poolLabelOf(byTopic.wrapper)).toBe('Describe Azure storage services')
    byTopic.wrapper.unmount()

    const byDomain = await mountRouteRemembering('/practice?domain=cloud-concepts', 'management-governance')
    expect(poolLabelOf(byDomain.wrapper)).toBe('Cloud concepts')
    byDomain.wrapper.unmount()

    // 'toString' is an Object.prototype key, not a Domain id: rejected, so the
    // remembered Domain stands instead of drawing from an empty Pool.
    const prototypeKey = await mountRouteRemembering('/practice?domain=toString', 'management-governance')
    expect(poolLabelOf(prototypeKey.wrapper)).toBe('Management & governance')
    prototypeKey.wrapper.unmount()
  })
})
