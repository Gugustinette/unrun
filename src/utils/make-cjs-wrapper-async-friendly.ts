/**
 * Transforms code strings containing CommonJS wrappers to be async-friendly.
 *
 * Rolldown may wrap CommonJS modules in a `__commonJS` function that uses
 * arrow functions. If the wrapped code contains top-level `await`, this can lead
 * to syntax errors since the callback function won't be marked as `async`.
 * This function scans for such patterns and modifies the arrow functions to
 * be `async` if they contain `await` expressions.
 * @param input - The input code string potentially containing CommonJS wrappers.
 * @returns The transformed code string with async-friendly wrappers.
 */
export function makeCjsWrapperAsyncFriendly(input: string): string {
  let code = input
  const marker = '__commonJS({'
  if (!code.includes(marker)) return input

  let pos = 0
  let changed = false
  const arrowToken = '(() => {'
  const asyncArrowToken = '(async () => {'

  while (true) {
    const markerIdx = code.indexOf(marker, pos)
    if (markerIdx === -1) break

    const fnStart = code.indexOf(arrowToken, markerIdx)
    if (fnStart === -1) {
      pos = markerIdx + marker.length
      continue
    }

    const bodyStart = fnStart + arrowToken.length
    let i = bodyStart
    let depth = 1
    while (i < code.length && depth > 0) {
      const ch = code[i++]
      if (ch === '{') depth++
      else if (ch === '}') depth--
    }
    if (depth !== 0) break

    const bodyEnd = i - 1
    const body = code.slice(bodyStart, bodyEnd)

    if (
      /\bawait\b/.test(body) && // Only insert if not already async
      code.slice(fnStart, fnStart + asyncArrowToken.length) !== asyncArrowToken
    ) {
      code = `${code.slice(0, fnStart + 1)}async ${code.slice(fnStart + 1)}`
      changed = true
      pos = fnStart + 1 + 'async '.length
      continue
    }

    pos = bodyEnd
  }

  return changed ? code : input
}
