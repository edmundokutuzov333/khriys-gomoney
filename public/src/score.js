/** A frame-accurate, deterministic edit decision list. No human features are synthesized. */
export const DURATION = 158;
export const FPS = 24;
export const CUES = Object.freeze([
  { at: 0,    name: 'ROOM / cold open',    x: .50, y: .51, z: 1.00, cut: 'fade' },
  { at: 9,    name: 'TWO SHOT',            x: .49, y: .51, z: 1.075 },
  { at: 17,   name: 'LEFT / telephone',   x: .28, y: .51, z: 1.37 },
  { at: 25,   name: 'ROOM / negative',    x: .51, y: .50, z: 1.035 },
  { at: 33,   name: 'RIGHT / watch',      x: .66, y: .52, z: 1.43 },
  { at: 41,   name: 'ROOM / pull back',   x: .50, y: .51, z: 1.02 },
  { at: 48,   name: 'PACK / isolated',    x: .84, y: .54, z: 1.63 },
  { at: 55,   name: 'BOARD / evidence',   x: .46, y: .24, z: 1.22 },
  { at: 63,   name: 'LEFT / gesture',     x: .35, y: .50, z: 1.31 },
  { at: 71,   name: 'WIDE / silence',     x: .51, y: .51, z: 1.0 },
  { at: 79,   name: 'RIGHT / watch',      x: .66, y: .53, z: 1.46 },
  { at: 87,   name: 'TWO SHOT / centre',  x: .50, y: .51, z: 1.10 },
  { at: 94,   name: 'PACK / second look', x: .84, y: .54, z: 1.60 },
  { at: 103,  name: 'ROOM / long hold',   x: .50, y: .52, z: 1.04 },
  { at: 111,  name: 'LEFT / look',        x: .30, y: .50, z: 1.35 },
  { at: 119,  name: 'RIGHT / look',       x: .64, y: .49, z: 1.40 },
  { at: 127,  name: 'ROOM / pressure',    x: .50, y: .51, z: 1.075 },
  { at: 134,  name: 'BOARD / statement', x: .46, y: .26, z: 1.20 },
  { at: 140,  name: 'PACK / final',       x: .84, y: .54, z: 1.56 },
  { at: 146,  name: 'ROOM / return',      x: .50, y: .51, z: 1.0 },
  { at: 154,  name: 'ROOM / decay',       x: .50, y: .51, z: 1.0 },
]);
export function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
export function smoothstep(t) { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); }
export function lerp(a,b,t) { return a + (b-a)*t; }
export function cueIndex(time) {
  const t = clamp(Number.isFinite(time) ? time : 0, 0, DURATION);
  let lo=0, hi=CUES.length-1;
  while(lo<hi){const m=Math.ceil((lo+hi)/2); if(CUES[m].at<=t)lo=m; else hi=m-1;}
  return lo;
}
export function energySection(time) {
  if(time < 17) return .35;
  if(time < 41) return .64;
  if(time < 71) return .85;
  if(time < 94) return .70;
  if(time < 127) return .84;
  if(time < 146) return 1;
  return .42;
}
/** Inertial hand-held camera. No mesh operations on protected photographic identity. */
export function scoreAt(time, bass=0, beat=0) {
  const t=clamp(time,0,DURATION), i=cueIndex(t), curr=CUES[i], next=CUES[Math.min(i+1,CUES.length-1)];
  const span=Math.max(1,next.at-curr.at), progress=clamp((t-curr.at)/span,0,1);
  const drift=smoothstep(progress) * .075;
  const intensity=energySection(t), pulse=clamp(beat*.70 + bass*.3,0,1);
  const impact=pulse*pulse;
  const micro=.0030*Math.sin(t*.39+i*1.3)+.008*impact*Math.sin(t*24.2+i);
  return {
    time:t, cue:i, cueName:curr.name, intensity,
    x:clamp(lerp(curr.x,next.x,drift)+micro,.12,.90),
    y:clamp(lerp(curr.y,next.y,drift)+.0025*Math.sin(t*.27+i)+.005*impact*Math.cos(t*24.2+i),.12,.86),
    zoom:clamp(curr.z+.010*progress+.035*pulse,1,1.75),
    pulse,
    blackout: t<.22 ? 1-t/.22 : t > 156.3 ? clamp((t-156.3)/1.7,0,1) : 0,
    flash: (t>41 && t<146 && pulse>.88) ? Math.min(.18,(pulse-.88)*1.35) : 0,
    cutFlash: i>0 && t-curr.at<.045 && (i===6||i===10||i===14) ? .16 : 0,
  };
}
/** A cinematic cover-crop. Returns integer-valued source bounds inside the original. */
export function cropAt(imageWidth,imageHeight,targetWidth,targetHeight,shot){
  if(!(imageWidth>0&&imageHeight>0&&targetWidth>0&&targetHeight>0)) throw new RangeError('Positive dimensions required');
  const aspect=targetWidth/targetHeight;
  let width=Math.min(imageWidth,imageHeight*aspect)/shot.zoom;
  let height=width/aspect;
  let cx=shot.x*imageWidth,cy=shot.y*imageHeight;
  let sx=clamp(cx-width/2,0,imageWidth-width),sy=clamp(cy-height/2,0,imageHeight-height);
  return {sx,sy,sw:width,sh:height};
}
/** Binary search for last mapped percussive onset, independent of requestAnimationFrame jitter. */
export function beatAt(map,seconds){
  const items=map?.beats;
  if(!Array.isArray(items)||!items.length) return 0;
  let low=0,high=items.length;
  while(low<high){const m=(low+high)>>1;if(items[m]<=seconds)low=m+1;else high=m;}
  if(low===0)return 0;
  const delta=seconds-items[low-1];
  return delta<.25? Math.exp(-delta*15):0;
}
