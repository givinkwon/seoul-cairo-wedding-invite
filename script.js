const EVENT = {
  title: "권기빈 · 송시아 결혼합니다",
  couple: "권기빈 · 송시아",
  startLocal: "20270522T123000",
  endLocal: "20270522T143000",
  location: "이태원 한남웨딩가든, 서울특별시 용산구 소월로 323",
  description: "2027.05.22 토요일 12:30 · 이태원 한남웨딩가든",
};

// Google Apps Script Web App URL. Keep empty until the Sheet endpoint is deployed.
const ATTENDANCE_ENDPOINT = "";

const STORAGE = {
  attendance: "oasisWedding.rsvps",
  guestbook: "oasisWedding.guestbook",
  scarabs: "oasisWedding.scarabs",
};

const EPISODES = {
  seoul: {
    title: "첫 인사",
    text: "낯선 언어보다 먼저 웃음이 통했고, 서로의 하루를 묻는 사람이 되었습니다.",
  },
  cairo: {
    title: "서로를 알아간 시간",
    text: "다른 배경을 설명하고 들어주며 같은 방향을 천천히 확인했습니다.",
  },
  wedding: {
    title: "서울에서 시작하는 약속",
    text: "두 가족과 두 문화가 서울에서 만나는 첫날을 준비합니다.",
  },
  travel: {
    title: "하객을 위한 안내",
    text: "멀리서 오시는 분들도 편히 찾아오실 수 있도록 지도와 교통 정보를 정리했습니다.",
  },
};

const DEFAULT_STARS = [
  { name: "가족", message: "서로를 존중하며 다정하게 살아가길 축복합니다.", x: 18, y: 28 },
  { name: "친구", message: "두 사람의 새로운 계절이 가장 따뜻한 집이 되기를.", x: 38, y: 18 },
  { name: "동료", message: "서울에서 시작하는 멋진 약속을 응원합니다.", x: 72, y: 30 },
];

const SIDE_LABELS = {
  groom: "신랑측",
  bride: "신부측",
};

const ATTENDANCE_LABELS = {
  yes: "참석",
  no: "불참",
};

const MEAL_ATTENDANCE_LABELS = {
  yes: "식사",
  no: "식사 안 함",
};

const DIETARY_LABELS = {
  regular: "일반식",
  halal: "할랄",
  vegetarian: "채식",
  none: "해당 없음",
};

const ATTENDANCE_EXPORT_FIELDS = [
  ["createdAt", "제출시간"],
  ["name", "이름"],
  ["phone", "연락처"],
  ["side", "하객구분"],
  ["attendance", "참석여부"],
  ["adultCompanions", "동행성인"],
  ["childCompanions", "동행아동"],
  ["mealAttendance", "식사여부"],
  ["dietary", "식이요청"],
  ["note", "전달사항"],
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function endpoint() {
  return ATTENDANCE_ENDPOINT.trim();
}

function hasRemoteStore() {
  return endpoint().length > 0;
}

function storageKey(type) {
  return type === "guestbook" ? STORAGE.guestbook : STORAGE.attendance;
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getLocalRecords(type) {
  return readJson(storageKey(type), []);
}

function saveLocalRecord(type, entry) {
  const entries = getLocalRecords(type);
  entries.push(entry);
  writeJson(storageKey(type), entries);
  return entry;
}

async function fetchRemoteRecords(type) {
  const url = new URL(endpoint());
  url.searchParams.set("type", type);
  const response = await fetch(url.toString(), { method: "GET" });
  if (!response.ok) throw new Error(`Remote fetch failed: ${response.status}`);
  const data = await response.json();
  if (data.ok === false) throw new Error(data.error || "Remote fetch failed");
  return Array.isArray(data.entries) ? data.entries : [];
}

async function saveRemoteRecord(type, payload) {
  const response = await fetch(endpoint(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ type, payload }),
  });
  if (!response.ok) throw new Error(`Remote save failed: ${response.status}`);
  const data = await response.json();
  if (data.ok === false) throw new Error(data.error || "Remote save failed");
  return data.entry || payload;
}

