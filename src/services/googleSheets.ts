import { FriendlyError } from '../utils/errors'

const SHEETS_API: string = 'https://sheets.googleapis.com/v4/spreadsheets'

export class GoogleConnectionExpired extends FriendlyError {
  constructor() {
    super('The Google connection expired. Connect again.')
  }
}

export function rosterSpreadsheetId(): string {
  return String(import.meta.env.VITE_ROSTER_SHEET_ID ?? '').trim()
}

// Only GET requests: the token's read-only scope couldn't change the sheet anyway.
export async function readSheetTab(token: string, tab: string, signal?: AbortSignal): Promise<unknown[][]> {
  const url = `${SHEETS_API}/${encodeURIComponent(rosterSpreadsheetId())}/values/${encodeURIComponent(tab)}`
  let response: Response
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal })
  } catch (error) {
    if (signal?.aborted === true) {
      throw error
    }
    console.error(`GET ${url} failed`, error)
    throw new FriendlyError("Can't reach Google. Check the connection and try again.")
  }
  if (!response.ok) {
    const problem = ((await response.json().catch(() => null)) as { error?: { message?: string } } | null)?.error?.message ?? ''
    console.error(`GET ${url} answered ${response.status}`, problem)
    if (response.status === 401) {
      throw new GoogleConnectionExpired()
    }
    if (response.status === 403) {
      throw new FriendlyError("This Google account can't open the class list. Ask its owner to share it with you.")
    }
    if (response.status === 404) {
      throw new FriendlyError("The class list wasn't found.")
    }
    throw new FriendlyError("Google couldn't send the class list. Try again.")
  }
  const body = (await response.json()) as { values?: unknown[][] }
  return body.values ?? []
}
