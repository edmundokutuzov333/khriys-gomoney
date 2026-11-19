import {copyFileSync,existsSync,statSync,writeFileSync} from 'node:fs';
const source='walk_to_the_bank.mp3',destination='public/walk_to_the_bank.mp3';
if(!existsSync(source))throw new Error('Original source music missing');
if(statSync(source).size<1000)throw new Error('Original audio invalid');
copyFileSync(source,destination);
if(!existsSync('public/cover.png'))throw new Error('Original photograph unavailable');

// Private one-time import during the build. Signed media URL is stored ONLY as a
// Vercel encrypted production variable, never in public Git source or browser JS.
// Once the stable motion-loop.mp4 is committed to main this branch is never used.
if(!existsSync('public/motion-loop.mp4')&&process.env.MOTION_SOURCE_URL){
  const response=await fetch(process.env.MOTION_SOURCE_URL,{redirect:'follow',signal:AbortSignal.timeout(180000)});
  if(!response.ok)throw new Error('Motion import failed: HTTP '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<500000||bytes.length>40000000)throw new Error('Motion plate invalid size');
  writeFileSync('public/motion-loop.mp4',bytes);
  console.log('One-time verified motion asset imported:',bytes.length,'bytes');
}
console.log('Original music, photo and available motion assets verified.');