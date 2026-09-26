import { describe, expect, it } from 'vitest'
import {
  canReplaceActive,
  createDeck,
  drawForTurn,
  isFeasible,
  replaceActive,
  resolveActive,
  safeCandidates,
  type Deck,
} from '../../src/utils/deck'
import type { RandomInt } from '../../src/utils/random'
import { requiredQuestionCount } from '../../src/utils/setupRules'
import { pickFirst, seededRandomInt } from './helpers'

function ids(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `q${index + 1}`)
}

interface PlayLog {
  revealedByTeam: string[][]
  resolvedByTeam: string[][]
  replacedByTeam: string[][]
}

function playGame(deck: Deck, teamCount: number, randomInt: RandomInt, replaceChance: number): PlayLog {
  const log: PlayLog = {
    revealedByTeam: Array.from({ length: teamCount }, () => []),
    resolvedByTeam: Array.from({ length: teamCount }, () => []),
    replacedByTeam: Array.from({ length: teamCount }, () => []),
  }
  const consumedSoFar = new Set<string>()
  for (let turn = 0; turn < deck.questionsPerTeam; turn++) {
    for (let team = 0; team < teamCount; team++) {
      let questionId = drawForTurn(deck, team, randomInt)
      log.revealedByTeam[team]?.push(questionId)
      expect(consumedSoFar.has(questionId)).toBe(false)
      expect(isFeasible(deck)).toBe(true)
      while (canReplaceActive(deck) && randomInt(1000) < replaceChance * 1000) {
        log.replacedByTeam[team]?.push(questionId)
        questionId = replaceActive(deck, randomInt)
        log.revealedByTeam[team]?.push(questionId)
        expect(consumedSoFar.has(questionId)).toBe(false)
        expect(isFeasible(deck)).toBe(true)
      }
      resolveActive(deck)
      log.resolvedByTeam[team]?.push(questionId)
      if (!deck.allowCrossTeamRepeats) {
        consumedSoFar.add(questionId)
      }
      expect(isFeasible(deck)).toBe(true)
    }
  }
  return log
}

function expectNoRepeatWithinTeam(log: PlayLog): void {
  log.revealedByTeam.forEach((revealed) => {
    expect(new Set(revealed).size).toBe(revealed.length)
  })
}

describe('deck: acceptance examples', () => {
  it('3 teams x 5, repeats off, 15 questions: each team gets five and no question reappears', () => {
    const deck = createDeck(ids(15), 3, 5, false)
    const log = playGame(deck, 3, seededRandomInt(1), 0)
    log.resolvedByTeam.forEach((resolved) => expect(resolved).toHaveLength(5))
    expect(new Set(log.resolvedByTeam.flat()).size).toBe(15)
  })

  it('3 teams x 5, repeats on, 5 questions: every team sees all five, never twice', () => {
    const deck = createDeck(ids(5), 3, 5, true)
    const log = playGame(deck, 3, seededRandomInt(2), 0)
    log.resolvedByTeam.forEach((resolved) => {
      expect(resolved).toHaveLength(5)
      expect(new Set(resolved).size).toBe(5)
    })
  })
})

