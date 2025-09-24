import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { rolldown, type Plugin } from 'rolldown'

export interface JitOptions {
  /**
   * The path to the file to be imported.
   * @default process.cwd()
   */
  path: string
}

// biome-ignore lint/suspicious/noExplicitAny: Dynamically imported modules can't be typed
export const jit = async (options: JitOptions): Promise<any> => {
  // Resolve the file path to an absolute path
  const filePath = path.resolve(process.cwd(), options.path)
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  // Simple transform to keep ESM semantics when a module uses `require()`.
  // This avoids wrapping the whole module into a CJS factory, which would
  // otherwise make top-level await invalid and cause "Unexpected reserved word" errors.
  const esmRequireShim: Plugin = {
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

        // Always provide per-module import.meta shims: filename, dirname, resolve
        let prologue = ''
        prologue += `const __unrun_filename = ${JSON.stringify(id)}\n`
        prologue += `const __unrun_dirname = ${JSON.stringify(dir)}\n`
        prologue += `try { if (!('filename' in import.meta)) Object.defineProperty(import.meta, 'filename', { value: __unrun_filename, configurable: true }); } catch { }\n`
        prologue += `try { if (!('dirname' in import.meta)) Object.defineProperty(import.meta, 'dirname', { value: __unrun_dirname, configurable: true }); } catch { }\n`
        prologue += `import { pathToFileURL as __unrun_pathToFileURL } from 'node:url'\n`
        prologue += `try {\n  Object.defineProperty(import.meta, 'resolve', {\n    value: (s) => {\n      try {\n        const base = __unrun_pathToFileURL(__unrun_filename);\n        const u = new URL(s, base);\n        return u.href;\n      } catch {\n        return s;\n      }\n    },\n    configurable: true\n  });\n} catch { }\n`

        let code = src
        let needsCreateRequire = false
        // Only rewrite require() in ESM-looking files to avoid CJS wrapping
        if (/\b(?:import|export)\b/.test(src)) {
          const requireCallRE = /(?<!\.)\brequire\s*\(/g
          if (requireCallRE.test(src)) {
            needsCreateRequire = true
            code = code.replaceAll(
              requireCallRE,
              'createRequire(__unrun_filename)(',
            )
          }
        }
        if (needsCreateRequire) {
          prologue = `import { createRequire } from 'node:module'\n${prologue}`
        }
        return { code: prologue + code }
      } catch {
        return null
      }
    },
  }

  // Setup bundle
  const bundle = await rolldown({
    // Input options (https://rolldown.rs/reference/config-options#inputoptions)
    input: filePath,
    // Use Node platform for better Node-compatible resolution & builtins
    platform: 'node',
    // Keep __dirname/__filename behavior and map import.meta.env to process.env
    define: {
      __dirname: JSON.stringify(path.dirname(filePath)),
      __filename: JSON.stringify(filePath),
      'import.meta.env': 'process.env',
    },
    plugins: [esmRequireShim],
    experimental: {
      // Avoid wrapping modules into CJS factories when `require()` is detected
      // so that ESM + TLA remains valid at runtime.
      onDemandWrapping: false,
    },
  })

  // Generate bundle in memory
  const rolldownOutput = await bundle.generate({
    // Output options (https://rolldown.rs/reference/config-options#outputoptions)
    format: 'esm',
    inlineDynamicImports: true,
    // Ensure we don't polyfill/force CommonJS require at output level
    // so ESM with TLA remains valid. (Option is harmless if unsupported.)
    // @ts-ignore polyfillRequire might not be typed in current rolldown version
    polyfillRequire: false,
  })

  // Verify that the output is not empty
  if (!rolldownOutput.output[0]) {
    throw new Error('No output chunk found')
  }
  // Get the output chunk
  const outputChunk = rolldownOutput.output[0]

  // Unwrap rolldown's CJS wrapper if present to keep TLA valid
  const unwrapCjsWrapper = (code: string): string => {
    const marker = '__commonJS({'
    const varIdx = code.indexOf(marker)
    if (varIdx === -1) return code
    // Find the start of the var declaration that contains the wrapper
    const varDeclStart = code.lastIndexOf('var ', varIdx)
    if (varDeclStart === -1) return code
    // Find the function body start "(() => {"
    const fnStart = code.indexOf('(() => {', varIdx)
    if (fnStart === -1) return code
    const bodyStart = fnStart + '(() => {'.length
    // Walk to find the matching closing brace of the function body
    let i = bodyStart
    let depth = 1
    while (i < code.length && depth > 0) {
      const ch = code[i++]
      if (ch === '{') depth++
      else if (ch === '}') depth--
    }
    if (depth !== 0) return code
    const bodyEnd = i - 1
    const body = code.slice(bodyStart, bodyEnd)
    // Only unwrap if the body contains 'await', indicating TLA inside wrapper
    if (!/\bawait\b/.test(body)) return code
    // Remove the export default require_*(); invocation if exists
    const afterWrapper = code.slice(bodyEnd)
    const exportCallMatch = afterWrapper.match(
      /export\s+default\s+\w+\s*\(\)\s*;?/,
    ) // simple heuristic
    const exportCallLen = exportCallMatch ? exportCallMatch[0].length : 0
    const exportCallIdx = exportCallMatch
      ? bodyEnd + afterWrapper.indexOf(exportCallMatch[0])
      : -1
    const prologue = code.slice(0, varDeclStart)
    const epilogue =
      exportCallIdx !== -1
        ? code.slice(exportCallIdx + exportCallLen)
        : code.slice(bodyEnd)
    return `${prologue}${body}${epilogue}`
  }

  const finalCode = unwrapCjsWrapper(outputChunk.code)

  // Convert code to base64
  const code64 = Buffer.from(finalCode).toString('base64')

  // Create a new module using the base64 encoded code
  const _module = await import(`data:text/javascript;base64,${code64}`)

  // Return the module
  return _module
}
