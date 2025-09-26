import path from 'node:path'
import { rolldown, type OutputChunk } from 'rolldown'
import { createEsmRequireShim } from '../plugins/esm-require-shim'
import { createJsonLoader } from '../plugins/json-loader'
import { createTsTranspile } from '../plugins/ts-transpile'

export async function bundle(filePath: string): Promise<OutputChunk> {
  // Setup bundle
  const bundle = await rolldown({
    // Input options (https://rolldown.rs/reference/config-options#inputoptions)
    input: filePath,
    // Use Node platform for better Node-compatible resolution & builtins
    platform: 'node',
    // Keep __dirname/__filename behavior and map import.meta.env to process.env
    define: {
      __dirname: JSON.stringify(path.dirname(filePath)),
      __filename: JSON.stringify(filePath),
      'import.meta.env': 'process.env',
    },
    // Compose feature-specific plugins
    plugins: [createTsTranspile(), createJsonLoader(), createEsmRequireShim()],
  })

  // Generate bundle in memory
  const rolldownOutput = await bundle.generate({
    // Output options (https://rolldown.rs/reference/config-options#outputoptions)
    format: 'esm',
    inlineDynamicImports: true,
  })

  // Verify that the output is not empty
  if (!rolldownOutput.output[0]) {
    throw new Error('No output chunk found')
  }
  // Return the output chunk
  return rolldownOutput.output[0]
}
