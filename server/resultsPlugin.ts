import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { resultsMiddleware } from './results.ts'

export function resultsPlugin(): Plugin {
  let directory: string
  return {
    name: 'experiment-results',
    config() {
      return { server: { watch: { ignored: ['**/results/**'] } } }
    },
    configResolved(config) {
      directory = resolve(config.root, 'results')
    },
    configureServer(server) {
      server.middlewares.use(resultsMiddleware(directory))
    },
    configurePreviewServer(server) {
      server.middlewares.use(resultsMiddleware(directory))
    },
  }
}
