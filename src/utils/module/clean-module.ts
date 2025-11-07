import fs from 'node:fs'
import type { ResolvedOptions } from '../../options'

/**
 * Clean the module file at the given URL.
 * Deletes the file if it exists.
 * @param moduleUrl - The URL of the module file to be cleaned.
 * @param options - Resolved options.
 */
export function cleanModule(moduleUrl: string, options: ResolvedOptions): void {
  // If debug mode is enabled, skip cleaning
  if (options.debug) {
    return
  }

  try {
    // Only attempt to delete if it's a file URL
    if (moduleUrl.startsWith('file://')) {
      const filePath = new URL(moduleUrl)
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    // If the file doesn't exist, ignore the error
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}
