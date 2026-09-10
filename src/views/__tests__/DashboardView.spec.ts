import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { questionBank } from '@/data/questions'
import type { Answer, Session } from '@/domain/entities'
import { estimatedScore } from '@/domain/scoring'
import { repository } from '@/repository'
import { routes } from '@/router'
import { useExamStore } from '@/stores/examSession'
import { useProgressStore } from '@/stores/progress'

const realSetTimeout = globalThis.setTimeout
const RESET_LABEL = 'Reset all progress'
const CONFIRM_LABEL = 'Confirm reset — this deletes all sessions and answers'

const RouterHost = defineComponent({ name: 'RouterHost', setup: () => () => h(RouterView) })

async function setupProgress(): Promise<Pinia> {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useProgressStore().init()
  return pinia
}
interface Harness { wrapper: VueWrapper; router: Router }
async function mountDashboard(pinia: Pinia): Promise<Harness> {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(RouterHost, { global: { plugins: [pinia, router] } })
  await nextTick()
  return { wrapper, router }
}
async function settle(): Promise<void> {
  await new Promise((resolve) => realSetTimeout(resolve, 0))
  await nextTick()
}
/** /practice loads its view lazily, so confirmation takes more than one turn. */
async function waitForPath(router: Router, path: string): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (router.currentRoute.value.fullPath === path) return
    await settle()
  }
  throw new Error(`Never navigated to ${path} (still at ${router.currentRoute.value.fullPath})`)
}
function findButton(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const button = wrapper.findAll('button').find((b) => b.text() === label)
  if (!button) throw new Error(`No button labelled "${label}"`)
  return button
}
function findLink(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
  const link = wrapper.findAll('a').find((a) => a.text() === label)
  if (!link) throw new Error(`No link labelled "${label}"`)
  return link
}
function tileValues(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.stats .tile__value').map((t) => t.text())
}

const ISO_OLDER = '2026-08-20T10:00:00.000Z'
const ISO_NEWER = '2026-08-21T10:00:00.000Z'

async function seedTwoExams(): Promise<{ expiredId: string; completedId: string }> {
  const progress = useProgressStore()
  const expiredId = crypto.randomUUID()
  const completedId = crypto.randomUUID()
  await progress.saveSession({ id: expiredId, mode: 'exam', status: 'expired', startedAt: ISO_OLDER, endedAt: ISO_OLDER, exam: { deadline: ISO_OLDER, questionIds: ['cc-001'], selections: {} } })
  await progress.saveSession({ id: completedId, mode: 'exam', status: 'completed', startedAt: ISO_NEWER, endedAt: ISO_NEWER, exam: { deadline: ISO_NEWER, questionIds: ['cc-001'], selections: { 'cc-001': ['b'] } } })
  await progress.recordAnswers([{ id: crypto.randomUUID(), sessionId: completedId, questionId: 'cc-001', selected: ['b'], correct: true, submittedAt: ISO_NEWER, xp: 10 }])
  return { expiredId, completedId }
}

/** Four wrong Answers on four monitoring-tools Questions: enough to flag the Topic weak. */
async function seedWeakMonitoring(): Promise<void> {
  const progress = useProgressStore()
  const session: Session = { id: 'weak', mode: 'practice', status: 'completed', startedAt: ISO_OLDER, endedAt: ISO_OLDER, exam: null }
  await progress.saveSession(session)
  const qs = questionBank.filter((q) => q.topic === 'monitoring-tools').slice(0, 4)
  const answers: Answer[] = qs.map((q) => ({
    id: crypto.randomUUID(), sessionId: 'weak', questionId: q.id,
    selected: [q.options.find((o) => !q.correct.includes(o.id))!.id], correct: false, submittedAt: ISO_OLDER, xp: 0,
  }))
  await progress.recordAnswers(answers)
}

