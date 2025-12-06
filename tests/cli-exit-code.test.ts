import { spawn } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, test } from 'vitest'
import { getCliExitCode } from './utils/cli-utils'
import {
  waitForPidFile,
  waitForProcessExit,
  waitForProcessTermination,
} from './utils/process-utils'
import { repoRoot, unrunCliEntry } from './utils/run-cli'

const exitCodeFixturesDir = resolve(__dirname, 'fixtures/cli-exit-code')
const exitZeroFixturePath = resolve(exitCodeFixturesDir, 'exit-0.ts')
const exitOneFixturePath = resolve(exitCodeFixturesDir, 'exit-1.ts')
const longRunningFixturePath = resolve(exitCodeFixturesDir, 'long-running.ts')

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

describe('cli termination handling', () => {
  test('terminates spawned process when receiving a termination signal', async () => {
    const pidFilePath = join(
      tmpdir(),
      `unrun-cli-child-${process.pid}-${Date.now()}.pid`,
    )

    const cliProcess = spawn(
      process.execPath,
      [unrunCliEntry, longRunningFixturePath],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          UNRUN_TEST_CHILD_PID_FILE: pidFilePath,
        },
        stdio: 'ignore',
      },
    )

    try {
      const childPid = await waitForPidFile(pidFilePath)

      cliProcess.kill('SIGTERM')
      await waitForProcessExit(cliProcess)
      await waitForProcessTermination(childPid)
    } finally {
      try {
        cliProcess.kill('SIGKILL')
      } catch {
        // The process may have already exited
      }
      await rm(pidFilePath).catch(() => {})
    }
  })
})
