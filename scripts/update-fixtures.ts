import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { downloadTemplate } from 'giget'

async function ensureParentDir(dir: string) {
  await fs.mkdir(path.dirname(dir), { recursive: true })
}

async function fetchFixture(name: string, source: string, destRel: string) {
  const dest = path.resolve(process.cwd(), destRel)
  await ensureParentDir(dest)

  const start = Date.now()
  console.log(`Updating ${name} fixtures...`)

  // Force clean to ensure we always mirror upstream exactly
  const result = await downloadTemplate(source, {
    dir: dest,
    forceClean: true,
  })

  const ms = Date.now() - start
  console.log(
    `✓ ${name} fixtures updated in ${ms}ms -> ${path.relative(process.cwd(), result.dir)}`,
  )
}

async function main() {
  await Promise.all([
    // jiti: https://github.com/unjs/jiti/tree/main/test/fixtures -> ./tests/fixtures/jiti
    fetchFixture(
      'jiti',
      'github:unjs/jiti/test/fixtures',
      'tests/fixtures/jiti',
    ),

    // bundle-require: https://github.com/egoist/bundle-require/tree/main/test/fixture -> ./tests/fixtures/bundle-require
    fetchFixture(
      'bundle-require',
      'github:egoist/bundle-require/test/fixture',
      'tests/fixtures/bundle-require',
    ),
  ])
}

main().catch((error) => {
  console.error('✗ Failed to update fixtures:\n', error)
  process.exitCode = 1
})
