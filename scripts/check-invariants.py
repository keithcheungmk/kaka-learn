#!/usr/bin/env python3
"""kaka-learn 硬性約束檢查器（AGENTS.md 嘅機器版）

用法：
    python3 scripts/check-invariants.py

Exit code 0 = 全部通過；1 = 有 blocker。
CI（.github/workflows/ci.yml）每次 push / PR 都會跑。
Agent 改完嘢，merge 之前一定要跑到綠先算數。

新增規則：喺下面加一個 check_xxx() 函數，再加落 CHECKS list。
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)

problems: list[str] = []
notes: list[str] = []


def fail(rule: str, msg: str) -> None:
    problems.append(f"[{rule}] {msg}")


def read(p: str) -> str:
    return Path(p).read_text(encoding="utf-8")


def strip_js_comments(src: str) -> str:
    """粗略去走 // 同 /* */ 註解，等註解入面提到嘅字唔會誤報。"""
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"(?m)^\s*//.*$", "", src)
    return src


JS_FILES = sorted(str(p) for p in Path("js").glob("*.js"))


# ---------------------------------------------------------------- 技術底線

def check_js_syntax() -> None:
    """F. 技術底線：新／改嘅 JS 要 parse 到。"""
    node = shutil.which("node")
    if not node:
        notes.append("冇 node，跳過 JS syntax 檢查（CI 一定會跑）")
        return
    for f in JS_FILES:
        r = subprocess.run([node, "--check", f], capture_output=True, text=True)
        if r.returncode != 0:
            fail("js-syntax", f"{f} parse 唔到：{r.stderr.strip().splitlines()[0] if r.stderr.strip() else '?'}")


def check_no_build_step() -> None:
    """保持純靜態、無 build step、無外部 runtime 依賴（Google Fonts 除外）。"""
    for bad in ("package.json", "vite.config.js", "webpack.config.js"):
        if Path(bad).exists():
            fail("no-build", f"出現咗 {bad}；AGENTS.md 要求保持無 build step 嘅純靜態站")
    allowed = {"https://fonts.googleapis.com", "https://fonts.gstatic.com"}
    sources = ["index.html"] + JS_FILES + sorted(str(p) for p in Path("css").glob("*.css"))
    hosts = set()
    for f in sources:
        hosts |= set(re.findall(r"https?://[A-Za-z0-9.-]+", read(f)))
    extra = hosts - allowed
    if extra:
        fail("no-build", f"引入咗新嘅外部 host：{', '.join(sorted(extra))}（要保持離線友好）")


def check_cache_bust_tags() -> None:
    """部署時會用 commit SHA 蓋過 ?v=；所以每個本機 css/js tag 都要有 ?v= 佔位。"""
    html = read("index.html")
    for m in re.finditer(r'(?:src|href)="\./((?:js|css)/[^"]+)"', html):
        ref = m.group(1)
        if "?v=" not in ref:
            fail("cache-bust", f"index.html 嘅 ./{ref} 冇 ?v= 佔位，部署時 cache 會食舊版")


# ---------------------------------------------------------------- 字詞資料

CORE_ANIMALS = [
    "鹿", "梅花鹿", "馴鹿", "駝鹿", "馬鹿", "狗", "貓", "魚", "鳥", "兔子", "羊", "牛",
    "馬", "豬", "熊", "獅子", "老虎", "大象", "猴子", "雞", "鴨", "青蛙", "昆蟲", "龍",
]


def check_core_animals() -> None:
    """AGENTS.md：動物核心 24 個繁體表面形必須保留。"""
    src = read("js/words.js")
    terms = set(re.findall(r"term:\s*'([^']+)'", src))
    missing = [w for w in CORE_ANIMALS if w not in terms]
    if missing:
        fail("core-animals", f"words.js 唔見咗核心動物詞：{'、'.join(missing)}")


