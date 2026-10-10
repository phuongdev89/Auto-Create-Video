import { config as loadEnv } from "dotenv";
// Project-specific settings win over the legacy .env fallback; inherited env remains authoritative.
loadEnv({ path: [".env.local", ".env"], quiet: true });

export type TtsProvider = "lucylab" | "elevenlabs" | "vbee";

export interface AuditConfig {
  chatUrl: string;
  apiKey: string;
  model: string;
  stream: boolean;
  timeoutMs: number;
}

/** Independent of TTS credentials so verification can run before production. */
export function loadAuditConfig(): AuditConfig {
  const required = (name: string) => {
    const value = process.env[name]?.trim();
    if (!value || /^(sk-)?x+$|xxxxxxxx|your_/i.test(value)) throw new Error(`Missing real ${name}; configure .env.local or .env.`);
    return value;
  };
  const base = new URL(required("AUDIT_AI_CHAT_URL"));
  if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash)
    throw new Error("AUDIT_AI_CHAT_URL must be an HTTP(S) URL without embedded credentials, query or fragment.");
  const stream = process.env.AUDIT_AI_STREAM?.trim() ?? "true";
  if (!["true", "false"].includes(stream)) throw new Error("AUDIT_AI_STREAM must be true or false.");
  const timeout = Number(process.env.AUDIT_AI_TIMEOUT ?? "300");
  if (!Number.isFinite(timeout) || timeout <= 0 || timeout > 3600) throw new Error("AUDIT_AI_TIMEOUT must be seconds in (0, 3600].");
  const path = base.pathname.replace(/\/+$/, "");
  base.pathname = path.endsWith("/chat/completions") ? path : `${path}/chat/completions`;
  return { chatUrl: base.toString(), apiKey: required("AUDIT_AI_KEY"), model: required("AUDIT_AI_MODEL"), stream: stream === "true", timeoutMs: timeout * 1000 };
}

export interface TiktokConfig {
  displayName: string;
  handle: string;
  followers: string;
  /** URL to download avatar JPG. If undefined, the bundled `assets/avatar.jpg` is used. */
  avatarUrl?: string;
}

export interface Config {
  ttsProvider: TtsProvider;

  // LucyLab
  lucylabApiKey?: string;
  lucylabVoiceId?: string;
  lucylabEndpoint: string;
  lucylabPollIntervalMs: number;
  lucylabPollTimeoutMs: number;

  // ElevenLabs
  elevenlabsApiKey?: string;
  elevenlabsVoiceId?: string;
  elevenlabsModelId: string;
  elevenlabsEndpoint: string;

  // Vbee Batch API
  vbeeAppId?: string;
  vbeeAccessToken?: string;
  vbeeCallbackUrl?: string;
  vbeeVoiceCodeVi: string;
  vbeeVoiceCodeEn: string;
  vbeeSpeed: number;
  vbeeEndpoint: string;
  vbeePollIntervalMs: number;
  vbeePollTimeoutMs: number;

  // TikTok follow card (outro)
  tiktok: TiktokConfig;

  ttsConcurrency: number;
}

function intDefault(name: string, def: number): number {
  const v = process.env[name];
  if (!v) return def;
  const n = parseInt(v, 10);
  if (isNaN(n)) throw new Error(`Env var ${name} must be integer, got "${v}"`);
  return n;
}

