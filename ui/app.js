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

const STAGE_LABEL = {
  new_lead: "🔴 신규",
  no_response: "🟠 미응답",
  recontact_needed: "🟡 재접촉필요",
  auto_replied: "🔵 자동응답완료",
  consulting: "🟢 상담중",
  booking_push: "🟢 예약유도",
  booked: "⚫ 예약완료",
};

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
    subtitle: "행사 → 시트 연결 → 자동응답 → 상담",
    language: "언어",
    save_event: "행사 등록",
    connect_sheet: "시트 설정 저장",
    config_menu: "System Config",
    save_config: "Config 저장",
    simulate_lead: "테스트 리드",
    run_auto_reply: "🚀 신규 일괄 자동응답",
  },
  en: {
    title: "Event CRM",
    subtitle: "Event → Sheet → Auto-reply → Consulting",
    language: "Language",
    save_event: "Save Event",
    connect_sheet: "Save Sheet Config",
    config_menu: "System Config",
    save_config: "Save Config",
    simulate_lead: "Test Lead",
    run_auto_reply: "🚀 Auto-reply All",
  },
  ru: {
    title: "Event CRM",
    subtitle: "Событие → Таблица → Автоответ → Консультация",
    language: "Язык",
    save_event: "Сохранить",
    connect_sheet: "Сохранить",
    config_menu: "System Config",
    save_config: "Сохранить",
    simulate_lead: "Тест",
    run_auto_reply: "🚀 Автоответ",
  },
};

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
  toast(`${label} 실패: ${message}`, "error", 5000);
}

async function withButtonBusy(button, loadingText, task) {
  if (!button) return task();
  const previous = button.textContent;
  button.disabled = true;
  button.textContent = loadingText || "처리 중...";
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
    eventMeta.textContent = "행사 미선택";
    leadList.innerHTML = "";
    refreshDashboard();
    return;
  }
  const sheet = ev.sheetUrl ? "✓ 시트연결" : "✗ 시트미연결";
  const webhook = ev.sheetWebhookUrl ? "✓ Webhook" : "";
  const apiKey = ev.config?.googleApiKey ? "✓ API키" : "✗ API키";
  eventMeta.textContent = `${ev.name} (${ev.country}) · ${sheet} · ${apiKey} ${webhook}`;
  refreshDashboard();
}

function refreshDashboard() {
  const total = state.leads.length;
  const counts = {};
  Object.keys(STAGE_LABEL).forEach((s) => (counts[s] = 0));
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
      <li>현재 행사: <strong>${ev ? ev.name : "없음"}</strong></li>
      <li>전체 리드: <strong>${total}</strong></li>
      <li>답변 필요: <strong>${needsAction}</strong></li>
      <li>진행중: <strong>${inProgress}</strong></li>
      <li>예약 완료: <strong>${counts.booked || 0}</strong></li>
    `;
  }
}

function renderStageBreakdown(container, counts) {
  if (!container) return;
  container.innerHTML = Object.keys(STAGE_LABEL)
    .map(
      (stage) => `
      <div class="stage-bar s-${stage}">
        <span>${STAGE_LABEL[stage]}</span>
        <strong>${counts[stage] || 0}</strong>
      </div>`
    )
    .join("");
}

function loadConfigForm(ev) {
  const cfg = ev?.config || {};
  document.getElementById("cfg-created-status").value = cfg.statusConfig?.created || "CREATED";
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

function loadInquiryForm(ev) {
  if (!faqList) return;
  faqList.innerHTML = "";
  const faqs = eventFaqs(ev);
  if (faqs.length === 0) {
    faqList.innerHTML = '<li style="color:var(--text-muted);">아직 FAQ가 없습니다.</li>';
    return;
  }
  faqs.forEach((faq, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${index + 1}. ${faq.title}</strong><br><span>${faq.message}</span>`;
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
    leadList.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:24px;">아직 리드가 없습니다. 시트에서 가져오거나 테스트 리드를 추가해보세요.</p>';
    return;
  }

  const filtered = getFilteredLeads();
  const total = filtered.length;
  const limit = state.showAll ? total : Math.min(PAGE_SIZE, total);
  const visible = filtered.slice(0, limit);

  leadSummary.textContent = total === state.leads.length
    ? `전체 ${total}건`
    : `필터/검색 결과 ${total}건 (전체 ${state.leads.length}건 중)`;

  if (total === 0) {
    leadList.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:24px;">조건에 맞는 리드가 없습니다.</p>';
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
    node.querySelector(".lead-stage").textContent = STAGE_LABEL[lead.stage] ?? lead.stage;
    node.querySelector(".lead-meta").textContent =
      `진료: ${lead.service} · 시트상태: ${lead.lead_status || "-"} · ${(lead.createdAt || "").slice(0, 16).replace("T", " ")}`;
    node.querySelector(".stage-select").value = lead.stage;
    node.querySelector(".log").textContent = lead.log || "";

    const faqButtons = node.querySelector(".faq-buttons");
    if (faqs.length === 0) {
      faqButtons.innerHTML = '<p>FAQ를 등록하면 1클릭 답변 버튼이 여기에 표시됩니다.</p>';
    } else {
      faqButtons.innerHTML = faqs
        .map((faq, i) => `<button type="button" class="faq-action-btn" data-faq-index="${i}">${faq.title}</button>`)
        .join("");
    }

    node.querySelector(".stage-select").addEventListener("change", async (e) => {
      try {
        await api(`/api/leads/${lead.id}/stage`, {
          method: "POST",
          body: JSON.stringify({ stage: e.target.value }),
        });
        toast("상태 변경 완료", "success");
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
          await api(`/api/leads/${lead.id}/send-whatsapp`, {
            method: "POST",
            body: JSON.stringify({ message: faq.message, title: faq.title }),
          });
          toast(`WhatsApp 발송: ${faq.title}`, "success");
          await loadLeads();
        } catch (err) {
          showError("WhatsApp 발송", err);
        }
      });
    });

    leadList.appendChild(node);
  });

  if (total > limit) {
    const more = document.createElement("div");
    more.style.cssText = "text-align:center;padding:16px;";
    more.innerHTML = `<button type="button" class="btn-secondary" id="load-more-btn">더 보기 (${limit}/${total}건)</button>`;
    more.querySelector("#load-more-btn").addEventListener("click", () => {
      state.showAll = true;
      renderLeads();
    });
    leadList.appendChild(more);
  }
}

