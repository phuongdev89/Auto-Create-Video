import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadAuditConfig } from "../config.js";
beforeEach(() => {
  vi.stubEnv("AUDIT_AI_CHAT_URL", "https://audit.example/v1"); vi.stubEnv("AUDIT_AI_KEY", "private-test-key");
  vi.stubEnv("AUDIT_AI_MODEL", "another-vendor-model"); vi.stubEnv("AUDIT_AI_STREAM", "true"); vi.stubEnv("AUDIT_AI_TIMEOUT", "300");
});
afterEach(() => vi.unstubAllEnvs());
describe("audit config", () => {
  it("uses independent audit settings and normalizes the chat URL", () => {
    expect(loadAuditConfig()).toMatchObject({ chatUrl: "https://audit.example/v1/chat/completions", timeoutMs: 300000, stream: true });
    vi.stubEnv("AUDIT_AI_CHAT_URL", "https://audit.example/v1/chat/completions/");
    expect(loadAuditConfig().chatUrl).toBe("https://audit.example/v1/chat/completions");
  });
  it.each(["AUDIT_AI_CHAT_URL", "AUDIT_AI_KEY", "AUDIT_AI_MODEL"])("requires %s", name => {
    vi.stubEnv(name, ""); expect(() => loadAuditConfig()).toThrow(name);
  });
  it("rejects sample credentials and credential-bearing URLs", () => {
    vi.stubEnv("AUDIT_AI_KEY", "sk-xxxxxxxxxxx"); expect(() => loadAuditConfig()).toThrow(/AUDIT_AI_KEY/);
    vi.stubEnv("AUDIT_AI_KEY", "private-test-key"); vi.stubEnv("AUDIT_AI_CHAT_URL", "https://user:password@audit.example/v1");
    expect(() => loadAuditConfig()).toThrow(/embedded credentials/);
  });
  it.each(["", "NaN", "0", "-1", "3601"])("rejects timeout %s", value => {
    vi.stubEnv("AUDIT_AI_TIMEOUT", value); expect(() => loadAuditConfig()).toThrow(/TIMEOUT/);
  });
  it("rejects ambiguous stream values", () => {
    vi.stubEnv("AUDIT_AI_STREAM", "yes"); expect(() => loadAuditConfig()).toThrow(/STREAM/);
  });
});
