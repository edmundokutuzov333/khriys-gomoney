import test from 'node:test';
import assert from 'node:assert/strict';
import {CUES,DURATION,FPS,cueIndex,scoreAt,cropAt,beatAt} from '../public/src/score.js';
test('fixed 02:38 at cinematic 24 fps',()=>{assert.equal(DURATION,158);assert.equal(DURATION*FPS,3792);});
test('complete, ordered, zero-based shot timeline',()=>{assert.equal(CUES[0].at,0);assert.ok(CUES.length>=18);for(let i=1;i<CUES.length;i++)assert.ok(CUES[i].at>CUES[i-1].at);assert.ok(CUES.at(-1).at<DURATION);});
test('all transitions are deterministic and finite',()=>{for(let i=0;i<=15800;i+=17){const t=i/100;const a=scoreAt(t,.6,.2),b=scoreAt(t,.6,.2);assert.deepEqual(a,b);for(const k of ['x','y','zoom','pulse','blackout','intensity'])assert.ok(Number.isFinite(a[k]));assert.ok(a.zoom>=1&&a.zoom<=1.75);assert.ok(a.x>=0&&a.x<=1);assert.ok(a.y>=0&&a.y<=1);}});
test('photo source crop never exceeds immutable image edges',()=>{for(let i=0;i<1580;i++){const s=cropAt(2048,1280,1920,1080,scoreAt(i/10,.7,.5));assert.ok(s.sx>=0&&s.sy>=0);assert.ok(s.sx+s.sw<=2048+.001);assert.ok(s.sy+s.sh<=1280+.001);assert.ok(Math.abs(s.sw/s.sh-16/9)<1e-8);}});
test('negative, NaN and out-of-range seeking are clamped',()=>{assert.equal(cueIndex(-9),0);assert.equal(cueIndex(999),CUES.length-1);assert.equal(cueIndex(NaN),0);});
test('percussive envelopes are bounded and time aligned',()=>{const map={beats:[.5,1,1.5]};assert.ok(beatAt(map,.5)>.99);assert.ok(beatAt(map,.6)>0);assert.equal(beatAt(map,.9),0);assert.equal(beatAt(map,0),0);assert.equal(beatAt(null,.5),0);});
