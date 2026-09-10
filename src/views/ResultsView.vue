<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ExamResults from '@/components/results/ExamResults.vue'
import RoundResults from '@/components/results/RoundResults.vue'
import type { Session } from '@/domain/entities'
import { useProgressStore } from '@/stores/progress'

const props = defineProps<{ sessionId: string }>()
const progress = useProgressStore()

/** Any terminated Session has a results page; in-progress ones don't exist yet. */
const validSession = computed<Session | null>(() => {
  const found = progress.sessions.find((s) => s.id === props.sessionId)
  return !found || found.status === 'in-progress' ? null : found
})
</script>

<template>
  <main class="page" :class="{ 'page--narrow': validSession?.mode !== 'exam' }">
    <div v-if="!validSession" class="card not-found">
      <h1>This results page doesn't exist.</h1>
      <RouterLink class="btn btn-primary" to="/">Back to dashboard</RouterLink>
    </div>
    <ExamResults v-else-if="validSession.mode === 'exam'" :session="validSession" />
    <RoundResults v-else :session="validSession" />
  </main>
</template>

<style scoped>
.not-found {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
</style>
