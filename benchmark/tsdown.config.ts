import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./benchmark/benchmark.ts'],
  outDir: './benchmark/dist',
  platform: 'node',
  external: ['bundle-require', 'jiti'],
})
