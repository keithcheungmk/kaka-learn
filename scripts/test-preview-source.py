#!/usr/bin/env python3
"""Check that smoke tests reject the wrong checkout and real image failures."""
import importlib.util
import io
import sys
from pathlib import Path
from unittest.mock import patch
from urllib.parse import unquote, urlsplit

path = Path(__file__).with_name("smoke-shots.py")
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("smoke_shots", path)
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class Response(io.BytesIO):
    status = 200


def current_checkout_response(url, timeout):
    path = unquote(urlsplit(url).path).lstrip("/")
    return Response((smoke.REPO_ROOT / path).read_bytes())


with patch.object(smoke, "urlopen", side_effect=current_checkout_response):
    smoke.verify_preview_source("http://127.0.0.1:5174")
with patch.object(smoke, "urlopen", return_value=Response(b"old checkout")):
    try:
        smoke.verify_preview_source("http://127.0.0.1:5173")
    except RuntimeError:
        pass
    else:
        raise AssertionError("An old preview server must be rejected")

def stale_script_response(url, timeout):
    if urlsplit(url).path.endswith("/js/emoji-spelling-app.js"):
        return Response(b"old script from another checkout")
    return current_checkout_response(url, timeout)


with patch.object(smoke, "urlopen", side_effect=stale_script_response):
    try:
        smoke.verify_preview_source("http://127.0.0.1:5174")
    except RuntimeError:
        pass
    else:
        raise AssertionError("A matching homepage with stale JavaScript must be rejected")

png = b"\x89PNG\r\n\x1a\n" + b"a" * 32 + b"\x00\x00\x00\x00IEND\xaeB`\x82"
pose = "http://127.0.0.1:5174/assets/space-ranger-pose-wave.png"
with patch.object(smoke, "urlopen", return_value=Response(png)):
    assert smoke.cancelled_pose_is_available(pose, "net::ERR_ABORTED")
    assert not smoke.cancelled_pose_is_available(pose, "net::ERR_FAILED")
    assert not smoke.cancelled_pose_is_available("http://127.0.0.1:5174/assets/other.png", "net::ERR_ABORTED")
with patch.object(smoke, "urlopen", return_value=Response(b"broken image")):
    assert not smoke.cancelled_pose_is_available(pose, "net::ERR_ABORTED")
print("Preview source and cancelled image checks passed")
