import { createServer, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, realpath, stat, mkdir } from "node:fs/promises";
import { resolve, relative, isAbsolute, join, extname } from "node:path";
import { readProgress, updateProgress } from "./state.js";
import { progressPage, previewDriver } from "./page.js";

const allowed = /^(?:landscape\/)?(?:index\.html|video(?:-portrait|-landscape)?\.mp4|voice\.mp3|(?:math-)?styles\.css|animations\.js|tiktok-avatar\.(?:png|jpg|jpeg|webp)|(?:frames\/[\w.-]+\.(?:png|jpg|jpeg)|images\/[\w.-]+\.(?:png|jpg|jpeg|webp))|math-assets\/(?:gsap\.min\.js|katex\.min\.css|fonts\/[\w.-]+\.(?:woff2?|ttf)))$/;
const mime: Record<string,string> = { '.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.mp4':'video/mp4','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf' };
export async function startProgressServer(directory: string) {
  const session = resolve(directory), rel = relative(resolve('output'), session);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('Progress requires output/<session>/.');
  await mkdir(session, { recursive: true });
  const root = await realpath(session), outputRoot = await realpath(resolve('output'));
  const realRel = relative(outputRoot, root);
  if (!realRel || realRel.startsWith('..') || isAbsolute(realRel)) throw new Error('Session must remain inside output.');
  if (!await readProgress(session)) await updateProgress(session,'Chờ chọn cách giải','Nhận đề và chờ lựa chọn của người tạo.',true);
  const token = randomUUID(), clients = new Set<ServerResponse>();let origin='',last='',polling=false;
  const safePath = async(name: string) => {const p=await realpath(join(root,name)),r=relative(root,p);if(r.startsWith('..')||isAbsolute(r))throw new Error('Outside session');return p;};
  const content = async(name:string) => {try{return await readFile(await safePath(name),'utf8')}catch{return ''}};
  const stamp = async(name:string) => {try{const s=await stat(await safePath(name));return s.isFile()?`${s.mtimeMs}:${s.size}`:''}catch{return ''}};
  const snapshot = async() => {
    const [progress,solution,audit,preview,video,frame]=await Promise.all([readProgress(session),content('solution.md'),content('verification.md'),stamp('index.html'),stamp('video.mp4'),stamp('frames/latest.png')]);
    const [widePreview,wideVideo]=await Promise.all([stamp('landscape/index.html'),stamp('video-landscape.mp4')]);
    return {progress,solution,audit,preview:!!preview,video:!!video,widePreview:!!widePreview,wideVideo:!!wideVideo,widePreviewRevision:widePreview,wideVideoRevision:wideVideo,frame:frame?'frames/latest.png':null,previewRevision:preview,videoRevision:video,frameRevision:frame};
  };
  const server=createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','SAMEORIGIN');
    const send=(status:number,body:string)=>{res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8'});res.end(body)};
    try {
      if(req.headers.host!==new URL(origin).host)return send(403,'Host không hợp lệ');
      if(req.method!=='GET'&&req.method!=='HEAD')return send(405,'Chỉ đọc');
      const url=new URL(req.url??'/',origin);
      const authorized=req.headers.cookie?.split(';').some(v=>v.trim()===`task-progress=${token}`);
      if(url.pathname==='/'&&url.searchParams.get('key')===token){res.writeHead(303,{'Set-Cookie':`task-progress=${token}; HttpOnly; SameSite=Strict; Path=/`,'Location':'/'});return res.end()}
      if(!authorized)return send(403,'Hãy mở liên kết riêng cho người tạo.');
      if(req.headers.origin&&req.headers.origin!==origin)return send(403,'Origin không hợp lệ');
      if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(req.method==='HEAD'?undefined:progressPage)}
      if(url.pathname==='/events'&&req.method==='GET'){
        res.writeHead(200,{'Content-Type':'text/event-stream','Connection':'keep-alive'});res.write(`data: ${JSON.stringify(await snapshot())}\n\n`);clients.add(res);req.on('close',()=>clients.delete(res));return;
      }
      if(!url.pathname.startsWith('/media/'))return send(404,'Không tìm thấy');
      const name=decodeURIComponent(url.pathname.slice(7));if(!allowed.test(name))return send(404,'Không tìm thấy');
      const file=await safePath(name);let bytes=await readFile(file);
      if(name==='index.html'||name==='landscape/index.html')bytes=Buffer.from(bytes.toString().replace('</body>',previewDriver+'</body>'));
      const range=req.headers.range;
      if(range&&name.endsWith('.mp4')){
        const match=/^bytes=(\d+)-(\d*)$/.exec(range);if(!match)return send(416,'Range không hợp lệ');
        const start=Number(match[1]),end=Math.min(Number(match[2]||bytes.length-1),bytes.length-1);
        if(start>end||start>=bytes.length){res.setHeader('Content-Range',`bytes */${bytes.length}`);return send(416,'Range không hợp lệ')}
        res.writeHead(206,{'Content-Type':'video/mp4','Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1,'Accept-Ranges':'bytes'});return res.end(req.method==='HEAD'?undefined:bytes.subarray(start,end+1));
      }
      res.writeHead(200,{'Content-Type':mime[extname(name)]??'application/octet-stream','Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes);
    }catch{return send(404,'Không tìm thấy')}
  });
  await new Promise<void>((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
  const address=server.address();if(!address||typeof address==='string')throw new Error('No progress address');origin=`http://127.0.0.1:${address.port}`;
  const timer=setInterval(async()=>{if(polling)return;polling=true;try{const next=JSON.stringify(await snapshot());if(next!==last){last=next;for(const c of clients)c.write(`data: ${next}\n\n`)}else for(const c of clients)c.write(': heartbeat\n\n')}finally{polling=false}},500);
  server.on('close',()=>clearInterval(timer));
  const url=`${origin}/?key=${token}`;await writeFile(join(session,'progress.url'),url);
  return {server,url,close:()=>{clearInterval(timer);for(const c of clients)c.end();server.close();}};
}
