<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave, RouterLink, useRouter } from 'vue-router'
import ExamTimer from '@/components/ExamTimer.vue'
import HistorySparkline from '@/components/HistorySparkline.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import QuestionGrid from '@/components/QuestionGrid.vue'
import { EXAM_DURATION_MS, EXAM_QUESTION_COUNT, PASS_LINE } from '@/domain/examBlueprint'
import { useExamStore } from '@/stores/examSession'
import { useProgressStore } from '@/stores/progress'

const CONFIRM_WINDOW_MS = 5000
/**
 * A double-click lands its second click on whatever now occupies those pixels —
 * and Vue swaps the confirm button in on a microtask, long before the ~100-200ms
 * second click arrives. Clicks this soon after arming are the tail of a
 * double-click, never a deliberate confirmation, so the guard drops them.
 */
const CONFIRM_GRACE_MS = 400
const EXAM_SUMMARY = `${EXAM_QUESTION_COUNT} questions · ${EXAM_DURATION_MS / 60_000} minutes · pass line ${PASS_LINE}`

const router = useRouter()
const examStore = useExamStore()
const progress = useProgressStore()

const starting = ref(false)
const ending = ref(false)
const pendingAction = ref<'finish' | 'abandon' | null>(null)
let armedAtMs = 0
let confirmTimeoutId: ReturnType<typeof setTimeout> | undefined

/** Non-null exactly while an exam is in progress — the exam room is its own state. */
const activeExam = computed(() => examStore.session?.exam ?? null)
const total = computed(() => examStore.examQuestions.length)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

/** `history` is newest first; the sparkline reads oldest → newest. */
const sparklinePoints = computed(() =>
  [...progress.history].reverse().map((entry) => ({ score: entry.score, label: formatDate(entry.endedAt) })),
)

function isAnswered(index: number): boolean {
  const question = examStore.examQuestions[index]
  return question ? examStore.isQuestionAnswered(question.id) : false
}

function onSelect(optionIds: string[]): void {
  const question = examStore.currentQuestion
  if (!question) return
  void examStore.select(question.id, optionIds)
}

async function start(): Promise<void> {
  if (starting.value) return
  starting.value = true
  try {
    await examStore.startExam()
  } finally {
    starting.value = false
  }
}

function disarmConfirm(): void {
  clearTimeout(confirmTimeoutId)
  pendingAction.value = null
}

/** Two-step confirm: the first click arms the button, a second one within 5s commits. */
function armConfirm(action: 'finish' | 'abandon'): void {
  clearTimeout(confirmTimeoutId)
  pendingAction.value = action
  armedAtMs = Date.now()
  confirmTimeoutId = setTimeout(disarmConfirm, CONFIRM_WINDOW_MS)
}

async function endExam(terminate: () => Promise<string>): Promise<void> {
  if (ending.value || !examStore.session) return
  ending.value = true
  disarmConfirm()
  try {
    const sessionId = await terminate()
    await router.push({ name: 'results', params: { sessionId } })
  } finally {
    ending.value = false
  }
}

async function requestFinish(): Promise<void> {
  if (pendingAction.value !== 'finish') {
    armConfirm('finish')
    return
  }
  if (Date.now() - armedAtMs < CONFIRM_GRACE_MS) return
  await endExam(() => examStore.submitExam())
}

async function requestAbandon(): Promise<void> {
  if (pendingAction.value !== 'abandon') {
    armConfirm('abandon')
    return
  }
  if (Date.now() - armedAtMs < CONFIRM_GRACE_MS) return
  await endExam(() => examStore.abandonExam())
}

function onExpired(): void {
  void endExam(() => examStore.expireExam())
}

onBeforeRouteLeave((to) => {
  if (!examStore.session || to.name === 'results') return true
  return window.confirm('Leave the exam? The clock keeps running.')
})

onBeforeUnmount(disarmConfirm)
</script>

