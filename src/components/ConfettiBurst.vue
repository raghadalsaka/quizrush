<script setup lang="ts">
import { computed } from 'vue'

const PIECE_COUNT: number = 36
const FALLBACK_COLOR: string = 'var(--color-ink)'

interface Piece {
  left: string
  delay: string
  duration: string
  drift: string
  color: string
  width: string
  height: string
}

const props = defineProps<{
  colors: readonly string[]
}>()

const pieces = computed<Piece[]>(() =>
  Array.from({ length: PIECE_COUNT }, (_, index) => ({
    left: `${(index * 37 + 11) % 100}%`,
    delay: `${(index % 9) * 0.22}s`,
    duration: `${2.6 + (index % 5) * 0.35}s`,
    drift: `${((index * 53) % 120) - 60}px`,
    color: props.colors[index % Math.max(1, props.colors.length)] ?? FALLBACK_COLOR,
    width: `${8 + (index % 3) * 4}px`,
    height: `${12 + (index % 4) * 3}px`,
  })),
)
</script>

<template>
  <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <span
      v-for="(piece, index) in pieces"
      :key="index"
      class="absolute -top-[4vh] animate-confetti rounded-sm motion-reduce:hidden"
      :style="{
        left: piece.left,
        width: piece.width,
        height: piece.height,
        backgroundColor: piece.color,
        animationDelay: piece.delay,
        animationDuration: piece.duration,
        '--drift': piece.drift,
      }"
    ></span>
  </div>
</template>
