#!/usr/bin/env bash
# 砌 GitHub Pages 用嘅 _site（部署同 CI 共用同一份邏輯）
#   用法：bash scripts/build-site.sh <輸出目錄> <版本戳>
# 規則：預設複製「全部嘢」，只排除開發用檔案。
# 咁樣將來加新 root 檔（manifest.webmanifest、sw.js、favicon…）唔使再改呢個檔。
set -euo pipefail

OUT="${1:-_site}"
STAMP="${2:-$(date +%Y%m%d%H%M)}"

rm -rf "$OUT"
mkdir -p "$OUT"

tar -cf - \
  --exclude='./.git' \
  --exclude='./.github' \
  --exclude='./.cursor' \
  --exclude='./docs' \
  --exclude='./scripts' \
  --exclude='./mama phonic recording' \
  --exclude="./${OUT#./}" \
  --exclude='./_site' \
  --exclude='./AGENTS.md' \
  --exclude='./README.md' \
  . | tar -xf - -C "$OUT"

touch "$OUT/.nojekyll"

# 自動 cache-bust：用 commit SHA 蓋過所有 ?v=，agent 唔使再手動改版本號
find "$OUT" -name '*.html' -print0 | xargs -0 sed -i -E "s/\?v=[A-Za-z0-9_.-]+/?v=${STAMP}/g"

# 舊 index.html 仍留喺 iPad cache 時，前端靠呢個 no-store 小檔知道有新版。
printf '{"version":"%s"}\n' "$STAMP" > "$OUT/version.json"

echo "已砌好 ${OUT}（版本戳 ${STAMP}）"
