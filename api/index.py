import sys
import os
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parents[1]))

# Vercel 환경 플래그 설정 (DB 경로 /tmp 사용)
os.environ["VERCEL"] = "1"

from backend.mvp_server import Handler  # noqa: E402

# Vercel이 인식할 수 있도록 명시적으로 할당
handler = Handler
