import { MAX_EMOJI_LENGTH } from '../config'
import type { RosterEntry } from '../types/game'
import { buildRoster, isPhotoUrl } from './roster'
import { normalizeTeamName } from './setupRules'

// QuestRush owns this spreadsheet: same tab and header names as its sheetRules.ts TABLES.
export const CLASSES_TAB: string = 'classrooms'
export const STUDENTS_TAB: string = 'students'

export interface ClassChoice {
  slug: string
  name: string
}

// Numeric, so "Year 9" comes before "Year 10".
const NAME_ORDER: Intl.Collator = new Intl.Collator(undefined, { numeric: true })

function isValidEmoji(value: string): boolean {
  return value !== '' && [...value].length <= MAX_EMOJI_LENGTH && !/[\s\p{Cc}]/u.test(value)
}

function cellText(row: readonly unknown[], index: number): string {
  const cell = row[index]
  return cell === null || cell === undefined ? '' : String(cell).trim()
}

function headerOf(values: readonly unknown[][]): string[] {
  return (values[0] ?? []).map((cell) => String(cell).trim())
}

function columnIndexes<T extends string>(tab: string, header: readonly string[], required: readonly T[]): Record<T, number> {
  const indexes = {} as Record<T, number>
  for (const column of required) {
    const index = header.indexOf(column)
    if (index < 0) {
      throw new Error(`The "${tab}" tab has no "${column}" column in its first row (found: ${header.join(', ')}).`)
    }
    indexes[column] = index
  }
  return indexes
}

export function parseClasses(values: readonly unknown[][]): ClassChoice[] {
  const columns = columnIndexes(CLASSES_TAB, headerOf(values), ['slug', 'name'])
  return values
    .slice(1)
    .map((row) => {
      const slug = cellText(row, columns.slug)
      return { slug, name: normalizeTeamName(cellText(row, columns.name)) || slug }
    })
    .filter((choice) => choice.slug !== '')
    .sort((a, b) => NAME_ORDER.compare(a.name, b.name))
}

// The class's students top to bottom as the rows stand in the sheet; rows without a name are skipped.
export function parseClassRoster(values: readonly unknown[][], classSlug: string): RosterEntry[] {
  const header = headerOf(values)
  const columns = columnIndexes(STUDENTS_TAB, header, ['classroom_slug', 'name', 'emoji'])
  const photoIndex = header.indexOf('photo')
  const students = values
    .slice(1)
    .filter((row) => cellText(row, columns.classroom_slug) === classSlug)
    .map((row) => ({
      name: normalizeTeamName(cellText(row, columns.name)),
      emoji: cellText(row, columns.emoji),
      photo: photoIndex < 0 ? '' : cellText(row, photoIndex),
    }))
    .filter((student) => student.name !== '')
  const roster = buildRoster(
    students.map((student) => student.name),
    students.map((student) => (isValidEmoji(student.emoji) ? student.emoji : null)),
  )
  return roster.map((entry, index) => {
    const photo = students[index]?.photo ?? ''
    return isPhotoUrl(photo) ? { ...entry, photo } : entry
  })
}
