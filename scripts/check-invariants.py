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
        "https://yiu0527.github.io",  # 小遊戲樂園（主頁外部連結）
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


def check_safe_auto_update() -> None:
    """部署有版本檔；前端只可喺安全畫面套用新版，唔可以打斷遊戲。"""
    html = read("index.html")
    build = read("scripts/build-site.sh")
    checker = read("js/version-check.js") if Path("js/version-check.js").exists() else ""
    if "js/version-check.js?v=" not in html:
        fail("auto-update", "index.html 冇載入 version-check.js（iPad 會長期停留舊版）")
    if "version.json" not in build or '"version"' not in build:
        fail("auto-update", "build-site.sh 冇產出 version.json")
    if "cache: 'no-store'" not in checker:
        fail("auto-update", "version-check.js 讀版本時必須用 cache: 'no-store'")
    for unsafe in ("screen-learn", "screen-play", "screen-listen", "screen-match", "screen-build"):
        safe_set = re.search(r"SAFE_SCREEN_IDS\s*=\s*new Set\(\[(.*?)\]\)", checker, flags=re.S)
        if safe_set and unsafe in safe_set.group(1):
            fail("auto-update", f"{unsafe} 唔可以列做安全 reload 畫面（會打斷學習／遊戲）")


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
    """5 種鹿類均有唯一、存在的專屬插圖；缺圖時才使用詞語本身的 Emoji fallback。"""
    src = read("js/words.js")
    m = re.search(r"DEER_IDS\s*=\s*\[([^\]]*)\]", src)
    if not m:
        fail("deer", "words.js 揾唔到 DEER_IDS")
    else:
        ids = re.findall(r"'([^']+)'", m.group(1))
        if len(ids) < 5:
            fail("deer", f"DEER_IDS 得 {len(ids)} 個（應該至少 5 個鹿種）")
    deer_terms = ["鹿", "梅花鹿", "馴鹿", "駝鹿", "馬鹿"]
    image_paths: list[str] = []
    for term in deer_terms:
        entry = re.search(r"\{[^{}]*term:\s*'" + re.escape(term) + r"'[^{}]*\}", src)
        if not entry:
            continue
        photo = re.search(r"photo:\s*'([^']+)'", entry.group(0))
        if not photo:
            fail("deer", f"{term} 必須有專屬插圖，唔可以只靠相同鹿 Emoji／badge")
            continue
        path = photo.group(1)
        image_paths.append(path)
        if not (ROOT / path).is_file():
            fail("deer", f"{term} 插圖檔不存在：{path}")
    if len(image_paths) != len(set(image_paths)):
        fail("deer", "每種鹿必須使用不同插圖檔案")


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


def check_answer_contrast() -> None:
    """共享答案磚與獨立 PTH 答案狀態須維持 WCAG AA 對比。"""
    theme = read("css/playground-theme.css")

    def luminance(value: str) -> float:
        channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]

    def contrast(foreground: str, background: str) -> float:
        lighter, darker = sorted((luminance(foreground), luminance(background)), reverse=True)
        return (lighter + 0.05) / (darker + 0.05)

    for selector in (".build-tile", ".build-drag-ghost", ".chip", ".pic-card", ".chain-option", ".sentence-story-card", ".sentence-card"):
        if selector not in theme:
            fail("answer-contrast", f"共享答案元件缺少對比規則：{selector}")

    pairs = (("#18345f", "#ffffff"), ("#17396e", "#e3faed"),
             ("#0b5f43", "#eaf7ff"), ("#775000", "#eaf7ff"),
             ("#ffffff", "#9f1239"), ("#ffffff", "#714819"), ("#ffffff", "#166534"))
    if any(contrast(foreground, background) < 4.5 for foreground, background in pairs):
        fail("answer-contrast", "共享答案／已選／回饋狀態未達 WCAG AA 4.5:1")
    for selector in (".feedback.ok", ".feedback.retry", ".story-fill-tile.wrong", ".story-fill-tile.selected", ".story-fill-tile.correct"):
        if selector not in theme:
            fail("answer-contrast", f"共享回饋狀態缺少對比規則：{selector}")

    pth_html = read("pth-demo.html")
    pth_css = read("css/pth-answer-contrast.css")
    if "pth-answer-contrast.css" not in pth_html:
        fail("answer-contrast", "PTH standalone 頁未載入答案對比修正")
    for selector in (".answer-slot.filled", ".option {", ".option.selected", ".feedback.good"):
        if selector not in pth_css:
            fail("answer-contrast", f"PTH 缺少答案／回饋對比規則：{selector}")
    if contrast("#19365f", "#e3faed") < 4.5:
        fail("answer-contrast", "PTH 已填答案未達 WCAG AA 4.5:1")


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
    """粵語女聲優先要留低。家長區已撤，聲音改自動揀女聲。

    iPadOS 更新會改 speechSynthesis 嘅聲音次序，淨係攞「第一個 zh-HK」會突然變咗男聲。
    """
    speech = strip_js_comments(read("js/speech.js"))
    if "FEMALE_VOICE_NAMES" not in speech:
        fail("voice", "js/speech.js 冇咗女聲優先名單（更新 iPadOS 之後會變返男聲）")
    if "setPreferredVoiceURI" not in speech:
        fail("voice", "js/speech.js 冇咗 setPreferredVoiceURI")


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
    if "economyVersion" not in st or "Math.floor((" not in st or "/ 10)" not in st:
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


