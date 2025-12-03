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
        // Running the test is irrelevant as Vite package itself does not use tsdown,
        // thus does not use unrun
        // 'pnpm run test-unit',
      ],
      pnpmOverrides: {
        'tsdown@*>unrun': 'file:../../',
      },
    },
  ],
})
