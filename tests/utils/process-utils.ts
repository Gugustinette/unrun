import { readFile } from 'node:fs/promises'
import process from 'node:process'
import type { ChildProcess } from 'node:child_process'

export async function waitForProcessExit(child: ChildProcess): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    child.once('exit', () => resolve())
    child.once('error', (error) => reject(error))
  })
}

export async function waitForPidFile(
  pidFilePath: string,
  timeoutMs = 5_000,
): Promise<number> {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    try {
      const contents = await readFile(pidFilePath, 'utf8')
      const pid = Number.parseInt(contents.trim(), 10)
      if (!Number.isNaN(pid)) {
        return pid
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
    await delay(50)
  }

  throw new Error(`Timed out waiting for pid file ${pidFilePath}`)
}

export async function waitForProcessTermination(
  pid: number,
  timeoutMs = 5_000,
): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (!isProcessAlive(pid)) {
      return
    }
    await delay(50)
  }

  throw new Error(`Process ${pid} did not exit in time`)
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
      return false
    }
    return true
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