def check_deer_rules() -> None:
    """鹿類規則：5 個鹿種、駝鹿用 🫎、馬鹿用 🦌 ＋ badge「馬」。"""
    src = read("js/words.js")
    m = re.search(r"DEER_IDS\s*=\s*\[([^\]]*)\]", src)
    if not m:
        fail("deer", "words.js 揾唔到 DEER_IDS")
    else:
        ids = re.findall(r"'([^']+)'", m.group(1))
        if len(ids) < 5:
            fail("deer", f"DEER_IDS 得 {len(ids)} 個（應該至少 5 個鹿種）")
    if not re.search(r"term:\s*'駝鹿'[^}]*emoji:\s*'🫎'", src):
        fail("deer", "駝鹿要用 🫎")
    if not re.search(r"term:\s*'馬鹿'[^}]*badge:\s*'馬'", src):
        fail("deer", "馬鹿要有 badge「馬」先分得開")


def check_word_ids_unique() -> None:
    ids = re.findall(r"\{\s*id:\s*'([^']+)'", read("js/words.js"))
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        fail("word-ids", f"words.js 有重複 id：{'、'.join(dup)}")


# ---------------------------------------------------------------- 玩法規則

def check_build_ghost() -> None:
    """砌一砌淡色格係配對支架，唔可以刪、唔可以變空白格。"""
    css = read("css/styles.css")
    if not re.search(r"(?m)^\.build-ghost\s*\{", css):
        fail("build-ghost", "css/styles.css 唔見 .build-ghost 規則本身（淡色格支架俾人刪咗？）")
    else:
        block = re.search(r"(?ms)^\.build-ghost\s*\{(.*?)\}", css).group(1)
        if re.search(r"display\s*:\s*none", block) or re.search(r"opacity\s*:\s*0\s*[;}]", block):
            fail("build-ghost", ".build-ghost 被整到隱形；淡格係配對支架，唔係洩題")
    for f in ("js/app.js", "js/phonics-app.js"):
        src = read(f)
        if not re.search(r'class="build-ghost[^"]*"[^>]*>\$\{', src):
            fail("build-ghost", f"{f} 冇再喺淡格 render 目標字（支架變咗空白考試格？）")


def check_star_rules() -> None:
    """每日星星硬上限 10；可兌換幣 = floor(totalStars / 10)。"""
    src = strip_js_comments(read("js/storage.js"))
    if not re.search(r"starsToday\s*>=\s*10", src):
        fail("stars", "storage.js 揾唔到每日 10 粒星星上限")
    if not re.search(r"Math\.floor\(\s*\(?\s*totalStars", src):
        fail("stars", "storage.js 揾唔到 floor(totalStars / 10) 兌換邏輯")


def check_parent_pin() -> None:
    if not re.search(r"pin:\s*'1234'", read("js/storage.js")):
        fail("parent-pin", "家長 PIN 預設值唔再係 '1234'")


def check_no_zoom() -> None:
    html = read("index.html")
    if "user-scalable=no" not in html:
        fail("no-zoom", "viewport 少咗 user-scalable=no（iPad 會放大到成個 app 走位）")
    if not Path("js/no-zoom.js").exists():
        fail("no-zoom", "js/no-zoom.js 唔見咗")


def check_three_entries() -> None:
    """A. 冇破壞現有嘢：主頁三個入口都要喺度。"""
    html = read("index.html")
    for btn, name in [
        ("btn-start-topics", "小鹿認字探險"),
        ("btn-start-phonics", "卡卡字母隊"),
        ("btn-start-math", "小鹿數理探險"),
    ]:
        if btn not in html:
            fail("entries", f"index.html 唔見 #{btn}（{name} 入口）")


# ---------------------------------------------------------------- 故障隔離

def check_storage_isolation() -> None:
    """認字用 kaka-learn-v1、數理用 kaka-math-v1，唔好互寫。"""
    rules = [
        ("kaka-math-v1", ["js/app.js", "js/phonics-app.js", "js/storage.js"]),
        ("kaka-learn-v1", ["js/math-app.js", "js/math-skills.js", "js/math-storage.js"]),
    ]
    for key, files in rules:
        for f in files:
            if key in strip_js_comments(read(f)):
                fail("storage-isolation", f"{f} 用咗 {key}；三套遊戲 state 唔可以互寫")


