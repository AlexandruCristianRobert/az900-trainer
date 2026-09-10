<script setup lang="ts">
import { ref } from 'vue'
import QuestionCard from '@/components/QuestionCard.vue'
import type { BreakdownRow, BreakdownStatus } from './breakdownRows'

defineProps<{ rows: BreakdownRow[] }>()

const expandedKey = ref<string | null>(null)

function toggle(key: string): void {
  expandedKey.value = expandedKey.value === key ? null : key
}

const LABEL: Record<BreakdownStatus, string> = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  unanswered: 'Unanswered',
  'no-pick': 'No pick',
}
const CHIP: Record<BreakdownStatus, string> = {
  correct: 'chip--pass',
  incorrect: 'chip--fail',
  unanswered: 'chip--muted',
  'no-pick': 'chip--muted',
}
const MARK: Record<BreakdownStatus, string> = {
  correct: '✓',
  incorrect: '✕',
  unanswered: '–',
  'no-pick': '–',
}
</script>

<template>
  <ul class="question-list">
    <li v-for="row in rows" :key="row.key" class="question-row">
      <p v-if="!row.question" class="question-row__missing">
        <span class="question-row__number mono">{{ String(row.number).padStart(2, '0') }}</span>
        This question was removed from the bank.
      </p>
      <template v-else>
        <button
          type="button"
          class="question-row__summary"
          :aria-expanded="expandedKey === row.key"
          :aria-controls="`question-detail-${row.key}`"
          @click="toggle(row.key)"
        >
          <span
            class="question-row__mark mono"
            :class="`question-row__mark--${row.status}`"
            aria-hidden="true"
            >{{ MARK[row.status] }}</span
          >
          <span class="question-row__number mono">{{ String(row.number).padStart(2, '0') }}</span>
          <span class="question-row__stem">{{ row.question.stem }}</span>
          <span class="chip" :class="CHIP[row.status]">{{ LABEL[row.status] }}</span>
          <span class="question-row__chevron mono" aria-hidden="true">{{
            expandedKey === row.key ? '−' : '+'
          }}</span>
        </button>
        <div
          v-if="expandedKey === row.key"
          :id="`question-detail-${row.key}`"
          class="question-row__detail"
        >
          <QuestionCard
            :question="row.question"
            :model-value="row.selected"
            graded
            show-question-id
            :empty-verdict-label="row.status === 'no-pick' ? 'No pick' : 'Unanswered'"
          />
        </div>
      </template>
    </li>
  </ul>
</template>

<style scoped>
.question-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.question-row {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}
.question-row__summary {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 13px 16px;
  border: none;
  background: none;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.question-row__summary:hover {
  background: var(--surface-raised);
}
.question-row__mark {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: var(--track);
  color: var(--ink-muted);
  font-size: 12px;
  font-weight: 700;
}
.question-row__mark--correct {
  background: var(--pass);
  color: var(--pass-ink);
}
.question-row__mark--incorrect {
  background: var(--fail);
  color: var(--fail-ink);
}
.question-row__number {
  color: var(--ink-muted);
  font-size: 11px;
  font-weight: 700;
}
.question-row__stem {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13.5px;
  font-weight: 600;
}
.question-row__chevron {
  color: var(--ink-muted);
  font-size: 15px;
  font-weight: 700;
}
.question-row__detail {
  padding: 16px;
  border-top: 1px solid var(--line);
}
.question-row__missing {
  display: flex;
  gap: 14px;
  align-items: center;
  margin: 0;
  padding: 13px 16px;
  color: var(--ink-muted);
}
</style>
