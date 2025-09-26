import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { beforeEach, describe, expect, test } from 'vitest'
import { bundle } from '../src/utils/bundle'
import { unwrapCjsWrapper } from '../src/utils/unwrap-cjs'

function writeTempModule(code: string): string {
  const dir = path.join(tmpdir(), 'unrun-unwrap-tests')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(
    dir,
    `${Date.now()}-${randomBytes(6).toString('hex')}.mjs`,
  )
  fs.writeFileSync(file, code, 'utf8')
  return pathToFileURL(file).href
}

describe('unwrapCjsWrapper', () => {
  beforeEach(() => {
    // reset side-effect marker
    delete (globalThis as any).__unwrap_test__
  })

  test('code with TLA inside __commonJS wrapper fails without unwrap, succeeds with unwrap', async () => {
    // Bundle a real fixture that contains top-level await and CommonJS export.
    // Rolldown will wrap it with __commonJS, which is incompatible with TLA until unwrapped.
    const entry = path.resolve(__dirname, './fixtures/unwrap-tla/index.cjs')
    const out = await bundle(entry)
    const generated = out.code

    // Ensure rolldown produced a __commonJS wrapper
    expect(generated).toContain('__commonJS({')

    // Without unwrapping, dynamic import should reject (parse error)
    const wrappedUrl = writeTempModule(generated)
    await expect(import(wrappedUrl)).rejects.toThrow()

    // After unwrapping, dynamic import should resolve and perform the side effect
    const unwrapped = unwrapCjsWrapper(generated)
    // Ensure Vite/Rollup parse as ESM to allow TLA
    const unwrappedEsm = `${unwrapped}\nexport {}\n`
    const unwrappedUrl = writeTempModule(unwrappedEsm)
    await expect(import(unwrappedUrl)).resolves.toBeDefined()

    // Verify the side effect ran at top-level
    expect((globalThis as any).__unwrap_test__).toBe(1)
  })
})
