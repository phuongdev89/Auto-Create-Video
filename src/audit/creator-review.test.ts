import { afterAll, expect, it } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { creatorAuditReview } from "./creator-review.js";

const dir = join("output", `creator-review-test-${randomUUID()}`);
afterAll(() => rm(dir, { recursive: true, force: true }));

it("shows the real solution and unsuccessful audit to the creator without claiming pass", async () => {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "solution.md"), "PRIVATE SOLUTION: x = 6");
  await writeFile(join(dir, "verification.md"), "Trạng thái: fail\nreasoning: missing condition");
  const text = await creatorAuditReview(dir);
  expect(text).toContain("PRIVATE SOLUTION: x = 6");
  expect(text).toContain("Trạng thái: fail");
  expect(text).toContain("missing condition");
  expect(text).toContain("Không đưa phần này vào video");
  expect(text).not.toContain("passed");
});

it("reports missing evidence explicitly", async () => {
  const text = await creatorAuditReview(join(dir, "missing"));
  expect(text).toContain("Chưa có solution.md");
  expect(text).toContain("Chưa có verification.md");
  expect(text).not.toContain("Trạng thái: pass");
});
