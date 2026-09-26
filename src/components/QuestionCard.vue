<script setup lang="ts">
import { computed, ref } from 'vue'
import { FLIP_IN_MS, FLIP_OUT_MS, OPTION_COUNT, OPTION_LABELS } from '../config'
import type { Question } from '../types/contest'
import type { Outcome, Phase } from '../types/game'

type OptionState = 'open' | 'correct' | 'chosen' | 'other'

const OPTION_CLASSES: Record<OptionState, string> = {
  open: 'border-slate-300 bg-slate-50 text-ink enabled:hover:border-indigo-700 enabled:hover:bg-indigo-50',
  correct: 'border-correct bg-correct-soft text-ink',
  chosen: 'border-wrong bg-wrong-soft text-ink',
  other: 'border-slate-200 bg-white text-slate-500',
}

const OPTION_TAGS: Record<OptionState, string> = {
  open: '',
  correct: '✓ Correct answer',
  chosen: '✗ Chosen',
  other: '',
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
}>()

defineEmits<{
  start: []
  answer: [optionIndex: number]
}>()

const startButton = ref<HTMLButtonElement | null>(null)
const promptHeading = ref<HTMLHeadingElement | null>(null)
const resultHeading = ref<HTMLParagraphElement | null>(null)

const showCover = computed(() => props.phase === 'ready' || props.question === null)
const isAnswerable = computed(() => props.phase === 'answering')

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
  <div class="card-stage w-full max-w-5xl" :style="FLIP_DURATIONS">
    <Transition name="card-flip" mode="out-in" @before-leave="makeInert" @after-enter="focusAfterFlip">
      <div
        v-if="showCover"
        key="cover"
        class="flex min-h-[18rem] flex-col items-center justify-center gap-6 rounded-3xl border-4 border-white/30 bg-[repeating-linear-gradient(45deg,#3730a3_0_24px,#312e81_24px_48px)] p-8 text-center shadow-2xl"
      >
        <p class="text-3xl font-bold">Ready, {{ teamName }}?</p>
        <button
          ref="startButton"
          type="button"
          class="min-h-24 min-w-64 rounded-3xl bg-highlight px-12 text-5xl font-black text-ink shadow-[0_8px_0_#a16207] transition-transform hover:scale-105 active:translate-y-1"
          @click="$emit('start')"
        >
          Start
        </button>
        <p class="text-lg text-indigo-100">The timer starts when the answers appear.</p>
      </div>

      <div
        v-else-if="question !== null"
        :key="cardId"
        class="rounded-3xl bg-white p-6 text-ink shadow-2xl lg:p-8"
      >
        <h2 ref="promptHeading" tabindex="-1" class="text-4xl leading-tight font-bold">{{ question.prompt }}</h2>
        <div class="mt-5 grid gap-3 md:grid-cols-2" role="group" aria-label="Answer choices">
          <button
            v-for="(option, index) in question.options"
            :key="index"
            type="button"
            class="flex min-h-16 items-center gap-4 rounded-2xl border-4 px-5 py-2 text-left text-2xl font-semibold transition-colors disabled:cursor-default"
            :class="OPTION_CLASSES[optionState(index)]"
            :disabled="!isAnswerable"
            :aria-keyshortcuts="String(index + 1)"
            @click="$emit('answer', index)"
          >
            <span class="grid size-12 shrink-0 place-items-center rounded-full bg-indigo-800 text-2xl font-black text-white">
              {{ OPTION_LABELS[index] }}
            </span>
            <span class="flex-1">{{ option }}</span>
            <span v-if="OPTION_TAGS[optionState(index)] !== ''" class="shrink-0 text-lg font-black">
              {{ OPTION_TAGS[optionState(index)] }}
            </span>
          </button>
        </div>
        <p v-if="isAnswerable" class="mt-3 text-base text-slate-600">Tip: press 1–{{ OPTION_COUNT }} on the keyboard to answer.</p>

        <Transition name="result" @after-enter="focusResult">
          <section
            v-if="outcome !== null"
            class="mt-5 rounded-2xl border-4 px-5 py-4"
            :class="outcome.kind === 'correct' ? 'border-correct bg-correct-soft' : 'border-wrong bg-wrong-soft'"
          >
            <div class="relative inline-block">
              <p
                ref="resultHeading"
                tabindex="-1"
                class="text-4xl font-black"
                :class="outcome.kind === 'correct' ? 'text-correct' : 'text-wrong'"
              >
                {{ resultTitle }}
              </p>
              <template v-if="outcome.kind === 'correct'">
                <span
                  v-for="(offset, index) in SPARKLE_OFFSETS"
                  :key="`${cardId}-${index}`"
                  class="sparkle text-3xl text-yellow-500"
                  :style="{ '--dx': offset.dx, '--dy': offset.dy }"
                  aria-hidden="true"
                >
                  ✦
                </span>
              </template>
            </div>
            <p class="mt-2 text-2xl"><strong>Explanation:</strong> {{ question.explanation }}</p>
          </section>
        </Transition>
      </div>
    </Transition>
  </div>
</template>
