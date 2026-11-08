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

export const MAX_DECK_TEAMS: number = 31

export function createDeck(questionIds: readonly string[], teamCount: number, questionsPerTeam: number, allowCrossTeamRepeats: boolean): Deck {
  if (teamCount > MAX_DECK_TEAMS) {
    throw new Error(`A deck tracks exposure in 32-bit masks, so it supports at most ${MAX_DECK_TEAMS} teams, not ${teamCount}`)
  }
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

function maxFlow(capacity: number[], nodeCount: number, source: number, sink: number): number {
  let total = 0
  for (;;) {
    const parent = Array.from({ length: nodeCount }, () => -1)
    parent[source] = source
    const queue = [source]
    for (let head = 0; head < queue.length && parent[sink] === -1; head++) {
      const node = queue[head] ?? source
      for (let next = 0; next < nodeCount; next++) {
        if (parent[next] === -1 && (capacity[node * nodeCount + next] ?? 0) > 0) {
          parent[next] = node
          queue.push(next)
        }
      }
    }
    if (parent[sink] === -1) {
      return total
    }
    let bottleneck = Number.POSITIVE_INFINITY
    for (let node = sink; node !== source; node = parent[node] ?? source) {
      const from = parent[node] ?? source
      bottleneck = Math.min(bottleneck, capacity[from * nodeCount + node] ?? 0)
    }
    for (let node = sink; node !== source; node = parent[node] ?? source) {
      const from = parent[node] ?? source
      capacity[from * nodeCount + node] = (capacity[from * nodeCount + node] ?? 0) - bottleneck
      capacity[node * nodeCount + from] = (capacity[node * nodeCount + from] ?? 0) + bottleneck
    }
    total += bottleneck
  }
}

// Hall's condition (every group of teams jointly has enough distinct questions for its remaining turns), checked as a max flow
// from teams to groups of questions with the same exposure, so it stays fast for 30 players instead of 2^30 subsets.
function canMeetDemand(needs: readonly number[], availableMasks: readonly number[], allowCrossTeamRepeats: boolean): boolean {
  const needyTeams = needs.flatMap((need, team) => (need > 0 ? [team] : []))
  if (allowCrossTeamRepeats) {
    return needyTeams.every((team) => {
      const unseen = availableMasks.filter((mask) => (mask & (1 << team)) === 0).length
      return unseen >= (needs[team] ?? 0)
    })
  }
  const groupSizes = new Map<number, number>()
  availableMasks.forEach((mask) => groupSizes.set(mask, (groupSizes.get(mask) ?? 0) + 1))
  const groups = [...groupSizes]
  const firstGroupNode = 1 + needyTeams.length
  const sink = firstGroupNode + groups.length
  const nodeCount = sink + 1
  const capacity = Array.from({ length: nodeCount * nodeCount }, () => 0)
  let demand = 0
  needyTeams.forEach((team, position) => {
    const need = needs[team] ?? 0
    const teamNode = 1 + position
    demand += need
    capacity[teamNode] = need
    groups.forEach(([mask], groupPosition) => {
      if ((mask & (1 << team)) === 0) {
        capacity[teamNode * nodeCount + firstGroupNode + groupPosition] = need
      }
    })
  })
  groups.forEach(([, size], groupPosition) => {
    capacity[(firstGroupNode + groupPosition) * nodeCount + sink] = size
  })
  return maxFlow(capacity, nodeCount, 0, sink) >= demand
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
  // Questions with the same exposure are interchangeable, so one feasibility check per exposure mask covers them all.
  const verdictByMask = new Map<number, boolean>()
  return deck.questionIds.filter((id) => {
    if (exposed?.has(id) || (!deck.allowCrossTeamRepeats && deck.consumed.has(id))) {
      return false
    }
    const mask = baseMasks.get(id) ?? 0
    let verdict = verdictByMask.get(mask)
    if (verdict === undefined) {
      verdict = isFeasibleWith(deck, { team, questionId: id }, baseMasks)
      verdictByMask.set(mask, verdict)
    }
    return verdict
  })
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
