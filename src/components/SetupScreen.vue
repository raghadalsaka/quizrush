<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DEFAULT_GAME_MODE,
  DEFAULT_QUESTIONS_PER_PLAYER,
  MAX_QUESTIONS_PER_TEAM,
  MAX_SECONDS_PER_QUESTION,
  MAX_TEAMS,
  MAX_TEAM_NAME_LENGTH,
  MIN_TEAMS,
  MODE_WORDS,
} from '../config'
import type { ClassRoster, RosterSource } from '../composables/useClassRoster'
import type { Contest } from '../types/contest'
import type { GameMode, RosterEntry, SetupInput } from '../types/game'
import { buildRoster } from '../utils/roster'
import { findClassRosterProblem, findSetupProblems, parseWholeNumber } from '../utils/setupRules'
import { teamThemeClass } from '../utils/teamTheme'
import CreatorCredit from './CreatorCredit.vue'
import EmojiSelect from './EmojiSelect.vue'
import GoogleClassRoster from './GoogleClassRoster.vue'
import PlayerRoster from './PlayerRoster.vue'

const DEFAULT_TEAM_COUNT: number = 2
const GAME_MODES: readonly GameMode[] = ['individual', 'teams']
const ROSTER_SOURCES: readonly RosterSource[] = ['google', 'typed']
const ROSTER_SOURCE_LABELS: Record<RosterSource, string> = {
  typed: 'Type Names',
  google: 'Google Source',
}
const TEAM_NAME_INPUT_LIMIT: number = MAX_TEAM_NAME_LENGTH + 10
const TOGGLE_STYLES: Record<'on' | 'off', string> = {
  on: 'border-ink bg-ink text-white',
  off: 'border-rule bg-card text-ink hover:border-ink',
}

const homeUrl = import.meta.env.BASE_URL

const props = defineProps<{
  contest: Contest
  initial: Readonly<SetupInput> | null
  initialByMode: Readonly<Partial<Record<GameMode, Readonly<SetupInput>>>>
  classRoster: ClassRoster
}>()

const emit = defineEmits<{
  start: [input: SetupInput]
}>()

const teamsSetup = props.initialByMode.teams ?? null
const playersSetup = props.initialByMode.individual ?? null

const mode = ref<GameMode>(props.initial?.mode ?? DEFAULT_GAME_MODE)
const questionsTextByMode = ref<Record<GameMode, string | number>>({
  individual: playersSetup?.questionsPerTeam ?? DEFAULT_QUESTIONS_PER_PLAYER,
  teams: teamsSetup?.questionsPerTeam ?? props.contest.settings.defaultQuestionsPerTeam,
})
const secondsPerQuestionText = ref<string | number>(props.initial?.secondsPerQuestion ?? props.contest.settings.secondsPerQuestion)
const teamCount = ref(teamsSetup?.roster.length ?? DEFAULT_TEAM_COUNT)
const teamNames = ref<string[]>(Array.from({ length: MAX_TEAMS }, (_, index) => teamsSetup?.roster[index]?.name ?? `Team ${index + 1}`))
const teamEmojiPicks = ref<(string | null)[]>(Array.from({ length: MAX_TEAMS }, (_, index) => teamsSetup?.roster[index]?.emoji ?? null))
const { source: rosterSource, roster: classPlayers, typedRoster } = props.classRoster
const playerRoster = ref<RosterEntry[]>((typedRoster.value ?? []).map((entry) => ({ ...entry })))

const teamCountChoices = Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, index) => MIN_TEAMS + index)

const words = computed(() => MODE_WORDS[mode.value])
const teamRoster = computed<RosterEntry[]>(() =>
  buildRoster(teamNames.value.slice(0, teamCount.value), teamEmojiPicks.value.slice(0, teamCount.value)),
)

const offersClassRoster = computed(() => mode.value === 'individual' && props.classRoster.isAvailable)
const usesClassRoster = computed(() => offersClassRoster.value && rosterSource.value === 'google')

const setupInput = computed<SetupInput>(() => ({
  mode: mode.value,
  roster: mode.value === 'teams' ? teamRoster.value : usesClassRoster.value ? (classPlayers.value ?? []) : playerRoster.value,
  questionsPerTeam: parseWholeNumber(String(questionsTextByMode.value[mode.value])),
  secondsPerQuestion: parseWholeNumber(String(secondsPerQuestionText.value)),
}))

