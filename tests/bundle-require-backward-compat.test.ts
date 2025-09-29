import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundleRequire } from 'bundle-require'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'
import { captureConsole } from './utils/capture-console'

const __dirname = dirname(fileURLToPath(import.meta.url))

// bundle-require fixtures (success cases)
const fixtures = [
  './input.ts',
  './a.ts',
  './preserve-temporary-file/input.ts',
  './replace-path/input.ts',
]

// Some fixtures have known semantic differences in outputs
const skipModuleEquality = new Set<string>(['./input.ts'])

// Compare module outputs
describe.concurrent('backward compatibility with bundle-require', () => {
  for (const fixture of fixtures) {
    const fixturePath = resolve(__dirname, 'fixtures/bundle-require', fixture)

    test(fixture, { timeout: 20000 }, async () => {
      let bundleModule: any
      let unrunModule: any

      await captureConsole(async () => {
        // Load the module with bundle-require
        const result = await bundleRequire({ filepath: fixturePath })
        bundleModule = result.mod

        // Load the module with unrun
        unrunModule = await unrun({
          path: fixturePath,
          outputPreset: 'none',
        })
      })

      if (!skipModuleEquality.has(fixture)) {
        expect(unrunModule).toEqual(bundleModule)
      }
    })
  }

  /**
   * Error cases (should throw with both bundle-require and unrun)
   */

  // Intentionally unresolved dependency from node_modules
  test('ignore-node_modules throws when unresolved', async () => {
    const fixturePath = resolve(
      __dirname,
      'fixtures/bundle-require',
      './ignore-node_modules/input.ts',
    )

    await expect(
      captureConsole(() => bundleRequire({ filepath: fixturePath })),
    ).rejects.toThrow()
    await expect(
      captureConsole(() => unrun({ path: fixturePath })),
    ).rejects.toThrow()
  })

  // tsconfig paths resolution may not be enabled by default; expecting both to error
  test('resolve-tsconfig-paths throws without path resolution', async () => {
    const fixturePath = resolve(
      __dirname,
      'fixtures/bundle-require',
      './resolve-tsconfig-paths/input.ts',
    )

    await expect(
      captureConsole(() => bundleRequire({ filepath: fixturePath })),
    ).rejects.toThrow()
    await expect(
      captureConsole(() => unrun({ path: fixturePath })),
    ).rejects.toThrow()
  })
})
