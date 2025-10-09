import fs from 'node:fs'
import path from 'node:path'
import type { ResolvedOptions } from '../options'
import type { Plugin } from 'rolldown'

/**
 * Fix require.resolve calls to use the correct base path.
 * Replace __require.resolve("./relative") with proper resolution from original file location.
 */
export function createRequireResolveFix(options: ResolvedOptions): Plugin {
  return {
    name: 'unrun-require-resolve-fix',
    generateBundle: {
      handler(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk') {
            chunk.code = chunk.code.replaceAll(
              /__require\.resolve\(["']([^"']+)["']\)/g,
              (match, id) => {
                // Only handle relative paths
                if (id.startsWith('./') || id.startsWith('../')) {
                  try {
                    const baseDir = path.dirname(options.path)
                    // Try to resolve the actual file with extensions
                    const possibleExtensions = [
                      '',
                      '.ts',
                      '.js',
                      '.mts',
                      '.mjs',
                      '.cts',
                      '.cjs',
                    ]
                    for (const ext of possibleExtensions) {
                      const testPath = path.resolve(baseDir, id + ext)
                      if (fs.existsSync(testPath)) {
                        return JSON.stringify(testPath)
                      }
                    }
                    // Fallback to basic resolution
                    const resolvedPath = path.resolve(baseDir, id)
                    return JSON.stringify(resolvedPath)
                  } catch {
                    return match
                  }
                }
                return match
              },
            )
          }
        }
      },
    },
  }
}
