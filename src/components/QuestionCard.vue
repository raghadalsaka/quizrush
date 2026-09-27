<script setup lang="ts">
import { computed, ref } from 'vue'
import { FLIP_IN_MS, FLIP_OUT_MS, OPTION_LABELS } from '../config'
import type { Question } from '../types/contest'
import type { Outcome, Phase } from '../types/game'

type OptionState = 'open' | 'correct' | 'chosen' | 'other'

interface OptionMark {
  symbol: string
  label: string
  color: string
}

interface OptionStyle {
  tile: string
  letter: string
  mark: OptionMark | null
}

const OPTION_STYLES: Record<OptionState, OptionStyle> = {
  open: { tile: 'border-rule bg-card text-ink enabled:hover:border-ink', letter: 'bg-ink', mark: null },
  correct: {
    tile: 'border-good bg-good-soft text-ink',
    letter: 'bg-good',
    mark: { symbol: '✓', label: 'Correct answer', color: 'text-good' },
  },
  chosen: {
    tile: 'border-bad bg-bad-soft text-ink',
    letter: 'bg-bad',
    mark: { symbol: '✗', label: 'Chosen answer', color: 'text-bad' },
  },
  other: { tile: 'border-track bg-card text-ink-soft', letter: 'bg-ink-soft', mark: null },
}

const FLIP_DURATIONS: Record<string, string> = {
  '--flip-out-ms': `${FLIP_OUT_MS}ms`,
  '--flip-in-ms': `${FLIP_IN_MS}ms`,
}

const SPARKLE_OFFSETS: readonly { dx: string; dy: string }[] = [
  { dx: '-7rem', dy: '-2.5rem' },
  { dx: '7rem', dy: '-2.5rem' },
  { dx: '-5rem', dy: '2.5rem' },
  { dx: '5rem', dy: '2.5rem' },
  { dx: '0rem', dy: '-3.5rem' },
  { dx: '-9rem', dy: '0.5rem' },
  { dx: '9rem', dy: '0.5rem' },
]

const props = defineProps<{
  phase: Phase
  question: Question | null
  outcome: Readonly<Outcome> | null
  cardId: number
  teamName: string
  advanceLabel: string
}>()

defineEmits<{
  start: []
  answer: [optionIndex: number]
  next: []
}>()

const startButton = ref<HTMLButtonElement | null>(null)
const promptHeading = ref<HTMLHeadingElement | null>(null)
const resultHeading = ref<HTMLParagraphElement | null>(null)

const showCover = computed(() => props.phase === 'ready' || props.question === null)
const isAnswerable = computed(() => props.phase === 'answering')
const isCorrect = computed(() => props.outcome?.kind === 'correct')
const resultStyle = computed(() => OPTION_STYLES[isCorrect.value ? 'correct' : 'chosen'])
const optionViews = computed(() =>
  (props.question?.options ?? []).map((text, index) => ({ text, index, style: OPTION_STYLES[optionState(index)] })),
)

const resultTitle = computed(() => {
  if (props.outcome === null) {
    return ''
  }
  if (props.outcome.kind === 'correct') {
    return 'Correct! +1 point'
  }
  if (props.outcome.kind === 'incorrect') {
    return 'Incorrect'
  }
  return "Time's up!"
})

function optionState(index: number): OptionState {
  const question = props.question
  if (props.outcome === null || question === null) {
    return 'open'
  }
  if (index === question.correctIndex) {
    return 'correct'
  }
  if (index === props.outcome.selectedIndex) {
    return 'chosen'
  }
  return 'other'
}

function makeInert(element: Element): void {
  if (element instanceof HTMLElement) {
    element.inert = true
  }
}

function focusAfterFlip(): void {
  if (showCover.value) {
    startButton.value?.focus()
    return
  }
  promptHeading.value?.focus()
}

function focusResult(): void {
  resultHeading.value?.focus()
}
</script>

