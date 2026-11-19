import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IMMUTABLE,PUPPETS,VFX_CUES,vfxAt,LOOKS} from '../public/src/vfx.js';
import {scoreAt,cropAt} from '../public/src/score.js';

test('the four actual reference styles occur repeatedly during all 158 seconds',()=>{
  const modes=new Set(VFX_CUES.map(x=>x[1]));
  for(const style of ['night','rgb','fire','surveillance']){
    assert.ok(modes.has(style));assert.ok(VFX_CUES.filter(x=>x[1]===style).length>=5);
  }
  assert.equal(VFX_CUES[0][0],0);
  for(let i=1;i<VFX_CUES.length;i++)assert.ok(VFX_CUES[i][0]>VFX_CUES[i-1][0]);
  assert.ok(VFX_CUES.at(-1)[0]<158);
});
test('the effect envelope stays finite, seeded and within editorial limits',()=>{
 for(let k=-12;k<16000;k+=7){const t=k/100,a=vfxAt(t,.7,.6),b=vfxAt(t,.7,.6);
  assert.deepEqual(a,b);assert.ok(LOOKS.includes(a.look));
  assert.ok(a.amount>=0&&a.amount<=1);assert.ok(a.ghost<=.45);
  for(const key of ['tear','ghost','chroma','bloom','shock','shake'])assert.ok(Number.isFinite(a[key]));
 }
});
test('faces, writing and packaging have explicit source-locked spatial exclusion areas',()=>{
  assert.deepEqual(IMMUTABLE.map(x=>x.name),['LEFT_FACE','RIGHT_FACE','CHALK_TEXT','FLOW_PACKAGE']);
  for(const part of IMMUTABLE){const [x0,y0,x1,y1]=part.box;
    assert.ok(x0>=0&&y0>=0&&x1<=1&&y1<=1&&x1>x0&&y1>y0);}
  for(const part of PUPPETS){assert.ok(part.amp<=40);assert.ok(part.polygon.length>=7);
    for(const [x,y] of part.polygon)assert.ok(x>=0&&y>=0&&x<=1&&y<=1);
    for(const invariant of IMMUTABLE){const [x0,y0,x1,y1]=invariant.box;
      assert.ok(part.polygon.every(([x,y])=>!(x>x0&&x<x1&&y>y0&&y<y1)),part.name+' enters '+invariant.name);
    }
  }
});
test('only original photograph acts as frame source; reference GIFs not composited',()=>{
 const film=readFileSync('public/src/film.js','utf8');
 assert.ok(film.includes('ctx.drawImage(this.base'));assert.ok(film.includes('ctx.drawImage(this.lock'));
 assert.ok(!film.includes('.GIF'));assert.ok(!film.includes('fillText('));assert.ok(!film.includes('strokeText('));
 const python=readFileSync('scripts/vfx.py','utf8');assert.ok(python.includes('protected=image.copy()'));
 assert.ok(!python.includes('diffusion'));assert.ok(!python.includes('face_swap'));
});
test('frame geometry is still confined to bounds even under strongest beat',()=>{
 for(let i=0;i<=1580;i+=5){const shot=scoreAt(i/10,1,1);
  const box=cropAt(2048,1280,1920,1080,shot);
  assert.ok(box.sx>=0&&box.sy>=0&&box.sx+box.sw<=2048+.01&&box.sy+box.sh<=1280+.01);
 }
});
