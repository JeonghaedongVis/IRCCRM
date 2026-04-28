// ========== DOM References ==========
const eventForm = document.getElementById("event-form");
const sheetForm = document.getElementById("sheet-form");
const eventSelect = document.getElementById("event-select");
const configEventSelect = document.getElementById("config-event-select");
const eventMeta = document.getElementById("event-meta");
const leadList = document.getElementById("lead-list");
const leadSummary = document.getElementById("lead-summary");
const leadTemplate = document.getElementById("lead-template");
const leadSearch = document.getElementById("lead-search");
const stageFilter = document.getElementById("stage-filter");
const instagramIngestForm = document.getElementById("instagram-ingest-form");
const appendSheetRowBtn = document.getElementById("append-sheet-row-btn");
const configForm = document.getElementById("config-form");
const inquiryForm = document.getElementById("inquiry-form");
const uiLanguageSelect = document.getElementById("ui-language");
const menuButtons = document.querySelectorAll(".sidebar .menu-btn");
const quickNavButtons = document.querySelectorAll(".quick-nav");
const views = document.querySelectorAll(".view");
const dashboardLeadsCount = document.getElementById("dashboard-leads-count");
const dashboardConsultingCount = document.getElementById("dashboard-consulting-count");
const dashboardNeedsAction = document.getElementById("dashboard-needs-action");
const dashboardBookedCount = document.getElementById("dashboard-booked-count");
const stageBreakdown = document.getElementById("stage-breakdown");
const statsStageBreakdown = document.getElementById("stats-stage-breakdown");
const statsSummary = document.getElementById("stats-summary");
const inquiryEventSelect = document.getElementById("inquiry-event-select");
const faqList = document.getElementById("faq-list");
const toastContainer = document.getElementById("toast-container");

// ========== Constants ==========
const STAGE_PRIORITY = {
  new_lead: 0,
  no_response: 1,
  recontact_needed: 2,
  auto_replied: 3,
  consulting: 4,
  booking_push: 5,
  booked: 6,
};

function stageShortLabel(stage) {
  return t(`stage_short_${stage}`);
}

const STAGE_ICON = {
  new_lead: "circle-dot",
  no_response: "clock-alert",
  recontact_needed: "repeat",
  auto_replied: "check-circle",
  consulting: "messages-square",
  booking_push: "calendar-clock",
  booked: "calendar-check",
};

function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

const STAGE_GROUP = {
  needs_action: ["new_lead", "no_response", "recontact_needed"],
  in_progress: ["auto_replied", "consulting", "booking_push"],
  done: ["booked"],
};

const PAGE_SIZE = 30;

// ========== State ==========
const state = {
  events: [],
  leads: [],
  filter: "all",
  search: "",
  showAll: false,
};

