<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import ExamTimer from '@/components/ExamTimer.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import QuestionGrid from '@/components/QuestionGrid.vue'
import { EXAM_DURATION_MS, EXAM_QUESTION_COUNT, PASS_LINE } from '@/domain/examBlueprint'
import { useExamStore } from '@/stores/examSession'

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

const starting = ref(false)
const ending = ref(false)
const pendingAction = ref<'finish' | 'abandon' | null>(null)
let armedAtMs = 0
let confirmTimeoutId: ReturnType<typeof setTimeout> | undefined

/** Non-null exactly while an exam is in progress — the exam room is its own state. */
const activeExam = computed(() => examStore.session?.exam ?? null)
const total = computed(() => examStore.examQuestions.length)

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

  <main v-else-if="!activeExam" class="page">
    <div class="card setup">
      <h1 class="setup__heading">Exam simulation</h1>
      <p class="setup__summary mono">{{ EXAM_SUMMARY }}</p>
      <p class="setup__note">The clock never pauses. Leaving the exam keeps it running.</p>
      <button class="btn btn-primary" type="button" :disabled="starting" @click="start">
        Start exam
      </button>
    </div>
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
  max-width: 34rem;
  padding: 2rem;
}

.setup__heading {
  margin-bottom: 0.75rem;
}

.setup__summary {
  margin: 0 0 0.5rem;
  color: var(--accent);
  font-weight: 600;
}

.setup__note {
  margin: 0 0 1.5rem;
  color: var(--ink-muted);
}

.exam-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.exam-bar__position {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
}

.exam-bar__actions {
  display: flex;
  gap: 0.5rem;
}

.btn-ghost--danger {
  color: var(--fail);
}

.btn-ghost--danger:hover {
  border-color: var(--fail);
  background: color-mix(in srgb, var(--fail) 12%, var(--surface));
}

.exam-question {
  padding: 1.5rem;
}

.exam-question__nav {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
}

.exam-progress {
  margin: 1.5rem 0 0.75rem;
  color: var(--ink-muted);
  font-size: 0.9rem;
}
</style>
