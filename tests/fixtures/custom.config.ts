import { defineConfig, type ConfigOptions } from './utils/defineConfig'

const parentDir = 'parentDir'

const _default_1: ConfigOptions = defineConfig({
  entry: './src/index.ts',
  dir: `${parentDir}/dist`,
})
export default _default_1