// ========== i18n ==========
const i18n = {
  ko: {
    title: "Event CRM",
    subtitle: "행사 · 시트 · 자동응답",
    language: "언어",

    nav_dashboard: "대시보드",
    nav_crm: "행사 / 시트 연결",
    nav_leads: "리드 현황",
    nav_stats: "통계",
    nav_settings: "설정",
    nav_event_settings: "행사 세부 설정",
    nav_whatsapp: "WhatsApp 연동",
    nav_faq_settings: "FAQ 설정",

    page_dashboard_title: "대시보드",
    page_dashboard_sub: "현재 행사의 핵심 지표를 한눈에 확인합니다.",
    page_crm_title: "행사 / 시트 연결",
    page_crm_sub: "행사 등록 → 구글시트 연결 → API 키 입력 후 저장합니다.",
    page_leads_title: "리드 현황",
    page_leads_sub: "답변이 필요한 리드가 항상 최상단에 표시됩니다.",
    page_stats_title: "통계",
    page_stats_sub: "현재 선택된 행사 기준 요약 지표입니다.",
    page_faq_title: "FAQ 관리",
    page_faq_sub: "FAQ 버튼은 리드 카드에 노출되어 1클릭 WhatsApp 발송에 사용됩니다. (행사별 최대 6개)",
    page_event_settings_title: "행사 세부 설정",
    page_event_settings_sub: "시트의 lead_status 값과 CRM 단계 사이의 매핑을 정의합니다. CRM에서 단계를 변경하면 여기 설정된 값이 시트로 다시 기록됩니다.",
    panel_status_mapping: "단계 ⇄ 시트 상태값 매핑",
    page_whatsapp_title: "WhatsApp 연동",
    page_whatsapp_sub: "FAQ 응답 발송 시 사용할 WhatsApp Cloud API 인증 정보를 입력합니다. 행사별로 분리 저장됩니다.",
    panel_whatsapp_creds: "WhatsApp Cloud API 인증",
    form_wa_phone_id: "Phone Number ID",
    form_wa_phone_id_hint: "Meta for Developers에서 발급",
    form_wa_token: "Access Token",
    form_wa_token_hint: "시스템 사용자 영구 토큰 권장",
    form_wa_api_version: "API Version",
    form_wa_api_version_hint: "기본값 v17.0",
    form_wa_business_id: "Business Account ID",
    form_wa_business_id_hint: "선택사항",
    form_wa_test_recipient: "테스트 수신 번호",
    form_wa_test_recipient_hint: "선택사항, E.164 형식 (+82...)",
    btn_save_whatsapp: "WhatsApp 설정 저장",
    toast_whatsapp_saved: "WhatsApp 설정 저장 완료",

    stat_needs_action: "답변 필요",
    stat_needs_action_sub: "신규 + 미응답 + 재접촉",
    stat_total: "전체 리드",
    stat_total_sub: "현재 행사 기준",
    stat_inprogress: "진행중",
    stat_inprogress_sub: "자동응답·상담·예약유도",
    stat_booked: "예약 완료",
    stat_booked_sub: "END 단계",

    breakdown_title: "단계별 분포",
    breakdown_sub: "총 7개 단계",
    summary_title: "요약",

    quick_leads: "리드 현황 바로가기",
    quick_sheet: "시트 설정",
    quick_faq: "FAQ 관리",

    panel_event_register: "행사 등록",
    panel_sheet_config: "구글시트 연결 설정",
    panel_lead_list: "리드 목록",
    panel_faq_add: "FAQ 추가",
    panel_faq_registered: "등록된 FAQ",
    panel_stage_dist: "단계별 분포",

    form_event_name: "행사명",
    form_event_name_ph: "예: 일산병원 4월 검진",
    form_country: "국가",
    form_country_ph: "예: KZ",
    form_default_service: "관심 진료 기본값",
    service_checkup: "검진",
    service_spine: "척추",
    service_intervention: "인터벤션",

    form_event_select: "행사 선택",
    form_sheet_url: "Google Sheet URL",
    form_api_key: "Google API Key",
    form_api_key_hint: "Sheets API 읽기용",
    form_sheet_name: "시트 탭 이름",
    form_sheet_name_hint: "비우면 첫 번째 탭",
    form_webhook_url: "Sheet Webhook URL",
    form_webhook_url_hint: "Apps Script로 시트에 쓰기 (선택)",

    form_faq_title: "FAQ 제목",
    form_faq_title_ph: "예: 검진 안내",
    form_faq_message: "FAQ 메시지",
    form_faq_message_ph: "WhatsApp으로 발송할 메시지 본문",

    form_cfg_created: "created 상태값",
    form_cfg_consulting: "consulting 상태값",
    form_cfg_consulting_alts: "consulting 추가 인식값",
    form_cfg_consulting_hint: "쉼표 구분, 시트의 기존 값들",
    form_cfg_phone_prefix: "전화번호 prefix 제거",
    form_cfg_phone_prefix_hint: "예: p:+77... → +77...",
    form_cfg_initial_hint: "최초 인입 인식값 (기본 CREATED)",
    form_cfg_auto_hint: "자동응답 후 시트에 기록",
    form_cfg_answer_hint: "FAQ 응답 발송 후",
    form_cfg_booking_hint: "예약 푸시 단계",
    form_cfg_end_hint: "상담 종료/예약 확정",
    form_cfg_noresp_hint: "응답 없음",
    form_cfg_recontact_hint: "재접촉 대기",

    btn_save_event: "행사 등록",
    btn_archive_event: "행사 종료",
    btn_unarchive_event: "행사 재개",
    btn_save_sheet: "시트 설정 저장",
    btn_test_connection: "연결 테스트",
    btn_delete_event: "행사 삭제",
    btn_import_sheet: "시트에서 가져오기",
    btn_run_auto_reply: "신규 일괄 자동응답",
    btn_clear_leads: "전체 비우기",
    btn_crm_ingest: "CRM 인입",
    btn_append_row: "신규행 + 인입",
    btn_test_lead: "테스트 리드",
    btn_faq_add: "FAQ 추가",
    btn_save_config: "Config 저장",
    btn_load_more: "더 보기",

    search_ph: "이름·전화·로그 검색...",
    filter_all: "전체",
    filter_needs_action: "답변 필요",
    filter_in_progress: "진행중",
    filter_done: "완료",

    advanced_manual: "수동 인입 (Instagram New 시트 행 직접 입력)",

    stage_new_lead: "신규 리드",
    stage_auto_replied: "자동응답 완료",
    stage_consulting: "상담 진행중",
    stage_booking_push: "예약 유도",
    stage_booked: "예약 완료",
    stage_no_response: "미응답",
    stage_recontact_needed: "재접촉 필요",

    stage_short_new_lead: "신규",
    stage_short_no_response: "미응답",
    stage_short_recontact_needed: "재접촉",
    stage_short_auto_replied: "자동응답",
    stage_short_consulting: "상담중",
    stage_short_booking_push: "예약유도",
    stage_short_booked: "예약완료",

    summary_event: "현재 행사",
    summary_total: "전체 리드",
    summary_needs: "답변 필요",
    summary_progress: "진행중",
    summary_booked: "예약 완료",
    summary_none: "없음",

    no_leads: "아직 리드가 없습니다. 시트에서 가져오거나 테스트 리드를 추가해보세요.",
    no_match: "조건에 맞는 리드가 없습니다.",
    no_faq: "아직 FAQ가 없습니다.",
    empty_faq_inline: "FAQ 등록 시 1클릭 응답 버튼이 표시됩니다.",
    no_event: "행사 미선택",

    sheet_url_label: "Sheet URL",
    api_key_label: "API Key",
    sheet_tab_label: "시트 탭",
    api_key_set: "설정됨",
    api_key_unset: "(미설정)",
    sheet_default_tab: "(기본값: 첫 탭)",
    conn_success: "연결 성공",
    conn_checking: "연결 확인 중...",
    rows_count: "데이터 행 수",
    columns_label: "컬럼",
    none_paren: "(없음)",

    toast_event_saved: "행사 등록 완료",
    toast_event_deleted: "행사 삭제됨",
    toast_select_event: "행사를 먼저 선택하세요",
    toast_set_sheet_first: "구글시트 URL을 먼저 저장하세요",
    toast_sheet_saved: "시트 설정 저장 완료",
    toast_state_changed: "상태 변경 완료",
    toast_whatsapp_sent: "WhatsApp 발송",
    toast_test_lead_added: "테스트 리드 추가됨",
    toast_no_new_leads: "자동응답 대상(신규 리드)이 없습니다",
    toast_auto_reply_done: "건 자동응답 완료",
    toast_lead_ingest: "리드 인입 완료",
    toast_row_appended: "신규행 추가 완료",
    toast_config_saved: "Config 저장 완료",
    toast_faq_added: "FAQ 추가됨",
    toast_faq_required: "FAQ 제목과 메시지를 입력하세요",
    toast_faq_max: "FAQ는 최대 6개까지 등록 가능합니다",
    toast_no_event_selected: "선택된 행사가 없습니다",
    toast_imported: "건 가져옴",
    toast_removed: "건 삭제됨",

    confirm_run_auto_reply: "건에 자동응답을 실행할까요?",
    confirm_clear_leads: "의 모든 리드를 삭제할까요? 이 작업은 되돌릴 수 없습니다.",
    confirm_delete_event: "행사를 완전히 삭제할까요? 모든 리드도 함께 삭제됩니다.",
    confirm_prefix: "정말 [",
    confirm_close: "] ",

    summary_filtered: "건 (전체",
    summary_filtered_end: "건 중)",
    summary_total_only: "전체",
    items_unit: "건",

    server_conn_failed: "서버 연결 실패",
    loading_saving: "저장 중...",
    loading_importing: "가져오는 중...",
    loading_processing: "처리 중...",
    sheet_synced: "시트 반영됨",
    sheet_skipped: "Webhook 미설정 (시트 동기화 비활성)",
    sheet_failed: "시트 반영 실패",
    archived_banner: "이 행사는 종료되었습니다. 데이터 조회만 가능합니다.",
    toast_event_archived: "행사가 종료되었습니다",
    toast_event_unarchived: "행사가 재개되었습니다",
    confirm_archive_event: "을(를) 종료할까요? 종료된 행사는 모든 변경 작업이 차단됩니다.",
    confirm_unarchive_event: "을(를) 재개할까요?",

    manual_title: "Apps Script 연동 가이드",
    manual_intro: "CRM에서 단계가 변경되면 시트의 lead_status 컬럼이 자동 업데이트됩니다. 아래 절차를 1회만 따르면 됩니다.",
    manual_step_1: "연동할 Google Sheet를 브라우저에서 엽니다.",
    manual_step_2: "상단 메뉴 [확장 프로그램 > Apps Script] 클릭.",
    manual_step_3: "기본 Code.gs 내용을 모두 지우고 아래 코드를 붙여넣습니다.",
    manual_step_4: "Code.gs 최상단의 SHEET_NAME 값을 본인 시트 탭명으로 수정합니다.",
    manual_step_5: "Ctrl+S 로 저장. 프로젝트 이름을 묻는 경우 임의로 지정.",
    manual_step_6: "우측 상단 [배포 > 새 배포] → 유형 [웹 앱] 선택.",
    manual_step_7: "실행 사용자: 나(시트 소유자), 액세스: 모든 사용자 → [배포] 클릭.",
    manual_step_8: "권한 승인 후 발급된 웹앱 URL을 위 [Sheet Webhook URL] 칸에 붙여넣고 [시트 설정 저장] 클릭.",
    manual_warning: "코드 수정 후에는 반드시 [배포 > 새 배포]로 새 버전을 만들어야 변경사항이 반영됩니다. 발급된 URL은 익명 호출이 가능하므로 외부 노출에 주의하세요.",
    manual_copy: "코드 복사",
    manual_copied: "복사됨!",

    btn_export_csv: "CSV 내보내기",
    btn_add_note: "추가",
    auto_refresh_label: "자동 새로고침",
    auto_refresh_off: "꺼짐",
    auto_refresh_on: "자동 새로고침: ",
    note_input_ph: "메모 추가...",
    tab_log: "활동",
    tab_notes: "메모",
    activity_empty: "아직 활동 이력이 없습니다.",
    notes_empty: "아직 메모가 없습니다.",
    sla_ok: "정상",
    sla_warn: "임박",
    sla_danger: "지연",
    sla_critical: "긴급",
    toast_note_added: "메모 추가됨",
    toast_note_deleted: "메모 삭제됨",
    toast_csv_done: "CSV 다운로드 완료",
    toast_new_leads: "건의 신규 리드 도착",
    confirm_delete_note: "이 메모를 삭제할까요?",
    activity_imported: "인입",
    activity_auto_replied: "자동응답",
    activity_stage_changed: "단계 변경",
    activity_quick_action: "응답선택",
    activity_whatsapp_sent: "WhatsApp 발송",
    activity_note_added: "메모 추가",
    sheet_meta_label: "시트",
    minutes_ago: "분 전",
    hours_ago: "시간 전",
    days_ago: "일 전",
    just_now: "방금",

    kpi_response_rate: "응답률",
    kpi_sla: "10분 SLA",
    kpi_booking_rate: "예약 전환율",
    kpi_avg_response: "평균 응답시간",
    panel_funnel: "전환 퍼널",
    panel_funnel_sub: "단계별 누적 도달 + 이탈률",
    panel_platform: "플랫폼별 분포",
    panel_daily: "일별 유입 (최근 14일)",
    panel_hourly: "시간대별 유입",
    panel_hourly_sub: "UTC 기준 0~23시",
    panel_campaigns: "캠페인별 유입 TOP 10",
    chart_no_data: "데이터가 없습니다.",
    chart_no_campaigns: "캠페인 정보가 있는 리드가 없습니다.",
    funnel_drop: "이탈",
    minutes_short: "분",
    no_data_dash: "—",

    theme_dark: "다크",
    theme_light: "라이트",
    notify_label: "데스크톱 알림",
    notify_blocked: "브라우저에서 알림 권한이 차단되어 있습니다. 사이트 설정에서 허용해 주세요.",
    notify_denied: "알림 권한이 거부되었습니다.",
    notify_new_leads_title: "신규 리드 도착",
    notify_new_leads_body: "건의 리드가 추가되었습니다.",
    kbd_modal_title: "키보드 단축키",
    kbd_section_nav: "탐색",
    kbd_section_action: "동작",
    kbd_section_filter: "필터",
    kbd_section_general: "일반",
    kbd_goto_dashboard: "대시보드로 이동",
    kbd_goto_crm: "행사/시트 연결로 이동",
    kbd_goto_leads: "리드 현황으로 이동",
    kbd_goto_stats: "통계로 이동",
    kbd_goto_event_settings: "행사 세부 설정으로 이동",
    kbd_goto_faq: "FAQ 설정으로 이동",
    kbd_focus_search: "검색창 포커스",
    kbd_refresh: "리드 수동 새로고침",
    kbd_auto_reply: "신규 일괄 자동응답",
    kbd_import: "시트에서 가져오기",
    kbd_filter_all: "전체",
    kbd_filter_needs: "답변 필요",
    kbd_filter_progress: "진행중",
    kbd_filter_done: "완료",
    kbd_help: "이 도움말 열기",
    kbd_esc: "모달 닫기 / 검색 비우기",
    kbd_theme: "테마 전환 (라이트/다크)",
  },

  en: {
    title: "Event CRM",
    subtitle: "Event · Sheet · Auto-reply",
    language: "Language",

    nav_dashboard: "Dashboard",
    nav_crm: "Event / Sheet",
    nav_leads: "Leads",
    nav_stats: "Stats",
    nav_settings: "Settings",
    nav_event_settings: "Event Settings",
    nav_whatsapp: "WhatsApp Integration",
    nav_faq_settings: "FAQ Settings",

    page_dashboard_title: "Dashboard",
    page_dashboard_sub: "Key metrics for the current event at a glance.",
    page_crm_title: "Event / Sheet Connection",
    page_crm_sub: "Register event → Connect Google Sheet → Save with API key.",
    page_leads_title: "Leads",
    page_leads_sub: "Leads needing response are always shown at the top.",
    page_stats_title: "Statistics",
    page_stats_sub: "Summary metrics for the currently selected event.",
    page_faq_title: "FAQ Management",
    page_faq_sub: "FAQ buttons appear on lead cards for 1-click WhatsApp sending. (Max 6 per event)",
    page_event_settings_title: "Event Settings",
    page_event_settings_sub: "Define mapping between sheet lead_status values and CRM stages. When you change a stage in CRM, the configured value is written back to the sheet.",
    panel_status_mapping: "Stage ⇄ Sheet Status Mapping",
    page_whatsapp_title: "WhatsApp Integration",
    page_whatsapp_sub: "Credentials for WhatsApp Cloud API used when sending FAQ replies. Stored per event.",
    panel_whatsapp_creds: "WhatsApp Cloud API Credentials",
    form_wa_phone_id: "Phone Number ID",
    form_wa_phone_id_hint: "Issued by Meta for Developers",
    form_wa_token: "Access Token",
    form_wa_token_hint: "System user permanent token recommended",
    form_wa_api_version: "API Version",
    form_wa_api_version_hint: "Default: v17.0",
    form_wa_business_id: "Business Account ID",
    form_wa_business_id_hint: "Optional",
    form_wa_test_recipient: "Test Recipient",
    form_wa_test_recipient_hint: "Optional, E.164 format (+82...)",
    btn_save_whatsapp: "Save WhatsApp Config",
    toast_whatsapp_saved: "WhatsApp config saved",

    stat_needs_action: "Needs Action",
    stat_needs_action_sub: "New + No response + Recontact",
    stat_total: "Total Leads",
    stat_total_sub: "For current event",
    stat_inprogress: "In Progress",
    stat_inprogress_sub: "Auto-reply · Consulting · Booking",
    stat_booked: "Booked",
    stat_booked_sub: "END stage",

    breakdown_title: "Stage Distribution",
    breakdown_sub: "7 stages total",
    summary_title: "Summary",

    quick_leads: "Go to Leads",
    quick_sheet: "Sheet Config",
    quick_faq: "FAQ",

    panel_event_register: "Register Event",
    panel_sheet_config: "Google Sheet Connection",
    panel_lead_list: "Lead List",
    panel_faq_add: "Add FAQ",
    panel_faq_registered: "Registered FAQs",
    panel_stage_dist: "Stage Distribution",

    form_event_name: "Event Name",
    form_event_name_ph: "e.g. Hospital April Checkup",
    form_country: "Country",
    form_country_ph: "e.g. KZ",
    form_default_service: "Default Service",
    service_checkup: "Checkup",
    service_spine: "Spine",
    service_intervention: "Intervention",

    form_event_select: "Select Event",
    form_sheet_url: "Google Sheet URL",
    form_api_key: "Google API Key",
    form_api_key_hint: "For Sheets API read access",
    form_sheet_name: "Sheet Tab Name",
    form_sheet_name_hint: "Empty = first tab",
    form_webhook_url: "Sheet Webhook URL",
    form_webhook_url_hint: "Apps Script for sheet write (optional)",

    form_faq_title: "FAQ Title",
    form_faq_title_ph: "e.g. Checkup Info",
    form_faq_message: "FAQ Message",
    form_faq_message_ph: "Body of the WhatsApp message",

    form_cfg_created: "created status value",
    form_cfg_consulting: "consulting status values",
    form_cfg_consulting_alts: "consulting alt values",
    form_cfg_consulting_hint: "comma-separated, existing sheet values",
    form_cfg_phone_prefix: "Phone prefix to strip",
    form_cfg_phone_prefix_hint: "e.g. p:+77... → +77...",
    form_cfg_initial_hint: "Initial ingestion value (default CREATED)",
    form_cfg_auto_hint: "Written after auto-reply",
    form_cfg_answer_hint: "After FAQ reply sent",
    form_cfg_booking_hint: "Booking push stage",
    form_cfg_end_hint: "Booking confirmed / closed",
    form_cfg_noresp_hint: "No response received",
    form_cfg_recontact_hint: "Awaiting recontact",

    btn_save_event: "Register",
    btn_archive_event: "Close Event",
    btn_unarchive_event: "Reopen Event",
    btn_save_sheet: "Save Sheet Config",
    btn_test_connection: "Test Connection",
    btn_delete_event: "Delete Event",
    btn_import_sheet: "Import from Sheet",
    btn_run_auto_reply: "Auto-reply All New",
    btn_clear_leads: "Clear All",
    btn_crm_ingest: "Ingest to CRM",
    btn_append_row: "Append + Ingest",
    btn_test_lead: "Test Lead",
    btn_faq_add: "Add FAQ",
    btn_save_config: "Save Config",
    btn_load_more: "Load More",

    search_ph: "Search name, phone, log...",
    filter_all: "All",
    filter_needs_action: "Needs Action",
    filter_in_progress: "In Progress",
    filter_done: "Done",

    advanced_manual: "Manual Ingest (Instagram New row direct input)",

    stage_new_lead: "New Lead",
    stage_auto_replied: "Auto-replied",
    stage_consulting: "Consulting",
    stage_booking_push: "Booking Push",
    stage_booked: "Booked",
    stage_no_response: "No Response",
    stage_recontact_needed: "Recontact",

    stage_short_new_lead: "New",
    stage_short_no_response: "No-resp",
    stage_short_recontact_needed: "Recontact",
    stage_short_auto_replied: "Auto",
    stage_short_consulting: "Consult",
    stage_short_booking_push: "Booking",
    stage_short_booked: "Booked",

    summary_event: "Current event",
    summary_total: "Total leads",
    summary_needs: "Needs action",
    summary_progress: "In progress",
    summary_booked: "Booked",
    summary_none: "None",

    no_leads: "No leads yet. Import from sheet or add a test lead.",
    no_match: "No leads match your filter.",
    no_faq: "No FAQs yet.",
    empty_faq_inline: "Register FAQs to show 1-click reply buttons.",
    no_event: "No event selected",

    sheet_url_label: "Sheet URL",
    api_key_label: "API Key",
    sheet_tab_label: "Sheet tab",
    api_key_set: "Set",
    api_key_unset: "(Not set)",
    sheet_default_tab: "(Default: first tab)",
    conn_success: "Connection OK",
    conn_checking: "Checking connection...",
    rows_count: "Row count",
    columns_label: "Columns",
    none_paren: "(none)",

    toast_event_saved: "Event registered",
    toast_event_deleted: "Event deleted",
    toast_select_event: "Select an event first",
    toast_set_sheet_first: "Save Sheet URL first",
    toast_sheet_saved: "Sheet config saved",
    toast_state_changed: "Stage changed",
    toast_whatsapp_sent: "WhatsApp sent",
    toast_test_lead_added: "Test lead added",
    toast_no_new_leads: "No new leads to auto-reply",
    toast_auto_reply_done: " auto-replies sent",
    toast_lead_ingest: "Lead ingested",
    toast_row_appended: "Row appended",
    toast_config_saved: "Config saved",
    toast_faq_added: "FAQ added",
    toast_faq_required: "Enter FAQ title and message",
    toast_faq_max: "Up to 6 FAQs per event",
    toast_no_event_selected: "No event selected",
    toast_imported: " imported",
    toast_removed: " removed",

    confirm_run_auto_reply: " leads — run auto-reply?",
    confirm_clear_leads: " — delete ALL leads? This cannot be undone.",
    confirm_delete_event: " — delete the event entirely? All leads will also be removed.",
    confirm_prefix: "Confirm: [",
    confirm_close: "] ",

    summary_filtered: " (of ",
    summary_filtered_end: " total)",
    summary_total_only: "Total ",
    items_unit: "",

    server_conn_failed: "Server connection failed",
    loading_saving: "Saving...",
    loading_importing: "Importing...",
    loading_processing: "Processing...",
    sheet_synced: "Sheet updated",
    sheet_skipped: "Webhook not set (sheet sync disabled)",
    sheet_failed: "Sheet update failed",
    archived_banner: "This event is closed. Read-only access.",
    toast_event_archived: "Event closed",
    toast_event_unarchived: "Event reopened",
    confirm_archive_event: " — close this event? All changes will be blocked.",
    confirm_unarchive_event: " — reopen this event?",

    manual_title: "Apps Script Setup Guide",
    manual_intro: "When stages change in CRM, the sheet's lead_status column is automatically updated. Follow these steps once.",
    manual_step_1: "Open the Google Sheet you want to integrate.",
    manual_step_2: "Top menu: [Extensions > Apps Script].",
    manual_step_3: "Clear the default Code.gs and paste the code below.",
    manual_step_4: "Update the SHEET_NAME constant at the top of Code.gs to your sheet tab name.",
    manual_step_5: "Press Ctrl+S to save. Name the project anything (e.g. \"Event CRM Webhook\").",
    manual_step_6: "Top right [Deploy > New deployment] → choose [Web app].",
    manual_step_7: "Execute as: Me (sheet owner), Access: Anyone → click [Deploy].",
    manual_step_8: "After granting permissions, copy the deployment URL and paste it into [Sheet Webhook URL] above, then click [Save Sheet Config].",
    manual_warning: "After modifying the code, you MUST create a new deployment for changes to take effect. The deployment URL allows anonymous calls — keep it private.",
    manual_copy: "Copy code",
    manual_copied: "Copied!",

    btn_export_csv: "Export CSV",
    btn_add_note: "Add",
    auto_refresh_label: "Auto-refresh",
    auto_refresh_off: "off",
    auto_refresh_on: "auto: ",
    note_input_ph: "Add a note...",
    tab_log: "Activity",
    tab_notes: "Notes",
    activity_empty: "No activity yet.",
    notes_empty: "No notes yet.",
    sla_ok: "OK",
    sla_warn: "Soon",
    sla_danger: "Late",
    sla_critical: "Urgent",
    toast_note_added: "Note added",
    toast_note_deleted: "Note deleted",
    toast_csv_done: "CSV downloaded",
    toast_new_leads: " new lead(s) arrived",
    confirm_delete_note: "Delete this note?",
    activity_imported: "Imported",
    activity_auto_replied: "Auto-reply",
    activity_stage_changed: "Stage change",
    activity_quick_action: "Quick action",
    activity_whatsapp_sent: "WhatsApp sent",
    activity_note_added: "Note added",
    sheet_meta_label: "sheet",
    minutes_ago: "m ago",
    hours_ago: "h ago",
    days_ago: "d ago",
    just_now: "just now",

    kpi_response_rate: "Response rate",
    kpi_sla: "10-min SLA",
    kpi_booking_rate: "Booking rate",
    kpi_avg_response: "Avg response time",
    panel_funnel: "Conversion Funnel",
    panel_funnel_sub: "Cumulative reach + drop-off rate",
    panel_platform: "Platform Breakdown",
    panel_daily: "Daily Inflow (last 14 days)",
    panel_hourly: "Hourly Inflow",
    panel_hourly_sub: "UTC 0-23h",
    panel_campaigns: "Top 10 Campaigns",
    chart_no_data: "No data.",
    chart_no_campaigns: "No leads with campaign info.",
    funnel_drop: "drop",
    minutes_short: "m",
    no_data_dash: "—",

    theme_dark: "Dark",
    theme_light: "Light",
    notify_label: "Desktop notifications",
    notify_blocked: "Notifications are blocked. Allow them in your browser site settings.",
    notify_denied: "Notification permission denied.",
    notify_new_leads_title: "New leads arrived",
    notify_new_leads_body: " new lead(s) added.",
    kbd_modal_title: "Keyboard Shortcuts",
    kbd_section_nav: "Navigation",
    kbd_section_action: "Actions",
    kbd_section_filter: "Filter",
    kbd_section_general: "General",
    kbd_goto_dashboard: "Go to Dashboard",
    kbd_goto_crm: "Go to Event/Sheet",
    kbd_goto_leads: "Go to Leads",
    kbd_goto_stats: "Go to Stats",
    kbd_goto_event_settings: "Go to Event Settings",
    kbd_goto_faq: "Go to FAQ Settings",
    kbd_focus_search: "Focus search",
    kbd_refresh: "Manual refresh",
    kbd_auto_reply: "Auto-reply all new",
    kbd_import: "Import from sheet",
    kbd_filter_all: "All",
    kbd_filter_needs: "Needs action",
    kbd_filter_progress: "In progress",
    kbd_filter_done: "Done",
    kbd_help: "Open this help",
    kbd_esc: "Close modal / clear search",
    kbd_theme: "Toggle theme (light/dark)",
  },

  ru: {
    title: "Event CRM",
    subtitle: "Событие · Таблица · Автоответ",
    language: "Язык",

    nav_dashboard: "Панель",
    nav_crm: "Событие / Таблица",
    nav_leads: "Лиды",
    nav_stats: "Статистика",
    nav_settings: "Настройки",
    nav_event_settings: "Настройки события",
    nav_whatsapp: "Интеграция WhatsApp",
    nav_faq_settings: "Настройки FAQ",

    page_dashboard_title: "Панель управления",
    page_dashboard_sub: "Ключевые метрики текущего события.",
    page_crm_title: "Событие / Подключение таблицы",
    page_crm_sub: "Создать событие → Подключить Google Sheet → Сохранить с API-ключом.",
    page_leads_title: "Лиды",
    page_leads_sub: "Лиды, требующие ответа, всегда сверху.",
    page_stats_title: "Статистика",
    page_stats_sub: "Сводка по выбранному событию.",
    page_faq_title: "Управление FAQ",
    page_faq_sub: "Кнопки FAQ отображаются на карточках лидов для отправки в WhatsApp в 1 клик. (До 6 на событие)",
    page_event_settings_title: "Настройки события",
    page_event_settings_sub: "Определяет соответствие между значениями lead_status в таблице и этапами CRM. При изменении этапа в CRM, заданное значение будет записано обратно в таблицу.",
    panel_status_mapping: "Этап ⇄ Значение в таблице",
    page_whatsapp_title: "Интеграция WhatsApp",
    page_whatsapp_sub: "Учётные данные WhatsApp Cloud API для отправки FAQ ответов. Сохраняется отдельно для каждого события.",
    panel_whatsapp_creds: "Учётные данные WhatsApp Cloud API",
    form_wa_phone_id: "Phone Number ID",
    form_wa_phone_id_hint: "Выдаётся в Meta for Developers",
    form_wa_token: "Access Token",
    form_wa_token_hint: "Рекомендуется постоянный токен системного пользователя",
    form_wa_api_version: "Версия API",
    form_wa_api_version_hint: "По умолчанию: v17.0",
    form_wa_business_id: "Business Account ID",
    form_wa_business_id_hint: "Необязательно",
    form_wa_test_recipient: "Тестовый получатель",
    form_wa_test_recipient_hint: "Необязательно, формат E.164 (+82...)",
    btn_save_whatsapp: "Сохранить настройки WhatsApp",
    toast_whatsapp_saved: "Настройки WhatsApp сохранены",

    stat_needs_action: "Требуют ответа",
    stat_needs_action_sub: "Новые + Без ответа + Перезвон",
    stat_total: "Всего лидов",
    stat_total_sub: "По текущему событию",
    stat_inprogress: "В работе",
    stat_inprogress_sub: "Автоответ · Консультация · Бронь",
    stat_booked: "Записаны",
    stat_booked_sub: "Этап END",

    breakdown_title: "Распределение по этапам",
    breakdown_sub: "Всего 7 этапов",
    summary_title: "Сводка",

    quick_leads: "К лидам",
    quick_sheet: "Настройка таблицы",
    quick_faq: "FAQ",

    panel_event_register: "Создать событие",
    panel_sheet_config: "Подключение Google Sheet",
    panel_lead_list: "Список лидов",
    panel_faq_add: "Добавить FAQ",
    panel_faq_registered: "Зарегистрированные FAQ",
    panel_stage_dist: "Распределение по этапам",

    form_event_name: "Название события",
    form_event_name_ph: "напр. Больница апрель чекап",
    form_country: "Страна",
    form_country_ph: "напр. KZ",
    form_default_service: "Услуга по умолчанию",
    service_checkup: "Чек-ап",
    service_spine: "Позвоночник",
    service_intervention: "Интервенция",

    form_event_select: "Выберите событие",
    form_sheet_url: "URL Google Sheet",
    form_api_key: "Google API Key",
    form_api_key_hint: "Для чтения Sheets API",
    form_sheet_name: "Название вкладки",
    form_sheet_name_hint: "Пусто = первая вкладка",
    form_webhook_url: "URL Webhook",
    form_webhook_url_hint: "Apps Script для записи (необязательно)",

    form_faq_title: "Заголовок FAQ",
    form_faq_title_ph: "напр. Информация о чек-апе",
    form_faq_message: "Сообщение FAQ",
    form_faq_message_ph: "Текст сообщения для WhatsApp",

    form_cfg_created: "Значение для created",
    form_cfg_consulting: "Значения для consulting",
    form_cfg_consulting_alts: "Доп. значения для consulting",
    form_cfg_consulting_hint: "через запятую, существующие в таблице",
    form_cfg_phone_prefix: "Префикс телефона для удаления",
    form_cfg_phone_prefix_hint: "напр. p:+77... → +77...",
    form_cfg_initial_hint: "Значение при первом поступлении (по умолч. CREATED)",
    form_cfg_auto_hint: "Записывается после автоответа",
    form_cfg_answer_hint: "После отправки FAQ ответа",
    form_cfg_booking_hint: "Этап записи",
    form_cfg_end_hint: "Запись подтверждена / закрыто",
    form_cfg_noresp_hint: "Нет ответа",
    form_cfg_recontact_hint: "Ожидает повторного контакта",

    btn_save_event: "Создать",
    btn_archive_event: "Закрыть событие",
    btn_unarchive_event: "Открыть снова",
    btn_save_sheet: "Сохранить",
    btn_test_connection: "Тест подключения",
    btn_delete_event: "Удалить событие",
    btn_import_sheet: "Импорт из таблицы",
    btn_run_auto_reply: "Автоответ всем новым",
    btn_clear_leads: "Очистить все",
    btn_crm_ingest: "В CRM",
    btn_append_row: "Добавить + В CRM",
    btn_test_lead: "Тестовый лид",
    btn_faq_add: "Добавить FAQ",
    btn_save_config: "Сохранить",
    btn_load_more: "Показать ещё",

    search_ph: "Поиск имени, телефона, лога...",
    filter_all: "Все",
    filter_needs_action: "Требуют ответа",
    filter_in_progress: "В работе",
    filter_done: "Готово",

    advanced_manual: "Ручной ввод (строка Instagram New)",

    stage_new_lead: "Новый лид",
    stage_auto_replied: "Автоответ отправлен",
    stage_consulting: "Консультация",
    stage_booking_push: "Запись в работе",
    stage_booked: "Записан",
    stage_no_response: "Без ответа",
    stage_recontact_needed: "Перезвон",

    stage_short_new_lead: "Новый",
    stage_short_no_response: "Без отв.",
    stage_short_recontact_needed: "Перезв.",
    stage_short_auto_replied: "Авто",
    stage_short_consulting: "Конс.",
    stage_short_booking_push: "Бронь",
    stage_short_booked: "Запись",

    summary_event: "Текущее событие",
    summary_total: "Всего лидов",
    summary_needs: "Требуют ответа",
    summary_progress: "В работе",
    summary_booked: "Записаны",
    summary_none: "нет",

    no_leads: "Лидов пока нет. Импортируйте из таблицы или добавьте тестового.",
    no_match: "Нет лидов по фильтру.",
    no_faq: "FAQ пока не добавлены.",
    empty_faq_inline: "Добавьте FAQ для отображения кнопок быстрого ответа.",
    no_event: "Событие не выбрано",

    sheet_url_label: "URL таблицы",
    api_key_label: "API Key",
    sheet_tab_label: "Вкладка",
    api_key_set: "Задан",
    api_key_unset: "(Не задан)",
    sheet_default_tab: "(По умолчанию: первая вкладка)",
    conn_success: "Подключение OK",
    conn_checking: "Проверка подключения...",
    rows_count: "Кол-во строк",
    columns_label: "Колонки",
    none_paren: "(нет)",

    toast_event_saved: "Событие создано",
    toast_event_deleted: "Событие удалено",
    toast_select_event: "Сначала выберите событие",
    toast_set_sheet_first: "Сначала сохраните URL таблицы",
    toast_sheet_saved: "Настройки таблицы сохранены",
    toast_state_changed: "Этап изменён",
    toast_whatsapp_sent: "WhatsApp отправлен",
    toast_test_lead_added: "Тестовый лид добавлен",
    toast_no_new_leads: "Нет новых лидов для автоответа",
    toast_auto_reply_done: " автоответов отправлено",
    toast_lead_ingest: "Лид добавлен",
    toast_row_appended: "Строка добавлена",
    toast_config_saved: "Настройки сохранены",
    toast_faq_added: "FAQ добавлен",
    toast_faq_required: "Введите заголовок и сообщение FAQ",
    toast_faq_max: "До 6 FAQ на событие",
    toast_no_event_selected: "Событие не выбрано",
    toast_imported: " импортировано",
    toast_removed: " удалено",

    confirm_run_auto_reply: " лид(ов) — запустить автоответ?",
    confirm_clear_leads: " — удалить ВСЕ лиды? Это действие необратимо.",
    confirm_delete_event: " — удалить событие полностью? Все лиды также будут удалены.",
    confirm_prefix: "Подтверждение: [",
    confirm_close: "] ",

    summary_filtered: " (из ",
    summary_filtered_end: " всего)",
    summary_total_only: "Всего ",
    items_unit: "",

    server_conn_failed: "Не удалось подключиться к серверу",
    loading_saving: "Сохранение...",
    loading_importing: "Импорт...",
    loading_processing: "Обработка...",
    sheet_synced: "Таблица обновлена",
    sheet_skipped: "Webhook не задан (синхронизация выкл.)",
    sheet_failed: "Ошибка обновления таблицы",
    archived_banner: "Событие закрыто. Только просмотр.",
    toast_event_archived: "Событие закрыто",
    toast_event_unarchived: "Событие открыто",
    confirm_archive_event: " — закрыть событие? Изменения будут заблокированы.",
    confirm_unarchive_event: " — открыть событие снова?",

    manual_title: "Руководство по настройке Apps Script",
    manual_intro: "При изменении этапа в CRM колонка lead_status в таблице обновится автоматически. Эту настройку нужно выполнить один раз.",
    manual_step_1: "Откройте Google Sheet, который нужно подключить.",
    manual_step_2: "В верхнем меню выберите [Расширения > Apps Script].",
    manual_step_3: "Удалите содержимое Code.gs по умолчанию и вставьте код ниже.",
    manual_step_4: "Измените значение SHEET_NAME в начале Code.gs на название вкладки вашей таблицы.",
    manual_step_5: "Нажмите Ctrl+S для сохранения. Имя проекта произвольное.",
    manual_step_6: "В правом верхнем углу [Развернуть > Новое развертывание] → тип [Веб-приложение].",
    manual_step_7: "Запуск от: Я (владелец таблицы), Доступ: Все → нажмите [Развернуть].",
    manual_step_8: "После подтверждения прав скопируйте URL веб-приложения и вставьте его в поле [Sheet Webhook URL] выше, затем нажмите [Сохранить].",
    manual_warning: "После изменения кода ОБЯЗАТЕЛЬНО создайте новое развертывание, иначе изменения не вступят в силу. URL допускает анонимные вызовы — храните его в секрете.",
    manual_copy: "Копировать код",
    manual_copied: "Скопировано!",

    btn_export_csv: "Экспорт CSV",
    btn_add_note: "Добавить",
    auto_refresh_label: "Автообновление",
    auto_refresh_off: "выкл",
    auto_refresh_on: "авто: ",
    note_input_ph: "Добавить заметку...",
    tab_log: "Активность",
    tab_notes: "Заметки",
    activity_empty: "Активности пока нет.",
    notes_empty: "Заметок пока нет.",
    sla_ok: "OK",
    sla_warn: "Скоро",
    sla_danger: "Опоздание",
    sla_critical: "Срочно",
    toast_note_added: "Заметка добавлена",
    toast_note_deleted: "Заметка удалена",
    toast_csv_done: "CSV загружен",
    toast_new_leads: " новых лид(а)",
    confirm_delete_note: "Удалить эту заметку?",
    activity_imported: "Импорт",
    activity_auto_replied: "Автоответ",
    activity_stage_changed: "Смена этапа",
    activity_quick_action: "Быстрое действие",
    activity_whatsapp_sent: "WhatsApp отправлен",
    activity_note_added: "Заметка добавлена",
    sheet_meta_label: "таблица",
    minutes_ago: "мин назад",
    hours_ago: "ч назад",
    days_ago: "д назад",
    just_now: "только что",

    kpi_response_rate: "Доля ответов",
    kpi_sla: "SLA 10 мин",
    kpi_booking_rate: "Конверсия в запись",
    kpi_avg_response: "Среднее время ответа",
    panel_funnel: "Воронка конверсии",
    panel_funnel_sub: "Совокупное достижение + отток",
    panel_platform: "По платформам",
    panel_daily: "Поток за 14 дней",
    panel_hourly: "По часам",
    panel_hourly_sub: "UTC 0-23 ч",
    panel_campaigns: "ТОП 10 кампаний",
    chart_no_data: "Нет данных.",
    chart_no_campaigns: "Нет лидов с информацией о кампании.",
    funnel_drop: "отток",
    minutes_short: "мин",
    no_data_dash: "—",

    theme_dark: "Тёмная",
    theme_light: "Светлая",
    notify_label: "Уведомления",
    notify_blocked: "Уведомления заблокированы. Разрешите их в настройках сайта в браузере.",
    notify_denied: "Разрешение на уведомления отклонено.",
    notify_new_leads_title: "Новые лиды",
    notify_new_leads_body: " новых лидов добавлено.",
    kbd_modal_title: "Горячие клавиши",
    kbd_section_nav: "Навигация",
    kbd_section_action: "Действия",
    kbd_section_filter: "Фильтр",
    kbd_section_general: "Общие",
    kbd_goto_dashboard: "К панели",
    kbd_goto_crm: "К событию/таблице",
    kbd_goto_leads: "К лидам",
    kbd_goto_stats: "К статистике",
    kbd_goto_event_settings: "К настройкам события",
    kbd_goto_faq: "К настройкам FAQ",
    kbd_focus_search: "Фокус на поиск",
    kbd_refresh: "Ручное обновление",
    kbd_auto_reply: "Автоответ всем новым",
    kbd_import: "Импорт из таблицы",
    kbd_filter_all: "Все",
    kbd_filter_needs: "Требуют ответа",
    kbd_filter_progress: "В работе",
    kbd_filter_done: "Готово",
    kbd_help: "Показать эту справку",
    kbd_esc: "Закрыть модальное / очистить поиск",
    kbd_theme: "Сменить тему (светлая/тёмная)",
  },
};

