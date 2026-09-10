<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { DOMAINS, type DomainId } from '@/data/types'
import { ROUND_SIZE, SHOT_CLOCK_MS } from '@/domain/roundBlueprint'
import type { DomainChoice, FeedbackTiming } from '@/domain/preferences'

defineProps<{
  domain: DomainChoice
  feedbackTiming: FeedbackTiming
  reviewCount: number
}>()

const emit = defineEmits<{
  'update:domain': [DomainChoice]
  'update:feedbackTiming': [FeedbackTiming]
}>()

const CHIPS: { id: DomainChoice; label: string }[] = [
  { id: 'all', label: 'All' },
  ...(Object.keys(DOMAINS) as DomainId[]).map((id) => ({ id, label: DOMAINS[id].shortLabel })),
]
const TIMINGS: { id: FeedbackTiming; label: string }[] = [
  { id: 'instant', label: 'Instant' },
  { id: 'end-of-round', label: 'End of round' },
]
const SHOT_CLOCK_SECONDS = SHOT_CLOCK_MS / 1000
</script>

<template>
  <div class="mode-cards">
    <section class="card mode-card mode-card--practice">
      <h2 class="mode-card__title"><span class="mode-card__dot" aria-hidden="true"></span>Practice round</h2>
      <p class="mode-card__lede">{{ ROUND_SIZE }} questions with Streak bonuses and an explanation for every option.</p>
      <div>
        <div class="eyebrow mode-card__label">Domains</div>
        <div class="chips">
          <button
            v-for="chip in CHIPS"
            :key="chip.id"
            type="button"
            class="chip-button"
            :aria-pressed="domain === chip.id"
            @click="emit('update:domain', chip.id)"
          >
            {{ chip.label }}
          </button>
        </div>
      </div>
      <div>
        <div class="eyebrow mode-card__label">Feedback</div>
        <div class="segmented">
          <button
            v-for="timing in TIMINGS"
            :key="timing.id"
            type="button"
            class="segmented__option"
            :aria-pressed="feedbackTiming === timing.id"
            @click="emit('update:feedbackTiming', timing.id)"
          >
            {{ timing.label }}
          </button>
        </div>
      </div>
      <RouterLink class="btn btn-primary mode-card__cta" to="/practice">Start round</RouterLink>
    </section>

    <section class="card mode-card mode-card--sprint">
      <h2 class="mode-card__title"><span class="mode-card__dot" aria-hidden="true"></span>Sprint</h2>
      <p class="mode-card__lede">Beat the Shot clock. Correct answers earn a speed bonus. No pausing.</p>
      <p class="mode-card__big"><span class="mono mode-card__number">{{ SHOT_CLOCK_SECONDS }}s</span><span class="eyebrow">per question</span></p>
      <RouterLink class="btn btn-outline mode-card__cta" to="/sprint">Start sprint</RouterLink>
    </section>

    <section class="card mode-card mode-card--review">
      <h2 class="mode-card__title"><span class="mode-card__dot" aria-hidden="true"></span>Review</h2>
      <p class="mode-card__lede">
        {{ reviewCount > 0 ? 'Questions in your review deck. One correct answer clears each.' : 'Your review deck is empty. A wrong answer lands here.' }}
      </p>
      <p class="mode-card__big"><span class="mono mode-card__number">{{ reviewCount }}</span></p>
      <RouterLink v-if="reviewCount > 0" class="btn btn-outline mode-card__cta" to="/review">Start review</RouterLink>
      <button v-else class="btn btn-outline mode-card__cta" type="button" disabled>Start review</button>
    </section>
  </div>
</template>

<style scoped>
.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 32px;
}
.mode-card {
  --card-color: var(--accent);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  transition: border-color var(--dur-fast);
}
.mode-card:hover {
  border-color: var(--card-color);
}
.mode-card--sprint {
  --card-color: var(--cyan);
}
.mode-card--review {
  --card-color: var(--gold);
}
.mode-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 19px;
}
.mode-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--card-color);
}
.mode-card__lede {
  margin: 0;
  color: var(--ink-muted);
  font-size: 14px;
}
.mode-card__label {
  margin-bottom: 8px;
}
.mode-card__big {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0;
}
.mode-card__number {
  color: var(--card-color);
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
}
.mode-card__cta {
  width: 100%;
  margin-top: auto;
  --btn-color: var(--card-color);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip-button {
  padding: 7px 13px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-muted);
  font: 700 12px/1 var(--font-body);
  cursor: pointer;
  transition: all var(--dur-fast);
}
.chip-button[aria-pressed='true'] {
  border-color: var(--accent);
  background: rgb(139 92 246 / 0.2);
  color: var(--accent-text);
}
.segmented {
  display: flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: var(--radius-small);
  background: var(--bg);
}
.segmented__option {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-muted);
  font: 700 12px/1 var(--font-body);
  cursor: pointer;
  transition: all var(--dur-fast);
}
.segmented__option[aria-pressed='true'] {
  background: var(--accent);
  color: #fff;
}
</style>
