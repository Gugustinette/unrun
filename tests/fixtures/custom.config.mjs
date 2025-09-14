import { defineConfig } from "./utils/defineConfig";

const parentDir = "parentDir";

export default defineConfig({
  entry: "./src/index.ts",
  dir: `${parentDir}/dist`,
});