def check_profiles() -> None:
    """雙小朋友 Profile：主頁先揀卡卡／禧禧；資料按人隔離；家長 PIN 已撤。"""
    html = read("index.html")
    if 'id="screen-profiles"' not in html:
        fail("profiles", "index.html 唔見 #screen-profiles（主頁要先揀小朋友）")
    if 'id="btn-profile-kaka"' not in html or 'id="btn-profile-heihei"' not in html:
        fail("profiles", "揀 Profile 要有 #btn-profile-kaka 同 #btn-profile-heihei")
    if 'profile-card-name">卡卡' not in html or 'profile-card-name">禧禧' not in html:
        fail("profiles", "Profile 卡要寫「卡卡」「禧禧」")
    if 'profile-card-name">希希' in html:
        fail("profiles", "Profile 顯示名係「禧禧」，唔好寫返「希希」")
    avatars = ["assets/profile-kaka.jpg", "assets/profile-heihei.jpg"]
    for p in avatars:
        if not Path(p).exists():
            fail("profiles", f"唔見頭像 {p}")
    if 'id="modal-pin"' in html or 'id="btn-parent"' in html:
        fail("profiles", "家長 PIN／家長區入口應該掹走（改用換小朋友）")
    if html.count("禧禧遊戲樂園") != 2:
        fail("profiles", "「禧禧遊戲樂園」只應保留主頁一個入口（文字及 aria-label 各一次）")
    profile_html = html.split('id="screen-profiles"', 1)[1].split("</section>", 1)[0]
    if "禧禧遊戲樂園" in profile_html or "HeiHeiClass" in profile_html:
        fail("profiles", "Profile 選擇頁唔應該再顯示禧禧遊戲樂園外鏈")
    if 'id="screen-progress"' not in html:
        fail("profiles", "唔見 #screen-progress（我的進度頁）")
    st = strip_js_comments(read("js/storage.js"))
    if "setActiveProfile" not in st or "SCHEMA_VERSION" not in st:
        fail("profiles", "storage.js 要有 setActiveProfile／SCHEMA_VERSION（按人分倉）")
    if "heihei" not in st or "kaka" not in st:
        fail("profiles", "storage.js 要有 kaka／heihei 兩個 profile")
    if "name: '禧禧'" not in st:
        fail("profiles", "storage.js 嘅 heihei Profile 顯示名要係「禧禧」")
    if "migrateLegacyToRoot" not in st:
        fail("profiles", "storage.js 要遷移舊單一資料入卡卡")
    math = strip_js_comments(read("js/math-storage.js"))
    if "setActiveProfile" not in math:
        fail("profiles", "math-storage.js 都要按 profile 分倉（數理進度唔好互串）")
    smoke = read("scripts/smoke-shots.py")
    if "btn-profile-kaka" not in smoke:
        fail("profiles", "smoke-shots.py 要先撳 Profile 先入主頁三個入口")
    app = strip_js_comments(read("js/app.js"))
    if "openProfilePick" not in app or "openProgress" not in app:
        fail("profiles", "app.js 要有換小朋友同進度頁")


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
    """首頁品牌、四科名稱與朋友入口穩定；英文仍由單一入口分流。"""
    html = read("index.html")
    home = html.split('id="screen-home"', 1)[1].split("</section>", 1)[0] if 'id="screen-home"' in html else ""
    for label in ["卡卡開心學習樂園", "卡卡中文樂園", "卡卡英文樂園", "卡卡普通話拼音", "卡卡數學樂園", "卡卡常識樂園"]:
        if label not in home:
            fail("home-labels", f"主頁缺少核准入口／標題：{label}")
    if 'src="./assets/home-learning-picnic.jpg"' not in home or not Path("assets/home-learning-picnic.jpg").is_file():
        fail("home-poster", "主頁野餐海報資產缺失或未接入")
    if 'href="https://yiu0527.github.io/HeiHeiClass/index.html"' not in home or "禧禧遊戲樂園" not in home:
        fail("home-friend", "禧禧遊戲樂園入口／既有網址必須保留")
    for btn, name in [
        ("btn-start-topics", "小鹿認字探險"),
        ("btn-start-english", "英文學習"),
        ("btn-start-math", "小鹿數理探險"),
    ]:
        if btn not in html:
            fail("entries", f"index.html 唔見 #{btn}（{name} 入口）")
    for btn in ["btn-english-story", "btn-english-words", "btn-english-phonics"]:
        if f'id="{btn}"' not in html:
            fail("entries", f"英文學習分流頁唔見 #{btn}")
    if html.count('id="btn-start-english"') != 1:
        fail("entries", "主頁應該只有一個英文學習入口")
    if 'id="btn-start-common-sense"' not in home or "common-sense.html" not in home:
        fail("entries", "主頁要有頂層「卡卡常識樂園」入口，連去 common-sense.html")
    topics = html.split('id="screen-topics"', 1)[1] if 'id="screen-topics"' in html else ""
    if "卡卡常識樂園" in topics or "btn-start-common-sense" in topics:
        fail("entries", "常識樂園唔可以掛喺中文主題頁下面")
    if 'id="btn-start-story-demo"' in html or 'id="btn-start-phonics"' in html:
        fail("entries", "主頁應只保留一個英文入口，故事與 Phonics 請由英文分流頁進入")
    phonics = read("js/phonics-app.js")
    phonics_css = read("css/phonics.css")
    if "openPhonicsTopics('sight')" not in phonics or "openPhonicsTopics('phonics')" not in phonics:
        fail("entries", "英文學習分流頁嘅 Topic Words／Phonics 按鈕未接到各自內容")
    if "pActiveEnglishTrack" not in phonics or 'dataset.englishTrack = pActiveEnglishTrack' not in phonics:
        fail("entries", "Topic Words 與 Phonics 頁面未按選擇分開顯示")
    if 'data-english-track="sight"' not in phonics_css or 'data-english-track="phonics"' not in phonics_css:
        fail("entries", "Topic Words／Phonics 頁面未分開隱藏另一條路線")
    story = read("js/story-demo.js")
    if "window.KakaPhonics?.openEnglishHub" not in story:
        fail("entries", "故事系列返回按鈕未返回共用英文入口")
    if "function isStoryBookComplete" not in story or "story-complete-star" not in story:
        fail("entries", "Carter／Magic Marker／Wacky 書架要顯示已完成星標")
    if "complete: isStoryBookComplete(book, passedKeys)" not in story or "markStoryBookComplete" not in story:
        fail("entries", "三個故事系列書架都要顯示完成星，並寫入 episode passedKeys")
    if "showCompletion = currentSeriesId === 'wacky-ricky'" in story:
        fail("entries", "完成星唔可以再限 Wacky Ricky")
    if "story-complete-star" not in read("css/story-demo.css"):
        fail("entries", "故事完成星標未有對應樣式")


def check_story_next_reachable() -> None:
    """WR019 Pet Care：iPad 答啱後 Next 唔可以被填空面板 overflow:hidden 剪走。"""
    css = read("css/story-demo.css")
    story = read("js/story-demo.js")
    if not re.search(r"\.story-fill-panel\s*\{[^}]*overflow-y:\s*auto", css, re.S):
        fail("story-next", "平板／桌面 .story-fill-panel 要 overflow-y:auto，等 Next 可以捲到")
    if not re.search(r"@media \(max-width:\s*700px\)[\s\S]*\.story-fill-panel\s*\{[^}]*overflow:\s*visible", css):
        fail("story-next", "手機 .story-fill-panel 要維持 overflow:visible")
    if "function revealStoryNextButton" not in story or "scrollIntoView" not in story:
        fail("story-next", "答啱後要 scrollIntoView Next")


def check_phonics_ranger_theme() -> None:
    """Phonics 已由鹿主題轉做 KAKA Ranger，舊鹿圖唔可以再接入畫面。"""
    html = read("index.html")
    css = read("css/phonics.css")
    joined = html + css
    for old_asset in ["phonics-hero.jpg", "phonics-space-bg.jpg"]:
        if old_asset in joined:
            fail("phonics-theme", f"Phonics 仍引用舊鹿素材 {old_asset}")
    if "kaka-ranger-solo.png" not in html:
        fail("phonics-theme", "Phonics hero 必須顯示 KAKA Ranger")
    if "phonics-energy-word" not in html or "SOUND MISSION" not in html:
        fail("phonics-theme", "Phonics hero 缺少 Ranger Sound Mission／能量字母")


def check_phonics_sound_energy() -> None:
    """Phonics 字母集中呈現字形／聲音，唔再扮成有表情嘅方塊角色。"""
    words = read("js/phonics-words.js")
    css = read("css/phonics.css")
    joined = words + css
    for retired in ["letter-face", "eye-l", "eye-r", "LETTER_COLORS"]:
        if retired in joined:
            fail("phonics-sound-energy", f"Phonics 仍包含已退役字母角色元素 {retired}")
    if "sound-energy-glyph" not in words or "sound-energy-glyph" not in css:
        fail("phonics-sound-energy", "Phonics 字母必須使用共用 Sound Energy 節點")


def check_phonics_skill_tracking() -> None:
    """Phase 3A：三種 Phonics 能力分開記錄，而且由正確玩法提供數據。"""
    storage = strip_js_comments(read("js/storage.js"))
    app = strip_js_comments(read("js/phonics-app.js"))
    for skill in ["recognition", "blending", "segmenting"]:
        if skill not in storage:
            fail("phonics-skills", f"storage.js 缺少 {skill} 能力記錄")
        if f"recordPhonicsSkill('{skill}'" not in app:
            fail("phonics-skills", f"phonics-app.js 未接入 {skill} 能力記錄")
    if "recordPhonicsSkillResult" not in storage or "phonicsSkillStats" not in storage:
        fail("phonics-skills", "Phase 3A 儲存 API／資料欄位不完整")
    if "recent.slice(-10)" not in storage:
        fail("phonics-skills", "Phonics recent 嘗試必須設上限，避免 localStorage 無限增長")


# ---------------------------------------------------------------- 故障隔離

def check_storage_isolation() -> None:
    """認字用 kaka-learn-v1、數理用 kaka-math-v1，唔好互寫。"""
    rules = [
        ("kaka-math-v1", ["js/app.js", "js/phonics-app.js", "js/storage.js"]),
        ("kaka-learn-v1", ["js/math-app.js", "js/math-skills.js", "js/math-storage.js", "js/additionData.js"]),
    ]
    for key, files in rules:
        for f in files:
            if key in strip_js_comments(read(f)):
                fail("storage-isolation", f"{f} 用咗 {key}；三套遊戲 state 唔可以互寫")


def check_module_isolation() -> None:
    """數理唔可以依賴認字／字母隊嘅題目或畫面 API。"""
    src = strip_js_comments("".join(read(f) for f in ["js/math-app.js", "js/math-skills.js", "js/math-storage.js", "js/additionData.js"]))
    for g in ["KakaWords", "KakaLearn", "KakaPhonicsWords", "KakaPhonics"]:
        if re.search(rf"\b{g}\b", src):
            fail("module-isolation", f"math-* 用咗 {g}；AGENTS.md 禁止數理依賴認字／字母隊")


