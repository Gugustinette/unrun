import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { rolldown } from 'rolldown'
import { createEsmRequireShim } from '../plugins/esm-require-shim'
import { createJsonLoader } from '../plugins/json-loader'
import { createTsTranspile } from '../plugins/ts-transpile'
import { unwrapCjsWrapper } from './unwrap-cjs'

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
    // Compose feature-specific plugins
    plugins: [createTsTranspile(), createJsonLoader(), createEsmRequireShim()],
    experimental: {
      // Let rolldown wrap pure CJS modules (like .cjs / .cts) so they can be required.
      // ESM modules with occasional `require()` calls won't be wrapped because we rewrite them.
      onDemandWrapping: true,
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

  // Post-process: unwrap CJS wrappers containing TLA and clean tail exports
  const finalCode = unwrapCjsWrapper(outputChunk.code)

  // Prefer loading from a temporary file (avoids massive data: URLs that can
  // cause IPC serialization issues in test runners and matches Node behavior better)
  let moduleUrl: string | null = null
  try {
    const hash = crypto.createHash('sha1').update(finalCode).digest('hex')
    const outDir = path.join(tmpdir(), 'unrun-cache')
    const outFile = path.join(outDir, `${hash}.mjs`)
    if (!fs.existsSync(outFile)) {
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(outFile, finalCode, 'utf8')
    }
    moduleUrl = pathToFileURL(outFile).href
  } catch {
    // Fallback to data URL if writing fails
    moduleUrl = `data:text/javascript;base64,${Buffer.from(finalCode).toString('base64')}`
  }

  // Dynamically import the generated module
  let _module
  try {
    _module = await import(moduleUrl)
  } catch (error) {
    console.error(
      '[unrun] import failed for',
      moduleUrl,
      'code length:',
      finalCode.length,
    )
    try {
      if (process.env.UNRUN_DEBUG) {
        const debugOut = path.join(process.cwd(), 'unrun-debug.mjs')
        fs.writeFileSync(debugOut, finalCode, 'utf8')
        console.error('[unrun] wrote debug output to', debugOut)
      }
    } catch {}
    throw error
  }

  // Return the module
  return _module
}
