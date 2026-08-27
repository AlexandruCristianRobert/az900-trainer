<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  total: number
  currentIndex: number
  isAnswered: (index: number) => boolean
}>()

const emit = defineEmits<{
  goTo: [number]
}>()

const indexes = computed(() => Array.from({ length: props.total }, (_, index) => index))

function itemLabel(index: number): string {
  return `Question ${index + 1}, ${props.isAnswered(index) ? 'answered' : 'unanswered'}`
}
</script>

<template>
  <nav class="question-grid" aria-label="Exam questions">
    <button
      v-for="index in indexes"
      :key="index"
      type="button"
      class="grid-item mono"
      :class="{
        'grid-item--current': index === currentIndex,
        'grid-item--answered': isAnswered(index),
      }"
      :aria-label="itemLabel(index)"
      :aria-current="index === currentIndex ? 'true' : undefined"
      @click="emit('goTo', index)"
    >
      {{ index + 1 }}
    </button>
  </nav>
</template>

<style scoped>
.question-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.grid-item {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-small);
  background: var(--surface);
  color: var(--ink-muted);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

.grid-item:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.grid-item--answered {
  background: var(--accent-soft);
  border-color: var(--accent-soft);
  color: var(--accent);
}

.grid-item--current {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent);
  color: var(--accent);
}
</style>
