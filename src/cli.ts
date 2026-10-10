#!/usr/bin/env node
import { runPipeline } from "./pipeline.js";
import { log } from "./utils/logger.js";
import { readFile } from "node:fs/promises";
import { ScriptSchema } from "./render/script-schema.js";

async function main() {
  const scriptPath = process.argv[2];
  if (!scriptPath) {
    console.error("Usage: npm run pipeline -- <path/to/script.json> [--validate | --no-render]");
    process.exit(2);
  }
  try {
    if (process.argv.includes("--validate")) {
      const script = ScriptSchema.parse(JSON.parse(await readFile(scriptPath, "utf8")));
      log.info(`Valid ${script.version === "2.0" ? "math lesson" : "legacy script"}: ${script.scenes.length} scenes`);
      return;
    }
    await runPipeline(scriptPath, { render: !process.argv.includes("--no-render") });
  } catch (e) {
    log.error("Pipeline failed", e);
    process.exit(1);
  }
}

main();
