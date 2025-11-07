import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { normalizePath } from './utils/normalize-path'
import type { InputOptions, OutputOptions } from 'rolldown'

export interface Options {
  /**
   * The path to the file to be imported. Supports filesystem paths, file URLs or URL objects.
   * @default 'index.ts'
   */
  path?: string | URL

  /**
   * Debug mode.
   * Wether or not to keep temporary files to help with debugging.
   * Temporary files are stored in `node_modules/.unrun/` if possible,
   * otherwise in the OS temporary directory.
   * @default false
   */
  debug?: boolean

  /**
   * The preset to use for bundling and output format.
   * @default 'none'
   */
  preset?: 'none' | 'jiti' | 'bundle-require'

  /**
   * Additional rolldown input options. These options will be merged with the
   * defaults provided by unrun, with these options always taking precedence.
   */
  inputOptions?: InputOptions

  /**
   * Additional rolldown output options. These options will be merged with the
   * defaults provided by unrun, with these options always taking precedence.
   */
  outputOptions?: OutputOptions
}

export interface ResolvedOptions {
  /**
   * The path to the file to be imported.
   * @default 'index.ts'
   */
  path: string

  /**
   * Debug mode.
   * Wether or not to keep temporary files to help with debugging.
   * Temporary files are stored in `node_modules/.unrun/` if possible,
   * otherwise in the OS temporary directory.
   * @default false
   */
  debug: boolean

  /**
   * The preset to use for bundling and output format.
   * @default 'none'
   */
  preset: 'none' | 'jiti' | 'bundle-require'

  /**
   * Additional rolldown input options. These options will be merged with the
   * defaults provided by unrun, with these options always taking precedence.
   */
  inputOptions?: InputOptions

  /**
   * Additional rolldown output options. These options will be merged with the
   * defaults provided by unrun, with these options always taking precedence.
   */
  outputOptions?: OutputOptions
}

export function resolveOptions(options: Options = {}): ResolvedOptions {
  const resolvedOptions: ResolvedOptions = {
    path: path.resolve(process.cwd(), normalizePath(options.path)),
    debug: options.debug || false,
    preset: options.preset || 'none',
    inputOptions: options.inputOptions,
    outputOptions: options.outputOptions,
  }

  // Check if the file exists
  if (!fs.existsSync(resolvedOptions.path)) {
    throw new Error(`[unrun] File not found: ${resolvedOptions.path}`)
  }

  // Verify that the preset is valid
  const validPresets = new Set(['none', 'jiti', 'bundle-require'])
  if (!validPresets.has(resolvedOptions.preset)) {
    throw new Error(
      `[unrun] Invalid preset "${resolvedOptions.preset}" (expected: none | jiti | bundle-require)`,
    )
  }

  return resolvedOptions
}
