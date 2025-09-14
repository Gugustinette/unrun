import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { rolldown } from 'rolldown'

export interface JitOptions {
  /**
   * The path to the file to be imported.
   * @default process.cwd()
   */
  path: string
}

// biome-ignore lint/suspicious/noExplicitAny: Dynamically imported modules can't be typed
export const jit = async (options: JitOptions): Promise<any> => {
  // Resolve the file path to an absolute path
  const filePath = path.resolve(process.cwd(), options.path)
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  // Setup bundle
  const bundle = await rolldown({
    // Input options (https://rolldown.rs/reference/config-options#inputoptions)
    input: filePath,
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
  // Get the output chunk
  const outputChunk = rolldownOutput.output[0]

  // Convert code to base64
  const code64 = Buffer.from(outputChunk.code).toString('base64')

  // Create a new module using the base64 encoded code
  const _module = await import(`data:text/javascript;base64,${code64}`)

  // Return the module
  return _module
}
