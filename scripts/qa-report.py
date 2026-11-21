#!/usr/bin/env python3
"""Report scoped checks without re-running them unless requested."""
from __future__ import annotations

import argparse
import json
import os
import http.server
import functools
import threading
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def command(args: list[str], *, input_text: str | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=ROOT, input=input_text, capture_output=True, text=True)


def git(*args: str) -> str:
    result = command(['git', *args])
    if result.returncode:
        raise ValueError(result.stderr.strip() or 'git command failed')
    return result.stdout.strip()


def snapshot(base: str) -> tuple[str, str, list[str], bool]:
    head = git('rev-parse', '--verify', 'HEAD^{commit}')
    base_sha = git('rev-parse', '--verify', f'{base}^{{commit}}')
    merge_base = git('merge-base', base_sha, head)
    files = set(git('diff', '--no-renames', '--name-only', merge_base, 'HEAD').splitlines())
    files.update(git('diff', '--no-renames', '--name-only', 'HEAD').splitlines())
    files.update(git('ls-files', '--others', '--exclude-standard').splitlines())
    return head, merge_base, sorted(files), bool(git('status', '--porcelain', '--untracked-files=normal'))


def required_checks(files: list[str]) -> list[str]:
    result = command(['bash', 'scripts/layout-scope.sh'], input_text='\n'.join(files) + '\n')
    if result.returncode:
        raise ValueError('layout scope failed: ' + result.stderr.strip())
    flags = dict(line.split('=', 1) for line in result.stdout.splitlines())
    checks = ['invariants']
    if flags.get('hanzi') == 'true':
        checks.extend(['hanzi-replay', 'hanzi-family-names'])
    if flags.get('full') == 'true':
        checks.append('full-smoke')
    return checks


def execute(check: str) -> dict[str, str]:
    commands = {
        'invariants': [sys.executable, 'scripts/check-invariants.py'],
        'hanzi-replay': [sys.executable, 'scripts/test-hanzi-replay.py'],
        'hanzi-family-names': [sys.executable, 'scripts/test-hanzi-family-names.py'],
        'full-smoke': [sys.executable, 'scripts/smoke-shots.py', '--no-shots'],
    }
    server = None
    try:
        env = os.environ.copy()
        args = commands[check][:]
        if check != 'invariants':
            handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
            server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            url = f'http://127.0.0.1:{server.server_port}'
            env['KAKA_TEST_URL'] = url
            if check == 'full-smoke':
                args.extend(['--url', url])
        result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True, env=env)
    finally:
        if server:
            server.shutdown()
            server.server_close()
    output = result.stdout + result.stderr
    if check == 'invariants':
        passed = result.returncode == 0 and '可以 merge' in output
    elif check == 'full-smoke':
        passed = result.returncode == 0 and '結論：' in output and '冇 404、冇 console error' in output and '冇裝 playwright' not in output
    else:
        passed = result.returncode == 0
    return {'status': 'pass' if passed else 'fail', 'source': 'local command', 'output': output[-2000:]}


