import {DURATION,beatAt,clamp} from './score.js';
import {FilmEngine} from './film.js';
const $=(id)=>document.getElementById(id);
const canvas=$('film'),audio=$('audio'),player=$('player'),playBtn=$('toggle'),seek=$('seek'),clock=$('clock'),mute=$('mute'),full=$('fullscreen'),status=$('status'),save=$('save');
const image=new Image();image.decoding='async';image.src='/cover.png';
let engine=null, audioCtx=null,analyser=null,bins=null,map=null,low=0,phase=0,hasStarted=false;
const stamp=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const labels=()=>{playBtn.setAttribute('aria-label',audio.paused?'Reproduzir':'Pausar');playBtn.classList.toggle('is-playing',!audio.paused);};
function resize(){const b=canvas.getBoundingClientRect();if(engine&&b.width&&b.height)engine.resize(Math.min(1920,Math.round(b.width*devicePixelRatio)),Math.min(1080,Math.round(b.height*devicePixelRatio)));}
function connectAnalyser(){
  if(audioCtx)return;
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  audioCtx=new Context();const src=audioCtx.createMediaElementSource(audio);
  analyser=audioCtx.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.76;
  src.connect(analyser);analyser.connect(audioCtx.destination);bins=new Uint8Array(analyser.frequencyBinCount);
}
function soundPressure(){
  if(!analyser)return 0;analyser.getByteFrequencyData(bins);
  const n=Math.min(9,bins.length);let e=0;for(let i=2;i<n;i++)e+=bins[i];
  const raw=clamp((e/(n-2)-58)/150,0,1);low=low*.81+raw*.19;return low;
}
function frame(){
  if(engine){const t=clamp(audio.currentTime||0,0,DURATION),bass=soundPressure(),hit=beatAt(map,t);
    engine.draw(t,bass,Math.max(hit,bass*.62));
    if(!seek.matches(':active'))seek.value=String(t);
    clock.textContent=`${stamp(t)} / ${stamp(DURATION)}`;
    player.style.setProperty('--progress',`${t/DURATION*100}%`);
  }
  requestAnimationFrame(frame);
}
async function toggle(){
  if(audio.paused){
    if(audio.currentTime>=DURATION-.05)audio.currentTime=0;
    try{connectAnalyser();await audioCtx?.resume();await audio.play();hasStarted=true;status.textContent='';}
    catch(e){status.textContent='O browser impediu o áudio. Clique novamente para reproduzir.';}
  } else audio.pause();labels();
}
image.addEventListener('load',()=>{engine=new FilmEngine(canvas,image);resize();engine.draw(0,0,0);status.textContent='';});
image.addEventListener('error',()=>{status.textContent='Não foi possível carregar a imagem original.';});
fetch('/audio-map.json',{cache:'force-cache'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.beats)map=data;}).catch(()=>{});
playBtn.addEventListener('click',toggle);
canvas.addEventListener('click',toggle);
audio.addEventListener('play',labels);audio.addEventListener('pause',labels);
audio.addEventListener('ended',()=>{labels();if(hasStarted)status.textContent='';});
audio.addEventListener('error',()=>{status.textContent='Não foi possível carregar a faixa de áudio.';});
audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=DURATION){audio.pause();audio.currentTime=DURATION;}});
seek.max=String(DURATION);
seek.addEventListener('input',()=>{const t=clamp(Number(seek.value),0,DURATION);audio.currentTime=t;clock.textContent=`${stamp(t)} / ${stamp(DURATION)}`;});
mute.addEventListener('click',()=>{audio.muted=!audio.muted;mute.setAttribute('aria-label',audio.muted?'Activar som':'Silenciar');mute.classList.toggle('muted',audio.muted);});
full.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await player.requestFullscreen();else await document.exitFullscreen();}catch(e){status.textContent='Ecrã inteiro indisponível neste browser.';}});
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();toggle();} else if(e.code==='ArrowRight'){audio.currentTime=clamp(audio.currentTime+5,0,DURATION);}else if(e.code==='ArrowLeft'){audio.currentTime=clamp(audio.currentTime-5,0,DURATION);}else if(e.key==='m'){mute.click();}else if(e.key==='f'){full.click();}});
if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
// Only surface a release when GitHub has actually published an exported MP4.
fetch('https://api.github.com/repos/edmundokutuzov333/khriys-gomoney/releases/tags/visualizer-v1').then(r=>r.ok?r.json():null).then(data=>{const asset=data?.assets?.find(a=>a.name==='walk-to-the-bank-visualizer.mp4');if(asset){save.href=asset.browser_download_url;save.hidden=false;}}).catch(()=>{});
labels();requestAnimationFrame(frame);
