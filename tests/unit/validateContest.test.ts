import { describe, expect, it } from 'vitest'
import shippedContest from '../../public/contest.json'
import { validateContest } from '../../src/utils/validateContest'

type JsonObject = Record<string, unknown>

function validContest(): JsonObject {
  return {
    title: 'Classroom Challenge',
    settings: { secondsPerQuestion: 60, defaultQuestionsPerTeam: 5, allowCrossTeamRepeats: false },
    questions: [
      { id: 'q1', prompt: 'Pick one', options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'Because b.' },
      { id: 'q2', prompt: 'Pick two', options: ['a', 'b', 'c', 'd'], correctIndex: 3, explanation: 'Because d.' },
    ],
  }
}

function errorsFor(mutate: (contest: JsonObject) => void): string[] {
  const contest = validContest()
  mutate(contest)
  const result = validateContest(contest)
  if (result.ok) {
    return []
  }
  return result.errors
}

function firstQuestion(contest: JsonObject): JsonObject {
  return (contest.questions as JsonObject[])[0] as JsonObject
}

function settingsOf(contest: JsonObject): JsonObject {
  return contest.settings as JsonObject
}

describe('validateContest', () => {
  it('accepts the shipped public/contest.json with room for 5 teams x 5 questions', () => {
    const result = validateContest(shippedContest)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.contest.questions.length).toBeGreaterThanOrEqual(25)
    }
  })

  it('accepts a valid contest and trims text', () => {
    const contest = validContest()
    contest.title = '  Spaced title  '
    const result = validateContest(contest)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.contest.title).toBe('Spaced title')
      expect(result.contest.questions).toHaveLength(2)
    }
  })

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'contest'],
  ])('rejects %s at the top level', (_, value) => {
    expect(validateContest(value).ok).toBe(false)
  })

  const cases: [string, (contest: JsonObject) => void, string][] = [
    ['blank title', (c) => { c.title = '   ' }, 'title'],
    ['missing settings', (c) => { delete c.settings }, 'settings'],
    ['zero timer', (c) => { settingsOf(c).secondsPerQuestion = 0 }, 'secondsPerQuestion'],
    ['string timer', (c) => { settingsOf(c).secondsPerQuestion = '60' }, 'secondsPerQuestion'],
    ['fractional timer', (c) => { settingsOf(c).secondsPerQuestion = 2.5 }, 'secondsPerQuestion'],
    ['huge timer', (c) => { settingsOf(c).secondsPerQuestion = 100000 }, 'secondsPerQuestion'],
    ['zero default turns', (c) => { settingsOf(c).defaultQuestionsPerTeam = 0 }, 'defaultQuestionsPerTeam'],
    ['string repeat flag', (c) => { settingsOf(c).allowCrossTeamRepeats = 'false' }, 'allowCrossTeamRepeats'],
    ['empty question list', (c) => { c.questions = [] }, 'questions must'],
    ['blank prompt', (c) => { firstQuestion(c).prompt = '' }, 'questions[0].prompt'],
    ['three options', (c) => { firstQuestion(c).options = ['a', 'b', 'c'] }, 'questions[0].options'],
    ['five options', (c) => { firstQuestion(c).options = ['a', 'b', 'c', 'd', 'e'] }, 'questions[0].options'],
    ['blank option', (c) => { firstQuestion(c).options = ['a', ' ', 'c', 'd'] }, 'questions[0].options[1]'],
    ['correctIndex 4', (c) => { firstQuestion(c).correctIndex = 4 }, 'correctIndex'],
    ['correctIndex -1', (c) => { firstQuestion(c).correctIndex = -1 }, 'correctIndex'],
    ['correctIndex 1.5', (c) => { firstQuestion(c).correctIndex = 1.5 }, 'correctIndex'],
    ['correctIndex as a string', (c) => { firstQuestion(c).correctIndex = '1' }, 'correctIndex'],
    ['blank explanation', (c) => { firstQuestion(c).explanation = '' }, 'explanation'],
    ['blank id', (c) => { firstQuestion(c).id = ' ' }, 'questions[0].id'],
    ['numeric id', (c) => { firstQuestion(c).id = 7 }, 'questions[0].id'],
    ['duplicate id', (c) => { firstQuestion(c).id = 'q2' }, 'questions[1].id "q2"'],
    ['duplicate id after trimming', (c) => { firstQuestion(c).id = ' q2 ' }, 'questions[1].id "q2"'],
  ]

  it.each(cases)('rejects %s', (_, mutate, expectedFragment) => {
    const errors = errorsFor(mutate)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.join('\n')).toContain(expectedFragment)
  })

  it('reports several problems together', () => {
    const errors = errorsFor((contest) => {
      contest.title = ''
      settingsOf(contest).allowCrossTeamRepeats = 1
      firstQuestion(contest).correctIndex = 9
    })
    expect(errors).toHaveLength(3)
  })
})
