#!/usr/bin/env python3
"""Generate *synthetic* kid-friendly phonics letter sounds for 卡卡字母隊.

Fallback when real recordings are not ready yet.
Prefer real voice when available — see:
  assets/phonemes/HOW-TO-RECORD.txt
  ./scripts/import-real-phonemes.sh recordings/phonemes

Synthetic path (this script): Microsoft Edge AnaNeural + classroom spellings
  - Short vowels: onset cropped from cue words (apple/egg/igloo/…)
  - Continuants / stops: soft “uh” forms (vuh, nuh, buh, tuh, …)
    — NOT “vvv/nnn” (TTS reads those as letter names).

Requires: pip install edge-tts numpy；ffmpeg；network.
"""
from __future__ import annotations

import asyncio
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "phonemes"
TMP = Path(os.environ.get("KAKA_PHONEME_TMP", "/tmp/kaka-phonemes-ana"))

EDGE_VOICE = "en-US-AnaNeural"
EDGE_RATE = "-18%"
EDGE_PITCH = "+12Hz"

# (mode, text, seconds)
# mode "onset": keep first N seconds after energy onset (vowel cue words)
# mode "full": keep up to N seconds of the classroom sound
SPECS: dict[str, tuple[str, str, float]] = {
    # short vowels from cue-word onsets (not letter names ay/ee/eye…)
    # keep short so kids hear the vowel, not the whole cue word
    "a": ("onset", "apple", 0.28),
    "e": ("onset", "egg", 0.28),
    "i": ("onset", "igloo", 0.28),
    "o": ("onset", "octopus", 0.30),
    "u": ("onset", "up", 0.28),
    # continuants — classroom “uh” (avoid vvv/nnn → letter names)
    "f": ("full", "fuh", 0.72),
    "l": ("full", "luh", 0.72),
    "m": ("full", "muh", 0.72),
    "n": ("full", "nuh", 0.72),
    "r": ("full", "ruh", 0.72),
    "s": ("full", "sss", 0.95),
    "v": ("full", "vuh", 0.72),
    "z": ("full", "zuh", 0.72),
    # stops / others — soft uh
    "b": ("full", "buh", 0.68),
    "c": ("full", "kuh", 0.68),
    "d": ("full", "duh", 0.68),
    "g": ("full", "guh", 0.68),
    "h": ("full", "huh", 0.68),
    "j": ("full", "juh", 0.72),
    "k": ("full", "kuh", 0.68),
    "p": ("full", "puh", 0.68),
    "q": ("full", "kwuh", 0.72),
    "t": ("full", "tuh", 0.68),
    "w": ("full", "wuh", 0.68),
    "x": ("full", "ks", 0.80),
    "y": ("full", "yuh", 0.68),
}


def ensure_deps() -> None:
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print("Installing edge-tts …", file=sys.stderr)
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "edge-tts", "numpy"])


def write_wav(path: Path, sr: int, audio: np.ndarray) -> None:
    pcm = (np.clip(audio, -1, 1) * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def read_wav(path: Path):
    with wave.open(str(path), "rb") as wf:
        sr = wf.getframerate()
        data = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    return sr, data


def to_mp3(wav: Path, mp3: Path) -> None:
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(wav),
            "-af",
            "treble=g=2.5:f=3200,volume=1.25,alimiter=limit=0.94",
            "-ar",
            "22050",
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "2",
            str(mp3),
        ]
    )


def onset_idx(audio: np.ndarray, sr: int, thresh: float = 0.028) -> int:
    win = max(1, int(0.008 * sr))
    for i in range(0, len(audio) - win, win):
        if np.max(np.abs(audio[i : i + win])) >= thresh:
            return max(0, i - int(0.012 * sr))
    return 0


def trim_trailing_silence(clip: np.ndarray, sr: int, min_keep: float = 0.22) -> np.ndarray:
    win = max(1, int(0.02 * sr))
    end = len(clip)
    silent = 0
    min_i = int(min_keep * sr)
    for i in range(0, len(clip), win):
        if np.max(np.abs(clip[i : i + win])) < 0.02:
            silent += win
            if silent > int(0.14 * sr) and i > min_i:
                end = max(min_i, i - silent + win)
                break
        else:
            silent = 0
    return clip[:end]


def polish(clip: np.ndarray, sr: int) -> np.ndarray:
    pad = int(0.08 * sr)
    clip = np.concatenate([np.zeros(pad, np.float32), clip, np.zeros(pad, np.float32)])
    peak = float(np.max(np.abs(clip)) + 1e-9)
    clip = clip * min(0.9 / peak, 2.6)
    fade = int(0.018 * sr)
    if len(clip) > 2 * fade:
        clip[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
        clip[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    return clip


async def synthesize_one(ch: str, mode: str, text: str, seconds: float) -> None:
    import edge_tts

    raw_mp3 = TMP / f"{ch}_raw.mp3"
    raw_wav = TMP / f"{ch}_raw.wav"
    cut_wav = TMP / f"{ch}.wav"
    out_mp3 = OUT / f"{ch}.mp3"

    await edge_tts.Communicate(text, EDGE_VOICE, rate=EDGE_RATE, pitch=EDGE_PITCH).save(str(raw_mp3))
    subprocess.check_call(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw_mp3), "-ac", "1", "-ar", "22050", str(raw_wav)]
    )
    sr, audio = read_wav(raw_wav)
    o = onset_idx(audio, sr)
    clip = audio[o : o + int(seconds * sr)]
    if mode == "full":
        clip = trim_trailing_silence(clip, sr)
    clip = polish(clip, sr)
    write_wav(cut_wav, sr, clip)
    to_mp3(cut_wav, out_mp3)
    dur = float(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(out_mp3),
            ],
            text=True,
        ).strip()
    )
    print(f"{ch}  {mode:5s}  {text!r:10s}  {out_mp3.stat().st_size:5d}b  {dur:.2f}s")


async def main_async() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    for ch in "abcdefghijklmnopqrstuvwxyz":
        mode, text, seconds = SPECS[ch]
        await synthesize_one(ch, mode, text, seconds)


def main() -> None:
    ensure_deps()
    asyncio.run(main_async())
    print(f"Done → {OUT}")


if __name__ == "__main__":
    main()
