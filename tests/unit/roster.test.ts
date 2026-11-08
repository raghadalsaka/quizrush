import { describe, expect, it } from 'vitest'
import { EMOJI_POOL } from '../../src/config'
import { buildRoster, fillDefaultEmojis, parseRosterNames } from '../../src/utils/roster'
import { rosterKey } from '../../src/utils/setupRules'

describe('parseRosterNames', () => {
  it('keeps one name per line in order, trimmed, without blank lines', () => {
    expect(parseRosterNames('  Ana  Lee \r\n\nBen\n   \nCy\n')).toEqual(['Ana Lee', 'Ben', 'Cy'])
  })

  it('returns nothing for empty text', () => {
    expect(parseRosterNames('')).toEqual([])
  })
})

describe('rosterKey', () => {
  it('matches names that differ only in case and spacing', () => {
    expect(rosterKey(' Ana   Lee ')).toBe(rosterKey('ana lee'))
  })
})

describe('fillDefaultEmojis', () => {
  it('gives every entry a different default emoji', () => {
    const emojis = fillDefaultEmojis(Array<null>(30).fill(null))
    expect(emojis).toEqual(EMOJI_POOL.slice(0, 30))
  })

  it('keeps picks and never gives a picked emoji out as a default', () => {
    const picked = EMOJI_POOL[1] as string
    const emojis = fillDefaultEmojis([null, null, picked])
    expect(emojis[2]).toBe(picked)
    expect(emojis.slice(0, 2)).not.toContain(picked)
    expect(new Set(emojis).size).toBe(3)
  })
})

describe('buildRoster', () => {
  it('pairs each name with its pick or a default', () => {
    const picked = EMOJI_POOL[0] as string
    expect(buildRoster(['Ana', 'Ben'], [null, picked])).toEqual([
      { name: 'Ana', emoji: EMOJI_POOL[1] },
      { name: 'Ben', emoji: picked },
    ])
  })
})
