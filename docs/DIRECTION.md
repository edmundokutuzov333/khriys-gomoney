# WALK TO THE BANK — V2 / NIGHT-CAMERA DATA-BEND

## Creative proposition

The new edit is an original underground trap *found-footage performance film*, not the old Ken Burns slideshow. The four supplied visual GIFs are **style references only**, never inserted as footage: they contain unrelated bodies, faces, words and textures which would compromise the original scene. Visual attributes reverse-engineered: (1) phosphor-green night security/jewelry camera with motion echo, (2) brutal red/cyan composite CRT tearing, (3) solarized fire/colour-blown highlights, (4) dirty monochrome surveillance with rolling shutter, dust and temporal gate jitter. High-contrast beats alternate with photographic clean resets so that imagery is not a monotonous filter.

**Non-negotiables:** keep both identities, facial expressions, FLOW packaging, and the literal wording of `WALK TO THE BANK` exactly from the original PNG. No new writing in frames. Never warp print or faces. The on-screen UI is distinct from the *film* and does not become baked-in titles.

## Engineering decision: three paths compared

| Design | Advantages | Costs/risks | Decision |
|---|---|---|---|
| Diffusion image-to-video / face animation | Potentially full body performance | Changes faces and print, inconsistent identities, expensive GPU or paid generation, non-deterministic | Rejected |
| Fixed photograph with only camera pan/zoom | Very safe and fast | No true motion; looks like an animated slideshow | Rejected — explains V1 shortcomings |
| **Constrained 2.5D cut-out motion + audio-reactive optical compositing** | Unaltered source, deterministic, offline CPU, robust 02:38 timeline, reusable web+MP4 score | Original still cannot reveal hidden anatomy or create natural full-body performances | **Selected** |

**Motion mechanics:** for an arm, wrist and shoe, a polygon is tracked in *source photo coordinates*. An affine rotation about a physically relevant pivot with spring-style sine/impulse response makes a restrained, semi-transparent motion echo using the **original pixels only**. It is intentional analogue double exposure, **not** a synthesized anatomically correct video of real movement. The face, board text and FLOW package have immutable source-anchored exclusion masks. The optical look can change brightness/colour but no deformation is applied in those regions.

**Tempo and physics:** original MP3 is the sole soundtrack. The independent offline attack map identifies onset pulses and the web player combines the same beat map with low-end AudioContext analysis. FFT/bass envelopes move short optical events and kick the handheld virtual camera; all seeded CRT strips, flashes and puppet translations are reproducible. Visually aggressive looks are deliberately brief; no dangerous long-run full-screen strobe sequence is needed.

## Full 02:38 timecode — what appears on screen

The 21 base photographic framings from `public/src/score.js` run underneath the following second-by-second effect changes. Each entry describes a *4-second motif* rather than implying that the still photo has been regenerated. All motifs also contain grain, gate shadow and frame-to-frame optical vibration. The three gesture pixels echo on percussion throughout the active VFX sections.

