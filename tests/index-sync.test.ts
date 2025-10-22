import { describe, expect, test } from 'vitest'
import { unrunSync } from '../dist'

describe('unrun', () => {
  test('should load config from ts', () => {
    const config = unrunSync({
      path: './tests/fixtures/custom.config.ts',
    })

    expect(config.default).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from esm', () => {
    const config = unrunSync({
      path: './tests/fixtures/custom.config.mjs',
    })

    expect(config.default).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from cjs', () => {
    const config = unrunSync({
      path: './tests/fixtures/custom.config.cjs',
    })

    expect(config.default).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from json', () => {
    const config = unrunSync({
      path: './tests/fixtures/custom.config.json',
    })

    expect(config.default).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })
})
