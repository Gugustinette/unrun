import { describe, expect, test } from 'vitest'
import { loadConfig } from '../src'

describe('loadConfig', () => {
  test('should load config from ts', async () => {
    const config = await loadConfig({
      path: './tests/fixtures/custom.config.ts',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from esm', async () => {
    const config = await loadConfig({
      path: './tests/fixtures/custom.config.mjs',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from cjs', async () => {
    const config = await loadConfig({
      path: './tests/fixtures/custom.config.js',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from json', async () => {
    const config = await loadConfig({
      path: './tests/fixtures/custom.config.json',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })
})
