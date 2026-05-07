import { dirname, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'
import { captureConsole } from './utils/capture-console'
import { normalizeOutput } from './utils/normalize-output'
import { repoRoot } from './utils/run-cli'

describe('source context shims', () => {
  test('should preserve source import.meta.url access patterns', async () => {
    const fixturePath = resolve(
      __dirname,
      'fixtures/source-context-shims/index.ts',
    )
    const cwd = dirname(fixturePath)

    const logs = await captureConsole(async () => {
      await unrun({
        path: fixturePath,
      })
    })

    const stdout = normalizeOutput(logs.stdout, cwd, repoRoot)
    expect(stdout).toMatchSnapshot('import-meta-url')
  })
})
