import { getCurrentScope, onScopeDispose, readonly, ref, type Ref } from 'vue'
import { TICK_MS } from '../config'

export interface Countdown {
  remainingMs: Readonly<Ref<number>>
  isRunning: Readonly<Ref<boolean>>
  start: (durationMs: number) => void
  stop: () => void
  isExpired: () => boolean
}

export function useCountdown(onExpire: () => void): Countdown {
  const remainingMs = ref(0)
  const isRunning = ref(false)
  let deadline = 0
  let intervalId: ReturnType<typeof setInterval> | null = null

  function clearTicker(): void {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function stop(): void {
    clearTicker()
    isRunning.value = false
  }

  function tick(): void {
    if (!isRunning.value) {
      return
    }
    const remaining = Math.max(0, deadline - performance.now())
    remainingMs.value = remaining
    if (remaining > 0) {
      return
    }
    stop()
    onExpire()
  }

  function start(ms: number): void {
    clearTicker()
    remainingMs.value = ms
    deadline = performance.now() + ms
    isRunning.value = true
    intervalId = setInterval(tick, TICK_MS)
  }

  function isExpired(): boolean {
    return isRunning.value && performance.now() >= deadline
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', tick)
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      stop()
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', tick)
      }
    })
  }

  return {
    remainingMs: readonly(remainingMs),
    isRunning: readonly(isRunning),
    start,
    stop,
    isExpired,
  }
}
