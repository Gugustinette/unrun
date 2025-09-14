const { defineConfig } = require("./utils/defineConfig");

const parentDir = "parentDir";

module.exports = defineConfig({
  entry: "./src/index.ts",
  dir: `${parentDir}/dist`,
});