def check_addition_planet() -> None:
    """地球加法星球：兩個加法階段，每階段十題物件拖放。"""
    for rel in ["js/additionData.js", "js/additionGame.js", "css/additionGame.css"]:
        if not Path(rel).exists():
            fail("addition-planet", f"缺少 {rel}")
    html = read("index.html")
    for sid in ["screen-math-earth-addition-select", "screen-math-earth-addition-play"]:
        if sid not in html:
            fail("addition-planet", f"index.html 缺少 #{sid}")
    for needle in ["additionData.js", "additionGame.js", "additionGame.css"]:
        if needle not in html:
            fail("addition-planet", f"index.html 未載入 {needle}")
    storage = strip_js_comments(read("js/math-storage.js"))
    if "additionProgress" not in storage or "completeAdditionMission" not in storage or "completeAdditionLevel" not in storage:
        fail("addition-planet", "math-storage.js 缺少 additionProgress／完成任務 API")
    data_src = read("js/additionData.js")
    if "levelOnePairs" not in data_src or "levelTwoPairs" not in data_src or "VISUALS" not in data_src:
        fail("addition-planet", "additionData 應包含 Level 1、Level 2 及多種原生 emoji 物件")
    if data_src.count("questionCount: QUESTIONS_PER_LEVEL") != 1 or "QUESTIONS_PER_LEVEL = 10" not in data_src:
        fail("addition-planet", "additionData 每個 Level 必須有十題")
    if "KakaAdditionGame" not in read("js/math-app.js"):
        fail("addition-planet", "math-app.js 未整合 KakaAdditionGame")


def check_math_boot_guard() -> None:
    """math-app.js 必須 try/catch 啟動，掛掉時另外兩個 app 仍可用。"""
    head = read("js/math-app.js")[:600]
    if "try" not in head or "catch" not in head:
        fail("math-boot", "math-app.js 開頭冇 try/catch 保護，掛咗會拖冧成頁")


def check_math_planets_scope() -> None:
    """只保留四個核心數理入口；水星為新手數量辨認，舊路線不得復活。"""
    html = read("index.html")
    app = strip_js_comments(read("js/math-app.js"))
    skills = read("js/math-skills.js")
    data = read("js/math-mercury-count-data.js")
    game = read("js/math-mercury-count-game.js")
    storage = read("js/math-storage.js")
    mastery = read("js/math-mastery.js")

    for rel in ("js/math-mercury-count-data.js", "js/math-mercury-count-game.js"):
        if not Path(rel).exists() or rel not in html:
            fail("math-planets", f"缺少或未載入 {rel}")
    for retired in ("shape", "sort", "pattern", "position", "ordinal"):
        if re.search(rf"id:\s*'{retired}'", skills):
            fail("math-planets", f"已下架嘅 {retired} 星球仍喺入口資料")
    if "number-relations" not in skills or "compare-size" not in skills or "id: 'time'" not in skills or "id: 'moon'" not in skills:
        fail("math-planets", "水星、地球、金星、月球四個保留入口唔齊")
    for token in ("screen-math-mars", "screen-math-shape", "screen-math-pattern", "screen-math-earth-bonds", "numberBonds"):
        if token in html:
            fail("math-planets", f"index.html 仲有已移除玩法 {token}")
    for token in ("openMars", "openBacklog", "BACKLOG_PLANETS", "KakaNumberBondsGame", "math-number-line"):
        if token in app or token in html:
            fail("math-planets", f"舊數理路線仍可被執行：{token}")
    if "math-number-line.css" in html or "math-number-line-game.js" in html or "numberBondsGame.js" in html:
        fail("math-planets", "index.html 仍載入已退役數軸／Number Bonds 模組")
    if "screen-math-relations-learn" not in html or "screen-math-relations-play" not in html:
        fail("math-planets", "index.html 缺少水星數數教學／遊戲畫面")
    if "openLearn" not in app or "KakaMathMercuryCountGame" not in app:
        fail("math-planets", "math-app.js 未將水星路由到新數數遊戲")
    if "generateMission" not in data or "count-objects" not in data or "mercuryCountProgress" not in data:
        fail("math-planets", "水星題庫缺少數物件題或獨立進度")
    if "numberRelationsProgress" not in storage or "mercuryCountProgress" not in storage or "SCHEMA_VERSION = 6" not in storage:
        fail("math-planets", "數理儲存未保留舊數線紀錄並加入水星新進度")
    if "count.oneToOne.1to5" not in mastery or "count.oneToOne.1to10" not in mastery:
        fail("math-planets", "數理掌握度未登記水星數數技能")
    if "btn-math-mode-time-digital" not in html or "btn-math-mode-time-set" not in html:
        fail("math-planets", "金星電子鐘或轉鐘玩法掣被移除")
    if "screen-math-moon-subtraction-play" not in html or "screen-math-earth-addition-play" not in html:
        fail("math-planets", "月球減法或地球加法畫面被移除")
    if "next.disabled = true" not in game or "speak(question.spokenCorrect" not in game:
        fail("math-planets", "水星答啱後未有等待語音再提供下一步")



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
        if wid == "chang_long" and not re.search(r"say:\s*'長'", block):
            fail("polyphone", "單字「長」嘅聲音必須只讀「長」，唔可以讀成「好長」")


def check_match_mode_hidden() -> None:
    """中文去玩玩隱藏配一配入口，但保留畫面同程式方便再開。"""
    html = read("index.html")
    m = re.search(r"<button[^>]*id=\"btn-mode-match\"[^>]*>", html)
    if not m:
        fail("match-hidden", "index.html 要保留 #btn-mode-match")
    elif "hidden" not in m.group(0):
        fail("match-hidden", "配一配玩法卡要加 hidden，唔顯示俾小朋友")
    if 'id="screen-match"' not in html:
        fail("match-hidden", "配一配遊戲畫面要保留，方便日後再開")
    css = read("css/styles.css")
    if "#btn-mode-match" not in css or "display: none" not in css.split("#btn-mode-match", 1)[-1][:180]:
        fail("match-hidden", "css/styles.css 要用 #btn-mode-match { display:none } 雙重隱藏")
    app = strip_js_comments(read("js/app.js"))
    if "matchBtn.hidden = true" not in app:
        fail("match-hidden", "app.js 開玩法頁時都要保持配一配隱藏")
    if "function startMatchMode" not in app:
        fail("match-hidden", "startMatchMode 要保留，唔好刪配一配程式")


def check_connect_picture_scale() -> None:
    """iPad／寬螢幕連一連圖片大約放大 50%；手機唔好撐爆。"""
    css = read("css/phonics.css")
    if "@media (min-width: 700px)" not in css:
        fail("connect-scale", "phonics.css 要有 min-width: 700px 放大連一連圖")
    if "min(120px, 15vw, 18vh)" not in css:
        fail("connect-scale", "寬螢幕連一連 emoji-plate 要大約 120px（相對 76px 增大 50%）")
    if "max-width: 640px" not in css:
        fail("connect-scale", "手機連一連要維持單欄，唔好跟 iPad 放大")
    app = read("js/app.js")
    if "minmax(0, 1.22fr) minmax(0, 1fr)" not in app:
        fail("connect-scale", "中文連一連圖片欄喺寬螢幕要闊過詞語欄")


