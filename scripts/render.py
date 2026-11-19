#!/usr/bin/env python3
"""Produce a full-duration, film-graded 24fps H.264 master from the exact source photograph.

No generative face animation. Full-image crop/zoom only; all VFX are optical overlays.
"""
from __future__ import annotations
import argparse
import json
import math
import subprocess
from pathlib import Path
import cv2
import numpy as np


def clamp(x: float, lo: float, hi: float) -> float:
    return min(hi, max(lo, x))


def smoothstep(x: float) -> float:
    t = clamp(x, 0, 1)
    return t * t * (3 - 2 * t)


def section(t: float) -> float:
    if t < 17: return .35
    if t < 41: return .64
    if t < 71: return .85
    if t < 94: return .70
    if t < 127: return .84
    if t < 146: return 1.
    return .42


def pulse_at(beats: list[float], t: float, beat_index: int) -> float:
    if beat_index < 0: return 0
    delta = t - beats[beat_index]
    return math.exp(-delta * 15) if 0 <= delta < .25 else 0


def shot_at(cues: list[dict], t: float, cue_index: int, pulse: float) -> tuple[float, float, float, float, float]:
    curr = cues[cue_index]
    nxt = cues[min(cue_index+1, len(cues)-1)]
    progress = clamp((t-curr['at']) / max(1, nxt['at']-curr['at']),0,1)
    drift = smoothstep(progress) * .075
    jitter = .0030*math.sin(t*.39+cue_index*1.3)
    x = clamp(curr['x']+(nxt['x']-curr['x'])*drift+jitter,.12,.90)
    y = clamp(curr['y']+(nxt['y']-curr['y'])*drift+.0025*math.sin(t*.27+cue_index),.12,.86)
    zoom = clamp(curr['z']+.010*progress+.013*pulse,1,1.75)
    blackout = 1-t/.22 if t<.22 else clamp((t-156.3)/1.7,0,1) if t>156.3 else 0
    return x,y,zoom,blackout,section(t)


