import {copyFileSync,existsSync,statSync} from 'node:fs';
const source='walk_to_the_bank.mp3',destination='public/walk_to_the_bank.mp3';
if(!existsSync(source)) throw new Error('Source music missing: '+source);
if(statSync(source).size<1000)throw new Error('Audio invalid');
copyFileSync(source,destination);
if(!existsSync('public/cover.png')){
  throw new Error('Original photo unavailable. Run the assets workflow first.');
}
console.log('Production assets verified.');
