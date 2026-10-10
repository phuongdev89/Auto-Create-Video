/**
 * Common TTS client interface.
 *
 * All providers (LucyLab, ElevenLabs, Vbee) implement this so the pipeline
 * can swap providers without changing orchestration logic.
 */
export interface TtsClient {
  /**
   * Generate speech audio for `text` and write to `audioOutPath` (mp3 or wav).
   * If `srtOutPath` is provided AND the provider supports subtitles,
   * write the SRT to that path. Otherwise silently skip.
   */
  generate(text: string, audioOutPath: string, srtOutPath?: string): Promise<void>;
}

import type { Config } from "../config.js";
import { LucylabClient } from "./lucylab-client.js";
import { ElevenLabsClient } from "./elevenlabs-client.js";
import { VbeeClient } from "./vbee-client.js";

export function createEnglishTtsClient(cfg: Config): TtsClient {
  for (const [name, value] of Object.entries({ VBEE_APP_ID: cfg.vbeeAppId, VBEE_ACCESS_TOKEN: cfg.vbeeAccessToken, VBEE_CALLBACK_URL: cfg.vbeeCallbackUrl })) {
    if (!value?.trim()) throw new Error(`Missing ${name}: English segments require Vbee, even when Vietnamese uses another provider`);
  }
  if (!["http:", "https:"].includes(new URL(cfg.vbeeCallbackUrl!).protocol)) throw new Error("VBEE_CALLBACK_URL must be HTTP(S)");
  if (!cfg.vbeeVoiceCodeEn.trim() || /female/i.test(cfg.vbeeVoiceCodeEn)) throw new Error("VBEE_VOICE_CODE_EN must select a male English voice");
  for (const value of [cfg.vbeePollIntervalMs, cfg.vbeePollTimeoutMs]) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error("Vbee English polling intervals must be positive integers");
  }
  return new VbeeClient({ appId: cfg.vbeeAppId!, accessToken: cfg.vbeeAccessToken!, callbackUrl: cfg.vbeeCallbackUrl!,
    voiceCode: cfg.vbeeVoiceCodeEn, speed: 0.9, endpoint: cfg.vbeeEndpoint,
    pollIntervalMs: cfg.vbeePollIntervalMs, pollTimeoutMs: cfg.vbeePollTimeoutMs });
}

export function createTtsClient(cfg: Config): TtsClient {
  switch (cfg.ttsProvider) {
    case "lucylab":
      return new LucylabClient({
        apiKey: cfg.lucylabApiKey!,
        voiceId: cfg.lucylabVoiceId!,
        endpoint: cfg.lucylabEndpoint,
        pollIntervalMs: cfg.lucylabPollIntervalMs,
        pollTimeoutMs: cfg.lucylabPollTimeoutMs,
      });
    case "elevenlabs":
      return new ElevenLabsClient({
        apiKey: cfg.elevenlabsApiKey!,
        voiceId: cfg.elevenlabsVoiceId!,
        modelId: cfg.elevenlabsModelId,
        endpoint: cfg.elevenlabsEndpoint,
      });
    case "vbee":
      return new VbeeClient({
        appId: cfg.vbeeAppId!,
        accessToken: cfg.vbeeAccessToken!,
        callbackUrl: cfg.vbeeCallbackUrl!,
        voiceCode: cfg.vbeeVoiceCodeVi,
        speed: cfg.vbeeSpeed,
        endpoint: cfg.vbeeEndpoint,
        pollIntervalMs: cfg.vbeePollIntervalMs,
        pollTimeoutMs: cfg.vbeePollTimeoutMs,
      });
    default: {
      const _never: never = cfg.ttsProvider;
      throw new Error(`Unknown TTS provider: ${_never}`);
    }
  }
}
