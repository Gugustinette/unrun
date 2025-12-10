import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'

export interface PnpRuntime {
  hasPnp: boolean
  resolvePnpApiPath: () => string | undefined
  loaderExists: (loaderPath: string) => boolean
}

const requireFn = createRequire(import.meta.url)

function defaultResolvePnpApiPath(): string | undefined {
  try {
    return requireFn.resolve('pnpapi')
  } catch {
    return undefined
  }
}

const defaultRuntime: PnpRuntime = {
  hasPnp: Boolean(process.versions?.pnp),
  resolvePnpApiPath: defaultResolvePnpApiPath,
  loaderExists: existsSync,
}

function hasFlag(
  args: string[],
  flag: '--require' | '--loader',
  expectedValue: string,
): boolean {
  for (let index = 0; index < args.length; index += 1) {
    const current = args[index]
    if (current === flag) {
      if (args[index + 1] === expectedValue) {
        return true
      }
      index += 1
      continue
    }

    if (
      current.startsWith(`${flag}=`) &&
      current.slice(flag.length + 1) === expectedValue
    ) {
      return true
    }
  }

  return false
}

/**
 * Ensures spawned Node.js processes keep Yarn PnP hooks enabled.
 * The helper prepends the appropriate `--require` and `--loader` flags
 * so that native modules (like Rolldown's bindings) stay resolvable.
 */
export function withPnpNodeArgs(
  args: string[],
  runtime: PnpRuntime = defaultRuntime,
): string[] {
  if (!runtime.hasPnp) {
    return args
  }

  const pnpApiPath = runtime.resolvePnpApiPath()
  if (!pnpApiPath) {
    return args
  }

  const patchedArgs = [...args]
  const injectedArgs: string[] = []

  if (!hasFlag(patchedArgs, '--require', pnpApiPath)) {
    injectedArgs.push('--require', pnpApiPath)
  }

  const loaderPath = path.resolve(pnpApiPath, '../.pnp.loader.mjs')
  if (
    runtime.loaderExists(loaderPath) &&
    !hasFlag(patchedArgs, '--loader', loaderPath)
  ) {
    injectedArgs.push('--loader', loaderPath)
  }

  if (injectedArgs.length === 0) {
    return patchedArgs
  }

  return [...injectedArgs, ...patchedArgs]
}
