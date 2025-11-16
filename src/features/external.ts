import { createRequire } from 'node:module'
import path from 'node:path'
import {
  isBuiltinModuleSpecifier,
  isPathWithinDirectory,
  normalizeImporterPath,
} from '../utils/module-resolution'
import type { ResolvedOptions } from '../options'

/**
 * Builds the rolldown external resolver used to decide which imports remain external.
 * Treat bare imports from the primary node_modules as external, but inline
 * nested node_modules so they keep working once executed from .unrun.
 */
export function createExternalResolver(
  options: ResolvedOptions,
): (id: string, importer?: string) => boolean {
  const entryDir = path.dirname(options.path)

  return function external(id: string, importer?: string): boolean {
    // Ignore empty specifiers and rolldown internals (null-byte prefixed ids)
    if (!id || id.startsWith('\0')) return false
    // Relative, hash-import, or absolute paths get bundled, not treated as external
    if (id.startsWith('.') || id.startsWith('#') || path.isAbsolute(id)) {
      return false
    }

    if (isBuiltinModuleSpecifier(id)) {
      return true
    }

    const importerPath = normalizeImporterPath(importer, options.path)

    try {
      // Ask Node's resolver to find where this bare specifier would load from
      const resolver = createRequire(importerPath)
      const resolved = resolver.resolve(id)
      const containingNodeModules = findContainingNodeModules(resolved)

      if (!containingNodeModules) {
        return false
      }

      const ownerDir = path.dirname(containingNodeModules)
      const ownerInsideEntry = isPathWithinDirectory(entryDir, ownerDir)
      const entryInsideOwner = isPathWithinDirectory(ownerDir, entryDir)

      // Only inline packages that ship nested node_modules under our entry; otherwise stay external
      if (ownerInsideEntry && !entryInsideOwner) {
        return false
      }
    } catch {
      // If we cannot resolve the specifier, keep previous external behavior
    }

    return true
  }
}

function findContainingNodeModules(filePath: string): string | undefined {
  let current = path.dirname(filePath)
  const { root } = path.parse(current)

  while (true) {
    if (path.basename(current) === 'node_modules') {
      return current
    }
    if (current === root) {
      break
    }
    // Walk up one directory at a time until we either find node_modules or hit the filesystem root
    current = path.dirname(current)
  }

  return undefined
}
