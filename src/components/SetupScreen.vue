<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAX_QUESTIONS_PER_TEAM, MAX_SECONDS_PER_QUESTION, MAX_TEAMS, MAX_TEAM_NAME_LENGTH, MIN_TEAMS } from '../config'
import type { Contest } from '../types/contest'
import type { SetupInput } from '../types/game'
import { checkSetup, parseWholeNumber } from '../utils/setupRules'

const DEFAULT_TEAM_COUNT: number = 2
const TEAM_NAME_INPUT_LIMIT: number = MAX_TEAM_NAME_LENGTH + 10

const props = defineProps<{
  contest: Contest
  initial: Readonly<SetupInput> | null
}>()

const emit = defineEmits<{
  start: [input: SetupInput]
}>()

const questionsPerTeamText = ref<string | number>(props.initial?.questionsPerTeam ?? props.contest.settings.defaultQuestionsPerTeam)
const secondsPerQuestionText = ref<string | number>(props.initial?.secondsPerQuestion ?? props.contest.settings.secondsPerQuestion)
const teamCount = ref(props.initial?.teamNames.length ?? DEFAULT_TEAM_COUNT)
const teamNames = ref<string[]>(Array.from({ length: MAX_TEAMS }, (_, index) => props.initial?.teamNames[index] ?? `Team ${index + 1}`))

const teamCountChoices = Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, index) => MIN_TEAMS + index)

const setupInput = computed<SetupInput>(() => ({
  teamNames: teamNames.value.slice(0, teamCount.value),
  questionsPerTeam: parseWholeNumber(String(questionsPerTeamText.value)),
  secondsPerQuestion: parseWholeNumber(String(secondsPerQuestionText.value)),
}))

const check = computed(() =>
  checkSetup(setupInput.value, props.contest.questions.length, props.contest.settings.allowCrossTeamRepeats),
)

const repeatNote = computed(() => {
  if (props.contest.settings.allowCrossTeamRepeats) {
    return 'A question may come up again for a different team, but never twice for the same team.'
  }
  return 'Each question is used at most once in the whole game.'
})

function submit(): void {
  if (check.value.problems.length > 0) {
    return
  }
  emit('start', setupInput.value)
}
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-8 lg:py-12">
    <header class="text-center">
      <p class="text-base font-bold tracking-[0.3em] text-indigo-200 uppercase">Quizrush</p>
      <h1 class="mt-2 text-5xl font-black">{{ contest.title }}</h1>
      <p class="mt-3 text-xl text-indigo-100">Set up the teams, then press Start Game.</p>
    </header>

    <form class="mt-8 grid gap-8 rounded-3xl bg-white p-6 text-ink shadow-2xl lg:grid-cols-2 lg:p-10" novalidate @submit.prevent="submit">
      <fieldset class="space-y-5">
        <legend class="text-2xl font-black">Game settings</legend>
        <div>
          <label for="questions-per-team" class="block text-lg font-bold">Questions per team</label>
          <input
            id="questions-per-team"
            v-model="questionsPerTeamText"
            class="field-input mt-1 max-w-40"
            type="number"
            inputmode="numeric"
            min="1"
            :max="MAX_QUESTIONS_PER_TEAM"
            step="1"
            required
          />
        </div>
        <div>
          <label for="seconds-per-question" class="block text-lg font-bold">Seconds per question</label>
          <input
            id="seconds-per-question"
            v-model="secondsPerQuestionText"
            class="field-input mt-1 max-w-40"
            type="number"
            inputmode="numeric"
            min="1"
            :max="MAX_SECONDS_PER_QUESTION"
            step="1"
            required
          />
        </div>
        <p class="rounded-xl bg-indigo-50 px-4 py-3 text-base">
          <strong>Repeat rule:</strong> {{ repeatNote }}
          <span class="block text-sm text-slate-600">Change it with <code>allowCrossTeamRepeats</code> in contest.json.</span>
        </p>
      </fieldset>

      <fieldset class="space-y-5">
        <legend class="text-2xl font-black">Teams</legend>
        <div>
          <p id="team-count-label" class="text-lg font-bold">How many teams?</p>
          <div class="mt-1 flex gap-2" role="group" aria-labelledby="team-count-label">
            <button
              v-for="count in teamCountChoices"
              :key="count"
              type="button"
              class="btn min-w-14 text-2xl"
              :class="count === teamCount ? 'bg-indigo-800 text-white' : 'btn-light'"
              :aria-pressed="count === teamCount"
              @click="teamCount = count"
            >
              {{ count }}
            </button>
          </div>
        </div>
        <ol class="space-y-3">
          <li v-for="index in teamCount" :key="index">
            <label :for="`team-name-${index}`" class="block text-lg font-bold">Team {{ index }} name</label>
            <input
              :id="`team-name-${index}`"
              v-model="teamNames[index - 1]"
              class="field-input mt-1"
              type="text"
              autocomplete="off"
              :maxlength="TEAM_NAME_INPUT_LIMIT"
              required
            />
          </li>
        </ol>
      </fieldset>

      <div class="border-t-2 border-slate-200 pt-6 lg:col-span-2">
        <p class="text-xl font-bold" :class="check.hasEnoughQuestions ? 'text-correct' : 'text-wrong'">
          {{ check.capacityMessage }}
        </p>
        <ul v-if="check.problems.length > 0" id="setup-problems" class="mt-3 list-disc space-y-1 pl-6 text-lg text-wrong">
          <li v-for="problem in check.problems" :key="problem">{{ problem }}</li>
        </ul>
        <button
          type="submit"
          class="btn btn-primary mt-6 min-h-16 px-10 text-2xl"
          :disabled="check.problems.length > 0"
          :aria-describedby="check.problems.length > 0 ? 'setup-problems' : undefined"
        >
          Start Game
        </button>
      </div>
    </form>
  </main>
</template>
