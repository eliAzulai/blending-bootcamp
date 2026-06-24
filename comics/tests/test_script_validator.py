"""Tests for the validate_script.py CLI.

Subprocess-based — exercises the actual script the way a user runs it.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "scripts" / "validate_script.py"


def _run(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT_PATH), *args],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
    )


def _write_temp_script(tmp_path: Path, payload: dict) -> Path:
    p = tmp_path / "script.json"
    p.write_text(json.dumps(payload))
    return p


def test_clean_script_exits_zero(tmp_path):
    script = {
        "stage_id": "cvc-short-a",
        "pages": [
            {
                "page": 1,
                "panels": [
                    {
                        "panel": 1,
                        "speech": [{"speaker": "sam", "text": "The cat is on the mat."}],
                    }
                ],
            }
        ],
    }
    p = _write_temp_script(tmp_path, script)
    result = _run([str(p)])
    assert result.returncode == 0, result.stderr
    assert "OK" in result.stdout


def test_dirty_script_exits_one(tmp_path):
    script = {
        "stage_id": "cvc-short-a",
        "pages": [
            {
                "page": 1,
                "panels": [
                    {
                        "panel": 1,
                        "speech": [{"speaker": "sam", "text": "The cat jumped high."}],
                    }
                ],
            }
        ],
    }
    p = _write_temp_script(tmp_path, script)
    result = _run([str(p)])
    assert result.returncode == 1
    assert "jumped" in result.stderr
    assert "high" in result.stderr


def test_quiet_mode_suppresses_success(tmp_path):
    script = {
        "stage_id": "cvc-short-a",
        "pages": [{"page": 1, "panels": [{"panel": 1, "speech": [
            {"speaker": "sam", "text": "Sam has a hat."}
        ]}]}],
    }
    p = _write_temp_script(tmp_path, script)
    result = _run([str(p), "--quiet"])
    assert result.returncode == 0
    assert result.stdout == ""


def test_missing_file_exits_two(tmp_path):
    nonexistent = tmp_path / "nope.json"
    result = _run([str(nonexistent)])
    assert result.returncode == 2
    assert "not found" in result.stderr


def test_invalid_json_exits_two(tmp_path):
    p = tmp_path / "broken.json"
    p.write_text("{not valid json")
    result = _run([str(p)])
    assert result.returncode == 2
    assert "invalid JSON" in result.stderr


def test_no_args_exits_two():
    result = _run([])
    assert result.returncode == 2  # argparse usage error


def test_locator_present_in_failure_output(tmp_path):
    script = {
        "stage_id": "cvc-short-a",
        "pages": [
            {
                "page": 3,
                "panels": [
                    {
                        "panel": 2,
                        "speech": [
                            {"speaker": "whiskers", "text": "Yellow!"}
                        ],
                    }
                ],
            }
        ],
    }
    p = _write_temp_script(tmp_path, script)
    result = _run([str(p)])
    assert result.returncode == 1
    # 'whiskers' itself fails (gated to wh-er) and so does 'yellow'
    assert "page 3" in result.stderr
    assert "panel 2" in result.stderr
