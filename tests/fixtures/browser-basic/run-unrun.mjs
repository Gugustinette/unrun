import { unrun } from 'unrun'

const { module } = await unrun({
  path: './input.ts',
})

console.log(module)
