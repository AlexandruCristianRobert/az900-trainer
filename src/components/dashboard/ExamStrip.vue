<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { EXAM_DURATION_MS, EXAM_QUESTION_COUNT, PASS_LINE } from '@/domain/examBlueprint'

defineProps<{ lastScore: number | null }>()
const MINUTES = EXAM_DURATION_MS / 60_000
</script>

<template>
  <section class="card exam-strip">
    <div class="exam-strip__text">
      <span class="exam-strip__title">Exam simulation</span>
      <span class="exam-strip__meta mono">{{ EXAM_QUESTION_COUNT }} questions · {{ MINUTES }} minutes</span>
      <span v-if="lastScore !== null" class="exam-strip__last">
        Last estimated score
        <span class="mono exam-strip__score" :class="lastScore >= PASS_LINE ? 'exam-strip__score--pass' : 'exam-strip__score--fail'">{{ lastScore }}</span>
        <span class="exam-strip__meta mono">· pass line {{ PASS_LINE }}</span>
      </span>
    </div>
    <RouterLink class="btn btn-ghost btn-small" to="/exam">Start exam</RouterLink>
  </section>
</template>

<style scoped>
.exam-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding: 14px 20px;
}
.exam-strip__text {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
.exam-strip__title {
  font-weight: 800;
}
.exam-strip__meta {
  color: var(--ink-muted);
  font-size: 11px;
  font-weight: 600;
}
.exam-strip__last {
  color: var(--ink-muted);
  font-size: 13px;
}
.exam-strip__score {
  font-weight: 700;
}
.exam-strip__score--pass {
  color: var(--pass);
}
.exam-strip__score--fail {
  color: var(--fail);
}
</style>
