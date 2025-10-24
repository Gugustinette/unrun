import path from 'node:path'
import { createSyncFn } from 'synckit'
import { resolveOptions, type Options } from './options'
import { jit } from './utils/jit'

// Export types
export type { Options } from './options'

/**
 * Loads a module with JIT compilation based on the provided options.
 *
 * @param options - The options for loading the module.
 * @returns A promise that resolves to the loaded module.
 */
export async function unrun(options: Options): Promise<any> {
  // Resolve options
  const resolvedOptions = resolveOptions(options)

  // Load the module using JIT compilation
  const module = await jit(resolvedOptions)

  // If the output preset is 'bundle-require', directly return the module
  if (resolvedOptions.preset === 'bundle-require') {
    return module
  }

  // If the output preset is 'jiti', mimic jiti's export behavior
  if (resolvedOptions.preset === 'jiti') {
    const ext = path.extname(resolvedOptions.path)
    // If it's an ESM namespace with no exports, return a plain object like jiti
    if (
      module &&
      typeof module === 'object' &&
      (module as any)[Symbol.toStringTag] === 'Module' &&
      Object.keys(module as any).length === 0
    ) {
      return ext === '.mjs' ? module : {}
    }
  }

  // Otherwise, if the module has a default export, return it
  if (module && typeof module === 'object' && 'default' in module) {
    return module.default
  }

  // Fallback: return the module as is
  return module
}

/**
 * Loads a module with JIT compilation based on the provided options.
 * This function runs synchronously using a worker thread.
 *
 * @param options - The options for loading the module.
 * @returns The loaded module.
 */
export function unrunSync(options: Options): any {
  const syncFn = createSyncFn(require.resolve('./sync/worker'), {
    tsRunner: 'node',
  })

  const result = syncFn(options)

  return result
}