let currentLang = localStorage.getItem("crmLang") || "ko";

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.ko && i18n.ko[key]) || key;
}

// ========== Utilities ==========
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      detail = errBody.error || "";
    } catch {}
    if (res.status === 501) {
      throw new Error("정적 서버에서 실행 중입니다. python3 backend/mvp_server.py 로 실행하세요.");
    }
    throw new Error(`API ${res.status}${detail ? ": " + detail : ""}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function toast(message, type = "info", duration = 3000) {
  if (!toastContainer) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.2s";
    setTimeout(() => el.remove(), 200);
  }, duration);
}

function showError(label, error) {
  const message = error instanceof Error ? error.message : String(error);
  toast(`${label}: ${message}`, "error", 5000);
}

function notifySheetSync(result) {
  if (!result) return;
  if (result === "skipped") {
    toast(t("sheet_skipped"), "info", 2500);
  } else if (result.startsWith("sent:")) {
    toast(t("sheet_synced"), "success", 2000);
  } else if (result.startsWith("failed:")) {
    toast(`${t("sheet_failed")}: ${result.slice(7, 80)}`, "error", 5000);
  }
}

async function withButtonBusy(button, loadingText, task) {
  if (!button) return task();
  const previous = button.textContent;
  button.disabled = true;
  button.textContent = loadingText || t("loading_processing");
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = previous;
  }
}

function selectedEvent() {
  return state.events.find((e) => e.id === eventSelect.value);
}

function eventFaqs(ev) {
  return (ev?.config?.faqTemplates || []).slice(0, 6);
}

const ACTIVITY_ICON = {
  imported: "download",
  auto_replied: "zap",
  stage_changed: "git-branch",
  quick_action: "shuffle",
  whatsapp_sent: "message-circle",
  note_added: "sticky-note",
};

function relativeTime(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return t("just_now");
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}${t("minutes_ago")}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}${t("hours_ago")}`;
  return `${Math.floor(hr / 24)}${t("days_ago")}`;
}

