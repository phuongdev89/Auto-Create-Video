import { afterEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import nock from "nock";
import { completion, independentFixture, reviewFixture } from "./audit/test-fixtures.js";

const mocks = vi.hoisted(() => ({ generate: vi.fn(), english: vi.fn(), preflight: vi.fn() }));
vi.mock("./tts/tts-client.js", () => ({ createTtsClient: () => ({ generate: mocks.generate }), createEnglishTtsClient: (...args: unknown[]) => { mocks.preflight(...args); return { generate: mocks.english }; } }));
import { runPipeline } from "./pipeline.js";

let session: string;
afterEach(async () => { if (session) await rm(session, { recursive: true, force: true }); nock.cleanAll(); vi.unstubAllEnvs(); vi.clearAllMocks(); });
const tone = async (_text: string, out: string) => {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.35", out]);
};
async function setup(example: string) {
  await mkdir("output", { recursive: true });
  session = await mkdtemp(resolve("output", "math-test-"));
  vi.stubEnv("TTS_PROVIDER", "elevenlabs"); vi.stubEnv("ELEVENLABS_API_KEY", "test-only"); vi.stubEnv("ELEVENLABS_VOICE_ID", "test-male");
  mocks.generate.mockImplementation(tone); mocks.english.mockImplementation(tone); mocks.preflight.mockImplementation(() => {});
  const data = JSON.parse(await readFile(`examples/math/${example}.json`, "utf8"));
  await writeFile(join(session, "script.json"), JSON.stringify(data));
  await writeFile(join(session, "solution.md"), "Unit-test private solution: complete derivation is supplied to mocked verifier.");
  vi.stubEnv("AUDIT_AI_CHAT_URL", "https://audit.example/v1"); vi.stubEnv("AUDIT_AI_KEY", "test-audit-key");
  vi.stubEnv("AUDIT_AI_MODEL", "test-verifier"); vi.stubEnv("AUDIT_AI_STREAM", "false"); vi.stubEnv("AUDIT_AI_TIMEOUT", "10");
  nock("https://audit.example").persist().post("/v1/chat/completions").reply(200, (_uri, body: any) =>
    completion(body.messages[0].content.includes("Solve the ORIGINAL") ? independentFixture() : reviewFixture()));
  return data;
}
describe("math production orchestration", () => {
  it("blocks all TTS calls and transcript production when audit fails", async () => {
    await setup("algebra"); nock.cleanAll();
    nock("https://audit.example").post("/v1/chat/completions").reply(503);
    await expect(runPipeline(join(session, "script.json"), { render: false })).rejects.toThrow(/blocked/);
    expect(mocks.generate).not.toHaveBeenCalled(); expect(mocks.english).not.toHaveBeenCalled();
    await expect(readFile(join(session, "script.txt"))).rejects.toThrow();
    expect(JSON.parse(await readFile(join(session, "verification.json"), "utf8")).status).toBe("unverified");
  });
  it("produces guided audio, transcript and composition without an answer scene", async () => {
    const data = await setup("algebra-guided");
    await runPipeline(join(session, "script.json"), { render: false });
    expect(mocks.generate).toHaveBeenCalledTimes(data.scenes.length);
    expect(mocks.generate.mock.calls.map(([text]) => text).join(" ")).not.toMatch(/sáu|x = 6/);
    const transcript = await readFile(join(session, "script.txt"), "utf8");
    expect(transcript).toContain("Các em tìm được kết quả nào?");
    expect(transcript).not.toMatch(/sáu|x = 6/);
    const html = await readFile(join(session, "index.html"), "utf8");
    expect(html).toContain('id="math-practice"');
    expect(html).not.toContain('id="math-answer"');
    const horizontal = await readFile(join(session, "landscape/index.html"), "utf8");
    expect(horizontal).toContain('data-width="1920" data-height="1080"');
    expect(horizontal).toContain('data-orientation="landscape"');
    expect(horizontal).not.toContain('id="math-answer"');
    expect(horizontal).not.toContain('x = 6');
    const formats = JSON.parse(await readFile(join(session, "formats.json"), "utf8"));
    expect(formats.landscape.video).toBe("video-landscape.mp4");
  }, 30000);
  it("creates composition/audio and regenerates only changed narration", async () => {
    const data = await setup("algebra"); const script = join(session, "script.json");
    await runPipeline(script, { render: false });
    expect(mocks.generate).toHaveBeenCalledTimes(8);
    expect(await readFile(join(session, "index.html"), "utf8")).toContain("math-video");
    const direction = JSON.parse(await readFile(join(session, "scene-plan.json"), "utf8"));
    expect(direction.timing).toBe("measured-audio");
    expect(direction.scenes).toHaveLength(data.scenes.length);
    expect(await readFile(join(session, "math-assets/katex.min.css"), "utf8")).toContain("@font-face");
    await runPipeline(script, { render: false });
    expect(mocks.generate).toHaveBeenCalledTimes(8);
    data.scenes[3].voiceText = "Thầy trừ năm ở cả hai vế để giữ phương trình tương đương.";
    await writeFile(script, JSON.stringify(data)); await runPipeline(script, { render: false });
    expect(mocks.generate).toHaveBeenCalledTimes(9);
  }, 30000);
  it("routes English only to Vbee English and keeps the reading order", async () => {
    const data = await setup("geometry-english");
    await runPipeline(join(session, "script.json"), { render: false });
    expect(mocks.preflight).toHaveBeenCalledOnce();
    expect(mocks.english).toHaveBeenCalledWith(data.problem.original, expect.stringContaining("scene-english.mp3"), expect.stringContaining("scene-english.srt"));
    expect(mocks.generate).toHaveBeenCalledTimes(7);
    expect(mocks.generate.mock.calls.every(([text]) => text !== data.problem.original)).toBe(true);
    const transcript = await readFile(join(session, "script.txt"), "utf8");
    expect(transcript.indexOf(data.problem.original)).toBeLessThan(transcript.indexOf(data.scenes[2].voiceText));
  }, 30000);
  it("fails before Vietnamese API calls if English Vbee config is missing", async () => {
    await setup("geometry-english"); mocks.preflight.mockImplementationOnce(() => { throw new Error("Missing Vbee English config"); });
    await expect(runPipeline(join(session, "script.json"), { render: false })).rejects.toThrow(/Vbee/);
    expect(mocks.generate).not.toHaveBeenCalled(); expect(mocks.english).not.toHaveBeenCalled();
  });
});
