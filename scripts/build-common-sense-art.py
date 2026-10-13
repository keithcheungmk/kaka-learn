#!/usr/bin/env python3
"""產生卡卡常識樂園自製 SVG（示意地圖、過程卡、學習牆圖示）同面試四格 WebP。"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "common-sense"
ICONS = OUT / "icons"
PROCESS = OUT / "process"
COMICS = OUT / "comics"
SRC = Path("/opt/cursor/artifacts/assets")


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.strip() + "\n", encoding="utf-8")


def card(bg: str, inner: str, vb: str = "0 0 256 256") -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="256" height="256" role="img">
  <rect width="256" height="256" rx="40" fill="{bg}"/>
  {inner}
</svg>
'''


def icon(name: str, bg: str, inner: str) -> None:
    write(ICONS / f"{name}.svg", card(bg, inner))


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    PROCESS.mkdir(parents=True, exist_ok=True)
    COMICS.mkdir(parents=True, exist_ok=True)

    # —— 學習牆圖示（簡約貼紙風，對齊常識頁淺色卡）——
    icon("red-light", "#ffe4e1",
         '<circle cx="128" cy="78" r="28" fill="#e23b3b"/>'
         '<circle cx="128" cy="128" r="22" fill="#f0d27a" opacity=".35"/>'
         '<circle cx="128" cy="178" r="22" fill="#7dcf8a" opacity=".35"/>'
         '<rect x="116" y="206" width="24" height="28" rx="6" fill="#5a6b82"/>')
    icon("green-light", "#e4f8ea",
         '<circle cx="128" cy="78" r="22" fill="#e23b3b" opacity=".35"/>'
         '<circle cx="128" cy="128" r="22" fill="#f0d27a" opacity=".35"/>'
         '<circle cx="128" cy="178" r="28" fill="#2faf5a"/>'
         '<rect x="116" y="206" width="24" height="28" rx="6" fill="#5a6b82"/>')
    icon("stranger-candy", "#fff3d6",
         '<circle cx="92" cy="118" r="36" fill="#f7d7a8"/>'
         '<rect x="70" y="150" width="44" height="48" rx="14" fill="#7aa7d9"/>'
         '<circle cx="168" cy="150" r="22" fill="#ff8fab"/>'
         '<path d="M146 150h44M168 128v44" stroke="#fff" stroke-width="6"/>')
    icon("mall-help", "#e8f1ff",
         '<rect x="48" y="70" width="160" height="110" rx="16" fill="#9bb7e3"/>'
         '<rect x="78" y="100" width="40" height="50" fill="#ffe9a8"/>'
         '<rect x="138" y="100" width="40" height="50" fill="#ffe9a8"/>'
         '<circle cx="128" cy="168" r="18" fill="#f4c27a"/>'
         '<rect x="110" y="186" width="36" height="28" rx="8" fill="#3b6fd8"/>')
    icon("fire-alarm", "#ffe8d2",
         '<path d="M128 48c28 36 48 58 48 88a48 48 0 1 1-96 0c0-30 20-52 48-88z" fill="#ff7a3c"/>'
         '<circle cx="128" cy="70" r="14" fill="#ffd56a"/>')
    icon("lift", "#e9eef8",
         '<rect x="70" y="48" width="116" height="168" rx="12" fill="#c5d3e8"/>'
         '<rect x="86" y="64" width="40" height="136" fill="#f7fbff"/>'
         '<rect x="130" y="64" width="40" height="136" fill="#f7fbff"/>'
         '<rect x="118" y="64" width="20" height="136" fill="#8aa0c0"/>')
    icon("hot-soup", "#ffe9d6",
         '<ellipse cx="128" cy="150" rx="70" ry="28" fill="#d9a066"/>'
         '<path d="M70 148c8-28 28-48 58-48s50 20 58 48" fill="#f3c27a"/>'
         '<path d="M96 86c6 10 4 16 0 22M128 78c6 10 4 16 0 22M160 86c6 10 4 16 0 22" fill="none" stroke="#c45c2a" stroke-width="6" stroke-linecap="round"/>')
    icon("no-run", "#fdeaea",
         '<circle cx="128" cy="128" r="78" fill="none" stroke="#e23b3b" stroke-width="12"/>'
         '<path d="M70 70l116 116" stroke="#e23b3b" stroke-width="12" stroke-linecap="round"/>'
         '<circle cx="108" cy="96" r="12" fill="#3a4a66"/>'
         '<path d="M108 112l18 22 22-8 16 30" fill="none" stroke="#3a4a66" stroke-width="8" stroke-linecap="round"/>')
    icon("seatbelt", "#e8f4ff",
         '<rect x="70" y="70" width="116" height="130" rx="18" fill="#7aa7d9"/>'
         '<path d="M92 92l72 108" stroke="#f5d76e" stroke-width="16" stroke-linecap="round"/>'
         '<rect x="148" y="168" width="28" height="22" rx="4" fill="#5a6b82"/>')
    icon("call-adult", "#eef8ea",
         '<circle cx="96" cy="118" r="32" fill="#f4c27a"/>'
         '<rect x="74" y="150" width="44" height="48" rx="14" fill="#3b6fd8"/>'
         '<circle cx="168" cy="130" r="22" fill="#f7d7a8"/>'
         '<rect x="152" y="152" width="32" height="36" rx="10" fill="#2a8f6f"/>')

    icon("please", "#eaf6ff",
         '<circle cx="128" cy="100" r="40" fill="#f4c27a"/>'
         '<path d="M88 168c12-24 28-34 40-34s28 10 40 34" fill="#7aa7d9"/>'
         '<path d="M108 92c8 10 24 10 32 0" fill="none" stroke="#5a3a22" stroke-width="6" stroke-linecap="round"/>')
    icon("sorry", "#fdeeee",
         '<circle cx="128" cy="100" r="40" fill="#f4c27a"/>'
         '<path d="M108 108c6 8 20 8 28 0" fill="none" stroke="#5a3a22" stroke-width="6"/>'
         '<rect x="88" y="150" width="80" height="48" rx="16" fill="#d97a7a"/>')
    icon("morning", "#fff6d8",
         '<circle cx="128" cy="96" r="36" fill="#ffd056"/>'
         '<path d="M128 40v18M128 134v18M74 96h18M164 96h18M88 56l12 12M168 56l-12 12M88 136l12-12M168 136l-12-12" stroke="#f0b429" stroke-width="8" stroke-linecap="round"/>'
         '<circle cx="96" cy="176" r="18" fill="#f4c27a"/>'
         '<circle cx="160" cy="176" r="18" fill="#f4c27a"/>')
    icon("wash-hands", "#e4f6fb",
         '<path d="M70 150c20-40 40-54 58-54s38 14 58 54" fill="#7ec8e3"/>'
         '<path d="M90 128c10 16 30 16 40 0M126 128c10 16 30 16 40 0" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>'
         '<rect x="88" y="168" width="80" height="28" rx="10" fill="#3b6fd8"/>')
    icon("cover-cough", "#f3e8ff",
         '<circle cx="128" cy="104" r="38" fill="#f4c27a"/>'
         '<path d="M86 150c14 28 70 28 84 0" fill="#9b7ed9"/>'
         '<rect x="148" y="110" width="44" height="28" rx="10" fill="#fff" opacity=".9"/>')
    icon("queue", "#eaf7ee",
         '<circle cx="72" cy="120" r="20" fill="#f4c27a"/>'
         '<circle cx="128" cy="120" r="20" fill="#f4c27a"/>'
         '<circle cx="184" cy="120" r="20" fill="#f4c27a"/>'
         '<rect x="56" y="148" width="32" height="40" rx="10" fill="#2a8f6f"/>'
         '<rect x="112" y="148" width="32" height="40" rx="10" fill="#2a8f6f"/>'
         '<rect x="168" y="148" width="32" height="40" rx="10" fill="#2a8f6f"/>')
    icon("return-toy", "#fff0d6",
         '<rect x="78" y="86" width="100" height="70" rx="14" fill="#f0b429"/>'
         '<rect x="94" y="102" width="68" height="38" rx="8" fill="#fff6d8"/>'
         '<path d="M70 176h116" stroke="#d4782a" stroke-width="10" stroke-linecap="round"/>')
    icon("sneeze", "#eef2ff",
         '<circle cx="118" cy="110" r="36" fill="#f4c27a"/>'
         '<path d="M150 96c18-8 28 6 22 20" fill="none" stroke="#7aa7d9" stroke-width="8"/>'
         '<circle cx="176" cy="88" r="6" fill="#b9c9e3"/>'
         '<circle cx="190" cy="104" r="5" fill="#b9c9e3"/>')
    icon("dry-hands", "#e8f8f0",
         '<rect x="86" y="70" width="84" height="60" rx="12" fill="#c5e8d6"/>'
         '<path d="M86 150h84l-10 40H96z" fill="#fff"/>'
         '<path d="M108 168h40" stroke="#2a8f6f" stroke-width="8" stroke-linecap="round"/>')
    icon("shoes-off", "#f6efe4",
         '<path d="M70 150c20-8 40-10 70-6 28 4 46 18 46 32H70z" fill="#5a6b82"/>'
         '<ellipse cx="96" cy="176" rx="28" ry="12" fill="#c45c2a"/>'
         '<path d="M168 96l24 24" stroke="#e23b3b" stroke-width="10" stroke-linecap="round"/>')

    icon("home-station", "#eaf7ff",
         '<path d="M56 140 L128 78 L200 140 V206 H56Z" fill="#f4c27a"/>'
         '<rect x="108" y="150" width="40" height="56" fill="#3b6fd8"/>'
         '<circle cx="188" cy="72" r="16" fill="#e23b3b"/>')
    icon("school-station", "#e8f4ea",
         '<rect x="60" y="90" width="136" height="100" rx="12" fill="#7dcf8a"/>'
         '<polygon points="60,90 128,50 196,90" fill="#2a8f6f"/>'
         '<rect x="114" y="130" width="28" height="60" fill="#fff6d8"/>')
    icon("dad-work", "#eef1f8",
         '<rect x="70" y="70" width="116" height="130" rx="10" fill="#8aa0c0"/>'
         '<rect x="86" y="88" width="24" height="24" fill="#ffe9a8"/>'
         '<rect x="116" y="88" width="24" height="24" fill="#ffe9a8"/>'
         '<rect x="146" y="88" width="24" height="24" fill="#ffe9a8"/>'
         '<rect x="86" y="124" width="24" height="24" fill="#ffe9a8"/>'
         '<rect x="116" y="124" width="24" height="24" fill="#ffe9a8"/>'
         '<rect x="146" y="124" width="24" height="24" fill="#ffe9a8"/>')
    icon("friend-home", "#fff0f5",
         '<path d="M64 148 L128 90 L192 148 V208 H64Z" fill="#f4a0c8"/>'
         '<circle cx="128" cy="150" r="18" fill="#fff"/>'
         '<circle cx="188" cy="86" r="16" fill="#7ec8e3"/>')
    icon("disney-fun", "#f3e8ff",
         '<circle cx="108" cy="100" r="28" fill="#5a3a8a"/>'
         '<circle cx="148" cy="100" r="28" fill="#5a3a8a"/>'
         '<circle cx="128" cy="128" r="36" fill="#f4c27a"/>'
         '<circle cx="116" cy="120" r="6" fill="#3a4a66"/>'
         '<circle cx="140" cy="120" r="6" fill="#3a4a66"/>')
    icon("famous-tst", "#e8f1ff",
         '<rect x="48" y="150" width="160" height="50" rx="8" fill="#7aa7d9"/>'
         '<path d="M80 150 V90 H176 V150" fill="#c5d3e8"/>'
         '<circle cx="128" cy="70" r="18" fill="#f0b429"/>')
    icon("famous-mk", "#ffe9e0",
         '<rect x="60" y="110" width="40" height="90" fill="#e07a5f"/>'
         '<rect x="108" y="86" width="40" height="114" fill="#f2cc8f"/>'
         '<rect x="156" y="120" width="40" height="80" fill="#81b29a"/>')
    icon("metro", "#e9eef8",
         '<rect x="48" y="88" width="160" height="80" rx="24" fill="#3b6fd8"/>'
         '<circle cx="88" cy="176" r="16" fill="#3a4a66"/>'
         '<circle cx="168" cy="176" r="16" fill="#3a4a66"/>'
         '<rect x="70" y="104" width="36" height="28" rx="6" fill="#d6e8ff"/>'
         '<rect x="150" y="104" width="36" height="28" rx="6" fill="#d6e8ff"/>')
    icon("no-run-train", "#fdeaea",
         '<rect x="50" y="96" width="156" height="64" rx="20" fill="#8aa0c0"/>'
         '<circle cx="128" cy="128" r="40" fill="none" stroke="#e23b3b" stroke-width="10"/>'
         '<path d="M100 100l56 56" stroke="#e23b3b" stroke-width="10" stroke-linecap="round"/>')
    icon("priority-seat", "#eaf7ee",
         '<rect x="70" y="120" width="116" height="50" rx="12" fill="#2a8f6f"/>'
         '<circle cx="100" cy="96" r="18" fill="#f4c27a"/>'
         '<path d="M168 88c10 0 18 14 8 28" fill="none" stroke="#5a6b82" stroke-width="8"/>')
    icon("yellow-line", "#fff6d8",
         '<rect x="40" y="150" width="176" height="18" rx="8" fill="#f0b429"/>'
         '<circle cx="90" cy="110" r="20" fill="#3a4a66"/>'
         '<rect x="78" y="128" width="24" height="28" fill="#3b6fd8"/>')
    icon("ferry", "#e4f6fb",
         '<path d="M48 140 h160 l-20 40 H68z" fill="#3b6fd8"/>'
         '<rect x="96" y="88" width="64" height="52" fill="#fff"/>'
         '<path d="M40 196c40-16 136-16 176 0" fill="none" stroke="#7ec8e3" stroke-width="10"/>')
    icon("octopus-card", "#fff0d6",
         '<rect x="58" y="86" width="140" height="90" rx="16" fill="#f0b429"/>'
         '<circle cx="96" cy="131" r="22" fill="#fff"/>'
         '<circle cx="88" cy="124" r="4" fill="#3a4a66"/>'
         '<circle cx="104" cy="124" r="4" fill="#3a4a66"/>')

    icon("rain-umbrella", "#e4f1fb",
         '<path d="M48 128a80 80 0 0 1 160 0H48z" fill="#e07a5f"/>'
         '<rect x="120" y="128" width="12" height="70" rx="4" fill="#5a6b82"/>')
    icon("typhoon", "#e9eef8",
         '<circle cx="128" cy="128" r="36" fill="#c5d3e8"/>'
         '<path d="M128 128c40-40 70-20 70 8M128 128c-40 40-70 20-70-8" fill="none" stroke="#5a6b82" stroke-width="12" stroke-linecap="round"/>')
    icon("cold-coat", "#eef2ff",
         '<path d="M80 86 h96 l12 110 H68z" fill="#3b6fd8"/>'
         '<rect x="118" y="86" width="20" height="110" fill="#9bb7e3"/>'
         '<circle cx="128" cy="64" r="22" fill="#f4c27a"/>')
    icon("hot-day", "#fff3d6",
         '<circle cx="128" cy="100" r="40" fill="#ffd056"/>'
         '<rect x="96" y="150" width="64" height="52" rx="12" fill="#f4c27a"/>'
         '<path d="M80 86l-16-16M176 86l16-16M128 40V24" stroke="#f0b429" stroke-width="8"/>')
    icon("spring", "#eaf7ee",
         '<circle cx="128" cy="150" r="18" fill="#f4a0c8"/>'
         '<path d="M128 150L128 206" stroke="#2a8f6f" stroke-width="8"/>'
         '<circle cx="104" cy="128" r="14" fill="#ff8fab"/>'
         '<circle cx="152" cy="128" r="14" fill="#ffd056"/>')
    icon("summer", "#fff6d8",
         '<circle cx="128" cy="110" r="44" fill="#ffd056"/>'
         '<rect x="70" y="170" width="116" height="28" rx="14" fill="#7ec8e3"/>')
    icon("autumn", "#ffe9d6",
         '<path d="M128 70c40 20 52 70 8 110-40-20-64-70-8-110z" fill="#e07a5f"/>'
         '<rect x="120" y="170" width="16" height="36" fill="#8a5a32"/>')
    icon("winter", "#e8f4ff",
         '<path d="M128 48v160M70 90l116 76M186 90L70 166" stroke="#7aa7d9" stroke-width="10" stroke-linecap="round"/>'
         '<circle cx="128" cy="128" r="16" fill="#fff"/>')
    icon("sun-hat", "#fff6d8",
         '<ellipse cx="128" cy="160" rx="78" ry="18" fill="#f0b429"/>'
         '<path d="M86 150a42 42 0 0 1 84 0" fill="#ffe08a"/>')
    icon("wet-floor", "#e4f6fb",
         '<path d="M48 176h160" stroke="#7ec8e3" stroke-width="14" stroke-linecap="round"/>'
         '<path d="M90 96l20 64h36l20-64" fill="none" stroke="#3a4a66" stroke-width="10"/>'
         '<circle cx="128" cy="80" r="16" fill="#3a4a66"/>')
    icon("listen-adult", "#eef8ea",
         '<circle cx="96" cy="120" r="28" fill="#f4c27a"/>'
         '<circle cx="168" cy="108" r="34" fill="#f7d7a8"/>'
         '<rect x="78" y="154" width="36" height="40" rx="10" fill="#2a8f6f"/>'
         '<rect x="146" y="148" width="44" height="48" rx="12" fill="#3b6fd8"/>')

    icon("new-year", "#fdeaea",
         '<rect x="78" y="60" width="100" height="140" rx="12" fill="#e23b3b"/>'
         '<rect x="94" y="86" width="68" height="20" fill="#f0b429"/>'
         '<circle cx="128" cy="150" r="18" fill="#f0b429"/>')
    icon("lantern", "#fff3d6",
         '<rect x="110" y="48" width="36" height="16" fill="#8a5a32"/>'
         '<ellipse cx="128" cy="128" rx="46" ry="60" fill="#e07a5f"/>'
         '<rect x="120" y="188" width="16" height="24" fill="#8a5a32"/>')
    icon("ching-ming", "#eaf7ee",
         '<path d="M128 70c36 28 52 64 0 110-52-46-36-82 0-110z" fill="#2a8f6f"/>'
         '<rect x="70" y="176" width="116" height="24" rx="8" fill="#8a5a32"/>')
    icon("dragon-boat", "#e4f6fb",
         '<path d="M40 140c40 30 136 30 176 0" fill="#e07a5f"/>'
         '<circle cx="64" cy="128" r="14" fill="#f0b429"/>'
         '<rect x="100" y="100" width="12" height="40" fill="#3a4a66"/>'
         '<rect x="140" y="92" width="12" height="48" fill="#3a4a66"/>')
    icon("moon-cake", "#fff0d6",
         '<circle cx="128" cy="128" r="70" fill="#f0b429"/>'
         '<circle cx="128" cy="128" r="36" fill="#fff6d8"/>'
         '<circle cx="128" cy="72" r="16" fill="#ffe08a"/>')
    icon("christmas", "#eaf7ee",
         '<polygon points="128,48 188,168 68,168" fill="#2a8f6f"/>'
         '<rect x="116" y="168" width="24" height="32" fill="#8a5a32"/>'
         '<circle cx="128" cy="70" r="10" fill="#e23b3b"/>')
    icon("birthday", "#fff3d6",
         '<rect x="78" y="120" width="100" height="70" rx="12" fill="#f4a0c8"/>'
         '<rect x="70" y="108" width="116" height="20" rx="8" fill="#ffd056"/>'
         '<rect x="118" y="70" width="20" height="40" fill="#fff"/>'
         '<circle cx="128" cy="64" r="8" fill="#ff7a3c"/>')
    icon("no-stranger-lai-see", "#fdeaea",
         '<rect x="96" y="70" width="64" height="90" rx="8" fill="#e23b3b"/>'
         '<circle cx="128" cy="128" r="54" fill="none" stroke="#8a3030" stroke-width="10"/>'
         '<path d="M90 90l76 76" stroke="#8a3030" stroke-width="10"/>')
    icon("new-year-day", "#e8f1ff",
         '<rect x="70" y="64" width="116" height="128" rx="14" fill="#fff"/>'
         '<rect x="70" y="64" width="116" height="28" fill="#e23b3b"/>'
         '<text x="128" y="150" text-anchor="middle" font-size="42" font-weight="700" fill="#3b6fd8">1</text>')
    icon("national-day", "#fff6d8",
         '<circle cx="128" cy="128" r="70" fill="#e23b3b"/>'
         '<polygon points="128,84 136,108 162,108 140,124 148,148 128,132 108,148 116,124 94,108 120,108" fill="#f0b429"/>')

    icon("paper-bin", "#eaf7ff",
         '<rect x="78" y="86" width="100" height="110" rx="12" fill="#3b6fd8"/>'
         '<rect x="92" y="104" width="72" height="10" fill="#fff"/>'
         '<rect x="92" y="124" width="72" height="10" fill="#fff"/>'
         '<rect x="92" y="144" width="56" height="10" fill="#fff"/>')
    icon("plastic-bin", "#fff3d6",
         '<rect x="78" y="86" width="100" height="110" rx="12" fill="#f0b429"/>'
         '<path d="M108 120c0-16 40-16 40 0v40h-40z" fill="#fff"/>')
    icon("metal-bin", "#eef1f8",
         '<rect x="78" y="86" width="100" height="110" rx="12" fill="#8aa0c0"/>'
         '<ellipse cx="128" cy="130" rx="28" ry="36" fill="#dfe6f2"/>'
         '<ellipse cx="128" cy="118" rx="20" ry="8" fill="#8aa0c0"/>')
    icon("glass-bin", "#eaf7ee",
         '<rect x="78" y="86" width="100" height="110" rx="12" fill="#2a8f6f"/>'
         '<path d="M112 112h32l8 56h-48z" fill="#c5e8d6"/>')
    icon("banana-peel", "#fff6d8",
         '<path d="M80 96c20 40 20 80 8 96M128 90c0 50 0 90 0 110M176 96c-20 40-20 80-8 96" fill="none" stroke="#f0b429" stroke-width="14" stroke-linecap="round"/>')
    icon("reuse-bag", "#e8f4ea",
         '<path d="M86 110h84l-8 86H94z" fill="#7dcf8a"/>'
         '<path d="M104 110a24 24 0 0 1 48 0" fill="none" stroke="#2a8f6f" stroke-width="10"/>')
    icon("lights-off", "#e9eef8",
         '<path d="M96 80h64v70l-20 28H116L96 150z" fill="#c5d3e8"/>'
         '<rect x="116" y="178" width="24" height="22" fill="#5a6b82"/>'
         '<path d="M84 84l88 88" stroke="#e23b3b" stroke-width="10"/>')
    icon("park-flower", "#fff0f5",
         '<circle cx="128" cy="110" r="22" fill="#ffd056"/>'
         '<circle cx="98" cy="110" r="18" fill="#ff8fab"/>'
         '<circle cx="158" cy="110" r="18" fill="#ff8fab"/>'
         '<circle cx="128" cy="82" r="18" fill="#f4a0c8"/>'
         '<rect x="120" y="128" width="16" height="64" fill="#2a8f6f"/>')
    icon("straw", "#e4f6fb",
         '<rect x="118" y="56" width="16" height="140" rx="8" fill="#7ec8e3"/>'
         '<rect x="118" y="48" width="40" height="16" rx="8" fill="#3b6fd8"/>')
    icon("clean-paper", "#eaf7ff",
         '<rect x="78" y="64" width="100" height="128" rx="10" fill="#fff"/>'
         '<path d="M96 96h64M96 120h64M96 144h44" stroke="#8aa0c0" stroke-width="8"/>')

    icon("milk-cow", "#eaf4ea",
         '<ellipse cx="140" cy="140" rx="58" ry="40" fill="#fff"/>'
         '<circle cx="86" cy="120" r="22" fill="#fff"/>'
         '<circle cx="78" cy="114" r="4" fill="#3a4a66"/>'
         '<ellipse cx="150" cy="132" rx="10" ry="8" fill="#3a4a66"/>'
         '<rect x="120" y="176" width="12" height="28" fill="#8a5a32"/>'
         '<rect x="160" y="176" width="12" height="28" fill="#8a5a32"/>')
    icon("bread-wheat", "#fff6d8",
         '<path d="M128 56c18 18 18 40 0 58-18-18-18-40 0-58z" fill="#f0b429"/>'
         '<path d="M128 90c18 18 18 40 0 58-18-18-18-40 0-58z" fill="#e07a5f"/>'
         '<rect x="122" y="148" width="12" height="52" fill="#8a5a32"/>')
    icon("rice", "#eaf7ee",
         '<ellipse cx="128" cy="150" rx="70" ry="28" fill="#d9a066"/>'
         '<path d="M70 140c20-40 96-40 116 0" fill="#f7f1d8"/>')
    icon("water-glass", "#e4f6fb",
         '<path d="M86 70h84l-12 116H98z" fill="#7ec8e3"/>'
         '<path d="M94 110h68" stroke="#fff" stroke-width="8" opacity=".6"/>')
    icon("fruit", "#fff0f5",
         '<circle cx="108" cy="130" r="32" fill="#e23b3b"/>'
         '<circle cx="150" cy="136" r="28" fill="#f0b429"/>'
         '<path d="M108 98c8-16 20-16 24-4" fill="#2a8f6f"/>')
    icon("candy", "#fdeaea",
         '<rect x="96" y="108" width="64" height="40" rx="20" fill="#ff8fab"/>'
         '<path d="M70 100l26 28-26 28M186 100l-26 28 26 28" fill="#f0b429"/>')
    icon("breakfast", "#fff6d8",
         '<circle cx="128" cy="128" r="70" fill="#fff"/>'
         '<ellipse cx="128" cy="128" rx="28" ry="20" fill="#ffd056"/>'
         '<circle cx="128" cy="128" r="10" fill="#fff"/>')
    icon("brush-teeth", "#eaf7ff",
         '<rect x="70" y="150" width="116" height="36" rx="12" fill="#fff"/>'
         '<rect x="118" y="64" width="20" height="90" rx="8" fill="#7aa7d9"/>'
         '<rect x="110" y="48" width="36" height="24" rx="8" fill="#3b6fd8"/>')
    icon("sit-eat", "#fff3d6",
         '<rect x="70" y="150" width="116" height="18" rx="6" fill="#8a5a32"/>'
         '<circle cx="128" cy="100" r="28" fill="#f4c27a"/>'
         '<rect x="108" y="128" width="40" height="28" fill="#3b6fd8"/>')
    icon("allergy", "#fdeeee",
         '<circle cx="96" cy="120" r="28" fill="#f4c27a"/>'
         '<circle cx="168" cy="108" r="32" fill="#f7d7a8"/>'
         '<path d="M86 96l20 8" stroke="#e23b3b" stroke-width="6"/>'
         '<rect x="78" y="152" width="36" height="36" rx="10" fill="#d97a7a"/>')

    # 食物過程卡
    milk = [
        ("milk-1", "#eaf4ea",
         '<ellipse cx="150" cy="150" rx="54" ry="36" fill="#fff"/><circle cx="92" cy="128" r="24" fill="#fff"/>'
         '<ellipse cx="158" cy="140" rx="10" ry="8" fill="#3a4a66"/><rect x="130" y="184" width="12" height="28" fill="#8a5a32"/>'),
        ("milk-2", "#fff6d8",
         '<ellipse cx="128" cy="150" rx="60" ry="24" fill="#f7f1d8"/><path d="M118 70c8 36 8 60 0 80" stroke="#fff" stroke-width="14"/>'
         '<path d="M118 70c8 36 8 60 0 80" fill="none" stroke="#7ec8e3" stroke-width="6"/>'),
        ("milk-3", "#e8f1ff",
         '<rect x="92" y="70" width="72" height="116" rx="12" fill="#fff"/><rect x="92" y="70" width="72" height="28" fill="#3b6fd8"/>'
         '<rect x="104" y="112" width="48" height="48" rx="8" fill="#7ec8e3"/>'),
        ("milk-4", "#fff3d6",
         '<path d="M96 86h64l-10 110H106z" fill="#7ec8e3"/><circle cx="168" cy="96" r="22" fill="#f4c27a"/>'
         '<path d="M158 88c8 6 16 6 22 0" fill="none" stroke="#5a3a22" stroke-width="4"/>'),
    ]
    bread = [
        ("bread-1", "#eaf7ee",
         '<path d="M128 48c20 20 20 44 0 64-20-20-20-44 0-64z" fill="#d4e157"/>'
         '<path d="M128 92c20 20 20 44 0 64-20-20-20-44 0-64z" fill="#aed581"/><rect x="122" y="156" width="12" height="52" fill="#8a5a32"/>'),
        ("bread-2", "#fff0d6",
         '<ellipse cx="128" cy="128" rx="70" ry="36" fill="#f4c27a"/><path d="M86 128c14-18 28-18 42 0s28 18 42 0" fill="none" stroke="#e07a5f" stroke-width="8"/>'),
        ("bread-3", "#ffe9d6",
         '<rect x="70" y="96" width="116" height="80" rx="12" fill="#8aa0c0"/><rect x="86" y="112" width="84" height="48" rx="8" fill="#ffd056"/>'
         '<path d="M96 70h16v26H96z" fill="#e07a5f"/>'),
        ("bread-4", "#fff6d8",
         '<ellipse cx="128" cy="150" rx="70" ry="28" fill="#e07a5f"/><ellipse cx="128" cy="128" rx="62" ry="34" fill="#f4c27a"/>'
         '<path d="M90 120c16-10 60-10 76 0" fill="none" stroke="#fff6d8" stroke-width="6"/>'),
    ]
    for name, bg, inner in milk + bread:
        write(PROCESS / f"{name}.svg", card(bg, inner))

    write(OUT / "mtr-family-map.svg", mtr_map())
    write(OUT / "CREDITS.md", """# 卡卡常識樂園圖像來源

