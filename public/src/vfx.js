/** WALK TO THE BANK - deterministic 02:38 optical score.
 * Reference studies: 1. jewel/night-camera; 2. RGB CRT/data-bend;
 * 3. solarized fire/halation; 4. sepia surveillance/dirty film.
 * Their frames are NOT included in our footage: no borrowed faces, texts or objects.
 */
export const LOOKS=Object.freeze(['clean','night','rgb','fire','surveillance']);

// In ORIGINAL photograph fractional coordinates, not screen coordinates. No AI guesses.
// These may be graded, but NEVER spatially torn/displaced or redrawn.
// In V3 the registered original-image alpha plate also freezes these exact pixels.
export const IMMUTABLE=Object.freeze([
  {name:'LEFT_FACE', box:[.174,.298,.285,.496]},
  {name:'RIGHT_FACE',box:[.626,.268,.736,.474]},
  {name:'CHALK_TEXT',box:[.145,.115,.685,.287]},
  {name:'FLOW_PACKAGE',box:[.804,.452,.906,.712]},
  {name:'LEFT_EMBLEM',box:[.301,.515,.330,.561]},
  {name:'RIGHT_EMBLEM',box:[.702,.504,.736,.566]},
]);
// Restricted to already photographed limbs and accessories. No new bodies/identities.
// Fractional original-coordinate polygons, subtle local optical displacement only.
export const PUPPETS=Object.freeze([
 {name:'GESTURE_LEFT',pivot:[.340,.546],amp:32,phase:0,
  polygon:[[.333,.52],[.404,.516],[.46,.468],[.482,.410],[.494,.414],[.492,.468],[.466,.512],[.421,.555],[.35,.596]]},
 {name:'WRIST_RIGHT',pivot:[.665,.585],amp:18,phase:1.4,
  polygon:[[.598,.548],[.622,.524],[.672,.550],[.699,.583],[.697,.620],[.674,.642],[.638,.637],[.602,.607]]},
 {name:'SNEAKER',pivot:[.619,.813],amp:35,phase:2.4,
  polygon:[[.556,.731],[.595,.685],[.652,.667],[.669,.730],[.657,.857],[.626,.889],[.569,.855]]},
]);

/** Optical vocabulary of the four supplied references. 35 short VFX sections.
 * The original photo stays recognizable between and under the events. */
export const VFX_CUES=Object.freeze([
 [0, 'clean',0],[5,'surveillance',.60],[9,'night',.84],[13,'rgb',.92],
 [17,'night',.80],[21,'fire',.90],[25,'clean',0],[29,'rgb',.94],[33,'surveillance',.76],
 [37,'fire',.80],[41,'rgb',.90],[45,'night',.92],[49,'fire',.90],[53,'rgb',1],
 [57,'surveillance',.82],[61,'night',.90],[65,'rgb',.95],[69,'fire',1],
 [73,'clean',0],[77,'surveillance',.7],[81,'rgb',1],[85,'night',1],
 [89,'fire',.94],[93,'rgb',1],[97,'surveillance',.84],[101,'night',.92],
 [105,'rgb',.96],[109,'fire',1],[113,'night',.85],[117,'surveillance',.9],
 [121,'rgb',1],[125,'fire',.95],[129,'night',.96],[133,'rgb',1],
 [137,'surveillance',.97],[141,'fire',.96],[145,'rgb',.86],[149,'night',.80],
 [153,'clean',0]
]);
export function clip(x,lo=0,hi=1){return Math.max(lo,Math.min(hi,Number.isFinite(x)?x:lo));}
export function stableNoise(seed){let n=(seed>>>0)^0x9e3779b9;n=Math.imul(n^(n>>>16),0x21f0aaad);n=Math.imul(n^(n>>>15),0x735a2d97);return ((n^(n>>>15))>>>0)/4294967296;}
export function vfxAt(time,beat=0,bass=0){
 const t=clip(time,0,158),f=Math.floor(t*24+.0001);
 let idx=0;for(let i=1;i<VFX_CUES.length&&VFX_CUES[i][0]<=t;i++)idx=i;
 const [start,look,amount]=VFX_CUES[idx];
 const next=VFX_CUES[Math.min(idx+1,VFX_CUES.length-1)][0];
 const edge=clip((t-start)/.15)*clip((next-t)/.22);
 const shock=clip(beat*.8+bass*.35);
 const glitch=look==='rgb'&&((f%11)<3||(shock>.66));
 const jitter=stableNoise(f*137+idx*31)-.5;
 const strobe=(f%23===0||shock>.79) && t>9 && t<154;
 return {look,amount:amount*edge,shock,glitch,strobe,f,
   shake:(.5+jitter)*(.7+shock*2)*amount,
   tear:look==='rgb'&&glitch?8+26*shock:look==='surveillance'?3:0,
   ghost:(look==='night'||look==='rgb')?(.12+.32*shock)*amount:0,
   chroma:look==='rgb'?(.50+.35*shock)*amount:0,
   bloom:look==='fire'?(.42+.35*shock)*amount:0,
   scan:look==='night'||look==='rgb'||look==='surveillance',
   gate:Math.sin(t*3.13)*.03*amount,
 };
}
