<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import QuestionCard from '@/components/QuestionCard.vue'
import ScoreScale from '@/components/ScoreScale.vue'
import type { DomainId, Question } from '@/data/types'
import { DOMAINS } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import { PASS_LINE } from '@/domain/examBlueprint'
import { estimatedScore } from '@/domain/scoring'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{
  sessionId: string
}>()

const progress = useProgressStore()

const DOMAIN_FILL_MODIFIER: Record<DomainId, string> = {
  'cloud-concepts': 'domain-row__fill--cloud',
  'architecture-services': 'domain-row__fill--arch',
  'management-governance': 'domain-row__fill--gov',
}

interface DomainBreakdownRow {
  domain: DomainId
  label: string
  correct: number
  drawn: number
  percent: number
  fillModifier: string
}

interface QuestionRow {
  questionId: string
  number: number
  question: Question | undefined
  answer: Answer | undefined
  status: 'correct' | 'incorrect' | 'unanswered'
}

/** A results page is only valid for a terminated exam Session. */
const validSession = computed<Session | null>(() => {
  const found = progress.sessions.find((s) => s.id === props.sessionId)
  if (!found || found.mode !== 'exam' || found.status === 'in-progress') return null
  return found
})

const endedAtLabel = computed(() => {
  const endedAt = validSession.value?.endedAt
  return endedAt ? new Date(endedAt).toLocaleString() : ''
})

/** This Session's Answers only — built once as a Map so rows don't re-scan the list. */
const sessionAnswers = computed<Answer[]>(() =>
  progress.answers.filter((answer) => answer.sessionId === props.sessionId),
)

const answerByQuestionId = computed<Map<string, Answer>>(
  () => new Map(sessionAnswers.value.map((answer) => [answer.questionId, answer])),
)

const correctCount = computed(() => sessionAnswers.value.filter((answer) => answer.correct).length)
const score = computed(() => estimatedScore(correctCount.value))
const passed = computed(() => score.value >= PASS_LINE)
const hasIncorrect = computed(() => sessionAnswers.value.some((answer) => !answer.correct))

const domainBreakdown = computed<DomainBreakdownRow[]>(() => {
  const exam = validSession.value?.exam
  if (!exam) return []

  const drawnByDomain = new Map<DomainId, number>()
  const correctByDomain = new Map<DomainId, number>()
  for (const domain of Object.keys(DOMAINS) as DomainId[]) {
    drawnByDomain.set(domain, 0)
    correctByDomain.set(domain, 0)
  }

  for (const questionId of exam.questionIds) {
    const question = progress.questionById.get(questionId)
    if (!question) continue // dangling id: excluded from the denominator
    drawnByDomain.set(question.domain, (drawnByDomain.get(question.domain) ?? 0) + 1)
    if (answerByQuestionId.value.get(questionId)?.correct) {
      correctByDomain.set(question.domain, (correctByDomain.get(question.domain) ?? 0) + 1)
    }
  }

  return (Object.keys(DOMAINS) as DomainId[]).map((domain) => {
    const drawn = drawnByDomain.get(domain) ?? 0
    const correct = correctByDomain.get(domain) ?? 0
    return {
      domain,
      label: DOMAINS[domain].label,
      correct,
      drawn,
      percent: drawn === 0 ? 0 : (correct / drawn) * 100,
      fillModifier: DOMAIN_FILL_MODIFIER[domain],
    }
  })
})

const questionRows = computed<QuestionRow[]>(() => {
  const exam = validSession.value?.exam
  if (!exam) return []
  return exam.questionIds.map((questionId, index) => {
    const question = progress.questionById.get(questionId)
    const answer = answerByQuestionId.value.get(questionId)
    const status: QuestionRow['status'] = !answer ? 'unanswered' : answer.correct ? 'correct' : 'incorrect'
    return { questionId, number: index + 1, question, answer, status }
  })
})

const expandedId = ref<string | null>(null)

function toggleExpanded(questionId: string): void {
  expandedId.value = expandedId.value === questionId ? null : questionId
}

const STATUS_LABEL: Record<QuestionRow['status'], string> = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  unanswered: 'Unanswered',
}

const STATUS_CHIP_MODIFIER: Record<QuestionRow['status'], string> = {
  correct: 'chip--pass',
  incorrect: 'chip--fail',
  unanswered: 'chip--muted',
}
</script>