def check_celebrate_finish() -> None:
    """完成頒星／幣要先播太空戰士獎勵＋粵語，之後先出再玩掣。"""
    js = read("js/celebrate-finish.js")
    css = read("css/celebrate-finish.css")
    if "你好叻啊，完成咗啦，獎勵你一個金幣！" not in js:
        fail("celebrate", "獎勵粵語要係「你好叻啊，完成咗啦，獎勵你一個金幣！」")
    if "kaka-ranger-celebrate.png" not in js or "kaka-ranger-star.png" not in js:
        fail("celebrate", "要重用 kaka-ranger-celebrate.png 同 kaka-ranger-star.png")
    if "speakTerm" not in js:
        fail("celebrate", "獎勵語音要走 speech.js speakTerm")
    if "kaka-celebrate-waiting" not in css or "kaka-celebrate-skip" not in css:
        fail("celebrate", "動畫期間要藏再玩掣，並提供跳過")
    if "position: fixed" not in css or "align-items: center" not in css or "justify-content: center" not in css:
        fail("celebrate", "獨立頁獎勵層要畫面正中固定，唔可以貼頁底")
    if ".play-finish[hidden]" not in css:
        fail("celebrate", "play-finish 用 display:flex 時要守住 [hidden]")
    for page in (
        "index.html",
        "common-sense.html",
        "four-panel-story.html",
        "interview-comics.html",
        "family-storybook.html",
        "family-storybook-en.html",
        "book-scene-demo.html",
        "pth-demo.html",
    ):
        src = read(page)
        if "celebrate-finish.js" not in src:
            fail("celebrate", f"{page} 要載入 celebrate-finish.js")
        if "celebrate-finish.css" not in src:
            fail("celebrate", f"{page} 要載入 celebrate-finish.css")
    for src in (
        "js/app.js",
        "js/phonics-app.js",
        "js/math-app.js",
        "js/common-sense.js",
        "js/four-panel-story.js",
        "js/interview-comics.js",
        "js/family-storybook.js",
        "js/book-scene-demo.js",
    ):
        if "KakaCelebrate" not in read(src):
            fail("celebrate", f"{src} 完成獎勵要呼叫 KakaCelebrate")
    node = shutil.which("node")
    if node:
        result = subprocess.run([node, "scripts/test-celebrate-finish.mjs"], capture_output=True, text=True)
        if result.returncode:
            fail("celebrate", (result.stderr or result.stdout)[-1200:] or "完成獎勵回歸失敗")


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


def check_agent_collab_docs() -> None:
    """確保現行 ChatGPT／Cursor／Grok 分工及 OCR owner 寫入協作文件。"""
    for f in ("CODEX.md", "CLAUDE.md"):
        if not Path(f).exists():
            fail("agent-docs", f"缺少 {f}")
            continue
        if "AGENTS.md" not in read(f):
            fail("agent-docs", f"{f} 要提到 AGENTS.md")
    agents = read("AGENTS.md")
    handover = read("docs/handover.md")
    ocr = read("docs/word-card-ocr.md")
    grok_path = Path("GROK.md")
    if not grok_path.exists():
        fail("agent-docs", "缺少 GROK.md 協作界線")
    for name, src in (("AGENTS.md", agents), ("docs/handover.md", handover)):
        for role in ("ChatGPT", "Cursor", "Grok"):
            if role not in src:
                fail("agent-docs", f"{name} 要記錄現行協作角色 {role}")
    if "字卡相片辨讀由 ChatGPT" not in agents:
        fail("agent-docs", "AGENTS.md 要將字卡辨讀責任交畀 ChatGPT／Codex")
    if "ChatGPT／Codex" not in ocr or "Grok" not in ocr:
        fail("agent-docs", "字卡 OCR 指引要寫清 ChatGPT owner 同 Grok 界線")
    if "Claude Cowork" in ocr or "唔好叫 Cursor 或 Codex／ChatGPT 讀字卡相" in ocr:
        fail("agent-docs", "字卡 OCR 指引仍然鎖死 Claude 或禁止 ChatGPT")


def check_family_smoke_devices() -> None:
    """版面回歸預設家庭裝置：iPad Pro 11 + iPhone 16 Pro Max（慳 CI／agent 時間）。"""
    smoke = read("scripts/smoke-shots.py")
    for needle in ("FAMILY_IPADS", "FAMILY_PHONES", "iPadPro11-直", "iPhone16ProMax-直", "--all"):
        if needle not in smoke:
            fail("family-smoke", f"smoke-shots.py 要有 {needle}（預設家庭裝置；--all 先跑舊全尺寸）")
    if "834, 1210" not in smoke or "430, 932" not in smoke:
        fail("family-smoke", "家庭裝置 viewport 要係最新 iPad Pro 11 834×1210 同 iPhone 16 Pro Max 430×932")


BOOK_SCAN_PDFS = (
    "我的氣球呢.pdf",
    "貪吃的安安.pdf",
    "雨傘.pdf",
    "信.pdf",
    "分果果.pdf",
    "快跑呀.pdf",
    "誰在叫.pdf",
    "黃葉.pdf",
    "一束花.pdf",
    "風跟我玩.pdf",
    "小明和氣球.pdf",
    "冬冬請客.pdf",
)


def check_book_scans_shelf() -> None:
    """家長用《我自己會讀》掃描書架：獨立靜態頁 + 主頁低調入口；唔改識字資料。"""
    shelf = Path("book-scans/index.html")
    if not shelf.exists():
        fail("book-scans", "唔見 book-scans/index.html")
        return
    src = read("book-scans/index.html")
    for name in BOOK_SCAN_PDFS:
        if name not in src:
            fail("book-scans", f"書架未連到 {name}")
    if "唔作外傳" not in src and "不作外傳" not in src:
        fail("book-scans", "書架要有一句屋企自用／唔作外傳說明")
    html = read("index.html")
    if "./book-scans/" not in html:
        fail("book-scans", "主頁要有書本掃描入口（./book-scans/）")
    if "書本掃描" not in html:
        fail("book-scans", "入口文案要寫「書本掃描」")
    if "id=\"screen-home\"" in html:
        home = html.split('id="screen-home"', 1)[1].split("</section>", 1)[0]
        if "書本掃描" not in home:
            fail("book-scans", "書本掃描入口要放喺主頁，唔好塞入小朋友揀 Profile 大卡")


def check_family_names() -> None:
    """故事角色正式名：虹姑姑、蛙蛙、耀叔叔（Keith 2026-10-08）。"""
    for path in (
        "data/family-stories/manifest.js",
        "js/family-storybook.js",
        "data/four-panel-stories.js",
        "js/four-panel-story.js",
    ):
        if not Path(path).is_file():
            continue
        src = read(path)
        for old, new in (("堯叔叔", "耀叔叔"), ("娃娃", "蛙蛙"), ("紅姑姑", "虹姑姑"), ("妹媽", "姨媽")):
            if old in src:
                fail("family-names", f"{path} 用咗舊名「{old}」，要寫「{new}」")
        if re.search(r"(?<!虹)姑姑", src):
            fail("family-names", f"{path} 有單稱「姑姑」，要寫「虹姑姑」")


