import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Question } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import { repository } from '@/repository'
import { routes } from '@/router'
import { useProgressStore } from '@/stores/progress'

/** Hosts the real RouterView so ReviewView mounts exactly as the app mounts it. */
const RouterHost = defineComponent({
  name: 'RouterHost',
  setup: () => () => h(RouterView),
})

interface Harness {
  wrapper: VueWrapper
  router: Router
}

/** Writes a completed practice Session + an incorrect Answer straight to the repository. */
async function seedIncorrectAnswer(question: Question): Promise<void> {
  const now = new Date().toISOString()
  const session: Session = {
    id: crypto.randomUUID(),
    mode: 'practice',
    status: 'completed',
    startedAt: now,
    endedAt: now,
    exam: null,
  }
  await repository.saveSession(session)

  const wrongOption = question.options.find((o) => !question.correct.includes(o.id))
  if (!wrongOption) throw new Error(`No incorrect option available for ${question.id}`)
  const answer: Answer = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    questionId: question.id,
    selected: [wrongOption.id],
    correct: false,
    submittedAt: now,
  }
  await repository.saveAnswers([answer])
}

async function mountReviewRoute(): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useProgressStore().init()

  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push('/review')
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

function findLink(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const link = wrapper.findAll('a').find((candidate) => candidate.text() === label)
  if (!link) throw new Error(`No link labelled "${label}"`)
  return link
}

function questionById(id: string): Question {
  const question = questionBank.find((q) => q.id === id)
  if (!question) throw new Error(`Unknown question id ${id}`)
  return question
}

/** Fills in every correct option for the given question (works for single and multi). */
async function answerCorrectly(wrapper: VueWrapper, question: Question): Promise<void> {
  for (const optionId of question.correct) {
    await wrapper.find(`#${question.id}-${optionId}`).setValue(true)
  }
}

/** Fills in a complete but wrong selection (works for single and multi). */
async function answerIncorrectly(wrapper: VueWrapper, question: Question): Promise<void> {
  const wrongOptions = question.options
    .filter((o) => !question.correct.includes(o.id))
    .slice(0, question.correct.length)
  if (wrongOptions.length < question.correct.length) {
    throw new Error(`Not enough incorrect options to answer ${question.id} wrongly`)
  }
  for (const option of wrongOptions) {
    await wrapper.find(`#${question.id}-${option.id}`).setValue(true)
  }
}

const MONITORING_TOOLS = questionBank.filter((q) => q.topic === 'monitoring-tools')

describe('ReviewView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('(a) shows the empty state with ghost links to Practice and Dashboard when the deck is empty', async () => {
    const { wrapper } = await mountReviewRoute()

    expect(wrapper.text()).toContain('Review')
    expect(wrapper.text()).toContain("No missed questions — they'll collect here.")

    const practiceLink = findLink(wrapper, 'Practice')
    expect(practiceLink.attributes('href')).toBe('/practice')
    const dashboardLink = findLink(wrapper, 'Dashboard')
    expect(dashboardLink.attributes('href')).toBe('/')

    // No question run should have started.
    expect(wrapper.text()).not.toContain('correct so far')
  })

  it('(b) runs a single-question deck through to the summary, clearing it from the live deck', async () => {
    const question = MONITORING_TOOLS[0]!
    await seedIncorrectAnswer(question)

    const { wrapper } = await mountReviewRoute()

    expect(wrapper.text()).toContain('Question 1 of 1')
    expect(wrapper.text()).toContain('0 correct so far')
    expect(wrapper.find('.question-card__id').text()).toBe(question.id)

    await answerCorrectly(wrapper, question)
    await findButton(wrapper, 'Check answer').trigger('click')
    await settle()

    expect(wrapper.find('.question-card__verdict--pass').exists()).toBe(true)
    await findButton(wrapper, 'See summary').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('1 of 1 correct')
    expect(wrapper.text()).toContain('100% accuracy')
    expect(wrapper.text()).toContain('0 still in your review deck')

    const sessions = await repository.getSessions()
    const reviewSessions = sessions.filter((s) => s.mode === 'review')
    expect(reviewSessions).toHaveLength(1)
    expect(reviewSessions[0]!.status).toBe('completed')

    const answers = await repository.getAnswers()
    const reviewAnswers = answers.filter((a) => a.sessionId === reviewSessions[0]!.id)
    expect(reviewAnswers).toHaveLength(1)
    expect(reviewAnswers[0]!.correct).toBe(true)
  })

  it('(c) the run queue is a snapshot: clearing the first question live does not shrink it', async () => {
    const first = MONITORING_TOOLS[0]!
    const second = MONITORING_TOOLS[1]!
    await seedIncorrectAnswer(first)
    await seedIncorrectAnswer(second)

    const { wrapper } = await mountReviewRoute()

    expect(wrapper.text()).toContain('Question 1 of 2')

    const shownFirst = questionById(wrapper.find('.question-card__id').text())
    await answerCorrectly(wrapper, shownFirst)
    await findButton(wrapper, 'Check answer').trigger('click')
    await settle()

    // The live deck has now shrunk to 1 (the answered Question cleared), but the
    // snapshotted run queue must still hold both — "of 2" stays, and "Next question"
    // (not "See summary") proves a second Question is still reachable.
    await findButton(wrapper, 'Next question').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('Question 2 of 2')
    const shownSecond = questionById(wrapper.find('.question-card__id').text())
    expect(shownSecond.id).not.toBe(shownFirst.id)
  })

  it('(d) "Review again" restarts over the live deck and opens a new review session', async () => {
    const question = MONITORING_TOOLS[0]!
    await seedIncorrectAnswer(question)

    const { wrapper } = await mountReviewRoute()

    expect(wrapper.text()).toContain('Question 1 of 1')

    // Answered wrong: the Question stays in the deck once this run finishes.
    await answerIncorrectly(wrapper, question)
    await findButton(wrapper, 'Check answer').trigger('click')
    await settle()
    await findButton(wrapper, 'See summary').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('1 still in your review deck')
    let sessions = await repository.getSessions()
    expect(sessions.filter((s) => s.mode === 'review')).toHaveLength(1)

    await findButton(wrapper, 'Review again').trigger('click')
    await settle()

    // A fresh run over the still-live (1-question) deck, independent of the run just finished.
    expect(wrapper.text()).toContain('Question 1 of 1')

    await answerCorrectly(wrapper, question)
    await findButton(wrapper, 'Check answer').trigger('click')
    await settle()

    sessions = await repository.getSessions()
    expect(sessions.filter((s) => s.mode === 'review')).toHaveLength(2)
  })
})
