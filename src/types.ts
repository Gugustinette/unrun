export interface Result<T = unknown> {
  /**
   * The module that was loaded.
   * You can specify the type of the module by providing a type argument when using the `unrun` function.
   */
  module: T
  /**
   * The dependencies involved when loading the targeted module.
   * Note: this only includes local file dependencies, npm-resolved dependencies are excluded.
   */
  dependencies: string[]
}

export interface CliResult {
  /**
   * The exit code of the CLI execution.
   */
  exitCode: number
}