<template>
  <div class="w-full perspective-[1600px] lg:flex lg:flex-col" :style="FLIP_DURATIONS">
    <Transition name="card-flip" mode="out-in" @before-leave="makeInert" @after-enter="focusAfterFlip">
      <div
        v-if="showCover"
        key="cover"
        class="marquee-frame relative flex min-h-80 flex-col items-center justify-center gap-6 rounded-card bg-(--team) p-12 text-center text-(--team-on) shadow-team-edge-md [--focus-ring:var(--team-on)]"
      >
        <p class="relative text-3xl font-bold">Ready, {{ teamName }}?</p>
        <button
          ref="startButton"
          type="button"
          class="relative rounded-full bg-card px-16 py-4 font-display text-6xl font-extrabold text-(--team-text) shadow-team-edge-lg transition-transform active:translate-y-1.5"
          @click="$emit('start')"
        >
          Start
        </button>
        <p class="relative text-xl">The timer starts when the answers appear.</p>
      </div>

      <div v-else-if="question !== null" :key="cardId" class="panel overflow-hidden lg:flex lg:flex-col">
        <div class="grid gap-5 p-6 lg:overflow-x-hidden lg:overflow-y-auto lg:p-8">
          <h2 ref="promptHeading" tabindex="-1" class="border-b-3 border-margin pb-3 text-4xl leading-tight font-bold">
            {{ question.prompt }}
          </h2>
          <div class="grid gap-3 md:grid-cols-2" role="group" aria-label="Answer choices">
            <button
              v-for="option in optionViews"
              :key="option.index"
              type="button"
              class="flex min-h-16 items-center gap-4 rounded-tile border-3 px-4 py-2 text-left text-2xl leading-snug font-semibold transition-[border-color,transform] duration-100 enabled:active:translate-y-0.5 disabled:cursor-default"
              :class="option.style.tile"
              :disabled="!isAnswerable"
              :aria-keyshortcuts="String(option.index + 1)"
              @click="$emit('answer', option.index)"
            >
              <span
                class="grid size-11 shrink-0 place-items-center rounded-full font-display text-xl font-extrabold text-white"
                :class="option.style.letter"
              >
                {{ OPTION_LABELS[option.index] }}
              </span>
              <span class="flex-1">{{ option.text }}</span>
              <template v-if="option.style.mark !== null">
                <span class="shrink-0 animate-stamp font-display text-3xl font-extrabold" :class="option.style.mark.color" aria-hidden="true">
                  {{ option.style.mark.symbol }}
                </span>
                <span class="sr-only">{{ option.style.mark.label }}</span>
              </template>
            </button>
          </div>

          <p v-if="phase === 'paused'" class="rounded-tile border-3 border-ink px-5 py-3 text-center font-display text-3xl font-extrabold">
            Paused
          </p>
          <Transition name="result" @after-enter="focusResult">
            <section
              v-if="outcome !== null"
              class="grid grid-cols-[auto_1fr] items-start gap-4 rounded-tile border-3 px-5 py-4"
              :class="resultStyle.tile"
            >
              <span
                class="grid size-14 animate-stamp place-items-center rounded-full font-display text-3xl font-extrabold text-white"
                :class="resultStyle.letter"
                aria-hidden="true"
              >
                {{ resultStyle.mark?.symbol }}
              </span>
              <div>
                <div class="relative inline-block">
                  <p
                    ref="resultHeading"
                    tabindex="-1"
                    class="font-display text-4xl leading-tight font-extrabold"
                    :class="resultStyle.mark?.color"
                  >
                    {{ resultTitle }}
                  </p>
                  <template v-if="isCorrect">
                    <span
                      v-for="(offset, index) in SPARKLE_OFFSETS"
                      :key="`${cardId}-${index}`"
                      class="absolute top-1/2 left-1/2 animate-sparkle text-3xl text-t4 motion-reduce:hidden"
                      :style="{ '--dx': offset.dx, '--dy': offset.dy }"
                      aria-hidden="true"
                    >
                      ✦
                    </span>
                  </template>
                </div>
                <p class="mt-1 text-2xl leading-normal"><strong>Explanation:</strong> {{ question.explanation }}</p>
                <button type="button" class="btn btn-primary mt-4 lg:hidden" @click="$emit('next')">
                  {{ advanceLabel }}
                </button>
              </div>
            </section>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>