<template>
  <!-- Terminating: the session is already closed but the results route is still
       resolving — showing the setup card here would flash a misleading state. -->
  <main v-if="ending" class="page">
    <p class="ending-note">Scoring your exam…</p>
  </main>

  <main v-else-if="!activeExam" class="page page--narrow fade-up">
    <div class="card setup">
      <h1 class="setup__heading">Exam simulation</h1>
      <p class="setup__summary mono">{{ EXAM_SUMMARY }}</p>
      <p class="setup__note">The clock never pauses. Leaving the exam keeps it running.</p>
      <button class="btn btn-primary" type="button" :disabled="starting" @click="start">
        Start exam
      </button>
    </div>

    <section v-if="progress.history.length > 0" class="card history-panel">
      <h2 class="eyebrow history-panel__title">Score history</h2>
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
            </span>
          </RouterLink>
        </li>
      </ul>
      <p class="history-panel__caption">
        Estimated score — Microsoft uses an unpublished scaled model.
      </p>
    </section>
  </main>

  <div v-else class="exam-room">
    <div class="exam-bar">
      <p class="exam-bar__position">Question {{ examStore.currentIndex + 1 }} of {{ total }}</p>
      <ExamTimer :deadline="activeExam.deadline" @expired="onExpired" />
      <div class="exam-bar__actions">
        <button class="btn btn-ghost" type="button" @click="requestFinish">
          {{ pendingAction === 'finish' ? 'Confirm finish' : 'Finish exam' }}
        </button>
        <button class="btn btn-ghost btn-ghost--danger" type="button" @click="requestAbandon">
          {{ pendingAction === 'abandon' ? 'Confirm abandon' : 'Abandon' }}
        </button>
      </div>
    </div>

    <main class="page">
      <div class="card exam-question">
        <QuestionCard
          v-if="examStore.currentQuestion"
          :key="examStore.currentQuestion.id"
          :question="examStore.currentQuestion"
          :model-value="examStore.currentSelection"
          :show-question-id="false"
          @update:model-value="onSelect"
        />
        <div class="exam-question__nav">
          <button
            class="btn btn-ghost"
            type="button"
            :disabled="examStore.currentIndex === 0"
            @click="examStore.prev()"
          >
            Previous
          </button>
          <button
            class="btn btn-ghost"
            type="button"
            :disabled="examStore.currentIndex >= total - 1"
            @click="examStore.next()"
          >
            Next
          </button>
        </div>
      </div>

      <p class="exam-progress">{{ examStore.answeredCount }} of {{ total }} answered</p>
      <QuestionGrid
        :total="total"
        :current-index="examStore.currentIndex"
        :is-answered="isAnswered"
        @go-to="examStore.goTo"
      />
    </main>
  </div>
</template>

<style scoped>
.ending-note {
  color: var(--ink-muted);
}

.setup {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.setup__heading {
  margin: 0;
}

.setup__summary {
  margin: 0;
  color: var(--ink-muted);
  font-size: 12px;
}

.setup__note {
  margin: 0 0 8px;
  color: var(--ink-muted);
}

.history-panel {
  margin-top: 24px;
  padding: 24px;
}

.history-panel__title {
  margin: 0 0 16px;
}

.history-panel__caption {
  margin: 12px 0 0;
  color: var(--ink-muted);
  font-size: 12px;
}

.history {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.history__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  color: var(--ink);
  text-decoration: none;
}

.history__date {
  flex: 1;
  font-size: 13px;
}

.history__score {
  font-weight: 700;
}

.history__score--pass {
  color: var(--pass);
}

.history__score--fail {
  color: var(--fail);
}

.exam-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--line);
}

.exam-bar__position {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
}

.exam-bar__actions {
  display: flex;
  gap: 8px;
}

.btn-ghost--danger {
  color: var(--fail);
}

.btn-ghost--danger:hover {
  border-color: var(--fail);
  background: var(--fail-soft);
}

.exam-question {
  padding: 24px;
}

.exam-question__nav {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
}

.exam-progress {
  margin: 24px 0 12px;
  color: var(--ink-muted);
  font-size: 13px;
}
</style>
