<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BreakdownList from '@/components/BreakdownList.vue'
import { roundBreakdownRows } from '@/components/breakdownRows'
import type { Session } from '@/domain/entities'
import { summarizeRound } from '@/domain/roundSummary'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{ session: Session }>()
const progress = useProgressStore()

const summary = computed(() => summarizeRound(props.session, progress.answers))
const rows = computed(() => roundBreakdownRows(summary.value.answers, progress.questionById))
const hasMissed = computed(() => summary.value.correctCount < summary.value.total)
const newRoundPath = computed(() => `/${props.session.mode}`)
</script>

<template>
  <div class="fade-up">
    <div v-if="summary.leveledUp" class="level-up" role="status">
      <span class="level-up__text">Level {{ summary.levelAfter }} reached!</span>
    </div>

    <div class="headline">
      <span class="headline__percent mono"
        >{{ summary.accuracyPercent }}<span class="headline__sign">%</span></span
      >
      <h1 class="headline__title">{{ summary.headline }}</h1>
    </div>

    <div class="tiles">
      <div class="tile">
        <div class="tile__label eyebrow">Correct</div>
        <div class="tile__value">{{ summary.correctCount }}/{{ summary.total }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">XP earned</div>
        <div class="tile__value tile__value--gold">+{{ summary.xpGained }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">Best streak</div>
        <div class="tile__value tile__value--accent">×{{ summary.bestStreak }}</div>
      </div>
    </div>

    <h2 class="eyebrow section-title">Breakdown</h2>
    <BreakdownList :rows="rows" />

    <div class="results-actions">
      <RouterLink class="btn btn-primary" :to="newRoundPath">New round</RouterLink>
      <RouterLink v-if="hasMissed" class="btn btn-outline btn-outline--gold" to="/review">
        Start review
      </RouterLink>
      <RouterLink class="btn btn-ghost" to="/">Dashboard</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.level-up {
  padding: 18px 24px;
  margin-bottom: 28px;
  border: 1px solid var(--gold);
  border-radius: var(--radius-large);
  background: linear-gradient(135deg, rgb(255 197 61 / 0.16), rgb(139 92 246 / 0.16));
  animation: pop var(--dur) ease-out;
}
.level-up__text {
  color: var(--gold);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
}
.headline {
  display: flex;
  align-items: baseline;
  gap: 20px;
  flex-wrap: wrap;
}
.headline__percent {
  font-size: clamp(64px, 11vw, 110px);
  font-weight: 700;
  line-height: 0.95;
}
.headline__sign {
  color: var(--accent);
}
.headline__title {
  margin: 0;
  font-size: clamp(24px, 3.6vw, 34px);
  font-weight: 900;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-top: 30px;
}
.tile__value--gold {
  color: var(--gold);
}
.tile__value--accent {
  color: var(--accent);
}
.section-title {
  margin: 40px 0 14px;
}
.results-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}
.btn-outline--gold {
  --btn-color: var(--gold);
}
</style>
