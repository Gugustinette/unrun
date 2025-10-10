import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/**
 * Import a JS module from code string.
 * Write ESM code to a temp file (prefer project-local node_modules/.unrun) and import it.
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
  let moduleUrl: string | null = null
  const { filenameHint, keepFile } = opts
  try {
    const hash = crypto.createHash('sha1').update(code).digest('hex')
    const fname = `${filenameHint ? `${sanitize(filenameHint)}.` : ''}${hash}.mjs`
    const projectNodeModules = path.join(process.cwd(), 'node_modules')
    const outDir = path.join(projectNodeModules, '.unrun')
    const outFile = path.join(outDir, fname)
    if (!fs.existsSync(outFile)) {
      try {
        fs.mkdirSync(outDir, { recursive: true })
        fs.writeFileSync(outFile, code, 'utf8')
      } catch {
        const fallbackDir = path.join(tmpdir(), 'unrun-cache')
        const fallbackFile = path.join(fallbackDir, fname)
        fs.mkdirSync(fallbackDir, { recursive: true })
        fs.writeFileSync(fallbackFile, code, 'utf8')
        moduleUrl = pathToFileURL(fallbackFile).href
      }
    }
    moduleUrl = moduleUrl || pathToFileURL(outFile).href
  } catch {
    moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  }

  let _module
  try {
    _module = await import(moduleUrl)
  } finally {
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
