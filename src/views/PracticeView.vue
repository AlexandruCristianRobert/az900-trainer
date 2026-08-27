<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import QuestionCard from '@/components/QuestionCard.vue'
import { usePracticeRunner } from '@/composables/usePracticeRunner'
import type { DomainId, Question, TopicId } from '@/data/types'
import { DOMAINS, TOPICS } from '@/data/types'
import { shuffleInPlace } from '@/domain/examBlueprint'
import { useProgressStore } from '@/stores/progress'

type Phase = 'setup' | 'question' | 'summary'

const progress = useProgressStore()

const phase = ref<Phase>('setup')
const runner = usePracticeRunner('practice', () => {
  phase.value = 'summary'
})

// Setup filters.
const domain = ref<DomainId | ''>('')
const topic = ref<TopicId | ''>('')

const domainIds = computed(() => Object.keys(DOMAINS) as DomainId[])
const topicIds = computed<TopicId[]>(() =>
  domain.value
    ? (Object.keys(TOPICS) as TopicId[]).filter((id) => TOPICS[id].domain === domain.value)
    : [],
)

// A Topic from the previous domain would silently narrow nothing once the domain changes.
watch(domain, () => {
  topic.value = ''
})

const matchingQuestions = computed<Question[]>(() =>
  progress.questions.filter(
    (q) => (!domain.value || q.domain === domain.value) && (!topic.value || q.topic === topic.value),
  ),
)
const matchCount = computed(() => matchingQuestions.value.length)

function startPractice(): void {
  if (matchCount.value === 0) return
  runner.start(shuffleInPlace([...matchingQuestions.value]))
  phase.value = 'question'
}

function practiceAgain(): void {
  phase.value = 'setup'
  runner.reset()
}
</script>

<template>
  <main v-if="phase === 'setup'" class="page">
    <div class="card setup">
      <h1 class="setup__heading">Practice</h1>

      <div class="setup__field">
        <label class="setup__label" for="practice-domain">Domain</label>
        <select id="practice-domain" v-model="domain" class="select">
          <option value="">All domains</option>
          <option v-for="id in domainIds" :key="id" :value="id">{{ DOMAINS[id].label }}</option>
        </select>
      </div>

      <div class="setup__field">
        <label class="setup__label" for="practice-topic">Topic</label>
        <select id="practice-topic" v-model="topic" class="select" :disabled="!domain">
          <option value="">All topics</option>
          <option v-for="id in topicIds" :key="id" :value="id">{{ TOPICS[id].label }}</option>
        </select>
      </div>

      <p class="setup__count mono">{{ matchCount }} questions match</p>

      <button
        class="btn btn-primary"
        type="button"
        :disabled="matchCount === 0"
        @click="startPractice"
      >
        Start practicing
      </button>
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
      <div class="summary__actions">
        <button class="btn btn-ghost" type="button" @click="practiceAgain">Practice again</button>
        <RouterLink class="btn btn-primary" to="/">Back to dashboard</RouterLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
.setup {
  max-width: 34rem;
  padding: 2rem;
}

.setup__heading {
  margin-bottom: 1rem;
}

.setup__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.setup__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-muted);
}

.select {
  padding: 0.55em 0.75em;
  border: 1px solid var(--line);
  border-radius: var(--radius-small);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 1em;
}

.select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setup__count {
  margin: 0.5rem 0 1.5rem;
  color: var(--ink-muted);
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
  margin: 0 0 1.5rem;
  color: var(--ink-muted);
}

.summary__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
</style>
