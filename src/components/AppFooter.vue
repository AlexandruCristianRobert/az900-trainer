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
  max-width: 1040px;
  margin: 0 auto;
  padding: 18px 28px 28px;
  border-top: 1px solid var(--line);
  color: var(--ink-muted);
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
}

.app-footer__version {
  margin-top: 0.35rem;
  font-family: var(--font-mono);
}
</style>
