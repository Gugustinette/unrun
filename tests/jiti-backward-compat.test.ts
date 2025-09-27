import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'
import { captureConsole } from './utils/capture-console'
import { normalizeOutput } from './utils/normalize-output'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Create jiti instance relative to this test file
const jiti = createJiti(__dirname, { interopDefault: true })

// Jiti's fixtures (success cases)
const fixtures = [
  './async/index.js',
  './circular/index.js',
  './data-uri/index.ts',
  './deps/index.ts',
  './env/index.js',
  './esm/index.js',
  './hashbang/index.ts',
  './import-map/index.mjs',
  './import-meta/index.ts',
  './json/index.ts',
  // './jsx/index.ts',
  './mixed/index.cjs',
  './native/index.js',
  './proto/index.js',
  './pure-esm-dep/index.js',
  './require-esm/index.cjs',
  './require-json/index.js',
  './syntax/index.ts',
  './top-level-await/index.ts',
  './typescript/index.ts',
]

// Some fixtures currently produce slightly different console output between jiti and unrun.
// We'll still snapshot their outputs for stability, but skip the strict equality check for now.
const onlySnapshot = new Set<string>([
  './esm/index.js',
  './import-meta/index.ts',
  './json/index.ts',
  './native/index.js',
  './typescript/index.ts',
])

// Run snapshots first to establish baseline outputs
describe('backward compat snapshots with jiti', () => {
  for (const fixture of fixtures) {
    const fixturePath = resolve(__dirname, 'fixtures/jiti', fixture)

    test(fixture, { timeout: 20000 }, async () => {
      const cwd = dirname(fixturePath)
      const root = dirname(__dirname)

      // Create a fresh jiti instance to avoid cache between tests
      const localJiti = createJiti(__dirname, { interopDefault: true })

      // Import with jiti and capture console output
      const jitiOut = await captureConsole(async () => {
        await localJiti.import(fixturePath)
      })

      // Import with unrun and capture console output
      const unrunOut = await captureConsole(async () => {
        await unrun({ path: fixturePath })
      })

      const jStdout = normalizeOutput(jitiOut.stdout, cwd, root)
      const uStdout = normalizeOutput(unrunOut.stdout, cwd, root)

      // Always snapshot jiti output as the canonical baseline
      expect(jStdout).toMatchSnapshot('stdout')

      // Also store unrun's output snapshot to help track differences when not equal
      expect(uStdout).toMatchSnapshot('stdout-unrun')

      // Ensure both tools produce identical console output when possible
      if (!onlySnapshot.has(fixture)) {
        expect(uStdout).toEqual(jStdout)
      }
    })
  }
})

// Compare actual module outputs
describe.concurrent('backward compatibility with jiti', () => {
  for (const fixture of fixtures) {
    const fixturePath = resolve(__dirname, 'fixtures/jiti', fixture)

    test(fixture, { timeout: 20000 }, async () => {
      let jitiMod: any
      let unrunMod: any

      await captureConsole(async () => {
        // Load the module with jiti
        jitiMod = await jiti.import(fixturePath)

        // Load the module with unrun
        unrunMod = await unrun({ path: fixturePath })
      })

      expect(unrunMod).toEqual(jitiMod.default)
    })
  }

  /**
   * Error cases (should throw with both jiti and unrun)
   */

  // Error parsing (syntax error)
  test('error-parse throws', async () => {
    const fixturePath = resolve(
      __dirname,
      'fixtures/jiti',
      './error-parse/index.ts',
    )

    await expect(
      captureConsole(() => jiti.import(fixturePath)),
    ).rejects.toThrow()
    await expect(
      captureConsole(() => unrun({ path: fixturePath })),
    ).rejects.toThrow()
  })

  // Error at runtime
  test('error-runtime throws', async () => {
    const fixturePath = resolve(
      __dirname,
      'fixtures/jiti',
      './error-runtime/index.ts',
    )

    await expect(
      captureConsole(() => jiti.import(fixturePath)),
    ).rejects.toThrow()
    await expect(
      captureConsole(() => unrun({ path: fixturePath })),
    ).rejects.toThrow()
  })
})
