import { builtinModules } from 'node:module'

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
