<script setup lang="ts">
import { STUDY_GUIDE_VERSION } from '@/data/questions'
</script>

<template>
  <footer class="app-footer">
    <p>
      Unofficial study aid. Not affiliated with or endorsed by Microsoft. All questions are original,
      written from the public AZ-900 study guide objectives.
    </p>
    <p class="app-footer__version">{{ STUDY_GUIDE_VERSION }}</p>
  </footer>
</template>

<style scoped>
.app-footer {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 2.5rem;
  color: var(--ink-muted);
  font-size: 0.85rem;
  line-height: 1.5;
}

.app-footer__version {
  margin-top: 0.35rem;
  font-family: var(--font-mono);
}
</style>
