import path from 'node:path'
import type { ResolvedOptions } from '../options'

/**
 * Applies preset-specific handling to the loaded module.
 */
export function preset(options: ResolvedOptions, module: any): any {
  // If the output preset is 'bundle-require', directly return the module
  if (options.preset === 'bundle-require') {
    return module
  }

  // If the output preset is 'jiti', mimic jiti's export behavior
  if (options.preset === 'jiti') {
    const ext = path.extname(options.path)
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
