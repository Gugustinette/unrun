import { createSyncFn } from 'synckit'
import { preset } from './features/preset'
import { resolveOptions, type Options } from './options'
import { jit } from './utils/jit'
import type { Result } from './types'

// Export types
export type { Options } from './options'
export type { Result } from './types'

/**
 * Loads a module with JIT compilation based on the provided options.
 *
 * @param options - The options for loading the module.
 * @returns A promise that resolves to the loaded module.
 */
export async function unrun(options: Options): Promise<Result> {
  // Resolve options
  const resolvedOptions = resolveOptions(options)

  // Load the module using JIT compilation
  const module = await jit(resolvedOptions)

  // Apply preset handling
  const finalModule = preset(resolvedOptions, module)

  return { module: finalModule }
}

/**
 * Loads a module with JIT compilation based on the provided options.
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
