"""Shared Wacky Ricky / Little Fox missing-word picker.

Fill-in blanks must be teachable content words. Series names, family roles,
titles, and English function words are hard-rejected when any content word
exists. Every page must have a fill: quality unique sentence-final content
first, otherwise the simplest allowed content word (shortest common
noun/verb/adj, destuttered forms, then last-resort interjections). Names
are used only when the page has no other alphabetic token. About one
quarter of pages use a natural two-word phrase blank.
"""
from __future__ import annotations

import json
import math
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
    "heres", "hurray", "hurrah", "maybe", "shhh", "umm", "whew", "whoo",
    "whoohoo", "whos", "youll",
}

# Carter FAMILY_NAMES pattern, plus Wacky Ricky / Little Fox regulars and roles.
FAMILY_NAMES = {
    "aunt", "bingo", "brenda", "brian", "brown", "dad", "daddy", "emmy",
    "father", "forestwood", "gill", "grandma", "grandfather", "grandpa",
    "grandmother", "harry", "hopper", "judy", "kitty", "mama", "miss",
    "mom", "mommy", "mother", "mr", "mrs", "ms", "oliver", "papa", "peter",
    "rachel", "richard", "ricky", "rover", "santa", "sir", "spike",
    "tinker", "uncle", "veronica",
}

COLORS = {
    "black", "blue", "gold", "green", "grey", "gray", "orange", "pink",
    "purple", "red", "silver", "white", "yellow",
}

ADJECTIVES = {
    "baby", "beautiful", "best", "big", "bright", "clean", "cold", "dark",
    "dirty", "dry", "fast", "favorite", "fine", "first", "funny", "good",
    "happy", "hard", "high", "hot", "last", "little", "long", "loud",
    "merry", "new", "next", "nice", "old", "pretty", "quiet", "ready",
    "sad", "scary", "secret", "short", "small", "soft", "sour", "special",
    "sweet", "tall", "ugly", "warm", "wet",
}

VERBS = {
    "bring", "build", "call", "clean", "close", "come", "drink", "eat",
    "email", "feed", "find", "finish", "give", "go", "hear", "help", "hide",
    "hold", "jump", "look", "make", "need", "open", "pick", "plant",
    "play", "put", "read", "run", "see", "send", "show", "start", "take",
    "turn", "wait", "walk", "want", "wash", "watch", "water", "write",
}

# Soft interjections / social words: still STOP for quality picks, allowed
# as the simplest fill when a page has no noun/verb/adjective.
LAST_RESORT_WORDS = {
    "again", "go", "hello", "hey", "hi", "hurray", "no", "okay",
    "ow", "please", "sorry", "whew", "whoohoo", "wow", "yeah", "yes",
}

QUESTION_WORDS = {"how", "what", "when", "where", "who", "why"}

LEXICAL_STOP = {
    "about", "can", "for", "from", "had", "has", "have", "here", "into",
    "like", "not", "that", "there", "this", "will", "with",
}

SIMPLE_WORDS = {
    "boring", "camaraderie", "christmas", "first", "friend", "friends",
    "glad", "go", "goodbye", "late", "merry", "one", "ow", "safe", "say",
    "separate", "wanted", "won",
}

DISTRACTOR_POOL = [
    "park", "school", "house", "book", "ball", "happy", "little", "green",
    "quick", "funny", "water", "friend", "morning", "outside", "today",
    "warm", "play", "look",
]

