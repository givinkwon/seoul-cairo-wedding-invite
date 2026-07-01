const EVENT = {
  title: "민준과 라일라의 결혼식",
  couple: "민준 · 라일라",
  startLocal: "20261024T123000",
  endLocal: "20261024T143000",
  location: "서울 라움아트센터 그레이스홀, 서울 강남구 언주로 564",
  description: "서울에서 카이로까지, 우리의 오아시스",
};

const STORAGE = {
  rsvps: "oasisWedding.rsvps",
  guestbook: "oasisWedding.guestbook",
  scarabs: "oasisWedding.scarabs",
};

const EPISODES = {
  seoul: {
    title: "서울의 첫 인사",
    text: "작은 카페에서 시작된 대화가 두 사람의 매일을 바꾸었습니다.",
  },
  cairo: {
    title: "카이로로 이어진 마음",
    text: "다른 시간대에 있어도 같은 노래를 들으며 하루의 끝을 나누었습니다.",
  },
  proposal: {
    title: "사막의 별빛",
    text: "별이 유난히 선명했던 밤, 오래 함께 걷자는 약속을 건넸습니다.",
  },
  wedding: {
    title: "우리의 오아시스",
    text: "두 가족과 두 문화가 만나 가장 따뜻한 시작을 준비합니다.",
  },
  travel: {
    title: "서울에서 카이로까지",
    text: "멀리서 오는 마음을 생각해 지도와 안내를 하객별로 나누었습니다.",
  },
};

const DEFAULT_STARS = [
  { name: "가족", message: "서로를 존중하며 다정하게 살아가길 축복합니다.", x: 18, y: 28 },
  { name: "친구", message: "두 사람의 긴 여정이 가장 따뜻한 집이 되기를.", x: 38, y: 18 },
  { name: "동료", message: "서울과 카이로를 잇는 멋진 시작을 응원합니다.", x: 72, y: 30 },
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

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

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
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

function setupGuideTabs() {
  const buttons = $$(".guide-tab");
  const panels = $$(".guide-panel");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const guide = button.dataset.guide;
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.guidePanel === guide));
    });
  });
}

function createIcs() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Our Oasis Wedding//Mobile Invitation//KO",
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
    link.download = "minjun-laila-wedding.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("일정 파일을 만들었습니다.");
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
  return window.location.href.split("#")[0];
}

function setupShare() {
  const shareButton = $("#shareButton");
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

  shareButton?.addEventListener("click", share);
  copyUrl?.addEventListener("click", async () => {
    try {
      await copyText(getShareUrl());
      showToast("URL을 복사했습니다.");
    } catch {
      showToast("URL 복사 권한을 확인해주세요.");
    }
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
  let found = new Set(readJson(STORAGE.scarabs, []));

  function render() {
    tokens.forEach((token) => token.classList.toggle("is-found", found.has(token.dataset.episode)));
    if (count) count.textContent = `${found.size}/${tokens.length}`;
    if (!list) return;

    const items = [...found].map((key) => EPISODES[key]).filter(Boolean);
    if (items.length === 0) {
      list.innerHTML = '<div class="episode-item"><strong>아직 발견 전</strong>첫 번째 상징을 찾으면 이야기가 열립니다.</div>';
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
    showToast("스카라브 기록을 초기화했습니다.");
  });

  render();
}

function getRsvps() {
  return readJson(STORAGE.rsvps, []);
}

function saveRsvp(entry) {
  const entries = getRsvps();
  entries.push(entry);
  writeJson(STORAGE.rsvps, entries);
  return entries;
}

function renderStats() {
  const grid = $("#statsGrid");
  if (!grid) return;

  const entries = getRsvps();
  const attending = entries.filter((entry) => entry.attendance === "yes");
  const absent = entries.filter((entry) => entry.attendance === "no");
  const companions = attending.reduce((sum, entry) => sum + Number(entry.companions || 0), 0);
  const meals = attending.reduce((acc, entry) => {
    acc[entry.meal] = (acc[entry.meal] || 0) + 1 + Number(entry.companions || 0);
    return acc;
  }, {});

  const stats = [
    { label: "총 응답", value: entries.length },
    { label: "참석", value: attending.length },
    { label: "불참", value: absent.length },
    { label: "동행 포함", value: attending.length + companions },
    { label: "할랄 식사", value: meals.halal || 0 },
    { label: "채식", value: meals.vegetarian || 0 },
  ];

  grid.innerHTML = stats
    .map((item) => `<div class="stat-card"><strong>${item.value}</strong><span>${item.label}</span></div>`)
    .join("");
}

function setupRsvp() {
  const form = $("#rsvpForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      name: String(formData.get("name") || "").trim(),
      attendance: String(formData.get("attendance") || ""),
      companions: String(formData.get("companions") || "0"),
      meal: String(formData.get("meal") || "regular"),
      message: String(formData.get("message") || "").trim(),
    };

    if (!entry.name || !entry.attendance) return;

    saveRsvp(entry);
    renderStats();
    form.reset();

    const gate = $("#pyramidGate");
    const thanks = $("#rsvpThanks");
    gate?.classList.add("is-open");
    if (thanks) {
      thanks.textContent =
        entry.attendance === "yes"
          ? `${entry.name}님, 우리의 여정에 함께해주셔서 감사합니다.`
          : `${entry.name}님, 보내주신 마음 오래 간직하겠습니다.`;
    }
    showToast("RSVP가 저장되었습니다.");
  });
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function setupCsvExport() {
  const button = $("#exportCsv");
  if (!button) return;
  button.addEventListener("click", () => {
    const entries = getRsvps();
    const header = ["createdAt", "name", "attendance", "companions", "meal", "message"];
    const rows = [
      header.join(","),
      ...entries.map((entry) => header.map((key) => csvEscape(entry[key])).join(",")),
    ];
    const blob = new Blob([`\ufeff${rows.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wedding-rsvp.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("CSV 파일을 만들었습니다.");
  });
}

function getGuestbook() {
  return readJson(STORAGE.guestbook, []);
}

function renderStars() {
  const sky = $("#starSky");
  const message = $("#starMessage");
  if (!sky) return;

  const stars = [...DEFAULT_STARS, ...getGuestbook()];
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

function setupGuestbook() {
  const form = $("#guestbookForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const entries = getGuestbook();
    const index = entries.length + DEFAULT_STARS.length;
    const x = 12 + ((index * 23) % 76);
    const y = 14 + ((index * 31) % 52);
    const entry = {
      name: String(formData.get("guestName") || "").trim(),
      message: String(formData.get("guestMessage") || "").trim(),
      x,
      y,
    };

    if (!entry.name || !entry.message) return;

    entries.push(entry);
    writeJson(STORAGE.guestbook, entries);
    form.reset();
    renderStars();
    showToast("별이 밤하늘에 남았습니다.");
  });

  renderStars();
}

function init() {
  setupLanguageTabs();
  setupGuideTabs();
  setupCalendarDownload();
  setupShare();
  setupQr();
  setupMusic();
  setupScarabs();
  setupRsvp();
  setupCsvExport();
  setupGuestbook();
  renderStats();
}

init();
