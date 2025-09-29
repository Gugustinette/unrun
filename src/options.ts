export interface Options {
  /**
   * The path to the file to be imported.
   * @default 'custom.config.ts'
   */
  path?: string

  /**
   * The preset to use for output generation.
   * @default 'jiti'
   */
  outputPreset?: 'jiti' | 'none' | 'bundle-require'

  /**
   * Whether to make Rolldown's CommonJS wrappers async-friendly.
   * This is necessary if the code being imported uses top-level await
   * inside a CommonJS module.
   * @default true
   */
  makeCjsWrapperAsyncFriendly?: boolean
}

export interface ResolvedOptions {
  /**
   * The path to the file to be imported.
   * @default 'custom.config.ts'
   */
  path: string

  /**
   * The preset to use for output generation.
   * @default 'jiti'
   */
  outputPreset: 'jiti' | 'none' | 'bundle-require'

  /**
   * Whether to make Rolldown's CommonJS wrappers async-friendly.
   * This is necessary if the code being imported uses top-level await
   * inside a CommonJS module.
   * @default true
   */
  makeCjsWrapperAsyncFriendly: boolean
}

export function resolveOptions(options: Options = {}): ResolvedOptions {
  return {
    path: options.path || 'custom.config.ts',
    outputPreset: options.outputPreset || 'jiti',
    makeCjsWrapperAsyncFriendly: options.makeCjsWrapperAsyncFriendly ?? true,
  }
}