<template>
  <main class="page">
    <div v-if="!validSession" class="card not-found">
      <h1>This results page doesn't exist.</h1>
      <RouterLink class="btn btn-primary" to="/">Back to dashboard</RouterLink>
    </div>

    <template v-else>
      <header class="results-header">
        <div class="results-header__title">
          <h1>Exam results</h1>
          <span v-if="validSession.status === 'expired'" class="chip chip--warn">Not finished</span>
        </div>
        <p class="results-header__date mono">{{ endedAtLabel }}</p>
      </header>

      <section class="card score-section">
        <ScoreScale :score="score" :threshold="PASS_LINE" />
        <p
          class="score-section__verdict"
          :class="passed ? 'score-section__verdict--pass' : 'score-section__verdict--fail'"
        >
          {{ passed ? 'Estimated pass' : 'Below the pass line' }}
        </p>
        <p class="score-section__caption">
          Estimated score — Microsoft uses an unpublished scaled model.
        </p>
        <p class="score-section__caption">Unanswered questions count as incorrect.</p>
      </section>

      <section class="card domain-section">
        <h2>Domain breakdown</h2>
        <div v-for="row in domainBreakdown" :key="row.domain" class="domain-row">
          <div class="domain-row__label">
            <span>{{ row.label }}</span>
            <span class="mono">{{ row.correct }} / {{ row.drawn }} correct</span>
          </div>
          <div class="domain-row__bar">
            <div
              class="domain-row__fill"
              :class="row.fillModifier"
              :style="{ width: `${row.percent}%` }"
            ></div>
          </div>
        </div>
      </section>

      <section class="card questions-section">
        <h2>Questions</h2>
        <ul class="question-list">
          <li v-for="row in questionRows" :key="row.questionId" class="question-row">
            <p v-if="!row.question" class="question-row__missing">
              <span class="question-row__number mono">{{ row.number }}</span>
              This question was removed from the bank.
            </p>
            <template v-else>
              <button
                type="button"
                class="question-row__summary"
                :aria-expanded="expandedId === row.questionId"
                :aria-controls="`question-detail-${row.questionId}`"
                @click="toggleExpanded(row.questionId)"
              >
                <span class="question-row__number mono">{{ row.number }}</span>
                <span class="question-row__stem">{{ row.question.stem }}</span>
                <span class="chip" :class="STATUS_CHIP_MODIFIER[row.status]">
                  {{ STATUS_LABEL[row.status] }}
                </span>
              </button>
              <div
                v-if="expandedId === row.questionId"
                :id="`question-detail-${row.questionId}`"
                class="question-row__detail"
              >
                <QuestionCard
                  :question="row.question"
                  :model-value="row.answer?.selected ?? []"
                  graded
                  show-question-id
                />
              </div>
            </template>
          </li>
        </ul>
      </section>

      <footer class="results-footer">
        <RouterLink class="btn btn-ghost" to="/">Back to dashboard</RouterLink>
        <RouterLink v-if="hasIncorrect" class="btn btn-primary" to="/review">
          Review missed questions
        </RouterLink>
      </footer>
    </template>
  </main>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  max-width: 34rem;
  padding: 2rem;
}

.results-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.results-header__title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.results-header__title h1 {
  margin: 0;
}

.results-header__date {
  margin: 0;
  color: var(--ink-muted);
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.chip--pass {
  background: color-mix(in srgb, var(--pass) 16%, transparent);
  color: var(--pass);
}

.chip--fail {
  background: color-mix(in srgb, var(--fail) 16%, transparent);
  color: var(--fail);
}

.chip--warn {
  background: color-mix(in srgb, var(--warn) 16%, transparent);
  color: var(--warn);
}

.chip--muted {
  background: color-mix(in srgb, var(--ink-muted) 14%, transparent);
  color: var(--ink-muted);
}

.card {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
}

.score-section__verdict {
  margin: 1.25rem 0 0.75rem;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
}

.score-section__verdict--pass {
  color: var(--pass);
}

.score-section__verdict--fail {
  color: var(--fail);
}

.score-section__caption {
  margin: 0.15rem 0 0;
  color: var(--ink-muted);
  font-size: 0.85rem;
}

.domain-section h2,
.questions-section h2 {
  margin-bottom: 1rem;
  font-size: 1.05rem;
}

.domain-row {
  margin-bottom: 1rem;
}

.domain-row:last-child {
  margin-bottom: 0;
}

.domain-row__label {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
}

.domain-row__label .mono {
  color: var(--ink-muted);
}

.domain-row__bar {
  height: 0.5rem;
  border-radius: 999px;
  background: var(--accent-soft);
  overflow: hidden;
}

.domain-row__fill {
  height: 100%;
  border-radius: 999px;
}

.domain-row__fill--cloud {
  background: var(--domain-cloud);
}

.domain-row__fill--arch {
  background: var(--domain-arch);
}

.domain-row__fill--gov {
  background: var(--domain-gov);
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.question-row__missing {
  margin: 0;
  padding: 0.75rem 1rem;
  color: var(--ink-muted);
  font-style: italic;
}

.question-row__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-small);
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.question-row__summary:hover {
  border-color: var(--accent);
}

.question-row__number {
  flex: none;
  min-width: 1.75rem;
  color: var(--ink-muted);
  font-size: 0.85rem;
}

.question-row__stem {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.question-row__detail {
  margin-top: 0.5rem;
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-small);
  background: var(--surface);
}

.results-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
