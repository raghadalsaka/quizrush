import { describe, expect, it } from 'vitest'
import { EMOJI_POOL } from '../../src/config'
import { parseClassRoster, parseClasses } from '../../src/utils/classSheet'

const PHOTO: string = 'data:image/jpeg;base64,QUJD'
const STUDENTS_HEADER: string[] = ['id', 'classroom_slug', 'name', 'emoji', 'position', 'created_at', 'photo']

function student(classSlug: string, name: string, emoji: string, position: string, photo?: string): string[] {
  const row = [`id-${name}`, classSlug, name, emoji, position, '2026-11-01T08:00:00Z']
  return photo === undefined ? row : [...row, photo]
}

describe('parseClassRoster', () => {
  it('returns only the picked class, top to bottom as the rows stand, ignoring the position column', () => {
    const values = [
      STUDENTS_HEADER,
      student('6a', 'Lina', '🦊', '3'),
      student('6b', 'Omar', '🐼', '1'),
      student('6a', 'Sami', '🐯', '1'),
      [],
      student('6b', 'Hana', '🦁', '2'),
      student('6a', 'Rami', '🐸', '2'),
    ]
    expect(parseClassRoster(values, '6a').map((entry) => entry.name)).toEqual(['Lina', 'Sami', 'Rami'])
    expect(parseClassRoster(values, '6b').map((entry) => entry.name)).toEqual(['Omar', 'Hana'])
  })

  it('skips rows without a name and tidies spaces in names', () => {
    const values = [STUDENTS_HEADER, student('6a', '  Lina   Saleh ', '🦊', '1'), student('6a', '   ', '🐼', '2')]
    expect(parseClassRoster(values, '6a')).toEqual([{ name: 'Lina Saleh', emoji: '🦊' }])
  })

  it('keeps a valid photo and falls back to the emoji when the photo is missing or not a small inline picture', () => {
    const values = [
      STUDENTS_HEADER,
      student('6a', 'Lina', '🦊', '1', PHOTO),
      student('6a', 'Sami', '🐯', '2'),
      student('6a', 'Rami', '🐸', '3', 'https://example.com/rami.jpg'),
      student('6a', 'Nour', '🐙', '4', 'data:image/svg+xml;base64,PHN2Zz4='),
    ]
    const roster = parseClassRoster(values, '6a')
    expect(roster[0]).toEqual({ name: 'Lina', emoji: '🦊', photo: PHOTO })
    expect(roster.slice(1)).toEqual([
      { name: 'Sami', emoji: '🐯' },
      { name: 'Rami', emoji: '🐸' },
      { name: 'Nour', emoji: '🐙' },
    ])
  })

  it('gives students without a usable emoji pool emojis nobody in the class has', () => {
    const first = EMOJI_POOL[0] as string
    const values = [STUDENTS_HEADER, student('6a', 'Lina', '', '1'), student('6a', 'Sami', first, '2'), student('6a', 'Rami', 'not an emoji', '3')]
    const roster = parseClassRoster(values, '6a')
    expect(roster.map((entry) => entry.emoji)).toEqual([EMOJI_POOL[1], first, EMOJI_POOL[2]])
  })

  it('reads a sheet made before the photo column existed', () => {
    const values = [STUDENTS_HEADER.slice(0, 6), student('6a', 'Lina', '🦊', '1')]
    expect(parseClassRoster(values, '6a')).toEqual([{ name: 'Lina', emoji: '🦊' }])
  })

  it('refuses a students tab whose first row lacks a needed column', () => {
    expect(() => parseClassRoster([['id', 'class', 'name', 'emoji']], '6a')).toThrow(/classroom_slug/)
  })
})

describe('parseClasses', () => {
  it('lists classes by name, numbers in order, with the slug standing in for a missing name', () => {
    const values = [
      ['slug', 'name', 'current_stage_slug', 'created_at'],
      ['year-10', 'Year 10'],
      ['year-9', 'Year 9'],
      ['unnamed', ''],
      ['', 'No slug'],
    ]
    expect(parseClasses(values)).toEqual([
      { slug: 'unnamed', name: 'unnamed' },
      { slug: 'year-9', name: 'Year 9' },
      { slug: 'year-10', name: 'Year 10' },
    ])
  })
})
