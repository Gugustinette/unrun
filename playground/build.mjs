import process from "node:process";
import { unrun } from "../dist/index.mjs";

// Playground script for tinkering with unrun.
async function main() {
  await unrun({
    path: "playground/index.ts",
    // temporary file will be kept inside node_modules/.unrun
    debug: true,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
