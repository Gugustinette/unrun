import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/**
 * Import a JS module from code string.
 * Write ESM code to a temp file (prefer project-local node_modules/.cache/unrun) and import it.
 * Cleans up file unless keepFile is true.
 * @param code - The JavaScript code to be imported as a module.
 * @param opts - Optional parameters.
 * @param opts.filenameHint - A hint for the filename to use when creating the temp file.
 * @param opts.keepFile - If true, the temp file will not be deleted after import.
 * @returns The imported module.
 */
export async function loadModule(
  code: string,
  opts: { filenameHint?: string; keepFile?: boolean } = {},
): Promise<any> {
  let moduleUrl = ''
  const { filenameHint, keepFile } = opts
  try {
    // Generate a stable filename from the code content to enable caching
    const hash = crypto.createHash('sha1').update(code).digest('hex')

    // Construct a readable filename: <hint>.<hash>.mjs
    const fname = `${filenameHint ? `${sanitize(filenameHint)}.` : ''}${hash}.mjs`

    // Store in project-local cache if possible to aid debugging and tooling
    const projectNodeModules = path.join(process.cwd(), 'node_modules')
    const outDir = path.join(projectNodeModules, '.cache', 'unrun')
    const outFile = path.join(outDir, fname)

    // Only write the file if it doesn't exist already (cache hit)
    if (!fs.existsSync(outFile)) {
      try {
        // Try writing to the project-local cache directory.
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
    // Cleanup of the temporary file unless the caller asked to keep it
    // Only applicable for file:// URLs
    if (!keepFile && moduleUrl.startsWith('file://')) {
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