async function getRecords(type) {
  if (!hasRemoteStore()) return getLocalRecords(type);
  return fetchRemoteRecords(type);
}

async function saveRecord(type, payload) {
  if (!hasRemoteStore()) return saveLocalRecord(type, payload);
  return saveRemoteRecord(type, payload);
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function setBusy(element, busy) {
  if (!element) return;
  element.querySelectorAll("button, input, select, textarea").forEach((control) => {
    control.disabled = busy;
  });
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  return ok;
}

function getShareUrl() {
  const url = new URL(window.location.href);
  url.hash = "";
  url.search = "";

  if (url.pathname.endsWith("/admin.html")) {
    url.pathname = url.pathname.replace(/admin\.html$/, "");
  }

  if (url.pathname.endsWith("/index.html")) {
    url.pathname = url.pathname.replace(/index\.html$/, "");
  }

  return url.toString();
}

function setupStorageNotices() {
  const publicMessage = hasRemoteStore()
    ? "참석 여부는 안전하게 저장됩니다."
    : "현재 참석 확인은 미리보기 모드입니다. Google Sheets 연결 전에는 이 기기에만 저장됩니다.";
  const guestbookMessage = hasRemoteStore()
    ? "방명록 메시지는 안전하게 저장됩니다."
    : "현재 방명록은 미리보기 모드입니다. Google Sheets 연결 전에는 이 기기에만 저장됩니다.";
  const adminMessage = hasRemoteStore()
    ? "Google Sheets 연결 모드입니다."
    : "미리보기 모드입니다. 현재 브라우저 localStorage 데이터만 표시됩니다.";

  const attendanceNote = $("#attendanceModeNote");
  const guestbookNote = $("#guestbookModeNote");
  const storageStatus = $("#storageStatus");
  const adminDataNote = $("#adminDataNote");

  if (attendanceNote) attendanceNote.textContent = publicMessage;
  if (guestbookNote) guestbookNote.textContent = guestbookMessage;
  if (storageStatus) storageStatus.textContent = adminMessage;
  if (adminDataNote) adminDataNote.textContent = hasRemoteStore() ? "Google Sheets 기준입니다." : "현재 브라우저에 저장된 미리보기 데이터 기준입니다.";
}

function setupLanguageTabs() {
  const buttons = $$(".lang-tab");
  const panels = $$(".letter-panel");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const lang = button.dataset.lang;
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.letter === lang));
    });
  });
}

function createIcs() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Givin Sia Wedding//Mobile Invitation//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@our-oasis-wedding`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
    `DTSTART;TZID=Asia/Seoul:${EVENT.startLocal}`,
    `DTEND;TZID=Asia/Seoul:${EVENT.endLocal}`,
    `SUMMARY:${EVENT.title}`,
    `LOCATION:${EVENT.location}`,
    `DESCRIPTION:${EVENT.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function setupCalendarDownload() {
  const button = $("#calendarButton");
  if (!button) return;
  button.addEventListener("click", () => {
    const blob = new Blob([createIcs()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "givin-sia-wedding.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("일정 파일을 만들었습니다.");
  });
}

function setupShare() {
  const shareButtons = $$("[data-share-button]");
  const copyUrl = $("#copyUrl");
  const shareData = () => ({
    title: EVENT.title,
    text: EVENT.description,
    url: getShareUrl(),
  });

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share(shareData());
      } else {
        await copyText(getShareUrl());
        showToast("초대장 URL을 복사했습니다.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("공유를 완료하지 못했습니다.");
    }
  }

  shareButtons.forEach((button) => button.addEventListener("click", share));
  copyUrl?.addEventListener("click", async () => {
    try {
      await copyText(getShareUrl());
      showToast("URL을 복사했습니다.");
    } catch {
      showToast("URL 복사 권한을 확인해주세요.");
    }
  });
}

function setupCopyButtons() {
  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await copyText(button.dataset.copy || "");
        showToast(`${button.dataset.copyLabel || "내용"}를 복사했습니다.`);
      } catch {
        showToast("복사 권한을 확인해주세요.");
      }
    });
  });
}

function setupQr() {
  const image = $("#qrImage");
  if (!image) return;
  const data = encodeURIComponent(getShareUrl());
  image.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${data}`;
}

