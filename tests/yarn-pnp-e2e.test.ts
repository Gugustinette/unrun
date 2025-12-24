import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { runNodeCliWithNodeArgs, unrunCliEntry } from './utils/run-cli'

const fixtureRoot = resolve(__dirname, 'fixtures/yarn-pnp')
const entryPath = resolve(fixtureRoot, 'entry.ts')
const pnpApiPath = resolve(fixtureRoot, '.pnp.cjs')
const pnpLoaderPath = resolve(fixtureRoot, '.pnp.loader.mjs')
const MARKER = '[pnpe2e]'

describe('yarn pnp integration', () => {
  test('propagates pnp hooks to executed modules', async () => {
    const { stdout } = await runNodeCliWithNodeArgs(
      ['--require', pnpApiPath, '--loader', pnpLoaderPath],
      unrunCliEntry,
      ['--preset', 'jiti', entryPath],
      { cwd: fixtureRoot },
    )

    const payloadLine = stdout
      .split(/\r?\n/)
      .find((line) => line.startsWith(MARKER))

    expect(payloadLine).toBeDefined()
    const payload = JSON.parse(payloadLine!.slice(MARKER.length)) as {
      execArgv: string[]
      hasPnp: boolean
    }

    expect(payload.hasPnp).toBe(true)
    expect(payload.execArgv).toContain('--require')
    expect(payload.execArgv).toContain(pnpApiPath)
    expect(payload.execArgv).toContain('--loader')
    expect(payload.execArgv).toContain(pnpLoaderPath)
  })
})
