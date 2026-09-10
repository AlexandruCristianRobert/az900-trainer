<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import DataControls from '@/components/dashboard/DataControls.vue'
import DomainAccuracy from '@/components/dashboard/DomainAccuracy.vue'
import ExamStrip from '@/components/dashboard/ExamStrip.vue'
import ModeCards from '@/components/dashboard/ModeCards.vue'
import WeakAreas from '@/components/dashboard/WeakAreas.vue'
import { DOMAINS, TOPICS, type DomainId, type TopicId } from '@/data/types'
import { useExamStore } from '@/stores/examSession'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
const exam = useExamStore()
const router = useRouter()

// --- resume banner: wall-clock derived every second, like ExamTimer ------------
const nowMs = ref(Date.now())
let tickId: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  tickId = setInterval(() => {
    if (progress.inProgressExam) nowMs.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => clearInterval(tickId))

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
const remainingLabel = computed(() => {
  const totalSeconds = Math.ceil(exam.remainingMs(nowMs.value) / 1000)
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
})

// --- tiles ---------------------------------------------------------------------
const xpToNext = computed(() => progress.level.need - progress.level.into)

// --- exam strip ----------------------------------------------------------------
const lastScore = computed(() => progress.history[0]?.score ?? null)

// --- panels --------------------------------------------------------------------
const domainRows = computed(() =>
  (Object.keys(DOMAINS) as DomainId[]).map((domain) => {
    const stats = progress.domains.find((d) => d.domain === domain)
    return {
      domain,
      label: DOMAINS[domain].shortLabel,
      percent: stats && stats.accuracy !== null ? Math.round(stats.accuracy * 100) : null,
      answered: stats?.answered ?? 0,
    }
  }),
)
const weakRows = computed(() =>
  progress.weakAreas.map((stats) => ({
    topic: stats.topic,
    label: TOPICS[stats.topic].label,
    percent: Math.round((stats.accuracy ?? 0) * 100),
  })),
)
const weakEmptyMessage = computed(() =>
  progress.topics.some((t) => t.verdict === 'not-enough-data')
    ? 'Not enough data yet — keep practicing.'
    : 'No weak areas. Nice.',
)

function drill(topic: TopicId): void {
  void router.push({ path: '/practice', query: { topic } })
}
</script>

<template>
  <main class="page dashboard fade-up">
    <section v-if="progress.inProgressExam" class="card resume">
      <p class="resume__line">Exam in progress — <span class="mono">{{ remainingLabel }}</span> left</p>
      <RouterLink class="btn btn-primary" to="/exam">Resume exam</RouterLink>
    </section>

    <h1 class="hero">Level up your Azure fundamentals.</h1>
    <p class="hero__lede">
      {{ progress.questions.length }} original questions across all three AZ-900 domains. Ten at a time, one per
      screen — Streaks multiply your XP.
    </p>

    <div class="stats">
      <div class="tile">
        <div class="tile__label eyebrow">Level</div>
        <div class="tile__value tile__value--gold">{{ progress.level.level }}</div>
        <div class="tile__sub">{{ xpToNext }} XP to lvl {{ progress.level.level + 1 }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">Total XP</div>
        <div class="tile__value">{{ progress.totalXp }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">Best streak</div>
        <div class="tile__value tile__value--accent">×{{ progress.bestStreak }}</div>
      </div>
      <div class="tile">
        <div class="tile__label eyebrow">To review</div>
        <div class="tile__value">{{ progress.deck.length }}</div>
      </div>
    </div>

    <ModeCards
      :domain="progress.preferences.domain"
      :feedback-timing="progress.preferences.feedbackTiming"
      :review-count="progress.deck.length"
      @update:domain="progress.updatePreferences({ domain: $event })"
      @update:feedback-timing="progress.updatePreferences({ feedbackTiming: $event })"
    />

    <ExamStrip :last-score="lastScore" />

    <div class="panels">
      <DomainAccuracy :rows="domainRows" />
      <WeakAreas :rows="weakRows" :empty-message="weakEmptyMessage" @drill="drill" />
    </div>

    <DataControls />
  </main>
</template>

<style scoped>
.resume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
  padding: 16px 20px;
  border-color: var(--gold);
}
.resume__line {
  margin: 0;
  font-weight: 700;
}
.hero {
  margin: 0 0 10px;
  font-size: clamp(30px, 4.5vw, 44px);
  font-weight: 900;
}
.hero__lede {
  max-width: 58ch;
  margin: 0 0 36px;
  color: var(--ink-muted);
  font-size: 17px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}
.tile__value--gold {
  color: var(--gold);
}
.tile__value--accent {
  color: var(--accent);
}
.panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 18px;
  margin-top: 32px;
}
</style>
