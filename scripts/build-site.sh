#!/usr/bin/env bash
# 砌 GitHub Pages 用嘅 _site（部署同 CI 共用同一份邏輯）
#   用法：bash scripts/build-site.sh <輸出目錄> <版本戳>
# 規則：預設複製「全部嘢」，只排除開發用檔案。
# 咁樣將來加新 root 檔（manifest.webmanifest、sw.js、favicon…）唔使再改呢個檔。
set -euo pipefail

OUT="${1:-_site}"
STAMP="${2:-$(date +%Y%m%d%H%M)}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

if [[ "$(pwd -P)" != "$REPO_ROOT" ]]; then
  echo "請在 kaka-learn checkout 根目錄執行打包。" >&2
  exit 1
fi

python3 - "$OUT" "$REPO_ROOT" <<'PY'
from pathlib import Path
import sys

output = Path(sys.argv[1])
root = Path(sys.argv[2]).resolve()
target = (root / output).resolve()
if output.is_absolute() or target == root or root not in target.parents:
    raise SystemExit('輸出目錄必須是目前 checkout 之內的相對子目錄。')
PY

if [[ -n "$(git ls-files -- "$OUT")" ]]; then
  echo "輸出目錄包含受版本控制的檔案，拒絕刪除：$OUT" >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT"

tar -cf - \
  --exclude='./.git' \
  --exclude='./.github' \
  --exclude='./.cursor' \
  --exclude='./docs' \
  --exclude='./scripts' \
  --exclude='./source-materials' \
  --exclude="./${OUT#./}" \
  --exclude='./_site' \
  --exclude='./AGENTS.md' \
  --exclude='./README.md' \
  . | tar -xf - -C "$OUT"

touch "$OUT/.nojekyll"

# 自動 cache-bust：同一實作支援 macOS 同 Linux，唔產生 sed 備份檔。
python3 - "$OUT" "$STAMP" <<'PY'
from pathlib import Path
import re
import sys
from html.parser import HTMLParser
from urllib.parse import parse_qs, unquote, urlsplit

root, stamp = Path(sys.argv[1]), sys.argv[2]
for path in root.rglob('*.html'):
    text = path.read_text(encoding='utf-8')
    updated = re.sub(r'\?v=[A-Za-z0-9_.-]+', lambda _: '?v=' + stamp, text)
    if updated != text:
        path.write_text(updated, encoding='utf-8')

class LocalAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        ref = values.get('src') if tag == 'script' else (
            values.get('href') if tag == 'link' and 'stylesheet' in (values.get('rel') or '').split() else None
        )
        if ref and ref.startswith(('./js/', './css/')):
            self.refs.append(ref)

parser = LocalAssets()
parser.feed((root / 'index.html').read_text(encoding='utf-8'))
for ref in parser.refs:
    parsed = urlsplit(ref)
    if not (root / unquote(parsed.path)).is_file() or parse_qs(parsed.query).get('v') != [stamp]:
        raise SystemExit(f'打包資源缺失或版本不一致：{ref}')
PY

# 舊 index.html 仍留喺 iPad cache 時，前端靠呢個 no-store 小檔知道有新版。
printf '{"version":"%s"}\n' "$STAMP" > "$OUT/version.json"

echo "已砌好 ${OUT}（版本戳 ${STAMP}）"
