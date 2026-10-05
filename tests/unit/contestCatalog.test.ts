import { describe, expect, it } from 'vitest'
import { buildContestCatalog, slugFromPath, type ContestFile } from '../../src/utils/contestCatalog'
import { makeContest } from './helpers'

const shippedContestTexts: Record<string, string> = import.meta.glob('../../public/contests/*.json', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function contestFile(name: string, slug: string, title: string): ContestFile {
  return { name, text: JSON.stringify({ ...makeContest(1, false), slug, title }) }
}

function errorsFor(files: ContestFile[]): string[] {
  const result = buildContestCatalog(files)
  return result.ok ? [] : result.errors
}

describe('buildContestCatalog', () => {
  it('accepts every shipped quiz in public/contests', () => {
    const files = Object.entries(shippedContestTexts).map(([path, text]) => ({ name: path, text }))
    const result = buildContestCatalog(files)
    expect(result).toMatchObject({ ok: true })
  })

  it('lists slug, title and file only, sorted by title', () => {
    const result = buildContestCatalog([contestFile('b.json', 'zebra', 'Zebras'), contestFile('a.json', 'apple', 'Apples')])
    expect(result).toEqual({
      ok: true,
      entries: [
        { slug: 'apple', title: 'Apples', file: 'a.json' },
        { slug: 'zebra', title: 'Zebras', file: 'b.json' },
      ],
    })
  })

  it('accepts a quiz with a single question', () => {
    expect(buildContestCatalog([contestFile('one.json', 'one', 'One')]).ok).toBe(true)
  })

  it('rejects an empty list', () => {
    expect(errorsFor([])).toEqual(['There are no quiz files.'])
  })

  it('rejects a duplicate slug and names both files', () => {
    const errors = errorsFor([contestFile('a.json', 'same', 'A'), contestFile('b.json', 'same', 'B')])
    expect(errors).toEqual(['b.json: slug "same" is already used by a.json.'])
  })

  it('prefixes validation errors with the file name', () => {
    const errors = errorsFor([contestFile('bad.json', 'Bad Slug', 'Bad')])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/^bad\.json: slug must/)
  })

  it('reports a file that is not JSON', () => {
    const errors = errorsFor([{ name: 'broken.json', text: '{ "title": ' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/^broken\.json: not valid JSON/)
  })

  it('reports problems from every file together', () => {
    const errors = errorsFor([
      { name: 'broken.json', text: 'nope' },
      contestFile('good.json', 'good', 'Good'),
      contestFile('bad.json', 'assets', 'Bad'),
    ])
    expect(errors).toHaveLength(2)
  })
})

describe('slugFromPath', () => {
  it.each([
    ['/', '/', ''],
    ['/index.html', '/', ''],
    ['/present-perfect/', '/', 'present-perfect'],
    ['/present-perfect', '/', 'present-perfect'],
    ['/present-perfect/index.html', '/', 'present-perfect'],
    ['/a/b/', '/', 'a/b'],
    ['/quizrush/', '/quizrush/', ''],
    ['/quizrush/present-perfect/', '/quizrush/', 'present-perfect'],
  ])('reads %s with base %s as "%s"', (pathname, base, expected) => {
    expect(slugFromPath(pathname, base)).toBe(expected)
  })
})
