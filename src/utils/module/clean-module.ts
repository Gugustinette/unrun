import fs from 'node:fs'

/**
 * Clean the module file at the given URL.
 * Deletes the file if it exists.
 * @param moduleUrl - The URL of the module file to be cleaned.
 */
export function cleanModule(moduleUrl: string): void {
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
