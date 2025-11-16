import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 30000,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.ecosystem-ci/**'],
  },
})
