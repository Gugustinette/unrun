import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Plugin } from 'rolldown'

/**
 * A rolldown plugin that injects source context shims:
 * - Replaces import.meta.resolve calls with resolved file URLs
 * - Injects per-module __filename/__dirname
 * - Replaces import.meta.url with the source file URL
 */
export function createSourceContextShimsPlugin(): Plugin {
  return {
    name: 'unrun-source-context-shims',
    load: {
      filter: {
        id: /\.(?:m?[jt]s|c?tsx?)(?:$|\?)/,
      },
      handler(id: string) {
        // Read the original source code
        let code: string
        try {
          code = fs.readFileSync(id, 'utf8')
        } catch {
          return null
        }

        // Flag to track if we modified the code
        let __MODIFIED_CODE__ = false

        // Replace import.meta.resolve calls with resolved file URLs
        if (code.includes('import.meta.resolve')) {
          const re = /import\.meta\.resolve!?\s*\(\s*(["'])([^"']+)\1\s*\)/g
          const replaced = code.replaceAll(re, (_m, _q, spec) => {
            const abs = path.resolve(path.dirname(id), spec)
            const url = pathToFileURL(abs).href
            return JSON.stringify(url)
          })
          if (replaced !== code) {
            code = replaced
            __MODIFIED_CODE__ = true
          }
        }

        // Check if there are any source path constants to inject
        if (/__filename|__dirname|import\s*\.\s*meta\s*\.\s*url/.test(code)) {
          const file = id
          const dir = path.dirname(id)
          const url = pathToFileURL(id).href

          const prologue =
            `const __filename = ${JSON.stringify(file)}\n` +
            `const __dirname = ${JSON.stringify(dir)}\n`

          // Protect object literal keys like "import.meta.url": to avoid replacing inside keys
          const protectedStrings: string[] = []
          let protectedCode = code.replaceAll(
            /(["'])[^"']*import\s*\.\s*meta\s*\.\s*url[^"']*\1\s*:/g,
            (match) => {
              const placeholder = `__PROTECTED_STRING_${protectedStrings.length}__`
              protectedStrings.push(match)
              return placeholder
            },
          )

          // Replace bare import.meta.url occurrences
          protectedCode = protectedCode.replaceAll(
            /\bimport\s*\.\s*meta\s*\.\s*url\b/g,
            JSON.stringify(url),
          )

          // Restore protected strings
          for (const [i, protectedString] of protectedStrings.entries()) {
            protectedCode = protectedCode.replace(
              `__PROTECTED_STRING_${i}__`,
              protectedString,
            )
          }

          // Prepend the prologue to the modified code
          code = prologue + protectedCode
          // Flag that we modified the code
          __MODIFIED_CODE__ = true
        }

        // If code was modified, return the new code
        // Else, return null to indicate no changes
        return __MODIFIED_CODE__ ? { code } : null
      },
    },
  }
}
