import { defineConfig } from 'test-ecosystem-ci'

export default defineConfig({
  name: 'unrun',
  ecosystem: [
    {
      name: 'vite',
      repository: 'gh:vitejs/vite',
      actions: [
        'pnpm i --no-frozen-lockfile',
        'pnpm run build',
        'pnpm run test-unit',
      ],
      pnpmOverrides: {
        'tsdown@*>unrun': 'file:../../',
      },
    },
  ],
})
