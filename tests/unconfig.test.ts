import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { loadConfig } from 'unconfig'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'

describe('unrun', () => {
  test('should be compatible with unconfig', async () => {
    const { config: configUnconfig } = await loadConfig.async<any>({
      sources: [
        {
          files: 'custom.config',
          extensions: ['ts'],
          parser: async (id: string) => {
            return (
              await unrun({
                path: pathToFileURL(id).href,
              })
            ).module
          },
        },
      ],
      cwd: path.resolve(process.cwd(), './tests/fixtures/'),
    })

    const { module: configUnrun } = await unrun({
      path: './tests/fixtures/custom.config.ts',
    })

    expect(configUnrun).toEqual(configUnconfig)
  })
})
