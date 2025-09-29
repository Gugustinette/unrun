import path from 'node:path'
import { jit } from './utils/jit'

export interface Options {
  /**
   * The path to the file to be imported.
   * @default 'custom.config.ts'
   */
  path?: string

  /**
   * The preset to use for output generation.
   * @default 'jiti'
   */
  outputPreset?: 'jiti' | 'none'
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function unrun(options: Options = {}): Promise<any> {
  // Load file content with fs
  const filePath = options.path || 'custom.config.ts'
  // Validate output preset
  const outputPreset = options.outputPreset || 'jiti'
  if (!['jiti', 'none'].includes(outputPreset)) {
    throw new Error(
      `[unrun] Invalid output preset: ${outputPreset}. Valid options are 'jiti', or 'none'.`,
    )
  }

  const module = await jit({
    path: filePath,
  })

  // If the output preset is 'jiti', mimic jiti's export behavior
  if (outputPreset === 'jiti') {
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
  }

  // Otherwise return the module as-is
  return module
}
