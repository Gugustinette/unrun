import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import type { CliResult } from '../../types'

/**
 * Execute the module at the given URL, in a separate Node.js process.
 * @param moduleUrl - The URL of the module to execute.
 * @param args - Additional command-line arguments to pass to the Node.js process.
 * @returns A promise that resolves when the module execution is complete.
 */
export function execModule(
  moduleUrl: string,
  args: string[] = [],
): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    // Get node executable path
    const nodePath = process.execPath
    const spawnArgs: string[] = []

    // If the moduleUrl is a data URL, extract the code
    if (moduleUrl.startsWith('data:')) {
      const commaIndex = moduleUrl.indexOf(',')
      if (commaIndex === -1) {
        reject(new Error('[unrun]: Invalid data URL for module execution'))
        return
      }
      const metadata = moduleUrl.slice(5, commaIndex)
      const payload = moduleUrl.slice(commaIndex + 1)
      const isBase64 = metadata.endsWith(';base64')
      // Decode the code from the data URL
      const code = isBase64
        ? Buffer.from(payload, 'base64').toString('utf8')
        : decodeURIComponent(payload)

      // Pass the code via --eval
      spawnArgs.push('--input-type=module', '--eval', code)
    }
    // Otherwise, treat as file or other URL
    else {
      let modulePath = moduleUrl

      if (moduleUrl.startsWith('file://')) {
        try {
          modulePath = fileURLToPath(moduleUrl)
        } catch (error) {
          reject(
            new Error(
              `[unrun]: Failed to resolve module URL ${moduleUrl}: ${(error as Error).message}`,
            ),
          )
          return
        }
      }

      // Pass the module path directly
      spawnArgs.push(modulePath)
    }

    const childProcess = spawn(nodePath, [...spawnArgs, ...args], {
      // Inherit stdio so that output appears in the parent process console
      stdio: ['inherit', 'inherit', 'inherit'],
    })

    childProcess.on('close', (exitCode) => {
      resolve({
        exitCode: exitCode ?? 0,
      })
    })
    childProcess.on('error', (error) => {
      reject(
        new Error(`[unrun]: Failed to start child process: ${error.message}`),
      )
    })
  })
}
