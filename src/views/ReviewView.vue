<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import QuestionCard from '@/components/QuestionCard.vue'
import { usePracticeRunner } from '@/composables/usePracticeRunner'
import { shuffleInPlace } from '@/domain/examBlueprint'
import { useProgressStore } from '@/stores/progress'

type Phase = 'empty' | 'question' | 'summary'

const progress = useProgressStore()

const phase = ref<Phase>('empty')
const runner = usePracticeRunner('review', () => {
  phase.value = 'summary'
})

/**
 * The run queue is a SNAPSHOT of the review deck taken once, here, at mount —
 * unlike the live `progress.deck` it does not shrink mid-run as correct
 * Answers land, so a Question already queued stays reachable for the rest
 * of this run even after it clears from the deck.
 */
const deckSnapshot = shuffleInPlace([...progress.deck])
if (deckSnapshot.length > 0) {
  runner.start(deckSnapshot)
  phase.value = 'question'
}

/** Restarts the run against whatever's still live in the deck right now. */
function reviewAgain(): void {
  const nextSnapshot = shuffleInPlace([...progress.deck])
  if (nextSnapshot.length === 0) {
    phase.value = 'empty'
    return
  }
  runner.start(nextSnapshot)
  phase.value = 'question'
}
</script>

<template>
  <main v-if="phase === 'empty'" class="page">
    <div class="card empty">
      <h1>Review</h1>
      <p class="empty__copy">No missed questions — they'll collect here.</p>
      <div class="empty__actions">
        <RouterLink class="btn btn-ghost" to="/practice">Practice</RouterLink>
        <RouterLink class="btn btn-ghost" to="/">Dashboard</RouterLink>
      </div>
    </div>
  </main>

  <div v-else-if="phase === 'question'" class="practice-room">
    <div class="practice-bar">
      <p class="practice-bar__position">Question {{ runner.index + 1 }} of {{ runner.queue.length }}</p>
      <p class="practice-bar__tally mono">{{ runner.correctCount }} correct so far</p>
    </div>

    <main class="page">
      <div class="card practice-question">
        <QuestionCard
          v-if="runner.currentQuestion"
          :key="runner.currentQuestion.id"
          :question="runner.currentQuestion"
          :model-value="runner.selected"
          :graded="runner.graded"
          show-question-id
          @update:model-value="runner.selected = $event"
        />
        <div class="practice-question__actions">
          <button
            v-if="!runner.graded"
            class="btn btn-primary"
            type="button"
            :disabled="runner.submitting || !runner.canCheck"
            @click="runner.checkAnswer"
          >
            Check answer
          </button>
          <button v-else class="btn btn-primary" type="button" @click="runner.nextQuestion">
            {{ runner.isLastQuestion ? 'See summary' : 'Next question' }}
          </button>
        </div>
      </div>
    </main>
  </div>

  <main v-else class="page">
    <div class="card summary">
      <h1>Summary</h1>
      <p class="summary__score mono">{{ runner.correctCount }} of {{ runner.queue.length }} correct</p>
      <p class="summary__accuracy">{{ runner.accuracyPercent }}% accuracy</p>
      <p class="summary__remaining mono">{{ progress.deck.length }} still in your review deck</p>
      <div class="summary__actions">
        <button class="btn btn-ghost" type="button" @click="reviewAgain">Review again</button>
        <RouterLink class="btn btn-primary" to="/">Back to dashboard</RouterLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
.empty {
  max-width: 34rem;
  padding: 2rem;
}

.empty__copy {
  margin: 0 0 1.5rem;
  color: var(--ink-muted);
}

.empty__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.practice-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.practice-bar__position {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
}

.practice-bar__tally {
  margin: 0;
  color: var(--ink-muted);
}

.practice-question {
  padding: 1.5rem;
}

.practice-question__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.summary {
  max-width: 34rem;
  padding: 2rem;
}

.summary__score {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent);
}

.summary__accuracy {
  margin: 0 0 0.35rem;
  color: var(--ink-muted);
}

.summary__remaining {
  margin: 0 0 1.5rem;
  color: var(--ink-muted);
}

.summary__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