PHRASE_DISTRACTORS = [
    "happy park", "green house", "little school", "funny book",
    "warm water", "big friend", "new morning", "quick ball",
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


def destutter_key(word: str) -> str:
    """Return the intended word inside a stutter or letter-spelling, if any."""
    stem = _visible_stem(word)
    parts = [part for part in stem.split("-") if part]
    if len(parts) < 2:
        return ""
    if all(len(part) == 1 and part.isalpha() for part in parts):
        joined = "".join(parts).lower()
        return joined if len(joined) >= 3 else ""
    if _looks_like_stutter(word):
        last = parts[-1].lower()
        if last.isalpha() and len(last) >= 2:
            return last
    return ""


def is_name_blank(word: str) -> bool:
    key = normalize_blank(word)
    if not key:
        return False
    if key == "miss":
        return _visible_stem(word)[:1].isupper()
    parts = [part.lower() for part in _visible_stem(word).split("-") if part]
    if any(part in FAMILY_NAMES or (part.endswith("s") and part[:-1] in FAMILY_NAMES) for part in parts):
        return True
    if any(key.startswith(name) and len(key) >= len(name) + 2 for name in ("ricky", "rachel", "brenda", "brian")):
        return True
    if key in FAMILY_NAMES:
        return True
    if key.endswith("s") and key[:-1] in FAMILY_NAMES:
        return True
    return False


def is_rejected_blank(word: str) -> bool:
    key = normalize_blank(word)
    if not key:
        return True
    if _looks_like_stutter(word):
        return True
    if is_name_blank(word):
        return True
    if key in STOP_WORDS:
        return True
    return False


def is_leaked_page_number(word: str, index: int, words: list[str]) -> bool:
    key = normalize_blank(word)
    if not (index == 0 and key.isdigit() and 1 <= len(key) <= 2 and len(words) > 1):
        return False
    return any(re.search(r"[A-Za-z]", token) for token in words[1:])


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


def _content_candidates(
    words: list[str],
    counts: dict[str, int],
    min_len: int,
    *,
    require_unique: bool = True,
) -> list[str]:
    chosen: list[str] = []
    for word in words:
        key = normalize_blank(word)
        if not key or not re.search(r"[a-z]", key):
            continue
        if len(key) < min_len:
            continue
        if is_rejected_blank(word):
            continue
        if require_unique and counts.get(key, 0) != 1:
            continue
        chosen.append(word)
    return chosen


def _is_common_content(key: str) -> bool:
    return (
        key in COLORS
        or key in ADJECTIVES
        or _in_group(key, VERBS)
        or key in SIMPLE_WORDS
        or key in LAST_RESORT_WORDS
    )


def _simplest_score(word: str) -> tuple[int, int, str]:
    key = destutter_key(word) or normalize_blank(word)
    return (0 if _is_common_content(key) else 1, len(key), key)


def pick_quality_blank(source_text: str, words: list[str]) -> str:
    """Pick one page-unique content word, preferring a sentence-final one."""
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


def pick_simplest_blank(source_text: str, words: list[str] | None = None) -> str:
    """Pick the shortest allowed content word so the page still has a fill."""
    words = list(words) if words is not None else tokenize(source_text)
    content: list[str] = []
    last_resort: list[str] = []
    questions: list[str] = []
    lexical: list[str] = []
    other: list[str] = []
    numbers: list[str] = []
    names: list[str] = []
    for index, word in enumerate(words):
        key = normalize_blank(word)
        if not key:
            continue
        if is_leaked_page_number(word, index, words):
            numbers.append(word)
            continue
        if is_name_blank(word):
            names.append(word)
            continue
        dest = destutter_key(word)
        if key.isdigit():
            numbers.append(word)
            continue
        if dest:
            if is_name_blank(dest):
                names.append(word)
                continue
            useful = (
                dest in LAST_RESORT_WORDS
                or dest in ADJECTIVES
                or dest in COLORS
                or dest in SIMPLE_WORDS
                or _in_group(dest, VERBS)
                or (dest not in STOP_WORDS and len(dest) >= 3)
            )
            if useful:
                (last_resort if dest in STOP_WORDS or dest in LAST_RESORT_WORDS else content).append(word)
            continue
        if _looks_like_stutter(word):
            continue
        if key in LAST_RESORT_WORDS:
            last_resort.append(word)
            continue
        if key in STOP_WORDS:
            if key in QUESTION_WORDS:
                questions.append(word)
            elif key in LEXICAL_STOP:
                lexical.append(word)
            else:
                other.append(word)
            continue
        content.append(word)
    if content:
        return min(content, key=_simplest_score)
    if last_resort:
        return min(last_resort, key=_simplest_score)
    if questions:
        return min(questions, key=_simplest_score)
    if lexical:
        return max(lexical, key=lambda word: (len(normalize_blank(word)), normalize_blank(word)))
    if other:
        return max(other, key=lambda word: (len(normalize_blank(word)), normalize_blank(word)))
    if numbers:
        return max(numbers, key=lambda word: (len(normalize_blank(word)), normalize_blank(word)))
    if names:
        return names[-1]
    return words[-1] if words else ""


def pick_blank(source_text: str, words: list[str] | None = None) -> str:
    """Pick a content-word blank. Never returns empty when the page has tokens.

    Quality unique sentence-final content first. If none, the simplest allowed
    word (still preferring nouns/verbs/adjectives over names and STOP).
    """
    words = list(words) if words is not None else tokenize(source_text)
    if not words:
        return ""
    return pick_quality_blank(source_text, words) or pick_simplest_blank(source_text, words)


def _in_group(key: str, bucket: set[str]) -> bool:
    if key in bucket:
        return True
    if key.endswith("s") and key[:-1] in bucket:
        return True
    if key.endswith("ing") and (key[:-3] in bucket or key[:-3] + "e" in bucket):
        return True
    if key.endswith("ed") and (key[:-2] in bucket or key[:-1] in bucket):
        return True
    return False


def _pair_score(first: str, second: str) -> tuple[int, str]:
    left = normalize_blank(first)
    right = normalize_blank(second)
    if right.endswith("ly") or right in {"soon", "later", "first", "next", "today", "tomorrow", "always", "never", "really", "finally"}:
        return 0, ""
    if left in COLORS:
        return 5, "color-noun"
    if left in ADJECTIVES:
        return 4, "adj-noun"
    if _in_group(left, VERBS) and not _in_group(right, VERBS) and right not in ADJECTIVES:
        return 4, "verb-object"
    if (
        len(left) >= 4 and len(right) >= 4
        and not _in_group(left, VERBS) and not _in_group(right, VERBS)
        and right not in ADJECTIVES and right not in COLORS
    ):
        return 3, "noun-noun"
    return 0, ""


def find_phrase_pair(source_text: str, words: list[str] | None = None) -> tuple[str, str] | None:
    """Return the best adjacent content-word pair, or None."""
    words = list(words) if words is not None else tokenize(source_text)
    counts = _counts(words)
    clauses = split_clauses(source_text) or ([" ".join(words)] if words else [])
    best: tuple[int, int, str, str] | None = None
    for clause_index, clause in enumerate(clauses):
        tokens = tokenize(clause)
        for index, (first, second) in enumerate(zip(tokens, tokens[1:])):
            if not _content_candidates([first], counts, 3, require_unique=False) or not _content_candidates(
                [second], counts, 3, require_unique=False
            ):
                continue
            score, _kind = _pair_score(first, second)
            if not score:
                continue
            if index == len(tokens) - 2:
                score += 1
            ranked = (score, clause_index, first, second)
            if best is None or (ranked[0], ranked[1]) > (best[0], best[1]):
                best = ranked
    if not best:
        return None
    return best[2], best[3]


def two_word_quota(page_count: int) -> int:
    if page_count < 3:
        return 0
    low = math.floor(page_count * 0.20)
    high = math.floor(page_count * 0.30)
    target = round(page_count * 0.25)
    if high < 1:
        return 1
    return max(low, min(high, target if target else low))


def format_blank_answer(blanks: list[str]) -> str:
    return " ".join(blanks)


def choose_choices(target: str | list[str], page_words: list[str], vocab_by_norm: dict[str, str], rng: random.Random, phrase_bank: list[str] | None = None) -> list[str]:
    blanks = [target] if isinstance(target, str) else list(target)
    if not blanks or not blanks[0]:
        return []
    if len(blanks) >= 2:
        answer = format_blank_answer(blanks)
        answer_key = normalize_blank(answer)
        picked: list[str] = []
        used = {answer_key}
        for phrase in list(phrase_bank or []) + PHRASE_DISTRACTORS:
            key = normalize_blank(phrase)
            if not key or key in used:
                continue
            picked.append(phrase)
            used.add(key)
            if len(picked) == 2:
                break
        return [answer, *picked[:2]]
    answer = blanks[0]
    target_key = normalize_blank(answer)
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
    return [answer, *picked[:2]] if answer else []


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
        page_plans: list[tuple[list[str], tuple[int, int, str, str] | None]] = []
        phrase_bank: list[str] = []
        for page in book.get("pages", []):
            words = page.get("sentence") or tokenize(page.get("sourceText", ""))
            pair = find_phrase_pair(page.get("sourceText", ""), words)
            one = pick_blank(page.get("sourceText", ""), words)
            singles = [one] if one else []
            scored = None
            if pair:
                score, kind = _pair_score(*pair)
                scored = (score, 1 if words[-2:] == list(pair) else 0, kind, pair[0])
                phrase_bank.append(format_blank_answer(list(pair)))
            page_plans.append((singles, scored, pair, words))
        chosen_phrase_indexes = {
            index
            for _score, index in sorted(
                (
                    (plan[1], index)
                    for index, plan in enumerate(page_plans)
                    if plan[1] is not None
                ),
                reverse=True,
            )[: two_word_quota(len(page_plans))]
        }
        for index, page in enumerate(book.get("pages", [])):
            singles, _scored, pair, words = page_plans[index]
            blanks = list(pair) if index in chosen_phrase_indexes and pair else singles
            rng = random.Random(f"{book.get('id', '')}:{page.get('pdfPage')}")
            page["blanks"] = blanks
            page["choices"] = choose_choices(blanks, words, vocab_by_norm, rng, phrase_bank)
    return payload
