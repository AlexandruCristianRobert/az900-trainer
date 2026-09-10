<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  /** ISO instant the Shot clock hits zero (CONTEXT.md: Shot clock). */
  deadline: string
  durationMs: number
}>()

const emit = defineEmits<{ expired: [] }>()

const TICK_MS = 100
const LOW_MS = 5_000

const nowMs = ref(Date.now())
let intervalId: ReturnType<typeof setInterval> | undefined
let expiredFor: string | null = null

/** Always the wall clock, never a decremented counter — a throttled tab must not gain time. */
const remainingMs = computed(() => Math.max(0, Date.parse(props.deadline) - nowMs.value))
const percent = computed(() => Math.round((remainingMs.value / props.durationMs) * 100))
const isLow = computed(() => remainingMs.value <= LOW_MS)
const display = computed(() => `0:${String(Math.ceil(remainingMs.value / 1000)).padStart(2, '0')}`)

function tick(): void {
  nowMs.value = Date.now()
  if (remainingMs.value === 0 && expiredFor !== props.deadline) {
    expiredFor = props.deadline
    emit('expired')
  }
}

watch(() => props.deadline, () => tick())

onMounted(() => {
  tick()
  intervalId = setInterval(tick, TICK_MS)
})
onBeforeUnmount(() => clearInterval(intervalId))
</script>

<template>
  <div class="shot-clock" :class="{ 'shot-clock--low': isLow }" role="timer" aria-label="Shot clock">
    <div class="shot-clock__track">
      <div class="shot-clock__fill" :style="{ width: `${percent}%` }"></div>
    </div>
    <span class="shot-clock__value mono">{{ display }}</span>
  </div>
</template>

<style scoped>
.shot-clock {
  --clock-color: var(--cyan);
  display: flex;
  align-items: center;
  gap: 12px;
}
.shot-clock--low {
  --clock-color: var(--fail);
}
.shot-clock__track {
  flex: 1;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--track);
}
.shot-clock__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--clock-color);
  transition: width 0.1s linear;
}
.shot-clock__value {
  min-width: 44px;
  text-align: right;
  color: var(--clock-color);
  font-size: 15px;
  font-weight: 700;
}
</style>
