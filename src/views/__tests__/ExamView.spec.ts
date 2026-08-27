import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/domain/entities'
import { repository } from '@/repository'
import { routes } from '@/router'
import { useExamStore } from '@/stores/examSession'
import { useProgressStore } from '@/stores/progress'

const START_MS = Date.parse('2026-08-27T09:00:00.000Z')

// Captured before any vi.useFakeTimers() call, so it stays the real thing.
const realSetTimeout = globalThis.setTimeout

/** Hosts the real RouterView so ExamView mounts exactly as the app mounts it. */
const RouterHost = defineComponent({
  name: 'RouterHost',
  setup: () => () => h(RouterView),
})

interface Harness {
  wrapper: VueWrapper
  router: Router
  exam: ReturnType<typeof useExamStore>
}

async function mountExamRoute(): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useProgressStore().init()

  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push('/exam')
  await router.isReady()

  const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
  await nextTick()
  return { wrapper, router, exam: useExamStore() }
}

/**
 * Yields a real event-loop turn and flushes Vue's render queue, so awaited store
 * writes, the router's lazy component loads and the re-render have all landed.
 * Fake time is left alone — only the tests that care about the clock move it.
 */
async function settle(): Promise<void> {
  await new Promise((resolve) => realSetTimeout(resolve, 0))
  await nextTick()
}

async function waitForPath(router: Router, path: string): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (router.currentRoute.value.fullPath === path) return
    await settle()
  }
  throw new Error(`Never navigated to ${path} (still at ${router.currentRoute.value.fullPath})`)
}

function findButton(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === label)
  if (!button) throw new Error(`No button labelled "${label}"`)
  return button
}

function hasButton(wrapper: VueWrapper, label: string): boolean {
  return wrapper.findAll('button').some((candidate) => candidate.text() === label)
}

async function storedSession(id: string): Promise<Session> {
  const session = await repository.getSession(id)
  if (!session) throw new Error(`Session ${id} was not persisted`)
  return session
}

describe('ExamView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(START_MS)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('offers the setup card when no exam is in progress, and starts one on demand', async () => {
    const { wrapper, exam } = await mountExamRoute()

    expect(wrapper.text()).toContain('Exam simulation')
    expect(wrapper.text()).toContain('40 questions · 45 minutes · pass line 700')
    expect(wrapper.text()).toContain('The clock never pauses. Leaving the exam keeps it running.')
    expect(exam.session).toBeNull()

    await findButton(wrapper, 'Start exam').trigger('click')
    await settle()

    expect(exam.session?.status).toBe('in-progress')
    expect(wrapper.text()).toContain('Question 1 of 40')
    expect(hasButton(wrapper, 'Start exam')).toBe(false)
  })

  it('needs two clicks to finish, and forgets the first one after five seconds', async () => {
    const { wrapper, router, exam } = await mountExamRoute()
    await exam.startExam()
    await settle()
    const sessionId = exam.session!.id

    expect(hasButton(wrapper, 'Finish exam')).toBe(true)

    // First click only arms the button — nothing is submitted.
    await findButton(wrapper, 'Finish exam').trigger('click')
    await settle()
    expect(hasButton(wrapper, 'Confirm finish')).toBe(true)
    expect(exam.session?.status).toBe('in-progress')
    expect(router.currentRoute.value.name).toBe('exam')

    // Five seconds of hesitation disarms it, still without submitting.
    await vi.advanceTimersByTimeAsync(5000)
    await nextTick()
    expect(hasButton(wrapper, 'Finish exam')).toBe(true)
    expect(hasButton(wrapper, 'Confirm finish')).toBe(false)
    expect(exam.session?.status).toBe('in-progress')

    // Arm, then confirm.
    await findButton(wrapper, 'Finish exam').trigger('click')
    await settle()
    await findButton(wrapper, 'Confirm finish').trigger('click')
    await waitForPath(router, `/results/${sessionId}`)

    const stored = await storedSession(sessionId)
    expect(stored.status).toBe('completed')
    expect(stored.endedAt).not.toBeNull()
    expect(exam.session).toBeNull()
  })

  it('needs two clicks to abandon, and truncates the deadline to the end time', async () => {
    const { wrapper, router, exam } = await mountExamRoute()
    await exam.startExam()
    await settle()
    const sessionId = exam.session!.id
    const originalDeadline = exam.session!.exam!.deadline

    await findButton(wrapper, 'Abandon').trigger('click')
    await settle()
    expect(hasButton(wrapper, 'Confirm abandon')).toBe(true)
    expect(exam.session?.status).toBe('in-progress')

    await findButton(wrapper, 'Confirm abandon').trigger('click')
    await waitForPath(router, `/results/${sessionId}`)

    const stored = await storedSession(sessionId)
    expect(stored.status).toBe('expired')
    // Abandon pulls the Deadline back to now, so `expired ⟺ now >= deadline` holds.
    expect(stored.exam!.deadline).toBe(stored.endedAt)
    expect(stored.exam!.deadline).not.toBe(originalDeadline)
  })

  it('expires the exam at zero — never submits it — and moves on to the results', async () => {
    const { wrapper, router, exam } = await mountExamRoute()
    await exam.startExam()
    await settle()
    const sessionId = exam.session!.id
    const deadline = exam.session!.exam!.deadline

    expect(wrapper.text()).toContain('45:00')

    // The clock reaches the deadline; the next timer tick reports zero.
    vi.setSystemTime(Date.parse(deadline))
    await vi.advanceTimersByTimeAsync(1000)
    await waitForPath(router, `/results/${sessionId}`)

    const stored = await storedSession(sessionId)
    expect(stored.status).toBe('expired')
    expect(stored.endedAt).toBe(deadline)
  })
})
