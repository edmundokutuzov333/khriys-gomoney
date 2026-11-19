/** Music is the only master clock. The AI video is silent and phase-locked to it. */
import {clamp} from './score.js';
export const NOMINAL_LOOP_SECONDS = 10;
export const DRIFT_LIMIT_SECONDS = .115;
export function loopPhase(time, duration=NOMINAL_LOOP_SECONDS){
  const d=Number.isFinite(duration)&&duration>.5?duration:NOMINAL_LOOP_SECONDS;
  const t=Number.isFinite(time)?Math.max(0,time):0;
  return ((t%d)+d)%d;
}
export function phaseError(actual,target,duration){
  const d=Number.isFinite(duration)&&duration>.5?duration:NOMINAL_LOOP_SECONDS;
  const diff=Math.abs(actual-target);
  return Math.min(diff,Math.abs(diff-d));
}
/** No async work inside frame callbacks; seek only on real drift, not every frame. */
export class MotionSync {
  constructor(video,audio){this.video=video;this.audio=audio;this.enabled=false;this.lastSync=-Infinity;}
  get ready(){return !!(this.video?.readyState>=2&&this.video?.videoWidth>0);}
  get duration(){return this.video.duration||NOMINAL_LOOP_SECONDS;}
  seek(){
    if(!this.ready)return false;
    const target=loopPhase(this.audio.currentTime,this.duration);
    // Seeking to exactly the decoder boundary can be rejected by WebKit.
    this.video.currentTime=clamp(target,0,Math.max(0,this.duration-.008));
    this.lastSync=this.audio.currentTime;
    return true;
  }
  tick(){
    if(!this.ready||this.audio.paused)return;
    const time=this.audio.currentTime;
    if(time-this.lastSync<.30&&this.lastSync<=time)return;
    const target=loopPhase(time,this.duration);
    if(phaseError(this.video.currentTime,target,this.duration)>DRIFT_LIMIT_SECONDS) this.seek();
    else this.lastSync=time;
  }
  async play(){
    if(!this.video)return;
    try{
      if(this.ready)this.seek();
      this.video.muted=true;
      await this.video.play();
      this.enabled=true;
    }catch{this.enabled=false;}
  }
  pause(){this.video?.pause();}
}
/** Apply old photographic camera cues to the model's 16:9 decoded plate. */
export function mapCrop(sourceCrop, photoWidth,photoHeight,plateWidth,plateHeight){
 if([photoWidth,photoHeight,plateWidth,plateHeight,sourceCrop.sw,sourceCrop.sh].some(n=>!(n>0))) throw new RangeError('Invalid crop geometry');
 const fitw=Math.min(photoWidth,photoHeight*plateWidth/plateHeight),fith=fitw*plateHeight/plateWidth;
 const offx=(photoWidth-fitw)/2,offy=(photoHeight-fith)/2;
 const sx=clamp((sourceCrop.sx-offx)/fitw*plateWidth,0,plateWidth-2);
 const sy=clamp((sourceCrop.sy-offy)/fith*plateHeight,0,plateHeight-2);
 const sw=clamp(sourceCrop.sw/fitw*plateWidth,2,plateWidth-sx);
 const sh=clamp(sourceCrop.sh/fith*plateHeight,2,plateHeight-sy);
 return {sx,sy,sw,sh};
}
