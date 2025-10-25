export interface Result {
  /**
   * The module that was loaded.
   */
  module: any
}

export interface CliResult {
  /**
   * The exit code of the CLI execution.
   */
  exitCode: number
}
