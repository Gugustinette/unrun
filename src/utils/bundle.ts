import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import {
  rolldown,
  type InputOptions,
  type OutputChunk,
  type OutputOptions,
} from 'rolldown'
import {
  createConsoleOutputCustomizer,
  createJsonLoader,
  createMakeCjsWrapperAsyncFriendlyPlugin,
  createRequireResolveFix,
  createRequireTypeofFix,
  createSourceContextShimsPlugin,
} from '../plugins'
import type { ResolvedOptions } from '../options'

export interface BundleOutput {
  chunk: OutputChunk
  dependencies: string[]
}

export async function bundle(options: ResolvedOptions): Promise<BundleOutput> {
  // Resolve tsconfig.json if present
  const resolvedTsconfigPath = path.resolve(process.cwd(), 'tsconfig.json')
  const tsconfig = existsSync(resolvedTsconfigPath)
    ? resolvedTsconfigPath
    : undefined

  // Input options (https://rolldown.rs/reference/config-options#inputoptions)
  const inputOptions: InputOptions = {
    input: options.path,
    // Use Node platform for better Node-compatible resolution & builtins
    // See https://rolldown.rs/guide/in-depth/bundling-cjs#require-external-modules
    platform: 'node',
    // Treat all non-relative and non-absolute imports as external dependencies
    external: (id: string) =>
      !id.startsWith('.') && !path.isAbsolute(id) && !id.startsWith('#'),
    // Compose feature-specific plugins
    plugins: [
      createMakeCjsWrapperAsyncFriendlyPlugin(),
      createRequireResolveFix(options),
      createSourceContextShimsPlugin(),
      // jiti-specific fixes
      ...(options.preset === 'jiti'
        ? [
            createConsoleOutputCustomizer(),
            createJsonLoader(),
            createRequireTypeofFix(),
          ]
        : []),
    ],
    transform: {
      // Keep __dirname/__filename/import.meta definitions
      define: {
        __dirname: JSON.stringify(path.dirname(options.path)),
        __filename: JSON.stringify(options.path),
        'import.meta.url': JSON.stringify(pathToFileURL(options.path).href),
        'import.meta.filename': JSON.stringify(options.path),
        'import.meta.dirname': JSON.stringify(path.dirname(options.path)),
        'import.meta.env': 'process.env',
      },
    },
    // Finally, apply user-provided overrides
    ...options.inputOptions,
  }

  // Apply tsconfig if resolved
  if (tsconfig) {
    inputOptions.tsconfig = tsconfig
  }

  // Setup bundle
  const bundle = await rolldown(inputOptions)

  // Output options (https://rolldown.rs/reference/config-options#outputoptions)
  const outputOptions: OutputOptions = {
    format: 'esm',
    inlineDynamicImports: true,
    keepNames: true,
    // Apply user-provided overrides last
    ...options.outputOptions,
  }

  // Generate bundle in memory
  const rolldownOutput = await bundle.generate(outputOptions)

  // Verify that the output is not empty
  if (!rolldownOutput.output[0]) {
    throw new Error('[unrun] No output chunk found')
  }

  // Get files involved in the bundle
  const files = await bundle.watchFiles

  // Return the output
  return {
    chunk: rolldownOutput.output[0] as OutputChunk,
    dependencies: files,
  }
}
