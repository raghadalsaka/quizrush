import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EffectScope } from 'vue'
import { OPTION_COUNT } from '../../src/config'
import { useGame, type Game } from '../../src/composables/useGame'
import type { Contest, ContestLoadResult } from '../../src/types/contest'
import { makeContest, runInScope, seededRandomInt, useFakeClock } from './helpers'

const { advance, jump } = useFakeClock()
let scope: EffectScope | undefined

afterEach(() => {
  scope?.stop()
})

function createGame(loadResult: ContestLoadResult | (() => ContestLoadResult), revealMs: number = 0): Game {
  const created = runInScope(() =>
    useGame({
      loadContest: async () => (typeof loadResult === 'function' ? loadResult() : loadResult),
      randomInt: seededRandomInt(42),
      revealMs: () => revealMs,
    }),
  )
  scope = created.scope
  return created.value
}

async function startedGame(teamNames: string[], questionsPerTeam: number, options: { contest?: Contest; revealMs?: number } = {}): Promise<Game> {
  const contest = options.contest ?? makeContest(30, false)
  const game = createGame({ ok: true, contest }, options.revealMs ?? 0)
  await game.load()
  expect(game.startGame({ teamNames, questionsPerTeam, secondsPerQuestion: 60 })).toBe(true)
  return game
}

function correctIndex(game: Game): number {
  const question = game.currentQuestion.value
  if (question === null) {
    throw new Error('no active question')
  }
  return question.correctIndex
}

function wrongIndex(game: Game): number {
  return (correctIndex(game) + 1) % OPTION_COUNT
}

describe('useGame: loading', () => {
  it('moves from loading to setup on a valid contest', async () => {
    const game = createGame({ ok: true, contest: makeContest(10, false) })
    expect(game.phase.value).toBe('loading')
    await game.load()
    expect(game.phase.value).toBe('setup')
  })

  it('logs load errors for the editor and recovers on retry', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let attempt = 0
    const game = createGame(() => {
      attempt += 1
      if (attempt === 1) {
        return { ok: false, errors: ['contest.json is not valid JSON'] }
      }
      return { ok: true, contest: makeContest(10, false) }
    })
    await game.load()
    expect(game.phase.value).toBe('error')
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), ['contest.json is not valid JSON'])
    await game.load()
    expect(game.phase.value).toBe('setup')
  })

  it('refuses to start with an invalid setup', async () => {
    const game = createGame({ ok: true, contest: makeContest(10, false) })
    await game.load()
    expect(game.startGame({ teamNames: ['Red', ' red '], questionsPerTeam: 2, secondsPerQuestion: 60 })).toBe(false)
    expect(game.startGame({ teamNames: ['Red', 'Blue'], questionsPerTeam: 6, secondsPerQuestion: 60 })).toBe(false)
    expect(game.phase.value).toBe('setup')
  })
})

