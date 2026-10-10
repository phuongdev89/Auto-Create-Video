import { afterAll, describe, expect, it } from "vitest";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { MathScriptSchema } from "../render/math-schema.js";
import { composeMathHtml } from "../render/math-composer.js";
import { startConceptServer } from "./server.js";

const session = join("output", `concept-test-${randomUUID()}`);
afterAll(() => rm(session, { recursive: true, force: true }));
const load = async (name = "algebra-guided") => JSON.parse(await readFile(`examples/math/${name}.json`, "utf8"));

describe("video concepts", () => {
  it("preserves the classic layout for old scripts and rejects unknown concepts", async () => {
    const raw = await load();
    expect(MathScriptSchema.parse(raw).visualConcept).toBe("classic");
    raw.visualConcept = "unknown";
    expect(() => MathScriptSchema.parse(raw)).toThrow();
  });
  it("renders explicit groups without inventing a final answer and validates their limits", async () => {
    const raw = await load(); raw.visualConcept = "manipulatives";
    raw.scenes[3].templateData.objects = [{ label: "Nhóm đang xét", count: 4, color: "green" }];
    const script = MathScriptSchema.parse(raw);
    const html = composeMathHtml({ script, sceneAudio: script.scenes.map(s => ({ id: s.id, durationSec: 5 })), gapSec: .3, audioRelPath: "voice.mp3" });
    expect(html).toContain('data-concept="manipulatives"');
    expect(html.match(/class="math-object"/g)).toHaveLength(4);
    expect(html).not.toContain('id="math-answer"');
    raw.scenes[3].templateData.objects[0].count = 21;
    expect(() => MathScriptSchema.parse(raw)).toThrow();
    raw.scenes[3].templateData.objects = [{ label: "A", count: 20 }, { label: "B", count: 20 }];
    expect(() => MathScriptSchema.parse(raw)).toThrow(/30 objects/);
  });
  it("serves actual guided lesson frames, saves only the concept and detects stale scripts", async () => {
    await mkdir(session, { recursive: true });
    const raw = await load(); raw.customNotes = "Keep my manual metadata";
    const path = join(session, "script.json");
    await writeFile(path, JSON.stringify(raw));
    await writeFile(join(session, "solution.md"), "PRIVATE ANSWER");
    const { server, url } = await startConceptServer(path);
    try {
      const gallery = await (await fetch(url)).text();
      expect(gallery).toContain("Chọn cách thể hiện bài giảng");
      expect(gallery).toContain('id="save" type="button" disabled');
      const token = gallery.match(/'X-Concept-Token':"([^"]+)"/)![1];
      const preview = await (await fetch(url + "chalkboard-1.html")).text();
      expect(preview).toContain('data-preview-scene="math-' + raw.scenes[3].id + '"');
      expect(preview).not.toContain('<audio');
      expect(preview).not.toContain("PRIVATE ANSWER");
      expect(preview).not.toContain('id="math-answer"');
      expect((await fetch(url + "math-assets/fonts/KaTeX_Main-Regular.woff2")).status).toBe(200);
      for (const name of ["solution.md", "verification.json", "script.json", "%2e%2e%2fsolution.md", "math-assets/fonts/../../solution.md"])
        expect((await fetch(url + name)).status).toBe(404);
      const post = (concept: string, origin = url.slice(0, -1)) => fetch(url + "select", {
        method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "X-Concept-Token": token }, body: JSON.stringify({ concept }),
      });
      expect((await post("notebook", "https://elsewhere.example")).status).toBe(403);
      expect((await post("unknown")).status).toBe(400);
      expect((await post("classic")).status).toBe(400);
      expect((await post("notebook")).status).toBe(200);
      expect(JSON.parse(await readFile(path, "utf8"))).toEqual({ ...raw, visualConcept: "notebook" });
      expect((await (await fetch(url)).text())).toContain('value="notebook" checked');
      expect((await post("chalkboard")).status).toBe(200);
      const external = { ...raw, visualConcept: "chalkboard", customNotes: "Edited while gallery was open" };
      await writeFile(path, JSON.stringify(external));
      expect((await post("manipulatives")).status).toBe(409);
      expect(JSON.parse(await readFile(path, "utf8"))).toEqual(external);
    } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  });
});
