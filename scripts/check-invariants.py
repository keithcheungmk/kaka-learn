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
warnings: list[str] = []
notes: list[str] = []


def fail(rule: str, msg: str) -> None:
    problems.append(f"[{rule}] {msg}")


def warn(rule: str, msg: str) -> None:
    warnings.append(f"[{rule}] {msg}")


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
    """保持純靜態、無 build step、無外部 runtime 依賴。"""
    for bad in ("package.json", "vite.config.js", "webpack.config.js"):
        if Path(bad).exists():
            fail("no-build", f"出現咗 {bad}；AGENTS.md 要求保持無 build step 嘅純靜態站")
    allowed = {
        "https://yiu0527.github.io",  # 禧禧小遊戲樂園（主頁外部連結）
        "https://keithcheungmk.github.io",  # 自己個 GitHub Pages 域名，用喺 og:image/twitter:image
        # 呢個唔係外部依賴：冇任何 JS 會喺 runtime fetch 呢個 host，
        # 純粹俾分享連結嗰陣（Messages/WhatsApp/Line 等）嘅爬蟲讀 meta tag 用，
        # 靜態頁面本身完全唔會叫呢個 URL。
    }
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

def check_word_data_integrity() -> None:
    """主題／書本嘅 wordIds 一定要 resolve 到真字；term 唔可以撞名。

    字卡 OCR pipeline（scripts/apply-book-cards.py）靠「一個字 → 一個 id」呢個假設，
    所以 term 撞名要即刻攔住，唔可以等到寫錯字入書度先發現。
    """
    node = shutil.which("node")
    if not node:
        notes.append("冇 node，跳過字詞資料完整性檢查（CI 一定會跑）")
        return
    probe = r"""
      global.window = {};
      require(process.argv[1]);
      const { WORDS, TOPICS } = window.KakaWords;
      const ids = new Set(WORDS.map(w => w.id));
      const out = { badIds: [], emptyLists: [], dupTerms: [], notInTopic: [] };
      const byTerm = {};
      for (const w of WORDS) (byTerm[w.term] = byTerm[w.term] || []).push(w.id);
      for (const [t, v] of Object.entries(byTerm)) if (v.length > 1) out.dupTerms.push(t + ' → ' + v.join('/'));
      const scan = (label, list) => {
        if (!list || !list.length) { out.emptyLists.push(label); return; }
        for (const i of list) if (!ids.has(i)) out.badIds.push(label + ': ' + i);
      };
      for (const t of TOPICS) {
        scan('主題 ' + t.id, t.wordIds);
        for (const b of (t.books || [])) {
          scan('書 ' + t.id + '/' + b.id, b.wordIds);
          const miss = (b.wordIds || []).filter(i => ids.has(i) && !(t.wordIds || []).includes(i));
          if (miss.length) out.notInTopic.push(t.id + '/' + b.id + '（' + b.title + '）: ' + miss.join('、'));
        }
      }
      console.log(JSON.stringify(out));
    """
    r = subprocess.run([node, "-e", probe, str(ROOT / "js" / "words.js")], capture_output=True, text=True)
    if r.returncode != 0:
        fail("word-data", f"載入唔到 words.js：{r.stderr.strip().splitlines()[-1] if r.stderr.strip() else '?'}")
        return
    out = json.loads(r.stdout)
    for b in out["badIds"]:
        fail("word-data", f"wordIds 指住唔存在嘅字：{b}")
    for e in out["emptyLists"]:
        fail("word-data", f"{e} 嘅 wordIds 係空（主題／書會白屏）")
    for d in out["dupTerms"]:
        fail("word-data", f"同一個詞有多過一個 entry：{d}（字卡 OCR 會唔知揀邊個）")
    for n in out["notInTopic"]:
        warn("word-data", f"書入面有字唔喺該輯總表：{n}")


