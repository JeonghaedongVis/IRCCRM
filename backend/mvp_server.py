#!/usr/bin/env python3
from __future__ import annotations

import base64
import json
import os
import shutil
import sqlite3
import threading
import uuid
from datetime import datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
LEGACY_JSON = DATA_DIR / "mvp_db.json"
SHEET_ROWS_PATH = DATA_DIR / "sheet_rows.json"
BACKUP_RETAIN = 7  # 직전 N일 보관

# Vercel: 파일시스템이 읽기전용이므로 /tmp 사용 (데이터 임시 저장)
if os.environ.get("VERCEL"):
    DB_FILE = Path("/tmp/crm.db")
    BACKUP_DIR = Path("/tmp/backups")
else:
    DB_FILE = DATA_DIR / "crm.db"
    BACKUP_DIR = DATA_DIR / "backups"

SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets"

# ── 인증 (환경변수로 활성화) ──
CRM_USER = os.environ.get("CRM_USER", "").strip()
CRM_PASS = os.environ.get("CRM_PASS", "").strip()
AUTH_ENABLED = bool(CRM_USER and CRM_PASS)

# DB 동시쓰기 보호 락 (CPython GIL 외 추가 안전장치)
_DB_LOCK = threading.Lock()


def extract_sheet_id(sheet_url: str) -> str:
    """Extract spreadsheet ID from a Google Sheets URL."""
    # https://docs.google.com/spreadsheets/d/{ID}/edit...
    parts = sheet_url.split("/d/")
    if len(parts) < 2:
        return ""
    return parts[1].split("/")[0]


def fetch_sheet_rows(sheet_id: str, api_key: str, sheet_name: str = "") -> list[dict]:
    """Fetch all rows from a Google Sheet and return as list of dicts."""
    range_param = f"{sheet_name}!A:Z" if sheet_name else "A:Z"
    url = f"{SHEETS_API_BASE}/{sheet_id}/values/{quote(range_param)}?key={api_key}"
    req = Request(url)
    with urlopen(req, timeout=10) as resp:  # nosec B310
        data = json.loads(resp.read().decode("utf-8"))
    values = data.get("values", [])
    if not values:
        return []
    headers = [h.strip() for h in values[0]]
    rows = []
    for row in values[1:]:
        padded = row + [""] * (len(headers) - len(row))
        rows.append(dict(zip(headers, padded)))
    return rows


DEFAULT_STAGE_STATUS: dict[str, str] = {
    "new_lead":         "CREATED",
    "auto_replied":     "AUTOANSWER",
    "consulting":       "ANSWER",
    "booking_push":     "ANSWER",
    "booked":           "END",
    "no_response":      "NO_RESPONSE",
    "recontact_needed": "RECONTACT",
}


def event_stage_status_map(event: dict) -> dict[str, str]:
    """이벤트별 단계→상태값 매핑 (커스텀 우선, 미설정시 기본값)."""
    cfg = (event or {}).get("config", {})
    custom = cfg.get("stageStatusMap", {}) or {}
    merged = {**DEFAULT_STAGE_STATUS}
    for k, v in custom.items():
        if isinstance(v, str) and v.strip():
            merged[k] = v.strip()
    return merged


def status_for_stage(event: dict, stage: str) -> str:
    return event_stage_status_map(event).get(stage, DEFAULT_STAGE_STATUS.get(stage, "CREATED"))


def stage_for_status(event: dict, lead_status: str) -> str:
    """시트의 lead_status 값을 CRM 단계로 역매핑."""
    if not lead_status:
        return "new_lead"
    upper = lead_status.strip().upper()
    smap = event_stage_status_map(event)
    for stage, status in smap.items():
        if status.strip().upper() == upper:
            return stage
    cfg = (event or {}).get("config", {})
    consulting_alts = cfg.get("statusConfig", {}).get("consulting", []) or []
    if lead_status in consulting_alts:
        return "consulting"
    return "new_lead"


