"""Offline image-integrity and temporal VFX regression checks."""
import json
import pathlib
import sys
import unittest
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from vfx import OpticalVFX, noise


class VfxTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.score=json.loads((ROOT/'build/score.json').read_text())

    def test_source_is_never_mutated_and_render_is_deterministic(self):
        y,x=np.mgrid[:180,:320]
        src=np.stack((x%256,y%256,(x+y)%256),axis=2).astype(np.uint8)
        unmodified=src.copy()
        score=self.score
        kwargs=(320,180,2048,1280,score)
        f1=OpticalVFX(*kwargs).render(src,14.4,.86,.7,345,(0,64,2048,1152))
        f2=OpticalVFX(*kwargs).render(src,14.4,.86,.7,345,(0,64,2048,1152))
        self.assertTrue(np.array_equal(f1,f2))
        self.assertTrue(np.array_equal(src,unmodified))
        self.assertGreater(np.abs(f1.astype('int16')-src.astype('int16')).mean(),15)

    def test_multiple_stylistic_phases_change_the_actual_pixels(self):
        rng=np.random.default_rng(17)
        photo=rng.integers(0,256,(180,320,3),dtype=np.uint8)
        frames=[]
        for t in [10.3,14.5,22.2,34.1]:
            engine=OpticalVFX(320,180,2048,1280,self.score)
            output=engine.render(photo,t,.7,.6,int(t*24),(0,64,2048,1152))
            frames.append(output)
        for i in range(len(frames)):
            for j in range(i+1,len(frames)):
                self.assertGreater(np.abs(frames[i].astype('int16')-frames[j].astype('int16')).mean(),7)

    def test_all_protected_regions_project_into_legal_frame_coordinates(self):
        e=OpticalVFX(320,180,2048,1280,self.score)
        for rect in [(0,0,2048,1152),(600,120,1120,630),(0,0,1800,1012)]:
            for x0,y0,x1,y1 in e.regions(rect):
                self.assertTrue(0<=x0<=320 and 0<=x1<=320)
                self.assertTrue(0<=y0<=180 and 0<=y1<=180)

    def test_stochastic_glitch_is_reproducible(self):
        self.assertEqual(noise(34256),noise(34256))
        self.assertNotEqual(noise(34256),noise(34257))
        engine=OpticalVFX(320,180,2048,1280,self.score)
        self.assertEqual(engine.props(14.4,.91,.4,345),engine.props(14.4,.91,.4,345))


if __name__=='__main__':unittest.main()