// ========== Event Form ==========
eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = eventForm.querySelector('button[type="submit"]');
  await withButtonBusy(btn, "저장 중...", async () => {
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
      toast("행사 등록 완료", "success");
    } catch (err) {
      showError("행사 등록", err);
    }
  });
});

// ========== Sheet Form ==========
sheetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ev = selectedEvent();
  if (!ev) return toast("행사를 먼저 선택하세요", "error");
  const btn = sheetForm.querySelector('button[type="submit"]');
  await withButtonBusy(btn, "저장 중...", async () => {
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
      toast("시트 설정 저장 완료", "success");
    } catch (err) {
      showError("시트 설정 저장", err);
    }
  });
});

// ========== Sheet Test / Import ==========
document.getElementById("sheet-test-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  const resultEl = document.getElementById("sheet-test-result");
  const btn = document.getElementById("sheet-test-btn");
  if (!ev) return toast("행사를 먼저 선택하세요", "error");
  resultEl.style.display = "block";
  resultEl.textContent = "연결 확인 중...";
  await withButtonBusy(btn, "테스트 중...", async () => {
    try {
      const s = await api(`/api/events/${ev.id}/sheet-status`);
      const lines = [
        `Sheet URL: ${s.sheetUrl}`,
        `API Key: ${s.apiKey}`,
        `시트 탭: ${s.sheetName}`,
      ];
      if (s.error) {
        lines.push(`❌ ${s.error}`);
      } else {
        lines.push(`✅ 연결 성공`);
        lines.push(`데이터 행 수: ${s.rowCount}건`);
        lines.push(`컬럼: ${(s.columns || []).join(", ") || "(없음)"}`);
      }
      resultEl.textContent = lines.join("\n");
    } catch (err) {
      resultEl.textContent = `❌ 요청 오류: ${err.message}`;
    }
  });
});

document.getElementById("import-sheet-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast("행사를 먼저 선택하세요", "error");
  if (!ev.sheetUrl) return toast("구글시트 URL을 먼저 저장하세요", "error");
  const resultEl = document.getElementById("import-result");
  const btn = document.getElementById("import-sheet-btn");
  resultEl.style.display = "block";
  resultEl.textContent = "가져오는 중...";
  await withButtonBusy(btn, "가져오는 중...", async () => {
    try {
      const r = await api(`/api/events/${ev.id}/import-from-sheet`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      resultEl.textContent = `✅ 신규 ${r.imported}건, 중복 ${r.skipped}건`;
      toast(`${r.imported}건 가져옴`, "success");
      await loadLeads();
    } catch (err) {
      resultEl.textContent = `❌ ${err.message}`;
      showError("시트 가져오기", err);
    }
  });
});

