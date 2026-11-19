import {copyFileSync, existsSync, statSync} from 'node:fs';

// Production is fully self-contained. All media lives in main, not on
// a temporary AI-service download URL. Missing media must fail the build.
for(const [path,minSize] of [
  ['walk_to_the_bank.mp3',1000000],
  ['public/cover.png',1000000],
  ['public/motion-loop.mp4',500000],
  ['public/guard.png',10000],
]){
  if(!existsSync(path)||statSync(path).size<minSize)throw new Error('Required original or V3 motion asset missing: '+path);
}
copyFileSync('walk_to_the_bank.mp3','public/walk_to_the_bank.mp3');
console.log('Original audio, original photograph, real motion plate and immutable guard are bundled locally.');
