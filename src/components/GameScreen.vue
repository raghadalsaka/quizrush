<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { OPTION_COUNT } from '../config'
import { injectGame } from '../composables/useGame'
import { isIntegerInRange } from '../utils/numbers'
import ConfirmDialog from './ConfirmDialog.vue'
import CountdownBar from './CountdownBar.vue'
import QuestionCard from './QuestionCard.vue'
import TeamScoreboard from './TeamScoreboard.vue'
import TeacherControls from './TeacherControls.vue'

type PendingAction = { kind: 'replace'; cardId: number } | { kind: 'newGame' }

interface DialogText {
  title: string
  message: string
  confirmLabel: string
}

const game = injectGame()
const {
  phase,
  contest,
  teams,
  currentTeam,
  currentTeamIndex,
  currentQuestion,
  outcome,
  cardId,
  canReplace,
  lastAward,
  remainingMs,
  secondsPerQuestion,
  questionsPerTeam,
  turnNumber,
  isGameComplete,
  nextTeam,
} = game

const pending = ref<PendingAction | null>(null)

const dialogText = computed<DialogText>(() => {
  const action = pending.value
  if (action?.kind === 'replace') {
    return {
      title: 'Draw a different card?',
      message: `This question is set aside for ${currentTeam.value?.name ?? 'this team'} and a new one is drawn with a fresh timer. The turn is not used.`,
      confirmLabel: 'Different Card',
    }
  }
  return {
    title: 'Abandon this game?',
    message: 'All scores and turns will be lost and you will return to setup.',
    confirmLabel: 'Abandon Game',
  }
})

watch([phase, cardId], () => {
  const action = pending.value
  if (action?.kind === 'replace' && (phase.value !== 'answering' || action.cardId !== cardId.value)) {
    pending.value = null
  }
})

function requestReplace(): void {
  if (phase.value !== 'answering') {
    return
  }
  pending.value = { kind: 'replace', cardId: cardId.value }
}

function confirmPending(): void {
  const action = pending.value
  pending.value = null
  if (action === null) {
    return
  }
  if (action.kind === 'replace') {
    game.replaceCard(action.cardId)
  } else {
    game.newGame()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (pending.value !== null || phase.value !== 'answering' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
    return
  }
  const optionIndex = Number.parseInt(event.key, 10) - 1
  if (isIntegerInRange(optionIndex, 0, OPTION_COUNT - 1)) {
    event.preventDefault()
    game.answer(optionIndex)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <main
    class="game-screen mx-auto grid min-h-screen w-full max-w-[90rem] gap-6 px-4 pt-4 pb-32 lg:grid-cols-[minmax(14rem,20rem)_1fr] lg:items-start lg:px-8"
  >
    <aside class="flex flex-col items-center gap-4 text-center lg:sticky lg:top-4 lg:items-stretch lg:text-left" aria-label="Game status">
      <p class="text-sm font-bold tracking-[0.2em] text-indigo-200 uppercase">{{ contest?.title }}</p>
      <div>
        <p class="text-base font-bold tracking-[0.25em] text-highlight uppercase">Now playing</p>
        <h1 id="active-team-heading" class="text-5xl leading-tight font-black break-words">{{ currentTeam?.name }}</h1>
        <p class="text-xl text-indigo-100">Turn {{ turnNumber }} of {{ questionsPerTeam }}</p>
      </div>
      <TeamScoreboard class="lg:flex-col lg:*:justify-between" :teams="teams" :active-index="currentTeamIndex" :last-award="lastAward" />
    </aside>

    <section class="flex w-full max-w-5xl min-w-0 flex-col items-center gap-4 justify-self-center" aria-labelledby="active-team-heading">
      <CountdownBar :phase="phase" :remaining-ms="remainingMs" :duration-ms="secondsPerQuestion * 1000" />
      <QuestionCard
        :phase="phase"
        :question="currentQuestion"
        :outcome="outcome"
        :card-id="cardId"
        :team-name="currentTeam?.name ?? ''"
        @start="game.startTurn"
        @answer="game.answer"
      />
    </section>

    <TeacherControls
      :phase="phase"
      :can-replace="canReplace"
      :is-game-complete="isGameComplete"
      :next-team-name="nextTeam?.name ?? null"
      @replace="requestReplace"
      @next="game.nextTurn"
      @new-game="pending = { kind: 'newGame' }"
    />

    <ConfirmDialog
      :open="pending !== null"
      :title="dialogText.title"
      :message="dialogText.message"
      :confirm-label="dialogText.confirmLabel"
      @confirm="confirmPending"
      @cancel="pending = null"
    />
  </main>
</template>
