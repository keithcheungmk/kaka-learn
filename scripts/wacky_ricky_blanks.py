"""Shared Wacky Ricky / Little Fox missing-word picker.

Fill-in blanks must be teachable content words. Series names, family roles,
titles, and English function words are hard-rejected. If a page has no
eligible word, the page stays listen-only (no blank) instead of falling
back to a name or stop word.
"""
from __future__ import annotations

import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data" / "wacky-ricky-manifest.js"
MANIFEST_PREFIX = "window.KakaWackyRickyManifest = "

# Carter STOP_WORDS plus spoken contractions used by the Wacky Ricky picker.
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "did",
    "do", "for", "from", "get", "got", "had", "has", "have", "he", "her",
    "him", "his", "i", "if", "in", "into", "is", "it", "its", "just", "let",
    "like", "me", "my", "no", "not", "of", "off", "on", "or", "our", "out",
    "said", "she", "so", "some", "that", "the", "their", "them", "then", "there",
    "they", "this", "to", "too", "up", "us", "was", "we", "were", "what", "when",
    "where", "who", "will", "with", "you", "your",
    "arent", "cant", "could", "didnt", "does", "doesnt", "dont", "hadnt",
    "hasnt", "havent", "hes", "how", "ill", "im", "isnt", "ive", "lets",
    "shes", "should", "thats", "theyre", "wasnt", "were", "weve", "whats",
    "wont", "would", "wouldnt", "youre",
    "about", "again", "also", "am", "been", "being", "here", "now", "only",
    "very", "which", "why",
    "bye", "hello", "hey", "hi", "ok", "okay", "oh", "please", "sorry",
    "thank", "thanks", "uh", "um", "wow", "yeah", "yes",
}

# Carter FAMILY_NAMES pattern, plus Wacky Ricky / Little Fox regulars and roles.
FAMILY_NAMES = {
    "aunt", "bingo", "brenda", "brian", "brown", "dad", "daddy", "emmy",
    "father", "grandma", "grandfather", "grandpa", "grandmother",
    "harry", "hopper", "judy", "kitty", "mama", "miss", "mom", "mommy",
    "mother", "mr", "mrs", "ms", "oliver", "papa", "rachel", "richard",
    "ricky", "rover", "sir", "spike", "uncle", "veronica",
}

DISTRACTOR_POOL = [
    "park", "school", "house", "book", "ball", "happy", "little", "green",
    "quick", "funny", "water", "friend", "morning", "outside", "today",
    "warm", "play", "look",
]


def tokenize(text: str) -> list[str]:
    return text.replace("\n", " ").split()


def normalize_blank(word: str) -> str:
    return "".join(char.lower() for char in word if char.isalnum())


def _visible_stem(word: str) -> str:
    return word.strip("“”\"'()[]{}.,!?;:")


def _looks_like_stutter(word: str) -> bool:
    parts = [part.lower() for part in _visible_stem(word).split("-") if part]
    if len(parts) < 2 or not all(part.isalpha() and len(part) <= 4 for part in parts):
        return False
    return any(len(part) == 1 for part in parts) or len(set(parts)) == 1


def is_rejected_blank(word: str) -> bool:
    key = normalize_blank(word)
    if not key:
        return True
    if _looks_like_stutter(word):
        return True
    if key in STOP_WORDS:
        return True
    if key == "miss":
        return _visible_stem(word)[:1].isupper()
    if key in FAMILY_NAMES:
        return True
    if key.endswith("s") and key[:-1] in FAMILY_NAMES:
        return True
    return False


def split_clauses(text: str) -> list[str]:
    text = " ".join((text or "").split())
    if not text:
        return []
    protected = re.sub(r"\b(Mr|Mrs|Ms|Dr)\.", lambda match: f"{match.group(1)}\u2024", text)
    found = [item.strip() for item in re.findall(r".+?[.!?]+(?:[”\"'])?(?=\s|$)", protected) if item.strip()]
    if not found:
        clauses = [part.strip() for part in re.split(r"[;:]", protected) if part.strip()] or [protected]
        return [clause.replace("\u2024", ".") for clause in clauses]
    remainder = protected
    clauses: list[str] = []
    for item in found:
        index = remainder.find(item)
        if index > 0:
            prefix = remainder[:index].strip()
            if prefix:
                clauses.extend(part.strip() for part in re.split(r"[;:]", prefix) if part.strip())
        clauses.append(item)
        remainder = remainder[index + len(item):] if index >= 0 else remainder
    remainder = remainder.strip()
    if remainder:
        clauses.extend(part.strip() for part in re.split(r"[;:]", remainder) if part.strip())
    return [clause.replace("\u2024", ".") for clause in clauses]


