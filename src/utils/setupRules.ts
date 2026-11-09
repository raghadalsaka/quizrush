import { MAX_PLAYERS, MAX_QUESTIONS_PER_TEAM, MAX_SECONDS_PER_QUESTION, MAX_TEAMS, MAX_TEAM_NAME_LENGTH, MIN_PLAYERS, MIN_TEAMS, MODE_WORDS } from '../config'
import type { GameMode, RosterEntry, SetupInput } from '../types/game'
import { isIntegerInRange } from './numbers'

const WHOLE_NUMBER_PATTERN: RegExp = /^\d+$/

export function parseWholeNumber(text: string): number {
  const trimmed = text.trim()
  if (!WHOLE_NUMBER_PATTERN.test(trimmed)) {
    return Number.NaN
  }
  return Number(trimmed)
}

export function normalizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function rosterKey(name: string): string {
  return normalizeTeamName(name).toLocaleLowerCase()
}

export function requiredQuestionCount(teamCount: number, questionsPerTeam: number, allowCrossTeamRepeats: boolean): number {
  if (allowCrossTeamRepeats) {
    return questionsPerTeam
  }
  return teamCount * questionsPerTeam
}

function findTeamNameProblems(teamNames: readonly string[], mode: GameMode): string[] {
  const problems: string[] = []
  const seen = new Map<string, number>()
  const title = MODE_WORDS[mode].title
  teamNames.forEach((rawName, index) => {
    const name = normalizeTeamName(rawName)
    const label = `${title} ${index + 1}`
    if (name.length === 0) {
      problems.push(`${label} needs a name.`)
      return
    }
    if (name.length > MAX_TEAM_NAME_LENGTH) {
      problems.push(`${label}'s name is longer than ${MAX_TEAM_NAME_LENGTH} characters.`)
    }
    const key = rosterKey(name)
    const firstIndex = seen.get(key)
    if (firstIndex !== undefined) {
      problems.push(`${label} has the same name as ${title} ${firstIndex + 1}.`)
      return
    }
    seen.set(key, index)
  })
  return problems
}

function rosterSizeProblem(mode: GameMode, count: number): string | null {
  if (mode === 'teams') {
    return isIntegerInRange(count, MIN_TEAMS, MAX_TEAMS) ? null : `Choose from ${MIN_TEAMS} to ${MAX_TEAMS} teams.`
  }
  if (count < MIN_PLAYERS) {
    return 'Enter at least one player name.'
  }
  if (count > MAX_PLAYERS) {
    return `Enter at most ${MAX_PLAYERS} player names. There are ${count} now.`
  }
  return null
}

// A class from Google can't be edited here, so its problems point at the class rather than at the names.
export function findClassRosterProblem(roster: readonly RosterEntry[] | null): string | null {
  if (roster === null) {
    return 'Connect Google and pick a class.'
  }
  if (roster.length < MIN_PLAYERS) {
    return 'This class has no students yet.'
  }
  if (roster.length > MAX_PLAYERS) {
    return `This class has ${roster.length} students. A game takes at most ${MAX_PLAYERS} players.`
  }
  return null
}

export function findSetupProblems(input: SetupInput, questionCount: number, allowCrossTeamRepeats: boolean): string[] {
  const problems: string[] = []
  const words = MODE_WORDS[input.mode]
  const teamNames = input.roster.map((entry) => entry.name)
  const teamCount = teamNames.length
  const questionsPerTeamValid = isIntegerInRange(input.questionsPerTeam, 1, MAX_QUESTIONS_PER_TEAM)
  const sizeProblem = rosterSizeProblem(input.mode, teamCount)
  if (!questionsPerTeamValid) {
    problems.push(`Questions per ${words.noun} must be a whole number from 1 to ${MAX_QUESTIONS_PER_TEAM}.`)
  }
  if (!isIntegerInRange(input.secondsPerQuestion, 1, MAX_SECONDS_PER_QUESTION)) {
    problems.push(`Seconds per question must be a whole number from 1 to ${MAX_SECONDS_PER_QUESTION}.`)
  }
  if (sizeProblem !== null) {
    problems.push(sizeProblem)
  }
  problems.push(...findTeamNameProblems(teamNames, input.mode))

  if (!questionsPerTeamValid || sizeProblem !== null) {
    return problems
  }
  const required = requiredQuestionCount(teamCount, input.questionsPerTeam, allowCrossTeamRepeats)
  if (questionCount < required) {
    problems.push(`Not enough questions: ${required} needed, ${questionCount} available. Lower the questions per ${words.noun} or the number of ${words.nounPlural}.`)
  }
  return problems
}
