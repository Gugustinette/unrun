import { runNodeCli, unrunCliEntry } from './run-cli'

export function extractExitCode(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'number'
  ) {
    return (error as { code: number }).code
  }
  return null
}

export async function getCliExitCode(modulePath: string): Promise<number> {
  try {
    await runNodeCli(unrunCliEntry, [modulePath])
    return 0
  } catch (error) {
    const exitCode = extractExitCode(error)
    if (exitCode !== null) {
      return exitCode
    }
    throw error
  }
}
