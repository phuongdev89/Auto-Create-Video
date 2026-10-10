import axios from "axios";
import type { AuditConfig } from "../config.js";

export type ChatContent = string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
export interface ChatMessage { role: "system" | "user"; content: ChatContent }

function contentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(part => part?.type === "text" && typeof part.text === "string" ? part.text : "").join("");
  return "";
}

/** Accept gateways that return SSE even when stream=false. Never use reasoning_content as the answer. */
export function readChatContent(body: string): string {
  const normalized = body.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (normalized.startsWith("{")) {
    const response = JSON.parse(normalized);
    const choice = response.choices?.find((item: { index?: number }) => item.index === 0) ?? response.choices?.[0];
    if (response.error || !choice || choice.finish_reason !== "stop" || choice.message?.refusal)
      throw new Error("Audit response is failed, refused or incomplete.");
    const text = contentText(choice.message?.content);
    if (!text.trim()) throw new Error("Audit response has no answer content.");
    return text;
  }
  let text = "", finished = false;
  for (const event of normalized.split(/\n\s*\n/)) {
    const data = event.split("\n").filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n");
    if (!data || data === "[DONE]") continue;
    const response = JSON.parse(data);
    if (response.error) throw new Error("Audit stream returned an error.");
    const choice = response.choices?.find((item: { index?: number }) => item.index === 0) ?? response.choices?.[0];
    if (!choice) continue; // usage and keep-alive events
    if (choice.delta?.refusal || choice.message?.refusal) throw new Error("Audit request was refused.");
    text += contentText(choice.delta?.content ?? choice.message?.content);
    if (choice.finish_reason) {
      if (choice.finish_reason !== "stop") throw new Error("Audit stream was truncated or incomplete.");
      finished = true;
    }
  }
  if (!finished || !text.trim()) throw new Error("Audit stream ended without a completed answer.");
  return text;
}

export async function requestAuditJson(cfg: AuditConfig, messages: ChatMessage[]): Promise<unknown> {
  let body: string;
  const deadline = AbortSignal.timeout(cfg.timeoutMs);
  try {
    const response = await axios.post<string>(cfg.chatUrl,
      { model: cfg.model, stream: cfg.stream, messages, response_format: { type: "json_object" } },
      { headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
        timeout: cfg.timeoutMs, signal: deadline, responseType: "text", transformResponse: [data => data], maxContentLength: 4 * 1024 * 1024, maxRedirects: 0 });
    body = response.data;
  } catch (error) {
    // Axios errors contain the Authorization header. Do not propagate or log them.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const timeout = deadline.aborted || (axios.isAxiosError(error) && ["ECONNABORTED", "ETIMEDOUT"].includes(error.code ?? ""));
    throw new Error(timeout ? "Audit API timed out." : `Audit API request failed${status ? ` (HTTP ${status})` : ""}.`);
  }
  try {
    const content = readChatContent(body).trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\s*```$/, "");
    return JSON.parse(content);
  } catch {
    throw new Error("Audit API returned malformed, refused or incomplete JSON/SSE content.");
  }
}
