#!/usr/bin/env python3
"""Verify changed-file classification used by CI and deployment."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
script = root / 'scripts/layout-scope.sh'
cases = [
    ([], 'full=false\nhanzi=false\n'),
    (['data/hanzi-writer/life-word-data.js'], 'full=false\nhanzi=true\n'),
    (['data/hanzi-write-chars.js'], 'full=false\nhanzi=true\n'),
    (['js/speech.js'], 'full=true\nhanzi=false\n'),
    (['js/speech.js', 'hanzi-write-demo.html'], 'full=true\nhanzi=true\n'),
    (['data/hanzi-writer/life-word-data.js.bak'], 'full=false\nhanzi=false\n'),
]
for paths, expected in cases:
    result = subprocess.run(['bash', str(script)], input='\n'.join(paths) + '\n', text=True, capture_output=True, check=True)
    assert result.stdout == expected, (paths, result.stdout)
for filename in ('index.html', 'css/styles.css', 'js/app.js', 'js/storage.js', 'js/speech.js', 'js/nav-back.js'):
    result = subprocess.run(['bash', str(script)], input=filename + '\n', text=True, capture_output=True, check=True)
    assert result.stdout == 'full=true\nhanzi=false\n', filename
for filename in ('hanzi-write-demo.html', 'js/hanzi-write-demo.js', 'css/hanzi-write-demo.css', 'data/hanzi-write-chars.js', 'data/hanzi-family-names.js', 'scripts/test-hanzi-family-names.py', 'scripts/test-hanzi-replay.py'):
    result = subprocess.run(['bash', str(script)], input=filename + '\n', text=True, capture_output=True, check=True)
    assert result.stdout == 'full=false\nhanzi=true\n', filename
for path in ('.github/workflows/ci.yml', '.github/workflows/deploy-pages.yml'):
    assert 'bash scripts/layout-scope.sh < /tmp/kaka-changed-files >> "$GITHUB_OUTPUT"' in (root / path).read_text()
print(f'layout scope: {len(cases)} cases and both workflows passed')
