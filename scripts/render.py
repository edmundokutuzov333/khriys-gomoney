#!/usr/bin/env python3
"""Export a frame-accurate 02:38 VFX master from immutable original photography.

Shared motion/effects score drives Canvas and CPU-only optical compositor.
Faces, board typography, FLOW pack always avoid spatial displacement.
"""
from __future__ import annotations
import argparse
import json
import math
import subprocess
from pathlib import Path
import cv2
import numpy as np
from vfx import OpticalVFX


class LoopReader:
    """Decode generated silent video sequentially, with sample-accurate loop phases."""
    def __init__(self, path: Path):
        self.cap=cv2.VideoCapture(str(path))
        self.fps=float(self.cap.get(cv2.CAP_PROP_FPS))
        self.count=int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if not self.cap.isOpened() or not 10<=self.fps<=120 or self.count<20:
            raise ValueError(f"Invalid motion plate: {path}")
        self.duration=self.count/self.fps
        if not 3<=self.duration<=30:raise ValueError("Motion clip duration invalid")
        self.index=-1
        self.frame=None

    def at(self, time:float):
        phase=time%self.duration
        target=min(self.count-1,int(phase*self.fps+.01))
        if target<self.index:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES,0)
            self.index=-1
        while self.index<target:
            ok,self.frame=self.cap.read()
            if not ok:raise RuntimeError(f"Video decode failed at frame {self.index+1}")
            self.index+=1
        return self.frame

    def close(self):self.cap.release()


def crop_dynamic(src:np.ndarray, crop:tuple, photo_size:tuple, width:int, height:int):
    """Carry source-photo camera cues onto the registered 16:9 video plate."""
    ow,oh=photo_size
    vw,vh=src.shape[1],src.shape[0]
    fitw=min(ow,oh*vw/vh); fith=fitw*vh/vw
    offx=(ow-fitw)/2;offy=(oh-fith)/2
    sx,sy,cw,ch=crop
    left=int(clamp((sx-offx)/fitw*vw,0,vw-2))
    top=int(clamp((sy-offy)/fith*vh,0,vh-2))
    dw=int(clamp(cw/fitw*vw,2,vw-left));dh=int(clamp(ch/fith*vh,2,vh-top))
    return cv2.resize(src[top:top+dh,left:left+dw],(width,height),interpolation=cv2.INTER_LINEAR)


