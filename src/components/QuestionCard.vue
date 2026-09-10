<script setup lang="ts">
import { computed } from 'vue'
import type { Question } from '@/data/types'
import { TOPICS } from '@/data/types'
import { isCorrect } from '@/domain/scoring'

const props = withDefaults(
  defineProps<{
    question: Question
    modelValue: string[]
    graded?: boolean
    showQuestionId?: boolean
    showVerdict?: boolean
    emptyVerdictLabel?: string
  }>(),
  { graded: false, showQuestionId: false, showVerdict: true, emptyVerdictLabel: 'Unanswered' },
)

const emit = defineEmits<{
  'update:modelValue': [string[]]
}>()

const topicLabel = computed(() => TOPICS[props.question.topic].label)
const radioName = computed(() => `option-${props.question.id}`)
const verdictIsCorrect = computed(() => isCorrect(props.question, props.modelValue))
/** An empty pick is its own verdict — never graded as "Incorrect". */
const verdictLabel = computed(() => {
  if (props.modelValue.length === 0) return props.emptyVerdictLabel
  return verdictIsCorrect.value ? 'Correct' : 'Incorrect'
})
const verdictModifier = computed(() => {
  if (props.modelValue.length === 0) return 'question-card__verdict--muted'
  return verdictIsCorrect.value ? 'question-card__verdict--pass' : 'question-card__verdict--fail'
})

function letter(index: number): string {
  return String.fromCharCode(97 + index)
}

function optionInputId(optionId: string): string {
  return `${props.question.id}-${optionId}`
}

function isSelected(optionId: string): boolean {
  return props.modelValue.includes(optionId)
}

function optionClasses(optionId: string): Record<string, boolean> {
  const correct = props.question.correct.includes(optionId)
  const selected = isSelected(optionId)
  if (!props.graded) return { 'option--picked': selected }
  return {
    'option--correct': correct,
    'option--incorrect': !correct && selected,
    'option--dim': !correct && !selected,
  }
}

/** Correct / Correct answer / Your pick — the design's three reveal tags. */
function tagFor(optionId: string): { label: string; modifier: string } | null {
  if (!props.graded) return null
  const correct = props.question.correct.includes(optionId)
  const selected = isSelected(optionId)
  if (correct) return { label: selected ? 'Correct' : 'Correct answer', modifier: 'option__tag--pass' }
  if (selected) return { label: 'Your pick', modifier: 'option__tag--fail' }
  return null
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
      <span class="question-card__topic eyebrow">{{ topicLabel }}</span>
      <span v-if="showQuestionId" class="question-card__id mono">{{ question.id }}</span>
      <span v-if="question.kind === 'multi'" class="question-card__badge chip">
        Select {{ question.correct.length }}
      </span>
    </div>

    <legend class="question-card__stem">{{ question.stem }}</legend>

    <p v-if="graded && showVerdict" class="question-card__verdict" :class="verdictModifier">
      {{ verdictLabel }}
    </p>

    <div class="question-card__options">
      <label
        v-for="(option, index) in question.options"
        :key="option.id"
        class="option"
        :class="optionClasses(option.id)"
      >
        <input
          v-if="question.kind === 'single'"
          type="radio"
          class="option__input visually-hidden"
          :id="optionInputId(option.id)"
          :name="radioName"
          :checked="isSelected(option.id)"
          :disabled="graded"
          @change="onRadioChange(option.id)"
        />
        <input
          v-else
          type="checkbox"
          class="option__input visually-hidden"
          :id="optionInputId(option.id)"
          :checked="isSelected(option.id)"
          :disabled="graded"
          @change="onCheckboxChange(option.id, $event)"
        />
        <span class="option__letter mono" aria-hidden="true">{{ letter(index) }}</span>
        <span class="option__body">
          <span class="option__row">
            <span class="option__text">{{ option.text }}</span>
            <span
              v-if="tagFor(option.id)"
              class="option__tag chip"
              :class="tagFor(option.id)!.modifier"
            >
              {{ tagFor(option.id)!.label }}
            </span>
          </span>
          <span v-if="graded" class="option__explanation">{{ option.explanation }}</span>
        </span>
      </label>
    </div>

    <a
      v-if="graded && question.learnMore"
      class="learn-more"
      :href="question.learnMore"
      target="_blank"
      rel="noreferrer"
    >
      Learn more →
    </a>
  </fieldset>
</template>

<style scoped>
.question-card {
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
}
.question-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.question-card__id {
  font-size: 11px;
  color: var(--ink-muted);
}
.question-card__badge {
  background: var(--track);
  color: var(--accent-text);
}
.question-card__stem {
  padding: 0;
  margin-bottom: 24px;
  font-family: var(--font-display);
  font-size: clamp(18px, 2.6vw, 23px);
  font-weight: 800;
  line-height: 1.4;
  color: var(--ink);
}
.question-card__verdict {
  margin: -8px 0 16px;
  font-weight: 800;
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
  gap: 10px;
}
.option {
  position: relative;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 15px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  cursor: pointer;
  transition: border-color var(--dur-fast), background var(--dur-fast);
}
.option:hover:not(:has(input:disabled)) {
  border-color: var(--accent);
}
.option:has(input:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.option:has(input:disabled) {
  cursor: default;
}
.option__letter {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-small);
  color: var(--ink-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
.option__body {
  flex: 1;
  min-width: 0;
}
.option__row {
  display: flex;
  gap: 12px;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
}
.option__text {
  flex: 1;
  min-width: 200px;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.5;
}
.option__explanation {
  display: block;
  max-width: 66ch;
  margin-top: 8px;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.55;
}
.option--picked {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.option--picked .option__letter {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}
.option--correct {
  border-color: var(--pass);
  background: var(--pass-soft);
}
.option--correct .option__letter {
  border-color: var(--pass);
  background: var(--pass);
  color: var(--pass-ink);
}
.option--incorrect {
  border-color: var(--fail);
  background: var(--fail-soft);
}
.option--incorrect .option__letter {
  border-color: var(--fail);
  background: var(--fail);
  color: var(--fail-ink);
}
.option--dim .option__text {
  color: var(--ink-muted);
}
.option--dim .option__explanation {
  color: var(--ink-muted);
}
.option__tag--pass {
  background: var(--pass);
  color: var(--pass-ink);
}
.option__tag--fail {
  background: var(--fail);
  color: var(--fail-ink);
}
.learn-more {
  display: inline-block;
  margin-top: 16px;
  font-size: 13px;
  font-weight: 700;
}
</style>
