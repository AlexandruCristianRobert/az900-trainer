<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, RouterLink, useRoute, useRouter } from 'vue-router'
import QuestionCard from '@/components/QuestionCard.vue'
import RoundProgress from '@/components/RoundProgress.vue'
import ShotClock from '@/components/ShotClock.vue'
import { DOMAINS, TOPICS, type DomainId, type TopicId } from '@/data/types'
import type { RoundMode } from '@/domain/entities'
import { poolLabel, SHOT_CLOCK_MS, type PoolSpec } from '@/domain/roundBlueprint'
import { useProgressStore } from '@/stores/progress'
import { useRoundStore } from '@/stores/roundSession'

const props = defineProps<{ mode: RoundMode }>()

const route = useRoute()
const router = useRouter()
const progress = useProgressStore()
const roundStore = useRoundStore()

const HEADING: Record<RoundMode, string> = { practice: 'Practice round', sprint: 'Sprint', review: 'Review' }

/** Submit and Next occupy the same pixels, so a double-click submits and advances (DataControls' grace, same rationale). */
const PRIMARY_GRACE_MS = 350

/** `?topic=` beats `?domain=` beats the remembered Domain chip; Review always uses the deck. */
function poolFromRoute(): PoolSpec {
  if (props.mode === 'review') return { kind: 'review' }
  const topic = route.query.topic
  const domain = route.query.domain
  // hasOwn, not `in`: `in` would accept Object.prototype keys ('toString') as ids.
  if (typeof topic === 'string' && Object.hasOwn(TOPICS, topic)) return { kind: 'topic', topic: topic as TopicId }
  if (typeof domain === 'string' && Object.hasOwn(DOMAINS, domain)) return { kind: 'domain', domain: domain as DomainId }
  const remembered = progress.preferences.domain
  return remembered === 'all' ? { kind: 'all' } : { kind: 'domain', domain: remembered }
}

const started = roundStore.startRound(props.mode, poolFromRoute())
const finishing = ref(false)
let lastPrimaryMs = 0

const round = computed(() => roundStore.round)
const position = computed(() => String((round.value?.index ?? 0) + 1).padStart(2, '0'))
const outcomes = computed(() => round.value?.results.map((r) => r.correct) ?? [])

const primaryLabel = computed(() => {
  if (roundStore.showReveal) return roundStore.isLast ? 'See results' : 'Next'
  if (!roundStore.revealsInstantly) return roundStore.isLast ? 'Finish' : 'Next'
  return 'Submit'
})
const primaryDisabled = computed(() => !roundStore.showReveal && !roundStore.canSubmit)

const revealMessage = computed(() => {
  const r = round.value
  if (!r || !roundStore.showReveal) return ''
  if (r.lastCorrect) return `Correct +${r.lastGain} XP`
  return r.timedOut ? 'Time up' : 'Incorrect'
})
const showStreak = computed(() => {
  const r = round.value
  return r !== null && r.streak >= 2 && !(roundStore.showReveal && !r.lastCorrect)
})

const emptyMessage =
  props.mode === 'review' ? 'Nothing to review yet. A wrong answer lands here.' : 'No questions here yet.'

async function leaveToResults(sessionId: string | null): Promise<void> {
  finishing.value = true
  if (sessionId) await router.push({ name: 'results', params: { sessionId } })
  else await router.push('/')
}

async function primary(): Promise<void> {
  const now = Date.now()
  if (finishing.value || !round.value || now - lastPrimaryMs < PRIMARY_GRACE_MS) return
  lastPrimaryMs = now
  const sessionId = roundStore.showReveal ? await roundStore.advance() : await roundStore.submit()
  if (!roundStore.round) await leaveToResults(sessionId)
}

