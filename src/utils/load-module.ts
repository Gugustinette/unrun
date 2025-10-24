import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import type { ResolvedOptions } from '../options'

/**
 * Import a JS module from code string.
 * Write ESM code to a temp file (prefer project-local node_modules/.unrun) and import it.
 * @param code - The JavaScript code to be imported as a module.
 * @param options - Resolved options including debug preferences.
 * @returns The imported module.
 */
export async function loadModule(
  code: string,
  options: ResolvedOptions,
): Promise<any> {
  const filenameHint = path.basename(options.path)
  let moduleUrl = ''

  try {
    // Using a stable hash from the code content can lead to conflicts
    // when multiple tests or processes run in parallel with the same code.
    // Thus, we prefer generating a random key.
    const randomKey = crypto.randomBytes(16).toString('hex')

    // Construct a readable filename: <hint>.<random>.mjs
    const fname = `${filenameHint ? `${sanitize(filenameHint)}.` : ''}${randomKey}.mjs`

    // Store in project-local cache if possible to aid debugging, tooling and dependency resolution
    const projectNodeModules = path.join(process.cwd(), 'node_modules')
    const outDir = path.join(projectNodeModules, '.unrun')
    const outFile = path.join(outDir, fname)

    // Only write the file if it doesn't exist already
    if (!fs.existsSync(outFile)) {
      try {
        // Try writing to the project-local .unrun directory
        fs.mkdirSync(outDir, { recursive: true })
        fs.writeFileSync(outFile, code, 'utf8')
      } catch {
        // If writing to the project fails (permissions, missing node_modules, etc.),
        // fall back to an OS-level temp directory
        const fallbackDir = path.join(tmpdir(), 'unrun-cache')
        const fallbackFile = path.join(fallbackDir, fname)
        fs.mkdirSync(fallbackDir, { recursive: true })
        fs.writeFileSync(fallbackFile, code, 'utf8')
        moduleUrl = pathToFileURL(fallbackFile).href
      }
    }

    // If we didn't use the fallback path, resolve the primary outFile location to a file URL
    moduleUrl = moduleUrl || pathToFileURL(outFile).href
  } catch {
    // As a last resort, embed the code directly using a data: URL
    // This avoids touching the filesystem entirely
    moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  }

  let _module
  try {
    // Dynamically import the generated module
    _module = await import(moduleUrl)
  } finally {
    // Clean up the temp file unless debug is true
    // Only applicable for file:// URLs
    if (!options.debug && moduleUrl.startsWith('file://')) {
      try {
        fs.unlinkSync(new URL(moduleUrl))
      } catch {}
    }
  }
  return _module
}

function sanitize(name: string) {
  // Allow word chars plus dot and dash
  return name.replaceAll(/[^\w.-]/g, '_')
}
