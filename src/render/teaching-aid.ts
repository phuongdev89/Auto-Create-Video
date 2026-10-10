import { z } from 'zod';
const paint = z.string().regex(/^(#[0-9a-fA-F]{3,8}|none)$/);
const node = z.object({
  kind: z.enum(['path', 'label']),
  path: z.string().max(12000).regex(/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+\-]+$/).optional(),
  text: z.string().min(1).max(200).optional(),
  x: z.number().min(0).max(900).default(0), y: z.number().min(0).max(500).default(0),
  fill: paint.default('none'), stroke: paint.default('none'),
  strokeWidth: z.number().min(0).max(20).default(3), fontSize: z.number().min(12).max(72).default(28),
  hideAt: z.number().min(0).max(.9).optional(),
  drawAt: z.number().min(0).max(.9).optional(),
  drawDuration: z.number().positive().max(.3).default(.08),
  move: z.object({at:z.number().min(0).max(.9),duration:z.number().positive().max(.3).default(.08),x:z.number().min(-300).max(300),y:z.number().min(-200).max(200)}).optional(),
}).superRefine((n, c) => { if (n.kind === 'path' ? !n.path : !n.text) c.addIssue({code:'custom',message:'Supply path geometry or label text'}); });
/** Geometry and semantics are authored for each lesson and included in its audit fingerprint. */
export const TeachingAid = z.object({description:z.string().min(1).max(2000), nodes:z.array(node).min(1).max(300)}).superRefine((aid,c)=>{
 aid.nodes.forEach((n,i)=>{
  if(n.drawAt!==undefined && (n.kind!=='path'||n.drawAt+n.drawDuration>1)) c.addIssue({code:'custom',path:['nodes',i,'drawAt'],message:'Draw requires a path and must finish inside the scene'});
  if(n.move && n.move.at+n.move.duration>1) c.addIssue({code:'custom',path:['nodes',i,'move'],message:'Movement must finish inside the scene'});
 });
});
const esc = (s:string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function renderTeachingAid(aid:z.infer<typeof TeachingAid>):string {
  return `<svg class="teaching-aid" viewBox="0 0 900 500" role="img" aria-label="${esc(aid.description)}">${aid.nodes.map(n=>`<g${n.hideAt===undefined?'':` data-aid-hide="${n.hideAt}"`}${n.move?` data-aid-move="${n.move.at},${n.move.duration},${n.move.x},${n.move.y}"`:''}>${n.kind==='path'?`<path${n.drawAt===undefined?'':` data-aid-draw="${n.drawAt},${n.drawDuration}"`} d="${esc(n.path!)}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${n.strokeWidth}"/>`:`<text x="${n.x}" y="${n.y}" fill="${n.fill==='none'?'#173f42':n.fill}" font-size="${n.fontSize}" text-anchor="middle">${esc(n.text!)}</text>`}</g>`).join('')}</svg>`;
}
