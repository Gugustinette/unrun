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

        const normalizedId = id.replaceAll('\\', '/')
        // Skip files inside node_modules
        if (normalizedId.includes('/node_modules/')) {
          return null
        }

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

        // Detect whether the module references these globals and whether it defines them itself
        const usesFilename = /\b__filename\b/.test(code)
        const declaresFilename = /\b(?:const|let|var)\s+__filename\b/.test(code)
        const usesDirname = /\b__dirname\b/.test(code)
        const declaresDirname = /\b(?:const|let|var)\s+__dirname\b/.test(code)
        const hasImportMetaUrl = /\bimport\s*\.\s*meta\s*\.\s*url\b/.test(code)

        const needsFilenameShim = usesFilename && !declaresFilename
        const needsDirnameShim = usesDirname && !declaresDirname

        if (needsFilenameShim || needsDirnameShim || hasImportMetaUrl) {
          const file = id
          const dir = path.dirname(id)
          const url = pathToFileURL(id).href

          const prologueLines: string[] = []
          if (needsFilenameShim) {
            prologueLines.push(`const __filename = ${JSON.stringify(file)}`)
          }
          if (needsDirnameShim) {
            prologueLines.push(`const __dirname = ${JSON.stringify(dir)}`)
          }

          let transformedCode = code

          if (hasImportMetaUrl) {
            // Protect object literal keys like "import.meta.url": to avoid replacing inside keys
            const protectedStrings: string[] = []
            transformedCode = transformedCode.replaceAll(
              /(["'])[^"']*import\s*\.\s*meta\s*\.\s*url[^"']*\1\s*:/g,
              (match) => {
                const placeholder = `__PROTECTED_STRING_${protectedStrings.length}__`
                protectedStrings.push(match)
                return placeholder
              },
            )

            // Replace bare import.meta.url occurrences
            transformedCode = transformedCode.replaceAll(
              /\bimport\s*\.\s*meta\s*\.\s*url\b/g,
              JSON.stringify(url),
            )

            // Restore protected strings
            for (const [i, protectedString] of protectedStrings.entries()) {
              transformedCode = transformedCode.replace(
                `__PROTECTED_STRING_${i}__`,
                protectedString,
              )
            }
          }

          if (prologueLines.length > 0) {
            // Inject generated __filename/__dirname definitions
            transformedCode = `${prologueLines.join('\n')}\n${transformedCode}`
          }

          if (transformedCode !== code) {
            code = transformedCode
            __MODIFIED_CODE__ = true
          }
        }

        // If code was modified, return the new code
        // Else, return null to indicate no changes
        return __MODIFIED_CODE__ ? { code } : null
      },
    },
  }
}
