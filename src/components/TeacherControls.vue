<script setup lang="ts">
import { computed } from 'vue'
import type { Phase } from '../types/game'

const props = defineProps<{
  phase: Phase
  canReplace: boolean
  isGameComplete: boolean
  nextTeamName: string | null
}>()

defineEmits<{
  replace: []
  next: []
  newGame: []
}>()

const isQuestionOpen = computed(() => props.phase === 'revealing' || props.phase === 'answering')
const isAnswering = computed(() => props.phase === 'answering')
const isReplaceBlocked = computed(() => isAnswering.value && !props.canReplace)
const advanceLabel = computed(() => {
  if (props.isGameComplete) {
    return 'See Results'
  }
  if (props.nextTeamName !== null) {
    return `Next Team: ${props.nextTeamName}`
  }
  return 'Next Question'
})
</script>

<template>
  <section
    aria-labelledby="teacher-controls-heading"
    class="fixed right-3 bottom-3 z-10 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-1 rounded-2xl border-2 border-dashed border-indigo-300/50 bg-stage-deep/95 p-2 shadow-2xl backdrop-blur"
  >
    <h2 id="teacher-controls-heading" class="px-1 text-xs font-bold tracking-[0.2em] text-indigo-200 uppercase">Teacher controls</h2>
    <div class="flex flex-wrap items-center justify-end gap-2">
      <button
        v-if="isQuestionOpen"
        type="button"
        class="btn btn-secondary min-h-10 px-3 text-base"
        :disabled="!isAnswering || !canReplace"
        :aria-describedby="isReplaceBlocked ? 'replace-unavailable' : undefined"
        @click="$emit('replace')"
      >
        Different Card
      </button>
      <button v-if="phase === 'resolved'" type="button" class="btn btn-primary" @click="$emit('next')">
        {{ advanceLabel }} →
      </button>
      <button type="button" class="btn btn-secondary min-h-10 px-3 text-base" @click="$emit('newGame')">New Game</button>
    </div>
    <p v-if="isReplaceBlocked" id="replace-unavailable" class="px-1 text-sm text-indigo-100">
      No spare card left
      <span class="sr-only">: every spare question is needed so all remaining turns can still be played.</span>
    </p>
  </section>
</template>
