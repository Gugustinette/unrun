import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Plugin } from 'rolldown'

// Very small transform to replace import.meta.resolve("./foo") with a file URL at build time
export function createImportMetaResolveShim(): Plugin {
  return {
    name: 'unrun-import-meta-resolve-shim',
    load: {
      filter: { id: /\.[mc]?[jt]s(x)?($|\?)/ },
      handler(id: string) {
        let code: string
        try {
          code = fs.readFileSync(id, 'utf8')
        } catch {
          return null
        }

        if (!code.includes('import.meta.resolve')) return null

        // Replace only string literal invocations: import.meta.resolve("..."|\'...\')
        // Support optional non-null assertion like import.meta.resolve!("./foo")
        const re = /import\.meta\.resolve!?\s*\(\s*(["'])([^"']+)\1\s*\)/g
        const replaced = code.replaceAll(re, (_m, _q, spec) => {
          // Resolve relative to current file
          const abs = path.resolve(path.dirname(id), spec)
          // Emit a true file:// URL to match jiti output prior to normalization
          const url = pathToFileURL(abs).href
          return JSON.stringify(url)
        })

        if (replaced === code) return null
        return { code: replaced }
      },
    },
  }
}
