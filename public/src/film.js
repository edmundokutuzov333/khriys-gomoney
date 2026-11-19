import {scoreAt,cropAt,energySection,clamp} from './score.js';

function seeded(v){let n=(v>>>0)^0x9e3779b9;n=Math.imul(n^(n>>>16),0x21f0aaad);n=Math.imul(n^(n>>>15),0x735a2d97);return ((n^(n>>>15))>>>0)/4294967296;}

/** Render-only procedural light, gate, interference and grain. The source photo is immutable. */
export class FilmEngine {
  constructor(canvas,image){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});this.image=image;
    this.width=0;this.height=0;this.grainTiles=[];this.vignette=null;
  }
  resize(w,h){
    const W=Math.max(320,Math.round(w)),H=Math.max(180,Math.round(h));
    if(W===this.width&&H===this.height)return;
    this.width=W;this.height=H;this.canvas.width=W;this.canvas.height=H;
    const mask=document.createElement('canvas');mask.width=W;mask.height=H;
    const m=mask.getContext('2d');const radius=Math.sqrt(W*W+H*H)*.68;
    const v=m.createRadialGradient(W*.50,H*.48,radius*.08,W*.5,H*.5,radius);
    v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(.50,'rgba(0,0,0,.06)');v.addColorStop(1,'rgba(0,0,0,.78)');
    m.fillStyle=v;m.fillRect(0,0,W,H);this.vignette=mask;
    this.grainTiles=[];
    for(let k=0;k<7;k++){
      const grain=document.createElement('canvas');grain.width=160;grain.height=90;
      const g=grain.getContext('2d'),img=g.createImageData(160,90);
      for(let i=0;i<img.data.length;i+=4){const r=seeded(i*17+k*4093);img.data[i]=img.data[i+1]=img.data[i+2]=r>.5?245:13;img.data[i+3]=Math.round(25+90*r);}
      g.putImageData(img,0,0);this.grainTiles.push(grain);
    }
  }
  draw(time,bass=0,beat=0){
    const ctx=this.ctx,W=this.width,H=this.height,img=this.image;
    if(!ctx||!W||!H||!img?.naturalWidth)return;
    const shot=scoreAt(time,bass,beat),s=cropAt(img.naturalWidth,img.naturalHeight,W,H,shot);
    ctx.save();ctx.fillStyle='#040506';ctx.fillRect(0,0,W,H);
    // A single crop of the original bitmap: no segmentation, re-identification, or warping.
    ctx.filter=`contrast(${1.105+shot.intensity*.025}) saturate(${.85-shot.intensity*.08}) brightness(${.94+shot.pulse*.035})`;
    ctx.drawImage(img,s.sx,s.sy,s.sw,s.sh,0,0,W,H);ctx.filter='none';
    // Gate-edge shadows and very restrained anamorphic light leaks.
    const flare=ctx.createLinearGradient(0,0,W,0);
    flare.addColorStop(0,`rgba(19,91,119,${.08+shot.intensity*.04})`);
    flare.addColorStop(.23,'rgba(0,0,0,0)');flare.addColorStop(.78,'rgba(0,0,0,0)');
    flare.addColorStop(1,`rgba(115,11,10,${.07+shot.pulse*.09})`);
    ctx.fillStyle=flare;ctx.fillRect(0,0,W,H);
    ctx.drawImage(this.vignette,0,0,W,H);
    const frame=Math.floor(time*24),chaos=energySection(time);
    ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=.20;
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(this.grainTiles[frame%this.grainTiles.length],0,0,W,H);
    ctx.imageSmoothingEnabled=true;ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    // Optical interference stays at the frame edge: text and facial features are never displaced.
    if(chaos>.63){
      for(let j=0;j<(chaos>.9?3:2);j++){
        const key=frame*19+j*131,r=seeded(key);
        if(r>.85){const y=(seeded(key+2)*H)|0,barH=Math.max(1,H*.0018);
          ctx.fillStyle=j%2?'rgba(226,228,230,.12)':'rgba(154,35,28,.22)';
          ctx.fillRect(0,y,W*.08+seeded(key+8)*W*.12,barH);
        }
      }
    }
    if(shot.flash+shot.cutFlash>.001){ctx.fillStyle=`rgba(220,229,232,${shot.flash+shot.cutFlash})`;ctx.fillRect(0,0,W,H);}
    if(shot.blackout>.001){ctx.fillStyle=`rgba(0,0,0,${clamp(shot.blackout,0,1)})`;ctx.fillRect(0,0,W,H);}
    ctx.restore();
  }
}