function getSlaState(lead) {
  if (!lead?.createdAt) return null;
  // 답변 필요 단계에서만 SLA 표시
  if (!STAGE_GROUP.needs_action.includes(lead.stage)) return null;
  const min = (Date.now() - new Date(lead.createdAt).getTime()) / 60_000;
  if (min < 10) return "ok";
  if (min < 30) return "warn";
  if (min < 60) return "danger";
  return "critical";
}

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ========== Rendering ==========
function refreshEventOptions() {
  const optsHtml = state.events.map((e) => `<option value="${e.id}">${e.name}${e.archived ? " · 🔒" : ""}</option>`).join("");
  eventSelect.innerHTML = optsHtml;
  configEventSelect.innerHTML = optsHtml;
  inquiryEventSelect.innerHTML = optsHtml;
  const waSelect = document.getElementById("whatsapp-event-select");
  if (waSelect) waSelect.innerHTML = optsHtml;
  refreshMeta();
}

function refreshMeta() {
  const ev = selectedEvent();
  if (!ev) {
    eventMeta.textContent = t("no_event");
    eventMeta.classList.remove("archived");
    leadList.innerHTML = "";
    refreshDashboard();
    return;
  }
  const sheet = ev.sheetUrl ? "✓ Sheet" : "✗ Sheet";
  const webhook = ev.sheetWebhookUrl ? "✓ Webhook" : "";
  const apiKey = ev.config?.googleApiKey ? "✓ API" : "✗ API";
  const archivedTag = ev.archived ? " · 🔒 종료됨" : "";
  eventMeta.textContent = `${ev.name} (${ev.country})${archivedTag} · ${sheet} · ${apiKey} ${webhook}`.trim();
  eventMeta.classList.toggle("archived", !!ev.archived);
  refreshDashboard();
}

