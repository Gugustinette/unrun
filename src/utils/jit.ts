import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { bundle } from './bundle'
import { makeCjsWrapperAsyncFriendly } from './make-cjs-wrapper-async-friendly'

export interface JitOptions {
  /**
   * The path to the file to be imported.
   * @default process.cwd()
   */
  path: string
  /**
   * Whether to make Rolldown's CommonJS wrappers async-friendly.
   * This is necessary if the code being imported uses top-level await
   * inside a CommonJS module.
   * @default true
   */
  makeCjsWrapperAsyncFriendly?: boolean
}

// biome-ignore lint/suspicious/noExplicitAny: Dynamically imported modules can't be typed
export const jit = async (options: JitOptions): Promise<any> => {
  // Resolve the file path to an absolute path
  const filePath = path.resolve(process.cwd(), options.path)

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`[unrun] File not found: ${filePath}`)
  }

  // Bundle the code
  const outputChunk = await bundle(filePath)

  // Post-process: make CommonJS wrappers async-friendly
  let finalCode = outputChunk.code
  if (options.makeCjsWrapperAsyncFriendly ?? true) {
    finalCode = makeCjsWrapperAsyncFriendly(finalCode)
  }

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
    throw new Error(
      `[unrun] Import failed for ${moduleUrl} (code length: ${finalCode.length}): ${(error as Error).message}`,
    )
  } finally {
    // Clean the temporary file unless debugging
    if (process.env.UNRUN_DEBUG !== 'true' && moduleUrl.startsWith('file://')) {
      try {
        fs.unlinkSync(new URL(moduleUrl))
      } catch {}
    }
  }

  // Return the module
  return _module
}
