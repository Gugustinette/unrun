import {
  execFile as execFileCallback,
  type ExecFileOptionsWithStringEncoding,
} from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'

const execFile = promisify(execFileCallback) as (
  file: string,
  args: string[],
  options: ExecFileOptionsWithStringEncoding,
) => Promise<{ stdout: string; stderr: string }>

const testsDir = resolve(__dirname, '..')
export const repoRoot: string = dirname(testsDir)
export const unrunCliEntry: string = resolve(repoRoot, 'dist/cli.mjs')

const require = createRequire(import.meta.url)

function resolvePackageBin(packageName: string, binName: string): string {
  const packagePath = require.resolve(`${packageName}/package.json`)
  const packageJson = require(`${packageName}/package.json`) as {
    bin?: string | Record<string, string>
  }

  const binRelative =
    typeof packageJson.bin === 'string'
      ? packageJson.bin
      : packageJson.bin?.[binName]

  if (!binRelative) {
    throw new Error(`Unable to resolve ${packageName} binary path`)
  }

  return resolve(dirname(packagePath), binRelative)
}

export const jitiCliEntry: string = resolvePackageBin('jiti', 'jiti')
export const tsdownCliEntry: string = resolvePackageBin('tsdown', 'tsdown')

function buildExecOptions(
  overrides?: ExecFileOptionsWithStringEncoding,
): ExecFileOptionsWithStringEncoding {
  const env = overrides?.env ?? { ...process.env }

  return {
    ...overrides,
    cwd: overrides?.cwd ?? repoRoot,
    env,
    encoding: overrides?.encoding ?? 'utf8',
  }
}

export function runNodeCli(
  entry: string,
  args: string[] = [],
  options?: ExecFileOptionsWithStringEncoding,
): Promise<{ stdout: string; stderr: string }> {
  return execFile(process.execPath, [entry, ...args], buildExecOptions(options))
}

export function runNodeCliWithNodeArgs(
  nodeArgs: string[],
  entry: string,
  args: string[] = [],
  options?: ExecFileOptionsWithStringEncoding,
): Promise<{ stdout: string; stderr: string }> {
  return execFile(
    process.execPath,
    [...nodeArgs, entry, ...args],
    buildExecOptions(options),
  )
}

export function runJitiCli(
  modulePath: string,
): Promise<{ stdout: string; stderr: string }> {
  return runNodeCli(jitiCliEntry, [modulePath])
}

export function runTsdownCli(
  args: string[] = [],
  options?: ExecFileOptionsWithStringEncoding,
): Promise<{ stdout: string; stderr: string }> {
  return runNodeCli(tsdownCliEntry, args, options)
}

export function runUnrunCli(
  modulePath: string,
): Promise<{ stdout: string; stderr: string }> {
  return runNodeCli(unrunCliEntry, ['--preset', 'jiti', modulePath])
}
