<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import SaveNotice from '@/components/SaveNotice.vue'
import XpMeter from '@/components/XpMeter.vue'
import { useProgressStore } from '@/stores/progress'

const route = useRoute()
const progress = useProgressStore()

/** The exam room strips chrome: no meter, nothing to look at but the clock. */
const isExamRoom = computed(() => route.name === 'exam' && progress.inProgressExam !== null)
const initFailed = ref(false)

onMounted(() => {
  void progress.init().catch(() => {
    initFailed.value = true
  })
})
</script>

<template>
  <div class="app-shell">
    <header class="app-bar">
      <RouterLink to="/" class="wordmark">
        <span class="wordmark__mark mono" aria-hidden="true">A</span>
        <span>AZ-900 Trainer</span>
      </RouterLink>
      <XpMeter v-if="progress.ready && !isExamRoom" :total-xp="progress.totalXp" />
    </header>

    <RouterView v-if="progress.ready" />
    <p v-else-if="initFailed" class="loading">
      Couldn't load your data. Try reloading, or clear this site's storage.
    </p>
    <p v-else class="loading eyebrow">Loading question bank…</p>

    <SaveNotice />
    <AppFooter />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 14px 28px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-header);
}
.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  line-height: 1;
  text-decoration: none;
}
.wordmark__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--accent), #6d28d9);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.loading {
  padding: 120px 32px;
  text-align: center;
  color: var(--ink-muted);
}
</style>
