# WALK TO THE BANK — KHRIYS × GOMONEY / V3

Official underground trap visualizer, **02:38, 1920×1080, 24fps**, using the original 2048×1280 image and the **final official mix** at `public/audiooficial/walktothebank.m4a`. V3 adds **real generated limb, wrist, breathing and jacket motion** behind 39 distinct optical effect cues, rather than merely zooming a static picture. The full video is rendered off-line, and the responsive Vercel player reuses the same 10.083-second silent motion clip in synchrony with the 158-second original track.

## Creative and identity guarantees

- The original photo remains immutable at `public/cover.png`. The earlier MP3 remains archived at repo root; the official M4A in `public/audiooficial/` is the only playback and export audio source.
- The 10-second AI motion plate was generated once with Kling 2.5 1080p (650 Magnific credits; unlimited was not active). Its first and last source image are the same original photograph to make the loop continuous.
- Generated movement is restricted through prompt direction to the two arms, hands, watch and jacket cloth. **Not all intermediate pixels from AI can be claimed perfectly authentic.** To prevent changes to key identity and branding, `scripts/guard.py` uses SIFT+RANSAC to register the true photo to the generated footage, then creates a feathered transparent guard from original pixels.
- `public/guard.png` covers six regions: both faces, chalkboard lettering, FLOW package, and both embroidered school emblems. This guard is composited **before** colour processing or glitch overlays in both the browser (`FilmEngine`) and MP4 master (`scripts/render.py`). Protected areas never undergo spatial tear or synthesized movement.
- The six protected regions are not lip-synced, morph-generated, rewritten or inpainted. Packaging, typography and faces are the original pixels. No new lettering appears on screen.
- Optical effects are inspired by the four provided GIF *techniques*, not copies of their imagery. Clean, green nightvision, red/cyan CRT tearing, fiery solarization, CCTV and film grain alternate on 39 cues. No additional music, cost-bearing postprocessing or Magnific credits for loops or VFX.

## Architecture comparison

1. **Generate 158 seconds of AI video** — impractical cost, difficult identity coherence, high risk of faces and letters changing.
2. **Still image with motion filters only (V2)** — inexpensive and deterministic but actors cannot actually move, so not adequate.
3. **One generated 10s motion plate + protected original-photo regions + local deterministic 158s optical cinema master** — chosen. One generation, stable masks, real body movement behind protected identities, low running costs, browser loop and downloadable render.

## Files

```text
public/
  cover.png                untouched source photograph
  motion-loop.mp4          silent 10.083-second actor plate
  guard.png                RGBA original-image identity matte, SIFT registered
  audiooficial/            final official M4A, used by browser and MP4
  audio-map.json           generated transients from final official M4A
  src/motion.js            timestamp wrap and video/audio drift correction
  src/film.js              Canvas2D layered plate + original-photo guard + optical VFX
  src/app.js               music-master playback, seek, fullscreen and download
  src/score.js             21 camera/editorial cues, 158-second duration
  src/vfx.js               39 VFX treatments and protected regions
scripts/
  guard.py                 image-to-video alignment, mask rasterization
  render.py                CPU loop decoder → protected graded frames → FFmpeg MP4
  vfx.py                   matching deterministic optical effects
  analyze_audio.py        original song transient extraction
  export_score.mjs        shared shot/VFX plan
  prepare.mjs             fail-closed official media validation
.github/workflows/
  bootstrap.yml            legacy V2 release (retained)
  v3.yml                   permanent V3 test → render → MP4 release
```

## Build and QA

Current tests: **19 JavaScript + 11 Python = 30 passing checks**, plus real-media alignment and video/audio stream validation in CI.

Requires Node 22+, Python 3.12+, FFmpeg, `numpy==2.2.6`, `opencv-python-headless==4.11.0.86`.

```bash
npm test
npm run build
python scripts/guard.py --video public/motion-loop.mp4
python scripts/render.py --image public/cover.png --motion public/motion-loop.mp4 --guard public/guard.png \
  --audio walk_to_the_bank.mp3 --score build/score.json --map public/audio-map.json \
  --output build/walk-to-the-bank-v3.mp4 --width 1920 --height 1080 --fps 24 --duration 158
```

Both browser and MP4 retain **independent access** to the original still should an AI video decode fail. Browser playback uses the MP3 as master clock and resynchronizes the silent plate if drift exceeds 115ms. No paid video inference is performed at runtime.

## Delivery

- **Online visualizer:** https://khriys-gomoney.vercel.app
- **V3 MP4 download:** https://github.com/edmundokutuzov333/khriys-gomoney/releases/download/visualizer-v3/walk-to-the-bank-v3.mp4
- **Motion source download:** https://github.com/edmundokutuzov333/khriys-gomoney/releases/download/visualizer-v3/motion-loop.mp4

The V3 code, 10s video and face/text protection matte are now committed directly to main; no production build requires an expiring Magnific link or paid API. GitHub Actions verifies master duration (158s), H.264 video, AAC soundtrack, frame count (3792), dimensions (1920×1080) and playback file presence before release. Only the `main` branch is modified; V1/V2 releases are preserved.
