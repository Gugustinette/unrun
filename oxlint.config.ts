import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["dist", "node_modules", ".github", "docs/reference/", "tests/fixtures"],
});
