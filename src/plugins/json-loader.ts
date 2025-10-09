import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { Plugin } from 'rolldown'

/**
 * Minimal JSON loader to mimic jiti/Node behavior expected by tests:
 * - Default export is the parsed JSON object
 * - Also add a self-reference `default` property on the object (so obj.default === obj)
 * - Provide named exports for top-level properties
 */
export function createJsonLoader(): Plugin {
  return {
    name: 'unrun-json-loader',
    resolveId: {
      handler(source: string, importer: string | undefined) {
        if (!source.endsWith('.json')) return null
        const basedir = importer ? path.dirname(importer) : process.cwd()
        const resolved = path.resolve(basedir, source)
        // Heuristic: if importer text contains require("<source>") we emit a CJS-flavored
        // virtual module so require() returns the plain object (no default key).
        let isRequire = false
        try {
          if (importer) {
            const src = fs.readFileSync(importer, 'utf8')
            // Escape regex metacharacters in the literal source string
            const escapeRe = /[.*+?^${}()|[\]\\]/g
            const escaped = source.replaceAll(escapeRe, (m) => `\\${m}`)
            const pattern = String.raw`\brequire\s*\(\s*['"]${escaped}['"]\s*\)`
            const re = new RegExp(pattern)
            isRequire = re.test(src)
          }
        } catch {}
        // Force a JS module parse by rewriting extension with a query and suffix
        return { id: `${resolved}?unrun-json.${isRequire ? 'cjs' : 'mjs'}` }
      },
    },
    load: {
      // Only handle our virtual ids
      filter: { id: /\?unrun-json\.(?:mjs|cjs)$/ },
      handler(id: string) {
        try {
          const realId = id.replace(/\?unrun-json\.(?:mjs|cjs)$/, '')
          const src = fs.readFileSync(realId, 'utf8')
          // Parse once to validate and to generate named exports
          const data = JSON.parse(src)

          const jsonLiteral = JSON.stringify(data)
          const isCjs = id.endsWith('?unrun-json.cjs')

          if (isCjs) {
            // Emit CommonJS so require('./file.json') returns plain object
            // Also define a non-enumerable self-referential default like jiti
            const code = `const __data = ${jsonLiteral}\ntry { Object.defineProperty(__data, 'default', { value: __data, enumerable: false, configurable: true }) } catch {}\nmodule.exports = __data\n`
            return { code }
          }

          // ESM flavor: default export is the parsed object, and attach a
          // non-enumerable self-referential default so x.default === x, but
          // console.log(x) prints without the default property.
          const named = Object.keys(data)
            .filter((k) => /^[$A-Z_]\w*$/i.test(k))
            .map((k) => `export const ${k} = __data[${JSON.stringify(k)}]`)
            .join('\n')

          const code = [
            `const __data = ${jsonLiteral}`,
            `try { Object.defineProperty(__data, 'default', { value: __data, enumerable: false, configurable: true }) } catch {}`,
            named,
            `export default __data`,
          ]
            .filter(Boolean)
            .join('\n')

          return { code }
        } catch {
          return null
        }
      },
    },
  }
}
