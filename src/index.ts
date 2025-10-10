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

    // If it's an object with only a default: {} key, unwrap to a plain object (match jiti)
    if (
      module &&
      typeof module === 'object' &&
      'default' in (module as any) &&
      Object.keys(module as any).length === 1 &&
      (module as any).default &&
      typeof (module as any).default === 'object' &&
      Object.keys((module as any).default).length === 0
    ) {
      return ext === '.mjs' ? module : (module as any).default
    }
  }

  // Otherwise return the module as-is
  return module
}
