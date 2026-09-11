<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BreakdownList from '@/components/BreakdownList.vue'
import { examBreakdownRows } from '@/components/breakdownRows'
import ScoreScale from '@/components/ScoreScale.vue'
import { DOMAINS, type DomainId } from '@/data/types'
import type { Answer, Session } from '@/domain/entities'
import { PASS_LINE } from '@/domain/examBlueprint'
import { estimatedScore } from '@/domain/scoring'
import { totalXp } from '@/domain/xp'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{ session: Session }>()
const progress = useProgressStore()

const endedAtLabel = computed(() =>
  props.session.endedAt ? new Date(props.session.endedAt).toLocaleString() : '',
)
const sessionAnswers = computed<Answer[]>(() =>
  progress.answers.filter((a) => a.sessionId === props.session.id),
)
const correctCount = computed(() => sessionAnswers.value.filter((a) => a.correct).length)
const score = computed(() => estimatedScore(correctCount.value))
const passed = computed(() => score.value >= PASS_LINE)
const xpEarned = computed(() => totalXp(sessionAnswers.value))
const hasIncorrect = computed(() => sessionAnswers.value.some((a) => !a.correct))

interface DomainBreakdownRow {
  domain: DomainId
  label: string
  correct: number
  drawn: number
  percent: number
}

const domainBreakdown = computed<DomainBreakdownRow[]>(() => {
  const exam = props.session.exam
  if (!exam) return []
  const answerByQuestion = new Map(sessionAnswers.value.map((a) => [a.questionId, a]))
  const drawn = new Map<DomainId, number>()
  const correct = new Map<DomainId, number>()
  for (const questionId of exam.questionIds) {
    const question = progress.questionById.get(questionId)
    if (!question) continue // dangling id: excluded from the denominator
    drawn.set(question.domain, (drawn.get(question.domain) ?? 0) + 1)
    if (answerByQuestion.get(questionId)?.correct) {
      correct.set(question.domain, (correct.get(question.domain) ?? 0) + 1)
    }
  }
  return (Object.keys(DOMAINS) as DomainId[]).map((domain) => {
    const d = drawn.get(domain) ?? 0
    const c = correct.get(domain) ?? 0
    return { domain, label: DOMAINS[domain].label, correct: c, drawn: d, percent: d === 0 ? 0 : (c / d) * 100 }
  })
})

const rows = computed(() => examBreakdownRows(props.session, progress.answers, progress.questionById))
</script>

<template>
  <div class="fade-up">
    <header class="results-header">
      <div class="results-header__title">
        <h1>Exam results</h1>
        <span v-if="session.status === 'expired'" class="chip chip--warn">Not finished</span>
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

    <div class="tiles">
      <div class="tile">
        <div class="tile__label eyebrow">Correct</div>
        <div class="tile__value">{{ correctCount }}/{{ session.exam?.questionIds.length ?? 0 }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">XP earned</div>
        <div class="tile__value tile__value--gold">+{{ xpEarned }}</div>
      </div>
    </div>

    <section class="card domain-section">
      <h2 class="eyebrow section-title">Domain breakdown</h2>
      <div v-for="row in domainBreakdown" :key="row.domain" class="domain-row">
        <div class="domain-row__label">
          <span>{{ row.label }}</span>
          <span class="mono">{{ row.correct }} / {{ row.drawn }} correct</span>
        </div>
        <div class="domain-row__bar">
          <div class="domain-row__fill" :style="{ width: `${row.percent}%` }"></div>
        </div>
      </div>
    </section>

    <h2 class="eyebrow section-title">Questions</h2>
    <BreakdownList :rows="rows" />

    <div class="results-actions">
      <RouterLink class="btn btn-primary" to="/exam">Take another exam</RouterLink>
      <RouterLink v-if="hasIncorrect" class="btn btn-outline btn-outline--gold" to="/review">
        Start review
      </RouterLink>
      <RouterLink class="btn btn-ghost" to="/">Dashboard</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.results-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.results-header__title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.results-header__date {
  color: var(--ink-muted);
  font-size: 12px;
}
.score-section {
  padding: 24px;
}
.score-section__verdict {
  margin: 16px 0 4px;
  font-weight: 800;
}
.score-section__verdict--pass {
  color: var(--pass);
}
.score-section__verdict--fail {
  color: var(--fail);
}
.score-section__caption {
  margin: 0;
  color: var(--ink-muted);
  font-size: 12px;
}
.domain-section {
  padding: 24px;
  margin-top: 30px;
}
.domain-section .section-title {
  margin: 0 0 20px;
}
.domain-row + .domain-row {
  margin-top: 16px;
}
.domain-row__label {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 700;
}
.domain-row__label .mono {
  color: var(--ink-muted);
  font-size: 11px;
  font-weight: 600;
}
.domain-row__bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--track);
}
.domain-row__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width var(--dur);
}
</style>
