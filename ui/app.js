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

// ========== Rendering ==========
function refreshEventOptions() {
  const optsHtml = state.events.map((e) => `<option value="${e.id}">${e.name}</option>`).join("");
  eventSelect.innerHTML = optsHtml;
  configEventSelect.innerHTML = optsHtml;
  inquiryEventSelect.innerHTML = optsHtml;
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
  loadConfigForm(target);
  loadInquiryForm(target);
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
    list = list.filter(
      (l) =>
        (l.name || "").toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        (l.log || "").toLowerCase().includes(q)
    );
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

    node.querySelector(".lead-meta").textContent =
      `${lead.service} · 시트상태 ${lead.lead_status || "-"} · ${(lead.createdAt || "").slice(0, 16).replace("T", " ")}`;
    node.querySelector(".stage-select").value = lead.stage;
    node.querySelector(".log").textContent = lead.log || "";

    const faqButtons = node.querySelector(".faq-buttons");
    if (faqs.length === 0) {
      faqButtons.innerHTML = `<p class="empty-faq">${t("empty_faq_inline")}</p>`;
    } else {
      faqButtons.innerHTML = faqs
        .map((faq, i) => `<button type="button" class="faq-action-btn" data-faq-index="${i}">${faq.title}</button>`)
        .join("");
    }

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
  refreshMeta();
  const ev = selectedEvent();
  loadConfigForm(ev);
  loadInquiryForm(ev);
  applyArchivedState(ev);
}

eventSelect.addEventListener("change", async () => {
  syncEventSelect(eventSelect.value);
  state.showAll = false;
  await loadLeads();
});

configEventSelect.addEventListener("change", () => syncEventSelect(configEventSelect.value));
inquiryEventSelect.addEventListener("change", () => syncEventSelect(inquiryEventSelect.value));

// ========== Language ==========
uiLanguageSelect.addEventListener("change", () => applyI18n(uiLanguageSelect.value));

// ========== Navigation ==========
const settingsGroup = document.getElementById("settings-group");
const settingsToggle = document.getElementById("settings-toggle");
const SETTINGS_VIEWS = new Set(["system-config-view", "config-view"]);

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

// ========== Boot ==========
uiLanguageSelect.value = currentLang;
applyI18n(currentLang);
renderIcons();
loadEvents().catch((e) => {
  eventMeta.textContent = `${t("server_conn_failed")}: ${e.message}`;
  toast(`${t("server_conn_failed")}: ${e.message}`, "error", 5000);
});
