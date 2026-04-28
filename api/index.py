import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
os.environ["VERCEL"] = "1"

from backend.mvp_server import Handler as _Handler, init_db  # noqa: E402

# 서버리스 환경에서는 __main__ 블록이 실행되지 않으므로 여기서 DB 초기화
init_db()


class handler(_Handler):
    """Vercel Python 서버리스 진입점."""
    pass
