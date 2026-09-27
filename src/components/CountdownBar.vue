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
  if (props.phase === 'paused') {
    return 'Paused'
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
    <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div class="min-w-0">
        <slot />
      </div>
      <div class="text-right">
        <p class="text-lg font-bold" :class="isLow ? 'text-bad' : 'text-ink-soft'">{{ label }}</p>
        <p
          role="timer"
          aria-live="off"
          :aria-label="`${seconds} seconds left`"
          class="font-display text-7xl leading-none font-extrabold tabular-nums"
          :class="isLow ? 'text-bad' : 'text-ink'"
        >
          {{ seconds }}<span class="text-3xl" :class="isLow ? 'text-bad' : 'text-ink-soft'">s</span>
        </p>
      </div>
    </div>
    <div class="mt-3 h-4 overflow-hidden rounded-full bg-track" aria-hidden="true">
      <div
        class="timer-fill h-full origin-left rounded-full"
        :class="isLow ? 'bg-bad' : 'bg-(--team)'"
        :style="{ transform: `scaleX(${fraction})`, transitionDuration: `${TICK_MS}ms` }"
      ></div>
    </div>
  </div>
</template>
