<script setup lang="ts">
import type { DomainId } from '@/data/types'

defineProps<{ rows: { domain: DomainId; label: string; percent: number | null; answered: number }[] }>()
</script>

<template>
  <section class="card panel">
    <h3 class="eyebrow panel__title">Accuracy by domain</h3>
    <div class="domain-accuracy">
      <div v-for="row in rows" :key="row.domain" class="domain-accuracy__row">
        <div class="domain-accuracy__head">
          <span class="domain-accuracy__label">{{ row.label }}</span>
          <span class="domain-accuracy__meta mono">{{ row.percent === null ? 'no data' : `${row.percent}% · ${row.answered}` }}</span>
        </div>
        <div class="domain-accuracy__track">
          <div class="domain-accuracy__fill" :style="{ width: `${row.percent ?? 0}%` }"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  padding: 24px;
}
.panel__title {
  margin: 0 0 20px;
  font-size: 11px;
}
.domain-accuracy {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.domain-accuracy__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}
.domain-accuracy__label {
  font-size: 13px;
  font-weight: 700;
}
.domain-accuracy__meta {
  color: var(--ink-muted);
  font-size: 11px;
  font-weight: 600;
}
.domain-accuracy__track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--track);
}
.domain-accuracy__fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width var(--dur);
}
</style>
