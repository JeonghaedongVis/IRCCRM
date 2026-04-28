import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
os.environ["VERCEL"] = "1"

from backend.mvp_server import Handler as _Handler  # noqa: E402


class handler(_Handler):
    """Vercel Python 서버리스 진입점 (BaseHTTPRequestHandler 서브클래스)."""
    pass
