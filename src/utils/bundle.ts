import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { rolldown, type OutputChunk } from 'rolldown'
import { createEsmRequireShim } from '../plugins/esm-require-shim'

export async function bundle(filePath: string): Promise<OutputChunk> {
  // Setup bundle
  const bundle = await rolldown({
    // Input options (https://rolldown.rs/reference/config-options#inputoptions)
    input: filePath,
    // Use Node platform for better Node-compatible resolution & builtins
    // See https://rolldown.rs/guide/in-depth/bundling-cjs#require-external-modules
    platform: 'node',
    // Keep __dirname/__filename behavior
    define: {
      __dirname: JSON.stringify(path.dirname(filePath)),
      __filename: JSON.stringify(filePath),
      'import.meta.url': JSON.stringify(pathToFileURL(filePath).href),
    },
    // Compose feature-specific plugins
    plugins: [createEsmRequireShim()],
    // Resolve tsconfig.json from cwd if present
    tsconfig: path.resolve(process.cwd(), 'tsconfig.json'),
  })

  // Generate bundle in memory
  const rolldownOutput = await bundle.generate({
    // Output options (https://rolldown.rs/reference/config-options#outputoptions)
    format: 'esm',
    inlineDynamicImports: true,
  })

  // Verify that the output is not empty
  if (!rolldownOutput.output[0]) {
    throw new Error('[unrun] No output chunk found')
  }
  // Return the output chunk
  return rolldownOutput.output[0]
}
