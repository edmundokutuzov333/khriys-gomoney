import {mkdirSync,writeFileSync} from 'node:fs';
import {CUES,DURATION,FPS} from '../public/src/score.js';
import {IMMUTABLE,PUPPETS,VFX_CUES} from '../public/src/vfx.js';
mkdirSync('build',{recursive:true});
writeFileSync('build/score.json',JSON.stringify({cues:CUES,duration:DURATION,fps:FPS,protected:IMMUTABLE,puppets:PUPPETS,vfx:VFX_CUES},null,2));
