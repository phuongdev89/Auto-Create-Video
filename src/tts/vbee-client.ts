import axios from "axios";
import { mkdir, writeFile, rename, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { TtsClient } from "./tts-client.js";

export interface VbeeOpts {
  appId: string;
  accessToken: string;
  callbackUrl: string;
  voiceCode: string;
  speed: number;
  endpoint: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
}

interface VbeeResponse {
  requestId?: string;
  status?: string;
  audioLink?: string;
  error?: { code?: string; message?: string };
}

/** Official Vbee Batch API: https://api-docs.vbee.vn/vbee-api/text-to-speech/batch-api */
export class VbeeClient implements TtsClient {
  constructor(private cfg: VbeeOpts) {}

  async generate(text: string, audioOutPath: string, _srtOutPath?: string): Promise<void> {
    if (!text.trim()) throw new Error("Vbee text must not be empty");
    if (text.length > 100000) throw new Error("Vbee text exceeds 100000 characters");
    const endpoint = this.cfg.endpoint.replace(/\/+$/, "");
    const headers = {
      Authorization: `Bearer ${this.cfg.accessToken}`,
      "App-Id": this.cfg.appId,
      "Content-Type": "application/json",
    };
    // Do not retry submission: a lost response may already have consumed credits.
    const submitted = await this.request(() => axios.post<VbeeResponse>(`${endpoint}/tts`, {
      text: text.trim(), mode: "async", voiceCode: this.cfg.voiceCode,
      outputFormat: "mp3", bitrate: 128, speed: this.cfg.speed,
      webhookUrl: this.cfg.callbackUrl,
    }, { headers, timeout: 30000 }));
    let result = submitted;
    if (result.status !== "COMPLETED" && !result.requestId) {
      throw new Error("Vbee response missing requestId");
    }
    const deadline = Date.now() + this.cfg.pollTimeoutMs;
    while (result.status !== "COMPLETED") {
      if (result.status === "FAILED") throw new Error("Vbee synthesis failed");
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error(`Vbee polling timeout after ${this.cfg.pollTimeoutMs}ms`);
      result = await this.request(() => axios.get<VbeeResponse>(
        `${endpoint}/tts/requests/${encodeURIComponent(submitted.requestId!)}`,
        { headers, timeout: Math.min(30000, remaining) },
      ));
      if (result.status === "COMPLETED" || result.status === "FAILED") continue;
      await new Promise((resolve) => setTimeout(resolve, Math.min(this.cfg.pollIntervalMs, Math.max(0, deadline - Date.now()))));
    }
    if (!result.audioLink) throw new Error("Vbee completed without audioLink");
    const audioUrl = new URL(result.audioLink);
    if (!["https:", "http:"].includes(audioUrl.protocol)) throw new Error("Vbee audioLink must be HTTP(S)");
    // CDN download deliberately carries no Vbee credentials.
    let audio: Buffer;
    try {
      const response = await axios.get<ArrayBuffer>(audioUrl.href, { responseType: "arraybuffer", timeout: 60000 });
      audio = Buffer.from(response.data);
      if (!audio.length || String(response.headers["content-type"] ?? "").match(/json|text|html/i)) {
        throw new Error("Vbee download did not return audio");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(`Vbee audio download failed (HTTP ${error.response?.status ?? "network error"})`);
      throw error;
    }
    await mkdir(dirname(audioOutPath), { recursive: true });
    const tempPath = `${audioOutPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(tempPath, audio);
      await rename(tempPath, audioOutPath);
    } finally {
      await rm(tempPath, { force: true });
    }
    // Batch API does not expose SRT; pipeline timing uses the downloaded MP3.
  }

  private async request(call: () => Promise<{ data: VbeeResponse }>): Promise<VbeeResponse> {
    try {
      const { data } = await call();
      if (!data || typeof data !== "object") throw new Error("Vbee returned an invalid response");
      if (data.error) throw new Error(`Vbee API error: ${data.error.code ?? "unknown"}: ${data.error.message ?? "unknown"}`);
      return data;
    } catch (error) {
      // Never propagate Axios request objects: they contain the bearer token.
      if (axios.isAxiosError(error)) {
        const code = error.response?.data?.error?.code;
        throw new Error(`Vbee API failed (HTTP ${error.response?.status ?? "network error"}${code ? `, ${code}` : ""})`);
      }
      throw error;
    }
  }
}
