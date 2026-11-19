import test from 'node:test';
import assert from 'node:assert/strict';
import {loopPhase,phaseError,mapCrop,NOMINAL_LOOP_SECONDS,MotionSync} from '../public/src/motion.js';
import {readFileSync} from 'node:fs';
test('10-second body loop phase is deterministic throughout 158-second song',()=>{
 assert.equal(NOMINAL_LOOP_SECONDS,10);
 for(let i=0;i<15800;i++){
  const t=i/100;const x=loopPhase(t,10);
  assert.ok(x>=0&&x<10);
  assert.ok(Math.abs(x-(t%10))<.0000001);
 }
 assert.equal(loopPhase(-30),0);
 assert.equal(loopPhase(NaN),0);
});
test('seam-aware video to audio phase error is stable',()=>{
 assert.ok(phaseError(9.98,.02,10)<.05);
 assert.equal(phaseError(1.5,1.5,10),0);
 assert.ok(phaseError(2,3,10)>.9);
});
test('plate-to-photo crop is legal even with punch-ins',()=>{
 for(let x=-.2;x<.8;x+=.05){
  const rect=mapCrop({sx:x*2048,sy:64,sw:1380,sh:776},2048,1280,1920,1080);
  assert.ok(rect.sx>=0&&rect.sy>=0&&rect.sw>=2&&rect.sh>=2);
  assert.ok(rect.sx+rect.sw<=1920&&rect.sy+rect.sh<=1080);
 }
});
test('motion player performs a seek only beyond sync tolerance',()=>{
 const audio={currentTime:5.0,paused:false};
 const video={readyState:3,videoWidth:1920,duration:10,currentTime:1.0,muted:true,paused:false};
 const sync=new MotionSync(video,audio);
 sync.tick();assert.equal(video.currentTime,5);
 audio.currentTime=5.02;sync.tick();assert.equal(video.currentTime,5);
 audio.currentTime=5.5;video.currentTime=5.45;sync.tick();assert.equal(video.currentTime,5.45);
 audio.currentTime=6;video.currentTime=5.6;sync.tick();assert.equal(video.currentTime,6);
});
test('photographic masks are applied in browser before analog VFX',()=>{
 const film=readFileSync('public/src/film.js','utf8');
 assert.ok(film.includes('b.drawImage(video'));
 assert.ok(film.includes('b.drawImage(guard'));
 assert.ok(film.indexOf('b.drawImage(guard')<film.indexOf('ctx.drawImage(this.base'));
 assert.ok(!film.includes('fillText('));
 const html=readFileSync('public/index.html','utf8');
 assert.ok(html.includes('muted loop preload="auto"'));
 assert.ok(html.includes('id="save"'));
});
