import { existsSync } from 'node:fs'
import path from 'node:path'
import { isBuiltinModuleSpecifier } from '../utils/module-resolution'
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

  return function external(id: string): boolean {
    // Ignore empty specifiers and rolldown internals (null-byte prefixed ids)
    if (!id || id.startsWith('\0')) return false
    // Relative, hash-import, or absolute paths get bundled, not treated as external
    if (id.startsWith('.') || id.startsWith('#') || path.isAbsolute(id)) {
      return false
    }

    // Builtin modules are always external
    if (isBuiltinModuleSpecifier(id)) {
      return true
    }

    // If the entry package cannot resolve this specifier at runtime, inlines it
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
