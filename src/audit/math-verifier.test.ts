import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import nock from "nock";
import { MathScriptSchema, type MathScript } from "../render/math-schema.js";
import { verifyMathLesson } from "./math-verifier.js";
import { completion, independentFixture, reviewFixture } from "./test-fixtures.js";

const cfg = { chatUrl: "https://audit.example/v1/chat/completions", apiKey: "test-secret", model: "other-vendor-model", stream: true, timeoutMs: 1000 };
let dir: string, script: MathScript;
beforeEach(async () => {
  await mkdir("output", { recursive: true });
  dir = await mkdtemp(resolve("output", "audit-test-"));
  script = MathScriptSchema.parse(JSON.parse(await readFile("examples/math/algebra-guided.json", "utf8")));
  await writeFile(join(dir, "solution.md"), "CANDIDATE_PRIVATE: 2x=12, x=6. Kiểm tra 2*6+5=17.");
});
afterEach(async () => { nock.cleanAll(); await rm(dir, { recursive: true, force: true }); });
const accept = () => nock("https://audit.example").post("/v1/chat/completions").reply(200, completion(independentFixture()))
  .post("/v1/chat/completions").reply(200, completion(reviewFixture()));
const report = async () => JSON.parse(await readFile(join(dir, "verification.json"), "utf8"));

describe("math verification gate", () => {
  it("solves blind first, introduces candidate only on comparison and reuses a matching pass", async () => {
    const bodies: any[] = [];
    const scope = nock("https://audit.example").post("/v1/chat/completions", body => { bodies.push(body); return true; }).reply(200, completion(independentFixture()))
      .post("/v1/chat/completions", body => { bodies.push(body); return true; }).reply(200, completion(reviewFixture()));
    await verifyMathLesson(script, dir, { config: cfg });
    expect(scope.isDone()).toBe(true);
    expect(JSON.stringify(bodies[0])).not.toMatch(/CANDIDATE_PRIVATE|x = 6|candidateSolution|metadata|voiceText/);
    expect(JSON.stringify(bodies[1])).toContain("CANDIDATE_PRIVATE");
    expect(JSON.stringify(bodies[1])).not.toContain("test-secret");
    expect(bodies[1].messages).toHaveLength(2);
    expect((await report()).status).toBe("pass");
    await verifyMathLesson(script, dir, { config: cfg }); // no network interceptors remain
  });
  it.each(["lesson", "solution", "model"])("reaudits when %s changes", async change => {
    accept(); await verifyMathLesson(script, dir, { config: cfg });
    const original = (await report()).fingerprint;
    if (change === "lesson") script.scenes[3].voiceText = "Thầy hướng dẫn trừ năm ở hai vế.";
    if (change === "solution") await writeFile(join(dir, "solution.md"), "Đổi lời giải: trừ 5 và chia 2 ở cả hai vế. x=6.");
    const updated = change === "model" ? { ...cfg, model: "new-model" } : cfg;
    const scope = accept(); await verifyMathLesson(script, dir, { config: updated });
    expect(scope.isDone()).toBe(true); expect((await report()).fingerprint).not.toBe(original);
  });
  it("invalidates pass before a forced retry fails", async () => {
    accept(); await verifyMathLesson(script, dir, { config: cfg });
    nock("https://audit.example").post("/v1/chat/completions").reply(503, { error: "secret" });
    await expect(verifyMathLesson(script, dir, { config: cfg, force: true })).rejects.toThrow(/unverified/);
    expect((await report()).status).toBe("unverified");
    expect(await readFile(join(dir, "verification.md"), "utf8")).not.toContain("secret");
  });
  it.each(["fail", "uncertain", "missing-aspect", "empty-evidence", "contradictory-pass", "unresolved", "duplicate"])("blocks review %s", async kind => {
    const review = reviewFixture();
    if (kind === "fail") review.verdict = "fail";
    if (kind === "uncertain") review.verdict = "uncertain";
    if (kind === "missing-aspect") review.checks.pop();
    if (kind === "empty-evidence") review.checks[0].evidence = [];
    if (kind === "contradictory-pass") review.checks[1].status = "fail";
    if (kind === "unresolved") review.unresolved = ["Chưa kiểm tra được các trường hợp."];
    if (kind === "duplicate") review.checks.push(review.checks[0]);
    nock("https://audit.example").post("/v1/chat/completions").reply(200, completion(independentFixture()))
      .post("/v1/chat/completions").reply(200, completion(review));
    await expect(verifyMathLesson(script, dir, { config: cfg })).rejects.toThrow(/blocked/);
    expect((await report()).status).not.toBe("pass");
  });
  it("stops after uncertain independent solving", async () => {
    const blind = independentFixture(); blind.status = "uncertain"; blind.unresolved = ["Ảnh thiếu dữ kiện."];
    nock("https://audit.example").post("/v1/chat/completions").reply(200, completion(blind));
    await expect(verifyMathLesson(script, dir, { config: cfg })).rejects.toThrow(/uncertain/);
    expect((await report()).review).toBeUndefined();
  });
  it("requires private solution and rejects image paths outside the session", async () => {
    await rm(join(dir, "solution.md"));
    await expect(verifyMathLesson(script, dir, { config: cfg })).rejects.toThrow(/blocked/);
    expect((await report()).error).toMatch(/Missing solution.md/);
    await writeFile(join(dir, "solution.md"), "x=6");
    script.problem.imagePaths = ["../../examples/math/algebra.json"];
    await expect(verifyMathLesson(script, dir, { config: cfg })).rejects.toThrow(/blocked/);
    expect((await report()).error).toMatch(/inside the current session/);
  });
  it("includes actual source image bytes in both calls and detects an image change", async () => {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7WQAAAAASUVORK5CYII=", "base64");
    await writeFile(join(dir, "source.png"), png); script.problem.imagePaths = ["source.png"];
    const scope = nock("https://audit.example").post("/v1/chat/completions", body => body.messages[1].content[1].image_url.url === `data:image/png;base64,${png.toString("base64")}`).reply(200, completion(independentFixture()))
      .post("/v1/chat/completions", body => body.messages[1].content[1].type === "image_url").reply(200, completion(reviewFixture()));
    await verifyMathLesson(script, dir, { config: cfg }); expect(scope.isDone()).toBe(true);
    const fingerprint = (await report()).fingerprint;
    await writeFile(join(dir, "source.png"), Buffer.concat([png, Buffer.from("changed")]));
    accept(); await verifyMathLesson(script, dir, { config: cfg });
    expect((await report()).fingerprint).not.toBe(fingerprint);
  });
});
