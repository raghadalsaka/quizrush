import { afterEach, beforeEach, vi } from 'vitest'
import { effectScope, type EffectScope } from 'vue'
import type { RandomInt } from '../../src/utils/random'
import type { Contest, Question } from '../../src/types/contest'

export function seededRandomInt(seed: number): RandomInt {
  let state = seed >>> 0
  return (exclusiveMax) => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    const unit = ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
    return Math.floor(unit * exclusiveMax)
  }
}

export const pickFirst: RandomInt = () => 0

export function makeQuestion(id: string, correctIndex: number = 0): Question {
  return {
    id,
    prompt: `Prompt for ${id}`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex,
    explanation: `Explanation for ${id}`,
  }
}

export function makeContest(questionCount: number, allowCrossTeamRepeats: boolean): Contest {
  return {
    title: 'Test Contest',
    slug: 'test-contest',
    settings: { secondsPerQuestion: 60, defaultQuestionsPerTeam: 5, allowCrossTeamRepeats },
    questions: Array.from({ length: questionCount }, (_, index) => makeQuestion(`q${index + 1}`)),
  }
}

export interface FakeClock {
  advance: (ms: number) => void
  jump: (ms: number) => void
}

export function useFakeClock(): FakeClock {
  let now = 0
  beforeEach(() => {
    now = 0
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    vi.spyOn(performance, 'now').mockImplementation(() => now)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
  return {
    advance: (ms) => {
      now += ms
      vi.advanceTimersByTime(ms)
    },
    jump: (ms) => {
      now += ms
    },
  }
}

export function runInScope<T>(create: () => T): { value: T; scope: EffectScope } {
  const scope = effectScope()
  const value = scope.run(create)
  if (value === undefined) {
    throw new Error('effect scope did not run')
  }
  return { value, scope }
}