def now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def add_activity(lead: dict, atype: str, message: str, meta: dict | None = None) -> None:
    """리드의 활동 이력에 누적 추가하고, 표시용 log 필드를 최신으로 동기화."""
    if "activities" not in lead or not isinstance(lead.get("activities"), list):
        lead["activities"] = []
    entry = {"at": now_iso(), "type": atype, "message": message}
    if meta:
        entry["meta"] = meta
    lead["activities"].append(entry)
    lead["log"] = message  # 카드 표시용 최신 메시지


def push_status_to_sheet(event: dict, lead: dict, new_status: str) -> str:
    """Send lead_status update to Apps Script webhook. Returns result string."""
    webhook_url = (event or {}).get("sheetWebhookUrl", "").strip()
    if not webhook_url:
        return "skipped"
    payload = {
        "action": "update_status",
        "rowId": lead.get("sheetRowId", ""),
        "phone": lead.get("phone", ""),
        "lead_status": new_status,
        "updatedAt": now_iso(),
    }
    try:
        req = Request(
            webhook_url,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json; charset=utf-8"},
            method="POST",
        )
        with urlopen(req, timeout=5) as resp:  # nosec B310
            return f"sent:{resp.status}"
    except Exception as e:  # noqa: BLE001
        return f"failed:{e}"

def normalize_phone(value: str, prefix_to_strip: str = "p:") -> str:
    # Example raw: "p:+77475789240"
    if not value:
        return ""
    value = value.strip()
    if prefix_to_strip and value.startswith(prefix_to_strip):
        value = value[len(prefix_to_strip):]
    return value


def normalize_platform(value: str) -> str:
    v = (value or "").strip().lower()
    if v in {"ig", "instagram", "인스타그램"}:
        return "instagram"
    if v in {"fb", "facebook"}:
        return "facebook"
    if v in {"m1"}:
        return "m1"
    return v or "unknown"


def _connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_FILE), timeout=10)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    conn = _connect()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id   TEXT PRIMARY KEY,
                data TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id       TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                data     TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_leads_event ON leads(event_id)")
        conn.commit()
    finally:
        conn.close()


def migrate_legacy_json() -> None:
    """첫 실행 시 mvp_db.json 데이터를 SQLite로 옮기고 원본은 .migrated로 보관."""
    if DB_FILE.exists() and DB_FILE.stat().st_size > 0:
        # SQLite에 이미 데이터 있으면 스킵
        conn = _connect()
        try:
            count = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        finally:
            conn.close()
        if count > 0:
            return
    if not LEGACY_JSON.exists():
        return
    print(f"[INFO] mvp_db.json 발견 → SQLite로 마이그레이션 중...", flush=True)
    legacy = json.loads(LEGACY_JSON.read_text(encoding="utf-8"))
    save_db(legacy)
    backup_path = LEGACY_JSON.with_suffix(".json.migrated")
    LEGACY_JSON.rename(backup_path)
    print(f"[INFO] 마이그레이션 완료. 원본은 {backup_path.name} 으로 보관.", flush=True)


def load_db() -> dict:
    conn = _connect()
    try:
        events = [json.loads(r[0]) for r in conn.execute("SELECT data FROM events ORDER BY rowid")]
        leads  = [json.loads(r[0]) for r in conn.execute("SELECT data FROM leads ORDER BY rowid")]
    finally:
        conn.close()
    return {"events": events, "leads": leads}


