import process from 'node:process'
import type { Options } from './options'

interface ParseResult {
  debug: boolean
  filePath?: string
  preset?: string
  beforeArgs: string[]
  afterArgs: string[]
}

function parseCLIArguments(argv: string[]): ParseResult {
  let debug = false
  let preset: string | undefined
  let filePath: string | undefined
  const beforeArgs: string[] = []
  const afterArgs: string[] = []
  let expectFilePathAfterDelimiter = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (filePath !== undefined) {
      if (argument === '--') {
        afterArgs.push(...argv.slice(index + 1))
        break
      }
      afterArgs.push(argument)
      continue
    }

    if (expectFilePathAfterDelimiter) {
      filePath = argument
      expectFilePathAfterDelimiter = false
      continue
    }

    if (argument === '--') {
      expectFilePathAfterDelimiter = true
      beforeArgs.push(argument)
      continue
    }

    if (argument === '--debug') {
      debug = true
      beforeArgs.push(argument)
      continue
    }

    if (argument === '--no-debug') {
      debug = false
      beforeArgs.push(argument)
      continue
    }

    if (argument.startsWith('--preset=')) {
      preset = argument.slice('--preset='.length)
      beforeArgs.push(argument)
      continue
    }

    if (argument === '--preset') {
      const presetValue = argv[index + 1]
      if (!presetValue || presetValue.startsWith('-')) {
        throw new Error('[unrun] Missing preset value after --preset')
      }
      preset = presetValue
      beforeArgs.push(argument, presetValue)
      index += 1
      continue
    }

    if (argument.startsWith('-')) {
      beforeArgs.push(argument)
      continue
    }

    filePath = argument
  }

  return {
    debug,
    preset,
    filePath,
    beforeArgs,
    afterArgs,
  }
}

async function runCLI(): Promise<void> {
  // Parse the CLI arguments
  let parsedArguments: ParseResult
  try {
    parsedArguments = parseCLIArguments(process.argv.slice(2))
  } catch (error) {
    console.error((error as Error).message)
    process.exit(1)
  }

  // Verify that a file path was provided
  if (!parsedArguments.filePath) {
    console.error('[unrun] No input files provided')
    process.exit(1)
  }

  // Only keep arguments meant for the target module after the file path.
  process.argv = [
    process.argv[0],
    parsedArguments.filePath,
    ...parsedArguments.afterArgs,
  ]

  try {
    const { unrunCli } = await import('./index')
    const cliResult = await unrunCli(
      {
        path: parsedArguments.filePath,
        debug: parsedArguments.debug,
        preset: parsedArguments.preset as Options['preset'],
      },
      parsedArguments.afterArgs,
    )

    process.exit(cliResult.exitCode)
  } catch (error) {
    console.error((error as Error).message)
    process.exit(1)
  }
}

runCLI().catch((error) => {
  console.error((error as Error).message)
  process.exit(1)
})
