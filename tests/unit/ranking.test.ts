import { describe, expect, it } from 'vitest'
import { rankTeams } from '../../src/utils/ranking'

describe('rankTeams', () => {
  it('sorts by score and marks every tied leader as a winner', () => {
    const ranked = rankTeams([
      { name: 'A', emoji: '🦊', score: 2 },
      { name: 'B', emoji: '🐼', score: 4 },
      { name: 'C', emoji: '🐯', score: 4 },
      { name: 'D', emoji: '🦁', score: 1 },
    ])
    expect(ranked.map((team) => team.name)).toEqual(['B', 'C', 'A', 'D'])
    expect(ranked.map((team) => team.teamIndex)).toEqual([1, 2, 0, 3])
    expect(ranked.map((team) => team.emoji)).toEqual(['🐼', '🐯', '🦊', '🦁'])
    expect(ranked.map((team) => team.rank)).toEqual([1, 1, 3, 4])
    expect(ranked.filter((team) => team.isWinner).map((team) => team.name)).toEqual(['B', 'C'])
  })

  it('treats an all-zero game as a tie between everyone', () => {
    expect(rankTeams([{ name: 'A', emoji: '🦊', score: 0 }, { name: 'B', emoji: '🐼', score: 0 }]).every((team) => team.isWinner)).toBe(true)
  })

  it('celebrates a single team', () => {
    expect(rankTeams([{ name: 'Solo', emoji: '🦊', score: 3 }])).toEqual([{ name: 'Solo', emoji: '🦊', score: 3, teamIndex: 0, rank: 1, isWinner: true }])
  })

  it('ranks 30 players with shared ranks for ties', () => {
    const players = Array.from({ length: 30 }, (_, index) => ({ name: `P${index + 1}`, emoji: `e${index}`, score: index % 3 }))
    const ranked = rankTeams(players)
    expect(ranked.filter((player) => player.isWinner)).toHaveLength(10)
    expect(new Set(ranked.slice(0, 10).map((player) => player.rank))).toEqual(new Set([1]))
    expect(ranked[10]?.rank).toBe(11)
    expect(ranked[20]?.rank).toBe(21)
    ranked.forEach((player) => expect(player.emoji).toBe(`e${player.teamIndex}`))
  })
})
