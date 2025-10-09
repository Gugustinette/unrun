import fs from 'node:fs'
import { tmpdir } from 'node:os'
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
  createImportMetaResolveShim,
  createJsonLoader,
  createRequireResolveFix,
  createRequireTypeofFix,
  createSourcePathConstantsPlugin,
} from '../plugins'
import type { ResolvedOptions } from '../options'

export async function bundle(options: ResolvedOptions): Promise<OutputChunk> {
  // Check if the entry file or any dependencies import reflect-metadata
  // This helps us decide whether to enable emitDecoratorMetadata
  let needsDecoratorMetadata = false
  try {
    const entryContent = fs.readFileSync(options.path, 'utf8')
    if (/import\s+["']reflect-metadata["']/.test(entryContent)) {
      needsDecoratorMetadata = true
    }
  } catch {
    // Ignore file read errors
  }

  // Also check related files in the same directory for reflect-metadata
  if (!needsDecoratorMetadata) {
    try {
      const dir = path.dirname(options.path)
      const files = fs.readdirSync(dir)
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          try {
            const content = fs.readFileSync(path.join(dir, file), 'utf8')
            if (/import\s+["']reflect-metadata["']/.test(content)) {
              needsDecoratorMetadata = true
              break
            }
          } catch {
            // Ignore
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // Default definitions for __dirname, __filename, and import.meta properties
  const defaultDefine: InputOptions['define'] =
    // When bundle-require preset is enabled, avoid using global defines and let the plugin inject per-module values.
    options.outputPreset === 'bundle-require'
      ? undefined
      : {
          __dirname: JSON.stringify(path.dirname(options.path)),
          __filename: JSON.stringify(options.path),
          'import.meta.url': JSON.stringify(pathToFileURL(options.path).href),
          'import.meta.filename': JSON.stringify(options.path),
          'import.meta.dirname': JSON.stringify(path.dirname(options.path)),
          'import.meta.env': 'process.env',
        }

  // Compose feature-specific plugins
  const defaultPlugins: InputOptions['plugins'] = [
    // Handle JSON very early so entry JSON paths are rewritten to JS
    createJsonLoader(),
    // Inject __dirname/__filename/import.meta shims
    createSourcePathConstantsPlugin(),
    // Inline import.meta.resolve("./foo") to a file:// URL when literal
    createImportMetaResolveShim(),
    // Fix require.resolve calls to use correct base path
    createRequireResolveFix(options),
    // Customize console output for namespace objects
    createConsoleOutputCustomizer(),
    // Fix typeof require in ESM
    createRequireTypeofFix(),
  ]

  // Handle decorator metadata by creating a custom tsconfig if needed
  let tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json')
  if (needsDecoratorMetadata) {
    if (process.env.UNRUN_DEBUG === 'true') {
      console.error(
        '[unrun] Enabling decorator metadata for reflect-metadata support',
      )
    }
    try {
      // Create a temporary tsconfig that enables emitDecoratorMetadata
      const tempTsconfig = path.join(
        tmpdir(),
        `tsconfig.unrun.${Date.now()}.json`,
      )
      const baseTsconfig = fs.existsSync(tsconfigPath)
        ? JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
        : { compilerOptions: {} }

      const decoratorTsconfig = {
        ...baseTsconfig,
        compilerOptions: {
          ...baseTsconfig.compilerOptions,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
        },
      }

      fs.writeFileSync(tempTsconfig, JSON.stringify(decoratorTsconfig, null, 2))
      tsconfigPath = tempTsconfig
      if (process.env.UNRUN_DEBUG === 'true') {
        console.error('[unrun] Created temp tsconfig:', tempTsconfig)
      }
    } catch {
      // Fallback to original tsconfig if temp file creation fails
    }
  }

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
    // Keep __dirname/__filename/import.meta.url behavior by default
    define: defaultDefine as any,
    // Compose feature-specific plugins
    plugins: defaultPlugins,
    // Resolve tsconfig.json from cwd if present
    tsconfig: tsconfigPath,
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
    format: 'esm' as const,
    inlineDynamicImports: true,
    // Apply user-provided overrides last
    ...(options.outputOptions ?? {}),
  }

  // Generate bundle in memory
  const rolldownOutput = await bundle.generate(outputOptions)

  // Clean up temporary tsconfig if we created one
  if (
    needsDecoratorMetadata &&
    tsconfigPath !== path.resolve(process.cwd(), 'tsconfig.json')
  ) {
    try {
      fs.unlinkSync(tsconfigPath)
    } catch {
      // Ignore cleanup errors
    }
  }

  // Verify that the output is not empty
  if (!rolldownOutput.output[0]) {
    throw new Error('[unrun] No output chunk found')
  }
  // Return the output chunk
  return rolldownOutput.output[0]
}
