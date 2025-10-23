import process from 'node:process'
import { cac } from 'cac'
import { version } from '../package.json'
import type { Options } from './options'

const cli = cac('unrun')
cli.help().version(version)

cli
  .command('[...files]', 'Run a given JS/TS file', {
    allowUnknownOptions: true,
  })
  .option('--debug', 'Show debug logs', {
    default: false,
  })
  .option('--preset <preset>', 'Set the preset (none|jiti|bundle-require)', {
    default: 'none' as const,
  })
  .action(async (input: string[], options: Options) => {
    // Verify an input was given
    if (input.length === 0) {
      throw new Error('[unrun] No input files provided')
    }

    if (
      options.preset !== undefined &&
      options.preset !== 'none' &&
      options.preset !== 'jiti' &&
      options.preset !== 'bundle-require'
    ) {
      throw new Error(
        `[unrun] Invalid preset "${options.preset}" (expected: none | jiti | bundle-require)`,
      )
    }

    // Lazy load unrun
    const { unrun } = await import('./index')

    // Run unrun with provided options
    await unrun({
      path: input[0],
      debug: options.debug,
      preset: options.preset,
    })
  })

async function runCLI(): Promise<void> {
  cli.parse(process.argv, { run: false })

  try {
    await cli.runMatchedCommand()
  } catch (error) {
    console.error((error as Error).message)
    process.exit(1)
  }
}

runCLI()
