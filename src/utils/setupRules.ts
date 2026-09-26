import { MAX_QUESTIONS_PER_TEAM, MAX_SECONDS_PER_QUESTION, MAX_TEAMS, MAX_TEAM_NAME_LENGTH, MIN_TEAMS } from '../config'
import type { SetupInput } from '../types/game'
import { isIntegerInRange } from './numbers'

export interface SetupCheck {
  problems: string[]
  capacityMessage: string
  hasEnoughQuestions: boolean
}

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

export function requiredQuestionCount(teamCount: number, questionsPerTeam: number, allowCrossTeamRepeats: boolean): number {
  if (allowCrossTeamRepeats) {
    return questionsPerTeam
  }
  return teamCount * questionsPerTeam
}

function describeCapacity(required: number, teamCount: number, questionsPerTeam: number, questionCount: number, allowCrossTeamRepeats: boolean): string {
  if (allowCrossTeamRepeats) {
    return `Each team needs ${required} different questions; ${questionCount} available.`
  }
  const teamWord = teamCount === 1 ? 'team' : 'teams'
  return `This game needs ${required} questions (${teamCount} ${teamWord} × ${questionsPerTeam} each); ${questionCount} available.`
}

function findTeamNameProblems(teamNames: readonly string[]): string[] {
  const problems: string[] = []
  const seen = new Map<string, number>()
  teamNames.forEach((rawName, index) => {
    const name = normalizeTeamName(rawName)
    const label = `Team ${index + 1}`
    if (name.length === 0) {
      problems.push(`${label} needs a name.`)
      return
    }
    if (name.length > MAX_TEAM_NAME_LENGTH) {
      problems.push(`${label}'s name is longer than ${MAX_TEAM_NAME_LENGTH} characters.`)
    }
    const key = name.toLocaleLowerCase()
    const firstIndex = seen.get(key)
    if (firstIndex !== undefined) {
      problems.push(`${label} has the same name as Team ${firstIndex + 1}.`)
      return
    }
    seen.set(key, index)
  })
  return problems
}

export function checkSetup(input: SetupInput, questionCount: number, allowCrossTeamRepeats: boolean): SetupCheck {
  const problems: string[] = []
  const teamCount = input.teamNames.length
  const questionsPerTeamValid = isIntegerInRange(input.questionsPerTeam, 1, MAX_QUESTIONS_PER_TEAM)
  const teamCountValid = isIntegerInRange(teamCount, MIN_TEAMS, MAX_TEAMS)
  if (!questionsPerTeamValid) {
    problems.push(`Questions per team must be a whole number from 1 to ${MAX_QUESTIONS_PER_TEAM}.`)
  }
  if (!isIntegerInRange(input.secondsPerQuestion, 1, MAX_SECONDS_PER_QUESTION)) {
    problems.push(`Seconds per question must be a whole number from 1 to ${MAX_SECONDS_PER_QUESTION}.`)
  }
  if (!teamCountValid) {
    problems.push(`Choose from ${MIN_TEAMS} to ${MAX_TEAMS} teams.`)
  }
  problems.push(...findTeamNameProblems(input.teamNames))

  if (!questionsPerTeamValid || !teamCountValid) {
    return { problems, capacityMessage: 'Enter valid numbers to check question availability.', hasEnoughQuestions: false }
  }
  const required = requiredQuestionCount(teamCount, input.questionsPerTeam, allowCrossTeamRepeats)
  const hasEnoughQuestions = questionCount >= required
  if (!hasEnoughQuestions) {
    problems.push(`Not enough questions: ${required} needed, ${questionCount} available. Lower the questions per team or the number of teams.`)
  }
  return {
    problems,
    capacityMessage: describeCapacity(required, teamCount, input.questionsPerTeam, questionCount, allowCrossTeamRepeats),
    hasEnoughQuestions,
  }
}
