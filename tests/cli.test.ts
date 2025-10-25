import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { runNodeCli, unrunCliEntry } from './utils/run-cli'

const fixturePath = resolve(__dirname, 'fixtures/cli.fixture.ts')

describe('cli', () => {
  test('should display nothing when no command line arguments are given', async () => {
    const { stdout, stderr } = await runNodeCli(unrunCliEntry, [fixturePath])

    // Snapshot the outputs
    expect(stdout).toMatchSnapshot('cli-no-args')
    expect(stderr).toMatchSnapshot('cli-no-args-stderr')
  })

  test('should not display command line arguments before the file path', async () => {
    const { stdout, stderr } = await runNodeCli(unrunCliEntry, [
      '--option-that-should-not-appear',
      fixturePath,
      '--some-arg',
      'value',
      '--another-arg=42',
    ])

    // Snapshot the outputs
    expect(stdout).toMatchSnapshot('cli-with-args')
    expect(stderr).toMatchSnapshot('cli-with-args-stderr')
  })
})
