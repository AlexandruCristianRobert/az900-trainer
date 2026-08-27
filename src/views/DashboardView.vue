<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import HistorySparkline from '@/components/HistorySparkline.vue'
import ScoreScale from '@/components/ScoreScale.vue'
import type { DomainId, TopicId } from '@/data/types'
import { DOMAINS, TOPICS } from '@/data/types'
import type { TopicStats } from '@/domain/analytics'
import { WEAK_AREA_ACCURACY_THRESHOLD } from '@/domain/analytics'
import { EXAM_QUESTION_COUNT, PASS_LINE } from '@/domain/examBlueprint'
import { useExamStore } from '@/stores/examSession'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()
const exam = useExamStore()
const router = useRouter()

/** The 70% weak-area line, as the whole number the bars are drawn against. */
const TOPIC_THRESHOLD_PERCENT = Math.round(WEAK_AREA_ACCURACY_THRESHOLD * 100)

const DOMAIN_DOT_MODIFIER: Record<DomainId, string> = {
  'cloud-concepts': 'domain__dot--cloud',
  'architecture-services': 'domain__dot--arch',
  'management-governance': 'domain__dot--gov',
}

// --- resume banner ----------------------------------------------------------

/**
 * Derived from the wall clock every second, exactly like ExamTimer — never a
 * decremented counter, so a backgrounded tab can never gain exam time.
 */
const nowMs = ref(Date.now())
let tickId: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  tickId = setInterval(() => {
    if (progress.inProgressExam) nowMs.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(tickId)
})

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

const remainingLabel = computed(() => {
  const totalSeconds = Math.ceil(exam.remainingMs(nowMs.value) / 1000)
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
})

// --- score history ----------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

/** `history` is newest first; the hero leads with it, the sparkline reverses it. */
const latest = computed(() => progress.history[0] ?? null)

const sparklinePoints = computed(() =>
  [...progress.history]
    .reverse()
    .map((entry) => ({ score: entry.score, label: formatDate(entry.endedAt) })),
)

// --- weak areas & topics ----------------------------------------------------

function toPercent(accuracy: number | null): number {
  return accuracy === null ? 0 : Math.round(accuracy * 100)
}

/** Drives the two distinct empty states: silence for lack of data vs. an all-clear. */
const someTopicsLackData = computed(() =>
  progress.topics.some((topic) => topic.verdict === 'not-enough-data'),
)

interface TopicRow {
  topic: TopicId
  label: string
  percent: number
  verdict: TopicStats['verdict']
}

interface DomainGroup {
  domain: DomainId
  label: string
  /** null when the Domain has no Answers at all — shown as an em dash, never 0%. */
  accuracyPercent: number | null
  dotModifier: string
  topics: TopicRow[]
}

const domainGroups = computed<DomainGroup[]>(() => {
  const statsByTopic = new Map(progress.topics.map((stats) => [stats.topic, stats]))
  return (Object.keys(DOMAINS) as DomainId[]).map((domain) => {
    const domainAccuracy = progress.domains.find((stats) => stats.domain === domain)?.accuracy ?? null
    return {
      domain,
      label: DOMAINS[domain].label,
      accuracyPercent: domainAccuracy === null ? null : toPercent(domainAccuracy),
      dotModifier: DOMAIN_DOT_MODIFIER[domain],
      topics: (Object.keys(TOPICS) as TopicId[])
        .filter((topic) => TOPICS[topic].domain === domain)
        .map((topic) => {
          const stats = statsByTopic.get(topic)
          return {
            topic,
            label: TOPICS[topic].label,
            percent: toPercent(stats?.accuracy ?? null),
            verdict: stats?.verdict ?? 'not-enough-data',
          }
        }),
    }
  })
})

// --- review deck ------------------------------------------------------------

function goToReview(): void {
  void router.push('/review')
}

// --- data controls ----------------------------------------------------------

const fileInput = ref<HTMLInputElement | null>(null)
const importFailed = ref(false)
const confirmingReset = ref(false)

