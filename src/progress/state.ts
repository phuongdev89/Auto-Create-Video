import { mkdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export interface TaskProgress { stage: string; message: string; updatedAt: string; }
export async function readProgress(session: string): Promise<TaskProgress | undefined> {
  try { return JSON.parse(await readFile(join(session, "progress.json"), "utf8")); } catch { return undefined; }
}
/** Serialized atomic updates also work before script.json exists. */
let queue = Promise.resolve();
export function updateProgress(session: string, stage: string, message: string, create = false): Promise<void> {
  const job = queue.catch(() => {}).then(async () => {
    if (!create && !await readProgress(session)) return;
    await mkdir(session, { recursive: true });
    const path = join(session, "progress.json"), temp = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temp, JSON.stringify({ stage, message, updatedAt: new Date().toISOString() }));
      await rename(temp, path);
    } finally { await unlink(temp).catch(() => {}); }
  });
  queue = job;
  return job;
}
