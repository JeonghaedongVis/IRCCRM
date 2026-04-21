const eventForm = document.getElementById("event-form");
const sheetForm = document.getElementById("sheet-form");
const eventSelect = document.getElementById("event-select");
const configEventSelect = document.getElementById("config-event-select");
const eventMeta = document.getElementById("event-meta");
const leadList = document.getElementById("lead-list");
const leadTemplate = document.getElementById("lead-template");
const instagramIngestForm = document.getElementById("instagram-ingest-form");
const appendSheetRowBtn = document.getElementById("append-sheet-row-btn");
const configForm = document.getElementById("config-form");
const inquiryForm = document.getElementById("inquiry-form");
const uiLanguageSelect = document.getElementById("ui-language");
const menuButtons = document.querySelectorAll(".sidebar .menu-btn");
const quickNavButtons = document.querySelectorAll(".quick-nav");
const views = document.querySelectorAll(".view");
const dashboardEventsCount = document.getElementById("dashboard-events-count");
const dashboardLeadsCount = document.getElementById("dashboard-leads-count");
const dashboardConsultingCount = document.getElementById("dashboard-consulting-count");
const statsSummary = document.getElementById("stats-summary");
const inquiryEventSelect = document.getElementById("inquiry-event-select");
const faqList = document.getElementById("faq-list");

const state = { events: [], leads: [] };
const i18n = {
  ko: {
    title: "이벤트 CRM MVP",
    subtitle: "새 행사 생성 → 구글시트 연결 → 자동응답/상담 진행",
    language: "언어",
    save_event: "행사 저장",
    connect_sheet: "시트 연결",
    config_menu: "Config 메뉴 (행사별 답변/상태 규칙)",
    save_config: "Config 저장",
    simulate_lead: "테스트 리드 유입",
    run_auto_reply: "자동응답 실행",
  },
  en: {
    title: "Event CRM MVP",
    subtitle: "Create Event → Connect Google Sheet → Auto-reply / Consulting",
    language: "Language",
    save_event: "Save Event",
    connect_sheet: "Connect Sheet",
    config_menu: "Config Menu (Templates / Status Rules)",
    save_config: "Save Config",
    simulate_lead: "Simulate Lead",
    run_auto_reply: "Run Auto-reply",
  },
  ru: {
    title: "Event CRM MVP",
    subtitle: "Создать событие → Подключить Google Sheet → Автоответ / Консультация",
    language: "Язык",
    save_event: "Сохранить событие",
    connect_sheet: "Подключить таблицу",
    config_menu: "Меню Config (шаблоны / правила статуса)",
    save_config: "Сохранить Config",
    simulate_lead: "Тестовый лид",
    run_auto_reply: "Запустить автоответ",
  },
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    if (res.status === 501) {
      throw new Error("API 501: 정적 서버로 실행중입니다. `python3 scripts/serve_ui.py` 또는 `python3 backend/mvp_server.py`로 실행하세요.");
    }
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}

function showError(actionLabel, error) {
  const message = error instanceof Error ? error.message : String(error);
  alert(`${actionLabel} 실패: ${message}`);
}

async function withButtonBusy(button, task) {
  const previousText = button.textContent;
  button.disabled = true;
  button.textContent = "저장 중...";
  try {
    await task();
  } finally {
    button.disabled = false;
    button.textContent = previousText;
  }
}

function selectedEvent() {
  const id = eventSelect.value;
  return state.events.find((e) => e.id === id);
}

function refreshEventOptions() {
  eventSelect.innerHTML = state.events.map((e) => `<option value="${e.id}">${e.name}</option>`).join("");
  configEventSelect.innerHTML = eventSelect.innerHTML;
  inquiryEventSelect.innerHTML = eventSelect.innerHTML;
  refreshMeta();
}

function refreshMeta() {
  const ev = selectedEvent();
  if (!ev) {
    eventMeta.textContent = "행사를 먼저 생성해 주세요.";
    leadList.innerHTML = "";
    refreshDashboard();
    return;
  }
  const sheet = ev.sheetUrl ? `시트 연결됨: ${ev.sheetUrl}` : "시트 미연결";
  const webhook = ev.sheetWebhookUrl ? "Webhook 연결됨" : "Webhook 미연결";
  const nextAction = !ev.sheetUrl
    ? "다음 단계: 2) 구글시트 주소 입력"
    : "다음 단계: 3) 테스트 리드 유입 또는 Instagram New 인입 실행";
  eventMeta.textContent = `현재 행사: ${ev.name} (${ev.country}) · ${sheet} · ${webhook} · ${nextAction}`;
  refreshDashboard();
}

function refreshDashboard() {
  if (dashboardEventsCount) dashboardEventsCount.textContent = String(state.events.length);
  if (dashboardLeadsCount) dashboardLeadsCount.textContent = String(state.leads.length);
  if (dashboardConsultingCount) {
    dashboardConsultingCount.textContent = String(state.leads.filter((lead) => lead.stage === "consulting").length);
  }
  if (!statsSummary) return;
  const selected = selectedEvent();
  statsSummary.innerHTML = `
    <li>현재 선택 행사: ${selected ? selected.name : "없음"}</li>
    <li>자동응답 완료: ${state.leads.filter((lead) => lead.stage === "auto_replied").length}</li>
    <li>예약 완료: ${state.leads.filter((lead) => lead.stage === "booked").length}</li>
    <li>미응답/재접촉 필요: ${state.leads.filter((lead) => ["no_response", "recontact_needed"].includes(lead.stage)).length}</li>
  `;
}

