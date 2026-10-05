import { CONTESTS_DIR } from '../config'
import type { ContestLoadResult } from '../types/contest'
import { describeError } from '../utils/errors'
import { validateContest } from '../utils/validateContest'

export async function loadContest(file: string): Promise<ContestLoadResult> {
  const url = `${import.meta.env.BASE_URL}${CONTESTS_DIR}/${file}`
  let response: Response
  try {
    // no-cache revalidates with the server, so an edited quiz file is not hidden behind a CDN or browser cache.
    response = await fetch(url, { cache: 'no-cache' })
  } catch (error) {
    return { ok: false, errors: [`Could not reach ${url}. Check the connection and try again. (${describeError(error)})`] }
  }
  if (!response.ok) {
    return { ok: false, errors: [`Loading ${url} failed with HTTP ${response.status} ${response.statusText}.`.trim()] }
  }
  let data: unknown
  try {
    data = JSON.parse(await response.text())
  } catch (error) {
    return { ok: false, errors: [`${file} is not valid JSON: ${describeError(error)}`] }
  }
  return validateContest(data)
}
