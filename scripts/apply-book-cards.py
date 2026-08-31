#!/usr/bin/env python3
"""字卡相片 → words.js：把「認字卡單字」寫入指定書本。

流程（見 docs/word-card-ocr.md）：
  1. Keith 影字卡相 → 上載去 Claude（Cowork）
  2. Claude 睇相、逐張核對，寫成 data/book-cards/<book_id>.json
  3. 呢個 script 做確定性驗證 + 寫入 js/words.js（唔靠模型記憶）

用法：
    python3 scripts/apply-book-cards.py data/book-cards/rb_qiqiu.json          # dry-run，只出報告
    python3 scripts/apply-book-cards.py data/book-cards/rb_qiqiu.json --write  # 真係改 words.js
    python3 scripts/apply-book-cards.py --all --write
    加 --sync-topic：順手把新字加入該輯嘅主題總表（例如「全部紅輯」）

設計重點：模型只負責「睇相 → 出 JSON」，所有 mapping、覆寫、校驗都係死板 code，
出錯會停低同報錯，唔會靜靜哋寫錯字入去。
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORDS_JS = ROOT / "js" / "words.js"

# 常見簡體字（幼兒書常見範圍）→ 繁體；OCR 最易喺呢度出事
SIMPLIFIED = {
    "个": "個", "们": "們", "过": "過", "还": "還", "这": "這", "么": "麼", "来": "來",
    "说": "說", "话": "話", "时": "時", "对": "對", "开": "開", "关": "關", "门": "門",
    "问": "問", "题": "題", "东": "東", "车": "車", "马": "馬", "鸟": "鳥", "鱼": "魚",
    "虫": "蟲", "见": "見", "贝": "貝", "页": "頁", "风": "風", "飞": "飛", "长": "長",
    "为": "為", "书": "書", "画": "畫", "点": "點", "热": "熱", "爱": "愛", "岁": "歲",
    "会": "會", "学": "學", "习": "習", "样": "樣", "边": "邊", "里": "裡", "国": "國",
    "园": "園", "图": "圖", "买": "買", "卖": "賣", "读": "讀", "写": "寫", "听": "聽",
    "谁": "誰", "给": "給", "红": "紅", "绿": "綠", "蓝": "藍", "黄": "黃", "亲": "親",
    "妈": "媽", "头": "頭", "脸": "臉", "发": "髮", "体": "體", "习": "習", "乐": "樂",
    "笔": "筆", "纸": "紙", "线": "線", "带": "帶", "帮": "幫", "让": "讓", "认": "認",
    "识": "識", "记": "記", "汉": "漢", "语": "語", "声": "聲", "响": "響", "静": "靜",
    "闹": "鬧", "饿": "餓", "饭": "飯", "面": "麵", "鸡": "雞", "鸭": "鴨", "猪": "豬",
    "羊": "羊", "鹅": "鵝", "龙": "龍", "虾": "蝦", "蟹": "蟹", "树": "樹", "叶": "葉",
    "云": "雲", "电": "電", "雪": "雪", "阳": "陽", "阴": "陰", "队": "隊", "别": "別",
}

# 形近／易混字組：OCR 最常喺呢啲位置出錯，中咗要人手 double check 返張相
CONFUSABLE = [
    set("己已巳"), set("日曰目"), set("未末"), set("天夭"), set("千干"), set("士土"),
    set("人入八"), set("大太犬"), set("木禾术"), set("手毛"), set("白自"), set("玉王"),
    set("買賣"), set("刀力"), set("戌戍戊"), set("兔免"), set("鳥烏"), set("特持"),
    set("問間聞"), set("洗冼"), set("汗汙"), set("拆折"), set("往住"), set("象像"),
    set("辦辨"), set("暖援"), set("鍋渦"), set("媽嗎馬"), set("清青情請晴"),
]


def load_words_js() -> str:
    return WORDS_JS.read_text(encoding="utf-8")


def parse_words(src: str) -> dict[str, str]:
    """id → term（唔用 JS runtime，純文字 parse，避免副作用）。"""
    out = {}
    for m in re.finditer(r"\{\s*id:\s*'([^']+)'\s*,\s*term:\s*'([^']+)'", src):
        out[m.group(1)] = m.group(2)
    return out


def find_book(src: str, book_id: str):
    """返回 (整段 book object 文字, wordIds 內容文字, span)。"""
    m = re.search(r"\{\s*id:\s*'" + re.escape(book_id) + r"'[^{}]*?wordIds:\s*\[(.*?)\]", src, re.S)
    if not m:
        return None
    return m.group(0), m.group(1), m.span(1)


def find_topic_wordids(src: str, topic_id: str):
    m = re.search(r"id:\s*'" + re.escape(topic_id) + r"'.*?wordIds:\s*\[(.*?)\]", src, re.S)
    return (m.group(1), m.span(1)) if m else (None, None)


def ids_in(block: str) -> list[str]:
    return re.findall(r"'([^']+)'", block)


def check_cards(spec: dict, id2term: dict[str, str], prev_ids: list[str]) -> tuple[list[str], list[str], list[str]]:
    """返回 (resolved_ids, errors, warnings)。"""
    errors, warnings, resolved = [], [], []
    term2ids: dict[str, list[str]] = {}
    for i, t in id2term.items():
        term2ids.setdefault(t, []).append(i)
    prev_chars = {id2term.get(i, "") for i in prev_ids}

    seen = set()
    for n, card in enumerate(spec["cards"], 1):
        ch = card["char"].strip()
        want_id = card.get("id")

        if ch in SIMPLIFIED:
            errors.append(f"第 {n} 張「{ch}」係簡體，繁體應該係「{SIMPLIFIED[ch]}」——請返去對返張相")
            continue
        if len(ch) != 1 and not spec.get("allow_words"):
            errors.append(f"第 {n} 張「{ch}」唔係單字。書卡規則：學習卡＝實體認字卡嘅單字。"
                          f"（真係要收詞，喺 JSON 加 \"allow_words\": true）")
            continue
        if ch in seen:
            warnings.append(f"第 {n} 張「{ch}」喺同一本書出現多過一次，已自動去重（正常，照收）")
            continue
        seen.add(ch)

        for group in CONFUSABLE:
            if ch in group and ch not in prev_chars:
                warnings.append(f"第 {n} 張「{ch}」屬易混組 {''.join(sorted(group))}，"
                                f"而且唔喺原本推測入面 → 請再睇多次張相確認")

        if want_id:
            if want_id not in id2term:
                errors.append(f"第 {n} 張「{ch}」指定 id '{want_id}' 喺 words.js 唔存在")
                continue
            if id2term[want_id] != ch:
                errors.append(f"第 {n} 張「{ch}」指定 id '{want_id}'，但嗰個 id 係「{id2term[want_id]}」")
                continue
            resolved.append(want_id)
            continue

        cands = term2ids.get(ch, [])
        if len(cands) == 1:
            resolved.append(cands[0])
        elif len(cands) > 1:
            errors.append(f"第 {n} 張「{ch}」對到多個 id：{'、'.join(cands)}；請喺 JSON 寫明 \"id\"")
        else:
            errors.append(
                f"第 {n} 張「{ch}」words.js 未有 entry。請先加，例如：\n"
                f"      {{ id: '<拼音>', term: '{ch}', isDeer: false, emoji: '', badge: '', plate: '#2a2a35' }},"
            )
    return resolved, errors, warnings


def apply_book(src: str, spec: dict, resolved: list[str], sync_topic: bool) -> tuple[str, list[str]]:
    log = []
    book_id = spec["book"]
    found = find_book(src, book_id)
    if not found:
        raise SystemExit(f"words.js 揾唔到書 '{book_id}'")
    _, old_block, (s, e) = found
    old_ids = ids_in(old_block)

    new_block = "\n        " + ", ".join(f"'{i}'" for i in resolved) + " "
    src = src[:s] + new_block + src[e:]

    added = [i for i in resolved if i not in old_ids]
    removed = [i for i in old_ids if i not in resolved]
    log.append(f"書 {book_id}：{len(old_ids)} → {len(resolved)} 個字")
    if added:
        log.append(f"  新增：{'、'.join(added)}")
    if removed:
        log.append(f"  移除（推測錯，字卡冇）：{'、'.join(removed)}")

    if sync_topic and spec.get("series"):
        block, span = find_topic_wordids(src, spec["series"])
        if block is not None:
            topic_ids = ids_in(block)
            missing = [i for i in resolved if i not in topic_ids]
            if missing:
                merged = topic_ids + missing
                new_topic = "\n      " + ", ".join(f"'{i}'" for i in merged) + ",\n    "
                src = src[: span[0]] + new_topic + src[span[1]:]
                log.append(f"  主題 {spec['series']} 補返 {len(missing)} 個字：{'、'.join(missing)}")
    return src, log


def mark_verified(src: str, book_id: str, source: str) -> str:
    """喺書物件加 verified / cardSource，方便分辨「字卡校對過」定「仍然係推測」。"""
    pat = re.compile(r"(\{\s*id:\s*'" + re.escape(book_id) + r"',)")
    if re.search(r"id:\s*'" + re.escape(book_id) + r"',\s*verified:", src):
        return re.sub(r"(id:\s*'" + re.escape(book_id) + r"',\s*verified:\s*)(?:true|false)", r"\1true", src)
    return pat.sub(lambda m: m.group(1) + f" verified: true, cardSource: '{source}',", src, count=1)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("specs", nargs="*", help="data/book-cards/<book_id>.json")
    ap.add_argument("--all", action="store_true", help="處理 data/book-cards/ 全部（_ 開頭嘅檔會跳過）")
    ap.add_argument("--write", action="store_true", help="真係寫入 words.js（預設淨係 dry-run）")
    ap.add_argument("--sync-topic", action="store_true", help="順手把新字加入該輯主題總表")
    args = ap.parse_args()

    files = [Path(p) for p in args.specs]
    if args.all:
        files += sorted(p for p in (ROOT / "data" / "book-cards").glob("*.json") if not p.name.startswith("_"))
    if not files:
        ap.error("要指定至少一個 spec 檔，或者用 --all")

    src = load_words_js()
    id2term = parse_words(src)
    all_errors = 0

    for f in files:
        spec = json.loads(f.read_text(encoding="utf-8"))
        print(f"\n=== {f.name}（書：{spec['book']}，{len(spec['cards'])} 張卡）===")
        if spec.get("source"):
            print(f"  來源：{spec['source']}")
        found = find_book(src, spec["book"])
        prev = ids_in(found[1]) if found else []
        resolved, errors, warnings = check_cards(spec, id2term, prev)

        for w in warnings:
            print(f"  ⚠ {w}")
        for e in errors:
            print(f"  ✗ {e}")
        if errors:
            all_errors += len(errors)
            print("  → 有錯，呢本書唔會寫入。")
            continue

        src, log = apply_book(src, spec, resolved, args.sync_topic)
        if args.write:
            src = mark_verified(src, spec["book"], spec.get("source", "字卡相片"))
        for line in log:
            print(f"  {line}")

    if all_errors:
        print(f"\n結論：有 {all_errors} 個問題，冇寫入任何嘢。")
        return 1

    if args.write:
        WORDS_JS.write_text(src, encoding="utf-8")
        print("\n已寫入 js/words.js。跟住請跑：python3 scripts/check-invariants.py")
    else:
        print("\n（dry-run，未改任何檔。確認上面嘅 diff 冇問題就加 --write）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
