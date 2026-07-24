#!/usr/bin/env python3
"""Generate kid-friendly phonics letter sounds for 卡卡字母隊.

Hybrid approach (much less robotic than espeak-ng):
  - Short vowels a e i o u: Piper neural TTS with direct IPA (/æ ɛ ɪ ɑ ʌ/)
  - Consonants: Microsoft Edge neural child-like voice (Ana) with classroom
    forms kids can mimic (sss, mmm, buh, tuh, …)

Requires network on first run (downloads Piper voice; Edge TTS API).
"""
from __future__ import annotations

import asyncio
import os
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "phonemes"
VOICE_DIR = Path(os.environ.get("KAKA_PIPER_VOICES", "/tmp/piper-voices"))
MODEL = VOICE_DIR / "en_US-amy-medium.onnx"
MODEL_JSON = VOICE_DIR / "en_US-amy-medium.onnx.json"
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium"

EDGE_VOICE = "en-US-AnaNeural"
EDGE_RATE = "-20%"
EDGE_PITCH = "+10Hz"

VOWELS = {
    "a": ["æ"],
    "e": ["ɛ"],
    "i": ["ɪ"],
    "o": ["ɑ"],
    "u": ["ʌ"],
}

# Classroom-style consonants — easy for ~4y to hear and copy
CONSONANTS = {
    "f": ("fff", 1.0),
    "l": ("lll", 1.0),
    "m": ("mmm", 1.0),
    "n": ("nnn", 1.0),
    "r": ("rrr", 0.95),
    "s": ("sss", 1.0),
    "v": ("vvv", 1.0),
    "z": ("zzz", 1.0),
    "b": ("buh", 0.65),
    "c": ("kuh", 0.65),
    "d": ("duh", 0.65),
    "g": ("guh", 0.65),
    "h": ("huh", 0.65),
    "j": ("juh", 0.70),
    "k": ("kuh", 0.65),
    "p": ("puh", 0.65),
    "q": ("kwuh", 0.70),
    "t": ("tuh", 0.65),
    "w": ("wuh", 0.65),
    "x": ("ks", 0.75),
    "y": ("yuh", 0.65),
}


def ensure_deps():
    try:
        import edge_tts  # noqa: F401
        from piper import PiperVoice  # noqa: F401
    except ImportError:
        print("Installing edge-tts and piper-tts …", file=sys.stderr)
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "edge-tts", "piper-tts"])


def download_voice():
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    if MODEL.exists() and MODEL_JSON.exists():
        return
    print("Downloading Piper voice en_US-amy-medium …", file=sys.stderr)
    urllib.request.urlretrieve(f"{HF}/en_US-amy-medium.onnx", MODEL)
    urllib.request.urlretrieve(f"{HF}/en_US-amy-medium.onnx.json", MODEL_JSON)


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
            "treble=g=2:f=3000,volume=1.3,alimiter=limit=0.94",
            "-ar",
            "22050",
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "2",
            str(mp3),
        ]
    )


def synth_vowel(voice, phones, length=1.9) -> np.ndarray:
    from piper import SynthesisConfig

    sr = voice.config.sample_rate
    ids = voice.phonemes_to_ids(phones)
    cfg = SynthesisConfig(
        length_scale=length,
        noise_scale=0.45,
        noise_w_scale=0.55,
        normalize_audio=True,
        volume=1.0,
    )
    audio = voice.phoneme_ids_to_audio(ids, cfg)
    if isinstance(audio, tuple):
        audio = audio[0]
    audio = np.asarray(audio, dtype=np.float32)
    peak = float(np.max(np.abs(audio)) + 1e-9)
    audio = audio * min(0.9 / peak, 3.0)
    fade = int(0.02 * sr)
    if len(audio) > 2 * fade:
        audio[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
        audio[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    pad = int(0.1 * sr)
    return np.concatenate([np.zeros(pad, np.float32), np.clip(audio, -1, 1), np.zeros(pad, np.float32)])


def onset_idx(audio: np.ndarray, sr: int, thresh: float = 0.03) -> int:
    win = max(1, int(0.008 * sr))
    for i in range(0, len(audio) - win, win):
        if np.max(np.abs(audio[i : i + win])) >= thresh:
            return max(0, i - int(0.012 * sr))
    return 0


def trim_clip(audio: np.ndarray, sr: int, max_dur: float) -> np.ndarray:
    clip = audio[: int(max_dur * sr)]
    win = max(1, int(0.02 * sr))
    end = len(clip)
    silent = 0
    for i in range(0, len(clip), win):
        if np.max(np.abs(clip[i : i + win])) < 0.02:
            silent += win
            if silent > int(0.15 * sr) and i > int(0.22 * sr):
                end = max(int(0.22 * sr), i - silent + win)
                break
        else:
            silent = 0
    clip = clip[:end]
    pad = int(0.08 * sr)
    clip = np.concatenate([np.zeros(pad, np.float32), clip, np.zeros(pad, np.float32)])
    peak = float(np.max(np.abs(clip)) + 1e-9)
    clip *= min(0.9 / peak, 2.5)
    fade = int(0.018 * sr)
    if len(clip) > 2 * fade:
        clip[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
        clip[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    return clip


async def gen_consonants(tmp: Path) -> None:
    import edge_tts

    for ch, (text, dur) in CONSONANTS.items():
        raw = tmp / f"{ch}_raw.mp3"
        await edge_tts.Communicate(text, EDGE_VOICE, rate=EDGE_RATE, pitch=EDGE_PITCH).save(str(raw))
        wav_raw = tmp / f"{ch}_raw.wav"
        subprocess.check_call(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-ac", "1", "-ar", "22050", str(wav_raw)]
        )
        sr, audio = read_wav(wav_raw)
        o = onset_idx(audio, sr)
        clip = trim_clip(audio[o:], sr, dur)
        cut = tmp / f"{ch}.wav"
        write_wav(cut, sr, clip)
        to_mp3(cut, OUT / f"{ch}.mp3")
        print(f"cons {ch} {text}")


def main() -> None:
    ensure_deps()
    download_voice()
    from piper import PiperVoice

    OUT.mkdir(parents=True, exist_ok=True)
    tmp = Path("/tmp/kaka-phonemes-final")
    tmp.mkdir(parents=True, exist_ok=True)

    voice = PiperVoice.load(str(MODEL))
    for ch, phones in VOWELS.items():
        wav = tmp / f"{ch}.wav"
        write_wav(wav, voice.config.sample_rate, synth_vowel(voice, phones))
        to_mp3(wav, OUT / f"{ch}.mp3")
        print(f"vowel {ch}")

    asyncio.run(gen_consonants(tmp))
    print(f"Done → {OUT}")


if __name__ == "__main__":
    main()
