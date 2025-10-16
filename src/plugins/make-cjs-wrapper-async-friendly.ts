import type { Plugin } from 'rolldown'

/**
 * Transforms code strings containing CommonJS wrappers to be async-friendly.
 *
 * Rolldown may wrap CommonJS modules in a `__commonJS` function that uses
 * arrow functions. If the wrapped code contains top-level `await`, this can lead
 * to syntax errors since the callback function won't be marked as `async`.
 * This function scans for such patterns and modifies the arrow functions to
 * be `async` if they contain `await` expressions.
 */
export function createMakeCjsWrapperAsyncFriendlyPlugin(): Plugin {
  return {
    name: 'unrun-make-cjs-wrapper-async-friendly',
    generateBundle: {
      handler(_outputOptions, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue
          // Work on a mutable copy of the chunk code
          let code = chunk.code

          // Rolldown CJS helper starts as: __commonJS({ ... })
          // We use this marker to quickly skip files that don't contain such wrappers
          const marker = '__commonJS({'
          if (!code.includes(marker)) return

          // Cursor while scanning the string and a flag indicating any change
          let pos = 0

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
              code.slice(fnStart, fnStart + asyncArrowToken.length) !==
                asyncArrowToken
            ) {
              // Insert the "async" keyword right after the opening parenthesis,
              // turning "(() => {" into "(async () => {".
              // We build the new string to avoid shifting indexes mid-scan.
              code = `${code.slice(0, fnStart + 1)}async ${code.slice(fnStart + 1)}`
              // Move the scanning position forward past the newly inserted keyword
              pos = fnStart + 1 + 'async '.length
              continue
            }

            // If no change was needed for this wrapper, continue scanning after its body
            pos = bodyEnd
          }

          // Update the chunk code only if we made changes; this helps preserve referential
          if (code !== chunk.code) {
            chunk.code = code
          }
        }
      },
    },
  }
}
