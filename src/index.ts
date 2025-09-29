import path from 'node:path'
import { resolveOptions, type Options } from './options'
import { jit } from './utils/jit'

export async function unrun(options: Options): Promise<any> {
  // Resolve options
  const resolvedOptions = resolveOptions(options)

  // Load the module using JIT compilation
  const module = await jit(resolvedOptions)

  // If the output preset is 'jiti', mimic jiti's export behavior
  if (resolvedOptions.outputPreset === 'jiti') {
    // Prefer default export if present
    if (module && 'default' in module && module.default !== undefined) {
      return module.default
    }

    // If it's an ESM namespace with no exports, return a plain object like jiti
    if (
      module &&
      typeof module === 'object' &&
      module[Symbol.toStringTag] === 'Module' &&
      Object.keys(module).length === 0
    ) {
      return path.extname(resolvedOptions.path) === '.mjs' ? module : {}
    }
  }

  // Otherwise return the module as-is
  return module
}