describe('useGame: turns and scoring', () => {
  it('plays round-robin with equal turns and ends on results', async () => {
    const game = await startedGame(['Red', 'Blue', 'Green'], 2)
    const order: number[] = []
    const upcoming: (string | undefined)[] = []
    for (let turn = 0; turn < 6; turn++) {
      expect(game.phase.value).toBe('ready')
      order.push(game.currentTeamIndex.value)
      game.startTurn()
      expect(game.phase.value).toBe('answering')
      game.answer(correctIndex(game))
      expect(game.phase.value).toBe('resolved')
      upcoming.push(game.nextTeam.value?.name)
      game.nextTurn()
    }
    expect(order).toEqual([0, 1, 2, 0, 1, 2])
    expect(game.nextTeam.value).toBeNull()
    expect(upcoming).toEqual(['Blue', 'Green', 'Red', 'Blue', 'Green', undefined])
    expect(game.phase.value).toBe('results')
    expect(game.teams.value.map((team) => team.turnsTaken)).toEqual([2, 2, 2])
    expect(game.teams.value.map((team) => team.score)).toEqual([2, 2, 2])
  })

  it('has no next team to announce when a single team plays', async () => {
    const game = await startedGame(['Solo'], 2)
    game.startTurn()
    game.answer(correctIndex(game))
    expect(game.nextTeam.value).toBeNull()
    game.nextTurn()
    expect(game.currentTeamIndex.value).toBe(0)
    expect(game.phase.value).toBe('ready')
  })

  it('awards exactly one point for a correct answer, even on double clicks', async () => {
    const game = await startedGame(['Red'], 2)
    game.startTurn()
    const index = correctIndex(game)
    game.answer(index)
    game.answer(index)
    expect(game.teams.value[0]?.score).toBe(1)
    expect(game.outcome.value).toEqual({ kind: 'correct', selectedIndex: index })
  })

  it('awards nothing for a wrong answer and waits for the teacher', async () => {
    const game = await startedGame(['Red'], 2)
    game.startTurn()
    game.answer(wrongIndex(game))
    expect(game.teams.value[0]?.score).toBe(0)
    expect(game.outcome.value?.kind).toBe('incorrect')
    advance(120_000)
    expect(game.phase.value).toBe('resolved')
  })

  it('times out at zero, awards nothing, and ignores a late answer', async () => {
    const game = await startedGame(['Red'], 2)
    game.startTurn()
    advance(60_000)
    expect(game.phase.value).toBe('resolved')
    expect(game.outcome.value?.kind).toBe('timeout')
    game.answer(correctIndex(game))
    expect(game.teams.value[0]?.score).toBe(0)
  })

  it('treats an answer after the deadline but before the tick as a timeout', async () => {
    const game = await startedGame(['Red'], 2)
    game.startTurn()
    jump(60_000)
    game.answer(correctIndex(game))
    expect(game.outcome.value?.kind).toBe('timeout')
    expect(game.teams.value[0]?.score).toBe(0)
  })

  it('expires on visibility return after a suspended tab', async () => {
    const game = await startedGame(['Red'], 2)
    game.startTurn()
    jump(75_000)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(game.outcome.value?.kind).toBe('timeout')
  })
})

