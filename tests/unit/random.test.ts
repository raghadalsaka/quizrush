import { describe, expect, it } from 'vitest'
import { cryptoRandomInt, pickRandom } from '../../src/utils/random'

describe('cryptoRandomInt', () => {
  it('stays within range and covers every value', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) {
      const value = cryptoRandomInt(5)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(5)
      seen.add(value)
    }
    expect(seen.size).toBe(5)
  })

  it('rejects invalid ranges', () => {
    expect(() => cryptoRandomInt(0)).toThrow(RangeError)
    expect(() => cryptoRandomInt(1.5)).toThrow(RangeError)
  })

  it('refuses to pick from an empty list', () => {
    expect(() => pickRandom([], cryptoRandomInt)).toThrow(RangeError)
  })
})
