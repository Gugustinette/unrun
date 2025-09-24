import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'rolldown'

/**
 * ESM require + import.meta shims
 *
 * Why:
 * - We want to keep modules as ESM even if they call require(). Wrapping the
 *   whole module as CommonJS breaks top-level await and import.meta semantics.
 * - Node allows require() in ESM only via createRequire. We emulate this by
 *   rewriting require()/require.resolve() calls and injecting a small helper.
 * - We also provide stable import.meta shims (filename, dirname, url, resolve)
 *   so code behaves consistently across bundling and native Node runs.
 *
 * How:
 * - For source files that look ESM (contain import/export), we:
 *   - Strip shebangs
 *   - Inject a prologue that defines import.meta properties
 *   - Rewrite require(...) -> createRequire(__unrun_filename)(...)
 *   - Rewrite require.resolve(...) -> __unrun_resolve(...)
 *   - __unrun_resolve tries Node resolution first, then TS aliases (.ts/.mts/.cts)
 */
export function createEsmRequireShim(): Plugin {
  return {
    name: 'unrun-meta-and-require',
    load(id) {
      if (!/\.(?:m?[jt]s|c?tsx?)(?:$|\?)/.test(id)) return null
      try {
        let src = fs.readFileSync(id, 'utf8')
        // Strip shebang (#!/usr/bin/env node) to avoid parser errors
        if (src.startsWith('#!')) {
          const nl = src.indexOf('\n')
          src = nl === -1 ? '' : src.slice(nl + 1)
        }
        const dir = path.dirname(id)

        // Provide per-module import.meta shims
        let prologue = ''
        prologue += `const __unrun_filename = ${JSON.stringify(id)}\n`
        prologue += `const __unrun_dirname = ${JSON.stringify(dir)}\n`
        prologue += `import { pathToFileURL as __unrun_pathToFileURL } from 'node:url'\n`
        prologue += `try { if (!('filename' in import.meta)) Object.defineProperty(import.meta, 'filename', { value: __unrun_filename, configurable: true }); } catch { }\n`
        prologue += `try { if (!('dirname' in import.meta)) Object.defineProperty(import.meta, 'dirname', { value: __unrun_dirname, configurable: true }); } catch { }\n`
        // Always override import.meta.url so it points to the real file URL
        prologue += `try { Object.defineProperty(import.meta, 'url', { value: __unrun_pathToFileURL(__unrun_filename).href, configurable: true }); } catch { }\n`
        prologue += `try {\n  Object.defineProperty(import.meta, 'resolve', {\n    value: (s) => {\n      try {\n        const base = __unrun_pathToFileURL(__unrun_filename);\n        const u = new URL(s, base);\n        return u.href;\n      } catch {\n        return s;\n      }\n    },\n    configurable: true\n  });\n} catch { }\n`

        let code = src
        // Only rewrite require() in ESM-looking files to avoid CJS wrapping
        if (/\b(?:import|export)\b/.test(src)) {
          const requireCallRE = /(?<!\.)\brequire\s*\(/g
          const requireResolveRE = /(?<!\.)\brequire\s*\.\s*resolve\s*\(/g
          if (requireCallRE.test(src) || requireResolveRE.test(src)) {
            // Rewrite direct calls: require("x") -> createRequire(__unrun_filename)("x")
            code = code.replaceAll(
              requireCallRE,
              'createRequire(__unrun_filename)(',
            )
            // Helper: robust resolve with TS aliases
            const resolverHelper =
              `const __unrun_require = createRequire(__unrun_filename);\n` +
              `function __unrun_resolve(spec) {\n` +
              `  try { return __unrun_require.resolve(spec) } catch {\n` +
              `    try { return __unrun_require.resolve(spec.replace(/\\.(mjs|cjs|js)$/, '.mts')) } catch {}\n` +
              `    try { return __unrun_require.resolve(spec.replace(/\\.(mjs|cjs|js)$/, '.cts')) } catch {}\n` +
              `    try { return __unrun_require.resolve(spec.replace(/\\.(mjs|cjs|js)$/, '.ts')) } catch {}\n` +
              `    try { return __unrun_require.resolve(spec + '.ts') } catch {}\n` +
              `    try { return __unrun_require.resolve(spec + '.mts') } catch {}\n` +
              `    try { return __unrun_require.resolve(spec + '.cts') } catch {}\n` +
              `    return __unrun_require.resolve(spec)\n` +
              `  }\n` +
              `}\n`
            prologue = `import { createRequire } from 'node:module'\n${prologue}${resolverHelper}`
            // Rewrite require.resolve("x") -> __unrun_resolve("x")
            code = code.replaceAll(requireResolveRE, '__unrun_resolve(')
          }
        }

        return { code: prologue + code }
      } catch {
        return null
      }
    },
  }
}