function refreshDashboard() {
  const total = state.leads.length;
  const counts = {};
  Object.keys(STAGE_ICON).forEach((s) => (counts[s] = 0));
  state.leads.forEach((l) => {
    counts[l.stage] = (counts[l.stage] || 0) + 1;
  });
  const needsAction = STAGE_GROUP.needs_action.reduce((sum, s) => sum + (counts[s] || 0), 0);
  const inProgress = STAGE_GROUP.in_progress.reduce((sum, s) => sum + (counts[s] || 0), 0);

  if (dashboardLeadsCount) dashboardLeadsCount.textContent = String(total);
  if (dashboardConsultingCount) dashboardConsultingCount.textContent = String(inProgress);
  if (dashboardNeedsAction) dashboardNeedsAction.textContent = String(needsAction);
  if (dashboardBookedCount) dashboardBookedCount.textContent = String(counts.booked || 0);

  renderStageBreakdown(stageBreakdown, counts);
  renderStageBreakdown(statsStageBreakdown, counts);

  if (statsSummary) {
    const ev = selectedEvent();
    statsSummary.innerHTML = `
      <li>${t("summary_event")}: <strong>${ev ? ev.name : t("summary_none")}</strong></li>
      <li>${t("summary_total")}: <strong>${total}</strong></li>
      <li>${t("summary_needs")}: <strong>${needsAction}</strong></li>
      <li>${t("summary_progress")}: <strong>${inProgress}</strong></li>
      <li>${t("summary_booked")}: <strong>${counts.booked || 0}</strong></li>
    `;
  }

  renderStatsCharts(counts, total);
}

// ========== Stats: KPIs + Charts ==========
function getFirstResponseElapsedMs(lead) {
  if (!lead.createdAt || !Array.isArray(lead.activities)) return null;
  const created = new Date(lead.createdAt).getTime();
  const responded = lead.activities.find((a) =>
    ["auto_replied", "whatsapp_sent", "quick_action"].includes(a.type)
  );
  if (!responded) return null;
  const ms = new Date(responded.at).getTime() - created;
  return ms >= 0 ? ms : null;
}

function isResponded(lead) {
  return !STAGE_GROUP.needs_action.includes(lead.stage);
}

function formatMinutes(ms) {
  if (ms == null) return t("no_data_dash");
  const totalMin = ms / 60_000;
  if (totalMin < 1) return `< 1${t("minutes_short")}`;
  if (totalMin < 60) return `${Math.round(totalMin)}${t("minutes_short")}`;
  const hr = Math.floor(totalMin / 60);
  const remMin = Math.round(totalMin % 60);
  // "h" 단위는 영어 약어 사용 (다국어 별 시간 단위가 다양해 일관성 유지)
  return remMin > 0 ? `${hr}h ${remMin}${t("minutes_short")}` : `${hr}h`;
}