describe('DashboardView', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('greets a new learner with zeroed tiles, the three cards, the exam strip and empty panels', async () => {
    const pinia = await setupProgress()
    const { wrapper } = await mountDashboard(pinia)
    const text = wrapper.text()

    expect(text).toContain('Level up your Azure fundamentals')
    expect(tileValues(wrapper)).toEqual(['1', '0', '×0', '0'])
    expect(text).toContain('150 XP to lvl 2')

    expect(findLink(wrapper, 'Start round').attributes('href')).toBe('/practice')
    expect(findLink(wrapper, 'Start sprint').attributes('href')).toBe('/sprint')
    expect(findButton(wrapper, 'Start review').attributes('disabled')).toBeDefined()
    expect(findButton(wrapper, 'All').attributes('aria-pressed')).toBe('true')
    expect(findButton(wrapper, 'Instant').attributes('aria-pressed')).toBe('true')

    expect(findLink(wrapper, 'Start exam').attributes('href')).toBe('/exam')
    expect(text).toContain('Exam simulation')
    expect(text).not.toContain('Last estimated score')
    expect(wrapper.find('.sparkline__svg').exists()).toBe(false)

    expect(wrapper.findAll('.domain-accuracy__row')).toHaveLength(3)
    expect(text).toContain('no data')
    expect(text).toContain('Not enough data yet — keep practicing.')
    expect(text).not.toContain('missed')
  })

  it('shows the last Estimated score on the exam strip once an exam exists', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)
    const strip = wrapper.find('.exam-strip')
    expect(strip.text()).toContain(`Last estimated score ${estimatedScore(1)}`)
    expect(strip.find('.exam-strip__score--fail').exists()).toBe(true)
    expect(tileValues(wrapper)[1]).toBe('10') // total XP from the one correct exam Answer
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

  it('remembers the Domain chip and the Feedback timing as preferences', async () => {
    const pinia = await setupProgress()
    const { wrapper } = await mountDashboard(pinia)

    await findButton(wrapper, 'Cloud concepts').trigger('click')
    await settle()
    expect(findButton(wrapper, 'Cloud concepts').attributes('aria-pressed')).toBe('true')
    expect(findButton(wrapper, 'All').attributes('aria-pressed')).toBe('false')
    expect((await repository.getPreferences()).domain).toBe('cloud-concepts')

    await findButton(wrapper, 'End of round').trigger('click')
    await settle()
    expect(findButton(wrapper, 'End of round').attributes('aria-pressed')).toBe('true')
    expect((await repository.getPreferences()).feedbackTiming).toBe('end-of-round')
  })

  it('lists weak areas as buttons that start a Topic Practice Round', async () => {
    const pinia = await setupProgress()
    await seedWeakMonitoring()
    const { wrapper, router } = await mountDashboard(pinia)

    const row = wrapper.find('.weak-row')
    expect(row.exists()).toBe(true)
    expect(row.text()).toContain('Describe monitoring tools in Azure')
    expect(row.text()).toContain('0%')
    expect(findLink(wrapper, 'Start review').attributes('href')).toBe('/review')
    expect(tileValues(wrapper)[3]).toBe('4')

    await row.trigger('click')
    await waitForPath(router, '/practice?topic=monitoring-tools')
    expect(router.currentRoute.value.fullPath).toBe('/practice?topic=monitoring-tools')
  })

  it('arms the reset before it deletes anything, then clears all progress', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)

    vi.useFakeTimers()
    await findButton(wrapper, RESET_LABEL).trigger('click')
    await settle()
    expect(await repository.getSessions()).toHaveLength(2)

    vi.advanceTimersByTime(1000)
    await findButton(wrapper, CONFIRM_LABEL).trigger('click')
    await settle()
    expect(await repository.getSessions()).toHaveLength(0)
    expect(await repository.getAnswers()).toHaveLength(0)
    expect(tileValues(wrapper)).toEqual(['1', '0', '×0', '0'])
    expect(wrapper.findAll('button').map((b) => b.text())).toContain(RESET_LABEL)
  })

  it('survives a double-click on reset, and disarms itself after the confirm window', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)

    vi.useFakeTimers()
    await findButton(wrapper, RESET_LABEL).trigger('click')
    await findButton(wrapper, CONFIRM_LABEL).trigger('click')
    await settle()
    expect(await repository.getSessions()).toHaveLength(2)
    expect(wrapper.findAll('button').map((b) => b.text())).toContain(CONFIRM_LABEL)

    vi.advanceTimersByTime(6000)
    await settle()
    expect(wrapper.findAll('button').map((b) => b.text())).toContain(RESET_LABEL)
    expect(await repository.getSessions()).toHaveLength(2)
  })

  it('reports an unreadable import in place, without touching stored progress', async () => {
    const pinia = await setupProgress()
    await seedTwoExams()
    const { wrapper } = await mountDashboard(pinia)
    const input = wrapper.find<HTMLInputElement>('input[type="file"]')
    expect(input.attributes('accept')).toContain('.json')
    const file = new File(['this is not progress json'], 'nope.json', { type: 'application/json' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await settle()
    expect(wrapper.text()).toContain("That file isn't a valid progress export.")
    expect(await repository.getSessions()).toHaveLength(2)
  })
})
