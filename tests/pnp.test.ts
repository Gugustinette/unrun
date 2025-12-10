import { describe, expect, it } from 'vitest'
import { withPnpNodeArgs, type PnpRuntime } from '../src/utils/module/pnp'

describe('withPnpNodeArgs', () => {
  const mockRuntime: PnpRuntime = {
    hasPnp: true,
    resolvePnpApiPath: () => '/workspace/.pnp.cjs',
    loaderExists: (loaderPath) => loaderPath.endsWith('.pnp.loader.mjs'),
  }

  it('prepends Yarn PnP flags when needed', () => {
    const result = withPnpNodeArgs(['--eval', 'console.log("ok")'], mockRuntime)

    expect(result).toEqual([
      '--require',
      '/workspace/.pnp.cjs',
      '--loader',
      '/workspace/.pnp.loader.mjs',
      '--eval',
      'console.log("ok")',
    ])
  })

  it('avoids duplicating flags when already present', () => {
    const baseArgs = ['--require', '/workspace/.pnp.cjs', 'script.mjs']
    const result = withPnpNodeArgs(baseArgs, mockRuntime)

    expect(result).toEqual([
      '--loader',
      '/workspace/.pnp.loader.mjs',
      '--require',
      '/workspace/.pnp.cjs',
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
