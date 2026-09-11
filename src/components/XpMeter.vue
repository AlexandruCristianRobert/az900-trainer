<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { levelOf } from '@/domain/xp'

const props = defineProps<{ totalXp: number }>()

const STEPS = 12
const STEP_MS = 50

/** The number on screen; eases toward `totalXp` so a finished Round visibly pays out. */
const shown = ref(props.totalXp)
let timer: ReturnType<typeof setTimeout> | undefined

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

watch(
  () => props.totalXp,
  (target) => {
    clearTimeout(timer)
    if (reducedMotion()) {
      shown.value = target
      return
    }
    const from = shown.value
    let step = 0
    const tick = (): void => {
      step += 1
      shown.value = step >= STEPS ? target : Math.round(from + ((target - from) * step) / STEPS)
      if (step < STEPS) timer = setTimeout(tick, STEP_MS)
    }
    timer = setTimeout(tick, STEP_MS)
  },
)

onBeforeUnmount(() => clearTimeout(timer))

const progress = computed(() => levelOf(shown.value))
const percent = computed(() => Math.round((progress.value.into / progress.value.need) * 100))
</script>

<template>
  <div class="xp-meter" role="group" aria-label="Level and XP">
    <span class="xp-meter__level mono">LVL {{ progress.level }}</span>
    <div class="xp-meter__bar">
      <div class="xp-meter__labels">
        <span>XP</span>
        <span class="xp-meter__count">{{ progress.into }}/{{ progress.need }}</span>
      </div>
      <div class="xp-meter__track">
        <div class="xp-meter__fill" :style="{ width: `${percent}%` }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.xp-meter {
  display: flex;
  align-items: center;
  gap: 20px;
}
.xp-meter__level {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border: 1px solid var(--level-badge-line);
  border-radius: 999px;
  background: var(--level-badge-bg);
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}
.xp-meter__bar {
  width: 160px;
}
.xp-meter__labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-muted);
}
.xp-meter__track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--track);
}
.xp-meter__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--gold), var(--gold-deep));
  transition: width var(--dur) ease;
}
</style>
