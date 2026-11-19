# WALK TO THE BANK — KHRIYS × GOMONEY

An original-image-preserving, full-length (02:38) **underground trap visualizer**. The project includes a responsive zero-dependency web cinema player and an offline MP4 cinema master rendered by GitHub Actions. Production happens entirely on `main`.

## Final delivery

- **Web player:** Vercel static site serving the exact original photograph and MP3. Playback has fullscreen, seeking, mute, beat-reactive lens treatment and deterministic camera direction.
- **Film:** GitHub Release `visualizer-v1` → `walk-to-the-bank-visualizer.mp4` (1920×1080, 24 fps, H.264/AAC, 158 seconds, 3,792 frames). The download appears automatically in the player after the release is published.
- **Originals:** `public/cover.png` (2048×1280) and `walk_to_the_bank.mp3` remain untouched. `public/audio-map.json` is derived solely from the original music.

## Absolute creative restrictions

Every scene is a crop/scale/translation **of the unchanged photograph**. There is NO face generation, replacement, morphing, inpainting, pose animation, face tracking, object animation, editing of existing packaging or chalkboard text, or added on-video titles. Cinematography is created through shot selection, cadence, optical gate, restrained light leaks, vignette, grain and musical cuts. For a real moving pose performance, additional live-action source plates would be needed; this release correctly does not invent new poses.

## Zero-cost technical selection

| Option | Upsides | Risks | Decision |
|---|---|---|---|
| Generative image-to-video | Body/face motion possible | Can change identities, text, package and faces; expensive | Rejected |
| Remotion + headless Chromium | Powerful frame UI, familiar React scene graphs | Larger dependency/toolchain, browser rendering overhead for a one-photo film | Not selected |
| **Canvas 2D + Web Audio + deterministic EDL + Python/OpenCV/FFmpeg render** | No paid services, lightweight web player, stable image, exact frames and duration, reproducible CI export | Camera motion from a still rather than actual actor performance | **Selected** |

The source photo has 2048×1280 native resolution. 1080p is a faithful export; an actual Alexa 65/8K camera original is impossible to recover from a still. The film grade interprets the requested Vision3/ARRI tonal references without claiming a nonexistent camera acquisition.

## Architecture

```text
public/
  index.html             responsive film player; no on-image copy
  src/app.js             transport, audio time synchronization and input events
  src/score.js           21 immutable edit cues; musical act-energy; crop validation
  src/film.js            canvas engine; grain, gate, flare, flashes
  src/style.css          restrained underground editorial player
  cover.png              exact original source image
  audio-map.json         source music transient analysis
scripts/
  analyze_audio.py       stdlib + ffmpeg 8 kHz transient map
  export_score.mjs       same web cue data exported for offline renderer
  render.py              OpenCV full-frame editor → FFmpeg H.264/AAC
  prepare.mjs            deterministic MP3 handoff into static directory
.github/workflows/
  bootstrap.yml          test → source verify → render → ffprobe → GitHub Release
```

## Development

Requires Node ≥20, Python 3, `ffmpeg`, `ffprobe`. Static web player has **zero npm dependencies**. Film renderer requires `numpy==2.2.6` and `opencv-python-headless==4.11.0.86` (free and pinned for CI).

```sh
npm test
npm run score
python3 scripts/analyze_audio.py walk_to_the_bank.mp3
npm run build
npm start
# http://localhost:4173

python3 scripts/render.py # default: 1920x1080, 24 fps, 158 seconds
```

The original MP3 stays at the repository root; `npm run build` duplicates it into `public/` for deployment without rewriting or recompressing it. `npm run score` produces the shared source of truth for shot cue coordinates. Production render copies the original soundtrack into an AAC video track without effects or tempo adjustments.

## QA

- 9 Node built-in unit/integrity tests: timeline, dimensions, cropping, deterministic keyframes, envelope and source preservation.
- Live original asset dimension check (2048×1280), decoded music length check, full output duration/frame/codec audit via ffprobe.
- Automated release only after rendering and verification succeed.
- Public source and public original photo/video: publish only if you own the rights to the supplied track and image.
