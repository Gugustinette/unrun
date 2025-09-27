import { ScriptTarget, transpileModule } from 'typescript'
import { stripShebang } from '../utils/source'
import type { Plugin } from 'rolldown'

/**
 * TypeScript transpiler with decorator support and .cts interop.
 *
 * Why:
 * - We need to run TS sources on the fly, including experimental decorators,
 *   and keep ESM output so TLA works. For .cts, we must interop with CJS
 *   shape while exposing ESM-friendly default + named exports.
 *
 * How:
 * - Uses TypeScript.transpileModule for speed (no full typecheck). For .ts/.mts,
 *   emits ESNext modules; for .cts, emits CJS then wraps into an ESM facade.
 * - Named export synthesis from `exports.<name> =` assignments in the CJS body.
 */
export function createTsTranspile(): Plugin {
  return {
    name: 'unrun-typescript-transpile',
    transform(code: string, id: string) {
      if (!/\.(?:mts|cts|ts|tsx)$/.test(id) || /\.d\.ts$/.test(id)) return null
      try {
        const src = stripShebang(code)
        const isCTS = /\.cts$/.test(id)
        const out = transpileModule(src, {
          fileName: id,
          compilerOptions: {
            target: ScriptTarget.ES2022,
            experimentalDecorators: true,
            sourceMap: false,
          },
          reportDiagnostics: false,
        })
        if (isCTS) {
          const names = Array.from(
            out.outputText.matchAll(/exports\.([A-Za-z_$][\w$]*)\s*=\s*/g),
          )
            .map((m) => m[1])
            .filter((v, i, a) => a.indexOf(v) === i)

          const namedLines = names
            .map(
              (n) => `export const ${n} = __cjs_exports[${JSON.stringify(n)}];`,
            )
            .join('\n')
          const wrapped = `const __cjs_exports = (() => {\n  const module = { exports: {} };\n  const exports = module.exports;\n  ${out.outputText}\n  return module.exports;\n})();\nexport default __cjs_exports;\n${namedLines}\n`
          return { code: wrapped }
        }
        return { code: out.outputText }
      } catch {
        return null
      }
    },
  }
}
