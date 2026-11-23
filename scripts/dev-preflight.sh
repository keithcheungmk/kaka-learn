#!/usr/bin/env bash
# 開工前預檢（Keith 2026-11-23 批，見 docs/model-and-token-guide.md §2）
# 用法：bash scripts/dev-preflight.sh
# 輸出 PASS/WARN；只有 python3／node 缺失先 exit 1，其餘 WARN 由人判斷。
set -u
cd "$(dirname "$0")/.."

note() { printf '%s\n' "$1"; }
fail=0

# --- git 同步 ---
if git fetch origin main --quiet 2>/dev/null; then
  counts=$(git rev-list --left-right --count origin/main...HEAD 2>/dev/null || echo "?	?")
  behind=$(printf '%s' "$counts" | awk '{print $1}')
  ahead=$(printf '%s' "$counts" | awk '{print $2}')
  if [ "$behind" != "0" ]; then
    note "WARN git: 本地落後 origin/main $behind 個 commit，先 git merge --ff-only origin/main"
  else
    note "PASS git: 同 origin/main 同步（本地未推 $ahead 個）"
  fi
else
  note "WARN git: fetch 失敗（離線或無 remote？唔好拿舊 checkout 當現網）"
fi

st=$(git status --porcelain 2>/dev/null | grep -v '^??' | head -5)
if [ -n "$st" ]; then
  note "WARN git: 有未提交改動："
  printf '%s\n' "$st"
else
  note "PASS git: 工作區乾淨（untracked 不計）"
fi

# --- 工具鏈 ---
if command -v python3 >/dev/null 2>&1; then
  note "PASS python3: $(python3 -V 2>&1)"
else
  note "FAIL python3: 冇裝"; fail=1
fi
if command -v node >/dev/null 2>&1; then
  note "PASS node: $(node -v 2>&1)"
else
  note "FAIL node: 冇裝（test-*.mjs 跑唔到）"; fail=1
fi
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  note "PASS gh: 已登入"
else
  note "WARN gh: 未登入／冇裝（查 CI、PR 會失敗）"
fi
if python3 -c "import playwright" >/dev/null 2>&1; then
  note "PASS playwright: python 可用"
else
  note "WARN playwright: python3 冇（CI 會自己裝；本地跑 test-*-layout.py 要先 pip install playwright && playwright install chromium）"
fi

# --- 本地伺服器 ---
if lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  note "WARN port 5173: 已被佔用——確認係咪由呢個 checkout 開，版面 smoke 對唔上工作目錄會即停"
else
  note "PASS port 5173: 空閒（需要時：python3 -m http.server 5173 --bind 127.0.0.1）"
fi

exit $fail
