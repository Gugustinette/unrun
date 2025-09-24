import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { Plugin } from 'rolldown'

/**
 * TS extension aliasing: allow importing TS files via JS extensions (.js->.ts, .mjs->.mts, .cjs->.cts).
 *
 * Why:
 * - jiti resolves TS sources even when the import uses JS extensions.
 *
 * How:
 * - In resolveId, map the extension when the candidate file exists on disk.
 */
export function createTsExtensionAlias(): Plugin {
  return {
    name: 'unrun-ts-extension-alias',
    resolveId(source, importer) {
      if (!source) return null
      const tryMap = (from: string, to: string): string | null => {
        if (source.endsWith(from)) {
          const base = source.slice(0, -from.length)
          const candidate = base + to
          const abs = path.isAbsolute(candidate)
            ? candidate
            : path.resolve(
                importer ? path.dirname(importer) : process.cwd(),
                candidate,
              )
          if (fs.existsSync(abs)) return abs
        }
        return null
      }
      return (
        tryMap('.js', '.ts') || tryMap('.mjs', '.mts') || tryMap('.cjs', '.cts')
      )
    },
  }
}
