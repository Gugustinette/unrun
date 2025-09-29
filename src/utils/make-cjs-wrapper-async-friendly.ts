/**
 * Transforms code strings containing CommonJS wrappers to be async-friendly.
 *
 * Rolldown may wrap CommonJS modules in a `__commonJS` function that uses
 * arrow functions. If the wrapped code contains top-level `await`, this can lead
 * to syntax errors since the callback function won't be marked as `async`.
 * This function scans for such patterns and modifies the arrow functions to
 * be `async` if they contain `await` expressions.
 *
 * @param input - The input code string potentially containing CommonJS wrappers.
 * @returns The transformed code string with async-friendly wrappers.
 */
export function makeCjsWrapperAsyncFriendly(input: string): string {
  // Work on a mutable copy of the input code string
  let code = input

  // Rolldown CJS helper starts as: __commonJS({ ... })
  // We use this marker to quickly skip files that don't contain such wrappers
  const marker = '__commonJS({'
  if (!code.includes(marker)) return input

  // Cursor while scanning the string and a flag indicating any change
  let pos = 0
  let changed = false

  // The common wrapper pattern produced by rolldown uses an arrow function:
  // (() => { /* module body */ })
  const arrowToken = '(() => {'
  const asyncArrowToken = '(async () => {'

  while (true) {
    // 1) Find the next CJS wrapper occurrence
    const markerIdx = code.indexOf(marker, pos)
    if (markerIdx === -1) break

    // 2) Find the arrow function that contains the module body
    const fnStart = code.indexOf(arrowToken, markerIdx)
    if (fnStart === -1) {
      // If we didn't find the arrow function after a marker, continue scanning
      pos = markerIdx + marker.length
      continue
    }

    // 3) Determine the body boundaries by walking balanced braces
    const bodyStart = fnStart + arrowToken.length
    let i = bodyStart
    let depth = 1
    while (i < code.length && depth > 0) {
      const ch = code[i++]
      if (ch === '{') depth++
      else if (ch === '}') depth--
    }
    // If we exit without closing, the code is malformed or truncated; stop here
    if (depth !== 0) break

    const bodyEnd = i - 1
    const body = code.slice(bodyStart, bodyEnd)

    if (
      // 4) Only convert to async if the body uses top-level await
      /\bawait\b/.test(body) && // Only insert if not already async
      code.slice(fnStart, fnStart + asyncArrowToken.length) !== asyncArrowToken
    ) {
      // Insert the "async" keyword right after the opening parenthesis,
      // turning "(() => {" into "(async () => {".
      // We build the new string to avoid shifting indexes mid-scan.
      code = `${code.slice(0, fnStart + 1)}async ${code.slice(fnStart + 1)}`
      changed = true
      // Move the scanning position forward past the newly inserted keyword
      pos = fnStart + 1 + 'async '.length
      continue
    }

    // If no change was needed for this wrapper, continue scanning after its body
    pos = bodyEnd
  }

  // Return the updated code only if we made changes; this helps preserve referential
  // equality for callers relying on it when no transformation was necessary
  return changed ? code : input
}
