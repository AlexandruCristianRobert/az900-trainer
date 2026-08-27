import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Answer, Session } from '@/domain/entities'
import { estimatedScore } from '@/domain/scoring'
import { repository } from '@/repository'
import { routes } from '@/router'
import { useExamStore } from '@/stores/examSession'
import { useProgressStore } from '@/stores/progress'

/** Captured before any vi.useFakeTimers() call, so `settle` keeps a real event loop. */
const realSetTimeout = globalThis.setTimeout

const RESET_LABEL = 'Reset all progress'
const CONFIRM_LABEL = 'Confirm reset — this deletes all sessions and answers'

/** Hosts the real RouterView so DashboardView mounts exactly as the app mounts it. */
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

async function mountDashboard(pinia: Pinia): Promise<Harness> {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
  await nextTick()
  return { wrapper, router }
}

/** Yields a real event-loop turn so awaited repository writes and the re-render land. */
async function settle(): Promise<void> {
  await new Promise((resolve) => realSetTimeout(resolve, 0))
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

const ISO_OLDER = new Date('2026-08-20T10:00:00.000Z').toISOString()
const ISO_NEWER = new Date('2026-08-21T10:00:00.000Z').toISOString()

/**
 * One expired exam with no Answers (score 0, "Not finished") and one completed
 * exam with a single correct Answer — enough to exercise the hero, both history
 * row shapes and a two-point sparkline.
 */
async function seedTwoExams(): Promise<{ expiredId: string; completedId: string }> {
  const progress = useProgressStore()
  const expiredId = crypto.randomUUID()
  const completedId = crypto.randomUUID()

  const expired: Session = {
    id: expiredId,
    mode: 'exam',
    status: 'expired',
    startedAt: ISO_OLDER,
    endedAt: ISO_OLDER,
    exam: { deadline: ISO_OLDER, questionIds: ['cc-001'], selections: {} },
  }
  const completed: Session = {
    id: completedId,
    mode: 'exam',
    status: 'completed',
    startedAt: ISO_NEWER,
    endedAt: ISO_NEWER,
    exam: { deadline: ISO_NEWER, questionIds: ['cc-001'], selections: { 'cc-001': ['b'] } },
  }
  const answer: Answer = {
    id: crypto.randomUUID(),
    sessionId: completedId,
    questionId: 'cc-001',
    selected: ['b'],
    correct: true,
    submittedAt: ISO_NEWER,
  }

  await progress.saveSession(expired)
  await progress.saveSession(completed)
  await progress.recordAnswers([answer])
  return { expiredId, completedId }
}

describe('DashboardView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('greets a brand-new user with every empty state and the baseline-exam CTA', async () => {
    const pinia = await setupProgress()
    const { wrapper } = await mountDashboard(pinia)

    const text = wrapper.text()
    expect(text).toContain('Ready to find your gaps?')
    expect(text).toContain('No exams yet.')
    // No Topic has 4 Answers, so the weak panel stays silent — never a green all-clear.
    expect(text).toContain('Not enough data yet — keep practicing.')
    expect(text).not.toContain('No weak areas. Nice.')
    expect(text).toContain("No missed questions — they'll collect here.")

    expect(findLink(wrapper, 'Take a baseline exam').attributes('href')).toBe('/exam')
    expect(findLink(wrapper, 'Practice by topic').attributes('href')).toBe('/practice')
    expect(findButton(wrapper, 'Review now').attributes('disabled')).toBeDefined()

    // All 11 Topics are listed under their 3 Domain headings, all without a verdict.
    expect(wrapper.findAll('.topic')).toHaveLength(11)
    expect(wrapper.findAll('.domain')).toHaveLength(3)
    expect(wrapper.findAll('.topic__note')).toHaveLength(11)
    expect(wrapper.find('.topic__fill').exists()).toBe(false)
  })

  it('leads with the latest score and lists every terminated exam, newest first', async () => {
    const pinia = await setupProgress()
    const { expiredId, completedId } = await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)

    // Hero: the newest exam's estimated score, on the shared threshold-line scale.
    // Pinned to the hero — the sparkline is a role="img" too, so a bare
    // find('[role="img"]') would pass on document order alone.
    expect(wrapper.find('.hero .score-scale').attributes('aria-label')).toBe(
      `Estimated score ${estimatedScore(1)} of 1000; pass line 700`,
    )
    expect(findLink(wrapper, 'Start exam').attributes('href')).toBe('/exam')
    expect(wrapper.text()).not.toContain('Ready to find your gaps?')

    // Every user-facing exam score carries this caption, dashboard included.
    expect(wrapper.find('.hero__caption').text()).toBe(
      'Estimated score — Microsoft uses an unpublished scaled model.',
    )

    const rows = wrapper.findAll('.history__row')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.attributes('href')).toBe(`/results/${completedId}`)
    expect(rows[0]!.find('.history__score').text()).toContain(String(estimatedScore(1)))
    expect(rows[1]!.attributes('href')).toBe(`/results/${expiredId}`)
    expect(rows[1]!.find('.chip--warn').text()).toBe('Not finished')
    expect(rows[1]!.find('.history__score').text()).toContain('0')

    // The sparkline plots both exams against the dashed 700 line.
    const sparkline = wrapper.find('.sparkline__svg')
    expect(sparkline.exists()).toBe(true)
    expect(sparkline.attributes('aria-label')).toContain('2 exams')
    expect(sparkline.attributes('aria-label')).toContain('pass line 700')
    expect(wrapper.find('.sparkline__threshold').exists()).toBe(true)
    expect(wrapper.findAll('.sparkline__dot')).toHaveLength(2)
  })

  it('offers to resume an exam that is still in progress', async () => {
    const pinia = await setupProgress()
    await useExamStore().startExam()
    const { wrapper } = await mountDashboard(pinia)

    const banner = wrapper.find('.resume')
    expect(banner.exists()).toBe(true)
    expect(banner.find('.resume__line').text()).toMatch(/^Exam in progress — \d\d:\d\d left$/)
    expect(findLink(wrapper, 'Resume exam').attributes('href')).toBe('/exam')
  })

  it('arms the reset before it deletes anything, then clears all progress', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)

    vi.useFakeTimers()
    await findButton(wrapper, RESET_LABEL).trigger('click')
    await settle()

    // First click only arms the confirm — nothing has been deleted.
    expect(await repository.getSessions()).toHaveLength(2)
    expect(wrapper.findAll('.history__row')).toHaveLength(2)

    // A deliberate second press, well clear of the double-click grace window.
    vi.advanceTimersByTime(1000)
    await findButton(wrapper, CONFIRM_LABEL).trigger('click')
    await settle()

    expect(await repository.getSessions()).toHaveLength(0)
    expect(await repository.getAnswers()).toHaveLength(0)
    expect(wrapper.text()).toContain('No exams yet.')
    expect(wrapper.text()).toContain('Ready to find your gaps?')
    // The control disarms itself, so a second reset needs two clicks again.
    expect(wrapper.findAll('button').map((button) => button.text())).toContain(RESET_LABEL)
  })

  it('survives a double-click on reset, and disarms itself after the confirm window', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)

    vi.useFakeTimers()
    // Both clicks of a double-click, with no wall-clock time between them: Vue has
    // already swapped the confirm button into those same pixels.
    await findButton(wrapper, RESET_LABEL).trigger('click')
    await findButton(wrapper, CONFIRM_LABEL).trigger('click')
    await settle()

    expect(await repository.getSessions()).toHaveLength(2)
    expect(await repository.getAnswers()).toHaveLength(1)
    expect(wrapper.findAll('.history__row')).toHaveLength(2)
    // Still armed — the stray click was dropped, not treated as a confirmation.
    expect(wrapper.findAll('button').map((button) => button.text())).toContain(CONFIRM_LABEL)

    // Past the grace window the same click commits.
    vi.advanceTimersByTime(500)
    await findButton(wrapper, CONFIRM_LABEL).trigger('click')
    await settle()
    expect(await repository.getSessions()).toHaveLength(0)
  })

  it('disarms the reset when the confirm window lapses unused', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)

    vi.useFakeTimers()
    await findButton(wrapper, RESET_LABEL).trigger('click')
    await settle()
    expect(wrapper.findAll('button').map((button) => button.text())).toContain(CONFIRM_LABEL)

    vi.advanceTimersByTime(6000)
    await settle()

    expect(wrapper.findAll('button').map((button) => button.text())).toContain(RESET_LABEL)
    expect(await repository.getSessions()).toHaveLength(2)
  })

  it('reports an unreadable import in place, without touching stored progress', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)

    const input = wrapper.find<HTMLInputElement>('input[type="file"]')
    expect(input.attributes('accept')).toContain('.json')

    const file = new File(['this is not progress json'], 'nope.json', {
      type: 'application/json',
    })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await settle()

    expect(wrapper.text()).toContain("That file isn't a valid progress export.")
    expect(await repository.getSessions()).toHaveLength(2)
  })
})
