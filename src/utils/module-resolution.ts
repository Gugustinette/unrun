import { builtinModules } from 'node:module'
import path from 'node:path'

/**
 * Precomputed set of Node.js builtin module specifiers, including both plain and `node:` prefixed forms.
 */
export const BUILTIN_MODULE_SPECIFIERS: ReadonlySet<string> = new Set([
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
])

/**
 * Returns true when `id` refers to a Node.js builtin module, accepting both plain and `node:` specifiers.
 */
export function isBuiltinModuleSpecifier(id: string): boolean {
  if (!id) return false
  return BUILTIN_MODULE_SPECIFIERS.has(id) || id.startsWith('node:')
}

/**
 * Removes Rollup-style query/hash suffixes from importer paths, falling back when importer is virtual or missing.
 */
export function normalizeImporterPath(
  importer: string | undefined,
  fallback: string,
): string {
  if (!importer || importer.startsWith('\0')) {
    return fallback
  }
  const [withoutQuery] = importer.split('?')
  return withoutQuery || fallback
}

/**
 * Checks if `child` is inside `parent` directory.
 */
export function isPathWithinDirectory(parent: string, child: string): boolean {
  const relative = path.relative(parent, child)
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}