def save_db(db: dict) -> None:
    """단일 트랜잭션으로 events/leads 전체 덮어쓰기. 동시성 안전."""
    with _DB_LOCK:
        conn = _connect()
        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute("DELETE FROM events")
            conn.execute("DELETE FROM leads")
            for e in db.get("events", []):
                conn.execute(
                    "INSERT INTO events (id, data) VALUES (?, ?)",
                    (e["id"], json.dumps(e, ensure_ascii=False)),
                )
            for l in db.get("leads", []):
                conn.execute(
                    "INSERT INTO leads (id, event_id, data) VALUES (?, ?, ?)",
                    (l["id"], l.get("eventId", ""), json.dumps(l, ensure_ascii=False)),
                )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def make_backup(reason: str = "scheduled") -> dict:
    """SQLite .backup() API로 핫백업 수행 (트랜잭션 도중에도 안전)."""
    if not DB_FILE.exists():
        return {"ok": False, "error": "db not found"}
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    target = BACKUP_DIR / f"crm_{ts}_{reason}.db"
    try:
        with _DB_LOCK:
            src = sqlite3.connect(str(DB_FILE))
            try:
                dst = sqlite3.connect(str(target))
                try:
                    src.backup(dst)
                finally:
                    dst.close()
            finally:
                src.close()
        # 보관 정책: 최신 BACKUP_RETAIN개만 유지
        backups = sorted(BACKUP_DIR.glob("crm_*.db"))
        for old in backups[:-BACKUP_RETAIN]:
            try:
                old.unlink()
            except OSError:
                pass
        size = target.stat().st_size
        try:
            print(f"[BACKUP] {target.name} ({size:,} bytes) - keep {BACKUP_RETAIN}", flush=True)
        except UnicodeEncodeError:
            pass
        return {"ok": True, "file": target.name, "size": size}
    except Exception as e:  # noqa: BLE001
        try:
            print(f"[BACKUP] failed: {e}", flush=True)
        except UnicodeEncodeError:
            pass
        return {"ok": False, "error": str(e)}


def list_backups() -> list[dict]:
    if not BACKUP_DIR.exists():
        return []
    out = []
    for f in sorted(BACKUP_DIR.glob("crm_*.db"), reverse=True):
        st = f.stat()
        out.append({
            "name": f.name,
            "size": st.st_size,
            "modifiedAt": datetime.utcfromtimestamp(st.st_mtime).isoformat() + "Z",
        })
    return out


def schedule_periodic_backup(interval_seconds: int = 24 * 3600) -> None:
    """startup + 매 24h 마다 백업. 데몬 스레드로 동작."""
    def _tick():
        make_backup("scheduled")
        timer = threading.Timer(interval_seconds, _tick)
        timer.daemon = True
        timer.start()
    # 시작 즉시 1회 + 24h 마다
    threading.Timer(2.0, _tick).start()  # 부팅 직후 2초 뒤 1회


def load_sheet_rows() -> list:
    if SHEET_ROWS_PATH.exists():
        return json.loads(SHEET_ROWS_PATH.read_text(encoding="utf-8"))
    return []


def save_sheet_rows(rows: list) -> None:
    SHEET_ROWS_PATH.parent.mkdir(parents=True, exist_ok=True)
    SHEET_ROWS_PATH.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")


