/**
 * Event CRM ⇄ Google Sheets 연동 Apps Script
 *
 * 지원 액션:
 *  - update_status : CRM에서 단계 변경 시 lead_status 컬럼 업데이트
 *  - append        : 신규 행 추가 (CRM 수동 인입)
 *
 * 매칭 우선순위 (update_status):
 *  1. id 컬럼 == payload.rowId
 *  2. phone_number 컬럼이 payload.phone 으로 끝남 (prefix 제거 대응)
 */

const SHEET_NAME = "Instagram New"; // ← 본인 시트 탭명으로 수정

const COL = {
  id: "id",
  phone: "phone_number",
  name: "full_name",
  status: "lead_status",
  platform: "platform",
  createdTime: "created_time",
};

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || "append";

    let result;
    if (action === "update_status") {
      result = updateStatus(payload);
    } else if (action === "append") {
      result = appendRow(payload);
    } else {
      result = { ok: false, error: "unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error("Sheet not found: " + SHEET_NAME);
  return sh;
}

function getHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => { map[String(h).trim()] = i + 1; }); // 1-based
  return { headers, map };
}

function updateStatus(payload) {
  const sheet = getSheet();
  const { map } = getHeaderMap(sheet);

  const idCol = map[COL.id];
  const phoneCol = map[COL.phone];
  const statusCol = map[COL.status];
  if (!statusCol) throw new Error("lead_status column not found");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: false, error: "no data rows" };

  const rowId = String(payload.rowId || "").trim();
  const phone = String(payload.phone || "").trim();
  const newStatus = String(payload.lead_status || "").trim();

  // id 컬럼으로 1차 매칭
  if (rowId && idCol) {
    const idValues = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    for (let i = 0; i < idValues.length; i++) {
      if (String(idValues[i][0]).trim() === rowId) {
        sheet.getRange(i + 2, statusCol).setValue(newStatus);
        return { ok: true, matched: "id", row: i + 2, status: newStatus };
      }
    }
  }

  // phone 컬럼으로 2차 매칭 (suffix 매칭: "p:+77..." 도 "+77..." 와 매칭)
  if (phone && phoneCol) {
    const phoneValues = sheet.getRange(2, phoneCol, lastRow - 1, 1).getValues();
    for (let i = 0; i < phoneValues.length; i++) {
      const cell = String(phoneValues[i][0]).trim();
      if (cell && (cell === phone || cell.endsWith(phone) || phone.endsWith(cell))) {
        sheet.getRange(i + 2, statusCol).setValue(newStatus);
        return { ok: true, matched: "phone", row: i + 2, status: newStatus };
      }
    }
  }

  return { ok: false, error: "no matching row", rowId: rowId, phone: phone };
}

function appendRow(payload) {
  const sheet = getSheet();
  const { headers, map } = getHeaderMap(sheet);

  const row = headers.map(() => "");
  if (map[COL.createdTime]) row[map[COL.createdTime] - 1] = payload.created_time || new Date().toISOString();
  if (map[COL.platform])    row[map[COL.platform] - 1]    = payload.platform || "";
  if (map[COL.phone])       row[map[COL.phone] - 1]       = payload.phone_number || "";
  if (map[COL.name])        row[map[COL.name] - 1]        = payload.full_name || "";
  if (map[COL.status])      row[map[COL.status] - 1]      = payload.lead_status || "CREATED";

  sheet.appendRow(row);
  return { ok: true, action: "appended", row: sheet.getLastRow() };
}

// 수동 테스트용
function testUpdateStatus() {
  const result = updateStatus({
    rowId: "l:887755310987603",
    phone: "",
    lead_status: "AUTOANSWER",
  });
  Logger.log(result);
}
