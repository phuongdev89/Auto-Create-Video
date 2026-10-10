import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { log } from "../utils/logger.js";

export interface RenderArgs {
  compositionDir: string;  // path to composition directory
  outputPath: string;      // path for .mp4
  fps?: number;            // default 30
  quality?: "draft" | "standard" | "high"; // default "standard"
  check?: boolean;
}

const require = createRequire(import.meta.url);
async function runHyperframes(args: string[]): Promise<void> {
  const cli = join(dirname(require.resolve("hyperframes/package.json")), "bin", "hyperframes.mjs");
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(process.execPath, [cli, ...args], { stdio: ["ignore", "inherit", "inherit"], windowsHide: true });
    proc.on("close", code => code === 0 ? resolve() : reject(new Error(`hyperframes ${args[0]} failed with exit code ${code}`)));
    proc.on("error", reject);
  });
}

export async function renderWithHyperframes(args: RenderArgs): Promise<void> {
  const { compositionDir, outputPath, fps = 30, quality = "standard" } = args;

  if (args.check) await runHyperframes(["check", compositionDir]);
  const spawnArgs = [
    "render",
    compositionDir,
    "--output",
    outputPath,
    "--fps",
    String(fps),
    "--quality",
    quality,
  ];

  await runHyperframes(spawnArgs);

  log.info(`Rendered: ${outputPath}`);
}
