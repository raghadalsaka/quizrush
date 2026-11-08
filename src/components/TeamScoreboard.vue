<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ScoreAward, Team } from '../types/game'
import { densityFor, teamThemeClass, type Density } from '../utils/teamTheme'
import { turnQueue } from '../utils/turnQueue'
import AvatarBadge from './AvatarBadge.vue'

const DENSITY_STYLES: Record<Density, { list: string; tile: string; score: string }> = {
  roomy: { list: 'gap-3', tile: 'py-2', score: 'text-4xl' },
  crowded: {
    list: 'gap-2 lg:min-h-0 lg:flex-1 lg:flex-nowrap lg:justify-start lg:overflow-y-auto lg:pt-5 lg:pr-3 lg:pb-2',
    tile: 'py-1',
    score: 'text-3xl',
  },
}

const props = defineProps<{
  teams: readonly Readonly<Team>[]
  activeIndex: number
  lastAward: Readonly<ScoreAward> | null
}>()

const list = ref<HTMLOListElement | null>(null)
const density = computed(() => densityFor(props.teams.length))
const styles = computed(() => DENSITY_STYLES[density.value])
// A crowded list reads as a queue: the player answering on top, then the next turns in order, so nobody has to scroll to find them.
const shownTeams = computed(() => {
  const order =
    density.value === 'crowded'
      ? turnQueue(props.teams.length, props.activeIndex)
      : props.teams.map((_, index) => index)
  return order.flatMap((index) => {
    const team = props.teams[index]
    return team === undefined ? [] : [{ team, index }]
  })
})

watch(
  () => props.activeIndex,
  () => {
    if (list.value !== null) {
      list.value.scrollTop = 0
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <ol ref="list" class="flex flex-wrap justify-center" :class="styles.list" aria-label="Scoreboard">
    <li
      v-for="{ team, index } in shownTeams"
      :key="team.name"
      class="relative grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-tile border-3 px-4 transition-transform"
      :class="[
        teamThemeClass(index),
        styles.tile,
        index === activeIndex
          ? 'border-transparent bg-(--team) text-(--team-on) shadow-team-edge-sm lg:translate-x-2'
          : 'border-rule bg-card text-ink',
      ]"
      :aria-current="index === activeIndex ? 'step' : undefined"
    >
      <AvatarBadge :emoji="team.emoji" size="sm" />
      <span class="min-w-0 text-lg font-bold break-words">{{ team.name }}</span>
      <span
        :key="team.score"
        class="font-display leading-none font-extrabold tabular-nums"
        :class="[styles.score, { 'animate-score-pop': team.score > 0 }]"
      >
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
