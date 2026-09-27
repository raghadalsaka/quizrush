<script setup lang="ts">
import { computed } from 'vue'
import type { RankedTeam } from '../utils/ranking'
import { teamColorVar, teamThemeClass } from '../utils/teamTheme'
import ConfettiBurst from './ConfettiBurst.vue'

const PODIUM_SIZE: number = 3
const ORDINALS: readonly string[] = ['1st', '2nd', '3rd', '4th', '5th']
const STEP_HEIGHTS: Record<number, string> = { 1: 'h-56', 2: 'h-40', 3: 'h-28' }
const STEP_ORDER: readonly string[] = ['order-2', 'order-1', 'order-3']

const props = defineProps<{
  rankedTeams: readonly RankedTeam[]
  questionsPerTeam: number
}>()

defineEmits<{
  newGame: []
}>()

const winners = computed(() => props.rankedTeams.filter((team) => team.isWinner))
const podiumTeams = computed(() => props.rankedTeams.slice(0, PODIUM_SIZE))
const otherTeams = computed(() => props.rankedTeams.slice(PODIUM_SIZE))
const confettiColors = computed(() => winners.value.map((team) => teamColorVar(team.teamIndex)))

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

function ordinal(rank: number): string {
  return ORDINALS[rank - 1] ?? `${rank}th`
}
</script>

<template>
  <main class="relative mx-auto grid max-w-5xl justify-items-center gap-8 px-4 py-10 text-center">
    <ConfettiBurst :colors="confettiColors" />
    <header>
      <p class="text-xl font-bold text-ink-soft">Final results</p>
      <h1 class="mt-1 font-display text-5xl leading-tight font-extrabold tracking-tight lg:text-6xl">{{ headline }}</h1>
    </header>

    <ol class="flex w-full items-end justify-center gap-3 sm:gap-6" aria-label="Leaderboard">
      <li
        v-for="(team, position) in podiumTeams"
        :key="team.name"
        class="flex max-w-56 min-w-0 flex-1 flex-col items-center gap-2"
        :class="[teamThemeClass(team.teamIndex), STEP_ORDER[position]]"
      >
        <span v-if="team.isWinner" class="rounded-full bg-t4 px-4 py-1 text-lg font-extrabold text-ink">Winner</span>
        <span class="team-shape text-5xl" aria-hidden="true"></span>
        <span class="w-full text-2xl leading-tight font-bold break-words">{{ team.name }}</span>
        <div
          class="flex w-full flex-col items-center justify-center rounded-t-tile bg-(--team) text-(--team-on)"
          :class="[STEP_HEIGHTS[team.rank], { 'animate-winner-glow': team.isWinner }]"
        >
          <span class="font-display text-6xl leading-none font-extrabold">{{ ordinal(team.rank) }}</span>
          <span class="mt-2 text-xl font-bold tabular-nums">{{ team.score }} / {{ questionsPerTeam }}</span>
        </div>
      </li>
    </ol>

    <ol v-if="otherTeams.length > 0" :start="PODIUM_SIZE + 1" class="grid w-full max-w-xl gap-3" aria-label="Other teams">
      <li
        v-for="team in otherTeams"
        :key="team.name"
        class="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-tile border-3 border-rule bg-card px-4 py-2 text-left"
        :class="teamThemeClass(team.teamIndex)"
      >
        <span class="font-display text-2xl font-extrabold">{{ ordinal(team.rank) }}</span>
        <span class="team-shape text-2xl" aria-hidden="true"></span>
        <span class="min-w-0 text-xl font-bold break-words">{{ team.name }}</span>
        <span class="font-display text-2xl font-extrabold tabular-nums">{{ team.score }} / {{ questionsPerTeam }}</span>
      </li>
    </ol>

    <button type="button" class="btn btn-primary btn-large" @click="$emit('newGame')">New Game</button>
  </main>
</template>
