import type { InputOptions, OutputOptions } from 'rolldown'

export interface Options {
  /**
   * The path to the file to be imported.
   * @default 'custom.config.ts'
   */
  path?: string

  /**
   * Debug mode.
   * Wether or not to keep temporary files to help with debugging.
   * Temporary files are stored in `node_modules/.cache/unrun/` if possible,
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
   * @default 'custom.config.ts'
   */
  path: string

  /**
   * Debug mode.
   * Wether or not to keep temporary files to help with debugging.
   * Temporary files are stored in `node_modules/.cache/unrun/` if possible,
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
  return {
    path: options.path || 'custom.config.ts',
    debug: options.debug || false,
    preset: options.preset || 'none',
    inputOptions: options.inputOptions,
    outputOptions: options.outputOptions,
  }
}
