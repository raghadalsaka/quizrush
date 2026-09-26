import { describe, expect, it, vi } from 'vitest'
import { useCountdown } from '../../src/composables/useCountdown'
import { runInScope, useFakeClock } from './helpers'

const { advance, jump } = useFakeClock()

function createCountdown() {
  const onExpire = vi.fn()
  const { value: countdown, scope } = runInScope(() => useCountdown(onExpire))
  return { countdown, onExpire, scope }
}

describe('useCountdown', () => {
  it('counts down from a monotonic deadline and expires exactly once', () => {
    const { countdown, onExpire } = createCountdown()
    countdown.start(3000)
    advance(1000)
    expect(countdown.remainingMs.value).toBe(2000)
    advance(2500)
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(countdown.remainingMs.value).toBe(0)
    expect(countdown.isRunning.value).toBe(false)
    advance(5000)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('restarting resets to the full duration', () => {
    const { countdown, onExpire } = createCountdown()
    countdown.start(3000)
    advance(2000)
    countdown.start(3000)
    expect(countdown.remainingMs.value).toBe(3000)
    advance(2000)
    expect(onExpire).not.toHaveBeenCalled()
    advance(1000)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('stop prevents expiry', () => {
    const { countdown, onExpire } = createCountdown()
    countdown.start(1000)
    countdown.stop()
    advance(5000)
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('reports expiry at the zero crossing before the next tick runs', () => {
    const { countdown, onExpire } = createCountdown()
    countdown.start(1000)
    jump(1000)
    expect(countdown.isExpired()).toBe(true)
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('reconciles a suspended tab on visibility return without granting extra time', () => {
    const { countdown, onExpire } = createCountdown()
    countdown.start(60_000)
    jump(90_000)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(countdown.remainingMs.value).toBe(0)
  })

  it('cleans up its ticker and listener when its scope is disposed', () => {
    const { countdown, onExpire, scope } = createCountdown()
    countdown.start(1000)
    scope.stop()
    jump(5000)
    document.dispatchEvent(new Event('visibilitychange'))
    advance(5000)
    expect(onExpire).not.toHaveBeenCalled()
  })
})
