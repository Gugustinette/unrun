import { fileURLToPath } from 'node:url'

/**
 * Normalize a path-like input to a string path.
 * @param pathLike The path-like input (string or URL).
 * @returns The normalized string path.
 */
export function normalizePath(pathLike?: string | URL): string {
  if (!pathLike) {
    return 'index.ts'
  }

  if (pathLike instanceof URL) {
    if (pathLike.protocol === 'file:') {
      return fileURLToPath(pathLike)
    }
    return pathLike.href
  }

  if (typeof pathLike === 'string') {
    if (!pathLike.startsWith('file:')) {
      return pathLike
    }

    try {
      return fileURLToPath(pathLike)
    } catch {
      try {
        return fileURLToPath(new URL(pathLike))
      } catch {
        return pathLike
      }
    }
  }

  return String(pathLike)
}
