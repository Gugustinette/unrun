import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { createJiti } from 'jiti'
import { assert, describe, expect, test } from 'vitest'
import { unrun } from '../src'
import { captureConsole } from './utils/capture-console'
import { normalizeOutput } from './utils/normalize-output'
import { repoRoot, runJitiCli, runUnrunCli } from './utils/run-cli'

// Enable JSX support in jiti
process.env.JITI_JSX = process.env.JITI_JSX || '1'

// Create jiti instance relative to this test file
const jiti = createJiti(import.meta.url, {
  fsCache: false,
  moduleCache: false,
})

// Jiti's fixtures (success cases)
const fixtures = [
  './async/index.js',
  './circular/index.js',
  './cjs-interop/index.cjs',
  './data-uri/index.ts',
  './deps/index.ts',
  './env/index.js',
  './esm/index.js',
  './export-promise/index.mjs',
  './hashbang/index.ts',
  './import-map/index.mjs',
  './import-meta/index.ts',
  './json/index.ts',
  // './jsx/index.ts',
  './mixed/index.cjs',
  './native/index.js',
  './node/index.mts',
  './proto/index.js',
  './pure-esm-dep/index.js',
  './require-esm/index.cjs',
  './require-json/index.js',
  // './resolve/index.ts',
  './syntax/index.ts',
  './top-level-await/index.ts',
  './typescript/index.ts',
]

// Some fixtures need to compare against jiti's default export behavior
const compareToDefault = new Set([
  './async/index.js',
  './cjs-interop/index.cjs',
  './mixed/index.cjs',
  './native/index.js',
  './require-esm/index.cjs',
  './require-json/index.js',
  './top-level-await/index.ts',
])

// Run snapshots first to establish baseline outputs
describe('backward compat snapshots with jiti', () => {
  for (const fixture of fixtures) {
    const fixturePath = resolve(__dirname, 'fixtures/jiti', fixture)

    test(fixture, { timeout: 20000 }, async () => {
      const cwd = dirname(fixturePath)

      // Execute jiti CLI to capture the canonical stdout
      const { stdout: jitiCliStdout } = await runJitiCli(fixturePath)

      // Execute unrun CLI to capture unrun's stdout
      const { stdout: unrunCliStdout } = await runUnrunCli(fixturePath)

      const jitiStdout = normalizeOutput(jitiCliStdout, cwd, repoRoot)
      const unrunStdout = normalizeOutput(unrunCliStdout, cwd, repoRoot)

      // Always snapshot jiti output as the canonical baseline
      expect(jitiStdout).toMatchSnapshot('stdout-jiti')

      // Also store unrun's output snapshot to help track differences when not equal
      expect(unrunStdout).toMatchSnapshot('stdout-unrun')

      // Ensure both tools produce identical console output
      expect(unrunStdout).toEqual(jitiStdout)
    })
  }
})

// Compare actual module outputs
describe.concurrent('backward compatibility with jiti', () => {
  for (const fixture of fixtures) {
    const fixturePath = resolve(__dirname, 'fixtures/jiti', fixture)

    test(fixture, { timeout: 20000 }, async () => {
      let jitiModule: any
      let unrunModule: any

      await captureConsole(async () => {
        // Load the module with jiti
        jitiModule = await jiti.import(fixturePath)

        // Load the module with unrun
        unrunModule = await unrun({ path: fixturePath, preset: 'jiti' })
      })

      if (compareToDefault.has(fixture)) {
        jitiModule = jitiModule?.default ?? jitiModule
      }

      expect(unrunModule).toEqual(jitiModule)
      assert.deepEqual(unrunModule, jitiModule)
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
