<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  deadline: string
}>()

const emit = defineEmits<{
  expired: []
}>()

const LOW_MARK_MS = 5 * 60 * 1000
const LAST_MINUTE_MS = 60 * 1000

const nowMs = ref(Date.now())
const announcement = ref('')

let intervalId: ReturnType<typeof setInterval> | undefined
let expiredEmitted = false

/**
 * Always derived from the wall clock, never a decremented counter — a throttled
 * or suspended tab loses interval ticks but must never gain exam time.
 * `null` when the deadline is unparseable: a corrupt clock must fail safe, not
 * end the exam.
 */
const remainingMs = computed<number | null>(() => {
  const deadlineMs = Date.parse(props.deadline)
  if (!Number.isFinite(deadlineMs)) return null
  return Math.max(0, deadlineMs - nowMs.value)
})

const isLow = computed(() => remainingMs.value !== null && remainingMs.value <= LOW_MARK_MS)

const display = computed(() => {
  if (remainingMs.value === null) return '--:--'
  const totalSeconds = Math.ceil(remainingMs.value / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${pad(minutes)}:${pad(seconds)}`
})

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Announce only on the tick that crosses a mark, so nothing repeats per second. */
function announceCrossing(previousMs: number | null, currentMs: number | null): void {
  if (previousMs === null || currentMs === null) return
  if (previousMs > LAST_MINUTE_MS && currentMs <= LAST_MINUTE_MS) {
    announcement.value = '1 minute remaining'
  } else if (previousMs > LOW_MARK_MS && currentMs <= LOW_MARK_MS) {
    announcement.value = '5 minutes remaining'
  }
}

function emitExpiredOnce(): void {
  if (expiredEmitted || remainingMs.value === null || remainingMs.value > 0) return
  expiredEmitted = true
  emit('expired')
}

function tick(): void {
  const previousMs = remainingMs.value
  nowMs.value = Date.now()
  announceCrossing(previousMs, remainingMs.value)
  emitExpiredOnce()
}

onMounted(() => {
  emitExpiredOnce()
  intervalId = setInterval(tick, 1000)
})

onBeforeUnmount(() => {
  clearInterval(intervalId)
})
</script>

<template>
  <div class="timer" :class="{ 'timer--low': isLow }" role="timer">
    <span class="visually-hidden">Time remaining</span>
    <span class="timer__value mono">{{ display }}</span>
    <span class="visually-hidden" aria-live="polite">{{ announcement }}</span>
  </div>
</template>

<style scoped>
.timer {
  display: inline-flex;
  align-items: baseline;
  padding: 0.25rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-small);
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.timer__value {
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.timer--low {
  border-color: var(--fail);
  color: var(--fail);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
