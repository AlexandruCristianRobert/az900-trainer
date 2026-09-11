<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    score: number
    max?: number
    threshold?: number
    thresholdLabel?: string
  }>(),
  {
    max: 1000,
    threshold: 700,
    thresholdLabel: '700 pass line',
  },
)

const fillWidth = computed(() => `${(props.score / props.max) * 100}%`)
const thresholdLeft = computed(() => `${(props.threshold / props.max) * 100}%`)
const passed = computed(() => props.score >= props.threshold)
const ariaLabel = computed(
  () => `Estimated score ${props.score} of ${props.max}; pass line ${props.threshold}`,
)
</script>

<template>
  <div class="score-scale" role="img" :aria-label="ariaLabel">
    <div class="score-scale__score">
      <span class="score-scale__value">{{ score }}</span>
      <span class="score-scale__max mono">/ {{ max }}</span>
    </div>
    <div class="score-scale__track">
      <div
        class="score-scale__fill"
        :class="passed ? 'score-scale__fill--pass' : 'score-scale__fill--fail'"
        :style="{ width: fillWidth }"
      ></div>
      <div class="score-scale__threshold" :style="{ left: thresholdLeft }">
        <span class="score-scale__threshold-label mono">{{ thresholdLabel }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.score-scale {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1.25rem;
}

.score-scale__score {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  flex: none;
}

.score-scale__value {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--ink);
}

.score-scale__max {
  color: var(--ink-muted);
  font-size: 0.95rem;
}

.score-scale__track {
  position: relative;
  flex: 1 1 16rem;
  min-width: 8rem;
  height: 0.85rem;
  margin-top: 1.1rem;
  border-radius: 999px;
  background: var(--track);
  overflow: visible;
}

.score-scale__fill {
  height: 100%;
  border-radius: 999px;
  animation: score-scale-grow 0.7s ease-out;
}

@keyframes score-scale-grow {
  from {
    width: 0%;
  }
}

.score-scale__fill--pass {
  background: var(--pass);
}

.score-scale__fill--fail {
  background: var(--fail);
}

.score-scale__threshold {
  position: absolute;
  top: -1.1rem;
  bottom: -0.2rem;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-scale__threshold::after {
  content: '';
  flex: 1;
  width: 0;
  margin-top: 0.15rem;
  border-left: 2px dashed var(--ink-muted);
}

.score-scale__threshold-label {
  white-space: nowrap;
  font-size: 0.7rem;
  color: var(--ink-muted);
}
</style>
