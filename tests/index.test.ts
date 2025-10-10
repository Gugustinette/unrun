import { describe, expect, test } from 'vitest'
import { unrun } from '../src'

describe('unrun', () => {
  test('should load config from ts', async () => {
    const config = await unrun({
      path: './tests/fixtures/custom.config.ts',
    })

    expect(config.default).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from esm', async () => {
    const config = await unrun({
      path: './tests/fixtures/custom.config.mjs',
    })

    expect(config.default).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from cjs', async () => {
    const config = await unrun({
      path: './tests/fixtures/custom.config.js',
    })

    expect(config.default).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from json', async () => {
    const config = await unrun({
      path: './tests/fixtures/custom.config.json',
    })

    expect(config.default).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })
})
