import { describe, expect, it } from 'vitest'
import { rankTeams } from '../../src/utils/ranking'

describe('rankTeams', () => {
  it('sorts by score and marks every tied leader as a winner', () => {
    const ranked = rankTeams([
      { name: 'A', score: 2 },
      { name: 'B', score: 4 },
      { name: 'C', score: 4 },
      { name: 'D', score: 1 },
    ])
    expect(ranked.map((team) => team.name)).toEqual(['B', 'C', 'A', 'D'])
    expect(ranked.map((team) => team.rank)).toEqual([1, 1, 3, 4])
    expect(ranked.filter((team) => team.isWinner).map((team) => team.name)).toEqual(['B', 'C'])
  })

  it('treats an all-zero game as a tie between everyone', () => {
    expect(rankTeams([{ name: 'A', score: 0 }, { name: 'B', score: 0 }]).every((team) => team.isWinner)).toBe(true)
  })

  it('celebrates a single team', () => {
    expect(rankTeams([{ name: 'Solo', score: 3 }])).toEqual([{ name: 'Solo', score: 3, rank: 1, isWinner: true }])
  })
})
