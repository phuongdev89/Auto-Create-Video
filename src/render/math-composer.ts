import { renderFormula } from "./math-expression.js";
export { renderFormula } from "./math-expression.js";
import { readFileSync } from "node:fs";
import { cp, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { MathScript, MathTemplate } from "./math-schema.js";
import { planMathScenes } from "./math-direction.js";
import { responsiveComposition, type VideoOrientation } from "./responsive.js";

const templates = join(dirname(fileURLToPath(import.meta.url)), "templates");
const require = createRequire(import.meta.url);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const paragraph = (s?: string, cls = "math-text") => s ? `<div class="${cls}">${esc(s)}</div>` : "";
const formula = (s?: string, split = false) => {
  if (!s) return "";
  // Split only a single top-level equality. Keep complex aligned expressions intact.
  const parts = s.split("=");
  const safe = split && parts.length === 2 && parts.every(p => p.trim()) && !/[{}\\()[\]<>!]/.test(s);
  const tails = safe ? parts.map(p => p.match(/\s([+-]\s*\d+)\s*$/)) : [];
  const paired = tails.length === 2 && tails.every(Boolean)
    && parts.every((p, i) => p.slice(0, tails[i]!.index).trim() && !/[+\-*/^_]$/.test(p.slice(0, tails[i]!.index).trim()))
    && tails[0]![1].replace(/\s/g, "") === tails[1]![1].replace(/\s/g, "");
  const side = (p: string, i: number) => paired
    ? `<span class="equation-base">${renderFormula(p.slice(0, tails[i]!.index))}</span><span class="equation-operation">${renderFormula(tails[i]![1])}</span>` : renderFormula(p);
  return `<div class="math-equation">${safe ? `<div class="equation-pair"><div class="equation-side">${side(parts[0], 0)}</div><div class="equation-equals">${renderFormula("=")}</div><div class="equation-side">${side(parts[1], 1)}</div></div>` : renderFormula(s)}</div>`;
};

function content(td: MathTemplate, concept: MathScript["visualConcept"]): string {
  switch (td.template) {
    case "math-intro": return paragraph(td.subtitle) + '<div class="math-intro-mark">∑</div>';
    case "math-problem": return paragraph(td.text, "math-problem-text") + formula(td.latex);
    case "math-step": {
      const objects = td.objects ? `<div class="math-objects">${td.objects.map(group => `<div class="math-object-group" data-color="${group.color}"><div class="math-object-label">${esc(group.label)}</div><div class="math-object-tokens" role="img" aria-label="${esc(group.label)}: ${group.count}">${Array.from({ length: group.count }, () => '<span class="math-object" aria-hidden="true"></span>').join("")}</div></div>`).join("")}</div>` : "";
      return paragraph(td.explanation) + objects + td.equations.map(x => formula(x, ["news", "detective", "neon"].includes(concept))).join("") + paragraph(td.note, "math-note");
    }
    case "math-answer": return formula(td.answer) + paragraph(td.explanation) + paragraph(td.takeaway, "math-note");
    case "math-closing": return paragraph(td.message);
    case "math-diagram": {
      const colors = concept === "chalkboard" || concept === "neon" ? { ink: "#f5f3e8", blue: "#91d5ff", green: "#b0eccb", orange: "#ffcf94" }
        : { ink: "#173047", blue: "#1261a0", green: "#147050", orange: "#924b12" };
      const shapes = td.shapes.map(s => {
        const paint = `stroke="${colors[s.color]}" stroke-width="4" fill="none"`;
        switch (s.kind) {
          case "line": return `<line x1="${s.from.x}" y1="${s.from.y}" x2="${s.to.x}" y2="${s.to.y}" ${paint}/>`;
          case "circle": return `<circle cx="${s.center.x}" cy="${s.center.y}" r="${s.radius}" ${paint}/>`;
          case "polygon": return `<polygon points="${s.points.map(p => `${p.x},${p.y}`).join(" ")}" ${paint}/>`;
          case "label": return `<text x="${s.at.x}" y="${s.at.y}" fill="${colors[s.color]}" font-size="32" text-anchor="middle">${esc(s.text)}</text>`;
        }
      }).join("");
      return `<svg class="math-diagram" viewBox="0 0 900 500" role="img" aria-label="${esc(td.title)}">${shapes}</svg>` + paragraph(td.explanation) + formula(td.latex);
    }
  }
}
export function composeMathHtml(args: {
  script: MathScript; sceneAudio: { id: string; durationSec: number }[];
  gapSec: number; audioRelPath: string; outroHoldSec?: number;
  previewSceneId?: string;
  previewMotion?: boolean;
  orientation?: VideoOrientation;
}): string {
  const { script, gapSec, sceneAudio } = args;
  const concept = script.visualConcept ?? "classic";
  if (args.previewSceneId && !script.scenes.some(scene => scene.id === args.previewSceneId)) throw new Error("Unknown preview scene");
  const plan = planMathScenes(script, sceneAudio, gapSec, args.outroHoldSec ?? 3);
  let cursor = 0;
  const scenes = script.scenes.map((s, index) => {
    const audio = sceneAudio.find(a => a.id === s.id);
    if (!audio || !Number.isFinite(audio.durationSec) || audio.durationSec <= 0) throw new Error(`Missing or invalid audio for ${s.id}`);
    const start = cursor;
    const duration = audio.durationSec + (index < script.scenes.length - 1 ? gapSec : (args.outroHoldSec ?? 3));
    cursor += duration;
    if (args.previewSceneId && s.id !== args.previewSceneId) return "";
    const direction = plan[index];
    const labels = concept === "detective" ? { problem: "HỒ SƠ", reasoning: "MANH MỐI", check: "ĐỐI CHIẾU", result: "TỔNG HỢP", bookend: "ĐIỀU TRA TOÁN HỌC" }
      : concept === "neon" ? { problem: "DỮ KIỆN", reasoning: "BIẾN ĐỔI", check: "KIỂM TRA", result: "TỔNG KẾT", bookend: "NEON LAB" }
      : { problem: "DỮ KIỆN", reasoning: "PHÂN TÍCH", check: "ĐỐI CHIẾU", result: "ĐIỂM NHỚ", bookend: "BÀI HỌC HÔM NAY" };
    return `<section class="math-scene clip" id="math-${s.id}" data-layout="${direction.layout}" data-role="${direction.role}" data-start="${start.toFixed(4)}" data-duration="${duration.toFixed(4)}" data-track-index="1">
      <div class="math-board">
        ${direction.layout !== "board" ? `<div class="direction-label">${labels[direction.role]}</div><div class="direction-rule" aria-hidden="true"></div>` : ""}
        <div class="math-phase">${esc(phaseLabels[s.phase])} · ${index + 1}/${script.scenes.length}</div>
        <h1>${esc(s.templateData.title)}</h1>
        <div class="math-content">${content(s.templateData, concept)}</div>
      </div>
    </section>`;
  }).join("\n");
  const audioDuration = sceneAudio.reduce((n, a) => n + a.durationSec, 0) + gapSec * (script.scenes.length - 1);
  const animation = readFileSync(join(templates, "math-animations.js"), "utf8");
  return responsiveComposition(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${esc(script.metadata.title)}</title>
    <link rel="stylesheet" href="math-assets/katex.min.css"><link rel="stylesheet" href="math-styles.css">
    <script src="math-assets/gsap.min.js"></script></head><body data-concept="${concept}"${args.previewSceneId ? ` data-preview-scene="math-${esc(args.previewSceneId)}"${args.previewMotion ? ' data-preview-motion="true"' : ""}` : ""}>
    <div id="math-stage" data-composition-id="math-video" data-width="1080" data-height="1920" data-start="0" data-duration="${cursor.toFixed(4)}">
      <header class="math-brand"><span class="math-logo">∑</span><div>${esc(script.metadata.channel)}<small>GIẢI TOÁN TỪNG BƯỚC</small></div></header>
      ${args.previewSceneId ? "" : `<audio id="math-voice" class="clip" data-start="0" data-duration="${audioDuration.toFixed(4)}" data-track-index="0" src="${esc(args.audioRelPath)}"></audio>`}
      ${scenes}
      <footer class="math-footer">${esc([script.problem.level, script.problem.topic].filter(Boolean).join(" · ") || "Hiểu cách làm · Kiểm tra đáp án")}</footer>
    </div><script>${animation}</script></body></html>`, args.orientation, true);
}
const phaseLabels = { introduction: "Hôm nay học gì?", problem: "Đọc đề", "read-english": "Đề gốc tiếng Anh",
  "read-translation": "Bản dịch tiếng Việt", strategy: "Hướng giải", solution: "Lời giải", check: "Kiểm tra", answer: "Kết quả", practice: "Các em tự hoàn thành", closing: "Lời chúc" };

export async function copyMathAssets(outputDir: string): Promise<void> {
  const assets = join(outputDir, "math-assets");
  await mkdir(assets, { recursive: true });
  const katexDir = dirname(require.resolve("katex/dist/katex.min.css"));
  await cp(join(katexDir, "katex.min.css"), join(assets, "katex.min.css"));
  await cp(join(katexDir, "fonts"), join(assets, "fonts"), { recursive: true });
  await cp(require.resolve("gsap/dist/gsap.min.js"), join(assets, "gsap.min.js"));
  await cp(join(templates, "math-styles.css"), join(outputDir, "math-styles.css"));
}
