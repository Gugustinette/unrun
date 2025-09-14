import { expect, test } from 'vitest'
import { foo } from '../src'

test('simple', () => {
  expect(foo).toBe('foo')
})
