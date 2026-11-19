import {scoreAt,cropAt,clamp} from './score.js';
import {IMMUTABLE,PUPPETS,stableNoise,vfxAt} from './vfx.js';

const LOOK_FILTER={
 clean:'none',
 night:'grayscale(1) contrast(1.6) brightness(.78) sepia(1) hue-rotate(63deg) saturate(3.4)',
 rgb:'contrast(1.7) saturate(2.6) hue-rotate(330deg)',
 fire:'contrast(1.75) saturate(3) sepia(.65) brightness(1.22)',
 surveillance:'grayscale(1) sepia(.95) hue-rotate(17deg) contrast(1.55) brightness(.86)',
};
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function regionRect(box,s,W,H,iw,ih){
  const x=(box[0]*iw-s.sx)/s.sw*W,y=(box[1]*ih-s.sy)/s.sh*H;
  return [x,y,(box[2]-box[0])*iw/s.sw*W,(box[3]-box[1])*ih/s.sh*H];
}
function puppetPath(ctx,p,s,W,H,iw,ih){
 ctx.beginPath();p.polygon.forEach(([x,y],i)=>{
  const X=(x*iw-s.sx)*W/s.sw,Y=(y*ih-s.sy)*H/s.sh;
  if(i===0)ctx.moveTo(X,Y);else ctx.lineTo(X,Y);
 });ctx.closePath();
}
/** Deterministic, source-preserving optical compositor. All facial/print regions locked. */
export class FilmEngine{
 constructor(screen,image){
  this.screen=screen;this.ctx=screen.getContext('2d',{alpha:false,desynchronized:true});this.image=image;
  this.width=0;this.height=0;this.base=null;this.lock=null;this.grain=[];this.scanline=null;this.vignette=null;
 }
 resize(w,h){
  const W=Math.max(320,Math.round(w)),H=Math.max(180,Math.round(h));
  if(W===this.width&&H===this.height)return;
  this.width=W;this.height=H;this.screen.width=W;this.screen.height=H;
  this.base=canvas(W,H);this.lock=canvas(W,H);
  this.grain=[];
  for(let k=0;k<8;k++){
   const c=canvas(160,90),g=c.getContext('2d'),data=g.createImageData(160,90);
   for(let i=0;i<data.data.length;i+=4){let n=stableNoise(i*13+k*6553);
    data.data[i]=data.data[i+1]=data.data[i+2]=n>.5?255:0;
    data.data[i+3]=Math.round(20+115*n);}
   g.putImageData(data,0,0);this.grain.push(c);
  }
  const scan=canvas(4,4),t=scan.getContext('2d');t.fillStyle='rgba(0,0,0,.27)';t.fillRect(0,0,4,1);this.scanline=this.ctx.createPattern(scan,'repeat');
  const vg=canvas(W,H),v=vg.getContext('2d');
  const r=Math.hypot(W,H)*.68;
  const grad=v.createRadialGradient(W*.49,H*.5,r*.07,W*.49,H*.5,r);
  grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(.55,'rgba(0,0,0,.03)');grad.addColorStop(1,'rgba(0,0,0,.73)');
  v.fillStyle=grad;v.fillRect(0,0,W,H);this.vignette=vg;
 }
 draw(time,bass=0,beat=0){
  const ctx=this.ctx,W=this.width,H=this.height,img=this.image;
  if(!ctx||!W||!H||!img?.naturalWidth)return;
  const shot=scoreAt(time,bass,beat),fx=vfxAt(time,beat,bass);
  const s=cropAt(img.naturalWidth,img.naturalHeight,W,H,shot);
  const {naturalWidth:iw,naturalHeight:ih}=img;
  const b=this.base.getContext('2d',{alpha:false}),lock=this.lock.getContext('2d',{alpha:false});
  b.globalAlpha=1;b.globalCompositeOperation='source-over';b.filter='none';
  b.fillStyle='#030404';b.fillRect(0,0,W,H);
  b.filter='contrast(1.12) saturate(.91)';
  b.drawImage(img,s.sx,s.sy,s.sw,s.sh,0,0,W,H);b.filter='none';
  ctx.save();ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.globalAlpha=1;
  ctx.drawImage(this.base,0,0);
  if(fx.look!=='clean'){
   ctx.save();ctx.globalAlpha=fx.amount*(fx.look==='rgb'?.82:.94);
   ctx.filter=LOOK_FILTER[fx.look];ctx.drawImage(this.base,0,0);ctx.restore();
  }
  if(fx.look==='night'){
   ctx.fillStyle=`rgba(40,215,96,${.09*fx.amount})`;ctx.fillRect(0,0,W,H);
  }else if(fx.look==='fire'){
   ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.20*fx.bloom;
   ctx.filter='blur(12px) saturate(4)';ctx.drawImage(this.base,0,0);ctx.restore();
   ctx.fillStyle=`rgba(240,64,5,${.11*fx.amount})`;ctx.fillRect(0,0,W,H);
  }else if(fx.look==='surveillance'){
   ctx.fillStyle=`rgba(85,72,18,${.15*fx.amount})`;ctx.fillRect(0,0,W,H);
  }
  // Store the correctly graded, UNDISPLACED optical plate for facial/text conservation.
  lock.globalAlpha=1;lock.globalCompositeOperation='copy';lock.drawImage(this.screen,0,0);
  // RGB slit-scan. ONLY unprotected classroom/body pixels can be stretched.
  if(fx.glitch||fx.tear>0){
   ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);
   for(const part of IMMUTABLE){const [x,y,w,h]=regionRect(part.box,s,W,H,iw,ih);ctx.rect(x,y,w,h);}
   ctx.clip('evenodd');
   const rows=fx.glitch?8:3;
   for(let k=0;k<rows;k++){
    const key=fx.f*37+k*971,yy=stableNoise(key)*H;
    const hh=(.003+stableNoise(key+3)*.038)*H;
    const dx=(stableNoise(key+1)*2-1)*fx.tear*W/900;
    ctx.drawImage(this.lock,0,yy,W,hh,dx,yy,W,hh);
   }
   if(fx.chroma>.01){
    ctx.globalAlpha=.22*fx.chroma;ctx.globalCompositeOperation='screen';
    ctx.filter='sepia(1) saturate(8) hue-rotate(305deg)';ctx.drawImage(this.lock,-W*.006,0,W,H);
    ctx.filter='sepia(1) saturate(8) hue-rotate(130deg)';ctx.drawImage(this.lock,W*.006,0,W,H);ctx.filter='none';
   }
   ctx.restore();
  }
  // A restrained 2.5D cut-out echo: original hands, sleeve and sneaker pixels only.
  // Subpixel arc+phase motion, never a recreated face or altered branded product.
  if(time>2&&time<154){
   PUPPETS.forEach((p,i)=>{
    const delta=(Math.sin(time*(2.3+i*.3)+p.phase)+fx.shock*.72)*p.amp*W/1920;
    ctx.save();puppetPath(ctx,p,s,W,H,iw,ih);ctx.clip();
    const px=(p.pivot[0]*iw-s.sx)*W/s.sw,py=(p.pivot[1]*ih-s.sy)*H/s.sh;
    ctx.translate(px,py);ctx.rotate((Math.sin(time*(1.6+i*.23)+p.phase)*.013+fx.shock*.012));ctx.translate(-px, -py);
    ctx.globalAlpha=fx.ghost>.05?.34+fx.ghost*.34:.20;
    ctx.drawImage(this.lock,delta,Math.cos(time*2+i)*Math.abs(delta)*.55);
    ctx.restore();
   });
  }
  // Restore unshifted protected source pixels. Their colour look is retained.
  ctx.save();ctx.beginPath();
  for(const part of IMMUTABLE){const [x,y,w,h]=regionRect(part.box,s,W,H,iw,ih);ctx.rect(x,y,w,h);}
  ctx.clip();ctx.drawImage(this.lock,0,0);ctx.restore();
  // Rolling gate and chromatic light. Optical rather than content generation.
  if(fx.scan){
   ctx.save();ctx.fillStyle=this.scanline;ctx.globalAlpha=.17+fx.amount*.3;ctx.fillRect(0,0,W,H);
   const yy=(time*80%H+H)%H;
   ctx.fillStyle=`rgba(212,241,222,${.03+fx.amount*.08})`;ctx.fillRect(0,yy,W,H*.085);
   ctx.restore();
  }
  ctx.save();ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=.13+fx.amount*.35;
  ctx.imageSmoothingEnabled=false;ctx.drawImage(this.grain[fx.f%8],0,0,W,H);
  ctx.imageSmoothingEnabled=true;ctx.restore();
  ctx.drawImage(this.vignette,0,0);
  const edge=ctx.createLinearGradient(0,0,W,0);
  edge.addColorStop(0,`rgba(1,98,118,${.05+fx.shock*.12})`);
  edge.addColorStop(.23,'rgba(0,0,0,0)');edge.addColorStop(.75,'rgba(0,0,0,0)');
  edge.addColorStop(1,`rgba(235,35,5,${.06+fx.amount*.16})`);
  ctx.fillStyle=edge;ctx.fillRect(0,0,W,H);
  if(fx.strobe){ctx.fillStyle=`rgba(237,246,231,${.045+.20*fx.shock})`;ctx.fillRect(0,0,W,H);}
  if(shot.blackout>0){ctx.fillStyle=`rgba(0,0,0,${clamp(shot.blackout,0,1)})`;ctx.fillRect(0,0,W,H);}
  ctx.restore();
 }
}
