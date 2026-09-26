export interface TeamScore {
  name: string
  score: number
}

export interface RankedTeam extends TeamScore {
  rank: number
  isWinner: boolean
}

export function rankTeams(teams: readonly TeamScore[]): RankedTeam[] {
  if (teams.length === 0) {
    return []
  }
  const topScore = Math.max(...teams.map((team) => team.score))
  const sorted = [...teams].sort((a, b) => b.score - a.score)
  return sorted.map((team) => ({
    name: team.name,
    score: team.score,
    rank: 1 + teams.filter((other) => other.score > team.score).length,
    isWinner: team.score === topScore,
  }))
}