/** 1–5 pick an option, Enter is the primary action — unless a button or link has focus. */
function onKeydown(event: KeyboardEvent): void {
  if (event.repeat) return
  if (!round.value) return
  if (event.key === 'Enter') {
    const target = event.target as HTMLElement | null
    if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) return
    event.preventDefault()
    void primary()
    return
  }
  // A modifier means a browser or OS shortcut (Ctrl+1 switches tab), not a pick.
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const n = Number(event.key)
  if (n >= 1 && n <= 5) {
    const option = roundStore.currentQuestion?.options[n - 1]
    if (option) roundStore.togglePick(option.id)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  void roundStore.exit()
})
onBeforeRouteLeave(() => {
  void roundStore.exit()
  return true
})
</script>

<template>
  <main v-if="!started" class="page page--narrow fade-up">
    <div class="card empty">
      <h1>{{ HEADING[mode] }}</h1>
      <p class="empty__copy">{{ emptyMessage }}</p>
      <RouterLink class="btn btn-ghost" to="/">Dashboard</RouterLink>
    </div>
  </main>

  <main v-else-if="round && roundStore.currentQuestion" class="page page--narrow">
    <div class="round-bar">
      <div class="round-bar__group">
        <span class="round-bar__position mono">{{ position }}/{{ roundStore.total }}</span>
        <span class="eyebrow">{{ poolLabel(round.pool) }}</span>
      </div>
      <div class="round-bar__group">
        <span v-if="showStreak" :key="round.streak" class="streak-badge mono">STREAK ×{{ round.streak }}</span>
        <span class="round-bar__xp mono">+{{ round.xpGained }} XP</span>
        <RouterLink class="btn btn-ghost btn-small" to="/">Exit</RouterLink>
      </div>
    </div>

    <RoundProgress
      class="round-progress"
      :total="roundStore.total"
      :index="round.index"
      :outcomes="outcomes"
      :neutral="!roundStore.revealsInstantly"
    />

    <ShotClock
      v-if="round.mode === 'sprint' && round.shotClockDeadline"
      class="round-clock"
      :deadline="round.shotClockDeadline"
      :duration-ms="SHOT_CLOCK_MS"
      @expired="roundStore.timeout()"
    />

    <QuestionCard
      :key="roundStore.currentQuestion.id"
      class="round-question"
      :question="roundStore.currentQuestion"
      :model-value="round.picked"
      :graded="roundStore.showReveal"
      :show-verdict="false"
      show-question-id
      @update:model-value="roundStore.setPicked"
    />

    <div class="round-actions">
      <span
        v-if="revealMessage"
        class="reveal-pill mono"
        :class="round.lastCorrect ? 'reveal-pill--pass' : 'reveal-pill--fail'"
      >
        {{ revealMessage }}
      </span>
      <span v-else></span>
      <!-- Mounted for the whole Round: a live region inserted together with its
           text is not announced reliably. It is the pill that comes and goes. -->
      <span class="visually-hidden" role="status">{{ revealMessage }}</span>
      <button class="btn btn-primary" type="button" :disabled="primaryDisabled" @click="primary">
        {{ primaryLabel }}
      </button>
    </div>
  </main>

  <main v-else class="page page--narrow">
    <p class="eyebrow ending-note">Scoring your round…</p>
  </main>
</template>

<style scoped>
.empty {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.empty__copy {
  margin: 0;
  color: var(--ink-muted);
}
.round-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.round-bar__group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.round-bar__position {
  font-size: 12px;
  font-weight: 700;
}
.round-bar__xp {
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
}
.streak-badge {
  padding: 5px 10px;
  border: 1px solid var(--accent);
  border-radius: 999px;
  background: var(--accent-strong);
  color: var(--accent-text);
  font-size: 11px;
  font-weight: 700;
  animation: pop var(--dur) ease-out;
}
.round-progress {
  margin-top: 16px;
}
.round-clock {
  margin-top: 12px;
}
.round-question {
  margin-top: 26px;
}
.round-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.reveal-pill {
  padding: 8px 12px;
  border: 1px solid currentColor;
  border-radius: var(--radius-small);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  animation: pop var(--dur) ease-out;
}
.reveal-pill--pass {
  color: var(--pass);
  background: var(--pass-soft-strong);
}
.reveal-pill--fail {
  color: var(--fail);
  background: var(--fail-soft-strong);
}
.ending-note {
  text-align: center;
  padding: 80px 0;
}
</style>