| Interval | Visual treatment | Physical/optical action |
|---|---|---|
| 00:00–00:05 | Photographic reset / original intact (intensity 0%) | Introduce untouched classroom and FLOW bag, no generated introduction. |
| 00:05–00:09 | Found-footage: sepia CCTV, coarse scan, gate drift (intensity 60%) | Slow phosphor flicker, cheap camera scan, soft shutter and dust grain. |
| 00:09–00:13 | Jewel-camera: infrared green, exposure flicker, pulse echoes (intensity 84%) | Left telephone pose under infrared; hand gesture begins with subtle spring echoes. |
| 00:13–00:17 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 92%) | On snare hits, 3-frame split channels rip horizontal stripes outside identity masks. |
| 00:17–00:21 | Jewel-camera: infrared green, exposure flicker, pulse echoes (intensity 80%) | Phone/face unchanged; rhythm releases to high-contrast night plate. |
| 00:21–00:25 | Solar-burn: hot highlights, chromatic flare, bloom (intensity 90%) | Hot orange-white clipping blooms around the room; remaining print sharp and unchanged. |
| 00:25–00:29 | Photographic reset / original intact (intensity 0%) | Restore a clean photographic reference, prove the original text remains intact. |
| 00:29–00:33 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 94%) | On snare hits, 3-frame split channels rip horizontal stripes outside identity masks. |
| 00:33–00:37 | Found-footage: sepia CCTV, coarse scan, gate drift (intensity 76%) | Slow phosphor flicker, cheap camera scan, soft shutter and dust grain. |
| 00:37–00:41 | Solar-burn: hot highlights, chromatic flare, bloom (intensity 80%) | Hot orange-white clipping blooms around the room; remaining print sharp and unchanged. |
| 00:41–00:45 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 90%) | First dense drum transition: multiple RGB slices, motion ghost of raised hand. |
| 00:45–00:49 | Jewel-camera: infrared green, exposure flicker, pulse echoes (intensity 92%) | The camera drinks green IR while limb motion trails produce spectral double exposures. |
| 00:49–00:53 | Solar-burn: hot highlights, chromatic flare, bloom (intensity 90%) | Orange pack punches under solar burn, but its printed design is locked. |
| 00:53–00:57 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 100%) | On snare hits, 3-frame split channels rip horizontal stripes outside identity masks. |
| 00:57–01:01 | Found-footage: sepia CCTV, coarse scan, gate drift (intensity 82%) | VHS-like temporal dropouts, street-level grain and sepia camera noise. |
| 01:01–01:05 | Jewel-camera: infrared green, exposure flicker, pulse echoes (intensity 90%) | The camera drinks green IR while limb motion trails produce spectral double exposures. |
| 01:05–01:09 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 95%) | On snare hits, 3-frame split channels rip horizontal stripes outside identity masks. |
| 01:09–01:13 | Solar-burn: hot highlights, chromatic flare, bloom (intensity 100%) | Hot orange-white clipping blooms around the room; remaining print sharp and unchanged. |
| 01:13–01:17 | Photographic reset / original intact (intensity 0%) | Hard clean cut to reset the viewer before the next barrage. |
| 01:17–01:21 | Found-footage: sepia CCTV, coarse scan, gate drift (intensity 70%) | Slow phosphor flicker, cheap camera scan, soft shutter and dust grain. |
| 01:21–01:25 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 100%) | Full color-channel split and per-beat temporal echoes. |
| 01:25–01:29 | Jewel-camera: infrared green, exposure flicker, pulse echoes (intensity 100%) | The camera drinks green IR while limb motion trails produce spectral double exposures. |
| 01:29–01:33 | Solar-burn: hot highlights, chromatic flare, bloom (intensity 94%) | Hot orange-white clipping blooms around the room; remaining print sharp and unchanged. |
| 01:33–01:37 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 100%) | Packaging returns; no generated lettering or product changes. |
| 01:37–01:41 | Found-footage: sepia CCTV, coarse scan, gate drift (intensity 84%) | Slow phosphor flicker, cheap camera scan, soft shutter and dust grain. |
| 01:41–01:45 | Jewel-camera: infrared green, exposure flicker, pulse echoes (intensity 92%) | The camera drinks green IR while limb motion trails produce spectral double exposures. |
| 01:45–01:49 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 96%) | Bright RGB passages turn violently noisy on percussive peaks. |
| 01:49–01:53 | Solar-burn: hot highlights, chromatic flare, bloom (intensity 100%) | Hot orange-white clipping blooms around the room; remaining print sharp and unchanged. |
| 01:53–01:57 | Jewel-camera: infrared green, exposure flicker, pulse echoes (intensity 85%) | The camera drinks green IR while limb motion trails produce spectral double exposures. |
| 01:57–02:01 | Found-footage: sepia CCTV, coarse scan, gate drift (intensity 90%) | Underexposed sepia classroom with crooked optical gate. |
| 02:01–02:05 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 100%) | On snare hits, 3-frame split channels rip horizontal stripes outside identity masks. |
| 02:05–02:09 | Solar-burn: hot highlights, chromatic flare, bloom (intensity 95%) | Hot orange-white clipping blooms around the room; remaining print sharp and unchanged. |
| 02:09–02:13 | Jewel-camera: infrared green, exposure flicker, pulse echoes (intensity 96%) | Last intense IR and fire montage; arm, wrist and shoe echoes accelerate. |
| 02:13–02:17 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 100%) | On snare hits, 3-frame split channels rip horizontal stripes outside identity masks. |
| 02:17–02:21 | Found-footage: sepia CCTV, coarse scan, gate drift (intensity 97%) | Slow phosphor flicker, cheap camera scan, soft shutter and dust grain. |
| 02:21–02:25 | Solar-burn: hot highlights, chromatic flare, bloom (intensity 96%) | Hot orange-white clipping blooms around the room; remaining print sharp and unchanged. |
| 02:25–02:29 | CRT data-bend: red/cyan separation, horizontal tearing (intensity 86%) | Begin deceleration and progressive stabilization. |
| 02:29–02:33 | Jewel-camera: infrared green, exposure flicker, pulse echoes (intensity 80%) | The camera drinks green IR while limb motion trails produce spectral double exposures. |
| 02:33–02:38 | Photographic reset / original intact (intensity 0%) | Original classroom for closing, then black exactly at 02:38. |

