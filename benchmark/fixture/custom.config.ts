import { authors } from './authors.ts'
import { settings } from './settings.ts'

export default {
  title: 'Custom Benchmark Config',
  team: authors,
  options: settings,
  summary() {
    return `${authors.length} authors, retries: ${settings.retries}`
  },
}
