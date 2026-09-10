<script setup lang="ts">
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
</script>

<template>
  <div v-if="progress.saveFailed" class="save-notice" role="alert">
    <span>Couldn't save your last answer to this browser. What you see is still correct for this tab.</span>
    <button type="button" class="btn btn-ghost btn-small" @click="progress.dismissSaveFailure()">Dismiss</button>
  </div>
</template>

<style scoped>
.save-notice {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(420px, calc(100vw - 32px));
  padding: 12px 14px;
  border: 1px solid var(--fail);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-size: 13px;
  animation: fade-up var(--dur) ease-out;
}
</style>
