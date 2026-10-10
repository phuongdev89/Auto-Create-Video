import {describe,it,expect} from 'vitest';
import {TeachingAid,renderTeachingAid} from './teaching-aid.js';
describe('per-lesson teaching aid',()=>{
 it('preserves cut timing and identical movement for connected pieces',()=>{
  const move={at:.5,duration:.1,x:30,y:-20};
  const aid=TeachingAid.parse({description:'Cắt mảnh liền',nodes:[
   {kind:'path',path:'M10 10H50V50',drawAt:.3,drawDuration:.1},
   {kind:'path',path:'M10 10H50V50Z',move},
   {kind:'label',text:'Sticker',x:30,y:30,move},
  ]});
  const html=renderTeachingAid(aid);
  expect(html).toContain('data-aid-draw="0.3,0.1"');
  expect(html.match(/data-aid-move="0.5,0.1,30,-20"/g)).toHaveLength(2);
 });
 it('rejects cuts on labels and operations that overrun the scene',()=>{
  expect(()=>TeachingAid.parse({description:'Bad',nodes:[{kind:'label',text:'A',drawAt:.2}]})).toThrow();
  expect(()=>TeachingAid.parse({description:'Bad',nodes:[{kind:'path',path:'M0 0L10 10',move:{at:.9,duration:.2,x:1,y:1}}]})).toThrow();
 });
 it('keeps custom geometry, labels and removal timing',()=>{
 const aid=TeachingAid.parse({description:'Hai giỏ riêng của bài',nodes:[{kind:'path',path:'M10 10L60 10L50 50Z',fill:'#dbc3a0',hideAt:.5},{kind:'label',text:'x < 3',x:30,y:30}]});
 expect(renderTeachingAid(aid)).toContain('data-aid-hide="0.5"');expect(renderTeachingAid(aid)).toContain('x &lt; 3');
 });
 it('rejects executable markup and missing geometry',()=>{
 expect(()=>TeachingAid.parse({description:'Bad',nodes:[{kind:'path',path:'<script>alert(1)</script>'}]})).toThrow();
 expect(()=>TeachingAid.parse({description:'Bad',nodes:[{kind:'path'}]})).toThrow();
 });
});
