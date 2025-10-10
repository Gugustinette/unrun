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
    platform: 'node' as const,
    // Treat all non-relative and non-absolute imports as external dependencies,
    //   except for package "imports" specifiers (starting with '#') which we resolve ourselves.
    //   This ensures bare deps resolve from host project while allowing #imports mapping.
    external: (id: string) =>
      !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('#'),
    // Keep __dirname/__filename/import.meta.url definitions
    define: {
      __dirname: JSON.stringify(path.dirname(options.path)),
      __filename: JSON.stringify(options.path),
      'import.meta.url': JSON.stringify(pathToFileURL(options.path).href),
      'import.meta.filename': JSON.stringify(options.path),
      'import.meta.dirname': JSON.stringify(path.dirname(options.path)),
      'import.meta.env': 'process.env',
    },
    // Compose feature-specific plugins
    plugins: [
      // Handle JSON very early so entry JSON paths are rewritten to JS
      createJsonLoader(),
      // Inject __dirname/__filename/import.meta shims and inline import.meta.resolve
      createSourceContextShimsPlugin(),
      // Fix require.resolve calls to use correct base path
      createRequireResolveFix(options),
      // Customize console output for namespace objects
      createConsoleOutputCustomizer(),
      // Fix typeof require in ESM
      createRequireTypeofFix(),
    ],
    // Resolve tsconfig.json from cwd if present
    tsconfig: path.resolve(process.cwd(), 'tsconfig.json'),
    keepNames: true,
    // Configure JSX support with classic mode for pragma support
    jsx: {
      mode: 'classic',
      factory: 'React.createElement',
      fragment: 'React.Fragment',
    },
    // Finally, apply user-provided overrides
    ...(options.inputOptions ?? {}),
  }

  // Setup bundle
  const bundle = await rolldown(inputOptions)

  // Output options (https://rolldown.rs/reference/config-options#outputoptions)
  const outputOptions: OutputOptions = {
    format: 'esm',
    inlineDynamicImports: true,
    // Apply user-provided overrides last
    ...(options.outputOptions ?? {}),
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
