import { execFile as execFileCallback } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, test } from 'vitest'

const tempCwd = path.resolve(__dirname, 'fixtures', 'ramda-workspace')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const execOptions = {
  cwd: tempCwd,
  env: Object.fromEntries(
    Object.entries(process.env).flatMap(([key, value]) =>
      value == null ? [] : [[key, String(value)]],
    ),
  ) as NodeJS.ProcessEnv,
  shell: process.platform === 'win32' ? true : undefined,
}

const execFile = promisify(execFileCallback)
let installPromise: Promise<unknown> | undefined

async function ensureFixtureDependencies(): Promise<void> {
  installPromise ??= execFile(pnpmCommand, ['i'], execOptions)
  await installPromise
}

describe('ramda-workspace', () => {
  beforeAll(async () => {
    await ensureFixtureDependencies()
  }, 60000)

  test('works as expected', async () => {
    const { stdout } = await execFile(
      pnpmCommand,
      ['run', 'build'],
      execOptions,
    )

    expect(stdout).toContain('example build: 24')
  })
})