def check_family_storybook_entry() -> None:
    """獨立中文故事書入口及 provenance/test 邊界必須存在。"""
    html = read("index.html")
    if 'id="btn-topics-family-stories"' not in html or './family-storybook.html' not in html:
        fail("family-storybook", "中文主題頁要有故事小隊入口")
    for path in (
        "family-storybook.html",
        "css/family-storybook.css",
        "js/family-storybook.js",
        "data/family-stories/manifest.js",
        "scripts/check-family-stories.py",
    ):
        if not Path(path).is_file():
            fail("family-storybook", f"缺少獨立故事書檔案：{path}")
    manifest = read("data/family-stories/manifest.js")
    for field in ("sourceBooks", "bookWords", "extensionWords", "pages"):
        if field not in manifest:
            fail("family-storybook", f"故事 manifest 缺少 provenance 欄位：{field}")
    story_html = read("family-storybook.html")
    story_js = read("js/family-storybook.js")
    story_css = read("css/family-storybook.css")
    if 'id="page-reading"' not in story_html or "pageReadingText(page)" not in story_js:
        fail("family-storybook", "敘述和角色對白必須整合成同一段故事文字")
    if any(marker in story_html for marker in ('id="source-note"', 'class="dialogue-bubble"', 'id="page-dialogue"')):
        fail("family-storybook", "故事頁不可顯示每頁來源註記或獨立對白框")
    if ".page-reading" not in story_css or ".dialogue-bubble" in story_css:
        fail("family-storybook", "整合故事文字須使用單一字級樣式，且移除對白框樣式")
    if any(marker in story_html for marker in ('id="mandarin-voice"', 'id="test-voice"', "普通話聲線", "故事為原創內容", 'id="story-voice-toggle"', 'data-story-voice', "普通話")):
        fail("family-storybook", "故事頁唔好再放普通話掣、聲線下拉、試聽或頁腳免責")
    if 'id="back-library"' in story_html or "← 故事書目" in story_html:
        fail("family-storybook", "讀者頁唔好再放「故事書目」第二層返回")
    if 'id="back-chinese"' not in story_html or 'href="index.html#screen-topics"' not in story_html:
        fail("family-storybook", "書目頁頂欄「← 中文」無 history 時要返中文主題頁")
    if "back-chinese" not in story_js or "leaveReader()" not in story_js:
        fail("family-storybook", "閱讀頁「← 中文」要返回故事書目，唔好跳去中文主題根")
    if "goBackOr" not in story_js or "nav-back.js" not in story_html:
        fail("family-storybook", "書目頁「← 中文」有 in-app history 要 history.back，唔好重載跳主頁")
    if 'id="brand-title"' not in story_html or "storyHeading(" not in story_js or "place}：${title}" not in story_js:
        fail("family-storybook", "閱讀頁頂欄要顯示「地點：故事名」")
    if "is-reading" not in story_css or "is-reading" not in story_js:
        fail("family-storybook", "閱讀頁要收起星星進度pill，書目頁先顯示")
    if 'js/speech.js' not in story_html:
        fail("family-storybook", "故事頁要載入 speech.js 做粵語揀聲同 iOS 解鎖")
    if "chinese-mandarin" in story_js or "assets/chinese-mandarin" in story_html:
        fail("family-storybook", "故事朗讀唔好用認字牆普通話 m4a")
    if "zh-HK" not in story_js or "speakStory(" not in story_js or "unlockSpeech" not in story_js:
        fail("family-storybook", "故事朗讀只用粵語 speechSynthesis 讀當頁文字，並要解鎖 iOS 語音")
    if any(marker in story_js for marker in ("pickMandarinVoice", "voiceMode === 'cmn'", "zh-CN")):
        fail("family-storybook", "故事頁唔好再留普通話朗讀路徑")
    if "guardian-unlock" not in story_html or "guardian-unlock" not in story_js:
        fail("family-storybook", "播唔到語音時要保留家長朗讀後備")
    after = re.search(r"function afterPageHeard\([\s\S]*?\n  \}", story_js)
    if not after:
        fail("family-storybook", "聽本頁要有 afterPageHeard 解鎖填詞")
    elif "audioLocked = true" in after.group(0) or "speakStory(" in after.group(0):
        fail("family-storybook", "聽本頁第一遍完就要解鎖詞語掣，唔好再播第二遍先解鎖")
    if "再玩一次" not in story_html or 'id="replay-story"' not in story_html or "replayCurrentStory" not in story_js:
        fail("family-storybook", "完成獎勵後要有再玩一次，可保留返回故事書目")
    if "scrollHeight" in story_js:
        fail("family-storybook", "完成獎勵唔好捲去頁底")
    if "root: completion" not in story_js or "story-finish-actions" not in story_js:
        fail("family-storybook", "完成獎勵要喺正中 completion 層播，播完先出掣")
    for hid in ("park-kite", "red-balloon", "zhuhai-aquarium", "chimelong-safari"):
        if f"id:'{hid}', hidden:true" not in manifest and f'id:"{hid}", hidden:true' not in manifest:
            fail("family-storybook", f"{hid} 要 hidden:true，小朋友書架唔好見到")
    if "!story.hidden && !story.retired" not in story_js:
        fail("family-storybook", "書架要過濾 hidden/retired 故事")
    hover = re.search(r"\.word-choice:not\(:disabled\):hover[\s\S]*?\}", story_css)
    if hover and re.search(r"translateY|animation\s*:", hover.group(0)):
        fail("family-storybook", "詞語池 word-choice 唔可以 bounce／flash／shake")
    if re.search(r"@keyframes[^{]*(shake|bounce|pulse|flash|wiggle)", story_css, re.I):
        fail("family-storybook", "家庭故事 CSS 唔好用 shake／bounce／pulse／flash keyframes 喺詞語掣")
    if "if (!state.wordPool)" not in story_js or "state.wordPool = shuffle" not in story_js or "const pool = state.wordPool" not in story_js:
        fail("family-storybook", "詞語池順序要喺入頁時固定，撳字磚／答錯／提交唔好再 shuffle")
    if story_js.count("shuffle(") != 3 or "imageOrder: shuffle" not in story_js or "wordOrder: shuffle" not in story_js:
        fail("family-storybook", "shuffle() 只可以喺填詞池同熱身圖／字首次入頁各叫一次")
    if 'id="warmup"' not in story_html or "圖字配對熱身" not in story_html or "beginWarmup" not in story_js:
        fail("family-storybook", "《中山開心農莊》要有圖字配對熱身，配齊先入填空")
    warmup_html = story_html.split('id="warmup"', 1)[-1].split('id="reader"', 1)[0]
    if any(marker in warmup_html for marker in ("檢查", "Check", "生命", "愛心", "lives")):
        fail("family-storybook", "熱身唔可以有檢查掣、生命或愛心")
    if "图字" in story_html or "配对" in story_html or "热身" in story_html:
        fail("family-storybook", "熱身介面要用繁體中文")
    if "leaveWarmup" not in story_js or "is-warmup" not in story_js:
        fail("family-storybook", "熱身頂欄←要返書目；填空有熱身要返熱身，唔好跳主頁")
    if "← 書目" not in story_js or "← 熱身" not in story_js:
        fail("family-storybook", "熱身頂欄要寫「← 書目」，農莊填空要寫「← 熱身」")
    if "speakPlacedChip(word, true)" not in story_js or "speakPlacedChip(word, false)" not in story_js:
        fail("family-storybook", "熱身撳圖要粵語讀詞；答對要重用填空粵語讀詞再叮聲")
    if "warmup-listen" not in story_js or "stopPropagation" not in story_js:
        fail("family-storybook", "熱身圖／字要有只聽唔選嘅喇叭")
    if "唔係呢個，再試吓" not in story_js or story_js.count("warmupState.selected = null") != 1:
        fail("family-storybook", "錯配要清楚提示並保留原先選中，等下一掣啱字即計分")
    if ", 2200)" not in story_js or "#warmup-feedback.success" not in story_css:
        fail("family-storybook", "配齊提示要放大，並稍停先入填空")
    if ".warmup-picture" not in story_css or "4 / 3" not in story_css or "object-fit: cover" not in story_css:
        fail("family-storybook", "熱身插圖框要約 4:3 填滿，唔好左右大白邊")
    if "speakPlacedChip" not in story_js or "speakThen" not in story_js or "playCorrectCue" not in story_js:
        fail("family-storybook", "答對填入空格要先粵語讀該詞，再叮一聲")
    activity_html = story_html.split('id="activity"', 1)[-1].split('id="completion"', 1)[0]
    if "reader-controls" not in activity_html or "next-page" not in activity_html:
        fail("family-storybook", "下一頁要喺填詞欄附近，iPad 唔使捲先見到")
    if ".storybook-shell.is-reading" not in story_css or "align-items: start" not in story_css:
        fail("family-storybook", "閱讀頁要收緊詞語池／句子／下一頁間距")
    node = shutil.which("node")
    if node:
        result = subprocess.run([node, "scripts/test-family-storybook.mjs"], capture_output=True, text=True)
        if result.returncode:
            fail("family-storybook", (result.stderr or result.stdout)[-1200:] or "家庭故事驗收回歸失敗")


