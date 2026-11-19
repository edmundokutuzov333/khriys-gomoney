import {DURATION,beatAt,clamp} from './score.js';
import {FilmEngine} from './film.js';
import {MotionSync} from './motion.js';
const $=(id)=>document.getElementById(id);
const canvas=$('film'),motion=$('motion'),audio=$('audio'),player=$('player'),playBtn=$('toggle'),seek=$('seek'),clock=$('clock'),mute=$('mute'),full=$('fullscreen'),status=$('status'),save=$('save');
const image=new Image();image.decoding='async';image.src='/cover.png';
const guard=new Image();guard.decoding='async';guard.src='/guard.png';
const sync=new MotionSync(motion,audio);
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
    sync.tick();engine.draw(t,bass,Math.max(hit,bass*.62));
    if(!seek.matches(':active'))seek.value=String(t);
    clock.textContent=`${stamp(t)} / ${stamp(DURATION)}`;
    player.style.setProperty('--progress',`${t/DURATION*100}%`);
  }
  requestAnimationFrame(frame);
}
async function toggle(){
  if(audio.paused){
    if(audio.currentTime>=DURATION-.05)audio.currentTime=0;
    try{connectAnalyser();await audioCtx?.resume();await audio.play();await sync.play();hasStarted=true;status.textContent='';}
    catch(e){status.textContent='O browser impediu o áudio. Clique novamente para reproduzir.';}
  } else {audio.pause();sync.pause();}labels();
}
image.addEventListener('load',()=>{engine=new FilmEngine(canvas,image,motion,guard);resize();engine.draw(0,0,0);status.textContent='';});
image.addEventListener('error',()=>{status.textContent='Não foi possível carregar a imagem original.';});
fetch('/audio-map.json',{cache:'force-cache'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.beats)map=data;}).catch(()=>{});
playBtn.addEventListener('click',toggle);
canvas.addEventListener('click',toggle);
audio.addEventListener('play',labels);audio.addEventListener('pause',()=>{sync.pause();labels();});
motion.addEventListener('loadedmetadata',()=>{sync.seek();if(!audio.paused)sync.play();});
motion.addEventListener('error',()=>{if(!audio.paused)status.textContent='O movimento está indisponível. A fotografia original continua em reprodução.';});
audio.addEventListener('ended',()=>{labels();if(hasStarted)status.textContent='';});
audio.addEventListener('error',()=>{status.textContent='Não foi possível carregar a faixa de áudio.';});
audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=DURATION){audio.pause();sync.pause();audio.currentTime=DURATION;}});
seek.max=String(DURATION);
seek.addEventListener('input',()=>{const t=clamp(Number(seek.value),0,DURATION);audio.currentTime=t;sync.seek();clock.textContent=`${stamp(t)} / ${stamp(DURATION)}`;});
mute.addEventListener('click',()=>{audio.muted=!audio.muted;mute.setAttribute('aria-label',audio.muted?'Activar som':'Silenciar');mute.classList.toggle('muted',audio.muted);});
full.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await player.requestFullscreen();else await document.exitFullscreen();}catch(e){status.textContent='Ecrã inteiro indisponível neste browser.';}});
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();toggle();} else if(e.code==='ArrowRight'){audio.currentTime=clamp(audio.currentTime+5,0,DURATION);sync.seek();}else if(e.code==='ArrowLeft'){audio.currentTime=clamp(audio.currentTime-5,0,DURATION);sync.seek();}else if(e.key==='m'){mute.click();}else if(e.key==='f'){full.click();}});
if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
// Stable, validated public GitHub Release asset: no API rate limit, no expiring URL.
save.hidden=false;
save.href='https://github.com/edmundokutuzov333/khriys-gomoney/releases/download/visualizer-v3/walk-to-the-bank-v3.mp4';
save.textContent='DOWNLOAD MP4 V3';
save.removeAttribute('target');
save.setAttribute('aria-label','Descarregar o visualizer V3 completo em MP4');
labels();requestAnimationFrame(frame);
