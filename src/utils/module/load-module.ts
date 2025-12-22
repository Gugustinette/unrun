import { cleanModule } from './clean-module'
import { writeModule } from './write-module'
import type { ResolvedOptions } from '../../options'

/**
 * Import a JS module from code string.
 * Write ESM code to a temp file (prefer project-local node_modules/.unrun) and import it.
 * @param code - The JavaScript code to be imported as a module.
 * @param options - Resolved options.
 * @returns The imported module.
 */
export async function loadModule(
  code: string,
  options: ResolvedOptions,
): Promise<any> {
  // Write the module to the filesystem
  const moduleUrl = writeModule(code, options)

  // Placeholder for the imported module
  let _module

  try {
    // Dynamically import the generated module
    _module = await import(moduleUrl)
  } finally {
    // Clean up the module file
    cleanModule(moduleUrl, options)
  }
  return _module
}