def create_lead_from_instagram_row(db: dict, event: dict, body: dict) -> dict:
    created_time = body.get("created_time") or now_iso()
    cfg = event.get("config", {})
    phone_prefix = cfg.get("phonePrefixToStrip", "p:")
    phone = normalize_phone(body.get("phone_number", ""), phone_prefix)
    platform = normalize_platform(body.get("platform", ""))
    lead_status = (body.get("lead_status") or status_for_stage(event, "new_lead")).strip()
    stage = stage_for_status(event, lead_status)
    lead = {
        "id": str(uuid.uuid4()),
        "eventId": event["id"],
        "name": body.get("full_name", "").strip() or f"리드{len(db['leads']) + 1}",
        "phone": phone or "+82-10-0000-0000",
        "service": event.get("defaultService", "checkup"),
        "stage": stage,
        "createdAt": created_time,
        "platform": platform,
        "lead_status": lead_status,
        "activities": [],
        "notes": [],
    }
    add_activity(lead, "imported", f"인입({platform}) status={lead_status} → stage={stage}")
    db["leads"].append(lead)
    return lead


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _check_auth(self) -> bool:
        """BASIC 인증 확인. AUTH_ENABLED=False면 항상 통과."""
        if not AUTH_ENABLED:
            return True
        header = self.headers.get("Authorization", "")
        if not header.startswith("Basic "):
            return False
        try:
            decoded = base64.b64decode(header[6:]).decode("utf-8", errors="replace")
        except Exception:  # noqa: BLE001
            return False
        user, _, pw = decoded.partition(":")
        return user == CRM_USER and pw == CRM_PASS

    def _require_auth(self) -> bool:
        if self._check_auth():
            return True
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Event CRM"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", "23")
        self.end_headers()
        self.wfile.write(b"Authentication required")
        return False

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        # 인증 실패 로그 노이즈 줄이기 (선택 사항)
        super().log_message(format, *args)

    def _send_json(self, code: int, payload: dict | list) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def _not_found(self):
        self._send_json(404, {"error": "not found"})

    def do_GET(self):
        if not self._require_auth():
            return
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json(200, {
                "status": "ok",
                "time": now_iso(),
                "auth": "enabled" if AUTH_ENABLED else "disabled",
                "db": "sqlite",
            })
            return

        if path == "/api/admin/backups":
            self._send_json(200, {
                "retain": BACKUP_RETAIN,
                "dir": str(BACKUP_DIR.relative_to(ROOT)),
                "items": list_backups(),
            })
            return

        if path == "/api/events":
            db = load_db()
            self._send_json(200, db["events"])
            return

        if path.startswith("/api/events/") and path.endswith("/leads"):
            event_id = path.split("/")[3]
            db = load_db()
            leads = [l for l in db["leads"] if l["eventId"] == event_id]
            self._send_json(200, leads)
            return

        if path.startswith("/api/events/") and path.endswith("/stats"):
            event_id = path.split("/")[3]
            db = load_db()
            leads = [l for l in db["leads"] if l["eventId"] == event_id]
            stage_counts: dict[str, int] = {}
            for stage in DEFAULT_STAGE_STATUS.keys():
                stage_counts[stage] = 0
            for l in leads:
                s = l.get("stage", "new_lead")
                stage_counts[s] = stage_counts.get(s, 0) + 1
            self._send_json(200, {
                "total": len(leads),
                "byStage": stage_counts,
                "needsAction": stage_counts.get("new_lead", 0) + stage_counts.get("no_response", 0) + stage_counts.get("recontact_needed", 0),
            })
            return

        if path.startswith("/api/events/") and path.endswith("/sheet-status"):
            event_id = path.split("/")[3]
            db = load_db()
            event = next((e for e in db["events"] if e["id"] == event_id), None)
            if not event:
                self._not_found()
                return
            cfg = event.get("config", {})
            sheet_url = event.get("sheetUrl", "").strip()
            api_key = cfg.get("googleApiKey", "").strip()
            sheet_name = cfg.get("sheetName", "").strip()
            status = {
                "sheetUrl": sheet_url or "(미설정)",
                "apiKey": "설정됨" if api_key else "(미설정)",
                "sheetName": sheet_name or "(기본값: 첫 탭)",
                "connection": None,
                "rowCount": None,
                "columns": None,
                "error": None,
            }
            if not sheet_url:
                status["error"] = "Sheet URL이 설정되지 않았습니다."
                self._send_json(200, status)
                return
            if not api_key:
                status["error"] = "Google API Key가 설정되지 않았습니다. 구글시트 연결 설정에서 저장하세요."
                self._send_json(200, status)
                return
            sheet_id = extract_sheet_id(sheet_url)
            if not sheet_id:
                status["error"] = "Sheet URL에서 ID를 파싱할 수 없습니다."
                self._send_json(200, status)
                return
            try:
                rows = fetch_sheet_rows(sheet_id, api_key, sheet_name)
                status["connection"] = "성공"
                status["rowCount"] = len(rows)
                status["columns"] = list(rows[0].keys()) if rows else []
            except Exception as e:  # noqa: BLE001
                status["connection"] = "실패"
                status["error"] = str(e)
            self._send_json(200, status)
            return

        if path.startswith("/ui"):
            return super().do_GET()

        if path == "/":
            self.send_response(302)
            self.send_header("Location", "/ui/")
            self.end_headers()
            return

        return super().do_GET()

    def do_DELETE(self):
        if not self._require_auth():
            return
        parsed = urlparse(self.path)
        path = parsed.path
        db = load_db()

        if path.startswith("/api/events/") and path.endswith("/leads"):
            event_id = path.split("/")[3]
            event = next((e for e in db["events"] if e["id"] == event_id), None)
            if event and event.get("archived"):
                self._send_json(403, {"error": "event archived"})
                return
            before = len(db["leads"])
            db["leads"] = [l for l in db["leads"] if l["eventId"] != event_id]
            removed = before - len(db["leads"])
            save_db(db)
            self._send_json(200, {"removed": removed})
            return

        # /api/leads/{id}/notes/{noteId}
        parts = path.split("/")
        if len(parts) == 6 and parts[1] == "api" and parts[2] == "leads" and parts[4] == "notes":
            lead_id = parts[3]
            note_id = parts[5]
            for lead in db["leads"]:
                if lead["id"] == lead_id:
                    event = next((e for e in db["events"] if e["id"] == lead["eventId"]), None)
                    if event and event.get("archived"):
                        self._send_json(403, {"error": "event archived"})
                        return
                    notes = lead.get("notes", []) or []
                    new_notes = [n for n in notes if n.get("id") != note_id]
                    if len(new_notes) == len(notes):
                        self._send_json(404, {"error": "note not found"})
                        return
                    lead["notes"] = new_notes
                    save_db(db)
                    self._send_json(200, {"removed": note_id})
                    return
            self._not_found()
            return

        if path.startswith("/api/events/") and len(path.split("/")) == 4:
            event_id = path.split("/")[3]
            event = next((e for e in db["events"] if e["id"] == event_id), None)
            if event and event.get("archived"):
                self._send_json(403, {"error": "event archived (unarchive first)"})
                return
            before_e = len(db["events"])
            db["events"] = [e for e in db["events"] if e["id"] != event_id]
            db["leads"] = [l for l in db["leads"] if l["eventId"] != event_id]
            if len(db["events"]) == before_e:
                self._not_found()
                return
            save_db(db)
            self._send_json(200, {"deleted": event_id})
            return

        self._not_found()

    def do_POST(self):
        if not self._require_auth():
            return
        parsed = urlparse(self.path)
        path = parsed.path
        db = load_db()


        if path == "/api/admin/backup":
            result = make_backup("manual")
            self._send_json(200 if result.get("ok") else 500, result)
            return

        if path == "/api/events":
            body = self._read_json()
            event = {
                "id": str(uuid.uuid4()),
                "name": body.get("name", ""),
                "country": body.get("country", ""),
                "defaultService": body.get("defaultService", "checkup"),
                "sheetUrl": "",
                "sheetWebhookUrl": "",
                "archived": False,
                "config": {
                    "phonePrefixToStrip": "p:",
                    "statusConfig": {"created": "CREATED", "consulting": ["IN_PROGRESS", "상담 중"]},
                    "faqTemplates": [],
                    "replyTemplates": {
                        "ko": "안녕하세요 {{name}}님, 문의 감사합니다.",
                        "en": "Hi {{name}}, thanks for your inquiry.",
                        "ru": "Здравствуйте, {{name}}. Спасибо за обращение.",
                    },
                },
                "createdAt": now_iso(),
            }
            db["events"].append(event)
            save_db(db)
            self._send_json(201, event)
            return

        if path.startswith("/api/events/") and path.endswith("/sheet"):
            event_id = path.split("/")[3]
            body = self._read_json()
            for e in db["events"]:
                if e["id"] == event_id:
                    e["sheetUrl"] = body.get("sheetUrl", "")
                    save_db(db)
                    self._send_json(200, e)
                    return
            self._not_found()
            return

        if path.startswith("/api/events/") and path.endswith("/sheet-webhook"):
            event_id = path.split("/")[3]
            body = self._read_json()
            for e in db["events"]:
                if e["id"] == event_id:
                    e["sheetWebhookUrl"] = body.get("sheetWebhookUrl", "")
                    save_db(db)
                    self._send_json(200, e)
                    return
            self._not_found()
            return

        if path.startswith("/api/events/") and path.endswith("/config"):
            event_id = path.split("/")[3]
            body = self._read_json()
            for e in db["events"]:
                if e["id"] == event_id:
                    current = e.get("config", {})
                    merged = {**current, **body}
                    # nested merge for known objects
                    if "statusConfig" in body:
                        merged["statusConfig"] = {**current.get("statusConfig", {}), **body["statusConfig"]}
                    if "replyTemplates" in body:
                        merged["replyTemplates"] = {**current.get("replyTemplates", {}), **body["replyTemplates"]}
                    if "stageStatusMap" in body:
                        merged["stageStatusMap"] = {**current.get("stageStatusMap", {}), **body["stageStatusMap"]}
                    if "whatsapp" in body:
                        merged["whatsapp"] = {**current.get("whatsapp", {}), **body["whatsapp"]}
                    e["config"] = merged
                    save_db(db)
                    self._send_json(200, e)
                    return
            self._not_found()
            return

        if path.startswith("/api/events/") and path.endswith("/archive"):
            event_id = path.split("/")[3]
            body = self._read_json()
            archived = bool(body.get("archived", True))
            for e in db["events"]:
                if e["id"] == event_id:
                    e["archived"] = archived
                    if archived:
                        e["archivedAt"] = now_iso()
                    else:
                        e.pop("archivedAt", None)
                    save_db(db)
                    self._send_json(200, e)
                    return
            self._not_found()
            return

        if path.startswith("/api/events/") and path.endswith("/leads"):
            event_id = path.split("/")[3]
            event = next((e for e in db["events"] if e["id"] == event_id), None)
            if not event:
                self._not_found()
                return
            if event.get("archived"):
                self._send_json(403, {"error": "event archived"})
                return
            lead = {
                "id": str(uuid.uuid4()),
                "eventId": event_id,
                "name": f"리드{len(db['leads']) + 1}",
                "phone": "+82-10-1234-5678",
                "service": event.get("defaultService", "checkup"),
                "stage": "new_lead",
                "createdAt": now_iso(),
                "log": "신규 리드 유입",
            }
            db["leads"].append(lead)
            save_db(db)
            self._send_json(201, lead)
            return

        if path == "/api/ingest/instagram-new":
            body = self._read_json()
            event_id = body.get("eventId", "")
            event = next((e for e in db["events"] if e["id"] == event_id), None)
            if not event:
                self._not_found()
                return
            if event.get("archived"):
                self._send_json(403, {"error": "event archived"})
                return
            lead = create_lead_from_instagram_row(db, event, body)
            save_db(db)
            self._send_json(201, lead)
            return

        if path.startswith("/api/events/") and path.endswith("/append-instagram-row"):
            event_id = path.split("/")[3]
            body = self._read_json()
            event = next((e for e in db["events"] if e["id"] == event_id), None)
            if not event:
                self._not_found()
                return
            if event.get("archived"):
                self._send_json(403, {"error": "event archived"})
                return

            # 1) 신규행 저장(시트 모의 저장소)
            row = {
                "eventId": event_id,
                "source_tab": "Instagram New",
                "created_time": body.get("created_time") or now_iso(),
                "platform": body.get("platform", ""),
                "phone_number": body.get("phone_number", ""),
                "full_name": body.get("full_name", ""),
                "lead_status": body.get("lead_status", "CREATED"),
                "savedAt": now_iso(),
            }
            rows = load_sheet_rows()
            rows.append(row)
            save_sheet_rows(rows)

            # 2) webhook 설정 시 외부 Apps Script로 전달(옵션)
            webhook_url = event.get("sheetWebhookUrl", "").strip()
            webhook_result = "skipped"
            if webhook_url:
                try:
                    req = Request(
                        webhook_url,
                        data=json.dumps(row, ensure_ascii=False).encode("utf-8"),
                        headers={"Content-Type": "application/json; charset=utf-8"},
                        method="POST",
                    )
                    with urlopen(req, timeout=5) as resp:  # nosec B310
                        webhook_result = f"sent:{resp.status}"
                except Exception as e:  # noqa: BLE001
                    webhook_result = f"failed:{e}"

            # 3) CRM 리드에도 즉시 인입
            ingest_body = {"eventId": event_id, **row}
            lead = create_lead_from_instagram_row(db, event, ingest_body)
            lead["log"] += f" · sheet_append={webhook_result}"
            save_db(db)

            self._send_json(201, {"sheet_row": row, "webhook": webhook_result, "lead": lead})
            return

        if path.startswith("/api/events/") and path.endswith("/import-from-sheet"):
            event_id = path.split("/")[3]
            body = self._read_json()
            event = next((e for e in db["events"] if e["id"] == event_id), None)
            if not event:
                self._not_found()
                return
            if event.get("archived"):
                self._send_json(403, {"error": "event archived"})
                return
            cfg = event.get("config", {})
            api_key = body.get("apiKey", "").strip() or cfg.get("googleApiKey", "").strip()
            if not api_key:
                self._send_json(400, {"error": "apiKey is required (set in System Config or pass in request)"})
                return
            sheet_url = event.get("sheetUrl", "").strip()
            if not sheet_url:
                self._send_json(400, {"error": "sheetUrl not set on event"})
                return
            sheet_id = extract_sheet_id(sheet_url)
            if not sheet_id:
                self._send_json(400, {"error": "could not parse sheet ID from sheetUrl"})
                return
            sheet_name = body.get("sheetName", "").strip() or cfg.get("sheetName", "").strip()
            try:
                rows = fetch_sheet_rows(sheet_id, api_key, sheet_name)
            except Exception as e:  # noqa: BLE001
                self._send_json(502, {"error": f"sheet fetch failed: {e}"})
                return

            existing_ids = {l.get("sheetRowId") for l in db["leads"] if l.get("sheetRowId")}
            imported, skipped = [], 0
            for row in rows:
                row_id = row.get("id", "").strip()
                if row_id and row_id in existing_ids:
                    skipped += 1
                    continue
                lead = create_lead_from_instagram_row(db, event, row)
                lead["sheetRowId"] = row_id
                lead["ad_name"] = row.get("ad_name", "")
                lead["campaign_name"] = row.get("campaign_name", "")
                lead["form_name"] = row.get("form_name", "")
                imported.append(lead)
                existing_ids.add(row_id)
            save_db(db)
            self._send_json(200, {"imported": len(imported), "skipped": skipped, "leads": imported})
            return

        if path.startswith("/api/leads/") and path.endswith("/auto-reply"):
            lead_id = path.split("/")[3]
            for lead in db["leads"]:
                if lead["id"] == lead_id:
                    event = next((e for e in db["events"] if e["id"] == lead["eventId"]), None)
                    if event and event.get("archived"):
                        self._send_json(403, {"error": "event archived"})
                        return
                    new_stage = "auto_replied"
                    new_status = status_for_stage(event, new_stage)
                    lead["stage"] = new_stage
                    lead["lead_status"] = new_status
                    sheet_result = push_status_to_sheet(event, lead, new_status)
                    lead["sheetWriteback"] = sheet_result
                    add_activity(lead, "auto_replied", f"자동응답 → {new_status}", {"sheetSync": sheet_result})
                    save_db(db)
                    self._send_json(200, lead)
                    return
            self._not_found()
            return

        if path.startswith("/api/leads/") and path.endswith("/quick-action"):
            lead_id = path.split("/")[3]
            body = self._read_json()
            action = body.get("action", "")
            for lead in db["leads"]:
                if lead["id"] == lead_id:
                    event = next((e for e in db["events"] if e["id"] == lead["eventId"]), None)
                    if event and event.get("archived"):
                        self._send_json(403, {"error": "event archived"})
                        return
                    new_stage = "booking_push" if action == "btn_booking_push" else "consulting"
                    new_status = status_for_stage(event, new_stage)
                    lead["stage"] = new_stage
                    lead["lead_status"] = new_status
                    sheet_result = push_status_to_sheet(event, lead, new_status)
                    lead["sheetWriteback"] = sheet_result
                    add_activity(lead, "quick_action", f"응답선택 {action} → {new_status}", {"sheetSync": sheet_result})
                    save_db(db)
                    self._send_json(200, lead)
                    return
            self._not_found()
            return

        if path.startswith("/api/leads/") and path.endswith("/stage"):
            lead_id = path.split("/")[3]
            body = self._read_json()
            new_stage = body.get("stage", "new_lead")
            for lead in db["leads"]:
                if lead["id"] == lead_id:
                    event = next((e for e in db["events"] if e["id"] == lead["eventId"]), None)
                    if event and event.get("archived"):
                        self._send_json(403, {"error": "event archived"})
                        return
                    new_status = status_for_stage(event, new_stage)
                    lead["stage"] = new_stage
                    lead["lead_status"] = new_status
                    sheet_result = push_status_to_sheet(event, lead, new_status)
                    lead["sheetWriteback"] = sheet_result
                    add_activity(lead, "stage_changed", f"단계변경 → {new_stage} ({new_status})", {"sheetSync": sheet_result})
                    save_db(db)
                    self._send_json(200, lead)
                    return
            self._not_found()
            return

        if path.startswith("/api/leads/") and path.endswith("/send-whatsapp"):
            lead_id = path.split("/")[3]
            body = self._read_json()
            message = body.get("message", "").strip()
            title = body.get("title", "").strip()
            if not message:
                self._send_json(400, {"error": "message is required"})
                return
            for lead in db["leads"]:
                if lead["id"] == lead_id:
                    event = next((e for e in db["events"] if e["id"] == lead["eventId"]), None)
                    if event and event.get("archived"):
                        self._send_json(403, {"error": "event archived"})
                        return
                    new_stage = "consulting"
                    new_status = status_for_stage(event, new_stage)
                    lead["stage"] = new_stage
                    lead["lead_status"] = new_status
                    sheet_result = push_status_to_sheet(event, lead, new_status)
                    lead["sheetWriteback"] = sheet_result
                    add_activity(lead, "whatsapp_sent", f"WhatsApp 발송: {title or '(제목없음)'}", {"sheetSync": sheet_result, "preview": message[:80]})
                    save_db(db)
                    self._send_json(200, {"status": "sent", "sheetWriteback": sheet_result, "lead": lead})
                    return
            self._not_found()
            return

        if path.startswith("/api/leads/") and path.endswith("/notes"):
            lead_id = path.split("/")[3]
            body = self._read_json()
            text = (body.get("text") or "").strip()
            if not text:
                self._send_json(400, {"error": "text is required"})
                return
            for lead in db["leads"]:
                if lead["id"] == lead_id:
                    event = next((e for e in db["events"] if e["id"] == lead["eventId"]), None)
                    if event and event.get("archived"):
                        self._send_json(403, {"error": "event archived"})
                        return
                    if "notes" not in lead or not isinstance(lead.get("notes"), list):
                        lead["notes"] = []
                    note = {"id": str(uuid.uuid4()), "at": now_iso(), "text": text}
                    lead["notes"].append(note)
                    add_activity(lead, "note_added", f"메모 추가: {text[:60]}")
                    save_db(db)
                    self._send_json(201, lead)
                    return
            self._not_found()
            return

        self._not_found()


if __name__ == "__main__":
    port = int(os.environ.get("CRM_PORT", "8080"))

    init_db()
    migrate_legacy_json()
    schedule_periodic_backup()

    print(f"[INFO] Event CRM 서버 시작: http://localhost:{port}/ui/")
    print(f"[INFO] DB: {DB_FILE.relative_to(ROOT)}, Backup: {BACKUP_DIR.relative_to(ROOT)} (최근 {BACKUP_RETAIN}개 보관)")
    if AUTH_ENABLED:
        print(f"[INFO] BASIC 인증 활성화 (사용자: {CRM_USER})")
    else:
        print("[INFO] 인증 비활성화 (CRM_USER/CRM_PASS 환경변수로 활성화 가능)")
    print("[INFO] Ctrl+C 로 종료")
    try:
        ThreadingHTTPServer(("", port), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] 서버 종료")
