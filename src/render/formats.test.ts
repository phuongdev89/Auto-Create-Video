import { afterEach, expect, it, vi } from 'vitest';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
const renderer = vi.hoisted(()=>vi.fn());
vi.mock('./hyperframes-runner.js',()=>({renderWithHyperframes:renderer}));
import { renderBothFormats, writeLandscapeProject } from './formats.js';
const dir=join('output',`formats-test-${randomUUID()}`);
afterEach(async()=>{await rm(dir,{recursive:true,force:true});renderer.mockReset()});
it('exports both orientations from the same audio and preserves video.mp4',async()=>{
  await mkdir(dir,{recursive:true});await writeFile(join(dir,'voice.mp3'),'shared narration');
  await writeLandscapeProject(dir,'<html>landscape</html>');
  expect(await readFile(join(dir,'landscape/voice.mp3'),'utf8')).toBe('shared narration');
  renderer.mockImplementation(async(args)=>writeFile(args.outputPath,args.compositionDir));
  await renderBothFormats({compositionDir:dir,outputPath:join(dir,'video.mp4'),check:true});
  expect(renderer).toHaveBeenCalledTimes(2);
  expect(await readFile(join(dir,'video-portrait.mp4'),'utf8')).toBe(await readFile(join(dir,'video.mp4'),'utf8'));
  expect(await readFile(join(dir,'video-landscape.mp4'),'utf8')).toBe(join(dir,'landscape'));
});
it('does not report the pair complete if horizontal rendering fails',async()=>{
  await writeLandscapeProject(dir,'<html>landscape</html>');
  renderer.mockImplementationOnce(async(args)=>writeFile(args.outputPath,'portrait')).mockRejectedValueOnce(new Error('horizontal failed'));
  await expect(renderBothFormats({compositionDir:dir,outputPath:join(dir,'video.mp4')})).rejects.toThrow('horizontal failed');
});
