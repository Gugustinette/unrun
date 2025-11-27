import { defineConfig, mergeConfig } from 'vitest/config'

export const sharedConfig = defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.ecosystem-ci/**'],
  },
})

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      testTimeout: 30000,
      // Also exclude browser tests from default config
      exclude: ['**/tests/browser/**/*.test.ts'],
    },
  }),
)
