import {existsSync, statSync} from 'node:fs';

// Production is fully self-contained. All media lives in main, not on
// a temporary AI-service download URL. Missing media must fail the build.
for(const [path,minSize] of [
  ['public/audiooficial/walktothebank.m4a',1000000],
  ['public/cover.png',1000000],
  ['public/motion-loop.mp4',500000],
  ['public/guard.png',10000],
]){
  if(!existsSync(path)||statSync(path).size<minSize)throw new Error('Required original or V3 motion asset missing: '+path);
}
console.log('Final official M4A, original photograph, real motion plate and immutable guard are bundled locally.');