let audioContext;
let musicTimer;
let musicPlaying = false;

function playTone(frequency, startTime, duration) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.08, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function scheduleMelody() {
  if (!musicPlaying || !audioContext) return;
  const notes = [392, 440, 493.88, 587.33, 493.88, 440, 392, 329.63, 392, 440, 523.25, 493.88];
  const beat = 0.42;
  const start = audioContext.currentTime + 0.06;
  notes.forEach((frequency, index) => playTone(frequency, start + index * beat, beat * 0.88));
  musicTimer = window.setTimeout(scheduleMelody, notes.length * beat * 1000 + 700);
}

function setupMusic() {
  const button = $("#musicToggle");
  if (!button) return;

  button.addEventListener("click", async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      showToast("이 브라우저는 음악 재생을 지원하지 않습니다.");
      return;
    }

    if (musicPlaying) {
      musicPlaying = false;
      window.clearTimeout(musicTimer);
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "음악 켜기");
      showToast("음악을 껐습니다.");
      return;
    }

    audioContext = audioContext || new AudioContextClass();
    if (audioContext.state === "suspended") await audioContext.resume();
    musicPlaying = true;
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", "음악 끄기");
    scheduleMelody();
    showToast("음악을 켰습니다.");
  });
}

function setupScarabs() {
  const tokens = $$(".scarab-token");
  const count = $("#scarabCount");
  const list = $("#episodeList");
  const tokenKeys = new Set(tokens.map((token) => token.dataset.episode).filter(Boolean));
  let found = new Set(readJson(STORAGE.scarabs, []).filter((key) => tokenKeys.has(key)));

  function render() {
    tokens.forEach((token) => token.classList.toggle("is-found", found.has(token.dataset.episode)));
    if (count) count.textContent = `${found.size}/${tokens.length}`;
    if (!list) return;

    const items = [...found].map((key) => EPISODES[key]).filter(Boolean);
    if (items.length === 0) {
      list.innerHTML = '<div class="episode-item"><strong>아직 발견 전</strong>페이지 속 작은 별을 누르면 이야기가 열립니다.</div>';
      return;
    }

    list.innerHTML = items
      .map((item) => `<div class="episode-item"><strong>${item.title}</strong>${item.text}</div>`)
      .join("");
  }

  tokens.forEach((token) => {
    token.addEventListener("click", () => {
      const key = token.dataset.episode;
      if (!key || found.has(key)) return;
      found.add(key);
      writeJson(STORAGE.scarabs, [...found]);
      render();
      showToast(`"${EPISODES[key].title}" 이야기가 열렸습니다.`);
    });
  });

  $("#resetQuest")?.addEventListener("click", () => {
    found = new Set();
    writeJson(STORAGE.scarabs, []);
    render();
    showToast("별 기록을 초기화했습니다.");
  });

  render();
}

