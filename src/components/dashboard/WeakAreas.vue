<script setup lang="ts">
import type { TopicId } from '@/data/types'

defineProps<{
  rows: { topic: TopicId; label: string; percent: number }[]
  emptyMessage: string
}>()
const emit = defineEmits<{ drill: [TopicId] }>()
</script>

<template>
  <section class="card panel">
    <h3 class="eyebrow panel__title">Weak areas</h3>
    <div v-if="rows.length > 0" class="weak-list">
      <button v-for="row in rows" :key="row.topic" type="button" class="weak-row" @click="emit('drill', row.topic)">
        <span class="weak-row__label">{{ row.label }}</span>
        <span class="weak-row__percent mono">{{ row.percent }}%</span>
        <span class="weak-row__hint eyebrow">Drill →</span>
      </button>
    </div>
    <p v-else class="panel__empty">{{ emptyMessage }}</p>
  </section>
</template>

<style scoped>
.weak-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.weak-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 11px 14px;
  border: 1px solid var(--weak-line);
  border-radius: 10px;
  background: var(--weak-bg);
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--dur-fast);
}
.weak-row:hover {
  border-color: var(--fail);
}
.weak-row__label {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
}
.weak-row__percent {
  color: var(--fail);
  font-size: 12px;
  font-weight: 700;
}
.weak-row__hint {
  color: var(--ink-muted);
}
</style>
