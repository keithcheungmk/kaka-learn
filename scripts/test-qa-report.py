#!/usr/bin/env python3
"""Exercise scope, provenance and failure handling of QA reporting."""
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('qa_report', root / 'scripts/qa-report.py')
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)


class ReportTests(unittest.TestCase):
    def test_scopes(self):
        self.assertEqual(qa.required_checks(['docs/qa-check.md']), ['invariants'])
        self.assertEqual(qa.required_checks(['data/hanzi-write-chars.js']), ['invariants', 'hanzi-replay', 'hanzi-family-names'])
        self.assertEqual(qa.required_checks(['js/speech.js']), ['invariants', 'full-smoke'])
        self.assertEqual(qa.required_checks(['js/speech.js', 'data/hanzi-write-chars.js']), ['invariants', 'hanzi-replay', 'hanzi-family-names', 'full-smoke'])

    def ci_run(self, sha='abc', conclusion='success', step='success'):
        data = {'workflowDatabaseId': 42, 'headBranch': 'main', 'headSha': sha, 'event': 'push', 'status': 'completed', 'conclusion': conclusion,
                'url': 'https://github.com/example/actions/runs/1', 'jobs': [
                    {'name': '硬性約束檢查（AGENTS.md）', 'status': 'completed', 'conclusion': 'success', 'steps': [
                    {'name': 'JS syntax + AGENTS.md 硬性約束', 'status': 'completed', 'conclusion': step}]},
                    {'name': '按改動範圍檢查家庭裝置', 'status': 'completed', 'conclusion': 'success', 'steps': [
                    {'name': '全站家庭裝置回歸（手動或共用基建變更）', 'status': 'completed', 'conclusion': 'skipped'}]}]}
        return subprocess.CompletedProcess([], 0, json.dumps(data), '')

    def mock_commands(self, run, diff=0, workflow_id='42'):
        def call(args, **kwargs):
            if args[0] == 'git':
                return subprocess.CompletedProcess(args, diff, '', '')
            if args[:2] == ['gh', 'api']:
                return subprocess.CompletedProcess(args, 0, workflow_id, '')
            return run
        return call

    def test_ci_reuse_checks_provenance_and_steps(self):
        with patch.object(qa, 'command', side_effect=self.mock_commands(self.ci_run())):
            result = qa.evidence_for('1', 'abc', 'base', False)
            self.assertEqual(result['invariants']['status'], 'pass')
            self.assertNotIn('full-smoke', result)
            with self.assertRaises(ValueError): qa.evidence_for('1', 'wrong', 'base', False)
            with self.assertRaises(ValueError): qa.evidence_for('1', 'abc', 'base', True)
        with patch.object(qa, 'command', side_effect=self.mock_commands(self.ci_run(conclusion='failure'))):
            with self.assertRaises(ValueError): qa.evidence_for('1', 'abc', 'base', False)
        with patch.object(qa, 'command', side_effect=self.mock_commands(self.ci_run(step='failure'))):
            self.assertNotIn('invariants', qa.evidence_for('1', 'abc', 'base', False))
        with patch.object(qa, 'command', side_effect=self.mock_commands(self.ci_run(), workflow_id='99')):
            with self.assertRaises(ValueError): qa.evidence_for('1', 'abc', 'base', False)
        with patch.object(qa, 'command', side_effect=self.mock_commands(self.ci_run(), diff=1)):
            with self.assertRaises(ValueError): qa.evidence_for('1', 'abc', 'base', False)
        other_job = self.ci_run()
        data = json.loads(other_job.stdout)
        data['jobs'][0]['name'] = 'unrelated job'
        other_job.stdout = json.dumps(data)
        with patch.object(qa, 'command', side_effect=self.mock_commands(other_job)):
            self.assertNotIn('invariants', qa.evidence_for('1', 'abc', 'base', False))

    def test_snapshot_race_fails_closed(self):
        before = ('abc', 'base', ['docs/a.md'], False)
        after = ('abc', 'base', ['docs/a.md', 'new'], True)
        with patch.object(qa, 'snapshot', side_effect=[before, after]), \
             patch.object(qa, 'evidence_for', return_value={'invariants': {'status': 'pass', 'source': 'CI'}}), \
             patch('sys.argv', ['qa-report.py', '--ci-run', '1']):
            self.assertEqual(qa.main(), 1)

    def test_empty_scope_is_not_reported_as_complete(self):
        with patch.object(qa, 'snapshot', return_value=('abc', 'abc', [], False)), \
             patch('sys.argv', ['qa-report.py']):
            self.assertEqual(qa.main(), 1)

    def test_dirty_includes_staged_unstaged_and_untracked(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            def git(*args): subprocess.run(['git', *args], cwd=path, check=True, capture_output=True)
            git('init', '-q')
            git('config', 'user.email', 'test@example.invalid')
            git('config', 'user.name', 'Test')
            (path / 'staged').write_text('before'); (path / 'unstaged').write_text('before')
            git('add', 'staged', 'unstaged'); git('commit', '-qm', 'base')
            (path / 'staged').write_text('after'); git('add', 'staged')
            (path / 'unstaged').write_text('after'); (path / 'untracked').write_text('new')
            with patch.object(qa, 'ROOT', path):
                _, _, files, dirty = qa.snapshot('HEAD')
            self.assertTrue(dirty)
            self.assertEqual(files, ['staged', 'unstaged', 'untracked'])

    def test_rename_keeps_old_and_new_path_for_scope(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            def git(*args): subprocess.run(['git', *args], cwd=path, check=True, capture_output=True)
            git('init', '-q'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test')
            (path / 'js').mkdir(); (path / 'js/speech.js').write_text('same content')
            git('add', '.'); git('commit', '-qm', 'base')
            git('mv', 'js/speech.js', 'js/renamed.js')
            with patch.object(qa, 'ROOT', path):
                _, _, files, dirty = qa.snapshot('HEAD')
            self.assertTrue(dirty)
            self.assertEqual(files, ['js/renamed.js', 'js/speech.js'])
            self.assertIn('full-smoke', qa.required_checks(files))

    def test_smoke_does_not_accept_missing_or_late_failure(self):
        outcomes = [subprocess.CompletedProcess([], 0, '冇裝 playwright，跳過視覺煙霧測試。', ''),
                    subprocess.CompletedProcess([], 1, '全部一屏入晒', 'PTH failed')]
        server = MagicMock(server_port=5173)
        with patch.object(qa.subprocess, 'run', side_effect=outcomes), \
             patch.object(qa.http.server, 'ThreadingHTTPServer', return_value=server), \
             patch.object(qa.threading, 'Thread'):
            self.assertEqual(qa.execute('full-smoke')['status'], 'fail')
            self.assertEqual(qa.execute('full-smoke')['status'], 'fail')


if __name__ == '__main__':
    unittest.main()