def check_four_panel_story() -> None:
    """獨立四格講故事：中文入口、本機錄音、小朋友自己檢查＋家長確認領星，唔混入填空故事。"""
    html = read("index.html")
    if 'id="btn-topics-four-panel"' not in html or "./four-panel-story.html" not in html:
        fail("four-panel", "中文主題頁要有「四格講故事」獨立入口")
    if "四格講故事" not in html:
        fail("four-panel", "中文主題頁入口要寫「四格講故事」")
    for path in (
        "four-panel-story.html",
        "css/four-panel-story.css",
        "js/four-panel-story.js",
        "data/four-panel-stories.js",
        "scripts/test-four-panel-story.mjs",
    ):
        if not Path(path).is_file():
            fail("four-panel", f"缺少獨立四格講故事檔案：{path}")
    page = read("four-panel-story.html")
    js = read("js/four-panel-story.js")
    data = read("data/four-panel-stories.js")
    story_js = read("js/family-storybook.js")
    story_html = read("family-storybook.html")
    if "MediaRecorder" in story_js or "getUserMedia" in story_js:
        fail("four-panel", "family-storybook 填空頁唔好混入錄音講故事")
    if "四格講故事" in story_html or "btn-record" in story_html:
        fail("four-panel", "family-storybook.html 唔好加四格講故事畫面")
    if "MediaRecorder" not in js or "getUserMedia" not in js:
        fail("four-panel", "四格講故事要用本機 MediaRecorder／getUserMedia")
    if "fetch(" in js or "XMLHttpRequest" in js or "FormData" in js:
        fail("four-panel", "錄音唔可以上傳；唔准 fetch／XHR／FormData")
    if "webkitSpeechRecognition" in js or "SpeechRecognition" in js:
        fail("four-panel", "唔好做 ASR／轉文字")
    if "2/5" in js or "五星" in js or "star-rating" in js or "半星" in js or "half-star" in js:
        fail("four-panel", "唔好做假 2/5 星或半星評分")
    if "第一、然後、後來、最後，同我講個故事啦" not in data:
        fail("four-panel", "提示要係粵語「第一、然後、後來、最後，同我講個故事啦」")
    if "點此兒" in data or "点此儿" in data or "點此兒" in js:
        fail("four-panel", "關卡牆入口唔好寫「點此兒開始」；要用「點此開始」")
    if "點此開始" not in data:
        fail("four-panel", "關卡牆入口要寫「點此開始」")
    if "previewComicBeat" not in js or "onComicHit" not in js or "previewWallBeat" not in js:
        fail("four-panel", "關卡牆同等錄音／錄音中都要撳得亮四格；評分仍喺回放後先計")
    for check in (
        "講齊四格？",
        "有然後／最後？",
        "敢講完？",
        "再錄一次",
        "我講齊喇",
        "我講大聲",
        "我講完喇",
        "再講一次呀",
        "小朋友話自己做到喇",
    ):
        if check not in page:
            fail("four-panel", f"完成流程缺少「{check}」")
    if "kid-panels" not in page or "kid-self" not in page:
        fail("four-panel", "回放之後要有小朋友撳亮四格同自己檢查")
    if "bothSidesAgree" not in js:
        fail("four-panel", "領星要兩邊同意：小朋友自己檢查＋家長確認")
    if "錄音只留喺呢部機" not in page or "唔會上傳" not in page:
        fail("four-panel", "要有清楚嘅咪高峰／本機錄音私隱說明")
    if "rainbow-umbrella" not in data:
        fail("four-panel", "MVP 第一本要係 rainbow-umbrella／回家路上")
    for panel in (
        "rainbow-umbrella-p01.webp",
        "rainbow-umbrella-p02.webp",
        "rainbow-umbrella-p04.webp",
        "rainbow-umbrella-p06.webp",
    ):
        rel = f"assets/family-stories/scenes/{panel}"
        if rel not in data:
            fail("four-panel", f"回家路上四格要引用 {rel}")
        if not Path(rel).is_file():
            fail("four-panel", f"缺少四格圖：{rel}")
    if "p03.webp" in data or "p05.webp" in data:
        fail("four-panel", "回家路上四格應係 p01／p02／p04／p06，唔好用 p03／p05")
    if "tryEarnStar" not in js or "markTopicPassed" not in js:
        fail("four-panel", "兩邊同意之後要用現有星星／passedKeys 完成")
    if "js/speech.js" not in page:
        fail("four-panel", "提示／示範要用 speech.js 粵語 TTS")
    if 'href="index.html#screen-topics"' not in page:
        fail("four-panel", "關卡牆「← 中文」無 history 時要返中文主題，唔好跳主頁")
    if "leavePlay()" not in js or "goBackOr" not in js or "nav-back.js" not in page:
        fail("four-panel", "玩時有熱身就「← 選路」；無熱身先「← 關卡」；牆頂欄有 history 要返上一層")
    if 'id="warmup"' not in page or 'id="path"' not in page or 'id="listen"' not in page:
        fail("four-panel", "回家路上要有排圖熱身、選路同聽範讀畫面")
    if "聽範讀" not in page or "去講" not in page:
        fail("four-panel", "排好之後要拆開「聽範讀」同「去講」兩條路")
    if "beginWarmup" not in js or "placeWarmupSlot" not in js or "唔係呢格，再試吓" not in js:
        fail("four-panel", "排圖熱身要撳圖入格，錯格溫柔提示")
    if "sortWarmup" not in data:
        fail("four-panel", "只有標咗 sortWarmup 嘅書先開排圖熱身")
    if "tryEarnStar" not in js.split("function beginWarmup", 1)[-1].split("function leaveWarmup", 1)[0]:
        pass
    else:
        fail("four-panel", "熱身唔可以領大星／幣")
    if "draggable=\"true\"" in js or "ondragstart" in js:
        fail("four-panel", "排圖熱身唔好做拖曳")
    if "✕" in js or "❌" in js or "紅叉" in js:
        fail("four-panel", "錯格唔好用紅叉")
    node = shutil.which("node")
    if node:
        result = subprocess.run([node, "scripts/test-four-panel-story.mjs"], capture_output=True, text=True)
        if result.returncode:
            fail("four-panel", (result.stdout or result.stderr or "四格講故事檢查失敗").strip()[:800])
    else:
        notes.append("冇 node，跳過四格講故事單元測試")


