# Google Sheets 자동 업데이트 설정 가이드

CRM에서 단계가 변경되면 시트의 `lead_status` 컬럼이 자동 업데이트되도록 설정합니다.

| CRM 동작 | 시트에 기록되는 lead_status |
|----------|----------------------------|
| 자동응답 실행 | `AUTOANSWER` |
| WhatsApp/FAQ 응답 발송 | `ANSWER` |
| 단계를 "예약 완료"로 변경 | `END` |
| 단계를 "미응답"으로 변경 | `NO_RESPONSE` |
| 단계를 "재접촉 필요"로 변경 | `RECONTACT` |

---

## 1. Apps Script 배포

### Step 1 — 시트 열기
연동할 Google Sheet를 브라우저에서 엽니다.

### Step 2 — Apps Script 진입
**확장 프로그램(Extensions) > Apps Script** 클릭.

### Step 3 — 코드 붙여넣기
좌측 `Code.gs` 파일 내용을 모두 지우고, [Code.gs](./Code.gs) 의 내용을 그대로 붙여넣습니다.

### Step 4 — 시트 탭 이름 수정
`Code.gs` 최상단의 다음 줄을 본인 시트 탭명으로 수정:
```javascript
const SHEET_NAME = "Instagram New"; // ← 본인 시트 탭명으로 수정
```

CRM의 "시트 탭 이름" 설정과 **반드시 동일**해야 합니다.

### Step 5 — 저장
**Ctrl+S** 또는 디스크 아이콘 클릭. 프로젝트 이름을 묻는 경우 "Event CRM Webhook" 등으로 지정.

### Step 6 — 웹앱으로 배포
1. 우측 상단 **배포(Deploy) > 새 배포(New deployment)** 클릭
2. ⚙️ 톱니바퀴 → **웹 앱(Web app)** 선택
3. 설정:
   - **다음 사용자 인증 정보로 실행:** `나` (sheet 소유자)
   - **액세스 권한:** `모든 사용자(Anyone)` ⚠️ 익명 호출 허용
4. **배포** 클릭
5. 권한 승인 (Google 계정 로그인 → 고급 → 안전하지 않은 페이지로 이동 → 허용)
6. **웹 앱 URL** 복사 (예: `https://script.google.com/macros/s/.../exec`)

> **재배포 주의:** 코드 수정 후에는 반드시 **새 배포**가 필요합니다 (기존 배포의 "버전 관리"에서 새 버전을 만드세요). 그렇지 않으면 변경사항이 반영되지 않습니다.

---

## 2. CRM에 Webhook URL 등록

1. CRM의 **행사 / 시트 연결** 탭 진입
2. **Sheet Webhook URL** 칸에 위에서 복사한 URL 붙여넣기
3. **시트 설정 저장** 클릭

---

## 3. 동작 확인

### 테스트 방법
1. 리드 카드의 단계를 **자동응답 완료** 등으로 변경
2. CRM 리드의 로그에 `sheet=sent:200` 표시되는지 확인
3. 구글시트의 해당 행 `lead_status` 컬럼이 변경됐는지 확인

### 로그 의미
- `sheet=sent:200` → 시트에 정상 반영
- `sheet=skipped` → Webhook URL이 비어있어 시트 업데이트 안 함
- `sheet=failed:...` → 호출 실패 (Apps Script 권한, URL 오류 등)

---

## 4. 매칭 동작

Apps Script는 다음 순서로 시트의 행을 찾아 업데이트합니다:

1. **id 컬럼** 으로 매칭 (`sheetRowId`가 있을 때)
2. **phone_number 컬럼** 으로 매칭 (suffix 매칭 — `p:+77...`도 `+77...`과 매칭됨)

수동 입력으로 시트 행 ID 없이 추가된 리드도 전화번호로 자동 매칭됩니다.

---

## 5. 수동 테스트

Apps Script 에디터에서:
1. 함수 선택 드롭다운에서 `testUpdateStatus` 선택
2. ▶️ **실행** 클릭
3. 좌측 **실행 로그**에서 결과 확인 (`{ ok: true, matched: "id", row: 5 }` 등)

---

## 보안 고려사항

- 웹 앱은 익명(`Anyone`)으로 배포되므로 URL이 노출되면 누구나 호출 가능
- URL을 비공개로 유지 (Slack/메모/Git에 평문 노출 금지)
- 노출 시 즉시 새 배포로 URL 교체 후 CRM에 재등록
- 더 안전한 방식이 필요하면 OAuth 또는 Service Account 방식으로 전환 가능
