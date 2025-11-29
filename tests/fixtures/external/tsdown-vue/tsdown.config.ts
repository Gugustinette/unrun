import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig({
  entry: './src/index.ts',
  platform: 'neutral',
  plugins: [Vue({ isProduction: true })],
  clean: true,
  dts: { vue: true },
  tsconfig: './tsconfig.json',
})
