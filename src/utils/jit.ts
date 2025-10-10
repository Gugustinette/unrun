import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { ResolvedOptions } from '../options'
import { bundle } from './bundle'
import { loadModule } from './load-module'
import { makeCjsWrapperAsyncFriendly } from './make-cjs-wrapper-async-friendly'

export const jit = async (options: ResolvedOptions): Promise<any> => {
  // Resolve the file path to an absolute path
  const filePath = path.resolve(process.cwd(), options.path)

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`[unrun] File not found: ${filePath}`)
  }

  // Bundle the code
  const outputChunk = await bundle(options)

  // Post-process: make CommonJS wrappers async-friendly
  let finalCode = outputChunk.code
  if (options.makeCjsWrapperAsyncFriendly ?? true) {
    finalCode = makeCjsWrapperAsyncFriendly(finalCode)
  }

  // Load the generated module
  let _module
  try {
    _module = await loadModule(finalCode, {
      filenameHint: path.basename(options.path),
      keepFile: process.env.UNRUN_DEBUG === 'true',
    })
  } catch (error) {
    throw new Error(
      `[unrun] Import failed (code length: ${finalCode.length}): ${(error as Error).message}`,
    )
  }

  // Return the module
  return _module
}
