<script setup lang="ts">
import { onMounted, provide, watchEffect } from 'vue'
import ErrorPanel from './components/ErrorPanel.vue'
import GameScreen from './components/GameScreen.vue'
import ResultsScreen from './components/ResultsScreen.vue'
import SetupScreen from './components/SetupScreen.vue'
import { gameKey, useGame } from './composables/useGame'
import { loadContest } from './services/contestService'

const game = useGame({ loadContest })
provide(gameKey, game)

const { phase, contest, loadErrors, lastSetup, announcement, rankedTeams, questionsPerTeam, isGameActive } = game

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
      <p class="text-3xl font-bold text-indigo-100">Loading the contest…</p>
    </main>
    <ErrorPanel v-else-if="phase === 'error'" :errors="loadErrors" @retry="game.load" />
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
