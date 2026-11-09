import { describe, expect, it, vi } from 'vitest'
import { useClassRoster } from '../../src/composables/useClassRoster'
import { GoogleConnectionExpired } from '../../src/services/googleSheets'
import { CLASS_VALUES, fakeDeps, STUDENT_VALUES } from './helpers'

describe('useClassRoster', () => {
  it('connects, lists the classes, and loads only the picked class in sheet order', async () => {
    const readTab = vi.fn(fakeDeps().readTab)
    const classRoster = useClassRoster(fakeDeps({ readTab }))

    await classRoster.connect()
    expect(classRoster.status.value).toBe('connected')
    expect(classRoster.classes.value.map((choice) => choice.name)).toEqual(['Grade 6A', 'Grade 6B'])

    await classRoster.pickClass('6a')
    expect(classRoster.roster.value).toEqual([
      { name: 'Lina', emoji: '🦊', photo: 'data:image/png;base64,QUJD' },
      { name: 'Sami', emoji: '🐯' },
    ])
    expect(readTab.mock.calls.map(([, tab]) => tab)).toEqual(['classrooms', 'students'])
  })

  it('reads the sheet again on every pick, so spreadsheet edits show the next time a class is loaded', async () => {
    let students = STUDENT_VALUES
    const classRoster = useClassRoster(fakeDeps({ readTab: (_token, tab) => Promise.resolve(tab === 'classrooms' ? CLASS_VALUES : students) }))
    await classRoster.connect()
    await classRoster.pickClass('6a')
    students = [...STUDENT_VALUES, ['4', '6a', 'Rami', '🐸', '3', '']]
    await classRoster.pickClass('6b')
    await classRoster.pickClass('6a')
    expect(classRoster.roster.value?.map((entry) => entry.name)).toEqual(['Lina', 'Sami', 'Rami'])
  })

  it('keeps the newest pick when an earlier class answers late, and cancels its download', async () => {
    const pending: ((values: unknown[][]) => void)[] = []
    const signals: (AbortSignal | undefined)[] = []
    const classRoster = useClassRoster(
      fakeDeps({
        readTab: (_token, tab, signal) => {
          if (tab === 'classrooms') {
            return Promise.resolve(CLASS_VALUES)
          }
          signals.push(signal)
          return new Promise((resolve) => pending.push(resolve))
        },
      }),
    )
    await classRoster.connect()
    const slow = classRoster.pickClass('6a')
    const fast = classRoster.pickClass('6b')
    pending[1]?.(STUDENT_VALUES)
    await fast
    pending[0]?.(STUDENT_VALUES)
    await slow
    expect(signals.map((signal) => signal?.aborted)).toEqual([true, false])
    expect(classRoster.selectedSlug.value).toBe('6b')
    expect(classRoster.roster.value?.map((entry) => entry.name)).toEqual(['Omar'])
  })

  it('asks to connect again when the token has expired before a pick', async () => {
    let token = 'token'
    const classRoster = useClassRoster(fakeDeps({ token: () => token }))
    await classRoster.connect()
    token = ''
    await classRoster.pickClass('6a')
    expect(classRoster.status.value).toBe('disconnected')
    expect(classRoster.roster.value).toBeNull()
    expect(classRoster.message.value).toMatch(/Connect again/)
  })

  it('asks to connect again when Google turns the token down', async () => {
    const classRoster = useClassRoster(
      fakeDeps({
        readTab: (_token, tab) => (tab === 'classrooms' ? Promise.resolve(CLASS_VALUES) : Promise.reject(new GoogleConnectionExpired())),
      }),
    )
    await classRoster.connect()
    await classRoster.pickClass('6a')
    expect(classRoster.status.value).toBe('disconnected')
  })

  it('shows a plain message, not the technical detail, when the sheet layout is unexpected', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const classRoster = useClassRoster(fakeDeps({ readTab: () => Promise.resolve([['class', 'title']]) }))
    await classRoster.connect()
    expect(classRoster.status.value).toBe('disconnected')
    expect(classRoster.message.value).toMatch(/isn't set up the way QuizRush expects/)
    expect(classRoster.message.value).not.toMatch(/slug|tab|column/)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('stays unavailable when the site was built without the Google settings', () => {
    expect(useClassRoster(fakeDeps({ isConfigured: () => false })).isAvailable).toBe(false)
  })
})
