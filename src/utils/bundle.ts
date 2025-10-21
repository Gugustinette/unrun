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

export async function bundle(options: ResolvedOptions): Promise<OutputChunk> {
  // Input options (https://rolldown.rs/reference/config-options#inputoptions)
  const inputOptions: InputOptions = {
    input: options.path,
    // Use Node platform for better Node-compatible resolution & builtins
    // See https://rolldown.rs/guide/in-depth/bundling-cjs#require-external-modules
    platform: 'node',
    // Treat all non-relative and non-absolute imports as external dependencies,
    //   except for package "imports" specifiers (starting with '#') which we resolve ourselves.
    //   This ensures bare deps resolve from host project while allowing #imports mapping.
    external: (id: string) =>
      !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('#'),
    // Compose feature-specific plugins
    plugins: [
      createMakeCjsWrapperAsyncFriendlyPlugin(),
      createRequireResolveFix(options),
      createSourceContextShimsPlugin(),
      // jiti-specific fixes
      ...(options.outputPreset === 'jiti'
        ? [
            createConsoleOutputCustomizer(),
            createJsonLoader(),
            createRequireTypeofFix(),
          ]
        : []),
    ],
    // Resolve tsconfig.json from cwd if present
    tsconfig: path.resolve(process.cwd(), 'tsconfig.json'),
    transform: {
      // Keep __dirname/__filename/import.meta.url definitions
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
  // Return the output chunk
  return rolldownOutput.output[0]
}
