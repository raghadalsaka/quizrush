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

  it('pause freezes the exact remaining time and resume continues from it', () => {
    const { countdown, onExpire } = createCountdown()
    countdown.start(3000)
    advance(1000)
    jump(150)
    countdown.pause()
    expect(countdown.remainingMs.value).toBe(1850)
    expect(countdown.isRunning.value).toBe(false)
    jump(60_000)
    document.dispatchEvent(new Event('visibilitychange'))
    advance(5000)
    expect(onExpire).not.toHaveBeenCalled()
    expect(countdown.isExpired()).toBe(false)
    countdown.resume()
    advance(1800)
    expect(onExpire).not.toHaveBeenCalled()
    advance(200)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('resume does nothing unless the countdown was paused with time left', () => {
    const { countdown, onExpire } = createCountdown()
    countdown.resume()
    advance(5000)
    expect(countdown.isRunning.value).toBe(false)
    countdown.start(1000)
    advance(400)
    countdown.resume()
    advance(600)
    expect(onExpire).toHaveBeenCalledTimes(1)
    countdown.start(1000)
    advance(400)
    countdown.stop()
    countdown.resume()
    advance(5000)
    expect(countdown.isRunning.value).toBe(false)
    expect(onExpire).toHaveBeenCalledTimes(1)
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
