import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { ResolvedOptions } from '../options'
import { bundle } from './bundle'
import { loadModule } from './load-module'

export const jit = async (options: ResolvedOptions): Promise<any> => {
  // Resolve the file path to an absolute path
  const filePath = path.resolve(process.cwd(), options.path)

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`[unrun] File not found: ${filePath}`)
  }

  // Bundle the code
  const outputChunk = await bundle(options)

  // Load the generated module
  let _module
  try {
    _module = await loadModule(outputChunk.code, options)
  } catch (error) {
    throw new Error(
      `[unrun] Import failed (code length: ${outputChunk.code.length}): ${(error as Error).message}`,
    )
  }

  // Return the module
  return _module
}
