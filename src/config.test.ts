import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config.js";

const ENV_KEYS = [
  "TTS_PROVIDER",
  "VIETNAMESE_API_KEY",
  "VIETNAMESE_VOICEID",
  "LUCYLAB_ENDPOINT",
  "LUCYLAB_POLL_INTERVAL_MS",
  "LUCYLAB_POLL_TIMEOUT_MS",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "ELEVENLABS_MODEL_ID",
  "ELEVENLABS_ENDPOINT",
  "TTS_CONCURRENCY",
  "VBEE_APP_ID", "VBEE_ACCESS_TOKEN", "VBEE_CALLBACK_URL", "VBEE_VOICE_CODE_VI", "VBEE_VOICE_CODE_EN",
  "VBEE_SPEED", "VBEE_ENDPOINT", "VBEE_POLL_INTERVAL_MS", "VBEE_POLL_TIMEOUT_MS",
];

describe("loadConfig", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    ENV_KEYS.forEach((k) => delete process.env[k]);
  });

  afterEach(() => {
    Object.entries(saved).forEach(([k, v]) => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
  });

  describe("LucyLab provider (default)", () => {
    it("reads LucyLab env vars when no provider specified", () => {
      process.env.VIETNAMESE_API_KEY = "sk_test_abc";
      process.env.VIETNAMESE_VOICEID = "voice123";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("lucylab");
      expect(cfg.lucylabApiKey).toBe("sk_test_abc");
      expect(cfg.lucylabVoiceId).toBe("voice123");
    });

    it("throws when VIETNAMESE_API_KEY missing", () => {
      process.env.VIETNAMESE_VOICEID = "voice123";
      expect(() => loadConfig()).toThrow(/VIETNAMESE_API_KEY/);
    });

    it("uses sensible defaults for optional vars", () => {
      process.env.VIETNAMESE_API_KEY = "k";
      process.env.VIETNAMESE_VOICEID = "v";
      const cfg = loadConfig();
      expect(cfg.lucylabEndpoint).toBe("https://api.lucylab.io/json-rpc");
      expect(cfg.lucylabPollIntervalMs).toBe(2000);
      expect(cfg.lucylabPollTimeoutMs).toBe(120000);
      expect(cfg.ttsConcurrency).toBe(1);
    });
  });

  describe("ElevenLabs provider", () => {
    it("reads ElevenLabs env vars when TTS_PROVIDER=elevenlabs", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_API_KEY = "sk_eleven_xyz";
      process.env.ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("elevenlabs");
      expect(cfg.elevenlabsApiKey).toBe("sk_eleven_xyz");
      expect(cfg.elevenlabsVoiceId).toBe("EXAVITQu4vr4xnSDxMaL");
      expect(cfg.elevenlabsModelId).toBe("eleven_multilingual_v2");
      expect(cfg.elevenlabsEndpoint).toBe("https://api.elevenlabs.io/v1");
    });

    it("throws when ELEVENLABS_API_KEY missing", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_VOICE_ID = "v";
      expect(() => loadConfig()).toThrow(/ELEVENLABS_API_KEY/);
    });

    it("respects ELEVENLABS_MODEL_ID override", () => {
      process.env.TTS_PROVIDER = "elevenlabs";
      process.env.ELEVENLABS_API_KEY = "k";
      process.env.ELEVENLABS_VOICE_ID = "v";
      process.env.ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5";
      const cfg = loadConfig();
      expect(cfg.elevenlabsModelId).toBe("eleven_turbo_v2_5");
    });
  });

  describe("Vbee provider", () => {
    beforeEach(() => {
      process.env.TTS_PROVIDER = "vbee";
      process.env.VBEE_APP_ID = "app-test";
      process.env.VBEE_ACCESS_TOKEN = "token-test";
      process.env.VBEE_CALLBACK_URL = "https://example.com/callback";
    });

    it("loads credentials and defaults without other provider keys", () => {
      const cfg = loadConfig();
      expect(cfg.ttsProvider).toBe("vbee");
      expect(cfg.vbeeAppId).toBe("app-test");
      expect(cfg.vbeeAccessToken).toBe("token-test");
      expect(cfg.vbeeVoiceCodeVi).toBe("n_hanoi_male_sizonguyen_education_vc");
      expect(cfg.vbeeVoiceCodeEn).toBe("am_echo");
      expect(cfg.vbeeSpeed).toBe(1);
      expect(cfg.vbeeEndpoint).toBe("https://api.vbee.vn/v1");
      expect(cfg.vbeePollTimeoutMs).toBe(120000);
    });

    it.each(["VBEE_APP_ID", "VBEE_ACCESS_TOKEN", "VBEE_CALLBACK_URL"])("requires %s", (key) => {
      delete process.env[key];
      expect(() => loadConfig()).toThrow(key);
    });

    it("supports custom voice, speed and polling", () => {
      process.env.VBEE_VOICE_CODE_VI = "custom-voice";
      process.env.VBEE_VOICE_CODE_EN = "custom-english";
      process.env.VBEE_SPEED = "0.25";
      process.env.VBEE_POLL_INTERVAL_MS = "100";
      expect(loadConfig()).toMatchObject({ vbeeVoiceCodeVi: "custom-voice", vbeeVoiceCodeEn: "custom-english", vbeeSpeed: 0.25, vbeePollIntervalMs: 100 });
    });

    it.each(["NaN", "0", "2", ""])("rejects speed %s", (speed) => {
      process.env.VBEE_SPEED = speed;
      expect(() => loadConfig()).toThrow(/VBEE_SPEED/);
    });

    it.each(["0", "-1", "1.5", "bad"])("rejects invalid polling interval %s", (value) => {
      process.env.VBEE_POLL_INTERVAL_MS = value;
      expect(() => loadConfig()).toThrow(/VBEE_POLL_INTERVAL_MS/);
    });

    it("rejects a non-HTTP callback", () => {
      process.env.VBEE_CALLBACK_URL = "file:///tmp/callback";
      expect(() => loadConfig()).toThrow(/VBEE_CALLBACK_URL/);
    });
  });

  it("rejects invalid TTS_PROVIDER", () => {
    process.env.TTS_PROVIDER = "google";
    process.env.VIETNAMESE_API_KEY = "k";
    process.env.VIETNAMESE_VOICEID = "v";
    expect(() => loadConfig()).toThrow(/TTS_PROVIDER/);
  });
});