## Production layers / implementation

1. **Immutable photographic plate:** `public/cover.png`, 2048×1280, cropped/translated but never replaced. Git CI checks its SHA-256. Two faces, original chalkboard text and FLOW pack are preserved as source-local rectangles, then reconstructed without any geometry movement after optical tears.
2. **Movement matte layer:** three hand-authored motion polygons, pivot anchors and temporal amplitudes defined in `public/src/vfx.js`. `public/src/film.js` uses Canvas 2D masks and affine deltas; `scripts/vfx.py` applies equivalent transforms via OpenCV in the MP4 path.
3. **Temporal optical layer:** four modes, with RGB shear, localized tape tears, double exposures, sine camera vibration, variable colour burn, scanlines, drifting bands and spectral grains. Grading affects light, not physical identity.
4. **Frame-accurate editorial score:** `public/src/score.js` + `public/src/vfx.js` exported into `build/score.json` (framings, 39 VFX cues, identity masks, and motion rigs) used by Python render, while Canvas imports the same JS modules.
5. **Delivery:** source MP3 untouched; H.264 BT.709 MP4, 1920×1080 at 24fps (3,792 frames) with AAC original track; Vercel serves static cinematic web player and GitHub release holds the larger video asset. Runs on open-source FFmpeg, NumPy, OpenCV; there is no dependency on Magnific, GPU AI, API credits, or paid VFX plugin.

## Quality contract / limitations

- Reference GIFs were inspected as style references. The second/first/fourth supplied uploads are single-frame GIF assets in the available files; the third contains multiple frames. We do not splice their foreign imagery into the film.
- **Do not claim** that genuine limb joint motions, new poses, or unphotographed body geometry have been recovered from a single picture. These are source-safe optical puppet echoes, enough to break the static feel but not a replacement for shooting actors.
- Source faces, logo, board typography and package remain pixel-derived and unredesigned. Flash exposures and analogue noise may overlay the entire scene without rewriting those pixels' structure.
- Use `npm test` and the FFmpeg smoke test for regression; enforce 158 seconds, 3,792 frames, H.264/AAC and no additional titles at the release step.
- Avoid paid AI services. Zero new software-service fees, subject to GitHub Actions/Vercel free-plan quotas and whatever usage limits apply to existing accounts.
