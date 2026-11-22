#!/usr/bin/env python3
"""Verify changed-file classification used by CI and deployment."""
from pathlib import Path
import os
import subprocess
import tempfile
import textwrap
import shutil

root = Path(__file__).resolve().parents[1]
script = root / 'scripts/layout-scope.sh'
cases = [
    ([], 'full=false\nhanzi=false\nlisten=false\n'),
    (['data/hanzi-writer/life-word-data.js'], 'full=false\nhanzi=true\nlisten=false\n'),
    (['data/hanzi-write-chars.js'], 'full=false\nhanzi=true\nlisten=false\n'),
    (['js/speech.js'], 'full=true\nhanzi=false\nlisten=false\n'),
    (['js/speech.js', 'hanzi-write-demo.html'], 'full=true\nhanzi=true\nlisten=false\n'),
    (['data/hanzi-writer/life-word-data.js.bak'], 'full=false\nhanzi=false\nlisten=false\n'),
    (['css/listen-find.css'], 'full=false\nhanzi=false\nlisten=true\n'),
    (['js/listen-find-scenes.js'], 'full=false\nhanzi=false\nlisten=true\n'),
    (['assets/english-listen-find/zoo-scene.webp'], 'full=false\nhanzi=false\nlisten=true\n'),
    (['scripts/test-listen-find-layout.py'], 'full=false\nhanzi=false\nlisten=true\n'),
]
for paths, expected in cases:
    result = subprocess.run(['bash', str(script)], input='\n'.join(paths) + '\n', text=True, capture_output=True, check=True)
    assert result.stdout == expected, (paths, result.stdout)
for filename in ('css/styles.css', 'js/app.js', 'js/storage.js', 'js/speech.js', 'js/nav-back.js'):
    result = subprocess.run(['bash', str(script)], input=filename + '\n', text=True, capture_output=True, check=True)
    assert result.stdout == 'full=true\nhanzi=false\nlisten=false\n', filename
result = subprocess.run(['bash', str(script)], input='index.html\n', text=True, capture_output=True, check=True)
assert result.stdout == 'full=true\nhanzi=false\nlisten=true\n', result.stdout
for filename in ('hanzi-write-demo.html', 'js/hanzi-write-demo.js', 'css/hanzi-write-demo.css', 'data/hanzi-write-chars.js', 'data/hanzi-family-names.js', 'scripts/test-hanzi-family-names.py', 'scripts/test-hanzi-replay.py'):
    result = subprocess.run(['bash', str(script)], input=filename + '\n', text=True, capture_output=True, check=True)
    assert result.stdout == 'full=false\nhanzi=true\nlisten=false\n', filename
workflow = (root / '.github/workflows/ci.yml').read_text()
assert 'bash scripts/layout-scope.sh < "$changed_files" >> "$GITHUB_OUTPUT"' in workflow
assert 'python3 scripts/test-listen-find-layout.py' in workflow
assert "steps.scope.outputs.listen == 'true'" in workflow
assert 'group: kaka-ci-${{ github.event_name }}-${{ github.ref }}' in workflow
assert 'cancel-in-progress: true' in workflow.split('\njobs:', 1)[0]
deploy = workflow.split('\n  deploy:\n', 1)[1]
assert 'group: pages\n      queue: max' in deploy
assert 'cancel-in-progress: true' not in deploy
assert 'gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/main"' in deploy
assert 'needs: [invariants, layout]' in deploy
assert "github.ref == 'refs/heads/main'" in deploy
assert "github.event_name == 'push' || github.event_name == 'workflow_dispatch'" in deploy
assert 'always()' not in deploy and 'continue-on-error' not in deploy
assert 'name: site-${{ github.sha }}' in deploy
assert 'site-sha' in deploy and '"$GITHUB_SHA"' in deploy
assert 'test -f _site/.nojekyll' in deploy
assert 'build-site.sh' not in deploy
scope = textwrap.dedent(workflow.split('        id: scope\n', 1)[1].split('        run: |\n', 1)[1].split('\n\n      - name: 安裝 playwright', 1)[0])
with tempfile.TemporaryDirectory() as tmp:
    repo = Path(tmp)
    def git(*args):
        return subprocess.run(['git', *args], cwd=repo, check=True, capture_output=True, text=True).stdout.strip()
    git('init', '-q')
    git('config', 'user.email', 'test@example.invalid')
    git('config', 'user.name', 'Test')
    (repo / 'scripts').mkdir()
    shutil.copy(script, repo / 'scripts/layout-scope.sh')
    (repo / 'js').mkdir()
    (repo / 'js/speech.js').write_text('speech')
    git('add', '.'); git('commit', '-qm', 'base')
    base = git('rev-parse', 'HEAD')
    git('mv', 'js/speech.js', 'js/new-speech.js')
    (repo / 'data').mkdir()
    (repo / 'data/hanzi-write-chars.js').write_text('hanzi')
    git('add', '.'); git('commit', '-qm', 'rename')
    def route(event, push_base='', pr_base=''):
        output = repo / 'output'
        output.write_text('')
        env = dict(os.environ, EVENT_NAME=event, PUSH_BASE=push_base, PR_BASE=pr_base, GITHUB_OUTPUT=str(output))
        subprocess.run(['bash', '-e', '-c', scope], cwd=repo, env=env, check=True, capture_output=True, text=True)
        return output.read_text()
    assert route('push', base) == 'full=true\nhanzi=true\nlisten=false\n'
    assert route('pull_request', pr_base=base) == 'full=true\nhanzi=true\nlisten=false\n'
    assert route('push', '0' * 40) == 'full=true\nhanzi=true\nlisten=true\n'
    assert route('push') == 'full=true\nhanzi=true\nlisten=true\n'
    assert route('workflow_dispatch') == 'full=true\nhanzi=true\nlisten=true\n'
print(f'layout scope: {len(cases)} cases and CI passed')
