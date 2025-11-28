import { execFile as execFileCallback } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, test } from 'vitest'

const tempCwd = path.resolve(__dirname, 'fixtures', 'ramda-workspace')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const execFile = promisify(execFileCallback)
let installPromise: Promise<unknown> | undefined

async function ensureFixtureDependencies(): Promise<void> {
  installPromise ??= execFile(pnpmCommand, ['i'], {
    cwd: tempCwd,
    env: process.env,
  })
  await installPromise
}

describe('ramda-workspace', () => {
  beforeAll(async () => {
    await ensureFixtureDependencies()
  })

  test('works as expected', async () => {
    const { stdout } = await execFile(pnpmCommand, ['run', 'build'], {
      cwd: tempCwd,
      env: process.env,
    })

    expect(stdout).toContain('example build: 24')
  })
})
