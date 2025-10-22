import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts', './src/cli.ts', './src/sync/worker.ts'],
  platform: 'node',
})
