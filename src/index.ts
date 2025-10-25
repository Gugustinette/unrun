import { createSyncFn } from 'synckit'
import { preset } from './features/preset'
import { resolveOptions, type Options } from './options'
import { bundle } from './utils/bundle'
import { cleanModule } from './utils/module/clean-module'
import { execModule } from './utils/module/exec-module'
import { loadModule } from './utils/module/load-module'
import { writeModule } from './utils/module/write-module'
import type { CliResult, Result } from './types'

// Export types
export type { Options } from './options'
export type { CliResult, Result } from './types'

/**
 * Loads a module with JIT transpilation based on the provided options.
 *
 * @param options - The options for loading the module.
 * @returns A promise that resolves to the loaded module.
 */
export async function unrun(options: Options): Promise<Result> {
  // Resolve options
  const resolvedOptions = resolveOptions(options)

  // Bundle the code
  const outputChunk = await bundle(resolvedOptions)

  // Load the generated module
  let module
  try {
    module = await loadModule(outputChunk.code, resolvedOptions)
  } catch (error) {
    throw new Error(
      `[unrun] Import failed (code length: ${outputChunk.code.length}): ${(error as Error).message}`,
    )
  }

  // Apply output preset handling
  const finalModule = preset(resolvedOptions, module)

  return { module: finalModule }
}

/**
 * Loads a module with JIT transpilation based on the provided options.
 * This function runs synchronously using a worker thread.
 *
 * @param options - The options for loading the module.
 * @returns The loaded module.
 */
export function unrunSync(options: Options): Result {
  const syncFn = createSyncFn(require.resolve('./sync/worker'), {
    tsRunner: 'node',
  })

  const result = syncFn(options)

  return result
}

/**
 * Runs a given module with JIT transpilation based on the provided options.
 * This function does not return the module, as it simply executes it.
 * Corresponds to the CLI behavior.
 *
 * @param options - The options for running the module.
 * @param args - Additional command-line arguments to pass to the module.
 */
export async function unrunCli(
  options: Options,
  args: string[] = [],
): Promise<CliResult> {
  // Resolve options
  const resolvedOptions = resolveOptions(options)

  // Bundle the code
  const outputChunk = await bundle(resolvedOptions)

  // Write the module to the filesystem
  const moduleUrl = writeModule(outputChunk.code, resolvedOptions)

  // Run the generated module
  let cliResult: CliResult
  try {
    cliResult = await execModule(moduleUrl, args)
  } catch (error) {
    throw new Error(
      `[unrun] Run failed (code length: ${outputChunk.code.length}): ${(error as Error).message}`,
    )
  }

  // Clean the module
  cleanModule(moduleUrl)

  // Return the execution result
  return cliResult
}
