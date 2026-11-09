import { FriendlyError } from '../utils/errors'

const GIS_SCRIPT_URL: string = 'https://accounts.google.com/gsi/client'
// Read-only: QuizRush never writes rosters, attendance or scores back to Google.
const SHEETS_READONLY_SCOPE: string = 'https://www.googleapis.com/auth/spreadsheets.readonly'
// Tokens are renewed a little early, so a read never starts with one about to expire.
const EXPIRY_MARGIN_MS: number = 60 * 1000

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void
}

interface GoogleIdentity {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
        error_callback?: (error: { type?: string; message?: string }) => void
      }) => TokenClient
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

let scriptLoad: Promise<void> | null = null
let tokenClient: TokenClient | null = null
let pending: { resolve: (token: string) => void; reject: (error: Error) => void } | null = null
let accessToken: string = ''
let expiresAt: number = 0

export function googleClientId(): string {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
}

// The sign-in popup must open inside the click, so the Google script is loaded before the teacher clicks.
export function preloadGoogleSignIn(): Promise<void> {
  if (scriptLoad === null) {
    scriptLoad = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GIS_SCRIPT_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptLoad = null
        reject(new FriendlyError("Google couldn't load. Check the connection and try again."))
      }
      document.head.appendChild(script)
    })
  }
  return scriptLoad
}

export function currentToken(): string {
  return accessToken !== '' && Date.now() < expiresAt - EXPIRY_MARGIN_MS ? accessToken : ''
}

// The token is kept in memory only, so a reload asks the teacher to connect again.
// Call from a click handler without awaiting anything first, or the browser blocks the popup.
export function requestToken(): Promise<string> {
  const google = window.google
  if (google === undefined) {
    void preloadGoogleSignIn().catch(() => {})
    return Promise.reject(new FriendlyError('Google is still loading. Try again in a moment.'))
  }
  if (tokenClient === null) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: googleClientId(),
      scope: SHEETS_READONLY_SCOPE,
      callback: (response) => finish(response),
      error_callback: (error) => fail(new FriendlyError("Connecting to Google didn't finish. Try again."), error.type ?? 'closed'),
    })
  }
  return new Promise<string>((resolve, reject) => {
    pending?.reject(new FriendlyError('Connecting to Google was started again.'))
    pending = { resolve, reject }
    tokenClient?.requestAccessToken({ prompt: accessToken === '' ? 'select_account' : '' })
  })
}

function finish(response: TokenResponse): void {
  if (response.access_token === undefined || response.error !== undefined) {
    fail(new FriendlyError("Google didn't allow QuizRush to read the class list."), response.error_description ?? response.error ?? 'no token')
    return
  }
  accessToken = response.access_token
  expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000
  pending?.resolve(accessToken)
  pending = null
}

function fail(error: Error, detail: string): void {
  console.warn('Google sign-in failed:', detail)
  pending?.reject(error)
  pending = null
}
