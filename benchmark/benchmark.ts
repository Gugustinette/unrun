import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { unrun } from '../src/index.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = resolve(__dirname, '../fixture/custom.config.ts')
const resultsPath = resolve(__dirname, '../results.json')
const iterations = 10

function toMs(duration: bigint) {
  return Number(duration) / 1e6
}

async function measure(loader: string, run: () => Promise<unknown>) {
  const durations: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint()
    await run()
    durations.push(toMs(process.hrtime.bigint() - start))
  }

  const totalMs = durations.reduce((sum, duration) => sum + duration, 0)
  const averageMs = durations.length ? totalMs / durations.length : 0
  const minMs = durations.length ? Math.min(...durations) : 0
  const maxMs = durations.length ? Math.max(...durations) : 0

  return {
    loader,
    totalMs,
    averageMs,
    minMs,
    maxMs,
  }
}

async function main() {
  const unrunRunner = () => unrun({ path: configPath })

  const jitiRunner = () => {
    const jiti = createJiti(__dirname, { fsCache: false, moduleCache: false })
    return jiti.import(configPath)
  }

  const results = []
  for (const { loader, runner } of [
    { loader: 'unrun', runner: unrunRunner },
    { loader: 'jiti', runner: jitiRunner },
  ]) {
    results.push(await measure(loader, runner))
  }

  const report = {
    timestamp: new Date().toISOString(),
    device: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    iterations,
    results,
  }

  const toFixed = (value: number) => value.toFixed(2).padStart(10)
  const header = [
    'loader'.padEnd(12),
    'totalMs'.padStart(10),
    'averageMs'.padStart(12),
    'minMs'.padStart(10),
    'maxMs'.padStart(10),
  ].join(' ')
  const rows = report.results.map(
    ({ loader, totalMs, averageMs, minMs, maxMs }) =>
      [
        loader.padEnd(12),
        toFixed(totalMs),
        toFixed(averageMs),
        toFixed(minMs),
        toFixed(maxMs),
      ].join(' '),
  )

  console.info(
    [
      '\nBenchmark results:',
      ` • Iterations: ${iterations}`,
      ` • Timestamp: ${report.timestamp}`,
      '',
      header,
      ...rows,
    ].join('\n'),
  )

  await writeFile(resultsPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
