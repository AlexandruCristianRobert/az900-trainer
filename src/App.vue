<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import { useProgressStore } from '@/stores/progress'

const route = useRoute()
const progress = useProgressStore()

const isExamRoom = computed(() => route.name === 'exam')
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
        <span class="wordmark__accent">AZ-900</span> Trainer
      </RouterLink>
      <nav v-if="!isExamRoom" class="app-nav" aria-label="Main">
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/practice">Practice</RouterLink>
        <RouterLink to="/review">Review</RouterLink>
      </nav>
    </header>

    <RouterView v-if="progress.ready" />
    <p v-else-if="initFailed" class="loading">
      Couldn't load your data. Try reloading, or clear this site's storage.
    </p>
    <p v-else class="loading">Loading…</p>

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
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--line);
}

.wordmark {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ink);
  text-decoration: none;
}

.wordmark__accent {
  color: var(--accent);
}

.app-nav {
  display: flex;
  gap: 1.25rem;
}

.app-nav a {
  color: var(--ink-muted);
  font-weight: 600;
  text-decoration: none;
}

.app-nav a:hover,
.app-nav a.router-link-active {
  color: var(--accent);
}

.loading {
  padding: 2rem 1.5rem;
  color: var(--ink-muted);
}
</style>
