"""Zero-credits CPU regression checks for V3's actual motion input path."""
import pathlib,sys,unittest,subprocess,tempfile
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from render import LoopReader,crop_dynamic,guard_plate

class MotionRenderTests(unittest.TestCase):
    def test_guard_preserves_only_protected_pixels(self):
        moving=np.full((20,30,3),34,dtype=np.uint8)
        protected=np.zeros((20,30,4),dtype=np.uint8)
        protected[5:15,10:20,:3]=[74,117,231]
        protected[5:15,10:20,3]=255
        result=guard_plate(moving,protected)
        self.assertTrue(np.array_equal(result[8,15],[74,117,231]))
        self.assertTrue(np.array_equal(result[2,4],[34,34,34]))
        self.assertTrue(np.all(moving==34))
    def test_guard_fails_closed_on_wrong_size(self):
        with self.assertRaises(ValueError):guard_plate(np.zeros((40,70,3),np.uint8),np.zeros((39,70,4),np.uint8))
    def test_motion_crop_stays_in_bounds(self):
        src=np.uint8(np.random.default_rng(5).integers(0,255,(320,500,3)))
        for sx in (-20,0,520,1120):
            out=crop_dynamic(src,(sx,15,1000,600),(2048,1280),640,360)
            self.assertEqual(out.shape,(360,640,3))
    def test_loop_reader_has_real_moving_frames_and_repeats(self):
        with tempfile.TemporaryDirectory() as td:
            path=pathlib.Path(td)/'plate.mp4'
            subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i','testsrc2=size=144x96:rate=12',
                  '-t','4','-c:v','libx264','-pix_fmt','yuv420p',str(path)],check=True)
            reader=LoopReader(path)
            try:
                a=reader.at(.1).copy();b=reader.at(2.5).copy();c=reader.at(4.1).copy()
                self.assertGreater(np.abs(a.astype('int16')-b.astype('int16')).mean(),.5)
                self.assertEqual(a.shape,c.shape)
                self.assertLess(np.abs(a.astype('int16')-c.astype('int16')).mean(),2)
            finally:reader.close()
if __name__=='__main__':unittest.main()
