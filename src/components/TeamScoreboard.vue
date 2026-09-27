<script setup lang="ts">
import type { ScoreAward, Team } from '../types/game'
import { teamThemeClass } from '../utils/teamTheme'

defineProps<{
  teams: readonly Readonly<Team>[]
  activeIndex: number
  lastAward: Readonly<ScoreAward> | null
}>()
</script>

<template>
  <ol class="flex flex-wrap justify-center gap-3" aria-label="Scoreboard">
    <li
      v-for="(team, index) in teams"
      :key="team.name"
      class="relative grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-tile border-3 px-4 py-2 transition-transform"
      :class="[
        teamThemeClass(index),
        index === activeIndex
          ? 'border-transparent bg-(--team) text-(--team-on) shadow-team-edge-sm lg:translate-x-2'
          : 'border-rule bg-card text-ink',
      ]"
      :aria-current="index === activeIndex ? 'step' : undefined"
    >
      <span class="team-shape text-2xl" :class="{ 'bg-(--team-on)': index === activeIndex }" aria-hidden="true"></span>
      <span class="min-w-0 text-lg font-bold break-words">{{ team.name }}</span>
      <span :key="team.score" class="font-display text-4xl leading-none font-extrabold tabular-nums" :class="{ 'animate-score-pop': team.score > 0 }">
        {{ team.score }}
      </span>
      <span
        v-if="lastAward !== null && lastAward.teamIndex === index"
        :key="lastAward.awardId"
        class="pointer-events-none absolute -top-5 right-2 rounded-full bg-good px-3 py-0.5 font-display text-2xl font-extrabold text-white shadow-good-edge animate-plus-one motion-reduce:hidden"
        aria-hidden="true"
      >
        +1
      </span>
    </li>
  </ol>
</template>
