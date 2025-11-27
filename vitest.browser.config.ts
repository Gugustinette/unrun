import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import { sharedConfig } from './vitest.config'

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: ['tests/browser/**/*.test.ts'],
      testTimeout: 120_000,
      browser: {
        enabled: true,
        provider: playwright({
          launchOptions: {
            headless: true,
          },
        }),
        headless: true,
        instances: [
          {
            browser: 'chromium',
          },
        ],
      },
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    optimizeDeps: {
      exclude: ['@webcontainer/api'],
    },
  }),
)
