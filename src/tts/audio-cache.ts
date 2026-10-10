import { createHash } from "node:crypto";
import type { Config } from "../config.js";
import type { MathScript } from "../render/math-schema.js";

// Hash only public voice settings and text. Never persist credentials.
export function mathAudioFingerprint(scene: MathScript["scenes"][number], cfg: Config): string {
  const english = scene.phase === "read-english";
  const voice = cfg.ttsProvider === "vbee" ? cfg.vbeeVoiceCodeVi : cfg.ttsProvider === "lucylab" ? cfg.lucylabVoiceId : cfg.elevenlabsVoiceId;
  return createHash("sha256").update(JSON.stringify(english ? {
    engine: "vbee-english-v1", text: scene.englishText, voice: cfg.vbeeVoiceCodeEn, speed: 0.9,
  } : { provider: cfg.ttsProvider, text: scene.voiceText, voice,
    speed: cfg.ttsProvider === "vbee" ? cfg.vbeeSpeed : 1,
    model: cfg.ttsProvider === "elevenlabs" ? cfg.elevenlabsModelId : undefined })).digest("hex");
}
