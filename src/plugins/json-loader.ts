import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { Plugin } from 'rolldown'

/**
 * JSON loader exporting default + named exports for identifier-like keys.
 *
 * Why:
 * - jiti allows importing JSON and using both default and certain named exports.
 *
 * How:
 * - Resolve *.json to a virtual id, then load and emit an ESM module that:
 *   - Exports default the raw parsed value
 *   - Creates named exports for top-level keys that are valid identifiers
 */
export function createJsonLoader(): Plugin {
  return {
    name: 'unrun-json',
    resolveId(source, importer) {
      if (source && source.endsWith('.json')) {
        const resolved = path.isAbsolute(source)
          ? source
          : path.resolve(
              importer ? path.dirname(importer) : process.cwd(),
              source,
            )
        return `\0unrun-json:${resolved}.mjs`
      }
      return null
    },
    load(id) {
      const prefix = '\0unrun-json:'
      if (!id.startsWith(prefix)) return null
      const realId = id.slice(prefix.length).replace(/\.mjs$/, '')
      try {
        const raw = fs.readFileSync(realId, 'utf8')
        // Preserve formatting by embedding raw text, but also try to create named exports
        let parsed: any
        try {
          parsed = JSON.parse(raw)
        } catch {
          parsed = undefined
        }
        let code = ''
        code += `const __json = ${raw}\n`
        code += `export default __json\n`
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          for (const key of Object.keys(parsed)) {
            if (/^[\w$]+$/.test(key)) {
              code += `export const ${key} = __json[${JSON.stringify(key)}]\n`
            }
          }
        }
        return { code }
      } catch {
        return null
      }
    },
  }
}