function renderStatsCharts(counts, total) {
  if (!document.getElementById("chart-funnel")) return;

  // ── KPIs ─────────────────────────────────
  const responded = state.leads.filter(isResponded).length;
  const respRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  const responseTimes = state.leads
    .map(getFirstResponseElapsedMs)
    .filter((v) => v != null);
  const avgResp = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : null;
  const slaOk = responseTimes.filter((ms) => ms <= 10 * 60_000).length;
  const slaRate = responseTimes.length
    ? Math.round((slaOk / responseTimes.length) * 100)
    : 0;
  const bookingRate = total > 0 ? Math.round(((counts.booked || 0) / total) * 100) : 0;

  setText("kpi-response-rate", total > 0 ? `${respRate}%` : t("no_data_dash"));
  setText("kpi-sla", responseTimes.length > 0 ? `${slaRate}%` : t("no_data_dash"));
  setText("kpi-booking-rate", total > 0 ? `${bookingRate}%` : t("no_data_dash"));
  setText("kpi-avg-response", responseTimes.length > 0 ? formatMinutes(avgResp) : t("no_data_dash"));

  // ── 1) Conversion Funnel ─────────────────
  // 각 단계 "도달 또는 이후" 카운트 (현재 stage 기준 추정)
  const c = (k) => counts[k] || 0;
  const funnelStages = [
    { key: "new_lead",     value: total },
    { key: "auto_replied", value: total - c("new_lead") },
    { key: "consulting",   value: c("consulting") + c("booking_push") + c("booked") },
    { key: "booking_push", value: c("booking_push") + c("booked") },
    { key: "booked",       value: c("booked") },
  ];
  renderFunnel(document.getElementById("chart-funnel"), funnelStages, total);

  // ── 2) Platform Distribution ─────────────
  const platformCounts = groupCount(state.leads, (l) => (l.platform || "unknown").toLowerCase());
  renderBarList(document.getElementById("chart-platform"), platformCounts, total, { emptyKey: "chart_no_data" });

  // ── 3) Daily Inflow (last 14 days) ───────
  const days = lastNDaysBuckets(14);
  state.leads.forEach((l) => {
    if (!l.createdAt) return;
    const dayKey = l.createdAt.slice(0, 10); // YYYY-MM-DD
    if (days[dayKey] != null) days[dayKey]++;
  });
  renderColChart(
    document.getElementById("chart-daily"),
    Object.entries(days).map(([k, v]) => ({ label: k.slice(5), value: v })),
    { emptyKey: "chart_no_data" }
  );

  // ── 4) Hourly Inflow (0-23 UTC) ──────────
  const hours = Array.from({ length: 24 }, () => 0);
  state.leads.forEach((l) => {
    if (!l.createdAt) return;
    const h = new Date(l.createdAt).getUTCHours();
    if (!isNaN(h)) hours[h]++;
  });
  renderColChart(
    document.getElementById("chart-hourly"),
    hours.map((v, i) => ({ label: String(i).padStart(2, "0"), value: v })),
    { emptyKey: "chart_no_data" }
  );

  // ── 5) Top Campaigns ─────────────────────
  const campCounts = groupCount(state.leads, (l) => (l.campaign_name || "").trim());
  delete campCounts[""];
  const top10 = Object.entries(campCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  renderBarList(document.getElementById("chart-campaigns"), top10, total, { emptyKey: "chart_no_campaigns" });

  renderIcons();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function groupCount(items, keyFn) {
  const out = {};
  items.forEach((it) => {
    const k = keyFn(it) || "";
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

function lastNDaysBuckets(n) {
  const out = {};
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    out[d.toISOString().slice(0, 10)] = 0;
  }
  return out;
}

function renderFunnel(container, stages, base) {
  if (!container) return;
  if (base === 0) {
    container.innerHTML = `<p class="chart-empty">${t("chart_no_data")}</p>`;
    return;
  }
  const max = stages[0].value || 1;
  let prev = stages[0].value;
  container.innerHTML = `<div class="funnel">${stages.map((s, idx) => {
    const pct = Math.max(2, (s.value / max) * 100);
    let dropHtml = "";
    if (idx > 0) {
      const dropped = Math.max(0, prev - s.value);
      const dropPct = prev > 0 ? Math.round((dropped / prev) * 100) : 0;
      dropHtml = `<span class="funnel-drop">−${dropPct}%</span>`;
    } else {
      dropHtml = `<span>100%</span>`;
    }
    prev = s.value;
    const label = t("stage_" + s.key);
    const icon = STAGE_ICON[s.key] || "circle";
    return `
      <div class="funnel-row">
        <span class="funnel-label"><i data-lucide="${icon}"></i>${escapeHtml(label)}</span>
        <span class="funnel-bar" style="width:${pct.toFixed(1)}%;">${s.value}</span>
        <span class="funnel-meta">${dropHtml}</span>
      </div>
    `;
  }).join("")}</div>`;
}

function renderBarList(container, dataObj, total, opts = {}) {
  if (!container) return;
  const entries = Object.entries(dataObj);
  if (entries.length === 0) {
    container.innerHTML = `<p class="chart-empty">${t(opts.emptyKey || "chart_no_data")}</p>`;
    return;
  }
  const max = Math.max(...entries.map(([, v]) => v));
  container.innerHTML = `<div class="bar-list">${entries
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => {
      const pct = max > 0 ? (value / max) * 100 : 0;
      const ofTotal = total > 0 ? Math.round((value / total) * 100) : 0;
      return `
        <div class="bar-row">
          <span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%;"></div></div>
          <span class="bar-value">${value}<span class="bar-pct">${ofTotal}%</span></span>
        </div>
      `;
    }).join("")}</div>`;
}

function renderColChart(container, items, opts = {}) {
  if (!container) return;
  if (items.length === 0 || items.every((it) => it.value === 0)) {
    container.innerHTML = `<p class="chart-empty">${t(opts.emptyKey || "chart_no_data")}</p>`;
    return;
  }
  const max = Math.max(...items.map((it) => it.value), 1);
  const bars = items.map((it) => {
    const h = (it.value / max) * 100;
    const cls = it.value === 0 ? " empty" : "";
    return `<div class="col-bar${cls}" style="height:${h}%;">
      ${it.value > 0 ? `<span class="col-tip">${it.label}: ${it.value}</span>` : ""}
    </div>`;
  }).join("");
  const axis = items.map((it) => `<span>${it.label}</span>`).join("");
  container.innerHTML = `<div class="col-chart">${bars}</div><div class="col-axis">${axis}</div>`;
}

function renderStageBreakdown(container, counts) {
  if (!container) return;
  container.innerHTML = Object.keys(STAGE_ICON)
    .map(
      (stage) => `
      <div class="stage-bar s-${stage}">
        <span class="stage-bar-label"><i data-lucide="${STAGE_ICON[stage]}"></i>${stageShortLabel(stage)}</span>
        <strong>${counts[stage] || 0}</strong>
      </div>`
    )
    .join("");
  renderIcons();
}

const STAGE_DEFAULT_STATUS = {
  new_lead: "CREATED",
  auto_replied: "AUTOANSWER",
  consulting: "ANSWER",
  booking_push: "ANSWER",
  booked: "END",
  no_response: "NO_RESPONSE",
  recontact_needed: "RECONTACT",
};

function loadConfigForm(ev) {
  const cfg = ev?.config || {};
  const map = cfg.stageStatusMap || {};
  Object.keys(STAGE_DEFAULT_STATUS).forEach((stage) => {
    const el = document.getElementById(`cfg-status-${stage}`);
    if (el) el.value = map[stage] || STAGE_DEFAULT_STATUS[stage];
  });
  document.getElementById("cfg-consulting-values").value = (cfg.statusConfig?.consulting || ["IN_PROGRESS", "상담 중"]).join(",");
  document.getElementById("cfg-phone-prefix").value = cfg.phonePrefixToStrip || "p:";
  const sheetUrlEl = document.getElementById("sheet-url");
  if (sheetUrlEl) sheetUrlEl.value = ev?.sheetUrl || "";
  const sheetNameEl = document.getElementById("sheet-name");
  if (sheetNameEl) sheetNameEl.value = cfg.sheetName || "";
  const apiKeyEl = document.getElementById("google-api-key");
  if (apiKeyEl) apiKeyEl.value = cfg.googleApiKey || "";
  const webhookEl = document.getElementById("sheet-webhook-url");
  if (webhookEl) webhookEl.value = ev?.sheetWebhookUrl || "";
}

function applyArchivedState(ev) {
  const archived = !!ev?.archived;
  document.body.classList.toggle("event-archived", archived);
  const label = document.getElementById("archive-event-label");
  if (label) label.textContent = archived ? t("btn_unarchive_event") : t("btn_archive_event");
  // 대시보드 event-pill에 종료 표시
  const pill = document.getElementById("event-meta");
  if (pill) pill.classList.toggle("archived", archived);
  // 종료 배너 표시 / 제거
  let banner = document.getElementById("archived-banner");
  if (archived && !banner && ev) {
    banner = document.createElement("div");
    banner.id = "archived-banner";
    banner.className = "archived-banner";
    banner.innerHTML = `<i data-lucide="archive"></i><span>${t("archived_banner")}</span>`;
    const main = document.querySelector("main");
    main.insertBefore(banner, main.firstChild);
    renderIcons();
  } else if (!archived && banner) {
    banner.remove();
  }
}

function loadWhatsappForm(ev) {
  const wa = ev?.config?.whatsapp || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
  set("wa-phone-id", wa.phoneNumberId);
  set("wa-access-token", wa.accessToken);
  set("wa-api-version", wa.apiVersion || "v17.0");
  set("wa-business-id", wa.businessAccountId);
  set("wa-test-recipient", wa.testRecipient);
}

function loadInquiryForm(ev) {
  if (!faqList) return;
  faqList.innerHTML = "";
  const faqs = eventFaqs(ev);
  if (faqs.length === 0) {
    faqList.innerHTML = `<li style="color:var(--text-muted);">${t("no_faq")}</li>`;
    return;
  }
  faqs.forEach((faq, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${index + 1}. ${faq.title}</strong><br><span>${faq.message}</span>`;
    faqList.appendChild(li);
  });
}

function applyI18n(lang) {
  currentLang = lang;
  localStorage.setItem("crmLang", lang);
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const value = t(key);
    if (value) el.textContent = value;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const value = t(el.dataset.i18nPh);
    if (value) el.placeholder = value;
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const value = t(el.dataset.i18nTitle);
    if (value) el.title = value;
  });

  // 동적 콘텐츠 다시 렌더
  refreshMeta();
  refreshDashboard();
  renderLeads();
  const ev = selectedEvent();
  if (ev) {
    loadInquiryForm(ev);
    loadWhatsappForm(ev);
    applyArchivedState(ev);
  }
}

// ========== Data Load ==========
async function loadEvents(preferredEventId) {
  const previousId = eventSelect.value;
  state.events = await api("/api/events");
  refreshEventOptions();
  if (state.events.length === 0) {
    state.leads = [];
    refreshDashboard();
    return;
  }
  const targetId = preferredEventId || previousId || state.events[0].id;
  const target = state.events.find((e) => e.id === targetId) || state.events[0];
  eventSelect.value = target.id;
  configEventSelect.value = target.id;
  inquiryEventSelect.value = target.id;
  const waSelect = document.getElementById("whatsapp-event-select");
  if (waSelect) waSelect.value = target.id;
  loadConfigForm(target);
  loadInquiryForm(target);
  loadWhatsappForm(target);
  applyArchivedState(target);
  await loadLeads();
}

async function loadLeads() {
  const ev = selectedEvent();
  if (!ev) {
    state.leads = [];
    refreshDashboard();
    renderLeads();
    return;
  }
  state.leads = await api(`/api/events/${ev.id}/leads`);
  renderLeads();
  refreshDashboard();
}

// ========== Lead List ==========
function getFilteredLeads() {
  let list = [...state.leads];

  if (state.filter !== "all") {
    const allowed = STAGE_GROUP[state.filter] || [];
    list = list.filter((l) => allowed.includes(l.stage));
  }

  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    list = list.filter((l) => {
      const haystack = [
        l.name || "",
        l.phone || "",
        l.log || "",
        l.campaign_name || "",
        l.ad_name || "",
        ...(l.notes || []).map((n) => n.text || ""),
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }

  list.sort((a, b) => (STAGE_PRIORITY[a.stage] ?? 9) - (STAGE_PRIORITY[b.stage] ?? 9));
  return list;
}

function renderLeads() {
  const ev = selectedEvent();
  leadList.innerHTML = "";
  leadSummary.textContent = "";

  if (!ev) return;
  if (state.leads.length === 0) {
    leadList.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:24px;">${t("no_leads")}</p>`;
    return;
  }

  const filtered = getFilteredLeads();
  const total = filtered.length;
  const limit = state.showAll ? total : Math.min(PAGE_SIZE, total);
  const visible = filtered.slice(0, limit);

  leadSummary.textContent = total === state.leads.length
    ? `${t("summary_total_only")}${total}${t("items_unit")}`
    : `${total}${t("summary_filtered")}${state.leads.length}${t("summary_filtered_end")}`;

  if (total === 0) {
    leadList.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:24px;">${t("no_match")}</p>`;
    return;
  }

  const faqs = eventFaqs(ev);

  visible.forEach((lead) => {
    const node = leadTemplate.content.cloneNode(true);
    const card = node.querySelector(".lead-card");
    if (STAGE_GROUP.needs_action.includes(lead.stage)) {
      card.classList.add("urgent");
    }
    node.querySelector(".lead-name").textContent = `${lead.name} · ${lead.phone}`;

    const stageEl = node.querySelector(".lead-stage");
    stageEl.classList.add(`s-${lead.stage}`);
    stageEl.innerHTML = `<i data-lucide="${STAGE_ICON[lead.stage] || "circle"}"></i>${stageShortLabel(lead.stage)}`;

    // SLA badge
    const slaEl = node.querySelector(".sla-badge");
    const slaState = getSlaState(lead);
    if (slaState) {
      slaEl.style.display = "inline-flex";
      slaEl.classList.add(`sla-${slaState}`);
      slaEl.innerHTML = `<i data-lucide="clock"></i>${relativeTime(lead.createdAt)} · ${t("sla_" + slaState)}`;
    }

    node.querySelector(".lead-meta").textContent =
      `${lead.service} · ${lead.lead_status || "-"} · ${(lead.createdAt || "").slice(0, 16).replace("T", " ")}`;

    // Campaign info (if available)
    const campaignEl = node.querySelector(".lead-campaign");
    const tags = [];
    if (lead.platform) tags.push(`<span class="campaign-tag">${lead.platform}</span>`);
    if (lead.campaign_name) tags.push(`<span class="campaign-tag">📢 ${lead.campaign_name}</span>`);
    if (lead.ad_name) tags.push(`<span class="campaign-tag">🎯 ${lead.ad_name}</span>`);
    if (tags.length) campaignEl.innerHTML = tags.join("");

    node.querySelector(".stage-select").value = lead.stage;

    const faqButtons = node.querySelector(".faq-buttons");
    if (faqs.length === 0) {
      faqButtons.innerHTML = `<p class="empty-faq">${t("empty_faq_inline")}</p>`;
    } else {
      faqButtons.innerHTML = faqs
        .map((faq, i) => `<button type="button" class="faq-action-btn" data-faq-index="${i}">${faq.title}</button>`)
        .join("");
    }

    // Activity timeline
    const timelineEl = node.querySelector(".activity-timeline");
    const activities = (lead.activities || []).slice().reverse(); // 최신순
    if (activities.length === 0) {
      timelineEl.innerHTML = `<p class="activity-empty">${t("activity_empty")}</p>`;
    } else {
      timelineEl.innerHTML = activities.map((a) => {
        const icon = ACTIVITY_ICON[a.type] || "circle";
        const sheetMeta = a.meta?.sheetSync ? `<span class="activity-meta">${t("sheet_meta_label")}: ${a.meta.sheetSync}</span>` : "";
        return `
          <div class="activity-item t-${a.type}">
            <span class="activity-icon"><i data-lucide="${icon}"></i></span>
            <span class="activity-message">${escapeHtml(a.message)}${sheetMeta}</span>
            <span class="activity-time">${relativeTime(a.at)}</span>
          </div>`;
      }).join("");
    }

    // Notes
    const notesEl = node.querySelector(".notes-list");
    const notesCountEl = node.querySelector(".notes-count");
    const notes = lead.notes || [];
    if (notes.length > 0) {
      notesCountEl.textContent = String(notes.length);
      notesCountEl.classList.add("has-notes");
    }
    if (notes.length === 0) {
      notesEl.innerHTML = `<p class="notes-empty">${t("notes_empty")}</p>`;
    } else {
      notesEl.innerHTML = notes.slice().reverse().map((n) => `
        <div class="note-item" data-note-id="${n.id}">
          <div>
            <div class="note-text">${escapeHtml(n.text)}</div>
            <span class="note-meta">${relativeTime(n.at)}</span>
          </div>
          <button type="button" class="note-delete" data-note-id="${n.id}" title="삭제">
            <i data-lucide="x"></i>
          </button>
        </div>
      `).join("");
    }

    // Tab switching
    node.querySelectorAll(".lead-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;
        const cardEl = tab.closest(".lead-card");
        cardEl.querySelectorAll(".lead-tab").forEach((t) => t.classList.toggle("active", t === tab));
        cardEl.querySelectorAll(".lead-tab-content").forEach((c) => c.classList.toggle("active", c.classList.contains(`tab-${targetTab}`)));
      });
    });

    // Stage select
    node.querySelector(".stage-select").addEventListener("change", async (e) => {
      try {
        const updated = await api(`/api/leads/${lead.id}/stage`, {
          method: "POST",
          body: JSON.stringify({ stage: e.target.value }),
        });
        toast(t("toast_state_changed"), "success");
        notifySheetSync(updated?.sheetWriteback);
        await loadLeads();
      } catch (err) {
        showError("상태 변경", err);
      }
    });

    // FAQ buttons
    node.querySelectorAll(".faq-action-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const faq = faqs[Number(btn.dataset.faqIndex)];
        if (!faq) return;
        try {
          const r = await api(`/api/leads/${lead.id}/send-whatsapp`, {
            method: "POST",
            body: JSON.stringify({ message: faq.message, title: faq.title }),
          });
          toast(`${t("toast_whatsapp_sent")}: ${faq.title}`, "success");
          notifySheetSync(r?.sheetWriteback);
          await loadLeads();
        } catch (err) {
          showError("WhatsApp", err);
        }
      });
    });

    // Note add
    node.querySelector(".note-add-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = e.currentTarget.querySelector(".note-input");
      const text = input.value.trim();
      if (!text) return;
      try {
        await api(`/api/leads/${lead.id}/notes`, {
          method: "POST",
          body: JSON.stringify({ text }),
        });
        input.value = "";
        toast(t("toast_note_added"), "success");
        await loadLeads();
      } catch (err) {
        showError("Note", err);
      }
    });

    // Note delete
    node.querySelectorAll(".note-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm(t("confirm_delete_note"))) return;
        const noteId = btn.dataset.noteId;
        try {
          await api(`/api/leads/${lead.id}/notes/${noteId}`, { method: "DELETE" });
          toast(t("toast_note_deleted"), "success");
          await loadLeads();
        } catch (err) {
          showError("Note", err);
        }
      });
    });

    leadList.appendChild(node);
  });

  if (total > limit) {
    const more = document.createElement("div");
    more.style.cssText = "text-align:center;padding:16px;";
    more.innerHTML = `<button type="button" class="btn-secondary" id="load-more-btn">
      <i data-lucide="chevron-down"></i><span>${t("btn_load_more")} (${limit}/${total})</span>
    </button>`;
    more.querySelector("#load-more-btn").addEventListener("click", () => {
      state.showAll = true;
      renderLeads();
    });
    leadList.appendChild(more);
  }

  renderIcons();
}

// ========== Event Form ==========
eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = eventForm.querySelector('button[type="submit"]');
  await withButtonBusy(btn, t("loading_saving"), async () => {
    try {
      const created = await api("/api/events", {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("event-name").value.trim(),
          country: document.getElementById("event-country").value.trim(),
          defaultService: document.getElementById("default-service").value,
        }),
      });
      eventForm.reset();
      await loadEvents(created.id);
      toast(t("toast_event_saved"), "success");
    } catch (err) {
      showError(t("btn_save_event"), err);
    }
  });
});

