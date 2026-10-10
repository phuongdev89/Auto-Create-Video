import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { readFileSync, mkdtempSync, rmSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { VbeeClient } from "./vbee-client.js";
import { createTtsClient, createEnglishTtsClient } from "./tts-client.js";
import { mathAudioFingerprint } from "./audio-cache.js";
import { MathScriptSchema } from "../render/math-schema.js";
import { loadConfig } from "../config.js";

const opts = {
  appId: "app-test", accessToken: "secret-token", callbackUrl: "https://example.com/callback",
  voiceCode: "hn_female_thutrang_48k-fhg", speed: 1.1,
  endpoint: "https://api.vbee.vn/v1/", pollIntervalMs: 1, pollTimeoutMs: 500,
};
let dir: string;
const api = () => nock("https://api.vbee.vn", { reqheaders: { authorization: "Bearer secret-token", "app-id": "app-test" } });
const submit = () => api().post("/v1/tts").reply(200, { requestId: "req-1", status: "PROCESSING" });
const done = () => api().get("/v1/tts/requests/req-1").reply(200, { status: "COMPLETED", audioLink: "https://cdn.vbee.vn/test.mp3" });

beforeEach(() => { nock.disableNetConnect(); dir = mkdtempSync(join(tmpdir(), "vbee-test-")); });
afterEach(() => { nock.cleanAll(); nock.enableNetConnect(); rmSync(dir, { recursive: true, force: true }); });

describe("VbeeClient", () => {
  it("submits the official payload, polls, downloads actual MP3 bytes without credentials or SRT", async () => {
    const request = api().post("/v1/tts", {
      text: "Xin chào", mode: "async", voiceCode: opts.voiceCode,
      outputFormat: "mp3", bitrate: 128, speed: 1.1, webhookUrl: opts.callbackUrl,
    }).reply(200, { requestId: "req-1", status: "PROCESSING" });
    const poll = api().get("/v1/tts/requests/req-1").reply(200, { status: "PROCESSING" });
    const complete = done();
    const audio = readFileSync("tests/fixtures/sample-audio-1.mp3");
    const cdn = nock("https://cdn.vbee.vn", { badheaders: ["authorization", "app-id"] })
      .get("/test.mp3").reply(200, audio, { "content-type": "audio/mpeg" });
    const output = join(dir, "nested", "voice.mp3");
    await new VbeeClient(opts).generate(" Xin chào ", output, join(dir, "voice.srt"));
    expect(readFileSync(output)).toEqual(audio);
    expect(existsSync(join(dir, "voice.srt"))).toBe(false);
    expect(readdirSync(join(dir, "nested"))).toEqual(["voice.mp3"]);
    expect([request, poll, complete, cdn].every((scope) => scope.isDone())).toBe(true);
  });

  it("factory selects Vbee", () => {
    expect(createTtsClient({ ...loadConfigForTest(), ttsProvider: "vbee", vbeeAppId: opts.appId,
      vbeeAccessToken: opts.accessToken, vbeeCallbackUrl: opts.callbackUrl })).toBeInstanceOf(VbeeClient);
  });

  it("English factory submits am_echo at 0.9 while Vietnamese uses another provider", async () => {
    const cfg = { ...loadConfigForTest(), vbeeAppId: opts.appId, vbeeAccessToken: opts.accessToken,
      vbeeCallbackUrl: opts.callbackUrl, vbeeVoiceCodeEn: "am_echo", vbeeEndpoint: opts.endpoint,
      vbeePollIntervalMs: 1, vbeePollTimeoutMs: 500 };
    const original = "What is 3 + 4?";
    const submitted = api().post("/v1/tts", body => body.text === original && body.voiceCode === "am_echo" && body.speed === 0.9)
      .reply(200, { requestId: "req-1", status: "PROCESSING" });
    done(); nock("https://cdn.vbee.vn").get("/test.mp3").reply(200, readFileSync("tests/fixtures/sample-audio-1.mp3"), { "content-type": "audio/mpeg" });
    await createEnglishTtsClient(cfg).generate(original, join(dir, "english.mp3"));
    expect(submitted.isDone()).toBe(true);
  });

  it("English factory rejects missing credentials before making requests", () => {
    expect(() => createEnglishTtsClient({ ...loadConfigForTest(), vbeeAppId: undefined })).toThrow(/VBEE_APP_ID/);
  });

  it("changing English voice invalidates only English narration cache", () => {
    const script = MathScriptSchema.parse(JSON.parse(readFileSync("examples/math/geometry-english.json", "utf8")));
    const cfg = loadConfigForTest(), changed = { ...cfg, vbeeVoiceCodeEn: "new-english" };
    expect(mathAudioFingerprint(script.scenes[1], cfg)).not.toBe(mathAudioFingerprint(script.scenes[1], changed));
    expect(mathAudioFingerprint(script.scenes[2], cfg)).toBe(mathAudioFingerprint(script.scenes[2], changed));
  });

  it("rejects failed synthesis without writing an MP3", async () => {
    submit(); api().get("/v1/tts/requests/req-1").reply(200, { status: "FAILED" });
    await expect(new VbeeClient(opts).generate("hello", join(dir, "voice.mp3"))).rejects.toThrow(/failed/);
    expect(existsSync(join(dir, "voice.mp3"))).toBe(false);
  });

  it("times out polling", async () => {
    submit(); api().persist().get("/v1/tts/requests/req-1").reply(200, { status: "PROCESSING" });
    await expect(new VbeeClient({ ...opts, pollTimeoutMs: 30 }).generate("hello", join(dir, "voice.mp3")))
      .rejects.toThrow(/timeout/);
  });

  it.each([
    { error: { code: "BAD_REQUEST", message: "Invalid voice" } },
    { status: "PROCESSING" },
    { status: "COMPLETED" },
  ])("rejects malformed or error responses %j", async (response) => {
    api().post("/v1/tts").reply(200, response);
    await expect(new VbeeClient(opts).generate("hello", join(dir, "voice.mp3"))).rejects.toThrow(/Vbee/);
  });

  it.each([401, 429, 500])("reports HTTP %s without leaking credentials or resubmitting", async (status) => {
    const scope = api().post("/v1/tts").once().reply(status, { error: { code: "UNAUTHORIZED" } });
    await expect(new VbeeClient(opts).generate("hello", join(dir, "voice.mp3")))
      .rejects.toThrow(`Vbee API failed (HTTP ${status}, UNAUTHORIZED)`);
    expect(scope.isDone()).toBe(true);
  });

  it("preserves an existing file when download fails", async () => {
    const output = join(dir, "voice.mp3"); writeFileSync(output, "original");
    submit(); done(); nock("https://cdn.vbee.vn").get("/test.mp3").reply(403);
    await expect(new VbeeClient(opts).generate("hello", output)).rejects.toThrow(/download failed/);
    expect(readFileSync(output, "utf8")).toBe("original");
  });

  it("rejects JSON masquerading as downloaded audio", async () => {
    submit(); done(); nock("https://cdn.vbee.vn").get("/test.mp3").reply(200, { error: "expired" });
    await expect(new VbeeClient(opts).generate("hello", join(dir, "voice.mp3"))).rejects.toThrow(/did not return audio/);
  });

  it("rejects empty input before any request", async () => {
    await expect(new VbeeClient(opts).generate(" ", join(dir, "voice.mp3"))).rejects.toThrow(/empty/);
  });
});

function loadConfigForTest() {
  const saved = { provider: process.env.TTS_PROVIDER, key: process.env.VIETNAMESE_API_KEY, voice: process.env.VIETNAMESE_VOICEID };
  try {
    process.env.TTS_PROVIDER = "lucylab"; process.env.VIETNAMESE_API_KEY = "test"; process.env.VIETNAMESE_VOICEID = "test";
    return loadConfig();
  } finally {
    for (const [key, value] of Object.entries({ TTS_PROVIDER: saved.provider, VIETNAMESE_API_KEY: saved.key, VIETNAMESE_VOICEID: saved.voice })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}