export function loadConfig(): Config {
  const provider = (process.env.TTS_PROVIDER ?? "lucylab") as TtsProvider;
  if (provider !== "lucylab" && provider !== "elevenlabs" && provider !== "vbee") {
    throw new Error(`TTS_PROVIDER must be "lucylab", "elevenlabs" or "vbee", got "${provider}"`);
  }

  // Validate provider-specific required vars
  if (provider === "lucylab") {
    if (!process.env.VIETNAMESE_API_KEY || process.env.VIETNAMESE_API_KEY.trim() === "") {
      throw new Error(
        `Missing VIETNAMESE_API_KEY (required when TTS_PROVIDER=lucylab). ` +
        `Copy .env.example to .env.local and fill in your LucyLab API key.`
      );
    }
    if (!process.env.VIETNAMESE_VOICEID || process.env.VIETNAMESE_VOICEID.trim() === "") {
      throw new Error(
        `Missing VIETNAMESE_VOICEID (required when TTS_PROVIDER=lucylab). ` +
        `Copy .env.example to .env.local and fill in your LucyLab voice ID.`
      );
    }
  } else if (provider === "elevenlabs") {
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY.trim() === "") {
      throw new Error(
        `Missing ELEVENLABS_API_KEY (required when TTS_PROVIDER=elevenlabs). ` +
        `Copy .env.example to .env.local and fill in your ElevenLabs API key.`
      );
    }
    if (!process.env.ELEVENLABS_VOICE_ID || process.env.ELEVENLABS_VOICE_ID.trim() === "") {
      throw new Error(
        `Missing ELEVENLABS_VOICE_ID (required when TTS_PROVIDER=elevenlabs). ` +
        `Copy .env.example to .env.local and fill in your ElevenLabs voice ID.`
      );
    }
  } else {
    for (const key of ["VBEE_APP_ID", "VBEE_ACCESS_TOKEN", "VBEE_CALLBACK_URL"]) {
      if (!process.env[key]?.trim()) {
        throw new Error(`Missing ${key} (required when TTS_PROVIDER=vbee). Configure it in .env.local.`);
      }
    }
    const callback = new URL(process.env.VBEE_CALLBACK_URL!);
    if (!["https:", "http:"].includes(callback.protocol)) {
      throw new Error("VBEE_CALLBACK_URL must be an HTTP(S) webhook URL");
    }
  }

  const vbeeSpeed = Number(process.env.VBEE_SPEED ?? "1");
  const vbeePollIntervalMs = Number(process.env.VBEE_POLL_INTERVAL_MS ?? "2000");
  const vbeePollTimeoutMs = Number(process.env.VBEE_POLL_TIMEOUT_MS ?? "120000");
  if (provider === "vbee") {
    if (!Number.isFinite(vbeeSpeed) || vbeeSpeed < 0.25 || vbeeSpeed > 1.9) {
      throw new Error("VBEE_SPEED must be a number between 0.25 and 1.9");
    }
    for (const [key, value] of Object.entries({
      VBEE_POLL_INTERVAL_MS: vbeePollIntervalMs, VBEE_POLL_TIMEOUT_MS: vbeePollTimeoutMs,
    })) {
      if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${key} must be a positive integer`);
    }
    for (const name of ["VBEE_VOICE_CODE_VI", "VBEE_VOICE_CODE_EN"]) {
      if (process.env[name] !== undefined && !process.env[name]!.trim()) throw new Error(`${name} must not be empty`);
    }
  }

  return {
    ttsProvider: provider,
    lucylabApiKey: process.env.VIETNAMESE_API_KEY,
    lucylabVoiceId: process.env.VIETNAMESE_VOICEID,
    lucylabEndpoint: process.env.LUCYLAB_ENDPOINT ?? "https://api.lucylab.io/json-rpc",
    lucylabPollIntervalMs: intDefault("LUCYLAB_POLL_INTERVAL_MS", 2000),
    lucylabPollTimeoutMs: intDefault("LUCYLAB_POLL_TIMEOUT_MS", 120000),
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
    elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
    elevenlabsModelId: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
    elevenlabsEndpoint: process.env.ELEVENLABS_ENDPOINT ?? "https://api.elevenlabs.io/v1",
    vbeeAppId: process.env.VBEE_APP_ID?.trim(),
    vbeeAccessToken: process.env.VBEE_ACCESS_TOKEN?.trim(),
    vbeeCallbackUrl: process.env.VBEE_CALLBACK_URL?.trim(),
    vbeeVoiceCodeVi: process.env.VBEE_VOICE_CODE_VI?.trim() ?? "n_hanoi_male_sizonguyen_education_vc",
    vbeeVoiceCodeEn: process.env.VBEE_VOICE_CODE_EN?.trim() ?? "am_echo",
    vbeeSpeed,
    vbeeEndpoint: process.env.VBEE_ENDPOINT ?? "https://api.vbee.vn/v1",
    vbeePollIntervalMs,
    vbeePollTimeoutMs,
    tiktok: {
      displayName: process.env.TIKTOK_DISPLAY_NAME ?? "Học Toán cùng thầy",
      handle: process.env.TIKTOK_HANDLE ?? "@hoctoancungthay",
      followers: process.env.TIKTOK_FOLLOWERS ?? "1.2M followers",
      avatarUrl: process.env.TIKTOK_AVATAR_URL || undefined,
    },
    ttsConcurrency: intDefault("TTS_CONCURRENCY", 1),
  };
}