// ========== Sheet Form ==========
sheetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ev = selectedEvent();
  if (!ev) return toast(t("toast_select_event"), "error");
  const btn = sheetForm.querySelector('button[type="submit"]');
  await withButtonBusy(btn, t("loading_saving"), async () => {
    try {
      await api(`/api/events/${ev.id}/sheet`, {
        method: "POST",
        body: JSON.stringify({ sheetUrl: document.getElementById("sheet-url").value.trim() }),
      });
      const configUpdate = {};
      const apiKey = document.getElementById("google-api-key").value.trim();
      if (apiKey) configUpdate.googleApiKey = apiKey;
      const sheetName = document.getElementById("sheet-name").value.trim();
      if (sheetName) configUpdate.sheetName = sheetName;
      if (Object.keys(configUpdate).length > 0) {
        await api(`/api/events/${ev.id}/config`, {
          method: "POST",
          body: JSON.stringify(configUpdate),
        });
      }
      const webhookUrl = document.getElementById("sheet-webhook-url").value.trim();
      await api(`/api/events/${ev.id}/sheet-webhook`, {
        method: "POST",
        body: JSON.stringify({ sheetWebhookUrl: webhookUrl }),
      });
      await loadEvents(ev.id);
      toast(t("toast_sheet_saved"), "success");
    } catch (err) {
      showError(t("btn_save_sheet"), err);
    }
  });
});

// ========== Sheet Test / Import ==========
document.getElementById("sheet-test-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  const resultEl = document.getElementById("sheet-test-result");
  const btn = document.getElementById("sheet-test-btn");
  if (!ev) return toast(t("toast_select_event"), "error");
  resultEl.style.display = "block";
  resultEl.textContent = t("conn_checking");
  await withButtonBusy(btn, t("conn_checking"), async () => {
    try {
      const s = await api(`/api/events/${ev.id}/sheet-status`);
      const lines = [
        `${t("sheet_url_label")}: ${s.sheetUrl}`,
        `${t("api_key_label")}: ${s.apiKey}`,
        `${t("sheet_tab_label")}: ${s.sheetName}`,
      ];
      if (s.error) {
        lines.push(`❌ ${s.error}`);
      } else {
        lines.push(`✅ ${t("conn_success")}`);
        lines.push(`${t("rows_count")}: ${s.rowCount}`);
        lines.push(`${t("columns_label")}: ${(s.columns || []).join(", ") || t("none_paren")}`);
      }
      resultEl.textContent = lines.join("\n");
    } catch (err) {
      resultEl.textContent = `❌ ${err.message}`;
    }
  });
});

document.getElementById("import-sheet-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast(t("toast_select_event"), "error");
  if (!ev.sheetUrl) return toast(t("toast_set_sheet_first"), "error");
  const resultEl = document.getElementById("import-result");
  const btn = document.getElementById("import-sheet-btn");
  resultEl.style.display = "block";
  resultEl.textContent = t("loading_importing");
  await withButtonBusy(btn, t("loading_importing"), async () => {
    try {
      const r = await api(`/api/events/${ev.id}/import-from-sheet`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      resultEl.textContent = `✅ 신규 ${r.imported}건, 중복 ${r.skipped}건`;
      toast(`${r.imported}${t("toast_imported")}`, "success");
      await loadLeads();
    } catch (err) {
      resultEl.textContent = `❌ ${err.message}`;
      showError(t("btn_import_sheet"), err);
    }
  });
});

// ========== Lead Actions ==========
document.getElementById("simulate-lead-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast(t("toast_select_event"), "error");
  if (!ev.sheetUrl) return toast(t("toast_set_sheet_first"), "error");
  try {
    await api(`/api/events/${ev.id}/leads`, { method: "POST", body: JSON.stringify({}) });
    await loadLeads();
    toast(t("toast_test_lead_added"), "success");
  } catch (err) {
    showError("테스트 리드", err);
  }
});

document.getElementById("run-auto-reply-btn").addEventListener("click", async () => {
  const newLeads = state.leads.filter((l) => l.stage === "new_lead");
  if (newLeads.length === 0) return toast(t("toast_no_new_leads"), "info");
  if (!confirm(`${newLeads.length}${t("confirm_run_auto_reply")}`)) return;
  const btn = document.getElementById("run-auto-reply-btn");
  const labelBase = t("loading_processing").replace("...", "");
  await withButtonBusy(btn, `${labelBase} (0/${newLeads.length})`, async () => {
    try {
      let done = 0;
      let lastWriteback = null;
      for (const lead of newLeads) {
        const r = await api(`/api/leads/${lead.id}/auto-reply`, { method: "POST", body: JSON.stringify({}) });
        lastWriteback = r?.sheetWriteback ?? lastWriteback;
        done++;
        btn.textContent = `${labelBase} (${done}/${newLeads.length})`;
      }
      await loadLeads();
      toast(`${done}${t("toast_auto_reply_done")}`, "success");
      notifySheetSync(lastWriteback);
    } catch (err) {
      showError(t("btn_run_auto_reply"), err);
    }
  });
});

document.getElementById("clear-leads-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast(t("toast_select_event"), "error");
  if (!confirm(`${t("confirm_prefix")}${ev.name}${t("confirm_close")}${t("confirm_clear_leads")}`)) return;
  try {
    const r = await api(`/api/events/${ev.id}/leads`, { method: "DELETE" });
    toast(`${r.removed}${t("toast_removed")}`, "success");
    await loadLeads();
  } catch (err) {
    showError(t("btn_clear_leads"), err);
  }
});

document.getElementById("archive-event-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast(t("toast_no_event_selected"), "error");
  const willArchive = !ev.archived;
  const confirmKey = willArchive ? "confirm_archive_event" : "confirm_unarchive_event";
  if (!confirm(`${t("confirm_prefix")}${ev.name}${t("confirm_close")}${t(confirmKey)}`)) return;
  try {
    await api(`/api/events/${ev.id}/archive`, {
      method: "POST",
      body: JSON.stringify({ archived: willArchive }),
    });
    toast(willArchive ? t("toast_event_archived") : t("toast_event_unarchived"), "success");
    await loadEvents(ev.id);
  } catch (err) {
    showError(t("btn_archive_event"), err);
  }
});

document.getElementById("delete-event-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast(t("toast_no_event_selected"), "error");
  if (!confirm(`${t("confirm_prefix")}${ev.name}${t("confirm_close")}${t("confirm_delete_event")}`)) return;
  try {
    await api(`/api/events/${ev.id}`, { method: "DELETE" });
    toast(t("toast_event_deleted"), "success");
    await loadEvents();
  } catch (err) {
    showError(t("btn_delete_event"), err);
  }
});

// ========== Instagram Manual Form ==========
instagramIngestForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ev = selectedEvent();
  if (!ev) return toast(t("toast_select_event"), "error");
  try {
    await api("/api/ingest/instagram-new", {
      method: "POST",
      body: JSON.stringify({
        eventId: ev.id,
        created_time: document.getElementById("ig-created-time").value.trim(),
        platform: document.getElementById("ig-platform").value.trim(),
        phone_number: document.getElementById("ig-phone").value.trim(),
        full_name: document.getElementById("ig-full-name").value.trim(),
        lead_status: document.getElementById("ig-lead-status").value.trim(),
      }),
    });
    instagramIngestForm.reset();
    await loadLeads();
    toast(t("toast_lead_ingest"), "success");
  } catch (err) {
    showError(t("btn_crm_ingest"), err);
  }
});

appendSheetRowBtn.addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast(t("toast_select_event"), "error");
  try {
    await api(`/api/events/${ev.id}/append-instagram-row`, {
      method: "POST",
      body: JSON.stringify({
        created_time: document.getElementById("ig-created-time").value.trim(),
        platform: document.getElementById("ig-platform").value.trim(),
        phone_number: document.getElementById("ig-phone").value.trim(),
        full_name: document.getElementById("ig-full-name").value.trim(),
        lead_status: document.getElementById("ig-lead-status").value.trim(),
      }),
    });
    instagramIngestForm.reset();
    await loadLeads();
    toast(t("toast_row_appended"), "success");
  } catch (err) {
    showError(t("btn_append_row"), err);
  }
});

// ========== Config / FAQ Forms ==========
configForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const eventId = configEventSelect.value;
  if (!eventId) return toast(t("toast_select_event"), "error");
  const consultingValues = document
    .getElementById("cfg-consulting-values")
    .value.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const stageStatusMap = {};
  Object.keys(STAGE_DEFAULT_STATUS).forEach((stage) => {
    const el = document.getElementById(`cfg-status-${stage}`);
    if (el && el.value.trim()) {
      stageStatusMap[stage] = el.value.trim();
    }
  });

  try {
    await api(`/api/events/${eventId}/config`, {
      method: "POST",
      body: JSON.stringify({
        phonePrefixToStrip: document.getElementById("cfg-phone-prefix").value.trim() || "p:",
        statusConfig: {
          created: stageStatusMap.new_lead || "CREATED",
          consulting: consultingValues,
        },
        stageStatusMap: stageStatusMap,
      }),
    });
    await loadEvents(eventId);
    toast(t("toast_config_saved"), "success");
  } catch (err) {
    showError(t("btn_save_config"), err);
  }
});

inquiryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const eventId = inquiryEventSelect.value;
  const ev = state.events.find((event) => event.id === eventId);
  if (!ev) return toast(t("toast_select_event"), "error");
  const title = document.getElementById("faq-title").value.trim();
  const message = document.getElementById("faq-message").value.trim();
  if (!title || !message) return toast(t("toast_faq_required"), "error");
  if (eventFaqs(ev).length >= 6) return toast(t("toast_faq_max"), "error");
  const faqTemplates = [...eventFaqs(ev), { title, message }];
  try {
    await api(`/api/events/${eventId}/config`, {
      method: "POST",
      body: JSON.stringify({ faqTemplates }),
    });
    document.getElementById("faq-title").value = "";
    document.getElementById("faq-message").value = "";
    await loadEvents(eventId);
    toast(t("toast_faq_added"), "success");
  } catch (err) {
    showError(t("btn_faq_add"), err);
  }
});

// ========== WhatsApp Form ==========
const whatsappForm = document.getElementById("whatsapp-form");
const whatsappEventSelect = document.getElementById("whatsapp-event-select");

if (whatsappForm) {
  whatsappForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eventId = whatsappEventSelect.value;
    if (!eventId) return toast(t("toast_select_event"), "error");
    const btn = whatsappForm.querySelector('button[type="submit"]');
    await withButtonBusy(btn, t("loading_saving"), async () => {
      try {
        await api(`/api/events/${eventId}/config`, {
          method: "POST",
          body: JSON.stringify({
            whatsapp: {
              phoneNumberId: document.getElementById("wa-phone-id").value.trim(),
              accessToken: document.getElementById("wa-access-token").value.trim(),
              apiVersion: document.getElementById("wa-api-version").value.trim() || "v17.0",
              businessAccountId: document.getElementById("wa-business-id").value.trim(),
              testRecipient: document.getElementById("wa-test-recipient").value.trim(),
            },
          }),
        });
        await loadEvents(eventId);
        toast(t("toast_whatsapp_saved"), "success");
      } catch (err) {
        showError(t("btn_save_whatsapp"), err);
      }
    });
  });
}

// ========== Apps Script Code Copy ==========
const copyAppscriptBtn = document.getElementById("copy-appscript-btn");
if (copyAppscriptBtn) {
  copyAppscriptBtn.addEventListener("click", async () => {
    const code = document.getElementById("apps-script-code")?.textContent || "";
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // fallback for non-https environments
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    const labelEl = copyAppscriptBtn.querySelector("span");
    const original = labelEl.textContent;
    labelEl.textContent = t("manual_copied");
    copyAppscriptBtn.classList.add("copied");
    setTimeout(() => {
      labelEl.textContent = original;
      copyAppscriptBtn.classList.remove("copied");
    }, 1500);
  });
}

// ========== Lead Toolbar (Search / Filter) ==========
let searchDebounce;
leadSearch.addEventListener("input", (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.search = e.target.value;
    state.showAll = false;
    renderLeads();
  }, 200);
});

