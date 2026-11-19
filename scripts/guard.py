#!/usr/bin/env python3
"""Make a transparent, aligned static exclusion layer from the actual original.

No face generation, no typography reconstruction. Align the photo to the first
AI frame with SIFT/RANSAC, then conserve the source pixels in feathered ROIs.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import cv2
import numpy as np


def detect_mapping(original: np.ndarray, frame: np.ndarray):
    gray_a=cv2.cvtColor(original,cv2.COLOR_BGR2GRAY)
    gray_b=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
    detector=cv2.SIFT_create(nfeatures=5000,contrastThreshold=.02)
    pa,da=detector.detectAndCompute(gray_a,None)
    pb,db=detector.detectAndCompute(gray_b,None)
    if da is None or db is None:raise ValueError('No registration features detected')
    pairs=cv2.BFMatcher().knnMatch(da,db,k=2)
    good=[m for m,n in pairs if m.distance<.72*n.distance]
    if len(good)<18:raise ValueError(f'Photographic alignment inadequate: {len(good)} matches')
    a=np.float32([pa[m.queryIdx].pt for m in good]).reshape(-1,1,2)
    b=np.float32([pb[m.trainIdx].pt for m in good]).reshape(-1,1,2)
    H,inliers=cv2.findHomography(a,b,cv2.RANSAC,3.0,maxIters=3000,confidence=.997)
    if H is None or inliers is None or int(inliers.sum())<14:raise ValueError('Unreliable video-to-photo registration')
    if int(inliers.sum())/len(good)<.38:raise ValueError('Reference identity alignment below safety threshold')
    return H,{'matches':len(good),'inliers':int(inliers.sum()),'inlierRatio':round(int(inliers.sum())/len(good),3)}


def project_masks(score:dict, H:np.ndarray, source_size:tuple[int,int], output_size:tuple[int,int], feather=15):
    sw,sh=source_size;w,h=output_size
    matte=np.zeros((h,w),dtype=np.uint8)
    for protected in score['protected']:
        x0,y0,x1,y1=protected['box']
        rect=np.float32([[sw*x0,sh*y0],[sw*x1,sh*y0],[sw*x1,sh*y1],[sw*x0,sh*y1]]).reshape(1,-1,2)
        pts=cv2.perspectiveTransform(rect,H)[0]
        poly=np.round(pts).astype(np.int32)
        cv2.fillConvexPoly(matte,poly,255)
    # Larger alpha core preserves exact pixels; soft edge hides any cutout seams.
    feather=max(3,feather|1)
    matte=cv2.GaussianBlur(matte,(feather,feather),0)
    return matte


def make_guard(source:np.ndarray,video_frame:np.ndarray,score:dict):
    H,info=detect_mapping(source,video_frame)
    h,w=video_frame.shape[:2];sh,sw=source.shape[:2]
    target=cv2.warpPerspective(source,H,(w,h),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    alpha=project_masks(score,H,(sw,sh),(w,h))
    # Fully alpha'd pixels from ONLY the original photo.
    return np.dstack((target,alpha)),info


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--image',type=Path,default=Path('public/cover.png'))
    p.add_argument('--video',type=Path,default=Path('public/motion-loop.mp4'))
    p.add_argument('--score',type=Path,default=Path('build/score.json'))
    p.add_argument('--output',type=Path,default=Path('public/guard.png'))
    args=p.parse_args()
    source=cv2.imread(str(args.image),cv2.IMREAD_COLOR)
    cap=cv2.VideoCapture(str(args.video))
    ok,frame=cap.read();cap.release()
    if source is None or not ok:raise RuntimeError('Missing original or AI first frame')
    guard,info=make_guard(source,frame,json.loads(args.score.read_text()))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    if not cv2.imwrite(str(args.output),guard):raise RuntimeError('Failed to create guard')
    assert np.max(guard[:,:,3])==255 and np.min(guard[:,:,3])==0
    print('Registered immutable face, chalk and package masks:',info,flush=True)

if __name__=='__main__':main()
