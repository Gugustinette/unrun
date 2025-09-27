import fs from 'node:fs'
import type { Plugin } from 'rolldown'

/**
 * A very light heuristic to detect if a module looks like ESM.
 * We avoid false positives by requiring bare `import`/`export` tokens.
 */
export function isEsmLike(src: string): boolean {
  return /\b(?:import|export)\b/.test(src)
}

/**
 * Minimal ESM require.resolve shim
 */
export function createEsmRequireShim(): Plugin {
  return {
    name: 'unrun-require-resolve-shim',
    load(id) {
      if (!/\.(?:m?[jt]s|c?tsx?)(?:$|\?)/.test(id)) return null
      try {
        let src = fs.readFileSync(id, 'utf8')
        if (!isEsmLike(src)) return null

        const requireResolveRE = /(?<!\.)\brequire\s*\.\s*resolve\s*\(/g
        if (!requireResolveRE.test(src)) return null

        // Inject a tiny helper to resolve relative to the source file path
        const prologue =
          `import { createRequire as __unrun_createRequire } from 'node:module'\n` +
          `const __unrun_require = __unrun_createRequire(${JSON.stringify(id)})\n` +
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
        src = src.replaceAll(requireResolveRE, '__unrun_resolve(')

        return { code: prologue + src }
      } catch {
        return null
      }
    },
  }
}
