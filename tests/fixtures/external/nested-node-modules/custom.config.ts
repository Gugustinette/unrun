import a from './temp/temp.mjs';
import { z } from "zod";

console.log(a);

console.log("npm:zod:", z.string().parse("hello world") === "hello world");

const parentDir = 'parentDir'

const _default_1 = {
  entry: './src/index.ts',
  dir: `${parentDir}/dist`,
  nestedA: a
}
export default _default_1
