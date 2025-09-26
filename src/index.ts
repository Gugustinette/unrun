import path from 'node:path'
import { jit } from './utils/jit'

export interface Options {
  path?: string
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function unrun(options: Options = {}): Promise<any> {
  // Load file content with fs
  const filePath = options.path || 'custom.config.ts'

  const module = await jit({
    path: filePath,
  })

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
    return path.extname(filePath) === '.mjs' ? module : {}
  }

  // Otherwise return the module as-is
  return module
}
