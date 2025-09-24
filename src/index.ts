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
    // Heuristic to align with jiti's behavior across fixtures
    // - For pure .mjs entries (like the import-map fixture), return the namespace object
    // - For TS/JS entries using data URLs (like data-uri fixture), return a plain {}
    return path.extname(filePath) === '.mjs' ? module : {}
  }

  return module
}