def check_module_isolation() -> None:
    """數理唔可以依賴認字／字母隊嘅題目或畫面 API。"""
    src = strip_js_comments("".join(read(f) for f in ["js/math-app.js", "js/math-skills.js", "js/math-storage.js"]))
    for g in ["KakaWords", "KakaLearn", "KakaPhonicsWords", "KakaPhonics"]:
        if re.search(rf"\b{g}\b", src):
            fail("module-isolation", f"math-* 用咗 {g}；AGENTS.md 禁止數理依賴認字／字母隊")


def check_math_boot_guard() -> None:
    """math-app.js 必須 try/catch 啟動，掛掉時另外兩個 app 仍可用。"""
    head = read("js/math-app.js")[:600]
    if "try" not in head or "catch" not in head:
        fail("math-boot", "math-app.js 開頭冇 try/catch 保護，掛咗會拖冧成頁")


# ---------------------------------------------------------------- 資產

ASSET_RE = re.compile(r"['\"(]\.?/?(assets/[A-Za-z0-9._/%-]+\.(?:jpg|jpeg|png|svg|webp|mp3|json))")


def check_asset_refs() -> None:
    """B. 圖片／音檔要真係載入到（冇 404）。"""
    sources = ["index.html"] + JS_FILES + sorted(str(p) for p in Path("css").glob("*.css"))
    missing = set()
    for f in sources:
        for ref in ASSET_RE.findall(read(f)):
            if not Path(ref).exists():
                missing.add(f"{ref}（喺 {f}）")
    for m in sorted(missing):
        fail("assets", f"引用咗但揾唔到：{m}")


def check_asset_manifests() -> None:
    """每個相片主題要有 manifest + CREDITS（第三方圖要有授權說明）。"""
    for man in sorted(Path("assets").glob("*/manifest.json")):
        d = man.parent
        if not (d / "CREDITS.md").exists():
            fail("credits", f"{d}/ 有 manifest 但冇 CREDITS.md")
        try:
            data = json.loads(man.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            fail("credits", f"{man} 唔係合法 JSON：{e}")
            continue
        for local in re.findall(r'"(?:file|local|path)":\s*"([^"]+)"', json.dumps(data, ensure_ascii=False)):
            p = Path(local) if local.startswith("assets/") else d / local
            if not p.exists():
                fail("credits", f"{man} 指住唔存在嘅檔案 {p}")


def check_asset_weight() -> None:
    """效能：單張圖唔好超過 400KB，總資產唔好超過 12MB。"""
    total = 0
    for p in Path("assets").rglob("*"):
        if p.is_file():
            size = p.stat().st_size
            total += size
            if size > 400_000:
                fail("asset-weight", f"{p} 有 {size // 1024}KB（上限 400KB，請先縮圖／轉 WebP）")
    if total > 12_000_000:
        fail("asset-weight", f"assets/ 合共 {total // 1024 // 1024}MB，超過 12MB 上限")
    notes.append(f"assets/ 合共 {total // 1024 // 1024}MB")


CHECKS = [
    check_js_syntax,
    check_no_build_step,
    check_cache_bust_tags,
    check_core_animals,
    check_deer_rules,
    check_word_ids_unique,
    check_build_ghost,
    check_star_rules,
    check_parent_pin,
    check_no_zoom,
    check_three_entries,
    check_storage_isolation,
    check_module_isolation,
    check_math_boot_guard,
    check_asset_refs,
    check_asset_manifests,
    check_asset_weight,
]


def main() -> int:
    for c in CHECKS:
        try:
            c()
        except FileNotFoundError as e:
            fail(c.__name__, f"揾唔到檔案：{e}")
    print(f"kaka-learn 硬性約束檢查（{len(CHECKS)} 項）")
    for n in notes:
        print(f"  · {n}")
    if problems:
        print(f"\n結論：有問題（{len(problems)} 個 blocker）\n")
        for p in problems:
            print(f"  ✗ {p}")
        print("\n跟 docs/qa-check.md：全部修好先可以 merge。")
        return 1
    print("\n結論：可以 merge（硬性約束全部通過）")
    print("提提你：視覺／幼齡適切度仍然要檢查 agent 用人眼睇一次。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
