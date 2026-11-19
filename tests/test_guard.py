"""Registration and identity-conservation tests."""
import sys,pathlib,unittest
import numpy as np
import cv2
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from guard import project_masks,make_guard,detect_mapping
class GuardTests(unittest.TestCase):
    def test_roi_renders_opaque_centers_without_filling_background(self):
        score={'protected':[{'box':[.12,.2,.25,.4]},{'box':[.61,.21,.8,.41]}]}
        m=project_masks(score,np.eye(3),(1000,600),(1000,600),9)
        self.assertEqual(m[180,180],255)
        self.assertEqual(m[30,500],0)
        self.assertEqual(m[190,690],255)
    def test_registration_and_exact_unmodified_core(self):
        rng=np.random.default_rng(22)
        photo=np.uint8(rng.integers(0,256,(500,800,3)))
        transformed=cv2.resize(photo,(640,400))
        score={'protected':[{'box':[.1,.15,.25,.4]},{'box':[.7,.55,.85,.8]}]}
        guard,info=make_guard(photo,transformed,score)
        self.assertEqual(guard.shape,(400,640,4))
        self.assertGreater(info['inlierRatio'],.5)
        center=guard[95,90]
        self.assertEqual(center[3],255)
        self.assertLess(np.abs(center[:3].astype('int16')-transformed[95,90].astype('int16')).mean(),12)
    def test_flat_footage_fails_closed(self):
        blank=np.zeros((350,640,3),dtype=np.uint8)
        with self.assertRaises(ValueError):detect_mapping(blank,blank)
if __name__=='__main__':unittest.main()
