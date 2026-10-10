import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {composeMathHtml} from './math-composer.js';
import {MathScriptSchema} from './math-schema.js';
const base=MathScriptSchema.parse(JSON.parse(readFileSync('examples/math/algebra-guided.json','utf8')));
function html(equations:string[]){const script=structuredClone(base);script.visualConcept='detective';const scene=script.scenes.find(s=>s.phase==='solution')!;scene.templateData={template:'math-step',title:'Giữ hai vế cân bằng',equations};return composeMathHtml({script,sceneAudio:script.scenes.map(s=>({id:s.id,durationSec:6})),gapSec:0,audioRelPath:'voice.mp3'});}
describe('approved detective visual invariants',()=>{
 it('uses a static decorative magnifier and copies the supplied operation to a separate inset',()=>{const out=html(['2x + 6 - 6 = 18 - 6']);expect(out).toContain('class="detective-magnifier"');expect(out).toContain('class="operation-zoom"');expect(out).not.toContain("timeline.to('.detective-magnifier'");});
 it('does not invent a callout for unequal operations or complex expressions',()=>{for(const eq of ['2x + 6 - 6 = 18 - 5','\\frac{x}{2}=3'])expect(html([eq])).not.toContain('class="operation-zoom"');});
});
