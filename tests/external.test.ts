import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'
import { captureConsole } from './utils/capture-console'
import { normalizeOutput } from './utils/normalize-output'
import { repoRoot, runTsdownCli, runUnrunCli } from './utils/run-cli'

describe('unrun external logic', () => {
  test('should inline dependencies from cross-package plugins', async () => {
    const fixturePath = resolve(
      __dirname,
      'fixtures/external/cross-package-plugin/app/config.ts',
    )

    const { module } = await unrun({
      path: fixturePath,
    })

    expect(module).toEqual({
      banner: 'stub-license-banner',
    })
  })

  test('should load a module that imports from nested node_modules', async () => {
    // Resolve fixture path
    const fixturePath = resolve(
      __dirname,
      'fixtures/external/nested-node-modules/custom.config.ts',
    )
    const cwd = dirname(fixturePath)

    // Import module
    let config
    await captureConsole(async () => {
      const { module } = await unrun({
        path: fixturePath,
      })
      config = module
    })
    // Verify config contents
    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
      nestedA: 'a',
    })

    // Execute unrun CLI to capture unrun's stdout
    const { stdout: unrunCliStdout } = await runUnrunCli(fixturePath)
    const unrunStdout = normalizeOutput(unrunCliStdout, cwd, repoRoot)

    // Snapshot unrun's output
    expect(unrunStdout).toMatchSnapshot('stdout-unrun')
  })

  test('should load tsdown config file with unplugin-vue', async () => {
    // Resolve fixture path
    const fixturePath = resolve(
      __dirname,
      'fixtures/external/tsdown-vue/tsdown.config.ts',
    )
    const cwd = dirname(fixturePath)
    const distDir = resolve(cwd, 'dist')

    // Import module to verify it loads correctly
    await captureConsole(async () => {
      await unrun({
        path: fixturePath,
      })
    })

    // Execute tsdown CLI to ensure the Vue config builds
    const { stdout: tsdownCliStdout } = await runTsdownCli(
      ['-c', 'tsdown.config.ts', '--config-loader', 'unrun'],
      { cwd },
    )
    const tsdownStdout = normalizeOutput(tsdownCliStdout, cwd, repoRoot)
    expect(tsdownStdout).toContain('2 files, total')
    expect(tsdownStdout).toContain('Build complete')

    const [jsBundle, dtsBundle] = await Promise.all([
      readFile(resolve(distDir, 'index.js'), 'utf8'),
      readFile(resolve(distDir, 'index.d.ts'), 'utf8'),
    ])

    expect(jsBundle).toContain('MyButton')
    expect(dtsBundle).toContain('MyButton')
  })
})
