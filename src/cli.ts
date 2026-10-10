#!/usr/bin/env node
import { runPipeline } from "./pipeline.js";
import { log } from "./utils/logger.js";
import { readFile } from "node:fs/promises";
import { ScriptSchema } from "./render/script-schema.js";
import { verifyMathLesson } from "./audit/math-verifier.js";
import { dirname } from "node:path";
import { startConceptServer } from "./concepts/server.js";

async function main() {
  const scriptPath = process.argv[2];
  if (!scriptPath) {
    console.error("Usage: npm run pipeline -- <path/to/script.json> [--concepts | --validate | --audit [--force-audit] | --no-render]");
    process.exit(2);
  }
  try {
    if (process.argv.includes("--concepts")) {
      if (["--validate", "--audit", "--force-audit", "--no-render"].some(flag => process.argv.includes(flag))) throw new Error("Run --concepts on its own before production.");
      const { server, url } = await startConceptServer(scriptPath);
      log.info(`Chọn concept video: ${url}`);
      log.info("Lưu lựa chọn trên trang rồi nhấn Ctrl+C. Không gọi audit, TTS hoặc render.");
      process.once("SIGINT", () => server.close());
      process.once("SIGTERM", () => server.close());
      return;
    }
    if (process.argv.includes("--validate") && process.argv.includes("--audit")) throw new Error("Choose --validate or --audit, not both.");
    if (process.argv.includes("--force-audit") && !process.argv.includes("--audit")) throw new Error("--force-audit requires --audit.");
    if (process.argv.includes("--validate")) {
      const script = ScriptSchema.parse(JSON.parse(await readFile(scriptPath, "utf8")));
      log.info(`Valid ${script.version === "2.0" ? "math lesson" : "legacy script"}: ${script.scenes.length} scenes`);
      return;
    }
    if (process.argv.includes("--audit")) {
      const script = ScriptSchema.parse(JSON.parse(await readFile(scriptPath, "utf8")));
      if (script.version !== "2.0") throw new Error("Math verification requires a version 2.0 lesson.");
      await verifyMathLesson(script, dirname(scriptPath), { force: process.argv.includes("--force-audit") });
      log.info("Math audit passed. Private reports: verification.json and verification.md.");
      return;
    }
    await runPipeline(scriptPath, { render: !process.argv.includes("--no-render") });
  } catch (e) {
    log.error("Pipeline failed", e);
    process.exit(1);
  }
}

main();
