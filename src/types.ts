export interface Result {
  /**
   * The module that was loaded.
   */
  module: any
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
