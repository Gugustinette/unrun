import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import {
  build,
  type InputOptions,
  type OutputOptions,
  type RolldownOutput,
} from 'rolldown'
import {
  createMakeCjsWrapperAsyncFriendlyPlugin,
  createRequireResolveFix,
  createRequireTypeofFix,
  createSourceContextShimsPlugin,
} from '../plugins'
import type { ResolvedOptions } from '../options'

export async function bundle(options: ResolvedOptions): Promise<{
  outDir: string
  rolldownOutput: RolldownOutput
}> {
  // Resolve the file path to an absolute path
  options.path = path.resolve(process.cwd(), options.path)
  // Ensure output directory exists
  const unrunOutDir = path.join(process.cwd(), 'node_modules', '.unrun')
  fs.mkdirSync(unrunOutDir, { recursive: true })
  // Compute key for output filename
  const moduleKey = randomBytes(16).toString('hex')
  // Create directory dedicated to this module to avoid collisions
  const outDir = path.join(unrunOutDir, moduleKey)
  fs.mkdirSync(outDir, { recursive: true })

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
      // Inject __dirname/__filename/import.meta shims and inline import.meta.resolve
      createSourceContextShimsPlugin(),
      // Make CJS wrappers async-friendly
      options.makeCjsWrapperAsyncFriendly
        ? createMakeCjsWrapperAsyncFriendlyPlugin()
        : null,
      // Fix require.resolve calls to use correct base path
      createRequireResolveFix(options),
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
    ...options.inputOptions,
  }

  // Output options (https://rolldown.rs/reference/config-options#outputoptions)
  const outputOptions: OutputOptions = {
    dir: outDir,
    format: 'esm',
    // Apply user-provided overrides
    ...options.outputOptions,
  }

  // Let Rolldown handle writing the bundle to disk
  const rolldownOutput = await build({
    ...inputOptions,
    output: outputOptions,
  })

  // Return the output file path
  return {
    outDir,
    rolldownOutput,
  }
}
