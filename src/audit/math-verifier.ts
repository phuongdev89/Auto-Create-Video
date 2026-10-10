import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile, rename, realpath } from "node:fs/promises";
import { join, resolve, relative, isAbsolute } from "node:path";
import { z } from "zod";
import { loadAuditConfig, type AuditConfig } from "../config.js";
import type { MathScript } from "../render/math-schema.js";
import { requestAuditJson, type ChatContent } from "./chat-client.js";
import { IndependentSolutionSchema, ReviewSchema, reviewStatus } from "./report-schema.js";
import { AUDIT_PROMPT_VERSION, independentPrompt, reviewPrompt } from "./prompts.js";

const ArtifactSchema = z.object({
  version: z.literal("1.0"), status: z.enum(["pass", "fail", "uncertain", "unverified"]),
  fingerprint: z.string(), checkedAt: z.string(), model: z.string(), endpoint: z.string(),
  independent: IndependentSolutionSchema.optional(), review: ReviewSchema.optional(), error: z.string().optional(),
}).strict();
type Artifact = z.infer<typeof ArtifactSchema>;
const hash = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");

async function saveReport(dir: string, report: Artifact): Promise<void> {
  const target = join(dir, "verification.json");
  const tmp = `${target}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(report, null, 2));
  await rename(tmp, target);
  const lines = ["# Kiểm chứng toán — nội bộ", "", `Trạng thái: ${report.status}`, `Model: ${report.model || "chưa cấu hình"}`,
    `Thời điểm: ${report.checkedAt}`, `Fingerprint: ${report.fingerprint}`, "",
    "Báo cáo AI có thể sai; không phải chứng minh hình thức. Không chia sẻ báo cáo này ở chế độ hướng dẫn vì chứa đáp án."];
  if (report.error) lines.push("", `Lỗi: ${report.error}`);
  if (report.independent) lines.push("", "## Lời giải độc lập", "", "```json", JSON.stringify(report.independent, null, 2), "```");
  if (report.review) lines.push("", "## Đối chiếu lời giải và kịch bản", "", "```json", JSON.stringify(report.review, null, 2), "```");
  await writeFile(join(dir, "verification.md"), lines.join("\n") + "\n");
}

async function sourceImages(script: MathScript, dir: string) {
  const root = await realpath(dir);
  const images: { path: string; sha256: string; url: string }[] = [];
  for (const name of script.problem.imagePaths ?? []) {
    const path = await realpath(resolve(root, name));
    const rel = relative(root, path);
    if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("Problem images must be copied inside the current session.");
    const bytes = await readFile(path);
    if (bytes.length > 10 * 1024 * 1024) throw new Error("Problem image exceeds 10 MiB.");
    const mime = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png"
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "image/jpeg"
      : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : null;
    if (!mime) throw new Error("Problem images must be PNG, JPEG or WebP.");
    images.push({ path: name, sha256: hash(bytes), url: `data:${mime};base64,${bytes.toString("base64")}` });
  }
  return images;
}

/** Fail closed; cached passes are bound to the exact math/lesson/solution/images/model/prompts. */
export async function verifyMathLesson(script: MathScript, dir: string, options: { force?: boolean; config?: AuditConfig } = {}): Promise<void> {
  const report: Artifact = { version: "1.0", status: "unverified", fingerprint: "", checkedAt: new Date().toISOString(), model: "", endpoint: "" };
  try {
    const cfg = options.config ?? loadAuditConfig();
    report.model = cfg.model; report.endpoint = cfg.chatUrl;
    let solution: string;
    try { solution = await readFile(join(dir, "solution.md"), "utf8"); }
    catch { throw new Error("Missing solution.md: save the full private solution before auditing."); }
    if (!solution.trim() || Buffer.byteLength(solution) > 1024 * 1024) throw new Error("solution.md must be non-empty and at most 1 MiB.");
    const images = await sourceImages(script, dir);
    const lesson = { solutionMode: script.solutionMode, metadata: script.metadata, problem: script.problem,
      scenes: script.scenes.map(({ sfx: _sfx, ...scene }) => scene) };
    report.fingerprint = hash(JSON.stringify({ lesson, solution, images: images.map(({ url: _url, ...image }) => image),
      model: cfg.model, endpoint: cfg.chatUrl, prompts: [AUDIT_PROMPT_VERSION, independentPrompt, reviewPrompt] }));
    if (!options.force) {
      try {
        const cached = ArtifactSchema.parse(JSON.parse(await readFile(join(dir, "verification.json"), "utf8")));
        if (cached.fingerprint === report.fingerprint && cached.status === "pass" && cached.independent?.status === "solved"
          && cached.review && reviewStatus(cached.review, script.solutionMode === "guided") === "pass") return;
      } catch { /* missing, stale or malformed audit requires a fresh audit */ }
    }
    await saveReport(dir, report); // invalidate any previous pass before network calls
    const original = { original: script.problem.original, language: script.problem.language, topic: script.problem.topic, level: script.problem.level };
    const content: ChatContent = [{ type: "text", text: JSON.stringify({ problem: original }) },
      ...images.map(image => ({ type: "image_url" as const, image_url: { url: image.url } }))];
    report.independent = IndependentSolutionSchema.parse(await requestAuditJson(cfg, [
      { role: "system", content: independentPrompt }, { role: "user", content },
    ]));
    if (report.independent.status !== "solved") {
      report.status = "uncertain";
    } else {
      await saveReport(dir, report);
      // A new request, no main-agent conversation history. Candidate is introduced only now.
      const reviewContent: ChatContent = [{ type: "text", text: JSON.stringify({ originalProblem: original,
        independentSolution: report.independent, candidateSolution: solution, lesson }) },
        ...images.map(image => ({ type: "image_url" as const, image_url: { url: image.url } }))];
      report.review = ReviewSchema.parse(await requestAuditJson(cfg, [
        { role: "system", content: reviewPrompt }, { role: "user", content: reviewContent },
      ]));
      report.status = reviewStatus(report.review, script.solutionMode === "guided");
    }
  } catch (error) {
    report.status = "unverified";
    report.error = error instanceof z.ZodError ? "Audit report has an invalid schema or lacks required evidence."
      : error instanceof Error ? error.message : "Audit could not be completed.";
  }
  await saveReport(dir, report);
  if (report.status !== "pass") throw new Error(`Math verification ${report.status}. TTS/render blocked. Inspect private verification.md and fix the inputs before retrying.`);
}
