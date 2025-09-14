import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Create jiti instance relative to this test file
const jiti = createJiti(__dirname, { interopDefault: true })

// Jiti's fixtures
const fixtures = [
  './async/index.js',
  './circular/index.js',
  // './data-uri/index.ts',
  // './deps/index.ts',
  // './env/index.js',
  // './error-parse/index.ts',
  // './error-runtime/index.ts',
  // './esm/index.js',
  './hashbang/index.ts',
  './import-map/index.mjs',
  // './import-meta/index.ts',
  // './json/index.ts',
  // './jsx/index.ts',
  './mixed/index.cjs',
  './native/index.js',
  // './proto/index.js',
  // './pure-esm-dep/index.js',
  // './require-esm/index.cjs',
  './require-json/index.js',
  './syntax/index.ts',
  // './top-level-await/index.ts',
  // './typescript/index.ts',
]

describe.concurrent('backward compatibility with jiti', () => {
  for (const fixture of fixtures) {
    const fixturePath = resolve(__dirname, 'fixtures/jiti', fixture)

    test(fixture, async () => {
      // Load the module with jiti
      const jitiMod = await jiti.import(fixturePath)

      // Load the module with unrun
      const unrunMod = await unrun({ path: fixturePath })

      // Compare the results
      // @ts-ignore
      expect(unrunMod).toEqual(jitiMod.default)
    })
  }
})
