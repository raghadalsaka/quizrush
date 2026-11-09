import { afterEach, describe, expect, it, vi } from 'vitest'
import { GoogleConnectionExpired, readSheetTab } from '../../src/services/googleSheets'
import { FriendlyError } from '../../src/utils/errors'

function answer(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('readSheetTab', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('reads the tab with a plain GET and the teacher token', async () => {
    vi.stubEnv('VITE_ROSTER_SHEET_ID', 'sheet-123')
    const fetchMock = vi.fn().mockResolvedValue(answer(200, { values: [['slug', 'name']] }))
    vi.stubGlobal('fetch', fetchMock)

    const values = await readSheetTab('token-abc', 'classrooms')

    expect(values).toEqual([['slug', 'name']])
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://sheets.googleapis.com/v4/spreadsheets/sheet-123/values/classrooms')
    expect(init.method ?? 'GET').toBe('GET')
    expect(init.body).toBeUndefined()
    expect(init.headers).toEqual({ Authorization: 'Bearer token-abc' })
  })

  it('reports an expired connection separately so the teacher can connect again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(401, { error: { message: 'invalid credentials' } })))
    await expect(readSheetTab('old', 'classrooms')).rejects.toBeInstanceOf(GoogleConnectionExpired)
  })

  it('words a refused account for teachers', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(403, {})))
    const error = await readSheetTab('token', 'classrooms').catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(FriendlyError)
    expect(error).not.toBeInstanceOf(GoogleConnectionExpired)
    expect((error as Error).message).toMatch(/can't open the class list/)
  })
})
