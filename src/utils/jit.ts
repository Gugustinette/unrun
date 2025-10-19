import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { ResolvedOptions } from '../options'
import { bundle } from './bundle'
import type { OutputChunk } from 'rolldown'

export const jit = async (options: ResolvedOptions): Promise<any> => {
  // Resolve the file path to an absolute path
  const filePath = path.resolve(process.cwd(), options.path)

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`[unrun] File not found: ${filePath}`)
  }

  // Bundle the code to a temporary file
  const { outDir, rolldownOutput } = await bundle(options)

  // Get entry chunk
  const entryChunk: OutputChunk = rolldownOutput.output.find(
    (chunk) => chunk.type === 'chunk' && chunk.isEntry,
  ) as OutputChunk
  // Construct entry file path
  const entryFilePath = path.join(outDir, entryChunk.fileName)
  // Sanity checks
  if (!entryFilePath) {
    throw new Error('[unrun] Bundle output has no entry chunk')
  }
  if (!fs.existsSync(entryFilePath)) {
    throw new Error(`[unrun] Bundle output not found: ${entryFilePath}`)
  }

  // Load the generated module
  let _module
  try {
    _module = await import(entryFilePath)
  } catch (error) {
    throw new Error(`[unrun] Import failed: ${(error as Error).message}`)
  }

  // Remove temporary files unless in debug mode
  if (!options.debug) {
    try {
      fs.rmSync(outDir, { recursive: true, force: true })
    } catch {
      console.warn(`[unrun] Could not remove temporary files in ${outDir}`)
    }
  }

  // Return the module
  return _module
}
