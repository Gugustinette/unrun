/* eslint-disable no-console */
import { format } from 'node:util'

export async function captureConsole<T>(fn: () => Promise<T> | T): Promise<{
  stdout: string
  stderr: string
}> {
  const logs: string[] = []
  const errors: string[] = []

  const orig = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }

  const push = (arr: string[], args: any[]) => {
    try {
      arr.push(format(...(args as any)))
    } catch {
      arr.push(args.map(String).join(' '))
    }
  }

  console.log = (...a: any[]) => push(logs, a)
  console.info = (...a: any[]) => push(logs, a)
  console.warn = (...a: any[]) => push(logs, a)
  console.error = (...a: any[]) => push(errors, a)

  try {
    await fn()
    // Allow microtasks and short async logs to flush
    await new Promise((r) => setTimeout(r, 25))
  } finally {
    console.log = orig.log
    console.info = orig.info
    console.warn = orig.warn
    console.error = orig.error
  }

  return { stdout: logs.join('\n'), stderr: errors.join('\n') }
}
