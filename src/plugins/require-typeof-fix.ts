import type { Plugin } from 'rolldown'

/**
 * Ensure typeof require in ESM stays undefined to match jiti behavior.
 * Replaces typeof __require with typeof require to maintain compatibility.
 */
export function createRequireTypeofFix(): Plugin {
  return {
    name: 'unrun-require-typeof-fix',
    generateBundle: {
      handler(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk') {
            chunk.code = chunk.code.replaceAll(
              /\btypeof\s+__require\b/g,
              'typeof require',
            )
          }
        }
      },
    },
  }
}
