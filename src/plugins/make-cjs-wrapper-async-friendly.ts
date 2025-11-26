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

          const wrapperMarkers = ['__commonJS({', '__commonJSMin(']
          if (!wrapperMarkers.some((marker) => code.includes(marker))) continue

          const arrowToken = '(() => {'
          const asyncArrowToken = '(async () => {'

          const patchMarker = (marker: string) => {
            let pos = 0

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
                /\bawait\b/.test(body) &&
                code.slice(fnStart, fnStart + asyncArrowToken.length) !==
                  asyncArrowToken
              ) {
                code = `${code.slice(0, fnStart + 1)}async ${code.slice(fnStart + 1)}`
                pos = fnStart + 1 + 'async '.length
                continue
              }

              pos = bodyEnd
            }
          }

          for (const marker of wrapperMarkers) {
            patchMarker(marker)
          }

          if (code !== chunk.code) {
            chunk.code = code
          }
        }
      },
    },
  }
}
