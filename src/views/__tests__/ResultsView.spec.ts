import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '@/router'
import { useExamStore } from '@/stores/examSession'
import { useProgressStore } from '@/stores/progress'

/** Hosts the real RouterView so ResultsView mounts exactly as the app mounts it. */
const RouterHost = defineComponent({
  name: 'RouterHost',
  setup: () => () => h(RouterView),
})

async function setupProgress(): Promise<Pinia> {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useProgressStore().init()
  return pinia
}

interface Harness {
  wrapper: VueWrapper
  router: Router
}

async function mountRoute(pinia: Pinia, path: string): Promise<Harness> {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
  await nextTick()
  return { wrapper, router }
}

describe('ResultsView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders a not-found message for an unknown session id, with a dashboard link", async () => {
    const pinia = await setupProgress()
    const { wrapper } = await mountRoute(pinia, '/results/does-not-exist')

    expect(wrapper.text()).toContain("This results page doesn't exist.")
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/')
  })

  it('renders an abandoned (expired, unanswered) exam as Not finished, score 0, all rows Unanswered', async () => {
    const pinia = await setupProgress()
    const examStore = useExamStore()
    await examStore.startExam()
    const sessionId = await examStore.abandonExam()

    const { wrapper } = await mountRoute(pinia, `/results/${sessionId}`)

    expect(wrapper.text()).toContain('Exam results')
    expect(wrapper.text()).toContain('Not finished')
    expect(wrapper.text()).toContain('Below the pass line')
    expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe(
      'Estimated score 0 of 1000; pass line 700',
    )

    const chips = wrapper.findAll('.question-row__summary .chip')
    expect(chips.length).toBeGreaterThan(0)
    for (const chip of chips) {
      expect(chip.text()).toBe('Unanswered')
      expect(chip.classes()).toContain('chip--muted')
    }

    // No incorrect Answers were ever recorded, so no review link is offered.
    const linkLabels = wrapper.findAll('a').map((a) => a.text())
    expect(linkLabels).not.toContain('Review missed questions')
  })

  it('does not treat an in-progress exam session as a valid results page', async () => {
    const pinia = await setupProgress()
    const examStore = useExamStore()
    await examStore.startExam()
    const sessionId = examStore.session!.id

    const { wrapper } = await mountRoute(pinia, `/results/${sessionId}`)

    expect(wrapper.text()).toContain("This results page doesn't exist.")
  })
})
