import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
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
  const projectNodeModules = path.resolve(process.cwd(), 'node_modules')

  return function external(id: string, importer?: string): boolean {
    if (!id || id.startsWith('\0')) return false
    if (id.startsWith('.') || id.startsWith('#') || path.isAbsolute(id)) {
      return false
    }

    if (isBuiltinModuleSpecifier(id)) {
      return true
    }

    const importerPath = normalizeImporterPath(importer, options.path)

    try {
      const resolver = createRequire(importerPath)
      const resolved = resolver.resolve(id)

      if (!isPathWithinDirectory(projectNodeModules, resolved)) {
        return false
      }
    } catch {
      // If we cannot resolve the specifier, keep previous external behavior
    }

    return true
  }
}