def check_openmoji_coverage() -> None:
    """每個用到嘅 emoji 都要有 OpenMoji SVG。

    插圖層（js/emoji-art.js）會把 emoji 換成 `assets/openmoji/<codepoint>.svg`。
    加咗新字／新主題但冇補圖，喺瀏覽器度先會見到 404 —— 呢個 check 令佢喺 commit 前就爆。
    補圖：由 openmoji npm 套件（色彩 SVG）抄過嚟，檔名去走 U+FE0F、大寫 hex、用 `-` 連。
    """
    node = shutil.which("node")
    if not node:
        notes.append("冇 node，跳過 OpenMoji 覆蓋檢查（CI 一定會跑）")
        return
    probe = r"""
      global.window = {};
      require(process.argv[1]);
      require(process.argv[2]);
      const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
      const out = new Set();
      const add = (str) => {
        if (!str) return;
        for (const g of seg.segment(String(str))) {
          const t = g.segment;
          if (t.trim() && /\p{Extended_Pictographic}|⃣/u.test(t)) {
            out.add([...t].filter((c) => c !== '️')
              .map((c) => c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join('-'));
          }
        }
      };
      const { WORDS, TOPICS } = window.KakaWords;
      for (const w of WORDS) { add(w.emoji); add(w.badge); }
      for (const t of TOPICS) { add(t.cover); for (const b of (t.books || [])) add(b.cover); }
      const P = window.KakaPhonicsWords || {};
      for (const k of Object.keys(P)) {
        const v = P[k];
        if (!Array.isArray(v)) continue;
        for (const x of v) {
          if (!x || typeof x !== 'object') continue;
          add(x.emoji); add(x.cover);
          for (const w of (x.words || [])) add(w && w.emoji);
        }
      }
      console.log(JSON.stringify([...out]));
    """
    r = subprocess.run(
        [node, "-e", probe, str(ROOT / "js" / "words.js"), str(ROOT / "js" / "phonics-words.js")],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        fail("openmoji", f"掃唔到 emoji 清單：{r.stderr.strip().splitlines()[-1] if r.stderr.strip() else '?'}")
        return
    wanted = json.loads(r.stdout)
    missing = [c for c in wanted if not (ROOT / "assets" / "openmoji" / f"{c}.svg").exists()]
    for c in missing[:12]:
        try:
            glyph = "".join(chr(int(x, 16)) for x in c.split("-"))
        except ValueError:
            glyph = "?"
        fail("openmoji", f"{glyph} 冇 assets/openmoji/{c}.svg（加新字／新主題記得補圖）")
    if len(missing) > 12:
        fail("openmoji", f"…仲有 {len(missing) - 12} 個 emoji 冇圖")
    notes.append(f"OpenMoji 覆蓋 {len(wanted) - len(missing)}/{len(wanted)}")


def check_emoji_disc() -> None:
    """插圖嘅淺色圓碟唔可以刪。

    OpenMoji 係為淺色底設計：519 個圖形入面有 120 個係黑色線條（筷子、雪花、螞蟻、蝙蝠…），
    直接放喺深藍板上等於消失。`.emoji-img` 嘅淺色圓碟就係專登用嚟托住佢哋。
    刪咗＝一堆字即刻「冇咗幅圖」，而且喺 diff 度睇唔出，所以要喺呢度攔。
    """
    css = read("css/styles.css")
    m = re.search(r"(?ms)^\.emoji-img\s*\{(.*?)\}", css)
    if not m:
        fail("emoji-disc", "css/styles.css 唔見 .emoji-img 規則")
        return
    block = m.group(1)
    if "border-radius" not in block or "background" not in block:
        fail("emoji-disc", ".emoji-img 冇咗淺色圓碟（background / border-radius）；"
                           "OpenMoji 黑線條圖喺深色板會消失")


def check_voice_picker() -> None:
    """粵語女聲優先 + 家長區揀聲要留低。

    iPadOS 更新會改 speechSynthesis 嘅聲音次序，淨係攞「第一個 zh-HK」會突然變咗男聲。
    """
    speech = strip_js_comments(read("js/speech.js"))
    if "FEMALE_VOICE_NAMES" not in speech:
        fail("voice", "js/speech.js 冇咗女聲優先名單（更新 iPadOS 之後會變返男聲）")
    if "setPreferredVoiceURI" not in speech:
        fail("voice", "js/speech.js 冇咗 setPreferredVoiceURI（家長區揀聲會失效）")
    if "voice-select" not in read("index.html"):
        fail("voice", "index.html 家長區唔見聲音揀選（#voice-select）")


def check_coin_chip() -> None:
    """星星條後面嘅硬幣唔可以剩返一個數字。"""
    if "coin-chip" not in read("js/app.js"):
        fail("coin", "js/app.js 冇咗 coin-chip（『十粒星換一個幣』會變返純文字）")
    if ".coin-face" not in read("css/styles.css"):
        fail("coin", "css/styles.css 冇咗 .coin-face 樣式")


def check_build_ghost() -> None:
    """砌一砌淡色格係配對支架，唔可以刪、唔可以變空白格。"""
    css = read("css/styles.css")
    if not re.search(r"(?m)^\.build-ghost\s*\{", css):
        fail("build-ghost", "css/styles.css 唔見 .build-ghost 規則本身（淡色格支架俾人刪咗？）")
    else:
        block = re.search(r"(?ms)^\.build-ghost\s*\{(.*?)\}", css).group(1)
        if re.search(r"display\s*:\s*none", block) or re.search(r"opacity\s*:\s*0\s*[;}]", block):
            fail("build-ghost", ".build-ghost 被整到隱形；淡格係配對支架，唔係洩題")
        alphas = [float(x) for x in re.findall(r"rgba\(\s*[\d.\s,]+?,\s*(0?\.\d+|\d+(?:\.\d+)?)\s*\)", block)]
        if alphas and max(alphas) < 0.45:
            fail("build-ghost", f".build-ghost alpha {max(alphas)} 太淡，至少 0.45（日光下睇唔到支架）")
    for f in ("js/app.js", "js/phonics-app.js"):
        src = read(f)
        if not re.search(r'class="build-ghost[^"]*"[^>]*>\$\{', src):
            fail("build-ghost", f"{f} 冇再喺淡格 render 目標字（支架變咗空白考試格？）")


def check_star_rules() -> None:
    """獎勵規則（2026-08 改版）：完成一輪 = 一個 AEON 幣，每種玩法一日一個。

    舊規則（每日 10 星上限、可換幣 = floor(totalStars/10)）已經廢除，
    因為一輪係 8–10 題，玩到一半就滿咗、第二輪一粒都冇，對 4 歲係動力斷崖。
    呢度守住新規則嘅三條命脈：派幣要去重、要有 3 種玩法、舊資料要遷移得到。
    """
    st = strip_js_comments(read("js/storage.js"))
    if "earnCoinForMode" not in st:
        fail("coins", "storage.js 冇咗 earnCoinForMode（完成一輪派幣）")
    if not re.search(r"if\s*\(state\.coinsToday\[mode\]\)", st):
        fail("coins", "earnCoinForMode 冇咗『同一種玩法一日一個』嘅去重檢查")
    if not re.search(r"COIN_MODES\s*=\s*\['listen',\s*'match',\s*'build'\]", st):
        fail("coins", "COIN_MODES 應該係 listen／match／build 三種玩法")
    if "economyVersion" not in st or "Math.floor((state.totalStars || 0) / 10)" not in st:
        fail("coins", "冇咗舊資料遷移（coinsTotal = floor(累積星星/10)）；KAKA 已賺嘅幣唔可以蒸發")
    if "saveRoundProgress" not in st or "clearRoundProgress" not in st:
        fail("coins", "storage.js 冇咗未完成輪次嘅儲存（中途走咗返嚟進度會冇晒）")
    if "recordWordResult" not in st or "wordStats" not in st:
        fail("coins", "storage.js 冇咗 wordStats／recordWordResult（掌握度出題會失效）")

    app = strip_js_comments(read("js/app.js"))
    if "earnCoinForMode(playMode)" not in app:
        fail("coins", "js/app.js 完成一輪冇派幣")
    if "flyStarToBar" not in app:
        fail("coins", "js/app.js 冇咗答啱飛星動畫（KAKA 見唔到『我做啱 → 我近咗』）")


def check_parent_pin() -> None:
    if not re.search(r"pin:\s*'1234'", read("js/storage.js")):
        fail("parent-pin", "家長 PIN 預設值唔再係 '1234'")


def check_ranger_mirror_dodge() -> None:
    """太空戰士：img 朝右 mirror；container 唔翻；唔跳入字池；pointer-events none；窄屏避讓。"""
    css = read("css/styles.css")
    js = strip_js_comments(read("js/star-fx.js"))

    ranger_block = re.search(r"(?ms)^\s*\.space-ranger\s*\{(.*?)\}", css)
    if not ranger_block:
        fail("ranger", "css/styles.css 唔見 .space-ranger 規則")
        return
    block = ranger_block.group(1)
    if not re.search(r"pointer-events\s*:\s*none", block):
        fail("ranger", ".space-ranger 冇咗 pointer-events: none（會擋字池 hit-test）")
    if re.search(r"scaleX\s*\(\s*-1\s*\)", block):
        fail("ranger", ".space-ranger container 唔應該 scaleX(-1)（會翻亂 sparkle／laser 錨點）；只可以翻 img")

    img_block = re.search(
        r"(?ms)^\s*\.space-ranger(?:\s+img|-img)\s*,?\s*(?:\.space-ranger-img)?\s*\{(.*?)\}",
        css,
    )
    if not img_block:
        img_block = re.search(r"(?ms)^\s*\.space-ranger-img\s*\{(.*?)\}", css) or re.search(
            r"(?ms)^\s*\.space-ranger img\s*\{(.*?)\}", css
        )
    if not img_block:
        fail("ranger", "css/styles.css 唔見 .space-ranger img／.space-ranger-img（朝右 mirror 冇位加）")
    elif not re.search(r"scaleX\s*\(\s*-1\s*\)", img_block.group(1)):
        fail("ranger", "人物圖冇 transform: scaleX(-1)；Keith 要求視覺朝右、只翻 img")

    if "appendChild(globalRanger)" not in js and "document.body.appendChild" not in js:
        fail("ranger", "star-fx.js 嘅 ranger 唔再掛 body（可能跳入字池格子？）")
    if re.search(r"build-pool.*space-ranger|space-ranger.*build-pool", js):
        fail("ranger", "star-fx.js 似乎把 ranger 放進字池；唔好做成格子／跳空位")

    if not re.search(r"@media\s*\([^)]*orientation:\s*portrait", css):
        fail("ranger", "css 冇 portrait 避讓（窄屏／直屏會蓋住字池）")
    if not re.search(r"\.space-ranger\s*\{[^}]*\bright\s*:", css, flags=re.S):
        fail("ranger", "直屏／窄屏 .space-ranger 應該改用 right（避字池），而家搵唔到 right:")

    if "MUZZLE_ANCHOR" not in js:
        fail("ranger", "star-fx.js 冇咗 MUZZLE_ANCHOR（飛星原點）")


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


IMAGE_LOCK = Path("assets/image-formats.lock.json")


def image_facts(p: Path) -> dict:
    from PIL import Image  # type: ignore

    with Image.open(p) as im:
        return {
            "format": im.format,
            "alpha": bool("A" in im.mode or "transparency" in im.info),
        }


def all_images() -> list[Path]:
    return sorted(p for p in Path("assets").rglob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png"))


def update_image_lock() -> None:
    lock = {str(p): image_facts(p) for p in all_images()}
    IMAGE_LOCK.write_text(json.dumps(lock, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"已更新 {IMAGE_LOCK}（{len(lock)} 張圖）")


def check_image_formats() -> None:
    """去背圖唔可以變咗白底／黑底。

    陷阱：`assets/dino/` 有幾張 `.jpg` 其實係 **PNG（帶透明背景）**，只係改咗個名。
    任何人（或 agent）用「JPEG 重新壓縮」照掃一次，透明背景就會變黑，
    喺太空深色底上面即刻穿崩，而且肉眼喺 diff 度睇唔出。

    做法：`assets/image-formats.lock.json` 記低每張圖真實格式同有冇 alpha；
    對唔上就攔住。真係有意換圖／換格式，跑：
        python3 scripts/check-invariants.py --update-image-lock
    """
    try:
        import PIL  # noqa: F401
    except ImportError:
        notes.append("冇 Pillow，跳過圖片格式檢查（CI 一定會跑）")
        return
    if not IMAGE_LOCK.exists():
        warn("image-format", f"未有 {IMAGE_LOCK}；跑 --update-image-lock 建立基準")
        return

    lock = json.loads(IMAGE_LOCK.read_text(encoding="utf-8"))
    seen = set()
    for p in all_images():
        key = str(p)
        seen.add(key)
        want = lock.get(key)
        got = image_facts(p)
        if want is None:
            warn("image-format", f"{p} 係新圖，未入 lock；確認冇問題就跑 --update-image-lock")
            continue
        if got["format"] != want["format"]:
            fail("image-format", f"{p} 真實格式由 {want['format']} 變咗 {got['format']}"
                                 f"（多數係被當成普通 JPEG 重壓，去背會變實色底）")
        elif want["alpha"] and not got["alpha"]:
            fail("image-format", f"{p} 冇咗透明通道；原本係去背圖，深色底會穿崩")
    for key in lock:
        if key not in seen:
            warn("image-format", f"{key} 喺 lock 但檔案唔見咗；刪圖後記得跑 --update-image-lock")


def check_font_coverage() -> None:
    """每個 app 用到嘅漢字都要喺 self-hosted Noto Sans HK subset 入面。"""
    manifest_path = ROOT / "assets" / "fonts" / "charset.json"
    if not manifest_path.exists():
        fail("font-coverage", "未有 assets/fonts/charset.json；跑 python3 scripts/build-font-subset.py")
        return
    try:
        from fontTools.ttLib import TTFont  # type: ignore
    except ImportError:
        notes.append("冇 fontTools，跳過字體覆蓋檢查（CI 要裝）")
        return
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    han = manifest.get("han") or []
    font_path = ROOT / "assets" / "fonts" / "noto-sans-hk-500.woff2"
    if not font_path.exists():
        fail("font-coverage", "未有 assets/fonts/noto-sans-hk-500.woff2")
        return
    tt = TTFont(str(font_path))
    cmap = set()
    for table in tt["cmap"].tables:
        cmap.update(table.cmap.keys())
    missing = [c for c in han if ord(c) not in cmap]
    for c in missing[:12]:
        fail("font-coverage", f"字體 subset 缺字「{c}」；加新字後跑 python3 scripts/build-font-subset.py")
    if len(missing) > 12:
        fail("font-coverage", f"…仲有 {len(missing) - 12} 個漢字缺字")
    if not (ROOT / "assets" / "fonts" / "fredoka.woff2").exists():
        fail("font-coverage", "未有 assets/fonts/fredoka.woff2")


POLYPHONE_REQUIRED = {
    "chang_long": "長",
    "zhong": "重",
    "fen_share": "分",
    "jiao_teach": "教",
    "shao": "少",
    "hao": "好",
    "kan": "看",
    "du": "讀",
    "xie": "寫",
    "chi_eat": "吃",
    "he_drink": "喝",
    "shuo": "說",
    "huan": "還",
    "le": "了",
    "jiao_call": "叫",
    "zhi_point": "指",
    "chang_sing": "唱",
    "yao_want": "要",
    "hui_can": "會",
    "hui": "回",
    "de": "的",
    "di": "地",
    "shui_sleep": "睡",
    "xing": "醒",
    "zhao": "找",
    "shang": "上",
    "xia": "下",
}


def check_polyphone_say() -> None:
    """已知多音字（單字）必須有 say，避免 TTS 讀錯音。"""
    src = read("js/words.js")
    for wid, term in POLYPHONE_REQUIRED.items():
        m = re.search(rf"\{{[^{{}}]*id:\s*'{wid}'[^{{}}]*\}}", src)
        if not m:
            fail("polyphone", f"words.js 冇 {wid}（{term}）")
            continue
        block = m.group(0)
        if not re.search(r"say:\s*'[^']+'", block):
            fail("polyphone", f"「{term}」（{wid}）係多音字，必須有 say")


def check_match_naming() -> None:
    """玩法名統一「配一配」，唔好再同「睇圖」三名混用。"""
    html = read("index.html")
    if 'play-mode-title">配一配' not in html:
        fail("match-name", "認字揀玩法卡標題要叫「配一配」")
    if 'play-mode-title">睇圖' in html:
        fail("match-name", "認字揀玩法卡唔好再叫「睇圖」")
    if 'id="btn-phonics-mode-match">配一配' not in html:
        fail("match-name", "字母隊入口要叫「配一配」")
    app = strip_js_comments(read("js/app.js"))
    if "setPlayModeCopy('#btn-mode-match', '睇圖'" in app:
        fail("match-name", "app.js 唔好再把配一配標題設做「睇圖」")


def check_learn_finish_always() -> None:
    """學習頁「去玩玩」常駐；[hidden] 唔可以被 .btn-row flex 蓋走。"""
    html = read("index.html")
    if re.search(r'id="learn-finish-row"[^>]*\bhidden\b', html):
        fail("learn-finish", "#learn-finish-row 唔應該預設 hidden；去玩玩要常駐")
    if re.search(r'id="phonics-learn-finish-row"[^>]*\bhidden\b', html):
        fail("learn-finish", "#phonics-learn-finish-row 唔應該預設 hidden")
    css = read("css/styles.css")
    if not re.search(r"\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important", css):
        fail("hidden", "css/styles.css 要有 [hidden]{display:none!important}，唔好俾 .btn-row flex 蓋走")


def check_cjk_halfwidth_punct() -> None:
    """中文字後面唔准跟半形 , . ! ? : ;（童面／程式字串）。"""
    pat = re.compile(r"([\u4e00-\u9fff])([,.!?:;])")
    for f in ["index.html"] + JS_FILES:
        src = strip_js_comments(read(f)) if f.endswith(".js") else read(f)
        hits = pat.findall(src)
        if hits:
            sample = " ".join(f"{a}{b}" for a, b in hits[:4])
            fail("punct", f"{f} 有中文半形標點（例如 {sample}）")


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
    check_word_data_integrity,
    check_openmoji_coverage,
    check_emoji_disc,
    check_voice_picker,
    check_coin_chip,
    check_build_ghost,
    check_star_rules,
    check_parent_pin,
    check_ranger_mirror_dodge,
    check_no_zoom,
    check_three_entries,
    check_storage_isolation,
    check_module_isolation,
    check_math_boot_guard,
    check_asset_refs,
    check_asset_manifests,
    check_image_formats,
    check_font_coverage,
    check_polyphone_say,
    check_match_naming,
    check_learn_finish_always,
    check_cjk_halfwidth_punct,
    check_asset_weight,
]


def main() -> int:
    if "--update-image-lock" in sys.argv:
        update_image_lock()
        return 0
    for c in CHECKS:
        try:
            c()
        except FileNotFoundError as e:
            fail(c.__name__, f"揾唔到檔案：{e}")
    print(f"kaka-learn 硬性約束檢查（{len(CHECKS)} 項）")
    for n in notes:
        print(f"  · {n}")
    for w in warnings:
        print(f"  ⚠ {w}")
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
