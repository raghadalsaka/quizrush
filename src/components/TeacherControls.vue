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
    class="panel fixed bottom-3 left-3 z-10 flex max-w-[calc(100vw-1.5rem)] flex-col items-start gap-1.5 rounded-tile p-2.5 [--edge:5px]"
  >
    <h2 id="teacher-controls-heading" class="self-center px-1 text-sm font-bold text-ink-soft">Teacher</h2>
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-if="isQuestionOpen"
        type="button"
        class="btn btn-small"
        :disabled="!isAnswering || !canReplace"
        :aria-describedby="isReplaceBlocked ? 'replace-unavailable' : undefined"
        @click="$emit('replace')"
      >
        Different Card
      </button>
      <button v-if="phase === 'resolved'" type="button" class="btn btn-primary" @click="$emit('next')">
        {{ advanceLabel }}
      </button>
      <button type="button" class="btn btn-small" @click="$emit('newGame')">New Game</button>
    </div>
    <p v-if="isReplaceBlocked" id="replace-unavailable" class="px-1 text-sm font-semibold text-ink-soft">
      No spare card left
      <span class="sr-only">: every spare question is needed so all remaining turns can still be played.</span>
    </p>
  </section>
</template>
