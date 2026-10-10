import { cp, mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { renderWithHyperframes, type RenderArgs } from "./hyperframes-runner.js";

export async function writeLandscapeProject(session: string, html: string): Promise<string> {
  const dir = join(session, "landscape");
  await mkdir(dir, { recursive: true });
  for (const name of ["math-assets", "math-styles.css", "styles.css", "animations.js", "images", "voice.mp3", "tiktok-avatar.jpg", "tiktok-avatar.jpeg", "tiktok-avatar.png", "tiktok-avatar.webp", "hyperframes.json", "meta.json"])
    if (existsSync(join(session,name))) await cp(join(session,name),join(dir,name),{recursive:true});
  await writeFile(join(dir, "index.html"),html);
  await writeFile(join(session,"formats.json"),JSON.stringify({portrait:{width:1080,height:1920,composition:"index.html",video:"video-portrait.mp4"},landscape:{width:1920,height:1080,composition:"landscape/index.html",video:"video-landscape.mp4"},legacyVideo:"video.mp4"},null,2));
  return dir;
}

/** One narration/audit, two local exports. Preserve video.mp4 for existing callers. */
export async function renderBothFormats(args: RenderArgs): Promise<void> {
  const session = args.compositionDir;
  // Fail before rendering either format if the pair was not prepared.
  await readFile(join(session,"landscape/index.html"));
  await renderWithHyperframes(args);
  await copyFile(args.outputPath,join(session,"video-portrait.mp4"));
  await renderWithHyperframes({...args,compositionDir:join(session,"landscape"),outputPath:join(session,"video-landscape.mp4")});
}
