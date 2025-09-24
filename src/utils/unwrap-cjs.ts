/**
 * Unwrap rolldown's __commonJS wrappers that contain top-level await.
 *
 * Why:
 * - Rolldown may transform certain modules using __commonJS wrappers. If the
 *   wrapped body contains `await`, keeping the wrapper would make the code
 *   invalid under ESM parsing rules (await not allowed in non-async function).
 *
 * How:
 * - Scan output for patterns: `var <name> = __commonJS({ ... (() => { <body> }) });`
 * - If <body> contains `await`, strip the var assignment and splice in <body>.
 * - Remove any trailing `export default <name>()` calls, and as a heuristic,
 *   also strip `export default require_*()` tails.
 */
export function unwrapCjsWrapper(input: string): string {
  let code = input
  const marker = '__commonJS({'
  // Fast-path: if marker not found, skip any extra work
  if (!code.includes(marker)) return input
  let pos = 0
  let changed = false
  while (true) {
    const varIdx = code.indexOf(marker, pos)
    if (varIdx === -1) break
    const varDeclStart = code.lastIndexOf('var ', varIdx)
    if (varDeclStart === -1) {
      pos = varIdx + marker.length
      continue
    }
    const before = code.slice(varDeclStart, varIdx)
    const m = /var\s+([A-Za-z_$][\w$]*)\s*=\s*$/.exec(before)
    const varName = m?.[1] || null
    const fnStart = code.indexOf('(() => {', varIdx)
    if (fnStart === -1) {
      pos = varIdx + marker.length
      continue
    }
    const bodyStart = fnStart + '(() => {'.length
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
    if (!/\bawait\b/.test(body)) {
      // Skip past this wrapper and continue searching
      pos = bodyEnd
      continue
    }
    // Find the end of the __commonJS wrapper statement (typically '});')
    let wrapperEnd = code.indexOf('});', bodyEnd)
    if (wrapperEnd === -1) {
      const semi = code.indexOf(';', bodyEnd)
      wrapperEnd = semi === -1 ? bodyEnd : semi + 1
    } else {
      wrapperEnd += 3
    }
    // Replace the entire var assignment + wrapper with the unwrapped body
    code =
      code.slice(0, varDeclStart) +
      code.slice(bodyStart, bodyEnd) +
      code.slice(wrapperEnd)
    if (varName) {
      const exportCallRE = new RegExp(
        `export\\s+default\\s+${varName}\\s*\\(\\)\\s*;?`,
        'g',
      )
      code = code.replace(exportCallRE, '')
    }
    // Heuristic: remove any default export calling a CJS wrapper like require_foo()
    code = code.replaceAll(/export\s+default\s+require_[\w$]+\s*\(\)\s*;?/g, '')
    changed = true
    // Continue scanning from just after the inserted body
    pos = varDeclStart + (bodyEnd - bodyStart)
  }
  return changed ? code : input
}
