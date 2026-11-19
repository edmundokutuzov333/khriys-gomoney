import {mkdirSync,writeFileSync} from 'node:fs';
import {CUES,DURATION,FPS} from '../public/src/score.js';
mkdirSync('build',{recursive:true});
writeFileSync('build/score.json',JSON.stringify({cues:CUES,duration:DURATION,fps:FPS},null,2));
