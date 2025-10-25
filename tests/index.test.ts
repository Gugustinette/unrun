import { describe, expect, test } from 'vitest'
import { unrun } from '../src'

describe('unrun', () => {
  test('should load config from ts', async () => {
    const { module: config } = await unrun({
      path: './tests/fixtures/custom.config.ts',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from esm', async () => {
    const { module: config } = await unrun({
      path: './tests/fixtures/custom.config.mjs',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from cjs', async () => {
    const { module: config } = await unrun({
      path: './tests/fixtures/custom.config.cjs',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from json', async () => {
    const { module: config } = await unrun({
      path: './tests/fixtures/custom.config.json',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })
})
