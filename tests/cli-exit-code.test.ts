import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { runNodeCli, unrunCliEntry } from './utils/run-cli'

const exitCodeFixturesDir = resolve(__dirname, 'fixtures/cli-exit-code')
const exitZeroFixturePath = resolve(exitCodeFixturesDir, 'exit-0.ts')
const exitOneFixturePath = resolve(exitCodeFixturesDir, 'exit-1.ts')

function extractExitCode(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'number'
  ) {
    return (error as { code: number }).code
  }
  return null
}

async function getCliExitCode(modulePath: string): Promise<number> {
  try {
    await runNodeCli(unrunCliEntry, [modulePath])
    return 0
  } catch (error) {
    const exitCode = extractExitCode(error)
    if (exitCode !== null) {
      return exitCode
    }
    throw error
  }
}

describe('cli exit codes', () => {
  test('propagates exit code 0', async () => {
    const exitCode = await getCliExitCode(exitZeroFixturePath)
    expect(exitCode).toBe(0)
  })

  test('propagates exit code 1', async () => {
    const exitCode = await getCliExitCode(exitOneFixturePath)
    expect(exitCode).toBe(1)
  })
})
