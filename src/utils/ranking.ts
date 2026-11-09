import type { RosterEntry } from '../types/game'

export interface TeamScore extends RosterEntry {
  score: number
}

export interface RankedTeam extends TeamScore {
  teamIndex: number
  rank: number
  isWinner: boolean
}

export function rankTeams(teams: readonly TeamScore[]): RankedTeam[] {
  if (teams.length === 0) {
    return []
  }
  const topScore = Math.max(...teams.map((team) => team.score))
  const sorted = teams.map((team, teamIndex) => ({ team, teamIndex })).sort((a, b) => b.team.score - a.team.score)
  return sorted.map(({ team, teamIndex }) => ({
    name: team.name,
    emoji: team.emoji,
    photo: team.photo,
    score: team.score,
    teamIndex,
    rank: 1 + teams.filter((other) => other.score > team.score).length,
    isWinner: team.score === topScore,
  }))
}
