import { ref, type Ref } from 'vue'
import { currentToken, googleClientId, preloadGoogleSignIn, requestToken } from '../services/googleSignIn'
import { GoogleConnectionExpired, readSheetTab, rosterSpreadsheetId } from '../services/googleSheets'
import type { RosterEntry } from '../types/game'
import { CLASSES_TAB, parseClassRoster, parseClasses, STUDENTS_TAB, type ClassChoice } from '../utils/classSheet'
import { FriendlyError } from '../utils/errors'

export type RosterSource = 'typed' | 'google'

export type ClassRosterStatus = 'disconnected' | 'connecting' | 'loading-classes' | 'connected' | 'loading-class'

const LAYOUT_MESSAGE: string = "The class list isn't set up the way QuizRush expects. Check the spreadsheet and try again."

export interface ClassRosterDeps {
  isConfigured: () => boolean
  preload: () => Promise<void>
  token: () => string
  requestToken: () => Promise<string>
  readTab: (token: string, tab: string, signal?: AbortSignal) => Promise<unknown[][]>
}

const googleDeps: ClassRosterDeps = {
  isConfigured: () => googleClientId() !== '' && rosterSpreadsheetId() !== '',
  preload: preloadGoogleSignIn,
  token: currentToken,
  requestToken,
  readTab: readSheetTab,
}

export interface ClassRoster {
  isAvailable: boolean
  source: Ref<RosterSource>
  status: Ref<ClassRosterStatus>
  message: Ref<string>
  classes: Ref<ClassChoice[]>
  selectedSlug: Ref<string>
  roster: Ref<RosterEntry[] | null>
  typedRoster: Ref<RosterEntry[] | null>
  preload: () => void
  connect: () => Promise<void>
  pickClass: (slug: string) => Promise<void>
}

function friendlyMessage(error: unknown): string {
  if (error instanceof FriendlyError) {
    return error.message
  }
  console.error('The class spreadsheet could not be read', error)
  return LAYOUT_MESSAGE
}

// Lives as long as the quiz page, so New Game comes back to the same connection and class.
export function useClassRoster(deps: ClassRosterDeps = googleDeps): ClassRoster {
  const isAvailable = deps.isConfigured()
  const source = ref<RosterSource>(isAvailable ? 'google' : 'typed')
  const status = ref<ClassRosterStatus>('disconnected')
  const message = ref('')
  const classes = ref<ClassChoice[]>([])
  const selectedSlug = ref('')
  const roster = ref<RosterEntry[] | null>(null)
  // The typed list survives a Google game, which replaces the last Individual Players setup.
  const typedRoster = ref<RosterEntry[] | null>(null)
  // A newer pick cancels the earlier download, so a late answer never replaces the class on screen.
  let classLoad: AbortController | null = null

  function preload(): void {
    void deps.preload().catch((error: unknown) => {
      message.value = friendlyMessage(error)
    })
  }

  async function connect(): Promise<void> {
    if (status.value === 'connecting' || status.value === 'loading-classes') {
      return
    }
    status.value = 'connecting'
    message.value = ''
    try {
      const token = await deps.requestToken()
      status.value = 'loading-classes'
      classes.value = parseClasses(await deps.readTab(token, CLASSES_TAB))
      status.value = 'connected'
      if (classes.value.length === 0) {
        message.value = 'The spreadsheet has no classes yet.'
      }
    } catch (error) {
      status.value = 'disconnected'
      message.value = friendlyMessage(error)
    }
  }

  async function pickClass(slug: string): Promise<void> {
    if (status.value !== 'connected' && status.value !== 'loading-class') {
      return
    }
    classLoad?.abort()
    classLoad = null
    selectedSlug.value = slug
    roster.value = null
    message.value = ''
    if (slug === '') {
      status.value = 'connected'
      return
    }
    const load = new AbortController()
    classLoad = load
    status.value = 'loading-class'
    try {
      const token = deps.token()
      if (token === '') {
        throw new GoogleConnectionExpired()
      }
      const values = await deps.readTab(token, STUDENTS_TAB, load.signal)
      if (load.signal.aborted) {
        return
      }
      roster.value = parseClassRoster(values, slug)
      status.value = 'connected'
    } catch (error) {
      if (load.signal.aborted) {
        return
      }
      status.value = error instanceof GoogleConnectionExpired ? 'disconnected' : 'connected'
      message.value = friendlyMessage(error)
    }
  }

  return {
    isAvailable,
    source,
    status,
    message,
    classes,
    selectedSlug,
    roster,
    typedRoster,
    preload,
    connect,
    pickClass,
  }
}
