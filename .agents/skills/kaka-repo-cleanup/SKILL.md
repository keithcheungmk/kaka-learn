---
name: kaka-repo-cleanup
description: >-
  Inventory and clean stale kaka-learn GitHub PRs, remote branches, and local
  worktrees; keep only what Keith chooses to ship. Use when Keith asks to clean
  up the repo, drop undeployed work, prune branches/PRs/worktrees, or free
  agent confusion from leftover WIP.
disable-model-invocation: true
---

# KAKA repo cleanup

Goal: 令 `origin/main`／live Pages 係唯一真相，清走未部署殘留，減低 agent 認錯舊分支。

全程繁體中文（香港用語）回覆。唔好叫 Keith 睇 code 驗收。危險操作（刪 branch／關 PR／删 worktree）要先列清單，等 Keith 用「推／掉」拍板；拍板後一次做完，中途唔再問細節。

## Non-negotiables

- **永遠保留**：`origin/main`、`origin/gh-pages`、本機主 checkout 入面 **未提交改動**（除非 Keith 明文叫清）。
- **唔好** `git reset --hard`／`git clean` 掃走其他人 WIP；唔好 force-push `main`；唔好提交 `source-materials/`。
- **唔好**整樹 merge 長期 dirty `codex/local-wip-preserved-*`。要內容就揀選／cherry-pick。
- 完結＝清單已執行 + 開住 PR／多餘 remote 已對齊 Keith 決定 + 交 live `version.json`（若有部署）。

## Step 1 — Inventory（只讀）

喺乾淨或任意 checkout 跑：

```bash
git fetch origin --prune
gh pr list --repo keithcheungmk/kaka-learn --state open --limit 50 \
  --json number,title,headRefName,isDraft,updatedAt,url
git for-each-ref --sort=-committerdate --format='%(committerdate:short) %(refname:short) %(subject)' refs/remotes/origin | head -80
git worktree list
```

對每個開住 PR／有獨特 commit 嘅 remote branch，計：

```bash
git rev-list --count origin/main..origin/<branch>
git rev-list --count origin/<branch>..origin/main
```

分類表交 Keith：

| 區 | 準則 |
|---|---|
| A 值得拍板 | 近 14 日有更新，或 ahead≥1 且產品相關 |
| B 預設掉 | 開住／draft 好耐、behind main ≫ ahead（通常 >100） |
| C 本機 worktree | ahead=0 → 可清；ahead>0 → 列入 A／B |
| D 暫緩 | handover「暫緩支線」（例如 Supabase）— 只列，唔刪方案檔 |

每行要有：名稱／PR 號、ahead／behind、一句係咩、建議 `推` 或 `掉`。

## Step 2 — Wait for Keith tags

等 Keith 回覆類似：

- `#209 推`
- `B 組全部掉`
- `worktree X 掉`
- `others all drop`

冇拍板嘅項目唔好刪。

## Step 3 — Ship the keepers first

對每個「推」：

1. `git worktree add /private/tmp/kaka-clean-<slug> origin/<branch>`（或由 `origin/main` 開再 cherry-pick）
2. rebase 上最新 `origin/main`；解 handover 衝突時兩段最近改動都保留
3. `python3 scripts/check-invariants.py` → 相關測試 → push 分支
4. 等 CI 綠；若全站 smoke 因改 `smoke-shots.py`／共用檔觸發，只修 **smoke 合約對齊現網行為**，唔借機重開已 drop 嘅大支線
5. merge／fast-forward 入 `main` → 等 `https://keithcheungmk.github.io/kaka-learn/version.json` 對 SHA → 交可撳網址

## Step 4 — Drop the rest

```bash
# 關 PR（留 comment）
gh pr close <n> --repo keithcheungmk/kaka-learn \
  --comment "Keith：決定 drop，唔再推進。需要時由現 main 重做。"

# 刪 remote branch（一次一批；永遠唔刪 main／gh-pages／仲要推嘅 branch）
git push origin --delete <branch> ...

# 删本機 worktree
git worktree remove --force <path>
git worktree prune

# 删 upstream 已 gone 嘅本地 branch
git branch -vv | awk '/: gone]/{print $1}' | xargs -r git branch -D
git remote prune origin
```

## Step 5 — Report card

用表回報（數字要量度，唔好估完唔講）：

| 指標 | 清理前 | 清理後 |
|---|---|---|
| 開住 PR | | |
| Remote branches（`origin/*`） | | |
| 本機 worktree | | |
| 本地 branch（可選） | | |
| 已部署「推」項目 | — | 網址 + SHA |
| 估計釋放工作樹空間 | — | 刪除嘅 worktree 數 × 當前工作樹（唔計 `source-materials/`／`.git`）大小 |

講清楚：**刪 GitHub branch 幾乎唔減小 clone 嘅 `.git`**；真正釋放磁碟主要係删 worktree 工作目錄。`git gc` 唔做除非 Keith 要求。

## Step 6 — Honesty about bugs

回覆必須講明：

- Cleanup **減嘅係流程債**（認錯舊分支、重複開工、假「待整合」），唔係自動減少產品 bug。
- 產品穩定性靠：由 `origin/main` 開工、完結＝live、invariants／範圍 smoke、唔喺 dirty WIP 堆新功能。

## Triggers

Keith 講「清理 repo」「drop 未部署」「prune branches／PR／worktree」「free up 殘留」→ 用呢份 skill。
