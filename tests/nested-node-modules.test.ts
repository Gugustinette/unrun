import { dirname, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'
import { captureConsole } from './utils/capture-console'
import { normalizeOutput } from './utils/normalize-output'
import { repoRoot, runUnrunCli } from './utils/run-cli'

describe('unrun', () => {
  test('should load a module that imports from nested node_modules', async () => {
    // Resolve fixture path
    const fixturePath = resolve(
      __dirname,
      'fixtures/nested-node-modules/custom.config.ts',
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
})
