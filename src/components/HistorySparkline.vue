<script setup lang="ts">
import { computed } from 'vue'

interface SparklinePoint {
  /** Estimated score, 0…max. */
  score: number
  /** Human-readable date, shown on hover. */
  label: string
}

const props = withDefaults(
  defineProps<{
    /** Oldest first — the sparkline reads left (oldest) to right (newest). */
    points: SparklinePoint[]
    max?: number
    threshold?: number
    thresholdLabel?: string
  }>(),
  {
    max: 1000,
    threshold: 700,
    thresholdLabel: '700',
  },
)

/**
 * One series in one hue (--accent); the dashed threshold is the only other
 * emphasized mark. No gridlines, no axes, no legend — the score list beside this
 * chart is its table-view twin, so every value stays readable without hovering.
 *
 * The score domain is FIXED at 0…max rather than fitted to the data: a relative
 * domain would slide the pass line around and make two renders incomparable.
 */
const LEFT = 10
const RIGHT = 312
const TOP = 12
const BOTTOM = 84
/** Past this many exams the 8px dots would collide, so only the newest keeps one. */
const MAX_DOTTED = 12

function toY(score: number): number {
  const clamped = Math.min(Math.max(score, 0), props.max)
  return BOTTOM - (clamped / props.max) * (BOTTOM - TOP)
}

function toX(index: number): number {
  // A lone exam sits at the right edge: newest is always rightmost.
  if (props.points.length <= 1) return RIGHT
  return LEFT + (index / (props.points.length - 1)) * (RIGHT - LEFT)
}

const plotted = computed(() =>
  props.points.map((point, index) => ({
    score: point.score,
    label: point.label,
    x: toX(index),
    y: toY(point.score),
  })),
)

const linePath = computed(() => {
  if (plotted.value.length < 2) return ''
  return plotted.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (plotted.value.length < 2) return ''
  const first = plotted.value[0]!
  const last = plotted.value[plotted.value.length - 1]!
  return `${linePath.value} L${last.x.toFixed(2)} ${BOTTOM} L${first.x.toFixed(2)} ${BOTTOM} Z`
})

const thresholdY = computed(() => toY(props.threshold))
const showEveryDot = computed(() => plotted.value.length <= MAX_DOTTED)

const ariaLabel = computed(() => {
  const count = props.points.length
  return `Estimated scores from ${count} exam${count === 1 ? '' : 's'}, oldest to newest; pass line ${props.threshold} of ${props.max}. The same scores are listed below.`
})
</script>

<template>
  <figure class="sparkline">
    <svg class="sparkline__svg" viewBox="0 0 360 96" role="img" :aria-label="ariaLabel">
      <path v-if="areaPath" class="sparkline__area" :d="areaPath" />
      <path v-if="linePath" class="sparkline__line" :d="linePath" />
      <line
        class="sparkline__threshold"
        :x1="LEFT"
        :x2="RIGHT"
        :y1="thresholdY"
        :y2="thresholdY"
      />
      <text class="sparkline__threshold-label" :x="RIGHT + 6" :y="thresholdY + 3.5">
        {{ thresholdLabel }}
      </text>
      <template v-for="(point, index) in plotted" :key="index">
        <circle
          v-if="showEveryDot || index === plotted.length - 1"
          class="sparkline__dot"
          :cx="point.x"
          :cy="point.y"
          r="4"
        />
        <!-- Transparent hit target, far larger than the mark, so hovering is not a pinpoint task. -->
        <circle class="sparkline__hit" :cx="point.x" :cy="point.y" r="13">
          <title>{{ point.label }} — {{ point.score }}</title>
        </circle>
      </template>
    </svg>
    <figcaption class="sparkline__axis mono">
      <span>Oldest</span>
      <span>Newest</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.sparkline {
  margin: 0;
}

.sparkline__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.sparkline__area {
  fill: var(--accent);
  opacity: 0.1;
}

.sparkline__line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

/* The signature threshold line: dashed, muted, mono-labelled — never a gridline. */
.sparkline__threshold {
  stroke: var(--ink-muted);
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
  vector-effect: non-scaling-stroke;
}

.sparkline__threshold-label {
  fill: var(--ink-muted);
  font-family: var(--font-mono);
  font-size: 10px;
}

/* The 2px surface ring keeps a dot legible where it sits on the line. */
.sparkline__dot {
  fill: var(--accent);
  stroke: var(--surface);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.sparkline__hit {
  fill: transparent;
}

.sparkline__axis {
  display: flex;
  justify-content: space-between;
  margin-top: 0.4rem;
  color: var(--ink-muted);
  font-size: 0.7rem;
}
</style>
