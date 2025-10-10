import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Plugin } from 'rolldown'

/**
 * A rolldown plugin that injects source context shims:
 * - Injects per-module __filename/__dirname and replaces import.meta.url with the source file URL
 * - Inlines import.meta.resolve("./foo") with a file:// URL when the argument is a string literal
 */
export function createSourceContextShimsPlugin(): Plugin {
  return {
    name: 'unrun-source-context-shims',
    load: {
      filter: {
        id: /\.(?:m?[jt]s|c?tsx?)(?:$|\?)/,
      },
      handler(id: string) {
        let original: string
        try {
          original = fs.readFileSync(id, 'utf8')
        } catch {
          return null
        }

        let code = original
        let touched = false

        // 1) Inline import.meta.resolve("./foo") when literal
        if (code.includes('import.meta.resolve')) {
          const re = /import\.meta\.resolve!?\s*\(\s*(["'])([^"']+)\1\s*\)/g
          const replaced = code.replaceAll(re, (_m, _q, spec) => {
            const abs = path.resolve(path.dirname(id), spec)
            const url = pathToFileURL(abs).href
            return JSON.stringify(url)
          })
          if (replaced !== code) {
            code = replaced
            touched = true
          }
        }

        // 2) Inject __filename/__dirname and replace import.meta.url
        const needsSourcePathConstants =
          /__filename|__dirname|import\s*\.\s*meta\s*\.\s*url/.test(original)

        if (needsSourcePathConstants) {
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

          code = prologue + protectedCode
          touched = true
        }

        return touched ? { code } : null
      },
    },
  }
}
