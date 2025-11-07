import { valueA } from './a'
import { valueB } from './b'

export default function sharedDependencyFixture() {
  return {
    valueA,
    valueB,
  }
}
