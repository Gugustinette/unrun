import { describe, expect, test } from 'vitest'
// @ts-ignore : dist won't be there during CI type checks
import { unrunSync } from '../dist'

describe('unrun', () => {
  test('should load config from ts', () => {
    const { module: config } = unrunSync({
      path: './tests/fixtures/custom.config.ts',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from esm', () => {
    const { module: config } = unrunSync({
      path: './tests/fixtures/custom.config.mjs',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from cjs', () => {
    const { module: config } = unrunSync({
      path: './tests/fixtures/custom.config.cjs',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })

  test('should load config from json', () => {
    const { module: config } = unrunSync({
      path: './tests/fixtures/custom.config.json',
    })

    expect(config).toEqual({
      entry: './src/index.ts',
      dir: 'parentDir/dist',
    })
  })
})
