<script setup lang="ts">
import { computed } from 'vue'
import type { DomainId, Question } from '@/data/types'
import { TOPICS } from '@/data/types'
import { isCorrect } from '@/domain/scoring'

const props = defineProps<{
  question: Question
  modelValue: string[]
  graded?: boolean
  showQuestionId?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [string[]]
}>()

const DOMAIN_DOT_MODIFIER: Record<DomainId, string> = {
  'cloud-concepts': 'question-card__domain-dot--cloud',
  'architecture-services': 'question-card__domain-dot--arch',
  'management-governance': 'question-card__domain-dot--gov',
}

const domainDotModifier = computed(() => DOMAIN_DOT_MODIFIER[props.question.domain])
const topicLabel = computed(() => TOPICS[props.question.topic].label)
const radioName = computed(() => `option-${props.question.id}`)
const verdictIsCorrect = computed(() => isCorrect(props.question, props.modelValue))
/** Unanswered is its own verdict — an empty Selection never grades as "Incorrect". */
const verdictLabel = computed(() => {
  if (props.modelValue.length === 0) return 'Unanswered'
  return verdictIsCorrect.value ? 'Correct' : 'Incorrect'
})
const verdictModifier = computed(() => {
  if (props.modelValue.length === 0) return 'question-card__verdict--muted'
  return verdictIsCorrect.value ? 'question-card__verdict--pass' : 'question-card__verdict--fail'
})

function optionInputId(optionId: string): string {
  return `${props.question.id}-${optionId}`
}

function isSelected(optionId: string): boolean {
  return props.modelValue.includes(optionId)
}

function optionClasses(optionId: string): Record<string, boolean> {
  if (!props.graded) return {}
  const correct = props.question.correct.includes(optionId)
  return {
    'option--correct': correct,
    'option--incorrect': !correct && isSelected(optionId),
  }
}

function onRadioChange(optionId: string): void {
  emit('update:modelValue', [optionId])
}

function onCheckboxChange(optionId: string, event: Event): void {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    if (props.modelValue.length >= props.question.correct.length) {
      // Pick count already reached: revert the native toggle and ignore the change.
      target.checked = false
      return
    }
    emit('update:modelValue', [...props.modelValue, optionId])
  } else {
    emit(
      'update:modelValue',
      props.modelValue.filter((id) => id !== optionId),
    )
  }
}
</script>

<template>
  <fieldset class="question-card">
    <div class="question-card__meta">
      <span class="question-card__topic">{{ topicLabel }}</span>
      <span
        class="question-card__domain-dot"
        :class="domainDotModifier"
        aria-hidden="true"
      ></span>
      <span v-if="showQuestionId" class="question-card__id mono">{{ question.id }}</span>
      <span v-if="question.kind === 'multi'" class="question-card__badge">
        Pick {{ question.correct.length }}
      </span>
    </div>

    <legend class="question-card__stem">{{ question.stem }}</legend>

    <p v-if="graded" class="question-card__verdict" :class="verdictModifier">
      {{ verdictLabel }}
    </p>

    <div class="question-card__options">
      <label
        v-for="option in question.options"
        :key="option.id"
        class="option"
        :class="optionClasses(option.id)"
      >
        <input
          v-if="question.kind === 'single'"
          type="radio"
          :id="optionInputId(option.id)"
          :name="radioName"
          :checked="isSelected(option.id)"
          :disabled="graded"
          @change="onRadioChange(option.id)"
        />
        <input
          v-else
          type="checkbox"
          :id="optionInputId(option.id)"
          :checked="isSelected(option.id)"
          :disabled="graded"
          @change="onCheckboxChange(option.id, $event)"
        />
        <span class="option__text">{{ option.text }}</span>
        <p v-if="graded" class="option__explanation">{{ option.explanation }}</p>
      </label>
    </div>

    <a
      v-if="graded && question.learnMore"
      class="learn-more"
      :href="question.learnMore"
      target="_blank"
      rel="noreferrer"
    >
      Learn more on Microsoft Learn
    </a>
  </fieldset>
</template>

<style scoped>
.question-card {
  margin: 0;
  padding: 0;
  border: none;
}

.question-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: var(--ink-muted);
  font-size: 0.85rem;
}

.question-card__domain-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  flex: none;
}

.question-card__domain-dot--cloud {
  background: var(--domain-cloud);
}

.question-card__domain-dot--arch {
  background: var(--domain-arch);
}

.question-card__domain-dot--gov {
  background: var(--domain-gov);
}

.question-card__badge {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
}

.question-card__stem {
  padding: 0;
  margin-bottom: 1rem;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--ink);
}

.question-card__verdict {
  margin: 0 0 1rem;
  font-weight: 700;
}

.question-card__verdict--pass {
  color: var(--pass);
}

.question-card__verdict--fail {
  color: var(--fail);
}

.question-card__verdict--muted {
  color: var(--ink-muted);
}

.question-card__options {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.option {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--line);
  border-left: 3px solid transparent;
  border-radius: var(--radius-small);
  cursor: pointer;
}

.option:has(input:disabled) {
  cursor: default;
}

.option input {
  margin-top: 0.2rem;
  flex: none;
}

.option__text {
  flex: 1;
  min-width: 0;
}

.option__explanation {
  flex-basis: 100%;
  margin: 0.35rem 0 0 1.75rem;
  color: var(--ink-muted);
  font-size: 0.9rem;
}

.option--correct {
  border-left-color: var(--pass);
  background: color-mix(in srgb, var(--pass) 10%, var(--surface));
}

.option--incorrect {
  border-left-color: var(--fail);
  background: color-mix(in srgb, var(--fail) 10%, var(--surface));
}

.learn-more {
  display: inline-block;
  margin-top: 1rem;
  font-weight: 600;
}
</style>
