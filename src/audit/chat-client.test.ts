import { afterEach, describe, expect, it } from "vitest";
import nock from "nock";
import { readChatContent, requestAuditJson } from "./chat-client.js";
import { completion } from "./test-fixtures.js";

const cfg = { chatUrl: "https://audit.example/v1/chat/completions", apiKey: "private-test-secret", model: "test-model", stream: true, timeoutMs: 1000 };
afterEach(() => nock.cleanAll());
describe("audit transport", () => {
  it("reads non-stream JSON and content arrays without reasoning text", () => {
    expect(readChatContent(JSON.stringify(completion({ status: "pass" })))).toBe('{"status":"pass"}');
    expect(readChatContent(JSON.stringify({ choices: [{ message: { content: [{ type: "text", text: "{}" }], reasoning_content: "do not leak" }, finish_reason: "stop" }] }))).toBe("{}");
  });
  it("joins SSE chunks and tolerates CRLF, comments, usage and multiline data", () => {
    const body = ': keep-alive\r\n\r\ndata: {"choices":[{"index":0,"delta":{"reasoning_content":"private"}}]}\r\n\r\n'
      + 'data: {"choices":[{"index":0,"delta":{"content":"{\\\"ok\\\":"}}]}\r\n\r\n'
      + 'event: message\r\ndata: {"choices":\r\ndata: [{"index":0,"delta":{"content":"true}"},"finish_reason":"stop"}]}\r\n\r\n'
      + 'data: {"choices":[],"usage":{"total_tokens":20}}\r\n\r\ndata: [DONE]\r\n\r\n';
    expect(readChatContent(body)).toBe('{"ok":true}');
  });
  it.each([JSON.stringify({ choices: [{ message: { content: "{}" }, finish_reason: "length" }] }),
    'data: {"choices":[{"delta":{"content":"{}"}}]}\n\ndata: [DONE]\n\n',
    'data: {"error":{"message":"failed"}}\n\n',
    JSON.stringify({ choices: [{ message: { refusal: "No", content: "{}" }, finish_reason: "stop" }] })])("rejects incomplete or refused output", body => {
    expect(() => readChatContent(body)).toThrow();
  });
  it("handles an unexpected SSE response to stream=false", async () => {
    nock("https://audit.example").post("/v1/chat/completions", body => body.stream === false).reply(200,
      'data: {"choices":[{"delta":{"content":"{\\\"ok\\\":true}"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n', { "Content-Type": "text/event-stream" });
    await expect(requestAuditJson({ ...cfg, stream: false }, [{ role: "user", content: "Test" }])).resolves.toEqual({ ok: true });
  });
  it("does not expose credentials or upstream error bodies", async () => {
    nock("https://audit.example").post("/v1/chat/completions").reply(401, { error: "private-test-secret" });
    await expect(requestAuditJson(cfg, [{ role: "user", content: "Test" }])).rejects.toThrow("Audit API request failed (HTTP 401).");
  });
  it("rejects malformed model JSON and reports timeouts", async () => {
    nock("https://audit.example").post("/v1/chat/completions").reply(200, { choices: [{ message: { content: "{" }, finish_reason: "stop" }] });
    await expect(requestAuditJson(cfg, [{ role: "user", content: "Test" }])).rejects.toThrow(/malformed/);
    nock("https://audit.example").post("/v1/chat/completions").delayConnection(200).reply(200, completion({ ok: true }));
    await expect(requestAuditJson({ ...cfg, timeoutMs: 20 }, [{ role: "user", content: "Test" }])).rejects.toThrow("timed out");
  });
});
