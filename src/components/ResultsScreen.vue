<script setup lang="ts">
import { computed } from 'vue'
import type { RankedTeam } from '../utils/ranking'
import ConfettiBurst from './ConfettiBurst.vue'

const props = defineProps<{
  rankedTeams: readonly RankedTeam[]
  questionsPerTeam: number
}>()

defineEmits<{
  newGame: []
}>()

const winners = computed(() => props.rankedTeams.filter((team) => team.isWinner))

const headline = computed(() => {
  const [first] = props.rankedTeams
  if (props.rankedTeams.length === 1 && first !== undefined) {
    return `${first.name} scored ${first.score} out of ${props.questionsPerTeam}!`
  }
  if (winners.value.length > 1) {
    return `It's a tie! ${winners.value.map((team) => team.name).join(' & ')} win!`
  }
  return `${winners.value[0]?.name ?? ''} wins!`
})
</script>

<template>
  <main class="relative mx-auto max-w-4xl px-4 py-10 text-center">
    <ConfettiBurst />
    <p class="text-lg font-bold tracking-[0.3em] text-highlight uppercase">Final results</p>
    <h1 class="mt-2 text-5xl leading-tight font-black">{{ headline }}</h1>

    <ol class="mt-10 space-y-4 text-left" aria-label="Leaderboard">
      <li
        v-for="team in rankedTeams"
        :key="team.name"
        class="flex flex-wrap items-center gap-4 rounded-2xl px-6 py-4"
        :class="team.isWinner ? 'winner-glow bg-highlight text-ink' : 'bg-white/10 text-white'"
      >
        <span class="w-14 text-3xl font-black" :aria-label="`Rank ${team.rank}`">#{{ team.rank }}</span>
        <span class="flex-1 text-3xl font-bold">{{ team.name }}</span>
        <span v-if="team.isWinner" class="rounded-full bg-ink px-4 py-1 text-lg font-bold text-highlight">★ Winner</span>
        <span class="text-3xl font-black tabular-nums">{{ team.score }} / {{ questionsPerTeam }}</span>
      </li>
    </ol>

    <button type="button" class="btn btn-primary mt-10 min-h-16 px-10 text-2xl" @click="$emit('newGame')">New Game</button>
  </main>
</template>