function onExport(): void {
  const blob = new Blob([progress.exportProgress()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'az900-trainer-progress.json'
  // In the document and revoked a turn later: some browsers ignore a detached
  // link, and revoking synchronously can cancel the download it just started.
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function pickFile(): void {
  importFailed.value = false
  fileInput.value?.click()
}

async function onFileChosen(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await progress.importProgress(await file.text())
    importFailed.value = false
    confirmingReset.value = false
  } catch {
    // No alert(): a bad file reports itself in place, next to the control.
    importFailed.value = true
  } finally {
    // Clear the picker so re-choosing the same (fixed) file still fires a change.
    input.value = ''
  }
}

async function confirmReset(): Promise<void> {
  await progress.resetProgress()
  confirmingReset.value = false
  importFailed.value = false
}
</script>

<template>
  <main class="page dashboard">
    <section v-if="progress.inProgressExam" class="card resume">
      <p class="resume__line">
        Exam in progress — <span class="mono">{{ remainingLabel }}</span> left
      </p>
      <RouterLink class="btn btn-primary" to="/exam">Resume exam</RouterLink>
    </section>

    <section class="card hero">
      <template v-if="!latest">
        <div class="hero__text">
          <h1>Ready to find your gaps?</h1>
          <p class="hero__lede">
            Sit the full {{ EXAM_QUESTION_COUNT }}-question exam to see where you stand — or drill
            one topic at a time.
          </p>
        </div>
        <div class="hero__actions">
          <RouterLink class="btn btn-primary" to="/exam">Take a baseline exam</RouterLink>
          <RouterLink class="btn btn-ghost" to="/practice">Practice by topic</RouterLink>
        </div>
      </template>
      <template v-else>
        <div class="hero__text">
          <h1>Your progress</h1>
          <p class="hero__lede">
            Latest exam — <span class="mono">{{ formatDate(latest.endedAt) }}</span>
          </p>
          <ScoreScale class="hero__scale" :score="latest.score" :threshold="PASS_LINE" />
        </div>
        <div class="hero__actions">
          <RouterLink class="btn btn-primary" to="/exam">Start exam</RouterLink>
          <RouterLink class="btn btn-ghost" to="/practice">Practice by topic</RouterLink>
        </div>
      </template>
    </section>

    <div class="dash-grid">
      <section class="card panel">
        <h2>Score history</h2>
        <p v-if="progress.history.length === 0" class="panel__empty">No exams yet.</p>
        <template v-else>
          <HistorySparkline
            :points="sparklinePoints"
            :threshold="PASS_LINE"
            :threshold-label="String(PASS_LINE)"
          />
          <ul class="history">
            <li v-for="entry in progress.history" :key="entry.sessionId">
              <RouterLink class="history__row" :to="`/results/${entry.sessionId}`">
                <span class="history__date">{{ formatDate(entry.endedAt) }}</span>
                <span v-if="entry.status === 'expired'" class="chip chip--warn">Not finished</span>
                <span
                  class="history__score mono"
                  :class="entry.passed ? 'history__score--pass' : 'history__score--fail'"
                >
                  {{ entry.score }}
                  <span class="visually-hidden">
                    {{ entry.passed ? 'above the pass line' : 'below the pass line' }}
                  </span>
                </span>
              </RouterLink>
            </li>
          </ul>
        </template>
      </section>

      <section class="card panel">
        <h2>Weak areas</h2>
        <ul v-if="progress.weakAreas.length > 0" class="weak">
          <li v-for="stats in progress.weakAreas" :key="stats.topic" class="weak__row">
            <span class="weak__label">{{ TOPICS[stats.topic].label }}</span>
            <span class="weak__stats">
              <span class="weak__percent mono">{{ toPercent(stats.accuracy) }}%</span>
              <span class="weak__answered">{{ stats.answered }} answered</span>
            </span>
          </li>
        </ul>
        <p v-else class="panel__empty">
          {{
            someTopicsLackData
              ? 'Not enough data yet — keep practicing.'
              : 'No weak areas. Nice.'
          }}
        </p>
      </section>

      <section class="card panel panel--wide">
        <div class="panel__head">
          <h2>Topics</h2>
          <p class="threshold-key">
            <span class="threshold-key__mark" aria-hidden="true"></span>
            <span class="mono">{{ TOPIC_THRESHOLD_PERCENT }}%</span> target
          </p>
        </div>

        <div v-for="group in domainGroups" :key="group.domain" class="domain">
          <h3 class="domain__head">
            <span class="domain__dot" :class="group.dotModifier" aria-hidden="true"></span>
            <span class="domain__label">{{ group.label }}</span>
            <span class="domain__percent mono">
              <template v-if="group.accuracyPercent === null">
                —<span class="visually-hidden">no answers yet</span>
              </template>
              <template v-else>{{ group.accuracyPercent }}%</template>
            </span>
          </h3>

          <div v-for="row in group.topics" :key="row.topic" class="topic">
            <div class="topic__head">
              <span class="topic__label">{{ row.label }}</span>
              <span v-if="row.verdict === 'not-enough-data'" class="topic__note">
                Not enough data
              </span>
              <span
                v-else
                class="topic__percent mono"
                :class="row.verdict === 'weak' ? 'topic__percent--weak' : 'topic__percent--ok'"
              >
                {{ row.percent }}%
              </span>
            </div>
            <div v-if="row.verdict !== 'not-enough-data'" class="topic__track">
              <div
                class="topic__fill"
                :class="row.verdict === 'weak' ? 'topic__fill--weak' : 'topic__fill--ok'"
                :style="{ width: `${row.percent}%` }"
              ></div>
              <span
                class="topic__tick"
                :style="{ left: `${TOPIC_THRESHOLD_PERCENT}%` }"
                aria-hidden="true"
              ></span>
            </div>
          </div>
        </div>
      </section>

      <section class="card panel">
        <h2>Review deck</h2>
        <p v-if="progress.deck.length > 0" class="deck__count mono">
          {{ progress.deck.length }} question{{ progress.deck.length === 1 ? '' : 's' }} to review
        </p>
        <p v-else class="panel__empty">No missed questions — they'll collect here.</p>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="progress.deck.length === 0"
          @click="goToReview"
        >
          Review now
        </button>
      </section>

      <section class="card panel">
        <h2>Data</h2>
        <p class="panel__lede">Everything you answer stays in this browser.</p>
        <div class="data__actions">
          <button class="btn btn-ghost" type="button" @click="onExport">Export progress</button>
          <button class="btn btn-ghost" type="button" @click="pickFile">Import progress</button>
          <button
            v-if="!confirmingReset"
            class="btn btn-ghost data__reset"
            type="button"
            @click="confirmingReset = true"
          >
            Reset all progress
          </button>
          <button v-else class="btn data__reset--armed" type="button" @click="confirmReset">
            Confirm reset — this deletes all sessions and answers
          </button>
        </div>
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept=".json,application/json"
          @change="onFileChosen"
        />
        <p v-if="importFailed" class="data__error">That file isn't a valid progress export.</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.card {
  padding: 1.5rem;
}

.resume,
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.resume {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.resume__line {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
}

.hero {
  align-items: flex-end;
}

.hero__text {
  flex: 1 1 20rem;
  min-width: 0;
}

.hero__text h1 {
  margin-bottom: 0.35rem;
}

.hero__lede {
  margin: 0;
  color: var(--ink-muted);
}

.hero__scale {
  margin-top: 1.25rem;
}

/* A summary, not the results page's headline — the numeral steps down a size. */
.hero__scale :deep(.score-scale__value) {
  font-size: 2rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* min() keeps the track from forcing a horizontal scrollbar below ~17rem wide. */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(17rem, 100%), 1fr));
  gap: 1.5rem;
}