function loadConfigForm(ev) {
  const cfg = ev?.config || {};
  document.getElementById("cfg-created-status").value = cfg.statusConfig?.created || "CREATED";
  document.getElementById("cfg-consulting-values").value = (cfg.statusConfig?.consulting || ["IN_PROGRESS", "상담 중"]).join(",");
  document.getElementById("cfg-phone-prefix").value = cfg.phonePrefixToStrip || "p:";
}

function eventFaqs(ev) {
  return (ev?.config?.faqTemplates || []).slice(0, 6);
}

function loadInquiryForm(ev) {
  if (!faqList) return;
  faqList.innerHTML = "";
  eventFaqs(ev).forEach((faq, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${faq.title}: ${faq.message}`;
    faqList.appendChild(li);
  });
}

function applyI18n(lang) {
  const dict = i18n[lang] || i18n.ko;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });
}

async function loadEvents(preferredEventId) {
  const previousSelectedId = eventSelect.value;
  state.events = await api("/api/events");
  refreshEventOptions();
  if (state.events.length > 0) {
    const currentId = preferredEventId || previousSelectedId || eventSelect.value;
    const targetEvent = state.events.find((event) => event.id === currentId) || state.events[0];
    eventSelect.value = targetEvent.id;
    configEventSelect.value = targetEvent.id;
    inquiryEventSelect.value = targetEvent.id;
    loadConfigForm(selectedEvent());
    loadInquiryForm(selectedEvent());
    await loadLeads();
  }
}

async function loadLeads() {
  const ev = selectedEvent();
  if (!ev) {
    state.leads = [];
    refreshDashboard();
    return;
  }
  state.leads = await api(`/api/events/${ev.id}/leads`);
  renderLeads();
  refreshDashboard();
}

function renderLeads() {
  const ev = selectedEvent();
  leadList.innerHTML = "";
  if (!ev) return;

  if (state.leads.length === 0) {
    leadList.innerHTML = "<p>아직 리드가 없습니다. 테스트 리드 유입 버튼을 눌러보세요.</p>";
    return;
  }

  state.leads.forEach((lead) => {
    const node = leadTemplate.content.cloneNode(true);
    node.querySelector(".lead-name").textContent = `${lead.name} (${lead.phone})`;
    node.querySelector(".lead-stage").textContent = lead.stage;
    node.querySelector(".lead-meta").textContent = `관심진료: ${lead.service} · 유입시각: ${lead.createdAt}`;
    node.querySelector(".stage-select").value = lead.stage;
    node.querySelector(".log").textContent = lead.log || "로그 없음";
    const faqButtons = node.querySelector(".faq-buttons");
    const faqs = eventFaqs(ev);
    if (faqs.length === 0) {
      faqButtons.innerHTML = "<p>문의관리 탭에서 FAQ를 먼저 등록하세요.</p>";
    } else {
      faqButtons.innerHTML = faqs
        .map((faq, index) => `<button type="button" class="faq-action-btn" data-faq-index="${index}">${faq.title}</button>`)
        .join("");
    }

    node.querySelector(".stage-select").addEventListener("change", async (e) => {
      await api(`/api/leads/${lead.id}/stage`, {
        method: "POST",
        body: JSON.stringify({ stage: e.target.value }),
      });
      await loadLeads();
    });

    node.querySelectorAll(".faq-action-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const faq = faqs[Number(btn.dataset.faqIndex)];
        if (!faq) return alert("FAQ를 찾을 수 없습니다.");
        await api(`/api/leads/${lead.id}/send-whatsapp`, {
          method: "POST",
          body: JSON.stringify({ message: faq.message, title: faq.title }),
        });
        await loadLeads();
      });
    });

    leadList.appendChild(node);
  });
}

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitButton = eventForm.querySelector('button[type="submit"]');
  if (!submitButton) return;

  await withButtonBusy(submitButton, async () => {
    try {
      const createdEvent = await api("/api/events", {
        method: "POST",
        body: JSON.stringify({
          name: document.getElementById("event-name").value.trim(),
          country: document.getElementById("event-country").value.trim(),
          defaultService: document.getElementById("default-service").value,
        }),
      });
      eventForm.reset();
      await loadEvents(createdEvent.id);
      alert("행사 저장 완료");
    } catch (error) {
      showError("행사 저장", error);
    }
  });
});

sheetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ev = selectedEvent();
  if (!ev) return;
  const submitButton = sheetForm.querySelector('button[type="submit"]');
  if (!submitButton) return;
  await withButtonBusy(submitButton, async () => {
    try {
      await api(`/api/events/${ev.id}/sheet`, {
        method: "POST",
        body: JSON.stringify({ sheetUrl: document.getElementById("sheet-url").value.trim() }),
      });
      const webhookUrl = document.getElementById("sheet-webhook-url").value.trim();
      if (webhookUrl) {
        await api(`/api/events/${ev.id}/sheet-webhook`, {
          method: "POST",
          body: JSON.stringify({ sheetWebhookUrl: webhookUrl }),
        });
      }
      await loadEvents(ev.id);
      eventSelect.value = ev.id;
      configEventSelect.value = ev.id;
      inquiryEventSelect.value = ev.id;
      refreshMeta();
      alert("시트 연결 저장 완료");
    } catch (error) {
      showError("시트 연결 저장", error);
    }
  });
});

document.getElementById("simulate-lead-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return alert("행사를 먼저 생성하세요.");
  if (!ev.sheetUrl) return alert("구글시트 주소를 먼저 연결하세요.");
  try {
    await api(`/api/events/${ev.id}/leads`, { method: "POST", body: JSON.stringify({}) });
    await loadLeads();
    alert("테스트 리드 인입 완료");
  } catch (error) {
    showError("테스트 리드 인입", error);
  }
});

document.getElementById("run-auto-reply-btn").addEventListener("click", async () => {
  try {
    for (const lead of state.leads.filter((l) => l.stage === "new_lead")) {
      await api(`/api/leads/${lead.id}/auto-reply`, { method: "POST", body: JSON.stringify({}) });
    }
    await loadLeads();
    alert("자동응답 실행 완료");
  } catch (error) {
    showError("자동응답 실행", error);
  }
});

configForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const eventId = configEventSelect.value;
  if (!eventId) return alert("행사를 먼저 선택하세요.");
  const consultingValues = document
    .getElementById("cfg-consulting-values")
    .value.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await api(`/api/events/${eventId}/config`, {
    method: "POST",
    body: JSON.stringify({
      phonePrefixToStrip: document.getElementById("cfg-phone-prefix").value.trim() || "p:",
      statusConfig: {
        created: document.getElementById("cfg-created-status").value.trim() || "CREATED",
        consulting: consultingValues,
      },
    }),
  });
  await loadEvents();
  eventSelect.value = eventId;
  configEventSelect.value = eventId;
  refreshMeta();
  alert("Config 저장 완료");
});

inquiryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const eventId = inquiryEventSelect.value;
  const ev = state.events.find((event) => event.id === eventId);
  if (!ev) return alert("행사를 먼저 선택하세요.");
  const title = document.getElementById("faq-title").value.trim();
  const message = document.getElementById("faq-message").value.trim();
  if (!title || !message) return alert("FAQ 제목/메시지를 입력하세요.");
  if (eventFaqs(ev).length >= 6) return alert("FAQ는 행사별 최대 6개까지 등록할 수 있습니다.");
  const faqTemplates = [...eventFaqs(ev), { title, message }];
  await api(`/api/events/${eventId}/config`, {
    method: "POST",
    body: JSON.stringify({ faqTemplates }),
  });
  document.getElementById("faq-title").value = "";
  document.getElementById("faq-message").value = "";
  await loadEvents(eventId);
  eventSelect.value = eventId;
  configEventSelect.value = eventId;
  inquiryEventSelect.value = eventId;
  loadInquiryForm(selectedEvent());
  alert("FAQ 저장 완료");
});


instagramIngestForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ev = selectedEvent();
  if (!ev) return alert("행사를 먼저 생성하세요.");
  if (!ev.sheetUrl) return alert("구글시트 주소를 먼저 연결하세요.");

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
});

appendSheetRowBtn.addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return alert("행사를 먼저 생성하세요.");
  if (!ev.sheetUrl) return alert("구글시트 주소를 먼저 연결하세요.");

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
});

eventSelect.addEventListener("change", async () => {
  configEventSelect.value = eventSelect.value;
  inquiryEventSelect.value = eventSelect.value;
  refreshMeta();
  loadConfigForm(selectedEvent());
  loadInquiryForm(selectedEvent());
  await loadLeads();
});

configEventSelect.addEventListener("change", () => {
  eventSelect.value = configEventSelect.value;
  inquiryEventSelect.value = configEventSelect.value;
  refreshMeta();
  loadConfigForm(selectedEvent());
  loadInquiryForm(selectedEvent());
});

inquiryEventSelect.addEventListener("change", () => {
  eventSelect.value = inquiryEventSelect.value;
  configEventSelect.value = inquiryEventSelect.value;
  refreshMeta();
  loadConfigForm(selectedEvent());
  loadInquiryForm(selectedEvent());
});

uiLanguageSelect.addEventListener("change", () => {
  applyI18n(uiLanguageSelect.value);
});

menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const viewId = button.dataset.view;
    menuButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  });
});

quickNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const viewId = button.dataset.view;
    views.forEach((view) => view.classList.toggle("active", view.id === viewId));
    menuButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === viewId));
  });
});

loadEvents().catch((e) => {
  eventMeta.textContent = `서버 연결 실패: ${e.message}`;
});
applyI18n("ko");

if (window.lucide && typeof window.lucide.createIcons === "function") {
  window.lucide.createIcons();
}
