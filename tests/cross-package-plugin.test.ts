import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'

const fixturesDir = resolve(__dirname, 'fixtures/cross-package-plugin')

describe('unrun', () => {
  test('should inline dependencies from cross-package plugins', async () => {
    const fixturePath = resolve(fixturesDir, 'app/config.ts')

    const { module } = await unrun({
      path: fixturePath,
    })

    expect(module).toEqual({
      banner: 'stub-license-banner',
    })
  })
})
