import { computed, getCurrentScope, inject, onScopeDispose, readonly, ref, shallowRef, type InjectionKey } from 'vue'
import { OPTION_COUNT, OPTION_LABELS, REVEAL_MS } from '../config'
import type { Contest, ContestLoadResult, Question } from '../types/contest'
import type { Outcome, OutcomeKind, Phase, ScoreAward, SetupInput, Team } from '../types/game'
import { canReplaceActive, createDeck, drawForTurn, replaceActive, resolveActive, type Deck } from '../utils/deck'
import { describeError } from '../utils/errors'
import { isIntegerInRange } from '../utils/numbers'
import { cryptoRandomInt, type RandomInt } from '../utils/random'
import { rankTeams } from '../utils/ranking'
import { findSetupProblems, normalizeTeamName } from '../utils/setupRules'
import { useCountdown } from './useCountdown'

export interface GameOptions {
  loadContest: () => Promise<ContestLoadResult>
  randomInt?: RandomInt
  revealMs?: () => number
}

const IN_GAME_PHASES: readonly Phase[] = ['ready', 'revealing', 'answering', 'resolved']

function defaultRevealMs(): number {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return 0
  }
  return REVEAL_MS
}

// Mutations are gated on phase and deferred callbacks on their card id, so double clicks, timer races and stale callbacks are no-ops.
export function useGame(options: GameOptions) {
  const randomInt = options.randomInt ?? cryptoRandomInt
  const revealMs = options.revealMs ?? defaultRevealMs

  const phase = ref<Phase>('loading')
  const contest = shallowRef<Contest | null>(null)
  const teams = ref<Team[]>([])
  const questionsPerTeam = ref(0)
  const secondsPerQuestion = ref(0)
  const currentTeamIndex = ref(0)
  const currentQuestion = shallowRef<Question | null>(null)
  const outcome = ref<Outcome | null>(null)
  const cardId = ref(0)
  const canReplace = ref(false)
  const lastAward = ref<ScoreAward | null>(null)
  const announcement = ref('')
  const lastSetup = ref<SetupInput | null>(null)

  let deck: Deck | null = null
  let questionsById = new Map<string, Question>()
  let revealTimer: ReturnType<typeof setTimeout> | null = null
  let loadRequest = 0

  const countdown = useCountdown(handleExpire)

  const currentTeam = computed(() => teams.value[currentTeamIndex.value] ?? null)
  const isGameActive = computed(() => IN_GAME_PHASES.includes(phase.value))
  const isGameComplete = computed(() => teams.value.length > 0 && teams.value.every((team) => team.turnsTaken >= questionsPerTeam.value))
  const nextTeamIndex = computed(() => {
    if (teams.value.length === 0) {
      return 0
    }
    return (currentTeamIndex.value + 1) % teams.value.length
  })
  const nextTeam = computed(() => {
    if (isGameComplete.value || teams.value.length < 2) {
      return null
    }
    return teams.value[nextTeamIndex.value] ?? null
  })
  const turnNumber = computed(() => {
    const team = currentTeam.value
    if (team === null) {
      return 0
    }
    if (phase.value === 'resolved') {
      return team.turnsTaken
    }
    return team.turnsTaken + 1
  })
  const rankedTeams = computed(() => rankTeams(teams.value))

  function clearRevealTimer(): void {
    if (revealTimer !== null) {
      clearTimeout(revealTimer)
      revealTimer = null
    }
  }

  async function load(): Promise<void> {
    if (phase.value !== 'loading' && phase.value !== 'error') {
      return
    }
    loadRequest += 1
    const request = loadRequest
    phase.value = 'loading'
    let result: ContestLoadResult
    try {
      result = await options.loadContest()
    } catch (error) {
      result = { ok: false, errors: [`Unexpected error while loading the contest: ${describeError(error)}`] }
    }
    if (request !== loadRequest) {
      return
    }
    if (!result.ok) {
      console.error('Quizrush could not load contest.json:', result.errors)
      contest.value = null
      phase.value = 'error'
      return
    }
    contest.value = result.contest
    questionsById = new Map(result.contest.questions.map((question) => [question.id, question]))
    phase.value = 'setup'
  }

  function resetRound(): void {
    clearRevealTimer()
    countdown.stop()
    currentQuestion.value = null
    outcome.value = null
    canReplace.value = false
  }

  function startGame(input: SetupInput): boolean {
    const loaded = contest.value
    if (phase.value !== 'setup' || loaded === null) {
      return false
    }
    if (findSetupProblems(input, loaded.questions.length, loaded.settings.allowCrossTeamRepeats).length > 0) {
      return false
    }
    const names = input.teamNames.map(normalizeTeamName)
    lastSetup.value = { teamNames: names, questionsPerTeam: input.questionsPerTeam, secondsPerQuestion: input.secondsPerQuestion }
    deck = createDeck([...questionsById.keys()], names.length, input.questionsPerTeam, loaded.settings.allowCrossTeamRepeats)
    teams.value = names.map((name) => ({ name, score: 0, turnsTaken: 0 }))
    questionsPerTeam.value = input.questionsPerTeam
    secondsPerQuestion.value = input.secondsPerQuestion
    currentTeamIndex.value = 0
    lastAward.value = null
    resetRound()
    phase.value = 'ready'
    announcement.value = `Game started. ${names[0]}, press Start when ready.`
    return true
  }

  function beginAnswering(forCard: number): void {
    if (forCard !== cardId.value || phase.value !== 'revealing') {
      return
    }
    phase.value = 'answering'
    canReplace.value = deck !== null && canReplaceActive(deck)
    countdown.start(secondsPerQuestion.value * 1000)
  }

  function reveal(questionId: string): void {
    clearRevealTimer()
    currentQuestion.value = questionsById.get(questionId) ?? null
    outcome.value = null
    canReplace.value = false
    cardId.value += 1
    phase.value = 'revealing'
    const forCard = cardId.value
    const delay = revealMs()
    if (delay <= 0) {
      beginAnswering(forCard)
      return
    }
    revealTimer = setTimeout(() => {
      revealTimer = null
      beginAnswering(forCard)
    }, delay)
  }

  function startTurn(): void {
    if (phase.value !== 'ready' || deck === null) {
      return
    }
    reveal(drawForTurn(deck, currentTeamIndex.value, randomInt))
  }

  function describeOutcome(kind: OutcomeKind, teamName: string, question: Question): string {
    const correct = `${OPTION_LABELS[question.correctIndex]}: ${question.options[question.correctIndex]}`
    if (kind === 'correct') {
      return `Correct! ${teamName} earns 1 point.`
    }
    if (kind === 'incorrect') {
      return `Incorrect. The correct answer is ${correct}.`
    }
    return `Time's up. The correct answer is ${correct}.`
  }

  function resolve(kind: OutcomeKind, selectedIndex: number | null): void {
    const team = teams.value[currentTeamIndex.value]
    const question = currentQuestion.value
    if (phase.value !== 'answering' || team === undefined || question === null || deck === null) {
      return
    }
    countdown.stop()
    resolveActive(deck)
    team.turnsTaken += 1
    if (kind === 'correct') {
      team.score += 1
      lastAward.value = { teamIndex: currentTeamIndex.value, awardId: (lastAward.value?.awardId ?? 0) + 1 }
    }
    outcome.value = { kind, selectedIndex }
    canReplace.value = false
    phase.value = 'resolved'
    announcement.value = describeOutcome(kind, team.name, question)
  }

  function answer(optionIndex: number): void {
    const question = currentQuestion.value
    if (phase.value !== 'answering' || question === null) {
      return
    }
    if (!isIntegerInRange(optionIndex, 0, OPTION_COUNT - 1)) {
      return
    }
    if (countdown.isExpired()) {
      resolve('timeout', null)
      return
    }
    resolve(optionIndex === question.correctIndex ? 'correct' : 'incorrect', optionIndex)
  }

  function handleExpire(): void {
    resolve('timeout', null)
  }

  function replaceCard(forCard: number): boolean {
    if (phase.value !== 'answering' || forCard !== cardId.value || deck === null) {
      return false
    }
    if (countdown.isExpired()) {
      resolve('timeout', null)
      return false
    }
    if (!canReplace.value) {
      return false
    }
    countdown.stop()
    reveal(replaceActive(deck, randomInt))
    announcement.value = 'A different card was drawn.'
    return true
  }

  function nextTurn(): void {
    if (phase.value !== 'resolved') {
      return
    }
    currentQuestion.value = null
    outcome.value = null
    if (isGameComplete.value) {
      phase.value = 'results'
      announcement.value = 'Game over. Here are the final results.'
      return
    }
    currentTeamIndex.value = nextTeamIndex.value
    phase.value = 'ready'
    announcement.value = `${currentTeam.value?.name ?? 'Next team'}, it's your turn.`
  }

  function newGame(): void {
    if (contest.value === null) {
      return
    }
    resetRound()
    deck = null
    teams.value = []
    lastAward.value = null
    currentTeamIndex.value = 0
    phase.value = 'setup'
    announcement.value = ''
  }

  if (getCurrentScope()) {
    onScopeDispose(clearRevealTimer)
  }

  return {
    phase: readonly(phase),
    contest,
    teams: readonly(teams),
    questionsPerTeam: readonly(questionsPerTeam),
    secondsPerQuestion: readonly(secondsPerQuestion),
    currentTeamIndex: readonly(currentTeamIndex),
    currentTeam,
    currentQuestion,
    outcome: readonly(outcome),
    cardId: readonly(cardId),
    canReplace: readonly(canReplace),
    lastAward: readonly(lastAward),
    announcement: readonly(announcement),
    lastSetup: readonly(lastSetup),
    remainingMs: countdown.remainingMs,
    isTimerRunning: countdown.isRunning,
    isGameActive,
    isGameComplete,
    nextTeam,
    turnNumber,
    rankedTeams,
    load,
    startGame,
    startTurn,
    answer,
    replaceCard,
    nextTurn,
    newGame,
  }
}

export type Game = ReturnType<typeof useGame>

export const gameKey: InjectionKey<Game> = Symbol('game')

export function injectGame(): Game {
  const game = inject(gameKey)
  if (game === undefined) {
    throw new Error('injectGame() needs a game provided by App.vue')
  }
  return game
}
