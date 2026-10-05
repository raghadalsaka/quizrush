import type { CatalogEntry } from '../types/contest.ts'
import { describeError } from './errors.ts'
import { validateContest } from './validateContest.ts'

export interface ContestFile {
  name: string
  text: string
}

export type CatalogResult = { ok: true; entries: CatalogEntry[] } | { ok: false; errors: string[] }

export function buildContestCatalog(files: readonly ContestFile[]): CatalogResult {
  if (files.length === 0) {
    return { ok: false, errors: ['There are no quiz files.'] }
  }
  const errors: string[] = []
  const entries: CatalogEntry[] = []
  for (const file of files) {
    let data: unknown
    try {
      data = JSON.parse(file.text)
    } catch (error) {
      errors.push(`${file.name}: not valid JSON: ${describeError(error)}`)
      continue
    }
    const result = validateContest(data)
    if (!result.ok) {
      errors.push(...result.errors.map((error) => `${file.name}: ${error}`))
      continue
    }
    const { slug, title } = result.contest
    const earlier = entries.find((entry) => entry.slug === slug)
    if (earlier !== undefined) {
      errors.push(`${file.name}: slug "${slug}" is already used by ${earlier.file}.`)
      continue
    }
    entries.push({ slug, title, file: file.name })
  }
  if (errors.length > 0) {
    return { ok: false, errors }
  }
  entries.sort((a, b) => a.title.localeCompare(b.title, 'en') || a.slug.localeCompare(b.slug, 'en'))
  return { ok: true, entries }
}

// Returns '' for the home page; anything else is a slug to look up, which may not exist.
export function slugFromPath(pathname: string, base: string): string {
  return pathname.slice(base.length).replace(/(?:^|\/)index\.html$/, '').replace(/\/$/, '')
}