def guard_plate(src:np.ndarray,guard:np.ndarray):
    """Preserve signed-off photo pixels in immutable alpha regions."""
    if guard.shape[:2]!=src.shape[:2]:raise ValueError("Protection matte and motion geometry mismatch")
    alpha=guard[:,:,3:4].astype(np.float32)*(1/255)
    rgb=guard[:,:,:3].astype(np.float32)
    return np.clip(src.astype(np.float32)*(1-alpha)+rgb*alpha,0,255).astype(np.uint8)


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
    impact=pulse*pulse
    jitter = .0030*math.sin(t*.39+cue_index*1.3)+.008*impact*math.sin(t*24.2+cue_index)
    x = clamp(curr['x']+(nxt['x']-curr['x'])*drift+jitter,.12,.90)
    y = clamp(curr['y']+(nxt['y']-curr['y'])*drift+.0025*math.sin(t*.27+cue_index)+.005*impact*math.cos(t*24.2+cue_index),.12,.86)
    zoom = clamp(curr['z']+.010*progress+.035*pulse,1,1.75)
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
    motion=LoopReader(args.motion) if args.motion else None
    guard=cv2.imread(str(args.guard),cv2.IMREAD_UNCHANGED) if args.guard else None
    if motion:
        if guard is None or guard.shape[2]!=4:raise ValueError('AI motion requires aligned RGBA immutable guard')
        if (motion.cap.get(cv2.CAP_PROP_FRAME_WIDTH),motion.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))!=(guard.shape[1],guard.shape[0]):
            raise ValueError('AI video and protected guard dimensions do not match')
    elif args.guard:raise ValueError('Guard requires motion video')
    W,H=args.width,args.height
    assert W%2==H%2==0
    frames=round(args.duration*args.fps)
    # Two-stage FFmpeg: PCM pixel frames are piped in; the original MP3 is untouched until AAC mux.
    cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pix_fmt','bgr24',
         '-s',f'{W}x{H}','-r',str(args.fps),'-i','-','-ss',str(args.start),'-i',str(args.audio),
         '-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset',args.preset,
         '-crf',str(args.crf),'-maxrate','8M','-bufsize','16M','-pix_fmt','yuv420p',
         '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',
         '-c:a','aac','-b:a','256k','-af','apad','-t',str(args.duration),
         '-movflags','+faststart','-metadata','title=WALK TO THE BANK - KHRIYS X GOMONEY',
         str(args.output)]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    optics=OpticalVFX(W,H,ow,oh,json.loads(args.score.read_text()))
    cue_index=0;beat_index=-1
    try:
        for f in range(frames):
            t=args.start+f/args.fps
            while cue_index+1<len(cues) and cues[cue_index+1]['at']<=t: cue_index+=1
            while beat_index+1<len(beats) and beats[beat_index+1]<=t: beat_index+=1
            beat=pulse_at(beats,t,beat_index)
            x,y,zoom,blackout,intensity=shot_at(cues,t,cue_index,beat)
            cw=min(ow,oh*W/H)/zoom;ch=cw*H/W
            sx=clamp(x*ow-cw/2,0,ow-cw);sy=clamp(y*oh-ch/2,0,oh-ch)
            # Sampling only: no pixel synthesis, facial relighting, geometry warp or inpainting.
            if motion:
                plate=guard_plate(motion.at(t),guard)
                frame=crop_dynamic(plate,(sx,sy,cw,ch),(ow,oh),W,H)
            else:
                frame=cv2.resize(image[int(sy):int(sy+ch),int(sx):int(sx+cw)],(W,H),interpolation=cv2.INTER_LINEAR)
            # Shared 39-section optical edit over real actor motion, with frozen protected pixels.
            frame=optics.render(frame,t,beat,beat,f,(sx,sy,cw,ch),moving=bool(motion))
            if blackout:
                frame=cv2.convertScaleAbs(frame,alpha=max(0,1-clamp(blackout,0,1)),beta=0)
            proc.stdin.write(frame.tobytes())
            if f>0 and f%480==0: print(f'Rendered {f/args.fps:.0f}s / {args.duration:.0f}s',flush=True)
    except BrokenPipeError as exc:
        raise RuntimeError('FFmpeg encoder exited before all frames were written') from exc
    finally:
        if motion:motion.close()
        if proc.stdin: proc.stdin.close()
    result=proc.wait()
    if result: raise RuntimeError(f'FFmpeg failed with exit code {result}')
    if not args.output.is_file() or args.output.stat().st_size<1000: raise RuntimeError('Empty MP4 produced')
    print(f'Output {args.output} ({args.output.stat().st_size/1e6:.1f} MB, {frames} frames)',flush=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--image',type=Path,default=Path('public/cover.png'))
    parser.add_argument('--motion',type=Path,default=None)
    parser.add_argument('--guard',type=Path,default=None)
    parser.add_argument('--audio',type=Path,default=Path('public/audiooficial/walktothebank.m4a'))
    parser.add_argument('--score',type=Path,default=Path('build/score.json'))
    parser.add_argument('--map',type=Path,default=Path('public/audio-map.json'))
    parser.add_argument('--output',type=Path,default=Path('build/walk-to-the-bank-visualizer.mp4'))
    parser.add_argument('--width',type=int,default=1920)
    parser.add_argument('--height',type=int,default=1080)
    parser.add_argument('--fps',type=int,default=24)
    parser.add_argument('--duration',type=float,default=158.)
    parser.add_argument('--start',type=float,default=0.)
    parser.add_argument('--crf',type=int,default=21)
    parser.add_argument('--preset',choices=['ultrafast','superfast','veryfast','faster','fast','medium'],default='veryfast')
    render(parser.parse_args())
if __name__=='__main__': main()
