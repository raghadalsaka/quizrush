<script setup lang="ts">
import { computed } from 'vue'
import type { Phase } from '../types/game'

const props = defineProps<{
  phase: Phase
  canReplace: boolean
  isGameComplete: boolean
}>()

defineEmits<{
  restart: []
  replace: []
  next: []
  newGame: []
}>()

const isQuestionOpen = computed(() => props.phase === 'revealing' || props.phase === 'answering')
const isAnswering = computed(() => props.phase === 'answering')
</script>

<template>
  <section
    aria-labelledby="teacher-controls-heading"
    class="sticky bottom-0 z-10 w-full rounded-t-2xl border-2 border-b-0 border-dashed border-indigo-300/50 bg-stage-deep/95 px-4 py-3 backdrop-blur"
  >
    <h2 id="teacher-controls-heading" class="text-sm font-bold tracking-[0.2em] text-indigo-200 uppercase">Teacher controls</h2>
    <div class="mt-2 flex flex-wrap items-center gap-3">
      <template v-if="isQuestionOpen">
        <button type="button" class="btn btn-secondary" :disabled="!isAnswering" @click="$emit('restart')">
          Restart Question
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="!isAnswering || !canReplace"
          :aria-describedby="isAnswering && !canReplace ? 'replace-unavailable' : undefined"
          @click="$emit('replace')"
        >
          Different Card
        </button>
        <p v-if="isAnswering && !canReplace" id="replace-unavailable" class="max-w-md text-base text-indigo-100">
          No different card: every spare question is needed so all remaining turns can still be played.
        </p>
      </template>
      <button v-if="phase === 'resolved'" type="button" class="btn btn-primary min-h-14 px-8 text-xl" @click="$emit('next')">
        {{ isGameComplete ? 'See Results' : 'Next Team' }} →
      </button>
      <button type="button" class="btn btn-secondary ml-auto" @click="$emit('newGame')">New Game</button>
    </div>
  </section>
</template>