describe('deck: replacement rules', () => {
  it('disables replacement when a single team has exactly enough questions', () => {
    const deck = createDeck(ids(5), 1, 5, false)
    for (let turn = 0; turn < 5; turn++) {
      drawForTurn(deck, 0, seededRandomInt(turn))
      expect(canReplaceActive(deck)).toBe(false)
      resolveActive(deck)
    }
  })

  it('disables replacement when repeats are on and each team needs every question', () => {
    const deck = createDeck(ids(5), 3, 5, true)
    drawForTurn(deck, 0, pickFirst)
    expect(canReplaceActive(deck)).toBe(false)
  })

  it('at exact capacity with repeats off, a replaced card goes to another team and never back to the replacer', () => {
    const deck = createDeck(ids(15), 3, 5, false)
    const replaced = drawForTurn(deck, 0, pickFirst)
    expect(canReplaceActive(deck)).toBe(true)
    const replacement = replaceActive(deck, pickFirst)
    expect(replacement).not.toBe(replaced)
    expect(deck.active).toEqual({ team: 0, questionId: replacement })
    expect(deck.resolvedCount[0]).toBe(0)
    resolveActive(deck)

    const log = playGameFromCurrentState(deck, seededRandomInt(9))
    expect(log.drawnByTeam[0]).not.toContain(replaced)
    expect([...(log.drawnByTeam[1] ?? []), ...(log.drawnByTeam[2] ?? [])]).toContain(replaced)
  })

  it('never redraws the same id immediately for the replacing team', () => {
    const deck = createDeck(ids(4), 1, 2, false)
    const first = drawForTurn(deck, 0, pickFirst)
    expect(replaceActive(deck, pickFirst)).not.toBe(first)
  })

  it('does not consume a turn when replacing', () => {
    const deck = createDeck(ids(10), 2, 2, false)
    drawForTurn(deck, 0, pickFirst)
    replaceActive(deck, pickFirst)
    replaceActive(deck, pickFirst)
    expect(deck.resolvedCount).toEqual([0, 0])
    resolveActive(deck)
    expect(deck.resolvedCount).toEqual([1, 0])
  })

  it('steers ordinary draws away from a question another team uniquely needs', () => {
    const deck = createDeck(['a', 'b', 'c', 'd'], 2, 2, false)
    expect(drawForTurn(deck, 0, pickFirst)).toBe('a')
    expect(replaceActive(deck, pickFirst)).toBe('b')
    expect(replaceActive(deck, pickFirst)).toBe('c')
    expect(canReplaceActive(deck)).toBe(false)
    resolveActive(deck)
    expect(safeCandidates(deck, 1)).toEqual(['a', 'b'])
  })

  it('returns a replaced card to the deck for other teams when repeats are on', () => {
    const deck = createDeck(ids(6), 2, 3, true)
    const replaced = drawForTurn(deck, 0, pickFirst)
    replaceActive(deck, pickFirst)
    resolveActive(deck)
    expect(safeCandidates(deck, 1)).toContain(replaced)
    expect(safeCandidates(deck, 0)).not.toContain(replaced)
  })
})

function playGameFromCurrentState(deck: Deck, randomInt: RandomInt): { drawnByTeam: string[][] } {
  const teamCount = deck.resolvedCount.length
  const drawnByTeam: string[][] = Array.from({ length: teamCount }, () => [])
  let team = 1
  while (deck.resolvedCount.some((count) => count < deck.questionsPerTeam)) {
    drawnByTeam[team]?.push(drawForTurn(deck, team, randomInt))
    resolveActive(deck)
    team = (team + 1) % teamCount
  }
  return { drawnByTeam }
}

describe('deck: randomized games never run out of questions', () => {
  it('holds every invariant across many random setups with aggressive replacement', () => {
    const random = seededRandomInt(20260927)
    for (let game = 0; game < 400; game++) {
      const teamCount = 1 + random(5)
      const questionsPerTeam = 1 + random(6)
      const allowRepeats = random(2) === 1
      const required = requiredQuestionCount(teamCount, questionsPerTeam, allowRepeats)
      const questionCount = required + random(4)
      const deck = createDeck(ids(questionCount), teamCount, questionsPerTeam, allowRepeats)
      const log = playGame(deck, teamCount, random, 0.6)

      log.resolvedByTeam.forEach((resolved) => expect(resolved).toHaveLength(questionsPerTeam))
      expectNoRepeatWithinTeam(log)
      if (!allowRepeats) {
        const allResolved = log.resolvedByTeam.flat()
        expect(new Set(allResolved).size).toBe(allResolved.length)
      }
      log.replacedByTeam.forEach((replaced, team) => {
        replaced.forEach((id) => expect(log.resolvedByTeam[team]).not.toContain(id))
      })
    }
  })
})