def _counts(words: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for word in words:
        key = normalize_blank(word)
        if key:
            counts[key] = counts.get(key, 0) + 1
    return counts


def _content_candidates(words: list[str], counts: dict[str, int], min_len: int) -> list[str]:
    chosen: list[str] = []
    for word in words:
        key = normalize_blank(word)
        if not key or not re.search(r"[a-z]", key):
            continue
        if len(key) < min_len:
            continue
        if is_rejected_blank(word):
            continue
        if counts.get(key, 0) != 1:
            continue
        chosen.append(word)
    return chosen


def pick_blank(source_text: str, words: list[str] | None = None) -> str:
    """Pick one page-unique content word, preferring a sentence-final one.

    Never returns a stop word or series name. Empty string means skip the fill.
    """
    words = list(words) if words is not None else tokenize(source_text)
    counts = _counts(words)
    clauses = split_clauses(source_text)
    if not clauses:
        clauses = [" ".join(words)] if words else []
    for min_len in (4, 3):
        for clause in reversed(clauses):
            candidates = _content_candidates(tokenize(clause), counts, min_len)
            if candidates:
                return candidates[-1]
        page_candidates = _content_candidates(words, counts, min_len)
        if page_candidates:
            return page_candidates[-1]
    return ""


def choose_choices(target: str, page_words: list[str], vocab_by_norm: dict[str, str], rng: random.Random) -> list[str]:
    if not target:
        return []
    target_key = normalize_blank(target)
    page_keys = {normalize_blank(word) for word in page_words if normalize_blank(word)}
    distractors = [
        word for key, word in vocab_by_norm.items()
        if key != target_key and key not in page_keys and len(key) >= 3 and not is_rejected_blank(word)
    ]
    distractors.sort(key=lambda word: (abs(len(normalize_blank(word)) - len(target_key)), normalize_blank(word)))
    distractors = distractors[: min(len(distractors), 24)]
    rng.shuffle(distractors)
    picked = distractors[:2]
    used = {target_key, *(normalize_blank(word) for word in picked)}
    for word in DISTRACTOR_POOL:
        if len(picked) == 2:
            break
        if normalize_blank(word) not in used:
            picked.append(word)
            used.add(normalize_blank(word))
    return [target, *picked[:2]] if target else []


def load_wacky_manifest(path: Path | None = None) -> dict:
    manifest_path = path or MANIFEST
    text = manifest_path.read_text(encoding="utf-8")
    if not text.startswith(MANIFEST_PREFIX):
        raise ValueError(f"unexpected Wacky Ricky manifest prefix in {manifest_path}")
    return json.loads(text[len(MANIFEST_PREFIX):].rstrip().removesuffix(";"))


def write_wacky_manifest(payload: dict, path: Path | None = None) -> None:
    manifest_path = path or MANIFEST
    encoded = json.dumps(payload, ensure_ascii=False, indent=2)
    manifest_path.write_text(MANIFEST_PREFIX + encoded + ";\n", encoding="utf-8")


def apply_blanks_to_manifest(payload: dict) -> dict:
    """Rewrite blanks/choices from each page's existing sentence/sourceText."""
    for book in payload.get("books", []):
        vocabulary: list[str] = []
        for page in book.get("pages", []):
            vocabulary.extend(word for word in page.get("sentence") or tokenize(page.get("sourceText", "")) if normalize_blank(word))
        vocab_by_norm: dict[str, str] = {}
        for word in vocabulary:
            vocab_by_norm.setdefault(normalize_blank(word), word)
        for page in book.get("pages", []):
            words = page.get("sentence") or tokenize(page.get("sourceText", ""))
            target = pick_blank(page.get("sourceText", ""), words)
            rng = random.Random(f"{book.get('id', '')}:{page.get('pdfPage')}")
            page["blanks"] = [target] if target else []
            page["choices"] = choose_choices(target, words, vocab_by_norm, rng)
    return payload
