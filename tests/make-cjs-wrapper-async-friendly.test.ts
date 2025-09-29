import path from 'node:path'
import { beforeEach, describe, expect, test } from 'vitest'
import { resolveOptions } from '../src/options'
import { jit } from '../src/utils/jit'

describe('makeCjsWrapperAsyncFriendly', () => {
  beforeEach(() => {
    // reset side-effect marker
    delete (globalThis as any).__unwrap_test__
  })

  test('code with await inside __commonJS wrapper fails without async fix, succeeds with async fix', async () => {
    const entry = path.resolve(
      __dirname,
      './fixtures/make-cjs-wrapper-async-friendly/index.cjs',
    )

    const optionsNoFix = resolveOptions({
      path: entry,
      makeCjsWrapperAsyncFriendly: false,
    })
    const optionsWithFix = resolveOptions({ path: entry })

    // Without making async-friendly, jit should reject when importing (parse error)
    const originalError = console.error
    console.error = () => {}
    await expect(jit(optionsNoFix)).rejects.toThrow()
    console.error = originalError
    expect((globalThis as any).__unwrap_test__).toBeUndefined()

    // With async-friendly (default enabled), jit should resolve and perform the side effect
    await expect(jit(optionsWithFix)).resolves.toBeDefined()

    // Verify the side effect ran at top-level
    expect((globalThis as any).__unwrap_test__).toBe(1)
  })
})
