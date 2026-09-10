<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  index: number
  /** Outcome per answered Question, in order. */
  outcomes: boolean[]
  /** End-of-round Feedback timing: answered segments show done, not pass/fail. */
  neutral: boolean
}>()

const segments = computed(() =>
  Array.from({ length: props.total }, (_, i) => {
    if (i < props.outcomes.length) {
      if (props.neutral) return 'seg--done'
      return props.outcomes[i] ? 'seg--pass' : 'seg--fail'
    }
    return i === props.index ? 'seg--current' : 'seg--todo'
  }),
)
</script>

<template>
  <div
    class="round-progress"
    role="progressbar"
    aria-label="Round progress"
    :aria-valuemin="0"
    :aria-valuenow="outcomes.length"
    :aria-valuemax="total"
  >
    <span v-for="(modifier, i) in segments" :key="i" class="seg" :class="modifier"></span>
  </div>
</template>

<style scoped>
.round-progress {
  display: flex;
  gap: 5px;
}
.seg {
  flex: 1;
  height: 7px;
  border-radius: 999px;
  background: var(--track);
  transition: background var(--dur-fast);
}
.seg--pass {
  background: var(--pass);
}
.seg--fail {
  background: var(--fail);
}
.seg--done {
  background: #4a4a66;
}
.seg--current {
  background: var(--accent);
  animation: pulse-seg 1.4s ease-in-out infinite;
}
</style>
