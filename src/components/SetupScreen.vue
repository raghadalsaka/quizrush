<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAX_QUESTIONS_PER_TEAM, MAX_SECONDS_PER_QUESTION, MAX_TEAMS, MAX_TEAM_NAME_LENGTH, MIN_TEAMS } from '../config'
import type { Contest } from '../types/contest'
import type { SetupInput } from '../types/game'
import { findSetupProblems, parseWholeNumber } from '../utils/setupRules'
import { teamThemeClass } from '../utils/teamTheme'

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

const problems = computed(() =>
  findSetupProblems(setupInput.value, props.contest.questions.length, props.contest.settings.allowCrossTeamRepeats),
)

function submit(): void {
  if (problems.value.length > 0) {
    return
  }
  emit('start', setupInput.value)
}
</script>

<template>
  <main class="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:py-12">
    <header>
      <h1 class="font-display text-5xl leading-none font-extrabold tracking-tight lg:text-6xl">{{ contest.title }}</h1>
      <p class="mt-3 text-xl text-ink-soft">Set up the teams, then press Start Game.</p>
    </header>

    <form class="panel grid gap-8 p-6 lg:grid-cols-[1fr_1.3fr] lg:gap-12 lg:p-10" novalidate @submit.prevent="submit">
      <fieldset class="grid content-start gap-5">
        <legend class="mb-5 font-display text-3xl font-extrabold">Game settings</legend>
        <div class="grid gap-1">
          <label for="questions-per-team" class="text-lg font-bold">Questions per team</label>
          <input
            id="questions-per-team"
            v-model="questionsPerTeamText"
            class="field-input max-w-40"
            type="number"
            inputmode="numeric"
            min="1"
            :max="MAX_QUESTIONS_PER_TEAM"
            step="1"
            required
          />
        </div>
        <div class="grid gap-1">
          <label for="seconds-per-question" class="text-lg font-bold">Seconds per question</label>
          <input
            id="seconds-per-question"
            v-model="secondsPerQuestionText"
            class="field-input max-w-40"
            type="number"
            inputmode="numeric"
            min="1"
            :max="MAX_SECONDS_PER_QUESTION"
            step="1"
            required
          />
        </div>
      </fieldset>

      <fieldset class="grid content-start gap-5">
        <legend class="mb-5 font-display text-3xl font-extrabold">Teams</legend>
        <div class="grid gap-1">
          <p id="team-count-label" class="text-lg font-bold">How many teams?</p>
          <div class="flex flex-wrap gap-2" role="group" aria-labelledby="team-count-label">
            <button
              v-for="count in teamCountChoices"
              :key="count"
              type="button"
              class="grid size-14 place-items-center rounded-tile border-3 font-display text-2xl font-extrabold transition-colors"
              :class="count === teamCount ? 'border-ink bg-ink text-white' : 'border-rule bg-card text-ink hover:border-ink'"
              :aria-pressed="count === teamCount"
              @click="teamCount = count"
            >
              {{ count }}
            </button>
          </div>
        </div>
        <ol class="grid gap-3">
          <li v-for="index in teamCount" :key="index" class="grid gap-1" :class="teamThemeClass(index - 1)">
            <label :for="`team-name-${index}`" class="text-lg font-bold">Team {{ index }} name</label>
            <div class="flex items-center gap-3">
              <span class="team-shape text-4xl" aria-hidden="true"></span>
              <input
                :id="`team-name-${index}`"
                v-model="teamNames[index - 1]"
                class="field-input"
                type="text"
                autocomplete="off"
                :maxlength="TEAM_NAME_INPUT_LIMIT"
                required
              />
            </div>
          </li>
        </ol>
      </fieldset>

      <div class="flex flex-col items-center gap-6 border-t-3 border-track pt-6 lg:col-span-2">
        <ul v-if="problems.length > 0" id="setup-problems" class="list-disc space-y-1 pl-6 text-lg font-semibold text-bad">
          <li v-for="problem in problems" :key="problem">{{ problem }}</li>
        </ul>
        <button
          type="submit"
          class="btn btn-primary btn-large"
          :disabled="problems.length > 0"
          :aria-describedby="problems.length > 0 ? 'setup-problems' : undefined"
        >
          Start Game
        </button>
      </div>
    </form>
  </main>
</template>
