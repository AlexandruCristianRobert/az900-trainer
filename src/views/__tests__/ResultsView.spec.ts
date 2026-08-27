import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Answer, Session } from '@/domain/entities'
import { estimatedScore } from '@/domain/scoring'
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

  it('renders a completed exam with a correct/incorrect/unanswered/dangling mix', async () => {
    const pinia = await setupProgress()
    const progress = useProgressStore()

    // Real bank ids, chosen one per domain, so the per-domain breakdown is exercised too:
    // cc-001 (cloud-concepts, correct=['b']) answered correctly,
    // arch-001 (architecture-services, correct=['a']) answered incorrectly,
    // gov-001 (management-governance) left unanswered, plus a dangling id not in the bank.
    const DANGLING_ID = 'zzz-not-in-bank'
    const sessionId = crypto.randomUUID()
    const now = new Date('2026-08-20T10:00:00.000Z').toISOString()

    const session: Session = {
      id: sessionId,
      mode: 'exam',
      status: 'completed',
      startedAt: now,
      endedAt: now,
      exam: {
        deadline: now,
        questionIds: ['cc-001', 'arch-001', 'gov-001', DANGLING_ID],
        selections: { 'cc-001': ['b'], 'arch-001': ['b'] },
      },
    }
    const answers: Answer[] = [
      {
        id: crypto.randomUUID(),
        sessionId,
        questionId: 'cc-001',
        selected: ['b'],
        correct: true,
        submittedAt: now,
      },
      {
        id: crypto.randomUUID(),
        sessionId,
        questionId: 'arch-001',
        selected: ['b'], // arch-001's correct answer is 'a' — this is wrong
        correct: false,
        submittedAt: now,
      },
    ]

    await progress.saveSession(session)
    await progress.recordAnswers(answers)

    const { wrapper } = await mountRoute(pinia, `/results/${sessionId}`)

    // Score reflects exactly one correct Answer; the unanswered and dangling ids never count.
    expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe(
      `Estimated score ${estimatedScore(1)} of 1000; pass line 700`,
    )
    expect(wrapper.text()).toContain('Below the pass line')

    // One row per questionId, in order — three real rows + one dangling row.
    const rows = wrapper.findAll('.question-row')
    expect(rows).toHaveLength(4)

    const [correctRow, incorrectRow, unansweredRow, danglingRow] = rows

    expect(correctRow!.find('.chip').text()).toBe('Correct')
    expect(correctRow!.find('.chip').classes()).toContain('chip--pass')

    expect(incorrectRow!.find('.chip').text()).toBe('Incorrect')
    expect(incorrectRow!.find('.chip').classes()).toContain('chip--fail')

    expect(unansweredRow!.find('.chip').text()).toBe('Unanswered')
    expect(unansweredRow!.find('.chip').classes()).toContain('chip--muted')

    // Expanding it shows the same verdict inside the QuestionCard — never "Incorrect".
    await unansweredRow!.find('.question-row__summary').trigger('click')
    const unansweredDetail = unansweredRow!.find('.question-row__detail')
    expect(unansweredDetail.find('.question-card__verdict').text()).toBe('Unanswered')
    expect(unansweredDetail.find('.question-card__verdict--muted').exists()).toBe(true)
    // Collapse it again — only one row's detail is asserted expanded below.
    await unansweredRow!.find('.question-row__summary').trigger('click')

    expect(danglingRow!.find('.question-row__summary').exists()).toBe(false)
    expect(danglingRow!.text()).toContain('This question was removed from the bank.')

    // Per-domain Y (drawn) counts exclude the dangling id: 1 drawn per domain, not 2.
    const domainLabels = wrapper.findAll('.domain-row').map((row) => row.text())
    expect(domainLabels.find((text) => text.includes('Describe cloud concepts'))).toContain(
      '1 / 1 correct',
    )
    expect(
      domainLabels.find((text) => text.includes('Describe Azure architecture and services')),
    ).toContain('0 / 1 correct')
    expect(
      domainLabels.find((text) => text.includes('Describe Azure management and governance')),
    ).toContain('0 / 1 correct')

    // Clicking the incorrect row expands a graded QuestionCard showing the submitted selection.
    expect(wrapper.find('.question-card').exists()).toBe(false)
    await incorrectRow!.find('.question-row__summary').trigger('click')
    const detail = incorrectRow!.find('.question-row__detail')
    expect(detail.exists()).toBe(true)
    expect(detail.find('.question-card').exists()).toBe(true)
    expect(detail.find('.question-card__verdict--fail').exists()).toBe(true)
    expect(detail.text()).toContain('arch-001')

    // The button and the expanded region are wired together for assistive tech.
    const summaryButton = incorrectRow!.find('.question-row__summary')
    expect(summaryButton.attributes('aria-expanded')).toBe('true')
    expect(summaryButton.attributes('aria-controls')).toBe(detail.attributes('id'))

    // At least one incorrect Answer was recorded, so the review link is offered.
    const linkLabels = wrapper.findAll('a').map((a) => a.text())
    expect(linkLabels).toContain('Review missed questions')
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
