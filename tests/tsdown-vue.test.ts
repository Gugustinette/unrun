import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'
import { captureConsole } from './utils/capture-console'
import { normalizeOutput } from './utils/normalize-output'
import { repoRoot, runTsdownCli } from './utils/run-cli'

describe('unrun', () => {
  test('should load tsdown config file with unplugin-vue', async () => {
    // Resolve fixture path
    const fixturePath = resolve(
      __dirname,
      'fixtures/tsdown-vue/tsdown.config.ts',
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
      ['-c', 'tsdown.config.ts'],
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