describe('useGame: reveal and teacher controls', () => {
  it('does not start the timer or accept input while the card is flipping', async () => {
    const game = await startedGame(['Red', 'Blue'], 2, { revealMs: 500 })
    game.startTurn()
    expect(game.phase.value).toBe('revealing')
    expect(game.isTimerRunning.value).toBe(false)
    game.answer(0)
    game.nextTurn()
    expect(game.phase.value).toBe('revealing')
    advance(500)
    expect(game.phase.value).toBe('answering')
    expect(game.remainingMs.value).toBe(60_000)
  })

  it('different card is refused after resolution', async () => {
    const game = await startedGame(['Red'], 2)
    game.startTurn()
    game.answer(wrongIndex(game))
    expect(game.replaceCard(game.cardId.value)).toBe(false)
    expect(game.phase.value).toBe('resolved')
  })

  it('a different-card confirmation arriving after time ran out resolves as a timeout', async () => {
    const game = await startedGame(['Red'], 2)
    game.startTurn()
    const card = game.cardId.value
    expect(game.canReplace.value).toBe(true)
    jump(60_000)
    expect(game.replaceCard(card)).toBe(false)
    expect(game.outcome.value?.kind).toBe('timeout')
  })

  it.each([false, true])('different card keeps the turn, draws a new question and ignores stale callbacks (paused: %s)', async (paused) => {
    const game = await startedGame(['Red', 'Blue'], 2, { revealMs: 500 })
    game.startTurn()
    advance(500)
    const oldCard = game.cardId.value
    const oldQuestion = game.currentQuestion.value
    advance(59_000)
    if (paused) {
      game.pause()
    }
    expect(game.canReplace.value).toBe(true)
    expect(game.replaceCard(oldCard)).toBe(true)
    expect(game.phase.value).toBe('revealing')
    expect(game.currentQuestion.value?.id).not.toBe(oldQuestion?.id)
    expect(game.currentTeamIndex.value).toBe(0)
    expect(game.turnNumber.value).toBe(1)
    advance(500)
    expect(game.phase.value).toBe('answering')
    expect(game.remainingMs.value).toBe(60_000)
    expect(game.replaceCard(oldCard)).toBe(false)
    advance(30_000)
    expect(game.phase.value).toBe('answering')
    expect(game.teams.value[0]?.score).toBe(0)
  })

  it.each([false, true])('disables a different card when no safe replacement exists (paused: %s)', async (paused) => {
    const game = await startedGame(['Solo'], 3, { contest: makeContest(3, false) })
    game.startTurn()
    if (paused) {
      game.pause()
    }
    expect(game.canReplace.value).toBe(false)
    expect(game.replaceCard(game.cardId.value)).toBe(false)
    expect(game.phase.value).toBe(paused ? 'paused' : 'answering')
  })

  it('pause stops the timer and locks answers, and continue keeps the time that was left', async () => {
    const game = await startedGame(['Red', 'Blue'], 2)
    game.startTurn()
    const question = game.currentQuestion.value
    advance(20_000)
    game.pause()
    expect(game.phase.value).toBe('paused')
    expect(game.isTimerRunning.value).toBe(false)
    game.answer(correctIndex(game))
    game.nextTurn()
    advance(120_000)
    expect(game.phase.value).toBe('paused')
    expect(game.teams.value[0]?.score).toBe(0)
    expect(game.remainingMs.value).toBe(40_000)
    game.resume()
    expect(game.phase.value).toBe('answering')
    expect(game.currentQuestion.value).toBe(question)
    advance(39_800)
    expect(game.phase.value).toBe('answering')
    game.answer(correctIndex(game))
    expect(game.teams.value[0]?.score).toBe(1)
  })

  it('continue lets the remaining time run out as a timeout', async () => {
    const game = await startedGame(['Red'], 2)
    game.startTurn()
    advance(50_000)
    game.pause()
    game.resume()
    advance(10_000)
    expect(game.outcome.value?.kind).toBe('timeout')
  })

  it('a pause arriving after the deadline but before the tick resolves as a timeout', async () => {
    const game = await startedGame(['Red'], 2)
    game.startTurn()
    jump(60_000)
    game.pause()
    expect(game.phase.value).toBe('resolved')
    expect(game.outcome.value?.kind).toBe('timeout')
  })

  it('pause and continue do nothing outside an open question', async () => {
    const game = await startedGame(['Red'], 2, { revealMs: 500 })
    game.pause()
    expect(game.phase.value).toBe('ready')
    game.startTurn()
    game.pause()
    expect(game.phase.value).toBe('revealing')
    advance(500)
    game.resume()
    expect(game.phase.value).toBe('answering')
    game.answer(wrongIndex(game))
    game.pause()
    game.resume()
    expect(game.phase.value).toBe('resolved')
  })

  it('new game resets in-memory state and remembers the last setup', async () => {
    const game = await startedGame(['Red', 'Blue'], 2)
    game.startTurn()
    game.answer(correctIndex(game))
    game.newGame()
    expect(game.phase.value).toBe('setup')
    expect(game.teams.value).toEqual([])
    expect(game.lastSetup.value?.teamNames).toEqual(['Red', 'Blue'])
    advance(120_000)
    expect(game.phase.value).toBe('setup')
  })
})

describe('useGame: results', () => {
  it('ranks teams and marks tied leaders as winners', async () => {
    const game = await startedGame(['Red', 'Blue', 'Green'], 1)
    const answers = ['correct', 'correct', 'wrong']
    answers.forEach((kind) => {
      game.startTurn()
      game.answer(kind === 'correct' ? correctIndex(game) : wrongIndex(game))
      game.nextTurn()
    })
    expect(game.phase.value).toBe('results')
    const winners = game.rankedTeams.value.filter((team) => team.isWinner).map((team) => team.name)
    expect(winners).toEqual(['Red', 'Blue'])
  })
})
