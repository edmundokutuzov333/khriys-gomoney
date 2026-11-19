#!/usr/bin/env python3
"""Compute a reproducible low-rate energy/onset map using only FFmpeg and stdlib."""
from __future__ import annotations
import argparse
import array
import json
import math
import subprocess
from pathlib import Path

SAMPLE_RATE = 8000
HOP = 400


def decode_mono(audio: Path) -> list[float]:
    proc = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(audio), '-ac', '1',
                           '-ar', str(SAMPLE_RATE), '-f', 's16le', '-acodec', 'pcm_s16le', '-'],
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    pcm = array.array('h')
    pcm.frombytes(proc.stdout)
    if not pcm:
        raise ValueError('The MP3 contains no decodable audio samples')
    energies = []
    for i in range(0, len(pcm), HOP):
        chunk = pcm[i:i + HOP]
        if chunk:
            e = math.sqrt(sum(float(v) * v for v in chunk) / len(chunk)) / 32768
            energies.append(e)
    return energies


def analyze(audio: Path, target_duration: float = 158.0) -> dict:
    energy = decode_mono(audio)
    peak = max(energy) or 1
    scaled = [round(min(1, x / peak), 4) for x in energy]
    diffs = [max(0, scaled[i] - sum(scaled[max(0, i - 4):i]) / max(1, min(i, 4)))
             for i in range(len(scaled))]
    threshold = sorted(diffs)[int(len(diffs) * .82)] if diffs else 0
    candidates = []
    for i in range(2, len(diffs) - 2):
        t = i * HOP / SAMPLE_RATE
        if t > target_duration:
            break
        if diffs[i] >= max(.018, threshold * 1.12) and diffs[i] >= max(diffs[i-2:i+3]):
            candidates.append((t, diffs[i]))
    beats = []
    for t, strength in candidates:
        if not beats or t - beats[-1][0] >= .24:
            beats.append((t, strength))
        elif strength > beats[-1][1]:
            beats[-1] = (t, strength)
    return {
        'version': 1, 'targetDuration': target_duration,
        'sourceDuration': round(len(energy) * HOP / SAMPLE_RATE, 2),
        'sampleInterval': HOP / SAMPLE_RATE,
        'envelope': scaled[::2], 'beats': [round(t, 3) for t, _ in beats],
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument('audio', type=Path)
    p.add_argument('--output', type=Path, default=Path('public/audio-map.json'))
    p.add_argument('--duration', type=float, default=158)
    args = p.parse_args()
    result = analyze(args.audio, args.duration)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, separators=(',', ':')) + '\n')
    print(f"Analyzed {result['sourceDuration']}s; {len(result['beats'])} transients; target {result['targetDuration']}s")


if __name__ == '__main__':
    main()
