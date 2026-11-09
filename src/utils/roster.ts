import { EMOJI_POOL, MAX_PHOTO_LENGTH } from '../config'
import type { RosterEntry } from '../types/game'
import { normalizeTeamName } from './setupRules'

// Only small inline pictures: never a link to elsewhere, and never SVG, which can carry script.
const PHOTO_URL_PATTERN: RegExp = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/

export function isPhotoUrl(value: string): boolean {
  return value.length <= MAX_PHOTO_LENGTH && PHOTO_URL_PATTERN.test(value)
}

export function parseRosterNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(normalizeTeamName)
    .filter((name) => name.length > 0)
}

// Entries without a chosen emoji get pool emojis nobody chose, in pool order, so defaults never copy a pick.
export function fillDefaultEmojis(chosen: readonly (string | null)[]): string[] {
  const taken = new Set(chosen.filter((emoji): emoji is string => emoji !== null))
  const fresh = EMOJI_POOL.filter((emoji) => !taken.has(emoji))
  const order = fresh.length > 0 ? fresh : EMOJI_POOL
  let next = 0
  return chosen.map((emoji) => {
    if (emoji !== null) {
      return emoji
    }
    const filled = order[next % order.length] as string
    next += 1
    return filled
  })
}

export function buildRoster(names: readonly string[], picks: readonly (string | null)[]): RosterEntry[] {
  const emojis = fillDefaultEmojis(names.map((_, index) => picks[index] ?? null))
  return names.map((name, index) => ({ name, emoji: emojis[index] ?? '' }))
}
