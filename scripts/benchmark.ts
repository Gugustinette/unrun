import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { unrun } from '../src/index.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

function formatMs(durationNs: bigint): string {
  const ms = Number(durationNs) / 1e6
  return `${ms.toFixed(2)} ms`
}

async function time<T>(label: string, fn: () => Promise<T>) {
  const start = process.hrtime.bigint()
  const result = await fn()
  const end = process.hrtime.bigint()
  const duration = end - start
  console.log(`${label}: ${formatMs(duration)}`)
  return result
}

async function main() {
  const fixtureDir = resolve(__dirname, '../tests/fixtures')
  const configPath = resolve(fixtureDir, 'custom.config.ts')

  // jiti
  const jiti = createJiti(__dirname, { fsCache: false, moduleCache: false })
  await time('jiti   (custom.config.ts)', async () => {
    return await jiti.import(configPath)
  })

  // unrun
  await time('unrun  (custom.config.ts)', async () => {
    return await unrun({ path: configPath })
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
