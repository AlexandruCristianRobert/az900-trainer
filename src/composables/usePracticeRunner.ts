import { computed, onUnmounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import type { Question } from '@/data/types'
import { isCompleteSelection } from '@/domain/scoring'
import { usePracticeStore, type PracticeMode } from '@/stores/practiceSession'

export interface PracticeRunner {
  queue: Question[]
  index: number
  correctCount: number
  selected: string[]
  graded: boolean
  submitting: boolean
  currentQuestion: Question | null
  isLastQuestion: boolean
  canCheck: boolean
  accuracyPercent: number
  /** Loads a queue and calls `practiceStore.begin(mode)` — starts a fresh run. */
  start(newQueue: Question[]): void
  /** Clears the run back to nothing, without touching the practice Session. */
  reset(): void
  checkAnswer(): Promise<void>
  nextQuestion(): Promise<void>
}

/**
 * The question/summary state machine shared by Practice and Review: a queue is
 * answered in order, tallying correctness, and `onComplete` fires once the last
 * Question is graded and advanced past. The underlying practice Session is
 * finished on completion, route-leave, or unmount alike (idempotent — see the
 * practiceSession store), so callers never need to call `finish()` themselves.
 */
export function usePracticeRunner(mode: PracticeMode, onComplete: () => void): PracticeRunner {
  const practiceStore = usePracticeStore()

  const queue = ref<Question[]>([])
  const index = ref(0)
  const correctCount = ref(0)
  const selected = ref<string[]>([])
  const graded = ref(false)
  const submitting = ref(false)

  const currentQuestion = computed<Question | null>(() => queue.value[index.value] ?? null)
  const isLastQuestion = computed(() => index.value >= queue.value.length - 1)
  const canCheck = computed(() => {
    const question = currentQuestion.value
    return question !== null && isCompleteSelection(question, selected.value)
  })
  const accuracyPercent = computed(() =>
    queue.value.length === 0 ? 0 : Math.round((correctCount.value / queue.value.length) * 100),
  )

  function reset(): void {
    queue.value = []
    index.value = 0
    correctCount.value = 0
    selected.value = []
    graded.value = false
  }

  function start(newQueue: Question[]): void {
    queue.value = newQueue
    index.value = 0
    correctCount.value = 0
    selected.value = []
    graded.value = false
    practiceStore.begin(mode)
  }

  async function checkAnswer(): Promise<void> {
    const question = currentQuestion.value
    if (!question || submitting.value || !canCheck.value) return
    submitting.value = true
    try {
      const answer = await practiceStore.submitAnswer(question, selected.value)
      if (answer.correct) correctCount.value++
      graded.value = true
    } finally {
      submitting.value = false
    }
  }

  // Reaching the summary — like leaving the view — finishes the Session (idempotent).
  async function nextQuestion(): Promise<void> {
    if (isLastQuestion.value) {
      await practiceStore.finish()
      onComplete()
      return
    }
    index.value++
    selected.value = []
    graded.value = false
  }

  onBeforeRouteLeave(() => {
    void practiceStore.finish()
    return true
  })

  onUnmounted(() => {
    void practiceStore.finish()
  })

  return reactive({
    queue,
    index,
    correctCount,
    selected,
    graded,
    submitting,
    currentQuestion,
    isLastQuestion,
    canCheck,
    accuracyPercent,
    start,
    reset,
    checkAnswer,
    nextQuestion,
  }) as PracticeRunner
}