def check_family_storybook_en_entry() -> None:
    """獨立英文家庭故事殼：平行中文故事小隊，唔伸延 Little Fox。"""
    html = read("index.html")
    story_demo = read("js/story-demo.js")
    if 'id="btn-english-family-stories"' not in html or './family-storybook-en.html' not in html:
        fail("family-storybook-en", "英文 hub 要有家庭故事入口，平行 Little Fox")
    hub = html.split('id="screen-english-hub"', 1)[1].split('id="screen-phonics-topics"', 1)[0] if 'id="screen-english-hub"' in html else ""
    if 'id="btn-english-family-stories"' not in hub:
        fail("family-storybook-en", "英文 hub 可保留家庭故事入口")
    series_block = re.search(r"const SERIES = \[(.*?)\];", story_demo, re.S)
    series_ids = re.findall(r"id:\s*'([^']+)'", series_block.group(1)) if series_block else []
    if series_ids != ["carter", "magic-marker", "wacky-ricky"]:
        fail("family-storybook-en", "Little Fox SERIES 只可以係 Carter／Magic Marker／Wacky Ricky；家庭故事用獨立卡")
    if "family-stories-en" not in story_demo or "family-storybook-en.html" not in story_demo:
        fail("family-storybook-en", "Story Reading 系列揀選頁要有家庭故事第四張卡，連去 family-storybook-en.html")
    if "rainbow-umbrella" not in story_demo and "park-kite" not in story_demo:
        fail("family-storybook-en", "系列卡縮圖要重用家庭故事場景圖")
    if "2 books" not in story_demo:
        fail("family-storybook-en", "系列卡 meta 要寫 2 books")
    if "Karl" not in story_demo or "HeiHei" not in story_demo or "Froggie" not in story_demo:
        fail("family-storybook-en", "系列卡要寫 Karl、HeiHei、Froggie")
    if "littleFoxCards + familyCard" not in story_demo:
        fail("family-storybook-en", "家庭故事卡要排喺三張 Little Fox 卡下面")
    series_screen = html.split('id="screen-story-series"', 1)[1].split('id="screen-story-demo"', 1)[0] if 'id="screen-story-series"' in html else ""
    if "← 英文學習" not in series_screen or "<h1>英文故事書</h1>" not in series_screen:
        fail("family-storybook-en", "系列揀選頁要留「← 英文學習」同標題「英文故事書」")
    if any(label in series_screen for label in ("選擇故事系列", "Little Fox 系列", "LITTLE FOX")):
        fail("family-storybook-en", "系列揀選頁唔好再寫「選擇故事系列」「Little Fox 系列」或 LITTLE FOX eyebrow")
    for path in (
        "family-storybook-en.html",
        "css/family-storybook-en.css",
        "js/family-storybook-en.js",
        "data/family-stories/manifest-en.js",
        "scripts/check-family-stories-en.py",
    ):
        if not Path(path).is_file():
            fail("family-storybook-en", f"缺少獨立英文故事書檔案：{path}")
    story_html = read("family-storybook-en.html")
    story_js = read("js/family-storybook-en.js")
    manifest = read("data/family-stories/manifest-en.js")
    if "story-demo.js" in story_html or "story-demo.js" in story_js or "KakaStoryDemo" in story_js:
        fail("family-storybook-en", "英文家庭故事唔可以伸延 Little Fox story-demo.js")
    if "FAMILY_STORIES_EN" not in manifest or "rainbow-umbrella" not in manifest or "park-kite" not in manifest:
        fail("family-storybook-en", "英文 manifest 要有 rainbow-umbrella 同 park-kite")
    if "HeiHei" not in manifest or "Karl" not in manifest or "Froggie" not in manifest:
        fail("family-storybook-en", "英文故事角色名要係 Karl、HeiHei、Froggie")
    if any(bad in manifest for bad in ("Heihei", "禧禧", "卡卡", "蛙蛙")):
        fail("family-storybook-en", "英文故事要用 HeiHei 拼法，唔好用中文名或 Heihei")
    if 'id="page-reading"' not in story_html or "pageReadingText(page)" not in story_js:
        fail("family-storybook-en", "敘述和角色對白必須整合成同一段故事文字")
    if any(marker in story_html for marker in ('id="source-note"', 'class="dialogue-bubble"', 'id="page-dialogue"')):
        fail("family-storybook-en", "故事頁不可顯示每頁來源註記或獨立對白框")
    if 'id="back-library"' in story_html or "← 故事書目" in story_html:
        fail("family-storybook-en", "讀者頁唔好再放「故事書目」第二層返回")
    if 'id="back-english"' not in story_html or 'href="index.html#screen-story-series"' not in story_html:
        fail("family-storybook-en", "書目頁頂欄「← English」無 history 時要返故事系列揀選頁，唔好跳主頁或主題詞根")
    if "screen-english-hub" in story_html.split('id="back-english"', 1)[-1][:120]:
        fail("family-storybook-en", "書目頁「← English」唔好寫死英文 hub；系列卡要返系列揀選頁")
    if "back-english" not in story_js or "leaveReader()" not in story_js or "place}: ${title}" not in story_js:
        fail("family-storybook-en", "閱讀頁「← English」要返回 EN 書目，頂欄要顯示 place: story")
    if "goBackOr" not in story_js or "nav-back.js" not in story_html:
        fail("family-storybook-en", "書目頁「← English」有 in-app history 要 history.back")
    if "is-reading" not in story_js:
        fail("family-storybook-en", "閱讀頁要收起星星進度 pill，書目頁先顯示")
    if "js/speech.js" not in story_html or "speakEnglishTerm" not in story_js or "warmEnglishVoice" not in story_js:
        fail("family-storybook-en", "英文家庭故事要用 speech.js 嘅 speakEnglishTerm／en-US")
    if "zh-HK" in story_js or "zh-CN" in story_js or "chinese-mandarin" in story_js:
        fail("family-storybook-en", "英文家庭故事唔好走粵語／普通話朗讀路徑")
    if "guardian-unlock" not in story_html or "guardian-unlock" not in story_js:
        fail("family-storybook-en", "播唔到語音時要保留家長朗讀後備")
    if "if (!state.wordPool)" not in story_js or "state.wordPool = shuffle" not in story_js or "const pool = state.wordPool" not in story_js:
        fail("family-storybook-en", "英文詞語池順序要喺入頁時固定，撳字磚唔好再 shuffle")
    if story_js.count("shuffle(") != 1:
        fail("family-storybook-en", "英文 shuffle() 只可以喺入頁第一次組詞語池時叫一次")
    node = shutil.which("node")
    if node:
        result = subprocess.run([sys.executable, "scripts/check-family-stories-en.py"], capture_output=True, text=True)
        if result.returncode:
            fail("family-storybook-en", (result.stdout or result.stderr or "英文家庭故事檢查失敗").strip()[:800])
    else:
        notes.append("冇 node，跳過英文家庭故事內容檢查（CI 一定會跑）")


def check_asset_weight() -> None:
    """效能：單檔唔好超過 400KB，所有遊戲共用 assets/ 唔好超過 300MB。"""
    total = 0
    for p in Path("assets").rglob("*"):
        if p.is_file():
            size = p.stat().st_size
            total += size
            if size > 400_000:
                fail("asset-weight", f"{p} 有 {size // 1024}KB（上限 400KB，請先縮圖／轉 WebP）")
    if total > 300_000_000:
        fail("asset-weight", f"assets/ 合共 {total // 1_000_000}MB，超過 300MB 上限")
    notes.append(f"assets/ 合共 {total / 1_000_000:.2f}MB")


def check_pth_contract() -> None:
    """PTH content/audio/progress share one executable contract, not string snapshots."""
    node = shutil.which("node")
    if not node:
        fail("pth-contract", "需要 node 執行 PTH 教材／音檔／進度檢查")
        return
    result = subprocess.run([node, "scripts/test-pth-content.mjs"], capture_output=True, text=True)
    if result.returncode:
        fail("pth-contract", result.stderr[-1200:] or "PTH 回歸失敗")


