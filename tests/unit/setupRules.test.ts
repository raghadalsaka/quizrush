import { describe, expect, it } from 'vitest'
import type { SetupInput } from '../../src/types/game'
import { findSetupProblems, normalizeTeamName, parseWholeNumber, requiredQuestionCount } from '../../src/utils/setupRules'
import { makeNames as names, makeRoster } from './helpers'

function setup(teamNames: string[], questionsPerTeam: number = 5, secondsPerQuestion: number = 60): SetupInput {
  return { mode: 'teams', roster: makeRoster(teamNames), questionsPerTeam, secondsPerQuestion }
}

function playerSetup(names: string[], questionsPerPlayer: number = 1): SetupInput {
  return { mode: 'individual', roster: makeRoster(names), questionsPerTeam: questionsPerPlayer, secondsPerQuestion: 60 }
}

describe('requiredQuestionCount', () => {
  it('needs teams x questions when repeats are off', () => {
    expect(requiredQuestionCount(3, 5, false)).toBe(15)
  })

  it('needs only questions per team when repeats are on', () => {
    expect(requiredQuestionCount(3, 5, true)).toBe(5)
  })
})

describe('findSetupProblems', () => {
  const threeTeams = ['Lions', 'Tigers', 'Bears']

  it('3 teams x 5 with repeats off needs 15 questions', () => {
    expect(findSetupProblems(setup(threeTeams), 14, false).join()).toContain('Not enough questions: 15 needed')
    expect(findSetupProblems(setup(threeTeams), 15, false)).toEqual([])
  })

  it('3 teams x 5 with repeats on runs with 5 questions', () => {
    expect(findSetupProblems(setup(threeTeams), 4, true).join()).toContain('Not enough questions: 5 needed')
    expect(findSetupProblems(setup(threeTeams), 5, true)).toEqual([])
  })

  it('supports a single team', () => {
    expect(findSetupProblems(setup(['Solo']), 5, false)).toEqual([])
  })

  it('rejects zero or more than five teams', () => {
    expect(findSetupProblems(setup([]), 30, false).join()).toContain('teams')
    expect(findSetupProblems(setup(['a', 'b', 'c', 'd', 'e', 'f']), 30, false).join()).toContain('teams')
  })

  it('rejects blank and case-insensitive duplicate names after trimming', () => {
    const problems = findSetupProblems(setup(['  Lions ', 'lions', '   ']), 30, false)
    expect(problems).toContain('Team 2 has the same name as Team 1.')
    expect(problems).toContain('Team 3 needs a name.')
  })

  it('rejects overly long names', () => {
    expect(findSetupProblems(setup(['x'.repeat(31)]), 30, false).join()).toContain('longer than')
  })

  it.each([0, -1, 2.5, Number.NaN, 51])('rejects %s questions per team', (value) => {
    expect(findSetupProblems(setup(['A'], value), 100, false).join()).toContain('Questions per team')
  })

  it.each([0, 1.5, Number.NaN, 601])('rejects %s seconds per question', (value) => {
    expect(findSetupProblems(setup(['A'], 5, value), 100, false).join()).toContain('Seconds per question')
  })
})

describe('findSetupProblems: individual players', () => {
  it('accepts 1 to 30 players with one question each from a 30-question quiz', () => {
    expect(findSetupProblems(playerSetup(names(1)), 30, false)).toEqual([])
    expect(findSetupProblems(playerSetup(names(30)), 30, false)).toEqual([])
  })

  it('asks for at least one name and at most 30', () => {
    expect(findSetupProblems(playerSetup([]), 30, false)).toContain('Enter at least one player name.')
    expect(findSetupProblems(playerSetup(names(31)), 100, false).join()).toContain('at most 30 player names')
  })

  it('words problems for players instead of teams', () => {
    const problems = findSetupProblems(playerSetup(['Sam', 'sam'], 2), 3, false)
    expect(problems).toContain('Player 2 has the same name as Player 1.')
    expect(problems.join()).toContain('Lower the questions per player or the number of players.')
    expect(findSetupProblems(playerSetup(['Sam'], 0), 30, false).join()).toContain('Questions per player')
  })
})

describe('parseWholeNumber and normalizeTeamName', () => {
  it('parses only whole numbers', () => {
    expect(parseWholeNumber(' 12 ')).toBe(12)
    expect(parseWholeNumber('1e3')).toBeNaN()
    expect(parseWholeNumber('-3')).toBeNaN()
    expect(parseWholeNumber('')).toBeNaN()
  })

  it('trims and collapses inner whitespace', () => {
    expect(normalizeTeamName('  Red   Team ')).toBe('Red Team')
  })
})