// ========== Lead Actions ==========
document.getElementById("simulate-lead-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast("행사를 먼저 선택하세요", "error");
  if (!ev.sheetUrl) return toast("구글시트 URL을 먼저 저장하세요", "error");
  try {
    await api(`/api/events/${ev.id}/leads`, { method: "POST", body: JSON.stringify({}) });
    await loadLeads();
    toast("테스트 리드 추가됨", "success");
  } catch (err) {
    showError("테스트 리드", err);
  }
});

document.getElementById("run-auto-reply-btn").addEventListener("click", async () => {
  const newLeads = state.leads.filter((l) => l.stage === "new_lead");
  if (newLeads.length === 0) return toast("자동응답 대상(신규 리드)이 없습니다", "info");
  if (!confirm(`${newLeads.length}건에 자동응답을 실행할까요?`)) return;
  const btn = document.getElementById("run-auto-reply-btn");
  await withButtonBusy(btn, `처리 중 (0/${newLeads.length})...`, async () => {
    try {
      let done = 0;
      for (const lead of newLeads) {
        await api(`/api/leads/${lead.id}/auto-reply`, { method: "POST", body: JSON.stringify({}) });
        done++;
        btn.textContent = `처리 중 (${done}/${newLeads.length})...`;
      }
      await loadLeads();
      toast(`${done}건 자동응답 완료`, "success");
    } catch (err) {
      showError("자동응답", err);
    }
  });
});

document.getElementById("clear-leads-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast("행사를 먼저 선택하세요", "error");
  if (!confirm(`정말 [${ev.name}]의 모든 리드를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
  try {
    const r = await api(`/api/events/${ev.id}/leads`, { method: "DELETE" });
    toast(`${r.removed}건 삭제됨`, "success");
    await loadLeads();
  } catch (err) {
    showError("리드 삭제", err);
  }
});

document.getElementById("delete-event-btn").addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast("선택된 행사가 없습니다", "error");
  if (!confirm(`정말 [${ev.name}] 행사를 완전히 삭제할까요? 모든 리드도 함께 삭제됩니다.`)) return;
  try {
    await api(`/api/events/${ev.id}`, { method: "DELETE" });
    toast("행사 삭제됨", "success");
    await loadEvents();
  } catch (err) {
    showError("행사 삭제", err);
  }
});

// ========== Instagram Manual Form ==========
instagramIngestForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ev = selectedEvent();
  if (!ev) return toast("행사를 먼저 선택하세요", "error");
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
    toast("리드 인입 완료", "success");
  } catch (err) {
    showError("리드 인입", err);
  }
});

appendSheetRowBtn.addEventListener("click", async () => {
  const ev = selectedEvent();
  if (!ev) return toast("행사를 먼저 선택하세요", "error");
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
    toast("신규행 추가 완료", "success");
  } catch (err) {
    showError("신규행 추가", err);
  }
});

// ========== Config / FAQ Forms ==========
configForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const eventId = configEventSelect.value;
  if (!eventId) return toast("행사를 먼저 선택하세요", "error");
  const consultingValues = document
    .getElementById("cfg-consulting-values")
    .value.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  try {
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
    await loadEvents(eventId);
    toast("Config 저장 완료", "success");
  } catch (err) {
    showError("Config 저장", err);
  }
});

inquiryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const eventId = inquiryEventSelect.value;
  const ev = state.events.find((event) => event.id === eventId);
  if (!ev) return toast("행사를 먼저 선택하세요", "error");
  const title = document.getElementById("faq-title").value.trim();
  const message = document.getElementById("faq-message").value.trim();
  if (!title || !message) return toast("FAQ 제목과 메시지를 입력하세요", "error");
  if (eventFaqs(ev).length >= 6) return toast("FAQ는 최대 6개까지 등록 가능합니다", "error");
  const faqTemplates = [...eventFaqs(ev), { title, message }];
  try {
    await api(`/api/events/${eventId}/config`, {
      method: "POST",
      body: JSON.stringify({ faqTemplates }),
    });
    document.getElementById("faq-title").value = "";
    document.getElementById("faq-message").value = "";
    await loadEvents(eventId);
    toast("FAQ 추가됨", "success");
  } catch (err) {
    showError("FAQ 추가", err);
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
  loadConfigForm(selectedEvent());
  loadInquiryForm(selectedEvent());
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
function activateView(viewId) {
  views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  menuButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === viewId));
}

menuButtons.forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.view));
});

quickNavButtons.forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.view));
});

// ========== Boot ==========
loadEvents().catch((e) => {
  eventMeta.textContent = `서버 연결 실패: ${e.message}`;
  toast(`서버 연결 실패: ${e.message}`, "error", 5000);
});
applyI18n("ko");
