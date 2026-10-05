<script setup lang="ts">
import { onMounted, provide, watchEffect } from 'vue'
import ErrorPanel from './ErrorPanel.vue'
import GameScreen from './GameScreen.vue'
import ResultsScreen from './ResultsScreen.vue'
import SetupScreen from './SetupScreen.vue'
import { gameKey, useGame } from '../composables/useGame'
import { loadContest } from '../services/contestService'
import type { CatalogEntry } from '../types/contest'

const props = defineProps<{
  entry: CatalogEntry
}>()

const game = useGame({ loadContest: () => loadContest(props.entry.file) })
provide(gameKey, game)

const { phase, contest, lastSetup, announcement, rankedTeams, questionsPerTeam, isGameActive } = game

watchEffect(() => {
  document.title = contest.value === null ? 'Quizrush' : `${contest.value.title} · Quizrush`
})

onMounted(() => {
  void game.load()
})
</script>

<template>
  <div class="min-h-screen">
    <main v-if="phase === 'loading'" class="grid min-h-screen place-items-center px-4">
      <p class="font-display text-4xl font-extrabold text-ink-soft">Loading the quiz…</p>
    </main>
    <ErrorPanel v-else-if="phase === 'error'" @retry="game.load" />
    <SetupScreen
      v-else-if="phase === 'setup' && contest !== null"
      :contest="contest"
      :initial="lastSetup"
      @start="game.startGame"
    />
    <ResultsScreen
      v-else-if="phase === 'results'"
      :ranked-teams="rankedTeams"
      :questions-per-team="questionsPerTeam"
      @new-game="game.newGame"
    />
    <GameScreen v-else-if="isGameActive" />
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
  </div>
</template>