- `mtr-family-map.svg`：自製兒童向港鐵**示意**圖，只標家庭錨點同幾個出名站，**非官方路線圖**，唔複製港鐵版權地圖。
- `icons/*.svg`、`process/*.svg`：專為本學習網站手繪嘅簡約貼紙風 SVG。
- `comics/*.webp`：用卡卡／禧禧／傑叔叔既有角色設定圖生成嘅原創面試四格，無文字無商標。
""")
    convert_comics()
    print("common-sense art ready")


def mtr_map() -> str:
    # Kid schematic: numbered pins + coloured lines. Chinese labels also in HTML legend.
    pins = [
        (90, 250, "1", "#e07a5f", "荃灣西"),
        (250, 250, "2", "#2a8f6f", "深水埗"),
        (410, 250, "3", "#f0b429", "旺角"),
        (410, 390, "4", "#3b6fd8", "尖沙咀"),
        (560, 180, "5", "#8aa0c0", "沙田"),
        (710, 110, "6", "#f4a0c8", "馬鞍山"),
        (170, 120, "7", "#9b7ed9", "迪士尼"),
    ]
    pin_svg = []
    for x, y, n, color, _name in pins:
        pin_svg.append(
            f'<circle cx="{x}" cy="{y}" r="28" fill="{color}" stroke="#18345f" stroke-width="4"/>'
            f'<text x="{x}" y="{y + 8}" text-anchor="middle" font-size="22" font-weight="700" fill="#fff">{n}</text>'
        )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" role="img" aria-label="卡卡一家港鐵示意地圖">
  <rect width="800" height="480" rx="28" fill="#f4fbff"/>
  <rect x="16" y="16" width="768" height="448" rx="22" fill="#eaf7ff" stroke="#d5e4f4" stroke-width="3"/>
  <text x="400" y="52" text-anchor="middle" font-size="22" font-weight="700" fill="#18345f" font-family="Noto Sans HK, PingFang HK, sans-serif">卡卡嘅港鐵地圖（示意・非官方）</text>
  <path d="M90 250 H410" stroke="#c45c2a" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M410 250 V390" stroke="#c45c2a" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M410 250 C 480 250 500 180 560 180" stroke="#7a4a12" stroke-width="12" fill="none"/>
  <path d="M560 180 H710" stroke="#7a4a12" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M90 250 C 90 180 130 120 170 120" stroke="#9b7ed9" stroke-width="10" fill="none"/>
  {''.join(pin_svg)}
  <text x="400" y="456" text-anchor="middle" font-size="13" fill="#527093" font-family="Noto Sans HK, PingFang HK, sans-serif">坐地鐵好方便　可以坐地鐵去迪士尼　示意用・非官方</text>
</svg>
'''


def convert_comics() -> None:
    try:
        from PIL import Image
    except ImportError:
        print("no Pillow; skip comic convert")
        return
    mapping = {
        "rain-p01.jpg": "rain-p01.webp",
        "rain-p02.jpg": "rain-p02.webp",
        "rain-p03.jpg": "rain-p03.webp",
        "rain-p04.jpg": "rain-p04.webp",
        "mtr-p01.jpg": "mtr-p01.webp",
        "mtr-p02.jpg": "mtr-p02.webp",
        "mtr-p03.jpg": "mtr-p03.webp",
        "mtr-p04.jpg": "mtr-p04.webp",
        "park-p01.jpg": "park-p01.webp",
        "park-p02.jpg": "park-p02.webp",
        "park-p03.jpg": "park-p03.webp",
        "park-p04.jpg": "park-p04.webp",
    }
    for src_name, dest_name in mapping.items():
        src = SRC / src_name
        if not src.exists():
            print("missing", src)
            continue
        im = Image.open(src).convert("RGB")
        im.thumbnail((900, 600))
        dest = COMICS / dest_name
        im.save(dest, "WEBP", quality=78, method=6)
        size = dest.stat().st_size
        if size > 400_000:
            im.save(dest, "WEBP", quality=62, method=6)
        print(dest.name, dest.stat().st_size)


if __name__ == "__main__":
    main()