const problems = computed(() => {
  const classProblem = usesClassRoster.value ? findClassRosterProblem(classPlayers.value) : null
  if (classProblem !== null) {
    return [classProblem]
  }
  return findSetupProblems(setupInput.value, props.contest.questions.length, props.contest.settings.allowCrossTeamRepeats)
})

function submit(): void {
  if (problems.value.length > 0) {
    return
  }
  typedRoster.value = playerRoster.value
  emit('start', setupInput.value)
}
</script>

<template>
  <main class="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:min-h-dvh lg:content-center lg:gap-6 lg:py-6">
    <header>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <h1 class="font-display text-5xl leading-none font-extrabold tracking-tight lg:text-6xl">{{ contest.title }}</h1>
        <a :href="homeUrl" class="btn btn-small">All Quizzes</a>
      </div>
      <div class="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p class="text-xl text-ink-soft">Set up the {{ words.nounPlural }}, then press Start Game.</p>
        <CreatorCredit />
      </div>
    </header>

    <form class="panel grid gap-8 p-6 lg:grid-cols-[1fr_1.3fr] lg:gap-x-12 lg:gap-y-6 lg:p-8" novalidate @submit.prevent="submit">
      <fieldset class="grid content-start gap-5">
        <legend class="sr-only">Game settings</legend>
        <div class="flex flex-wrap gap-2" role="group" aria-label="Who is playing">
          <button
            v-for="option in GAME_MODES"
            :key="option"
            type="button"
            class="min-h-14 rounded-tile border-3 px-5 font-display text-2xl font-extrabold transition-colors"
            :class="TOGGLE_STYLES[option === mode ? 'on' : 'off']"
            :aria-pressed="option === mode"
            @click="mode = option"
          >
            {{ MODE_WORDS[option].label }}
          </button>
        </div>
        <div v-if="offersClassRoster" class="flex flex-wrap gap-2" role="group" aria-label="Where the names come from">
          <button
            v-for="option in ROSTER_SOURCES"
            :key="option"
            type="button"
            class="min-h-12 rounded-tile border-3 px-4 text-lg font-bold transition-colors"
            :class="TOGGLE_STYLES[option === rosterSource ? 'on' : 'off']"
            :aria-pressed="option === rosterSource"
            @click="rosterSource = option"
          >
            {{ ROSTER_SOURCE_LABELS[option] }}
          </button>
        </div>
        <div class="grid gap-1">
          <label for="questions-per-team" class="text-lg font-bold">Questions per {{ words.noun }}</label>
          <input
            id="questions-per-team"
            v-model="questionsTextByMode[mode]"
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

      <fieldset class="grid content-start gap-5 lg:row-span-2">
        <legend class="mb-5 font-display text-3xl font-extrabold">{{ words.label }}</legend>
        <GoogleClassRoster v-if="usesClassRoster" :class-roster="classRoster" />
        <PlayerRoster v-else-if="mode === 'individual'" v-model="playerRoster" />
        <template v-else>
          <div class="grid gap-1">
            <p id="team-count-label" class="text-lg font-bold">How many teams?</p>
            <div class="flex flex-wrap gap-2" role="group" aria-labelledby="team-count-label">
              <button
                v-for="count in teamCountChoices"
                :key="count"
                type="button"
                class="grid size-14 place-items-center rounded-tile border-3 font-display text-2xl font-extrabold transition-colors"
                :class="TOGGLE_STYLES[count === teamCount ? 'on' : 'off']"
                :aria-pressed="count === teamCount"
                @click="teamCount = count"
              >
                {{ count }}
              </button>
            </div>
          </div>
          <ol class="grid gap-3 lg:grid-cols-2 lg:gap-x-6">
            <li v-for="index in teamCount" :key="index" class="grid gap-1" :class="teamThemeClass(index - 1)">
              <label :for="`team-name-${index}`" class="text-lg font-bold">Team {{ index }} name</label>
              <div class="flex items-center gap-3">
                <EmojiSelect
                  :model-value="teamRoster[index - 1]?.emoji ?? ''"
                  :label="`Team ${index} emoji`"
                  @update:model-value="teamEmojiPicks[index - 1] = $event"
                />
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
        </template>
      </fieldset>

      <div class="flex flex-col items-center gap-6 border-t-3 border-track pt-6 lg:gap-4 lg:self-end">
        <ul
          v-if="problems.length > 0"
          id="setup-problems"
          class="list-disc space-y-1 pl-6 text-lg font-semibold text-bad lg:max-h-20 lg:overflow-y-auto"
        >
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
