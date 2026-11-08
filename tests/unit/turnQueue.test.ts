import { describe, expect, it } from 'vitest'
import { turnQueue } from '../../src/utils/turnQueue'

describe('turnQueue', () => {
  it('starts with the player answering and follows turn order, wrapping around', () => {
    expect(turnQueue(5, 2)).toEqual([2, 3, 4, 0, 1])
  })

  it('is plain entry order on the first turn', () => {
    expect(turnQueue(3, 0)).toEqual([0, 1, 2])
  })

  it('handles an empty list', () => {
    expect(turnQueue(0, 0)).toEqual([])
  })
})
