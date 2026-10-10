import { z } from "zod";
import { renderFormula } from "./math-expression.js";

const text = z.string().trim().min(1);
const latex = text.superRefine((value, ctx) => {
  try { renderFormula(value); } catch (error) { ctx.addIssue({ code: "custom", message: `Invalid math expression: ${String(error)}` }); }
});
const coord = z.number().finite().min(0).max(900);
const point = z.object({ x: coord, y: z.number().finite().min(0).max(500) });
const color = z.enum(["ink", "blue", "green", "orange"]).default("ink");
export const DiagramShape = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("line"), from: point, to: point, color }),
  z.object({ kind: z.literal("circle"), center: point, radius: z.number().positive().max(240), color }),
  z.object({ kind: z.literal("polygon"), points: z.array(point).min(3).max(100), color }),
  z.object({ kind: z.literal("label"), at: point, text, color }),
]);
export const MathTemplateData = z.discriminatedUnion("template", [
  z.object({ template: z.literal("math-intro"), title: text, subtitle: text.optional() }),
  z.object({ template: z.literal("math-problem"), title: text.default("Đề bài"), text, latex: latex.optional() }),
  z.object({ template: z.literal("math-step"), title: text, explanation: text.optional(),
    equations: z.array(latex).max(4).default([]), note: text.optional() }),
  z.object({ template: z.literal("math-diagram"), title: text, shapes: z.array(DiagramShape).min(1).max(100),
    explanation: text.optional(), latex: latex.optional() }),
  z.object({ template: z.literal("math-answer"), title: text.default("Đáp án"), answer: latex,
    explanation: text.optional(), takeaway: text.optional() }),
  z.object({ template: z.literal("math-closing"), title: text.default("Các em làm tốt lắm!"), message: text }),
]);
const MathScene = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Scene id must be a safe filename"),
  type: z.enum(["hook", "body", "outro"]),
  phase: z.enum(["introduction", "problem", "read-english", "read-translation", "strategy", "solution", "check", "answer", "practice", "closing"]),
  voiceText: z.string().default(""),
  englishText: text.optional(),
  templateData: MathTemplateData,
  sfx: z.object({ name: text, volume: z.number().min(0).max(1).default(0.2), startOffsetSec: z.number().default(0) }).optional(),
});
const normalized = (s: string) => s.replace(/\s+/g, " ").trim();
export const MathScriptSchema = z.object({
  version: z.literal("2.0"),
  solutionMode: z.enum(["answer", "guided"]).default("answer"),
  metadata: z.object({
    title: text, channel: text.default("Học Toán cùng thầy"),
    source: z.object({ url: z.string().default("local"), domain: z.string().default("Bài học toán"),
      image: z.string().url().nullable().default(null) }).default({ url: "local", domain: "Bài học toán", image: null }),
  }),
  problem: z.object({ original: text, language: z.enum(["vi", "en"]).default("vi"),
    translation: text.optional(), answer: latex.optional(), topic: text.optional(), level: text.optional(),
    imagePaths: z.array(text).max(10).optional() }),
  voice: z.object({ provider: z.enum(["lucylab", "elevenlabs", "vbee"]), voiceId: text,
    gender: z.literal("male"), speed: z.number().min(0.5).max(1.9).default(1) }),
  scenes: z.array(MathScene).min(6).max(100),
}).superRefine((s, ctx) => {
  const issue = (message: string, path: (string | number)[] = ["scenes"]) => ctx.addIssue({ code: "custom", message, path });
  const ids = new Set<string>();
  s.scenes.forEach((scene, i) => {
    const allowed: Record<string, string[]> = {
      introduction: ["math-intro"], problem: ["math-problem"], "read-english": ["math-problem"],
      "read-translation": ["math-problem"], strategy: ["math-step", "math-diagram"],
      solution: ["math-step", "math-diagram"], check: ["math-step", "math-diagram"],
      answer: ["math-answer"], practice: ["math-step"], closing: ["math-closing"],
    };
    if (!allowed[scene.phase].includes(scene.templateData.template)) issue("Template must match the lesson phase", ["scenes", i, "templateData"]);
    if (scene.templateData.template === "math-step" && !scene.templateData.equations.length && !scene.templateData.explanation && !scene.templateData.note)
      issue("A reasoning step needs an explanation or equation", ["scenes", i, "templateData"]);
    if (ids.has(scene.id)) issue("Scene ids must be unique", ["scenes", i, "id"]);
    ids.add(scene.id);
    if (scene.phase === "read-english") {
      if (!scene.englishText || scene.voiceText.trim()) issue("English reading uses englishText only, never Vietnamese voiceText", ["scenes", i]);
      if (scene.templateData.template !== "math-problem" || scene.templateData.text !== scene.englishText)
        issue("Display the exact English passage while reading it", ["scenes", i, "templateData"]);
    } else {
      if (!scene.voiceText.trim() || scene.englishText) issue("Vietnamese scenes require voiceText and no englishText", ["scenes", i]);
      if (/[\d+\-=/%$#*&→×÷<>≤≥^\\]|https?:\/\/|\p{Extended_Pictographic}/u.test(scene.voiceText))
        issue("Write numbers and mathematical signs in Vietnamese words; no emoji or URLs in voiceText", ["scenes", i, "voiceText"]);
    }
    const visible = JSON.stringify(scene.templateData);
    if (/(^|[^\p{L}])cô([^\p{L}]|$)/iu.test(scene.voiceText + " " + visible))
      issue("Use the male teacher persona: thầy", ["scenes", i]);
  });
  const first = s.scenes[0], last = s.scenes.at(-1)!;
  const opening = first.voiceText.trim().toLowerCase();
  if (first.type !== "hook" || first.phase !== "introduction" || !/^(thầy\s+chào|(xin\s+)?chào)/iu.test(opening) || !/thầy/iu.test(opening)
    || !/các (em|con|bạn nhỏ)/iu.test(opening) || opening.indexOf("hôm nay") <= opening.indexOf("chào"))
    issue("Begin with thầy greeting the audience, then today's purpose", ["scenes", 0]);
  const lastSentence = last.voiceText.split(/[.!?]/).map(x => x.trim()).filter(Boolean).at(-1) ?? "";
  if (last.type !== "outro" || last.phase !== "closing" || !/thầy.*chúc/iu.test(lastSentence))
    issue("The final spoken sentence must be thầy's closing wish", ["scenes", s.scenes.length - 1]);
  if (s.scenes.slice(1, -1).some(x => x.type !== "body") || s.scenes.slice(1).some(x => x.phase === "introduction") || s.scenes.slice(0, -1).some(x => x.phase === "closing"))
    issue("Only the first scene opens and only the final scene closes the lesson");
  const phases = s.scenes.map(x => x.phase);
  const solution = phases.indexOf("solution"), check = phases.indexOf("check"), answer = phases.indexOf("answer");
  const ending = s.solutionMode === "guided" ? phases.indexOf("practice") : answer;
  if (solution < 0 || check <= solution || ending <= check) issue("Include solution → check → answer or practice, in that order");
  if (phases.lastIndexOf("solution") >= check || phases.lastIndexOf("check") >= ending) issue("Finish all solution steps before verification and the answer or practice");
  if (s.solutionMode === "guided") {
    if (s.problem.answer !== undefined || answer >= 0 || s.scenes.some(x => x.templateData.template === "math-answer"))
      issue("Guided lessons must omit problem.answer and answer scenes; leave the final answer open");
    if (!phases.includes("strategy") || phases.filter(p => p === "practice").length !== 1)
      issue("Guided lessons require a strategy and one practice scene for the learner to finish");
  } else {
    if (!s.problem.answer) issue("Answer lessons require problem.answer", ["problem", "answer"]);
    const answerScenes = s.scenes.filter(x => x.phase === "answer");
    if (answerScenes.length !== 1 || answerScenes[0]?.templateData.template !== "math-answer" || answerScenes[0].templateData.answer !== s.problem.answer)
      issue("One math-answer scene must match problem.answer exactly");
    if (phases.includes("practice")) issue("Practice scenes are reserved for guided lessons");
  }
  if (s.problem.language === "en") {
    const english = s.scenes.filter(x => x.phase === "read-english");
    const translated = s.scenes.filter(x => x.phase === "read-translation");
    if (!s.problem.translation || normalized(english.map(x => x.englishText ?? "").join(" ")) !== normalized(s.problem.original))
      issue("Read the complete original English problem verbatim", ["problem", "original"]);
    if (!translated.length || normalized(translated.map(x => x.templateData.template === "math-problem" ? x.templateData.text : "").join(" ")) !== normalized(s.problem.translation ?? ""))
      issue("Display and read the complete Vietnamese translation", ["problem", "translation"]);
    if (!/tiếng Anh/iu.test(first.voiceText)) issue("Announce reading the English problem in the opening");
    const ranks: Record<string, number> = { introduction: 0, "read-english": 1, "read-translation": 2, strategy: 3, solution: 4, check: 5, answer: 6, practice: 6, closing: 7 };
    if (phases.some((p, i) => ranks[p] === undefined || (i > 0 && ranks[p] < ranks[phases[i - 1]])))
      issue("English lesson order: opening → English original → Vietnamese translation → solution → check → answer or practice → wish");
  } else {
    const problems = s.scenes.filter(x => x.phase === "problem");
    if (!problems.length || normalized(problems.map(x => x.templateData.template === "math-problem" ? x.templateData.text : "").join(" ")) !== normalized(s.problem.original))
      issue("Display the complete original problem before solving");
    const ranks: Record<string, number> = { introduction: 0, problem: 1, strategy: 2, solution: 3, check: 4, answer: 5, practice: 5, closing: 6 };
    if (phases.some((p, i) => ranks[p] === undefined || (i > 0 && ranks[p] < ranks[phases[i - 1]]))) issue("Read the problem before solution, check and answer");
  }
  if (/female/i.test(s.voice.voiceId)) issue("Select a male TTS voice", ["voice", "voiceId"]);
});
export type MathScript = z.infer<typeof MathScriptSchema>;
export type MathTemplate = z.infer<typeof MathTemplateData>;
