#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const MODE = process.argv[2]
const VALID_MODES = new Set(['add', 'remove'])
const OVERRIDE_KEY = 'tsdown@*>unrun'
const OVERRIDE_VALUE = 'link:./'

if (!VALID_MODES.has(MODE)) {
  console.error('Usage: manage-pnpm-override.mjs <add|remove>')
  process.exit(1)
}

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const packageJsonPath = path.join(projectRoot, 'package.json')

const applyOverride = MODE === 'add'

const packageJsonRaw = readFileSync(packageJsonPath, 'utf8')
const packageJson = JSON.parse(packageJsonRaw)
let shouldWriteFile = false

if (applyOverride) {
  packageJson.pnpm = packageJson.pnpm ?? {}
  packageJson.pnpm.overrides = packageJson.pnpm.overrides ?? {}
  if (packageJson.pnpm.overrides[OVERRIDE_KEY] !== OVERRIDE_VALUE) {
    packageJson.pnpm.overrides[OVERRIDE_KEY] = OVERRIDE_VALUE
    shouldWriteFile = true
  }
} else if (packageJson.pnpm?.overrides?.[OVERRIDE_KEY]) {
  delete packageJson.pnpm.overrides[OVERRIDE_KEY]
  shouldWriteFile = true

  if (Object.keys(packageJson.pnpm.overrides).length === 0) {
    delete packageJson.pnpm.overrides
  }
  if (Object.keys(packageJson.pnpm).length === 0) {
    delete packageJson.pnpm
  }
}

if (shouldWriteFile) {
  writeFileSync(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
    'utf8',
  )
}

const installResult = spawnSync('pnpm', ['i', '--no-frozen-lockfile'], {
  cwd: projectRoot,
  stdio: 'inherit',
})

if (installResult.status !== 0) {
  console.error(`pnpm install failed during ${MODE} step`)
  process.exit(installResult.status ?? 1)
}
