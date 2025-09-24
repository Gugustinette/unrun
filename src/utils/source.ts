/**
 * Common source helpers: shebang stripping and ESM detection.
 */

/**
 * Remove a hashbang (#!/usr/bin/env node) from the beginning of the source,
 * preserving line numbers as much as possible.
 */
export function stripShebang(src: string): string {
  if (src.startsWith('#!')) {
    const nl = src.indexOf('\n')
    return nl === -1 ? '' : src.slice(nl + 1)
  }
  return src
}

/**
 * A very light heuristic to detect if a module looks like ESM.
 * We avoid false positives by requiring bare `import`/`export` tokens.
 */
export function isEsmLike(src: string): boolean {
  return /\b(?:import|export)\b/.test(src)
}

/**
 * Test if a string is a valid JS identifier (for named JSON exports, etc.).
 */
export function isValidIdentifier(name: string): boolean {
  return /^[a-z_$][\w$]*$/i.test(name)
}
