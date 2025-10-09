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
      return ext === '.mjs' ? module : {}
    }

    // Special-case JSON top-level configs: if the evaluated module is a plain
    // object with a self-referential `default` property (due to our JSON
    // loader), strip it so callers get a clean object.
    if (
      module &&
      typeof module === 'object' &&
      ext === '.json' &&
      (module as any).default === module
    ) {
      const cloned = { ...(module as any) }
      delete (cloned as any).default
      return cloned
    }
  }

  // Otherwise return the module as-is
  return module
}