// ========== CSV Export ==========
const exportCsvBtn = document.getElementById("export-csv-btn");
if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    const ev = selectedEvent();
    if (!ev) return toast(t("toast_select_event"), "error");
    const rows = getFilteredLeads();
    if (rows.length === 0) return toast(t("no_match"), "info");

    const headers = [
      "name", "phone", "service", "stage", "lead_status",
      "platform", "createdAt", "campaign_name", "ad_name", "form_name",
      "log", "notes",
    ];
    const lines = [headers.join(",")];
    rows.forEach((l) => {
      const notesText = (l.notes || []).map((n) => `[${n.at}] ${n.text}`).join(" | ");
      const cells = [
        l.name, l.phone, l.service, l.stage, l.lead_status,
        l.platform, l.createdAt, l.campaign_name, l.ad_name, l.form_name,
        l.log, notesText,
      ].map(csvEscape);
      lines.push(cells.join(","));
    });

    const csv = "﻿" + lines.join("\r\n"); // BOM for Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateTag = new Date().toISOString().slice(0, 10);
    const safeName = (ev.name || "event").replace(/[^\w가-힣\-]/g, "_");
    a.href = url;
    a.download = `leads_${safeName}_${dateTag}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(t("toast_csv_done"), "success");
  });
}

// ========== Auto-refresh ==========
const autoRefreshToggle = document.getElementById("auto-refresh-toggle");
const autoRefreshIntervalSel = document.getElementById("auto-refresh-interval");
const autoRefreshStatus = document.getElementById("auto-refresh-status");
let autoRefreshTimer = null;

const AUTO_REFRESH_KEY = "crmAutoRefresh";
const AUTO_REFRESH_INTERVAL_KEY = "crmAutoRefreshInterval";

function updateAutoRefreshStatus() {
  if (!autoRefreshStatus) return;
  if (autoRefreshTimer) {
    const sec = Math.round(parseInt(autoRefreshIntervalSel.value, 10) / 1000);
    autoRefreshStatus.textContent = `· ${t("auto_refresh_on")}${sec}s`;
  } else {
    autoRefreshStatus.textContent = `· ${t("auto_refresh_off")}`;
  }
}

async function autoRefreshTick() {
  const ev = selectedEvent();
  if (!ev || ev.archived) return;
  const prevIds = new Set(state.leads.map((l) => l.id));
  const fresh = await api(`/api/events/${ev.id}/leads`).catch(() => null);
  if (!fresh) return;
  const newOnes = fresh.filter((l) => !prevIds.has(l.id));
  state.leads = fresh;
  // 검색/필터/스크롤 유지
  renderLeads();
  refreshDashboard();
  if (newOnes.length > 0) {
    toast(`${newOnes.length}${t("toast_new_leads")}`, "info", 4000);
    showDesktopNotification(
      t("notify_new_leads_title"),
      `${newOnes.length}${t("notify_new_leads_body")}`
    );
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  const interval = parseInt(autoRefreshIntervalSel.value, 10);
  autoRefreshTimer = setInterval(autoRefreshTick, interval);
  updateAutoRefreshStatus();
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  updateAutoRefreshStatus();
}

if (autoRefreshToggle && autoRefreshIntervalSel) {
  // 저장된 설정 복원
  const savedOn = localStorage.getItem(AUTO_REFRESH_KEY) === "1";
  const savedInt = localStorage.getItem(AUTO_REFRESH_INTERVAL_KEY);
  if (savedInt) autoRefreshIntervalSel.value = savedInt;
  autoRefreshToggle.checked = savedOn;
  if (savedOn) startAutoRefresh(); else updateAutoRefreshStatus();

  autoRefreshToggle.addEventListener("change", () => {
    localStorage.setItem(AUTO_REFRESH_KEY, autoRefreshToggle.checked ? "1" : "0");
    if (autoRefreshToggle.checked) startAutoRefresh();
    else stopAutoRefresh();
  });
  autoRefreshIntervalSel.addEventListener("change", () => {
    localStorage.setItem(AUTO_REFRESH_INTERVAL_KEY, autoRefreshIntervalSel.value);
    if (autoRefreshToggle.checked) startAutoRefresh();
    updateAutoRefreshStatus();
  });
}

stageFilter.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  stageFilter.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
  state.filter = btn.dataset.filter;
  state.showAll = false;
  renderLeads();
});

// ========== Event Selectors ==========
function syncEventSelect(value) {
  eventSelect.value = value;
  configEventSelect.value = value;
  inquiryEventSelect.value = value;
  const waSelect = document.getElementById("whatsapp-event-select");
  if (waSelect) waSelect.value = value;
  refreshMeta();
  const ev = selectedEvent();
  loadConfigForm(ev);
  loadInquiryForm(ev);
  loadWhatsappForm(ev);
  applyArchivedState(ev);
}

eventSelect.addEventListener("change", async () => {
  syncEventSelect(eventSelect.value);
  state.showAll = false;
  await loadLeads();
});

configEventSelect.addEventListener("change", () => syncEventSelect(configEventSelect.value));
inquiryEventSelect.addEventListener("change", () => syncEventSelect(inquiryEventSelect.value));
if (whatsappEventSelect) {
  whatsappEventSelect.addEventListener("change", () => syncEventSelect(whatsappEventSelect.value));
}

// ========== Language ==========
uiLanguageSelect.addEventListener("change", () => applyI18n(uiLanguageSelect.value));

// ========== Navigation ==========
const settingsGroup = document.getElementById("settings-group");
const settingsToggle = document.getElementById("settings-toggle");
const SETTINGS_VIEWS = new Set(["system-config-view", "whatsapp-config-view", "config-view"]);

function activateView(viewId) {
  views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  menuButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === viewId));
  if (settingsGroup) {
    settingsGroup.classList.toggle("open", SETTINGS_VIEWS.has(viewId));
  }
}

menuButtons.forEach((button) => {
  if (button.classList.contains("menu-parent")) return;
  button.addEventListener("click", () => activateView(button.dataset.view));
});

if (settingsToggle && settingsGroup) {
  settingsToggle.addEventListener("click", () => {
    settingsGroup.classList.toggle("open");
  });
}

quickNavButtons.forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.view));
});

// ========== Theme ==========
const THEME_KEY = "crmTheme";
const themeToggleBtn = document.getElementById("theme-toggle");
const themeLabelEl = document.getElementById("theme-label");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeLabelEl) {
    themeLabelEl.textContent = theme === "dark" ? t("theme_light") : t("theme_dark");
  }
  // 아이콘 교체 (moon ↔ sun)
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector("[data-lucide]");
    if (icon) {
      icon.setAttribute("data-lucide", theme === "dark" ? "sun" : "moon");
      renderIcons();
    }
  }
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", toggleTheme);
}

// 부팅 시 저장된 테마 또는 OS 선호 적용
{
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

// ========== Desktop Notifications ==========
const NOTIFY_KEY = "crmNotify";
const notifyToggle = document.getElementById("notify-toggle");

function notificationsEnabled() {
  return notifyToggle?.checked && "Notification" in window && Notification.permission === "granted";
}

function showDesktopNotification(title, body) {
  if (!notificationsEnabled()) return;
  try {
    const n = new Notification(title, { body, icon: "" });
    n.onclick = () => {
      window.focus();
      activateView("patient-view");
      n.close();
    };
  } catch (e) {
    /* ignore */
  }
}

if (notifyToggle) {
  // 저장된 설정 복원 (단, 권한이 부여된 경우만)
  const saved = localStorage.getItem(NOTIFY_KEY) === "1";
  if (saved && "Notification" in window && Notification.permission === "granted") {
    notifyToggle.checked = true;
  }

  notifyToggle.addEventListener("change", async () => {
    if (!("Notification" in window)) {
      toast(t("notify_blocked"), "error");
      notifyToggle.checked = false;
      return;
    }
    if (notifyToggle.checked) {
      if (Notification.permission === "denied") {
        toast(t("notify_blocked"), "error");
        notifyToggle.checked = false;
        return;
      }
      if (Notification.permission !== "granted") {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          toast(t("notify_denied"), "error");
          notifyToggle.checked = false;
          return;
        }
      }
      localStorage.setItem(NOTIFY_KEY, "1");
    } else {
      localStorage.setItem(NOTIFY_KEY, "0");
    }
  });
}

// ========== Keyboard Help Modal ==========
const kbdModal = document.getElementById("kbd-help-modal");
const kbdHelpBtn = document.getElementById("kbd-help-btn");
const kbdCloseBtn = kbdModal?.querySelector(".modal-close");

function openKbdHelp() {
  kbdModal?.classList.add("open");
  kbdModal?.setAttribute("aria-hidden", "false");
}
function closeKbdHelp() {
  kbdModal?.classList.remove("open");
  kbdModal?.setAttribute("aria-hidden", "true");
}

if (kbdHelpBtn) kbdHelpBtn.addEventListener("click", openKbdHelp);
if (kbdCloseBtn) kbdCloseBtn.addEventListener("click", closeKbdHelp);
if (kbdModal) {
  kbdModal.addEventListener("click", (e) => {
    if (e.target === kbdModal) closeKbdHelp();
  });
}

// ========== Keyboard Shortcuts ==========
let chordPrefix = null;
let chordTimer = null;

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function clickFilter(filterValue) {
  const btn = document.querySelector(`#stage-filter .filter-btn[data-filter="${filterValue}"]`);
  if (btn) btn.click();
}

document.addEventListener("keydown", (e) => {
  // 입력 중일 때는 단축키 비활성 (단, Esc는 허용)
  const inInput = isTypingTarget(e.target);
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  // Esc: 모달 닫기 / 검색 비우기 / 입력 포커스 해제
  if (e.key === "Escape") {
    if (kbdModal?.classList.contains("open")) {
      closeKbdHelp();
      e.preventDefault();
      return;
    }
    if (e.target === leadSearch && leadSearch.value) {
      leadSearch.value = "";
      state.search = "";
      renderLeads();
      e.preventDefault();
      return;
    }
    if (inInput) {
      e.target.blur();
    }
    return;
  }

  if (inInput) return;

  // Chord prefix 처리 (g, f)
  if (chordPrefix) {
    const handled = handleChord(chordPrefix, e.key);
    chordPrefix = null;
    clearTimeout(chordTimer);
    if (handled) e.preventDefault();
    return;
  }

  if (e.key === "g" || e.key === "f") {
    chordPrefix = e.key;
    chordTimer = setTimeout(() => {
      chordPrefix = null;
    }, 800);
    e.preventDefault();
    return;
  }

  // 단일 키
  switch (e.key) {
    case "?":
      openKbdHelp();
      e.preventDefault();
      break;
    case "/":
      activateView("patient-view");
      setTimeout(() => leadSearch?.focus(), 50);
      e.preventDefault();
      break;
    case "r":
      autoRefreshTick();
      toast("✓", "info", 800);
      e.preventDefault();
      break;
    case "a": {
      activateView("patient-view");
      const btn = document.getElementById("run-auto-reply-btn");
      if (btn && !btn.disabled) btn.click();
      e.preventDefault();
      break;
    }
    case "i": {
      activateView("patient-view");
      const btn = document.getElementById("import-sheet-btn");
      if (btn && !btn.disabled) btn.click();
      e.preventDefault();
      break;
    }
    case "t":
      toggleTheme();
      e.preventDefault();
      break;
  }
});

function handleChord(prefix, key) {
  if (prefix === "g") {
    const map = {
      d: "dashboard-view",
      c: "crm-view",
      l: "patient-view",
      s: "stats-view",
      e: "system-config-view",
      f: "config-view",
    };
    if (map[key]) {
      activateView(map[key]);
      return true;
    }
    return false;
  }
  if (prefix === "f") {
    const filterMap = { 1: "all", 2: "needs_action", 3: "in_progress", 4: "done" };
    if (filterMap[key]) {
      activateView("patient-view");
      clickFilter(filterMap[key]);
      return true;
    }
    return false;
  }
  return false;
}

// ========== Boot ==========
uiLanguageSelect.value = currentLang;
applyI18n(currentLang);
renderIcons();
loadEvents().catch((e) => {
  eventMeta.textContent = `${t("server_conn_failed")}: ${e.message}`;
  toast(`${t("server_conn_failed")}: ${e.message}`, "error", 5000);
});

// SLA 배지 시간 업데이트 (60초마다, 데이터 재요청 없이 화면만 갱신)
setInterval(() => {
  if (state.leads.length > 0 && document.visibilityState === "visible") {
    renderLeads();
  }
}, 60_000);
