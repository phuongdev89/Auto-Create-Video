import { afterEach, expect, it } from 'vitest';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { startProgressServer } from './server.js';
import { updateProgress } from './state.js';

const dirs:string[]=[], tasks:Awaited<ReturnType<typeof startProgressServer>>[]=[];
afterEach(async()=>{for(const t of tasks.splice(0))t.close();for(const d of dirs.splice(0))await rm(d,{recursive:true,force:true})});
async function setup(){const dir=join('output',`progress-test-${randomUUID()}`);dirs.push(dir);const task=await startProgressServer(dir);tasks.push(task);const response=await fetch(task.url,{redirect:'manual'});const cookie=response.headers.get('set-cookie')!.split(';')[0];return {dir,task,origin:new URL(task.url).origin,cookie};}
it('starts before script exists and blocks anonymous, foreign origins and private artifact URLs',async()=>{
  const {dir,task,origin,cookie}=await setup();
  expect(await readFile(join(dir,'progress.url'),'utf8')).toBe(task.url);
  expect((await fetch(origin)).status).toBe(403);
  expect((await fetch(origin,{headers:{cookie}})).status).toBe(200);
  expect((await fetch(origin,{headers:{cookie,origin:'https://evil.invalid'}})).status).toBe(403);
  await writeFile(join(dir,'solution.md'),'SECRET ANSWER');
  for(const name of ['solution.md','verification.md','script.json','../solution.md'])expect((await fetch(origin+'/media/'+name,{headers:{cookie}})).status).toBe(404);
});
it('streams real file changes and task errors over SSE without refreshing',async()=>{
  const {dir,origin,cookie}=await setup();const controller=new AbortController();
  const response=await fetch(origin+'/events',{headers:{cookie},signal:controller.signal});
  const reader=response.body!.getReader(), decoder=new TextDecoder();let text='';
  try {
    text+=decoder.decode((await reader.read()).value);expect(text).toContain('Chờ chọn cách giải');
    await writeFile(join(dir,'solution.md'),'PRIVATE SOLUTION');await writeFile(join(dir,'verification.md'),'fail: missing condition');
    await updateProgress(dir,'Lỗi — đã dừng','Audit không đạt.');
    const deadline=Date.now()+4000;
    while(!text.includes('Audit không đạt.')&&Date.now()<deadline)text+=decoder.decode((await reader.read()).value);
    expect(text).toContain('PRIVATE SOLUTION');expect(text).toContain('fail: missing condition');expect(text).toContain('Lỗi — đã dừng');
  }finally{controller.abort();await reader.cancel().catch(()=>{})}
});
it('provides seekable preview, latest frame and byte ranges for MP4',async()=>{
  const {dir,origin,cookie}=await setup();await writeFile(join(dir,'index.html'),'<body>preview</body>');await writeFile(join(dir,'video.mp4'),'0123456789');await mkdir(join(dir,'frames'));await writeFile(join(dir,'frames/latest.png'),'png');
  const html=await(await fetch(origin+'/media/index.html',{headers:{cookie}})).text();expect(html).toContain('task-preview');expect(html).toContain('tl.seek(t)');
  const video=await fetch(origin+'/media/video.mp4',{headers:{cookie,range:'bytes=2-5'}});expect(video.status).toBe(206);expect(await video.text()).toBe('2345');expect(video.headers.get('content-range')).toBe('bytes 2-5/10');
  expect((await fetch(origin+'/media/video.mp4',{headers:{cookie,range:'bytes=20-30'}})).status).toBe(416);
  expect((await fetch(origin+'/media/frames/latest.png',{headers:{cookie}})).status).toBe(200);
});