function numberValue(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeAttendance(entry) {
  const adultCompanions = numberValue(entry.adultCompanions ?? entry.adults ?? entry.companions ?? 0);
  const childCompanions = numberValue(entry.childCompanions ?? entry.children ?? 0);
  const oldMeal = entry.meal || "";
  const dietary = entry.dietary || (["halal", "vegetarian", "regular"].includes(oldMeal) ? oldMeal : "regular");
  const mealAttendance = entry.mealAttendance || (oldMeal === "none" ? "no" : "yes");

  return {
    id: entry.id || "",
    createdAt: entry.createdAt || "",
    name: entry.name || "-",
    phone: entry.phone || "",
    side: entry.side || "",
    attendance: entry.attendance || "",
    adultCompanions,
    childCompanions,
    mealAttendance,
    dietary,
    note: entry.note || entry.message || "",
  };
}

function formatRsvpDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function sortedByCreatedAt(entries) {
  return [...entries].sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
}

function renderStats(entries = []) {
  const grid = $("#statsGrid");
  if (!grid) return;

  const normalized = entries.map(normalizeAttendance);
  const attending = normalized.filter((entry) => entry.attendance === "yes");
  const absent = normalized.filter((entry) => entry.attendance === "no");
  const adults = attending.reduce((sum, entry) => sum + entry.adultCompanions, 0);
  const children = attending.reduce((sum, entry) => sum + entry.childCompanions, 0);
  const halal = attending.filter((entry) => entry.dietary === "halal").length;
  const vegetarian = attending.filter((entry) => entry.dietary === "vegetarian").length;

  const stats = [
    { label: "총 응답", value: normalized.length },
    { label: "참석", value: attending.length },
    { label: "불참", value: absent.length },
    { label: "성인 포함", value: attending.length + adults },
    { label: "아동 동행", value: children },
    { label: "할랄/채식", value: halal + vegetarian },
  ];

  grid.innerHTML = stats
    .map((item) => `<div class="stat-card"><strong>${item.value}</strong><span>${item.label}</span></div>`)
    .join("");
}

function renderRsvpTable(entries = []) {
  const body = $("#rsvpTableBody");
  const empty = $("#rsvpEmpty");
  if (!body) return;

  const normalized = sortedByCreatedAt(entries.map(normalizeAttendance));
  body.innerHTML = "";
  empty?.classList.toggle("is-visible", normalized.length === 0);

  normalized.forEach((entry) => {
    const row = document.createElement("tr");
    const cells = [
      formatRsvpDate(entry.createdAt),
      entry.name,
      SIDE_LABELS[entry.side] || "-",
      entry.phone || "-",
      ATTENDANCE_LABELS[entry.attendance] || "-",
      `${entry.adultCompanions}명`,
      `${entry.childCompanions}명`,
      MEAL_ATTENDANCE_LABELS[entry.mealAttendance] || "-",
      DIETARY_LABELS[entry.dietary] || "-",
      entry.note || "",
    ];

    cells.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    body.appendChild(row);
  });
}

async function renderAttendanceAdmin() {
  if (!$("#statsGrid") && !$("#rsvpTableBody")) return;
  try {
    const entries = await getRecords("attendance");
    renderStats(entries);
    renderRsvpTable(entries);
  } catch {
    showToast("참석 데이터를 불러오지 못했습니다.");
  }
}

function setupRsvp() {
  const form = $("#rsvpForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const entry = {
      id: window.crypto?.randomUUID?.() || String(Date.now()),
      createdAt: new Date().toISOString(),
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      side: String(formData.get("side") || ""),
      attendance: String(formData.get("attendance") || ""),
      adultCompanions: String(formData.get("adultCompanions") || "0"),
      childCompanions: String(formData.get("childCompanions") || "0"),
      mealAttendance: String(formData.get("mealAttendance") || ""),
      dietary: String(formData.get("dietary") || "regular"),
      note: String(formData.get("note") || "").trim(),
    };

    if (!entry.name || !entry.side || !entry.attendance || !entry.mealAttendance) return;

    try {
      setBusy(form, true);
      await saveRecord("attendance", entry);
      form.reset();

      const gate = $("#pyramidGate");
      const thanks = $("#rsvpThanks");
      gate?.classList.add("is-open");
      if (thanks) {
        thanks.textContent =
          entry.attendance === "yes"
            ? `${entry.name}님, 함께해주셔서 감사합니다.`
            : `${entry.name}님, 보내주신 마음 오래 간직하겠습니다.`;
      }
      await renderAttendanceAdmin();
      showToast(hasRemoteStore() ? "참석 여부가 저장되었습니다." : "미리보기로 저장되었습니다.");
    } catch {
      showToast("참석 여부를 저장하지 못했습니다.");
    } finally {
      setBusy(form, false);
    }
  });
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function setupCsvExport() {
  const button = $("#exportCsv");
  if (!button) return;
  button.addEventListener("click", async () => {
    try {
      const entries = (await getRecords("attendance")).map(normalizeAttendance);
      const rows = [
        ATTENDANCE_EXPORT_FIELDS.map(([, label]) => csvEscape(label)).join(","),
        ...entries.map((entry) =>
          ATTENDANCE_EXPORT_FIELDS.map(([key]) => {
            if (key === "side") return csvEscape(SIDE_LABELS[entry.side] || entry.side);
            if (key === "attendance") return csvEscape(ATTENDANCE_LABELS[entry.attendance] || entry.attendance);
            if (key === "mealAttendance") return csvEscape(MEAL_ATTENDANCE_LABELS[entry.mealAttendance] || entry.mealAttendance);
            if (key === "dietary") return csvEscape(DIETARY_LABELS[entry.dietary] || entry.dietary);
            return csvEscape(entry[key]);
          }).join(",")
        ),
      ];
      const blob = new Blob([`\ufeff${rows.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "wedding-attendance.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("CSV 파일을 만들었습니다.");
    } catch {
      showToast("CSV 파일을 만들지 못했습니다.");
    }
  });
}

function normalizeGuestbook(entry, index = 0) {
  return {
    createdAt: entry.createdAt || "",
    name: entry.name || "-",
    message: entry.message || "",
    x: Number.isFinite(Number(entry.x)) ? Number(entry.x) : 12 + ((index * 23) % 76),
    y: Number.isFinite(Number(entry.y)) ? Number(entry.y) : 14 + ((index * 31) % 52),
  };
}

async function renderStars() {
  const sky = $("#starSky");
  const message = $("#starMessage");
  if (!sky) return;

  let guestEntries = [];
  try {
    guestEntries = await getRecords("guestbook");
  } catch {
    showToast("방명록을 불러오지 못했습니다.");
  }

  const stars = [
    ...DEFAULT_STARS,
    ...guestEntries.map((entry, index) => normalizeGuestbook(entry, index + DEFAULT_STARS.length)),
  ];
  sky.innerHTML = "";
  stars.forEach((star, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "star";
    button.style.left = `${star.x}%`;
    button.style.top = `${star.y}%`;
    button.setAttribute("aria-label", `${star.name}님의 축하 메시지`);
    button.addEventListener("click", () => {
      if (message) message.textContent = `${star.name}: ${star.message}`;
    });
    button.style.animationDelay = `${(index % 5) * 140}ms`;
    sky.appendChild(button);
  });
}

function renderGuestbookAdmin(entries = []) {
  const body = $("#guestbookTableBody");
  const empty = $("#guestbookEmpty");
  if (!body) return;

  const normalized = sortedByCreatedAt(entries.map(normalizeGuestbook));
  body.innerHTML = "";
  empty?.classList.toggle("is-visible", normalized.length === 0);

  normalized.forEach((entry) => {
    const row = document.createElement("tr");
    [formatRsvpDate(entry.createdAt), entry.name, entry.message].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
}

async function renderGuestbookAdminFromStore() {
  if (!$("#guestbookTableBody")) return;
  try {
    const entries = await getRecords("guestbook");
    renderGuestbookAdmin(entries);
  } catch {
    showToast("방명록 데이터를 불러오지 못했습니다.");
  }
}

function setupGuestbook() {
  const form = $("#guestbookForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const entries = getLocalRecords("guestbook");
    const index = entries.length + DEFAULT_STARS.length;
    const entry = {
      id: window.crypto?.randomUUID?.() || String(Date.now()),
      createdAt: new Date().toISOString(),
      name: String(formData.get("guestName") || "").trim(),
      message: String(formData.get("guestMessage") || "").trim(),
      x: 12 + ((index * 23) % 76),
      y: 14 + ((index * 31) % 52),
    };

    if (!entry.name || !entry.message) return;

    try {
      setBusy(form, true);
      await saveRecord("guestbook", entry);
      form.reset();
      await renderStars();
      await renderGuestbookAdminFromStore();
      showToast(hasRemoteStore() ? "별이 밤하늘에 남았습니다." : "미리보기 별이 남았습니다.");
    } catch {
      showToast("방명록을 저장하지 못했습니다.");
    } finally {
      setBusy(form, false);
    }
  });
}

async function init() {
  setupStorageNotices();
  setupLanguageTabs();
  setupCalendarDownload();
  setupShare();
  setupCopyButtons();
  setupQr();
  setupMusic();
  setupScarabs();
  setupRsvp();
  setupCsvExport();
  setupGuestbook();
  await Promise.allSettled([renderAttendanceAdmin(), renderStars(), renderGuestbookAdminFromStore()]);
}

init();
