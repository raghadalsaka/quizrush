<script setup lang="ts">
const PIECE_COUNT: number = 36
const COLORS: readonly string[] = ['#fde047', '#34d399', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa']

interface Piece {
  left: string
  delay: string
  duration: string
  drift: string
  color: string
  width: string
  height: string
}

const pieces: Piece[] = Array.from({ length: PIECE_COUNT }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  delay: `${(index % 9) * 0.22}s`,
  duration: `${2.6 + (index % 5) * 0.35}s`,
  drift: `${((index * 53) % 120) - 60}px`,
  color: COLORS[index % COLORS.length] ?? '#fde047',
  width: `${8 + (index % 3) * 4}px`,
  height: `${12 + (index % 4) * 3}px`,
}))
</script>

<template>
  <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <span
      v-for="(piece, index) in pieces"
      :key="index"
      class="confetti-piece rounded-sm"
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
