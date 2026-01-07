import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Plugin } from 'rolldown'

/**
 * A rolldown plugin that injects source context shims:
 * - Replaces import.meta.resolve calls with resolved file URLs
 * - Injects per-module __filename/__dirname
 * - Replaces import.meta.url with the source file URL
 * - Replaces import.meta.dirname/import.meta.filename with source paths
 */
export function createSourceContextShimsPlugin(): Plugin {
  return {
    name: 'unrun-source-context-shims',
    load: {
      filter: {
        id: /\.(?:m?[jt]s|c?tsx?)(?:$|\?)/,
      },
      handler(id: string) {
        const physicalId = id.split('?')[0].split('#')[0]
        const normalizedPhysicalId = path.normalize(physicalId)

        // Read the original source code
        let code: string
        try {
          code = fs.readFileSync(normalizedPhysicalId, 'utf8')
        } catch {
          return null
        }

        const normalizedId = normalizedPhysicalId.replaceAll('\\', '/')
        // Skip files inside node_modules
        if (normalizedId.includes('/node_modules/')) {
          return null
        }

        const file = normalizedPhysicalId
        const dir = path.dirname(normalizedPhysicalId)
        const url = pathToFileURL(normalizedPhysicalId).href

        const hasImportMeta = code.includes('import.meta')

        // Detect whether the module references these globals and whether it defines them itself
        const usesFilename = /\b__filename\b/.test(code)
        const declaresFilename = /\b(?:const|let|var)\s+__filename\b/.test(code)
        const usesDirname = /\b__dirname\b/.test(code)
        const declaresDirname = /\b(?:const|let|var)\s+__dirname\b/.test(code)

        const needsFilenameShim = usesFilename && !declaresFilename
        const needsDirnameShim = usesDirname && !declaresDirname

        if (needsFilenameShim || needsDirnameShim || hasImportMeta) {
          const prologueLines: string[] = []
          if (needsFilenameShim) {
            prologueLines.push(`const __filename = ${JSON.stringify(file)}`)
          }
          if (needsDirnameShim) {
            prologueLines.push(`const __dirname = ${JSON.stringify(dir)}`)
          }

          let transformedCode = code
          let replacedImportMeta = false

          if (hasImportMeta) {
            const resolveRe =
              /import\s*\.\s*meta\s*\.\s*resolve!?\s*\(\s*(["'])([^"']+)\1\s*\)/y
            const urlRe = /import\s*\.\s*meta\s*\.\s*url\b/y
            const dirnameRe = /import\s*\.\s*meta\s*\.\s*dirname\b/y
            const filenameRe = /import\s*\.\s*meta\s*\.\s*filename\b/y

            type Mode =
              | 'normal'
              | 'single'
              | 'double'
              | 'template'
              | 'templateExpr'
              | 'lineComment'
              | 'blockComment'

            let out = ''
            let mode: Mode = 'normal'
            const modeStack: Mode[] = []
            let templateExprBraceDepth = 0

            const popMode = () => {
              mode = modeStack.pop() ?? 'normal'
            }

            for (let i = 0; i < transformedCode.length; ) {
              const ch = transformedCode[i]
              const next = transformedCode[i + 1]

              if (mode === 'lineComment') {
                out += ch
                i += 1
                if (ch === '\n') {
                  popMode()
                }
                continue
              }

              if (mode === 'blockComment') {
                out += ch
                i += 1
                if (ch === '*' && next === '/') {
                  out += '/'
                  i += 1
                  popMode()
                }
                continue
              }

              if (mode === 'single') {
                out += ch
                i += 1
                if (ch === '\\') {
                  out += transformedCode[i] ?? ''
                  i += 1
                  continue
                }
                if (ch === "'") {
                  popMode()
                }
                continue
              }

              if (mode === 'double') {
                out += ch
                i += 1
                if (ch === '\\') {
                  out += transformedCode[i] ?? ''
                  i += 1
                  continue
                }
                if (ch === '"') {
                  popMode()
                }
                continue
              }

              if (mode === 'template') {
                out += ch
                i += 1
                if (ch === '\\') {
                  out += transformedCode[i] ?? ''
                  i += 1
                  continue
                }
                if (ch === '`') {
                  popMode()
                  continue
                }
                if (ch === '$' && next === '{') {
                  out += '{'
                  i += 1
                  modeStack.push(mode)
                  mode = 'templateExpr'
                  templateExprBraceDepth = 1
                }
                continue
              }

              if (mode === 'templateExpr') {
                if (ch === '{') {
                  templateExprBraceDepth += 1
                } else if (ch === '}') {
                  templateExprBraceDepth -= 1
                  if (templateExprBraceDepth === 0) {
                    out += ch
                    i += 1
                    popMode()
                    continue
                  }
                }
              }

              // normal or templateExpr modes
              if (ch === '/' && next === '/') {
                out += '//'
                i += 2
                modeStack.push(mode)
                mode = 'lineComment'
                continue
              }
              if (ch === '/' && next === '*') {
                out += '/*'
                i += 2
                modeStack.push(mode)
                mode = 'blockComment'
                continue
              }
              if (ch === "'") {
                out += ch
                i += 1
                modeStack.push(mode)
                mode = 'single'
                continue
              }
              if (ch === '"') {
                out += ch
                i += 1
                modeStack.push(mode)
                mode = 'double'
                continue
              }
              if (ch === '`') {
                out += ch
                i += 1
                modeStack.push(mode)
                mode = 'template'
                continue
              }

              resolveRe.lastIndex = i
              const resolveMatch = resolveRe.exec(transformedCode)
              if (resolveMatch) {
                const spec = resolveMatch[2]
                const abs = path.resolve(
                  path.dirname(normalizedPhysicalId),
                  spec,
                )
                const resolvedUrl = pathToFileURL(abs).href
                out += JSON.stringify(resolvedUrl)
                i = resolveRe.lastIndex
                replacedImportMeta = true
                continue
              }

              urlRe.lastIndex = i
              if (urlRe.test(transformedCode)) {
                out += JSON.stringify(url)
                i = urlRe.lastIndex
                replacedImportMeta = true
                continue
              }

              dirnameRe.lastIndex = i
              if (dirnameRe.test(transformedCode)) {
                out += JSON.stringify(dir)
                i = dirnameRe.lastIndex
                replacedImportMeta = true
                continue
              }

              filenameRe.lastIndex = i
              if (filenameRe.test(transformedCode)) {
                out += JSON.stringify(file)
                i = filenameRe.lastIndex
                replacedImportMeta = true
                continue
              }

              out += ch
              i += 1
            }

            if (replacedImportMeta) {
              transformedCode = out
            }
          }

          if (prologueLines.length > 0) {
            // Inject generated __filename/__dirname definitions
            transformedCode = `${prologueLines.join('\n')}\n${transformedCode}`
          }

          if (transformedCode !== code) {
            return { code: transformedCode }
          }
        }

        // If code was modified, return the new code
        // Else, return null to indicate no changes
        return null
      },
    },
  }
}
