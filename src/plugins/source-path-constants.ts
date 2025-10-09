import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Plugin } from 'rolldown'

/**
 * Replace per-module __filename/__dirname/import.meta.url with the source file values.
 * Mirrors bundle-require behavior.
 */
export function createSourcePathConstantsPlugin(): Plugin {
  return {
    name: 'unrun-source-path-constants',
    load: {
      filter: {
        id: /\.(?:m?[jt]s|c?tsx?)(?:$|\?)/,
      },
      handler(id: string) {
        try {
          let code = fs.readFileSync(id, 'utf8')

          // Only process files that reference the tokens
          if (
            !/__filename|__dirname|import\s*\.\s*meta\s*\.\s*url/.test(code)
          ) {
            return null
          }

          const file = id
          const dir = path.dirname(id)
          const url = pathToFileURL(id).href

          // Prepare prologue with consts to avoid string replace collisions for __filename/__dirname
          const prologue =
            `const __filename = ${JSON.stringify(file)}\n` +
            `const __dirname = ${JSON.stringify(dir)}\n`

          // Replace import.meta.url occurrences
          // First, temporarily protect string property keys containing import.meta.url
          const protectedStrings: string[] = []
          let protectedCode = code.replaceAll(
            /(["'])[^"']*import\s*\.\s*meta\s*\.\s*url[^"']*\1\s*:/g,
            (match) => {
              const placeholder = `__PROTECTED_STRING_${protectedStrings.length}__`
              protectedStrings.push(match)
              return placeholder
            },
          )

          // Now safely replace import.meta.url in the protected code
          protectedCode = protectedCode.replaceAll(
            /\bimport\s*\.\s*meta\s*\.\s*url\b/g,
            JSON.stringify(url),
          )

          // Restore the protected strings
          for (const [i, protectedString] of protectedStrings.entries()) {
            protectedCode = protectedCode.replace(
              `__PROTECTED_STRING_${i}__`,
              protectedString,
            )
          }

          code = protectedCode

          return { code: prologue + code }
        } catch {
          return null
        }
      },
    },
  }
}
