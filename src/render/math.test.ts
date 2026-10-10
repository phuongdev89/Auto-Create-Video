import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MathScriptSchema } from "./math-schema.js";
import { ScriptSchema } from "./script-schema.js";
import { composeHtml } from "./html-composer.js";
const load = (file = "algebra") => JSON.parse(readFileSync(`examples/math/${file}.json`, "utf8"));

describe("math lesson contract", () => {
  it("rejects illustrations deferred beyond the first reasoning scene", () => {
    const s = load(); s.problem.requiresIllustration = true;
    expect(() => MathScriptSchema.parse(s)).toThrow(/first strategy or solution/);
    const i = s.scenes.findIndex((scene: {phase:string}) => ['strategy','solution'].includes(scene.phase));
    s.scenes[i].templateData.teachingAid = {description:'Nhóm đồ vật đang xét',nodes:[{kind:'path',path:'M10 10H80V80H10Z'}]};
    expect(() => MathScriptSchema.parse(s)).not.toThrow();
    s.scenes[i+1].needsIllustration = true;
    expect(() => MathScriptSchema.parse(s)).toThrow(/same scene/);
  });
  it("requires declared hook questions to be spoken and renders them in the opening", () => {
    const s = load();
    const question = 'Các em tìm được số còn thiếu không?';
    s.scenes[0].templateData.hookQuestion = question;
    expect(() => MathScriptSchema.parse(s)).toThrow(/spoken verbatim/);
    s.scenes[0].voiceText += ' ' + question;
    const script = MathScriptSchema.parse(s);
    const html = composeHtml({script,sceneAudio:script.scenes.map(scene=>({id:scene.id,durationSec:10})),gapSec:.3,audioRelPath:'voice.mp3',bgImageRelPath:null});
    expect(html).toContain('class="math-hook-question"');
    expect(html).toContain(question);
    s.scenes[0].templateData.hookQuestion = 'Câu hỏi thiếu dấu';
    expect(() => MathScriptSchema.parse(s)).toThrow(/opening hook question/);
  });
  it.each(["algebra", "algebra-guided", "geometry-english", "calculus"])("accepts verified example %s", file => {
    expect(ScriptSchema.parse(load(file)).version).toBe("2.0");
  });
  it("keeps existing lessons in answer mode and requires their answer", () => {
    expect(MathScriptSchema.parse(load()).solutionMode).toBe("answer");
    const s = load(); delete s.problem.answer;
    expect(() => MathScriptSchema.parse(s)).toThrow(/require problem.answer/);
  });
  it("rejects final-answer fields and scenes in guided mode", () => {
    const s = load("algebra-guided"); s.problem.answer = "x = 6";
    expect(() => MathScriptSchema.parse(s)).toThrow(/leave the final answer open/);
    const a = load("algebra-guided"); a.scenes.splice(-1, 0, load().scenes[6]);
    expect(() => MathScriptSchema.parse(a)).toThrow(/leave the final answer open/);
  });
  it("requires a strategy and one practice after self-check in guided mode", () => {
    const noStrategy = load("algebra-guided"); noStrategy.scenes.splice(2, 1);
    expect(() => MathScriptSchema.parse(noStrategy)).toThrow(/require a strategy/);
    const noPractice = load("algebra-guided"); noPractice.scenes.splice(6, 1);
    expect(() => MathScriptSchema.parse(noPractice)).toThrow(/practice/);
    const twice = load("algebra-guided"); twice.scenes.splice(7, 0, { ...twice.scenes[6], id: "practice-again" });
    expect(() => MathScriptSchema.parse(twice)).toThrow(/one practice/);
    const early = load("algebra-guided"); [early.scenes[5], early.scenes[6]] = [early.scenes[6], early.scenes[5]];
    expect(() => MathScriptSchema.parse(early)).toThrow(/order|verification/);
  });
  it("rejects practice in answer mode and unknown modes", () => {
    const s = load(); s.scenes.splice(-1, 0, load("algebra-guided").scenes[6]);
    expect(() => MathScriptSchema.parse(s)).toThrow(/reserved for guided/);
    const bad = load(); bad.solutionMode = "other";
    expect(() => MathScriptSchema.parse(bad)).toThrow();
  });
  it("retains complete English reading and translation in guided mode", () => {
    const s = load("algebra-guided");
    s.problem.language = "en"; s.problem.translation = s.problem.original;
    s.problem.original = "Find x such that 2x + 5 = 17.";
    s.scenes[0].voiceText += " Trước tiên, thầy đọc đề bằng tiếng Anh.";
    s.scenes[1].phase = "read-translation";
    s.scenes.splice(1, 0, { id: "english", type: "body", phase: "read-english", voiceText: "", englishText: s.problem.original,
      templateData: { template: "math-problem", text: s.problem.original } });
    expect(MathScriptSchema.parse(s).solutionMode).toBe("guided");
    s.scenes[2].templateData.text = "Bản dịch không đủ.";
    expect(() => MathScriptSchema.parse(s)).toThrow(/complete Vietnamese translation/);
  });
  it("accepts lessons beyond eight scenes without cutting steps", () => {
    const s = load();
    s.scenes.splice(5, 0, ...Array.from({ length: 5 }, (_, i) => ({ ...s.scenes[4], id: `extra-${i}` })));
    expect(MathScriptSchema.parse(s).scenes).toHaveLength(13);
  });
  it.each(["Hai cộng 2.", "Hai + ba.", "Thầy xem https://example.com.", "Thầy chào 😊."])("rejects invalid Vietnamese narration %s", voiceText => {
    const s = load(); s.scenes[3].voiceText = voiceText;
    expect(() => MathScriptSchema.parse(s)).toThrow(/Vietnamese words/);
  });
  it("rejects unsafe/duplicate scene IDs", () => {
    const s = load(); s.scenes[3].id = "../../voice";
    expect(() => MathScriptSchema.parse(s)).toThrow(/safe filename/);
    s.scenes[3].id = s.scenes[2].id;
    expect(() => MathScriptSchema.parse(s)).toThrow(/unique/);
  });
  it("requires greeting, purpose, final wish and matching answer", () => {
    const s = load(); s.scenes[0].voiceText = "Thầy giải phương trình.";
    expect(() => MathScriptSchema.parse(s)).toThrow(/greeting/);
    const closing = load(); closing.scenes.at(-1).voiceText = "Theo dõi để xem bài mới.";
    expect(() => MathScriptSchema.parse(closing)).toThrow(/wish/);
    const wrong = load(); wrong.scenes[6].templateData.answer = "x=7";
    expect(() => MathScriptSchema.parse(wrong)).toThrow(/match problem.answer/);
  });
  it("rejects greeting after the lesson has already started", () => {
    const s = load(); s.scenes[0].voiceText = "Hôm nay thầy giải toán. Thầy chào các em.";
    expect(() => MathScriptSchema.parse(s)).toThrow(/greeting/);
  });
  it("accepts verbal proof steps and prevents early answer templates", () => {
    const s = load(); s.scenes[3].templateData = { template: "math-step", title: "Lập luận", explanation: "Cùng trừ một số ở hai vế giữ phương trình tương đương." };
    expect(MathScriptSchema.parse(s).scenes[3].templateData.template).toBe("math-step");
    s.scenes[3].templateData = { template: "math-answer", answer: "x=6" };
    expect(() => MathScriptSchema.parse(s)).toThrow(/phase/);
  });
  it("requires solution verification before revealing the answer", () => {
    const s = load(); [s.scenes[3], s.scenes[5]] = [s.scenes[5], s.scenes[3]];
    expect(() => MathScriptSchema.parse(s)).toThrow(/order|verification/);
  });
  it("validates formulas before TTS", () => {
    const s = load(); s.scenes[3].templateData.equations = ["\\frac{"];
    expect(() => MathScriptSchema.parse(s)).toThrow(/Invalid math expression/);
  });
  it("enforces male persona and voice declaration", () => {
    const s = load(); s.voice.gender = "female";
    expect(() => MathScriptSchema.parse(s)).toThrow();
    const p = load(); p.scenes[3].voiceText = "Cô giải bài này.";
    expect(() => MathScriptSchema.parse(p)).toThrow(/thầy/);
  });
  it("requires verbatim English and complete translation before solving", () => {
    const s = load("geometry-english"); s.scenes[1].englishText = "A right triangle.";
    s.scenes[1].templateData.text = s.scenes[1].englishText;
    expect(() => MathScriptSchema.parse(s)).toThrow(/verbatim/);
    const t = load("geometry-english"); t.scenes[2].templateData.text = "Bản dịch ngắn.";
    expect(() => MathScriptSchema.parse(t)).toThrow(/complete Vietnamese translation/);
    const order = load("geometry-english"); [order.scenes[2], order.scenes[3]] = [order.scenes[3], order.scenes[2]];
    expect(() => MathScriptSchema.parse(order)).toThrow(/English lesson order/);
  });
});
describe("math composition", () => {
  it.each(["algebra", "algebra-guided", "geometry-english", "calculus"])("renders %s with actual math markup and lesson branding", file => {
    const script = MathScriptSchema.parse(load(file));
    const html = composeHtml({ script, sceneAudio: script.scenes.map(s => ({ id: s.id, durationSec: 5 })), gapSec: .3, bgImageRelPath: null, audioRelPath: "voice.mp3" });
    expect(html).toContain('data-composition-id="math-video"');
    expect(html).toContain('class="katex"');
    expect(html).toContain("GIẢI TOÁN TỪNG BƯỚC");
    expect(html).not.toContain("TIN CÔNG NGHỆ");
    expect(html).not.toContain("tt-card");
    expect(html).not.toContain("cdn.jsdelivr.net");
    if (file === "geometry-english") expect(html).toContain('viewBox="0 0 900 500"');
    if (file === "algebra-guided") {
      expect(html).toContain('id="math-practice"');
      expect(html).toContain("Các em tự hoàn thành");
      expect(html).not.toContain('id="math-answer"');
      expect(JSON.stringify(script)).not.toMatch(/x = 6|sáu/);
    }
    const total = script.scenes.length * 5 + (script.scenes.length - 1) * .3;
    expect(html).toContain(`data-duration="${(total + 3).toFixed(4)}"`);
    expect(html).toContain(`data-duration="${total.toFixed(4)}"`);
  });
  it("escapes problem text and fails on missing scene audio", () => {
    const raw = load(); raw.problem.original = '<script>alert("x")</script>';
    raw.scenes[1].templateData.text = raw.problem.original;
    const script = MathScriptSchema.parse(raw);
    const args = { script, sceneAudio: script.scenes.map(s => ({ id: s.id, durationSec: 2 })), gapSec: .3, bgImageRelPath: null, audioRelPath: "voice.mp3" };
    expect(composeHtml(args)).toContain("&lt;script&gt;");
    expect(() => composeHtml({ ...args, sceneAudio: [] })).toThrow(/audio/);
  });
});