.panel--wide {
  grid-column: 1 / -1;
}

.panel h2 {
  margin-bottom: 1rem;
  font-size: 1.05rem;
}

.panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.panel__empty,
.panel__lede {
  margin: 0 0 1rem;
  color: var(--ink-muted);
}

/* The threshold key: one dashed swatch, so the ticks below need no per-bar label. */
.threshold-key {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 1rem;
  color: var(--ink-muted);
  font-size: 0.8rem;
}

.threshold-key__mark {
  width: 0;
  height: 0.85rem;
  border-left: 2px dashed var(--ink-muted);
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.chip--warn {
  background: color-mix(in srgb, var(--warn) 16%, transparent);
  color: var(--warn);
}

.history,
.weak {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.history__row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-small);
  color: var(--ink);
  text-decoration: none;
}

.history__row:hover {
  background: var(--accent-soft);
}

.history__date {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.85rem;
}

.history__score {
  flex: none;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.history__score--pass {
  color: var(--pass);
}

.history__score--fail {
  color: var(--fail);
}

.weak__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.7rem;
  border-left: 3px solid var(--fail);
  border-radius: var(--radius-small);
  background: color-mix(in srgb, var(--fail) 8%, transparent);
  font-size: 0.9rem;
}

.weak__stats {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.weak__percent {
  color: var(--fail);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.weak__answered {
  color: var(--ink-muted);
  font-size: 0.8rem;
}

.domain {
  margin-bottom: 1.5rem;
}

.domain:last-child {
  margin-bottom: 0;
}

.domain__head {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
}

.domain__dot {
  flex: none;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
}

.domain__dot--cloud {
  background: var(--domain-cloud);
}

.domain__dot--arch {
  background: var(--domain-arch);
}

.domain__dot--gov {
  background: var(--domain-gov);
}

.domain__label {
  flex: 1;
  min-width: 0;
}

.domain__percent {
  flex: none;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}

.topic {
  margin-bottom: 0.75rem;
  padding-left: 1.2rem;
}

.topic:last-child {
  margin-bottom: 0;
}

.topic__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
}

.topic__label {
  min-width: 0;
}

.topic__note,
.topic__percent {
  flex: none;
}

.topic__note {
  color: var(--ink-muted);
  font-size: 0.8rem;
}

.topic__percent {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.topic__percent--weak {
  color: var(--fail);
}

.topic__percent--ok {
  color: var(--pass);
}

.topic__track {
  position: relative;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--accent-soft);
}

.topic__fill {
  height: 100%;
  border-radius: 999px;
}

.topic__fill--weak {
  background: var(--fail);
}

.topic__fill--ok {
  background: var(--pass);
}

/* The 70% threshold tick — the same dashed motif as ScoreScale's pass line. */
.topic__tick {
  position: absolute;
  top: -0.15rem;
  bottom: -0.15rem;
  width: 0;
  border-left: 2px dashed var(--ink-muted);
}

.deck__count {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.data__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.data__reset,
.data__reset--armed {
  color: var(--fail);
}

.data__reset {
  border-color: var(--line);
}

.data__reset--armed {
  border-color: var(--fail);
  background: color-mix(in srgb, var(--fail) 10%, transparent);
}

.data__error {
  margin: 1rem 0 0;
  color: var(--ink-muted);
  font-size: 0.85rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
