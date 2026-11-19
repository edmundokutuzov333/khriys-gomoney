"""Mask-protected, CPU-only optical motion engine.

Four study modes: night-vision jewelry camera, RGB data-bend CRT,
solarized fire/halation, and dirty surveillance film.
No pre-trained face models, no hallucinated pixels, and no reference GIF frames.
All protected shapes are reprojected from the source photo per camera crop.
"""
from __future__ import annotations
import math
import cv2
import numpy as np


def clamp(x, lo=0.0, hi=1.0):
    return min(hi, max(lo, float(x)))


def noise(n: int) -> float:
    """Fast deterministic uint32 integer mixing, stable across platforms."""
    n = (int(n) ^ 0x9E3779B9) & 0xFFFFFFFF
    n = ((n ^ (n >> 16)) * 0x21F0AAAD) & 0xFFFFFFFF
    n = ((n ^ (n >> 15)) * 0x735A2D97) & 0xFFFFFFFF
    return ((n ^ (n >> 15)) & 0xFFFFFFFF) / 4294967296


class OpticalVFX:
    def __init__(self, width: int, height: int, source_width: int, source_height: int, score: dict):
        self.w,self.h=width,height
        self.sw,self.sh=source_width,source_height
        self.windows=score['vfx']
        self.locks=score['protected']
        self.puppets=score['puppets']
        self.rng=np.random.default_rng(484159)
        self.grain=[self.rng.integers(-12,13,(height,width),dtype=np.int16) for _ in range(9)]
        x=np.linspace(-1,1,width,dtype=np.float32)[None,:]
        y=np.linspace(-1,1,height,dtype=np.float32)[:,None]
        self.vignette=cv2.cvtColor(np.uint8(255*(1-np.clip((.56*x*x+.8*y*y-.20)*.41,0,.39))),cv2.COLOR_GRAY2BGR)
        self.last=None
        self.light=cv2.resize(np.array([[0,0,0,2,5,15,25,40,90,170,190,185,160,140,100,40]],dtype=np.uint8),(width,1))

    def props(self, t:float, beat:float, bass:float, frame_no:int) -> dict:
        idx=0
        for j in range(1,len(self.windows)):
            if self.windows[j][0]>t:break
            idx=j
        start,look,amount=self.windows[idx]
        nxt=self.windows[min(idx+1,len(self.windows)-1)][0]
        env=clamp((t-start)/.15)*clamp((nxt-t)/.22)
        shock=clamp(beat*.8+bass*.35)
        glitch=look=='rgb' and ((frame_no%11)<3 or shock>.66)
        return {'look':look,'amount':amount*env,'shock':shock,'glitch':glitch,
                'tear':(8+26*shock if glitch else 3 if look=='surveillance' else 0),
                'ghost':(.12+.32*shock)*amount if look in ('night','rgb') else 0,
                'bloom':(.42+.35*shock)*amount if look=='fire' else 0,
                'strobe':(frame_no%23==0 or shock>.79) and 9<t<154,
                'scan':look in ('night','rgb','surveillance')}

    def regions(self,crop):
        sx,sy,cw,ch=crop
        rects=[]
        for part in self.locks:
            x0,y0,x1,y1=part['box']
            x=round((x0*self.sw-sx)/cw*self.w)
            y=round((y0*self.sh-sy)/ch*self.h)
            rw=round((x1-x0)*self.sw/cw*self.w)
            rh=round((y1-y0)*self.sh/ch*self.h)
            rects.append((max(0,min(self.w,x)),max(0,min(self.h,y)),
                          max(0,min(self.w,x+rw)),max(0,min(self.h,y+rh))))
        return rects

    def grade(self, frame, look, amount):
        if amount<.005 or look=='clean':return frame
        if look=='night':
            gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
            gray=cv2.convertScaleAbs(gray,alpha=1.32,beta=-23)
            colored=cv2.merge((cv2.convertScaleAbs(gray,alpha=.42),
                               cv2.convertScaleAbs(gray,alpha=1.04),
                               cv2.convertScaleAbs(gray,alpha=.40)))
            alpha=amount*.89
        elif look=='surveillance':
            gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
            gray=(gray//22*22).astype(np.uint8)
            colored=cv2.merge((cv2.convertScaleAbs(gray,alpha=.70),
                               cv2.convertScaleAbs(gray,alpha=.97),
                               cv2.convertScaleAbs(gray,alpha=1.02)))
            alpha=amount*.80
        elif look=='rgb':
            strong=cv2.convertScaleAbs(frame,alpha=1.72,beta=-31)
            # Keep the album's warm bag coherent even when colors are violently separated.
            b,g,r=cv2.split(strong)
            colored=cv2.merge((cv2.convertScaleAbs(b,alpha=1.20),
                               cv2.convertScaleAbs(g,alpha=1.03),
                               cv2.convertScaleAbs(r,alpha=1.23)))
            alpha=amount*.76
        else:  # solarization; true thermal palette is only a look, not measured temperature
            mono=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
            colored=cv2.applyColorMap(cv2.convertScaleAbs(mono,alpha=1.47,beta=13),cv2.COLORMAP_HOT)
            alpha=amount*.84
        return cv2.addWeighted(frame,1-alpha,colored,alpha,0)

    def puppet(self, frame, t, shock, ghost, crop):
        sx,sy,cw,ch=crop
        for i,p in enumerate(self.puppets):
            poly=np.round(np.array([[(x*self.sw-sx)/cw*self.w,(y*self.sh-sy)/ch*self.h]
                        for x,y in p['polygon']],dtype=np.float32)).astype(np.int32)
            px=(p['pivot'][0]*self.sw-sx)/cw*self.w
            py=(p['pivot'][1]*self.sh-sy)/ch*self.h
            x0=max(0,int(poly[:,0].min())-35);x1=min(self.w,int(poly[:,0].max())+35)
            y0=max(0,int(poly[:,1].min())-35);y1=min(self.h,int(poly[:,1].max())+35)
            if x1<=x0 or y1<=y0:continue
            delta=(math.sin(t*(2.3+i*.3)+p['phase'])+.72*shock)*p['amp']*self.w/1920
            angle=(math.sin(t*(1.6+i*.23)+p['phase'])*.013+shock*.012)*180/math.pi
            a=cv2.getRotationMatrix2D((px-x0,py-y0),angle,1.0)
            a[0,2]+=delta;a[1,2]+=math.cos(t*2+i)*abs(delta)*.55
            roi=frame[y0:y1,x0:x1]
            shifted=cv2.warpAffine(roi,a,(x1-x0,y1-y0),flags=cv2.INTER_LINEAR,
                                   borderMode=cv2.BORDER_REFLECT_101)
            mask=np.zeros((y1-y0,x1-x0),dtype=np.uint8)
            cv2.fillPoly(mask,[poly-np.array([x0,y0])],255)
            # Photo-real anatomy is not invented; pixels from the actual source pulse subtly.
            amount=(.20 if ghost<.05 else .34+ghost*.34)
            mixed=cv2.addWeighted(roi,1-amount,shifted,amount,0)
            np.copyto(roi,mixed,where=mask[:,:,None].astype(bool))

    def render(self, original, t:float, beat:float, bass:float, frame_no:int, crop, moving:bool=False):
        f=self.props(t,beat,bass,frame_no)
        image=self.grade(original,f['look'],f['amount'])
        protected=image.copy()   # authoritative pixels BEFORE spatial effects
        # Horizontal data-bending and ragged scan slices on the UNPROTECTED plate only.
        if f['tear']>0:
            for row in range(9 if f['glitch'] else 3):
                key=frame_no*37+row*971
                y=int(noise(key)*self.h)
                h=max(1,int((.003+noise(key+3)*.038)*self.h))
                offset=int((noise(key+1)*2-1)*f['tear']*self.w/900)
                if offset:
                    strip=image[y:min(y+h,self.h)]
                    image[y:min(y+h,self.h)]=np.roll(strip,offset,axis=1)
        # Red/cyan channel displacement, but a literal copy of every protected region remains.
        if f['look']=='rgb' and f['amount']>.02:
            shift=max(1,round((.004+.005*beat)*self.w*f['amount']))
            b,g,r=cv2.split(image)
            r=np.roll(r,shift,axis=1)
            b=np.roll(b,-shift,axis=1)
            image=cv2.merge((b,g,r))
        if f['bloom']>.02:
            mini=cv2.resize(image,(max(8,self.w//7),max(8,self.h//7)),interpolation=cv2.INTER_AREA)
            blur=cv2.resize(cv2.GaussianBlur(mini,(7,7),0),(self.w,self.h),interpolation=cv2.INTER_LINEAR)
            image=cv2.addWeighted(image,1,blur,f['bloom']*.17,0)
        if 2<t<154 and not moving:self.puppet(image,t,f['shock'],f['ghost'],crop)
        # Frame-memory echoes: an analogue optical-printer look, never a synthesized person.
        if self.last is not None and (f['ghost']>.10 or (f['glitch'] and frame_no%11<2)):
            image=cv2.addWeighted(image,1-min(.23,f['ghost']*.30),self.last,min(.23,f['ghost']*.30),0)
        for x0,y0,x1,y1 in self.regions(crop):
            if x1>x0 and y1>y0:
                image[y0:y1,x0:x1]=protected[y0:y1,x0:x1]
        self.last=image.copy()
        # Optical gates, scanning, grain and light leaks never alter lettering geometry.
        if f['scan']:
            offset=frame_no%4
            image[offset::4]=cv2.convertScaleAbs(image[offset::4],alpha=.87,beta=0)
            y=int((t*80)%self.h)
            h=max(2,round(self.h*.045))
            image[y:min(y+h,self.h)]=cv2.convertScaleAbs(image[y:min(y+h,self.h)],alpha=1.05,beta=2)
        # Add desynchronized grain without introducing new content.
        grain=self.grain[frame_no%len(self.grain)]
        color=image.astype(np.int16)
        color+=grain[:,:,None]//2
        np.clip(color,0,255,out=color)
        image=color.astype(np.uint8)
        image=cv2.multiply(image,self.vignette,scale=1/255)
        if f['strobe']:
            a=.045+.18*f['shock']
            image=cv2.addWeighted(image,1-a,np.full_like(image,236),a,0)
        return image
