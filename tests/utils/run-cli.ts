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
export const unrunCliEntry: string = resolve(repoRoot, 'dist/cli.js')

const require = createRequire(import.meta.url)
const jitiPackagePath = require.resolve('jiti/package.json')
const jitiPackage = require('jiti/package.json') as {
  bin?: string | Record<string, string>
}

let jitiBinRelative: string | undefined

if (typeof jitiPackage.bin === 'string') {
  jitiBinRelative = jitiPackage.bin
} else {
  jitiBinRelative = jitiPackage.bin?.jiti
}

if (!jitiBinRelative) {
  throw new Error('Unable to resolve jiti binary path')
}

export const jitiCliEntry: string = resolve(
  dirname(jitiPackagePath),
  jitiBinRelative,
)

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

export function runJitiCli(
  modulePath: string,
): Promise<{ stdout: string; stderr: string }> {
  return runNodeCli(jitiCliEntry, [modulePath])
}

export function runUnrunCli(
  modulePath: string,
): Promise<{ stdout: string; stderr: string }> {
  return runNodeCli(unrunCliEntry, [modulePath, '--preset', 'jiti'])
}
