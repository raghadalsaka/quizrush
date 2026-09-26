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

type PendingAction = { kind: 'restart' | 'replace'; cardId: number } | { kind: 'newGame' }

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
} = game

const pending = ref<PendingAction | null>(null)

const dialogText = computed<DialogText>(() => {
  const action = pending.value
  if (action?.kind === 'restart') {
    return {
      title: 'Restart this question?',
      message: 'The same question starts again with the full time. The turn is not used and no point is given.',
      confirmLabel: 'Restart Question',
    }
  }
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
  if (action !== null && action.kind !== 'newGame' && (phase.value !== 'answering' || action.cardId !== cardId.value)) {
    pending.value = null
  }
})

function requestCardAction(kind: 'restart' | 'replace'): void {
  if (phase.value !== 'answering') {
    return
  }
  pending.value = { kind, cardId: cardId.value }
}

function confirmPending(): void {
  const action = pending.value
  pending.value = null
  if (action === null) {
    return
  }
  if (action.kind === 'restart') {
    game.restartQuestion(action.cardId)
  } else if (action.kind === 'replace') {
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
  <main class="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center gap-4 px-4 pt-4 lg:px-8">
    <header class="flex w-full flex-col items-center gap-2">
      <p class="text-sm font-bold tracking-[0.2em] text-indigo-200 uppercase">{{ contest?.title }}</p>
      <TeamScoreboard :teams="teams" :active-index="currentTeamIndex" :last-award="lastAward" />
    </header>

    <section class="flex w-full max-w-5xl flex-1 flex-col items-center gap-4" aria-labelledby="active-team-heading">
      <CountdownBar :phase="phase" :remaining-ms="remainingMs" :duration-ms="secondsPerQuestion * 1000">
        <p class="text-base font-bold tracking-[0.25em] text-highlight uppercase">
          Now playing · Turn {{ turnNumber }} of {{ questionsPerTeam }}
        </p>
        <h1 id="active-team-heading" class="truncate text-6xl leading-tight font-black">{{ currentTeam?.name }}</h1>
      </CountdownBar>
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
      @restart="requestCardAction('restart')"
      @replace="requestCardAction('replace')"
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