def render(args: argparse.Namespace) -> None:
    cues=json.loads(args.score.read_text())['cues']
    if len(cues)<3 or cues[0]['at']!=0: raise ValueError('Missing shot list')
    image=cv2.imread(str(args.image),cv2.IMREAD_COLOR)
    if image is None: raise FileNotFoundError(args.image)
    if image.shape[0]<700 or image.shape[1]<1200:
        raise ValueError('Source image too small to preserve the original details')
    audio_map=json.loads(args.map.read_text())
    beats=audio_map.get('beats',[])
    ow,oh=image.shape[1],image.shape[0]
    W,H=args.width,args.height
    assert W%2==H%2==0
    frames=round(args.duration*args.fps)
    # Two-stage FFmpeg: PCM pixel frames are piped in; the original MP3 is untouched until AAC mux.
    cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pix_fmt','bgr24',
         '-s',f'{W}x{H}','-r',str(args.fps),'-i','-','-i',str(args.audio),
         '-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset',args.preset,
         '-crf',str(args.crf),'-maxrate','8M','-bufsize','16M','-pix_fmt','yuv420p',
         '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',
         '-c:a','aac','-b:a','256k','-af','apad','-t',str(args.duration),
         '-movflags','+faststart','-metadata','title=WALK TO THE BANK - KHRIYS X GOMONEY',
         str(args.output)]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    vignette=np.empty((H,W,1),dtype=np.float32)
    gx=np.linspace(-1,1,W,dtype=np.float32)[None,:]
    gy=np.linspace(-1,1,H,dtype=np.float32)[:,None]
    radius=np.clip((gx*gx*.58+gy*gy*.95-.17)*.48,0,.4)
    vignette[:,:,0]=1-radius
    rng=np.random.default_rng(2201997)
    # Precalculate a few optical emulsion grains; fast to reuse and visually non-repeating after crops.
    grain=[rng.normal(0,5.7,(H,W,1)).astype(np.float32) for _ in range(13)]
    xgrad=np.linspace(0,1,W,dtype=np.float32)[None,:,None]
    edge_blue=np.clip((.17-xgrad)/.17,0,1)*np.array([15,3,-2],dtype=np.float32).reshape(1,1,3)
    edge_red=np.clip((xgrad-.82)/.18,0,1)*np.array([-5,-1,20],dtype=np.float32).reshape(1,1,3)
    cue_index=0;beat_index=-1
    try:
        for f in range(frames):
            t=f/args.fps
            while cue_index+1<len(cues) and cues[cue_index+1]['at']<=t: cue_index+=1
            while beat_index+1<len(beats) and beats[beat_index+1]<=t: beat_index+=1
            beat=pulse_at(beats,t,beat_index)
            x,y,zoom,blackout,intensity=shot_at(cues,t,cue_index,beat)
            cw=min(ow,oh*W/H)/zoom;ch=cw*H/W
            sx=clamp(x*ow-cw/2,0,ow-cw);sy=clamp(y*oh-ch/2,0,oh-ch)
            # Sampling only: no pixel synthesis, facial relighting, geometry warp or inpainting.
            frame=cv2.resize(image[int(sy):int(sy+ch),int(sx):int(sx+cw)],(W,H),interpolation=cv2.INTER_LINEAR)
            pixels=frame.astype(np.float32,copy=False)
            pixels=(pixels-120)*(1.105+intensity*.025)+120
            # Almost neutral, cold shadows + original ochre/red packaging still intact.
            pixels=pixels*np.array([1.028,.99,.975],dtype=np.float32)
            pixels=(pixels+edge_blue+edge_red)*vignette
            pixels+=grain[f%len(grain)]*.62
            if intensity>.63 and (f*19%67)>63:
                cy=int(H*((f*43%113)/113));pixels[cy:cy+2,0:int(W*.09),:]+=12
            if t>41 and t<146 and beat>.88:
                pixels=pixels*(1-min(.18,(beat-.88)*1.35))+220*min(.18,(beat-.88)*1.35)
            if cue_index in (6,10,14) and t-cues[cue_index]['at']<1/args.fps:
                pixels=pixels*.88+225*.12
            if blackout: pixels*=1-clamp(blackout,0,1)
            np.clip(pixels,0,255,out=pixels)
            proc.stdin.write(pixels.astype(np.uint8).tobytes())
            if f>0 and f%480==0: print(f'Rendered {f/args.fps:.0f}s / {args.duration:.0f}s',flush=True)
    except BrokenPipeError as exc:
        raise RuntimeError('FFmpeg encoder exited before all frames were written') from exc
    finally:
        if proc.stdin: proc.stdin.close()
    result=proc.wait()
    if result: raise RuntimeError(f'FFmpeg failed with exit code {result}')
    if not args.output.is_file() or args.output.stat().st_size<1000: raise RuntimeError('Empty MP4 produced')
    print(f'Output {args.output} ({args.output.stat().st_size/1e6:.1f} MB, {frames} frames)',flush=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--image',type=Path,default=Path('public/cover.png'))
    parser.add_argument('--audio',type=Path,default=Path('walk_to_the_bank.mp3'))
    parser.add_argument('--score',type=Path,default=Path('build/score.json'))
    parser.add_argument('--map',type=Path,default=Path('public/audio-map.json'))
    parser.add_argument('--output',type=Path,default=Path('build/walk-to-the-bank-visualizer.mp4'))
    parser.add_argument('--width',type=int,default=1920)
    parser.add_argument('--height',type=int,default=1080)
    parser.add_argument('--fps',type=int,default=24)
    parser.add_argument('--duration',type=float,default=158.)
    parser.add_argument('--crf',type=int,default=21)
    parser.add_argument('--preset',choices=['ultrafast','superfast','veryfast','faster','fast','medium'],default='veryfast')
    render(parser.parse_args())
if __name__=='__main__': main()
