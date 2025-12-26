import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { withPnpNodeArgs, type PnpRuntime } from '../src/utils/module/pnp'

describe('withPnpNodeArgs', () => {
  const mockPnpApiPath = '/workspace/.pnp.cjs'
  const mockLoaderPath = path.resolve(mockPnpApiPath, '../.pnp.loader.mjs')
  const mockRuntime: PnpRuntime = {
    hasPnp: true,
    resolvePnpApiPath: () => mockPnpApiPath,
    loaderExists: (loaderPath) => loaderPath.endsWith('.pnp.loader.mjs'),
  }

  it('prepends Yarn PnP flags when needed', () => {
    const result = withPnpNodeArgs(['--eval', 'console.log("ok")'], mockRuntime)

    expect(result).toEqual([
      '--require',
      mockPnpApiPath,
      '--loader',
      mockLoaderPath,
      '--eval',
      'console.log("ok")',
    ])
  })

  it('avoids duplicating flags when already present', () => {
    const baseArgs = ['--require', mockPnpApiPath, 'script.mjs']
    const result = withPnpNodeArgs(baseArgs, mockRuntime)

    expect(result).toEqual([
      '--loader',
      mockLoaderPath,
      '--require',
      mockPnpApiPath,
      'script.mjs',
    ])
  })

  it('acts as a no-op when not running under PnP', () => {
    const result = withPnpNodeArgs(['script.mjs'], {
      ...mockRuntime,
      hasPnp: false,
    })

    expect(result).toEqual(['script.mjs'])
  })
})