def evidence_for(run_id: str, head: str, base: str, dirty: bool) -> dict:
    if dirty:
        raise ValueError('工作樹有未提交改動，不能重用 CI 證據')
    if not run_id.isdecimal():
        raise ValueError('CI run ID 必須是數字')
    workflow_diff = command(['git', 'diff', '--quiet', base, head, '--', '.github/workflows/ci.yml'])
    if workflow_diff.returncode != 0:
        raise ValueError('CI workflow 已改動或無法比較，不能重用舊基準的 CI 證據')
    workflow = command(['gh', 'api', 'repos/{owner}/{repo}/actions/workflows/ci.yml', '--jq', '.id'])
    if workflow.returncode or not workflow.stdout.strip().isdecimal():
        raise ValueError('無法查證 CI workflow 身分')
    result = command(['gh', 'run', 'view', run_id, '--json', 'workflowDatabaseId,headBranch,headSha,status,conclusion,event,url,jobs'])
    if result.returncode:
        raise ValueError('無法查證 GitHub Actions run: ' + result.stderr.strip())
    try:
        run = json.loads(result.stdout)
    except ValueError as exc:
        raise ValueError('GitHub Actions 回應格式錯誤') from exc
    if (str(run.get('workflowDatabaseId')) != workflow.stdout.strip() or run.get('headBranch') != 'main'
            or run.get('headSha') != head or run.get('event') != 'push' or run.get('status') != 'completed'):
        raise ValueError('CI run 不是此 commit 的已完成 push 檢查')
    if run.get('conclusion') != 'success':
        raise ValueError('CI run 未成功')
    jobs = {job.get('name'): job for job in run.get('jobs', [])}
    names = {
        'invariants': ('硬性約束檢查（AGENTS.md）', 'JS syntax + AGENTS.md 硬性約束'),
        'hanzi-replay': ('按改動範圍檢查家庭裝置', '靜音檢查寫字重玩（iPad／iPhone）'),
        'hanzi-family-names': ('按改動範圍檢查家庭裝置', '靜音檢查寫字重玩（iPad／iPhone）'),
        'full-smoke': ('按改動範圍檢查家庭裝置', '全站家庭裝置回歸（手動或共用基建變更）'),
    }
    results = {}
    for key, (job_name, step_name) in names.items():
        job = jobs.get(job_name, {})
        steps = [step for step in job.get('steps', []) if step.get('name') == step_name]
        if (job.get('status') == 'completed' and job.get('conclusion') == 'success'
                and len(steps) == 1 and steps[0].get('status') == 'completed'
                and steps[0].get('conclusion') == 'success' and run.get('url')):
            results[key] = {'status': 'pass', 'source': run['url']}
    return results



def main() -> int:
    parser = argparse.ArgumentParser(description='按改動範圍列出檢查及證據')
    parser.add_argument('--base', default='origin/main')
    parser.add_argument('--run', action='store_true', help='執行缺少的機器檢查')
    parser.add_argument('--ci-run', help='以 GitHub Actions run ID 查證同一乾淨 commit 的檢查結果')
    args = parser.parse_args()
    try:
        head, base, files, dirty = snapshot(args.base)
        if not files:
            raise ValueError('比較範圍沒有改動，請明確指定有改動的 --base，不能推斷檢查範圍')
        checks = required_checks(files)
        results = evidence_for(args.ci_run, head, base, dirty) if args.ci_run else {}
        for check in checks:
            saved = results.get(check)
            if not isinstance(saved, dict) or saved.get('status') not in ('pass', 'fail') or not isinstance(saved.get('source'), str) or not saved['source']:
                results[check] = {'status': 'pending', 'source': '沒有證據'}
            if args.run and results[check]['status'] == 'pending':
                results[check] = execute(check)
                if dirty and results[check]['status'] == 'pass':
                    results[check] = {'status': 'pending', 'source': '本地檢查通過，但工作樹有改動，不能綁定 commit'}
        if (args.run or args.ci_run) and snapshot(args.base) != (head, base, files, dirty):
            raise ValueError('檢查期間工作樹或版本改變，結果不能重用')
        print(f'受測 commit: {head}\n比較基準: {base}\n工作樹: {"有未提交改動" if dirty else "乾淨"}')
        print('改動檔案: ' + (', '.join(files) if files else '無'))
        for check in checks:
            item = results[check]
            print(f"{check}: {item['status']} ({item['source']})")
            if item['status'] == 'fail' and item.get('output'):
                print(item['output'])
        statuses = [results[k]['status'] for k in checks]
        print('機器檢查: ' + ('有問題' if 'fail' in statuses else '待驗' if 'pending' in statuses else '已完成'))
        print('視覺、幼齡適切度及未分類功能的相關流程須另按改動驗證；此報告不代表可以 merge。')
        return 0 if all(status == 'pass' for status in statuses) else 1
    except (ValueError, OSError) as exc:
        print(f'待驗: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
