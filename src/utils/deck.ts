import { pickRandom, type RandomInt } from './random'

export interface ActiveCard {
  team: number
  questionId: string
}

export interface Deck {
  readonly questionIds: readonly string[]
  readonly allowCrossTeamRepeats: boolean
  readonly questionsPerTeam: number
  readonly exposedBy: Set<string>[]
  readonly consumed: Set<string>
  readonly resolvedCount: number[]
  active: ActiveCard | null
}

export function createDeck(questionIds: readonly string[], teamCount: number, questionsPerTeam: number, allowCrossTeamRepeats: boolean): Deck {
  return {
    questionIds: [...questionIds],
    allowCrossTeamRepeats,
    questionsPerTeam,
    exposedBy: Array.from({ length: teamCount }, () => new Set<string>()),
    consumed: new Set<string>(),
    resolvedCount: Array.from({ length: teamCount }, () => 0),
    active: null,
  }
}

function exposureMasks(deck: Deck): Map<string, number> {
  const masks = new Map<string, number>()
  deck.exposedBy.forEach((exposed, team) => {
    exposed.forEach((id) => masks.set(id, (masks.get(id) ?? 0) | (1 << team)))
  })
  return masks
}

// Hall's condition: every group of teams must jointly still have enough distinct questions for all of its remaining turns.
function canMeetDemand(needs: readonly number[], availableMasks: readonly number[], allowCrossTeamRepeats: boolean): boolean {
  const needyTeams = needs.flatMap((need, team) => (need > 0 ? [team] : []))
  if (allowCrossTeamRepeats) {
    return needyTeams.every((team) => {
      const unseen = availableMasks.filter((mask) => (mask & (1 << team)) === 0).length
      return unseen >= (needs[team] ?? 0)
    })
  }
  const subsetCount = 1 << needyTeams.length
  for (let subset = 1; subset < subsetCount; subset++) {
    let demand = 0
    let teamsMask = 0
    needyTeams.forEach((team, position) => {
      if ((subset & (1 << position)) !== 0) {
        demand += needs[team] ?? 0
        teamsMask |= 1 << team
      }
    })
    const seenByAll = availableMasks.filter((mask) => (mask & teamsMask) === teamsMask).length
    if (availableMasks.length - seenByAll < demand) {
      return false
    }
  }
  return true
}

function remainingTurns(deck: Deck, team: number): number {
  return deck.questionsPerTeam - (deck.resolvedCount[team] ?? 0)
}

function isFeasibleWith(deck: Deck, assignment: ActiveCard | null, baseMasks: ReadonlyMap<string, number>): boolean {
  const needs = deck.resolvedCount.map((_, team) => remainingTurns(deck, team) - (assignment?.team === team ? 1 : 0))
  const availableMasks = deck.questionIds.flatMap((id) => {
    if (!deck.allowCrossTeamRepeats && (deck.consumed.has(id) || id === assignment?.questionId)) {
      return []
    }
    const mask = baseMasks.get(id) ?? 0
    if (assignment !== null && id === assignment.questionId) {
      return [mask | (1 << assignment.team)]
    }
    return [mask]
  })
  return canMeetDemand(needs, availableMasks, deck.allowCrossTeamRepeats)
}

export function isFeasible(deck: Deck): boolean {
  return isFeasibleWith(deck, deck.active, exposureMasks(deck))
}

export function safeCandidates(deck: Deck, team: number): string[] {
  if (remainingTurns(deck, team) < 1) {
    return []
  }
  const baseMasks = exposureMasks(deck)
  const exposed = deck.exposedBy[team]
  return deck.questionIds.filter(
    (id) =>
      !exposed?.has(id) &&
      (deck.allowCrossTeamRepeats || !deck.consumed.has(id)) &&
      isFeasibleWith(deck, { team, questionId: id }, baseMasks),
  )
}

function assign(deck: Deck, team: number, randomInt: RandomInt): string {
  const candidates = safeCandidates(deck, team)
  if (candidates.length === 0) {
    throw new Error(`No question can be drawn for team ${team + 1} without leaving a later turn short`)
  }
  const questionId = pickRandom(candidates, randomInt)
  deck.exposedBy[team]?.add(questionId)
  deck.active = { team, questionId }
  return questionId
}

export function drawForTurn(deck: Deck, team: number, randomInt: RandomInt): string {
  if (deck.active !== null) {
    throw new Error('A card is already active')
  }
  return assign(deck, team, randomInt)
}

export function canReplaceActive(deck: Deck): boolean {
  return deck.active !== null && safeCandidates(deck, deck.active.team).length > 0
}

export function replaceActive(deck: Deck, randomInt: RandomInt): string {
  if (deck.active === null) {
    throw new Error('No active card to replace')
  }
  return assign(deck, deck.active.team, randomInt)
}

export function resolveActive(deck: Deck): void {
  if (deck.active === null) {
    throw new Error('No active card to resolve')
  }
  const { team, questionId } = deck.active
  deck.resolvedCount[team] = (deck.resolvedCount[team] ?? 0) + 1
  if (!deck.allowCrossTeamRepeats) {
    deck.consumed.add(questionId)
  }
  deck.active = null
}
