import { existsSync } from 'node:fs'
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
  const canResolveFromEntry = (specifier: string): boolean => {
    const packageName = getPackageName(specifier)
    if (!packageName) {
      return false
    }

    // Walk upward from the entry directory and look for a node_modules/<packageName>
    // folder. If we can spot one, the entry point could resolve the specifier at runtime.
    let currentDir = entryDir
    while (true) {
      const candidate = path.join(currentDir, 'node_modules', packageName)
      if (existsSync(candidate)) {
        return true
      }

      const parentDir = path.dirname(currentDir)
      if (parentDir === currentDir) {
        break
      }
      currentDir = parentDir
    }

    return false
  }

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
      // If we cannot resolve the specifier from the importer, fall through to the entry resolution check
    }

    // If the entry package cannot resolve this specifier at runtime, inline it
    if (!canResolveFromEntry(id)) {
      return false
    }

    return true
  }
}

function getPackageName(specifier: string): string | undefined {
  if (!specifier) return undefined
  if (specifier.startsWith('@')) {
    const segments = specifier.split('/')
    if (segments.length >= 2) {
      return `${segments[0]}/${segments[1]}`
    }
    return undefined
  }

  const [name] = specifier.split('/')
  return name || undefined
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
