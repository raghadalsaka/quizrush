import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'
import { CONTESTS_DIR } from '../src/config.ts'
import type { CatalogEntry } from '../src/types/contest.ts'
import { buildContestCatalog } from '../src/utils/contestCatalog.ts'

const VIRTUAL_ID: string = 'virtual:contest-catalog'
const RESOLVED_ID: string = `\0${VIRTUAL_ID}`

// Lists public/contests/*.json as a virtual module and, since GitHub Pages has no rewrites,
// emits the built index.html as <slug>/index.html for every quiz and as 404.html for unknown paths.
export function contestCatalog(): Plugin {
  let contestsDir = ''
  let entries: CatalogEntry[] | undefined

  async function readCatalog(): Promise<CatalogEntry[]> {
    const names = (await readdir(contestsDir)).filter((name) => name.endsWith('.json')).sort()
    const files = await Promise.all(
      names.map(async (name) => ({ name, text: await readFile(path.join(contestsDir, name), 'utf8') })),
    )
    const result = buildContestCatalog(files)
    if (!result.ok) {
      throw new Error(`Invalid quiz files in ${contestsDir}:\n${result.errors.join('\n')}`)
    }
    return result.entries
  }

  return {
    name: 'quizrush:contest-catalog',
    configResolved(config) {
      contestsDir = path.resolve(config.publicDir, CONTESTS_DIR)
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    async load(id) {
      if (id !== RESOLVED_ID) {
        return undefined
      }
      entries = await readCatalog()
      return `export const contestCatalog = ${JSON.stringify(entries)}`
    },
    configureServer(server) {
      server.watcher.on('all', (_event, file) => {
        if (!file.endsWith('.json') || path.resolve(path.dirname(file)) !== contestsDir) {
          return
        }
        const catalogModule = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (catalogModule !== undefined) {
          server.moduleGraph.invalidateModule(catalogModule)
        }
        server.ws.send({ type: 'full-reload' })
      })
    },
    generateBundle: {
      order: 'post',
      async handler(_options, bundle) {
        const indexHtml = bundle['index.html']
        if (indexHtml?.type !== 'asset') {
          this.error('index.html is missing from the bundle.')
        }
        const quizPages = (entries ?? (await readCatalog())).map((entry) => `${entry.slug}/index.html`)
        for (const fileName of ['404.html', ...quizPages]) {
          this.emitFile({ type: 'asset', fileName, source: indexHtml.source })
        }
      },
    },
  }
}
