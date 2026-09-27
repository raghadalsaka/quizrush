<script setup lang="ts">
import { computed } from 'vue'
import { LOW_TIME_MS, TICK_MS } from '../config'
import type { Phase } from '../types/game'

const props = defineProps<{
  phase: Phase
  remainingMs: number
  durationMs: number
}>()

const shownMs = computed(() => (props.phase === 'ready' || props.phase === 'revealing' ? props.durationMs : props.remainingMs))
const seconds = computed(() => Math.ceil(shownMs.value / 1000))
const fraction = computed(() => (props.durationMs > 0 ? Math.min(1, shownMs.value / props.durationMs) : 0))
const isLow = computed(() => props.phase === 'answering' && shownMs.value <= LOW_TIME_MS)

const label = computed(() => {
  if (props.phase === 'ready') {
    return 'Starts with Start'
  }
  if (props.phase === 'revealing') {
    return 'Get ready…'
  }
  if (props.phase === 'resolved') {
    return 'Timer stopped'
  }
  if (isLow.value) {
    return 'Hurry up!'
  }
  return 'Time left'
})
</script>

<template>
  <div class="w-full">
    <div class="flex items-end justify-between gap-4">
      <p class="text-2xl font-bold" :class="isLow ? 'text-highlight' : 'text-indigo-100'">{{ label }}</p>
      <p
        role="timer"
        aria-live="off"
        :aria-label="`${seconds} seconds left`"
        class="text-6xl leading-none font-black tabular-nums"
        :class="isLow ? 'text-highlight' : 'text-white'"
      >
        {{ seconds }}<span class="text-3xl">s</span>
      </p>
    </div>
    <div class="mt-3 h-4 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
      <div
        class="timer-fill h-full origin-left rounded-full"
        :class="isLow ? 'bg-highlight' : 'bg-emerald-400'"
        :style="{ transform: `scaleX(${fraction})`, transitionDuration: `${TICK_MS}ms` }"
      ></div>
    </div>
  </div>
</template>