def check_carter_family_blanks() -> None:
    """Carter Family 填空用內容詞，每頁都要有格，唔用人名／虛詞。"""
    result = subprocess.run(
        [sys.executable, "scripts/test-carter-family-blanks.py"],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        fail("carter-family-blanks", (result.stderr or result.stdout)[-1200:] or "Carter Family 填空檢查失敗")


def check_wacky_ricky_blanks() -> None:
    """Wacky Ricky／Little Fox 填空唔可以用人名、稱謂或英文虛詞。"""
    result = subprocess.run(
        [sys.executable, "scripts/test-wacky-ricky-blanks.py"],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        fail("wacky-ricky-blanks", (result.stderr or result.stdout)[-1200:] or "Wacky Ricky 填空檢查失敗")


def check_magic_marker_blanks() -> None:
    """Magic Marker 填空用內容詞，每頁都要有格，唔用系列人名／虛詞。"""
    result = subprocess.run(
        [sys.executable, "scripts/test-magic-marker-blanks.py"],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        fail("magic-marker-blanks", (result.stderr or result.stdout)[-1200:] or "Magic Marker 填空檢查失敗")


def check_common_sense() -> None:
    """主頁頂層常識樂園：多包 schema、P0–P7 答題、P3 地圖、P7 過程、B1–B3 面試四格。"""
    for path in (
        "common-sense.html",
        "css/common-sense.css",
        "js/common-sense.js",
        "data/common-sense-catalog.js",
        "data/common-sense-heroes.js",
        "data/common-sense-safe-outing.js",
        "data/common-sense-manners-hygiene.js",
        "data/common-sense-transport-hk.js",
        "data/common-sense-weather-seasons.js",
        "data/common-sense-festivals-hk.js",
        "data/common-sense-recycle-green.js",
        "data/common-sense-food-health.js",
        "assets/common-sense/mtr-family-map.svg",
        "assets/common-sense/process/milk-1.webp",
        "assets/common-sense/process/bread-1.webp",
        "assets/common-sense/scenes/red-light.webp",
        "assets/common-sense/scenes/priority.webp",
        "assets/common-sense/scenes/yisheng.webp",
        "assets/common-sense/scenes/laoshi_job.webp",
        "assets/common-sense/scenes/season-spring.webp",
        "assets/common-sense/scenes/hotpot.webp",
        "interview-comics.html",
        "css/interview-comics.css",
        "js/interview-comics.js",
        "data/interview-comics.js",
        "scripts/test-common-sense.mjs",
        "scripts/test-interview-comics.mjs",
        "assets/home-subjects/common-sense.webp",
    ):
        if not Path(path).exists():
            fail("common-sense", f"缺少 {path}")
    js = read("js/common-sense.js")
    html = read("common-sense.html")
    if "earnCoinForMode" not in js or "common-sense-heroes" not in js:
        fail("common-sense", "完成一輪要呼叫 earnCoinForMode")
    if "今日已攞" not in js:
        fail("common-sense", "同一日重玩要講今日已攞，唔好誤導再領幣")
    if "← 包牆" in js or "view === 'learn' || view === 'finish'" in js:
        fail("common-sense", "線 A 過關頂欄要返學習牆，唔好跳過")
    if "開始答題" not in html:
        fail("common-sense", "學習牆要有開始答題")
    if "即將推出" in html:
        fail("common-sense", "未實作主題要隱藏，唔好再寫即將推出")
    if "speakMandarinTerm" not in read("js/speech.js") or "zh-CN" not in js:
        fail("common-sense", "節日生字要有普通話 zh-CN 發音")
    if "type === 'comics'" not in js:
        fail("common-sense", "飲食包要有牛奶／麵包連環圖")
    if "currentSeason" not in js or "openSeason" not in js:
        fail("common-sense", "天氣包要有四季入口同季節頁")
    if "← ${currentSeason.name}" not in js or "← 季節" in js:
        fail("common-sense", "答題返回要寫季節名，例如 ← 夏天")
    if "if (currentSeason) return seasonQuizItems(currentSeason)" not in js:
        fail("common-sense", "由季節入去答題只可以抽該季題目")
    if "cs-media" not in js or "cs-shimmer" not in read("css/common-sense.css"):
        fail("common-sense", "常識圖要有載入佔位同 shimmer")
    if 'class="cs-shimmer"' not in js and "cs-shimmer" not in html:
        fail("common-sense", "載入佔位要有可見 .cs-shimmer 元素")
    weather_src = read("data/common-sense-weather-seasons.js")
    if '"kind": "seasons"' not in weather_src or weather_src.count('"id": "spring"') < 1:
        fail("common-sense", "天氣同四季要分春夏秋冬四個入口")
    if "draggable" in js or "有講" in js:
        fail("common-sense", "線 A 唔好做拖一拖或家長開口閘")
    if "quiz-frame" not in html or "choice-speak" not in js:
        fail("common-sense", "答題圖要 4:3 畫框，每項答案要有獨立聽掣")
    if "ASK_UNLOCK_MS" not in js or "speak(quizLine" not in js:
        fail("common-sense", "答題要先播職業短句再判；聽一聽問句最多約 2 秒解鎖")
    listen_tail = js.split("$('btn-quiz-listen')?.addEventListener", 1)
    if (
        len(listen_tail) < 2
        or "speak(q.ask)" not in listen_tail[-1][:220]
        or "q.audio" in listen_tail[-1][:220]
    ):
        fail("common-sense", "答題聽一聽只准播短問句，唔好播長全文")
    heroes_src = read("data/common-sense-heroes.js")
    if re.search(r"image:\s*['\"]assets/careers/", heroes_src):
        fail("common-sense", "社區小英雄答題圖要填滿 4:3，唔好再用方形 careers 字卡")
    try:
        from PIL import Image  # type: ignore
    except ImportError:
        Image = None  # type: ignore
    if Image:
        for rel in re.findall(r"image:\s*['\"]([^'\"]+)['\"]", heroes_src):
            path = Path(rel)
            if not path.exists():
                fail("common-sense", f"缺少職業答題圖 {rel}")
                continue
            with Image.open(path) as im:
                w, h = im.size
            if h <= 0 or abs((w / h) - (4 / 3)) > 0.04:
                fail("common-sense", f"{rel} 要係 4:3 橫圖，而家 {w}×{h}")
    catalog = read("data/common-sense-catalog.js")
    if "interview-comics.html" not in catalog:
        fail("common-sense", "面試四格入口要喺常識 hub")
    if "非官方" not in read("assets/common-sense/mtr-family-map.svg"):
        fail("common-sense", "港鐵示意地圖要標非官方")
    node = shutil.which("node")
    if node:
        result = subprocess.run([node, "scripts/test-common-sense.mjs"], capture_output=True, text=True)
        if result.returncode:
            fail("common-sense", (result.stdout or result.stderr or "常識樂園檢查失敗").strip()[:800])
        comics = subprocess.run([node, "scripts/test-interview-comics.mjs"], capture_output=True, text=True)
        if comics.returncode:
            fail("common-sense", (comics.stdout or comics.stderr or "面試四格檢查失敗").strip()[:800])
    else:
        notes.append("冇 node，跳過常識樂園單元測試")


def check_one_level_back() -> None:
    """頂欄返回只准返上一層：有 history 就 back，否則父畫面 hash；唔好重載跌主頁。"""
    nav = read("js/nav-back.js")
    app = read("js/app.js")
    index = read("index.html")
    if "function goBackOr" not in nav or "history.back()" not in nav:
        fail("one-level-back", "js/nav-back.js 要提供 goBackOr／history.back")
    if "applyLocationHash" not in app or "kaka-return-screen" not in app or "back_forward" not in app:
        fail("one-level-back", "index 要記住離開前畫面，history.back 先還原，並認父畫面 hash")
    for marker in ("screen-topics", "screen-english-hub", "screen-story-series", "screen-home"):
        if marker not in app:
            fail("one-level-back", f"hash／返回還原缺少 {marker}")
    if "nav-back.js" not in index or "applyLocationHash" not in index:
        fail("one-level-back", "index.html 要載入 nav-back 並喺 load 後套用 hash")
    common = read("common-sense.html")
    if 'href="index.html#screen-home"' not in common or "nav-back.js" not in common:
        fail("one-level-back", "常識樂園頂欄無 history 時要返主頁畫面，唔好重載跌去揀小朋友")
    comics = read("interview-comics.html")
    if 'href="common-sense.html"' not in comics or "nav-back.js" not in comics:
        fail("one-level-back", "面試四格無 history 時要返常識 hub，唔好跳中文或主頁")
    if "← 中文" in comics:
        fail("one-level-back", "面試四格文案唔可以寫返中文")
    if "showScreen('home')" in read("js/app.js").split("btn-back-sentence")[1][:200]:
        fail("one-level-back", "砌句子遊戲頂欄唔可以跳主頁")
    scene = read("book-scene-demo.html")
    if 'href="index.html#screen-topics"' not in scene or "nav-back.js" not in scene:
        fail("one-level-back", "書頁砌句「← 中文」要返中文主題，唔好裸 index.html")
    if re.search(r'class="scene-back"[^>]*href="index\.html"', scene):
        fail("one-level-back", "書頁砌句頂欄唔可以用裸 index.html")
    pth = read("pth-demo.html")
    if 'href="index.html#screen-home"' not in pth or "nav-back.js" not in pth:
        fail("one-level-back", "普通話頂欄無 history 時要返主頁畫面，唔好重載跌去揀小朋友")
    node = shutil.which("node")
    if node:
        result = subprocess.run([node, "scripts/test-nav-back.mjs"], capture_output=True, text=True)
        if result.returncode:
            fail("one-level-back", (result.stdout or result.stderr or "一層返回測試失敗").strip()[:800])
    else:
        notes.append("冇 node，跳過一層返回單元測試")


def check_chinese_mandarin() -> None:
    """中文詞語牆普通話：每個一般詞語要有預錄音，講法／manifest 唔可以過期。"""
    node = shutil.which("node")
    if not node:
        fail("chinese-mandarin", "需要 node 執行中文普通話錄音檢查")
        return
    result = subprocess.run([node, "scripts/test-chinese-mandarin.mjs"], capture_output=True, text=True)
    if result.returncode:
        fail("chinese-mandarin", result.stderr[-1200:] or "中文普通話錄音檢查失敗")


CHECKS = [
    check_pth_contract,
    check_chinese_mandarin,
    check_js_syntax,
    check_no_build_step,
    check_cache_bust_tags,
    check_safe_auto_update,
    check_core_animals,
    check_deer_rules,
    check_word_ids_unique,
    check_word_data_integrity,
    check_answer_contrast,
    check_openmoji_coverage,
    check_emoji_disc,
    check_voice_picker,
    check_coin_chip,
    check_build_ghost,
    check_star_rules,
    check_profiles,
    check_ranger_mirror_dodge,
    check_no_zoom,
    check_three_entries,
    check_story_next_reachable,
    check_phonics_ranger_theme,
    check_phonics_sound_energy,
    check_phonics_skill_tracking,
    check_storage_isolation,
    check_module_isolation,
    check_addition_planet,
    check_math_boot_guard,
    check_math_planets_scope,
    check_asset_refs,
    check_asset_manifests,
    check_image_formats,
    check_font_coverage,
    check_polyphone_say,
    check_match_naming,
    check_match_mode_hidden,
    check_connect_picture_scale,
    check_celebrate_finish,
    check_learn_finish_always,
    check_cjk_halfwidth_punct,
    check_agent_collab_docs,
    check_family_smoke_devices,
    check_book_scans_shelf,
    check_family_storybook_entry,
    check_four_panel_story,
    check_family_storybook_en_entry,
    check_common_sense,
    check_one_level_back,
    check_family_names,
    check_carter_family_blanks,
    check_wacky_ricky_blanks,
    check_magic_marker_blanks,
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
