import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, rename, mkdir, realpath, unlink } from "node:fs/promises";
import { join, resolve, relative, isAbsolute, dirname, extname } from "node:path";
import { MathScriptSchema, type MathScript } from "../render/math-schema.js";
import { MathConceptId, mathConcepts } from "../render/math-concepts.js";
import { composeMathHtml, copyMathAssets } from "../render/math-composer.js";
import { conceptGallery } from "./gallery.js";
import { updateProgress } from "../progress/state.js";

export async function writeConceptPreviews(script: MathScript, outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await copyMathAssets(outputDir);
  const frames = [script.scenes.find(s => s.phase === "problem" || s.phase === "read-translation")!,
    script.scenes.find(s => s.phase === "solution")!, script.scenes.at(-1)!];
  for (const concept of mathConcepts) {
    for (const [index, scene] of frames.entries()) {
      const html = composeMathHtml({ script: { ...script, visualConcept: concept.id },
        sceneAudio: script.scenes.map(s => ({ id: s.id, durationSec: 5 })),
        gapSec: .3, audioRelPath: "", previewSceneId: scene.id, previewMotion: true });
      await writeFile(join(outputDir, `${concept.id}-${index}.html`), html);
    }
  }
}

/** Loopback-only gallery. Serves only previews/assets, never solution or audit files. */
export async function startConceptServer(scriptPath: string) {
  const path = resolve(scriptPath);
  const session = dirname(path);
  const rel = relative(resolve("output"), session);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error("Copy the lesson into output/<session>/ before selecting a concept.");
  let savedText = await readFile(path, "utf8");
  const script = MathScriptSchema.parse(JSON.parse(savedText));
  const publicDir = join(session, "concepts");
  await writeConceptPreviews(script, publicDir);
  const publicRoot = await realpath(publicDir);
  const token = randomUUID();
  let saving = false;
  let origin = "";
  const mime: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
  const server = createServer(async (request, response) => {
    const json = (status: number, data: unknown) => { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(data)); };
    try {
      response.setHeader("Cache-Control", "no-store");
      response.setHeader("X-Content-Type-Options", "nosniff");
      if (request.headers.host !== new URL(origin).host) { json(403, { error: "Host không hợp lệ." }); return; }
      if (request.url === "/select" && request.method === "POST") {
        if (request.headers.origin !== origin || request.headers["x-concept-token"] !== token) { json(403, { error: "Hãy chọn concept từ trang đang mở." }); return; }
        if (saving) { json(409, { error: "Đang lưu lựa chọn khác. Hãy thử lại." }); return; }
        saving = true;
        try {
          let body = "";
          for await (const chunk of request) { body += chunk; if (Buffer.byteLength(body) > 1024) { json(413, { error: "Yêu cầu quá lớn." }); return; } }
          let concept: MathConceptId;
          try { concept = MathConceptId.parse(JSON.parse(body).concept); }
          catch { json(400, { error: "Concept không hợp lệ." }); return; }
          if (!mathConcepts.some(item => item.id === concept)) { json(400, { error: "Hãy chọn một concept trong gallery." }); return; }
          const currentText = await readFile(path, "utf8");
          if (currentText !== savedText) { json(409, { error: "Kịch bản đã thay đổi. Dừng lệnh và mở lại trang để xem nội dung mới." }); return; }
          const raw = JSON.parse(currentText);
          raw.visualConcept = concept;
          MathScriptSchema.parse(raw);
          const nextText = JSON.stringify(raw, null, 2) + "\n";
          const temp = `${path}.${randomUUID()}.tmp`;
          try { await writeFile(temp, nextText); await rename(temp, path); }
          finally { await unlink(temp).catch(() => {}); }
          savedText = nextText;
          await updateProgress(session, "Concept đã chọn", `Đã lưu ${concept}; chuẩn bị kiểm tra audit trước sản xuất.`);
          json(200, { concept });
        } finally { saving = false; }
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") { json(405, { error: "Phương thức không hỗ trợ." }); return; }
      if (request.url === "/") {
        const current = MathScriptSchema.parse(JSON.parse(savedText));
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(request.method === "HEAD" ? undefined : conceptGallery(current.metadata.title, current.visualConcept, token));
        return;
      }
      const name = decodeURIComponent(new URL(request.url ?? "/", origin).pathname).slice(1);
      if (!/^(?:(?:news|detective|neon|chalkboard|notebook|manipulatives)-[0-2]\.html|math-styles\.css|math-assets\/(?:katex\.min\.css|gsap\.min\.js|fonts\/[\w.-]+\.(?:woff2?|ttf)))$/.test(name)) { json(404, { error: "Không tìm thấy." }); return; }
      const asset = await realpath(join(publicDir, name));
      const assetRel = relative(publicRoot, asset);
      if (assetRel.startsWith("..") || isAbsolute(assetRel)) { json(404, { error: "Không tìm thấy." }); return; }
      const bytes = await readFile(asset);
      response.writeHead(200, { "Content-Type": mime[extname(asset)] ?? "application/octet-stream" });
      response.end(request.method === "HEAD" ? undefined : bytes);
    } catch { json(500, { error: "Không thực hiện được. Hãy mở lại trang chọn concept." }); }
  });
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Concept server could not start");
  origin = `http://127.0.0.1:${address.port}`;
  return { server, url: origin + "/", publicDir };
}
