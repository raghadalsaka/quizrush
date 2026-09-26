<script setup lang="ts">
import type { ScoreAward, Team } from '../types/game'

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
      class="relative flex items-center gap-3 rounded-2xl px-4 py-2"
      :class="index === activeIndex ? 'bg-highlight text-ink ring-4 ring-white' : 'bg-white/10 text-white'"
      :aria-current="index === activeIndex ? 'step' : undefined"
    >
      <span class="text-lg font-bold">{{ team.name }}</span>
      <span :key="team.score" class="text-3xl font-black tabular-nums" :class="{ 'score-pop': team.score > 0 }">
        {{ team.score }}
      </span>
      <span
        v-if="lastAward !== null && lastAward.teamIndex === index"
        :key="lastAward.awardId"
        class="plus-one pointer-events-none absolute -top-4 left-1/2 text-4xl font-black text-emerald-300 [text-shadow:0_2px_0_#064e3b]"
        aria-hidden="true"
      >
        +1
      </span>
    </li>
  </ol>
</template>
