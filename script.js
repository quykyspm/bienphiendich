/* ==========================================================================
   HỆ THỐNG BIÊN PHIÊN DỊCH STUDIO BY QUYKY (NÂNG CẤP TOÀN DIỆN)
   ========================================================================== */

/* ================= TIỆN ÍCH AN TOÀN (STORAGE, TOAST, CLIPBOARD) ================= */
function safeGetStorage(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Bỏ qua nếu trình duyệt chặn localStorage trong iframe
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const item = document.createElement("div");
  item.className = `toast-item ${type}`;
  item.innerText = message;
  container.appendChild(item);
  setTimeout(() => {
    item.style.opacity = "0";
    item.style.transition = "opacity 0.25s ease";
    setTimeout(() => item.remove(), 260);
  }, 3000);
}

function copyTextToClipboard(text, successMsg = "📋 Đã sao chép vào bộ nhớ tạm!") {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, "success");
    }).catch(() => fallbackCopyText(text, successMsg));
  } else {
    fallbackCopyText(text, successMsg);
  }
}

function fallbackCopyText(text, successMsg) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
    showToast(successMsg, "success");
  } catch (e) {
    showToast("Không thể sao chép tự động", "warning");
  }
  document.body.removeChild(ta);
}

function stripPinyinTones(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ü/g, "v")
    .toLowerCase()
    .trim();
}

function insertAtCursor(textareaId, textToInsert) {
  const area = document.getElementById(textareaId);
  if (!area) return;
  const start = area.selectionStart || 0;
  const end = area.selectionEnd || 0;
  const val = area.value;
  area.value = val.substring(0, start) + textToInsert + val.substring(end);
  area.focus();
  const nextPos = (textToInsert === "“”" || textToInsert === "《》") ? start + 1 : start + textToInsert.length;
  area.setSelectionRange(nextPos, nextPos);
  if (textareaId === "aiUserInput") onTransInputChanged();
  if (textareaId === "interpretUserTranscript" && typeof onInterTranscriptChanged === "function") {
    onInterTranscriptChanged();
  }
}

/* ================= GIAO DIỆN SÁNG / TỐI (DARK MODE) ================= */
function initTheme() {
  const saved = safeGetStorage("quyky_theme", "light");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerText = "☀️ Sáng";
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const nextTheme = isDark ? "light" : "dark";
  if (nextTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  safeSetStorage("quyky_theme", nextTheme);
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.innerText = nextTheme === "dark" ? "☀️ Sáng" : "🌙 Tối";
}

/* ================= XỬ LÝ MENU TỔNG ĐIỀU HƯỚNG MÔN HỌC ================= */
function toggleMenuPopup(event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const dropdown = document.getElementById("menuDropdownBox");
  if (dropdown) dropdown.classList.toggle("show");
}

window.addEventListener("click", () => {
  const dropdown = document.getElementById("menuDropdownBox");
  if (dropdown && dropdown.classList.contains("show")) {
    dropdown.classList.remove("show");
  }
});

window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openDictionaryModal();
  } else if (e.key === "Escape") {
    closeDictionaryModal();
  }
});

function switchSubject(subjectKey, displayName, clickedEl) {
  stopTransAudio();
  const label = document.getElementById("currentActiveTabLabel");
  if (label) label.innerText = displayName;

  document.querySelectorAll(".menu-nav-option").forEach(opt => opt.classList.remove("active"));
  const menuOpt = document.getElementById(subjectKey === "biendich" ? "menuOptBiendich" : "menuOptPhiendich");
  if (menuOpt) menuOpt.classList.add("active");

  document.querySelectorAll(".quick-subject-btn").forEach(btn => btn.classList.remove("active"));
  const quickBtn = document.getElementById(subjectKey === "biendich" ? "quickBtnBiendich" : "quickBtnPhiendich");
  if (quickBtn) quickBtn.classList.add("active");

  if (clickedEl && clickedEl.classList && clickedEl.classList.contains("menu-nav-option")) {
    clickedEl.classList.add("active");
  }

  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
  const activeTabEl = document.getElementById(`tab-${subjectKey}`);
  if (activeTabEl) activeTabEl.classList.add("active");

  const dropdown = document.getElementById("menuDropdownBox");
  if (dropdown) dropdown.classList.remove("show");

  if (subjectKey === "biendich") {
    switchBiendichSubTab("trans");
  } else if (subjectKey === "phiendich") {
    switchPhiendichSubTab("cabin");
    if (typeof loadCurrentInterExercise === "function" && typeof pdDB !== "undefined" && pdDB) {
      loadCurrentInterExercise();
    }
  }
}

function switchBiendichSubTab(tab) {
  stopTransAudio();
  const transBox = document.getElementById("biendichSubTrans");
  const writeBox = document.getElementById("biendichSubWrite");
  const fcBox = document.getElementById("biendichSubFlashcard");

  if (transBox) transBox.style.display = (tab === "trans") ? "block" : "none";
  if (writeBox) writeBox.style.display = (tab === "write") ? "block" : "none";
  if (fcBox) fcBox.style.display = (tab === "flashcard") ? "block" : "none";

  const btnTrans = document.getElementById("btnBiendichTrans");
  const btnWrite = document.getElementById("btnBiendichWrite");
  const btnFc = document.getElementById("btnBiendichFlashcard");

  if (btnTrans) btnTrans.classList.toggle("active", tab === "trans");
  if (btnWrite) btnWrite.classList.toggle("active", tab === "write");
  if (btnFc) btnFc.classList.toggle("active", tab === "flashcard");

  if (tab === "write" && activeWords.length === 0) {
    applyFilters();
  } else if (tab === "flashcard") {
    initFlashcardDeck();
  }
}

function switchPhiendichSubTab(tab) {
  stopTransAudio();
  const isCabin = (tab === "cabin");
  const cabinEl = document.getElementById("phiendichSubCabin");
  const listenEl = document.getElementById("phiendichSubListen");
  if (cabinEl) cabinEl.style.display = isCabin ? "block" : "none";
  if (listenEl) listenEl.style.display = isCabin ? "none" : "block";

  const btnCabin = document.getElementById("btnPhiendichCabin");
  const btnListen = document.getElementById("btnPhiendichListen");
  if (btnCabin) btnCabin.classList.toggle("active", isCabin);
  if (btnListen) btnListen.classList.toggle("active", !isCabin);

  if (!isCabin && !currentListenWord) {
    setupListenQuestion();
  }
}

/* ================= BỘ GIỌNG ĐỌC THUẦN TIẾNG TRUNG (NATIVE CHINESE TTS) ================= */
let availableVoices = [];
let isTransPassageSpeaking = false;

function initVoiceList() {
  if (!window.speechSynthesis) return;
  availableVoices = window.speechSynthesis.getVoices() || [];
  populateChineseVoiceDropdown();
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = initVoiceList;
  setTimeout(initVoiceList, 300);
}

// Tự động nạp các giọng thuần Tiếng Trung có sẵn trên thiết bị vào menu chọn giọng
function populateChineseVoiceDropdown() {
  const select = document.getElementById("selectVoiceType");
  if (!select) return;
  const currentVal = select.value || "zh_cn_auto";

  const baseOptions = [
    { value: "zh_cn_auto", label: "🇨🇳 Phổ thông chuẩn Bắc Kinh (普通话 zh-CN - Tự động tối ưu)" },
    { value: "zh_cn_female", label: "🇨🇳 Giọng Nữ Phổ thông (普通话女声 - Xiaoxiao / Tingting)" },
    { value: "zh_cn_male", label: "🇨🇳 Giọng Nam Phát thanh viên (普通话男声 - Yunxi / Yunyang)" },
    { value: "zh_tw", label: "🇹🇼 Quốc ngữ Đài Loan (国语 zh-TW - HsiaoChen / Meijia)" },
    { value: "zh_hk", label: "🇭🇰 Tiếng Quảng Đông / HK (粤语 zh-HK - HiuMaan / Sinji)" }
  ];

  // Tìm các giọng zh-* thực tế có trên máy người dùng
  const zhVoices = availableVoices.filter(v => {
    const l = (v.lang || "").toLowerCase().replace("_", "-");
    return l.startsWith("zh") || l.startsWith("cmn") || l.startsWith("yue");
  });

  select.innerHTML = "";
  baseOptions.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.innerText = opt.label;
    select.appendChild(o);
  });

  if (zhVoices.length > 0) {
    const group = document.createElement("optgroup");
    group.label = "── Giọng Tiếng Trung cài sẵn trên thiết bị của bạn ──";
    zhVoices.forEach(v => {
      const o = document.createElement("option");
      o.value = "native:" + v.name;
      o.innerText = `🎙️ ${v.name} (${v.lang})`;
      group.appendChild(o);
    });
    select.appendChild(group);
  }

  if (Array.from(select.options).some(o => o.value === currentVal)) {
    select.value = currentVal;
  }
}

// Chọn giọng Tiếng Trung phù hợp nhất theo cấu hình người dùng chọn
function resolveChineseVoice(lang = "zh-CN") {
  if (availableVoices.length === 0 && window.speechSynthesis) {
    availableVoices = window.speechSynthesis.getVoices() || [];
  }
  const prefix = lang.split("-")[0].toLowerCase();
  if (prefix !== "zh") {
    return (
      availableVoices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith(prefix) && (v.name.includes("Natural") || v.name.includes("Neural"))) ||
      availableVoices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith(prefix)) ||
      null
    );
  }

  const select = document.getElementById("selectVoiceType");
  const mode = select ? select.value : "zh_cn_auto";

  const zhVoices = availableVoices.filter(v => {
    const l = (v.lang || "").toLowerCase().replace("_", "-");
    return l.startsWith("zh") || l.startsWith("cmn") || l.startsWith("yue");
  });

  if (mode && mode.startsWith("native:")) {
    const targetName = mode.slice(7);
    const exact = zhVoices.find(v => v.name === targetName);
    if (exact) return { voice: exact, pitch: 1.0, lang: exact.lang || "zh-CN" };
  }

  if (mode === "zh_tw") {
    const tw = zhVoices.find(v => v.lang.toLowerCase().replace("_", "-").includes("tw") || /hsiao|meijia|taiwan/i.test(v.name));
    return { voice: tw || zhVoices[0] || null, pitch: 1.02, lang: "zh-TW" };
  }

  if (mode === "zh_hk") {
    const hk = zhVoices.find(v => v.lang.toLowerCase().replace("_", "-").includes("hk") || /hiu|sinji|cantonese|hong kong/i.test(v.name));
    return { voice: hk || zhVoices[0] || null, pitch: 1.0, lang: "zh-HK" };
  }

  const cnVoices = zhVoices.filter(v => {
    const l = (v.lang || "").toLowerCase().replace("_", "-");
    return l.includes("cn") || l.includes("hans") || (!l.includes("tw") && !l.includes("hk"));
  });
  const pool = cnVoices.length > 0 ? cnVoices : zhVoices;

  if (mode === "zh_cn_male") {
    const maleVoice =
      pool.find(v => /yunxi|yunjian|yunyang|kangkang|male|nan/i.test(v.name)) ||
      pool.find(v => v.name.includes("Natural") || v.name.includes("Neural")) ||
      pool[0];
    return { voice: maleVoice || null, pitch: 0.88, lang: "zh-CN" };
  }

  if (mode === "zh_cn_female") {
    const femaleVoice =
      pool.find(v => /xiaoxiao|xiaoyi|tingting|huihui|yaoyao|female|google/i.test(v.name)) ||
      pool.find(v => v.name.includes("Natural") || v.name.includes("Neural")) ||
      pool[0];
    return { voice: femaleVoice || null, pitch: 1.06, lang: "zh-CN" };
  }

  // Mặc định zh_cn_auto: Ưu tiên giọng Neural / Natural / Google 普通话
  const bestCn =
    pool.find(v => /xiaoxiao|yunxi|natural|neural/i.test(v.name)) ||
    pool.find(v => /google|tingting|microsoft/i.test(v.name)) ||
    pool[0];
  return { voice: bestCn || null, pitch: 0.98, lang: "zh-CN" };
}

function playDiplomaticSpeech(text, lang = "zh-CN", rate = 0.92, onEndCallback = null) {
  if (!window.speechSynthesis) {
    showToast("Trình duyệt không hỗ trợ phát âm Web Speech!", "warning");
    return;
  }
  window.speechSynthesis.cancel();
  const cleanText = String(text).replace(/…+/g, " ").replace(/\.{2,}/g, " ");
  const u = new SpeechSynthesisUtterance(cleanText);
  u.rate = rate;

  if (lang.toLowerCase().startsWith("zh")) {
    const resolved = resolveChineseVoice(lang);
    u.lang = resolved.lang || "zh-CN";
    u.pitch = resolved.pitch || 0.98;
    if (resolved.voice) u.voice = resolved.voice;
  } else {
    u.lang = lang;
    u.pitch = 0.98;
    const matched = resolveChineseVoice(lang);
    if (matched) u.voice = matched;
  }

  u.onend = () => {
    isTransPassageSpeaking = false;
    updateTransSpeakBtnUI();
    if (typeof onEndCallback === "function") onEndCallback();
  };
  u.onerror = () => {
    isTransPassageSpeaking = false;
    updateTransSpeakBtnUI();
  };

  window.speechSynthesis.speak(u);
}

function previewSelectedChineseVoice() {
  playDiplomaticSpeech("尊敬的各位来宾，欢迎大家出席本次中越合作交流活动。", "zh-CN", selectedInterRate || 1.0);
  showToast("🔊 Đang phát thử giọng Tiếng Trung đã chọn", "info");
}

function stopTransAudio() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (typeof stopAllAudio === "function") {
    stopAllAudio();
  }
  isTransPassageSpeaking = false;
  updateTransSpeakBtnUI();
}

function updateTransSpeakBtnUI() {
  const btn = document.getElementById("btnSpeakTransPassage");
  if (!btn) return;
  if (isTransPassageSpeaking) {
    btn.innerText = "⏸️ Đang đọc đề... (Bấm dừng)";
  } else {
    btn.innerText = "🔊 Nghe đọc đề bài";
  }
}

/* ================= KẾT NỐI VERCEL PROXY ================= */
const VERCEL_API_URL = "https://gemini-api-backend-rho.vercel.app/api/gemini";

async function callGemini(promptText) {
  const res = await fetch(VERCEL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: promptText })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

function formatAIEvaluationHTML(rawText, titleLabel = "Kết quả Thẩm định AI") {
  const scoreMatch = String(rawText).match(/(\d+(?:[.,]\d+)?)\s*\/\s*10/);
  const scoreBadge = scoreMatch ? `🎯 Điểm: ${scoreMatch[1]}/10` : "⚖️ Đã thẩm định";

  const escaped = String(rawText)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");

  return `
    <div class="eval-score-header">
      <strong style="font-size: 15px; color: var(--success-text);">✨ ${titleLabel}</strong>
      <span class="score-circle-badge">${scoreBadge}</span>
    </div>
    <div class="eval-formatted-body">${escaped}</div>
  `;
}

/* ================= DỮ LIỆU TỪ VỰNG TỔNG HỢP (BIÊN DỊCH + PHIÊN DỊCH) ================= */
let bdWords = [];
let pdWords = [];
let allCombinedWords = [];
let allPatternsList = [];
let allWords = [];
let activeWords = [];
let currentIndex = 0;
let canvasInstances = [];
const memorizedWords = new Map();
const needReviewWords = new Map();

function loadSavedVocabProgress() {
  const savedMem = safeGetStorage("quyky_memorized_words", []);
  const savedRev = safeGetStorage("quyky_review_words", []);
  savedMem.forEach(w => { if (w && w.hanzi) memorizedWords.set(w.hanzi, w); });
  savedRev.forEach(w => { if (w && w.hanzi && !memorizedWords.has(w.hanzi)) needReviewWords.set(w.hanzi, w); });
}

function saveVocabProgressToStorage() {
  safeSetStorage("quyky_memorized_words", Array.from(memorizedWords.values()));
  safeSetStorage("quyky_review_words", Array.from(needReviewWords.values()));
  updateGlobalStatsBadges();
}

function updateGlobalStatsBadges() {
  const memBadge = document.getElementById("globalMemorizedBadge");
  const revBadge = document.getElementById("globalReviewBadge");
  if (memBadge) memBadge.innerText = `✅ Đã thuộc: ${memorizedWords.size} từ`;
  if (revBadge) revBadge.innerText = `📌 Chưa nhớ: ${needReviewWords.size} từ`;
}

function resetSavedVocabStats() {
  memorizedWords.clear();
  needReviewWords.clear();
  saveVocabProgressToStorage();
  renderStats();
  showToast("Đã đặt lại danh sách từ Đã thuộc & Chưa nhớ", "info");
}

function practiceNeedReviewWords() {
  if (needReviewWords.size === 0) {
    showToast("Chưa có từ nào trong danh sách Chưa nhớ (Cần ôn)!", "info");
    return;
  }
  const srcSelect = document.getElementById("sourceCurriculumFilter");
  if (srcSelect) srcSelect.value = "review_only";
  applyFilters();
  showToast(`Đang ôn tập ${needReviewWords.size} từ Chưa nhớ!`, "info");
}

function shuffleWords(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function loadJSONResource(url, embeddedGlobal) {
  if (embeddedGlobal) {
    return Promise.resolve(embeddedGlobal);
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url + "?t=" + Date.now(), true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error("HTTP " + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error("Lỗi mạng khi tải " + url));
    xhr.send();
  });
}

async function autoLoadExcel() {
  loadSavedVocabProgress();
  try {
    const dataBD = await loadJSONResource("curriculum_db.json", window.EMBEDDED_CURRICULUM_DB);
    const dataPD = await loadJSONResource("curriculum_pd.json", window.EMBEDDED_CURRICULUM_PD).catch(() => null);

    bdWords = [];
    pdWords = [];
    allPatternsList = [];

    if (dataBD && dataBD.translation) {
      Object.keys(dataBD.translation).forEach(k => {
        const lesson = dataBD.translation[k];
        const lessonNum = lesson.lessonNumber || parseInt(k.replace("bai", ""), 10) || 1;
        (lesson.texts || []).forEach(txt => {
          (txt.vocabulary || []).forEach(v => {
            bdWords.push({
              hanzi: v.zh,
              pinyin: v.pinyin,
              vn: v.vi,
              lesson: `Bài ${lessonNum}`,
              lessonKey: k,
              subject: "Biên Dịch"
            });
          });
          (txt.patterns || []).forEach(p => {
            allPatternsList.push({
              structure: p.structure,
              meaning: p.meaning,
              lesson: `Biên Dịch - Bài ${lessonNum}`,
              lessonKey: k,
              subject: "Biên Dịch"
            });
          });
        });
      });
    }

    if (dataPD) {
      Object.keys(dataPD).forEach(k => {
        const lesson = dataPD[k];
        const lessonNum = lesson.lessonNumber || parseInt(k.replace("bai", ""), 10) || 1;
        (lesson.texts || []).forEach(txt => {
          (txt.vocabulary || []).forEach(v => {
            pdWords.push({
              hanzi: v.zh,
              pinyin: v.pinyin,
              vn: v.vi,
              lesson: `Bài ${lessonNum}`,
              lessonKey: k,
              subject: "Phiên Dịch"
            });
          });
          (txt.patterns || []).forEach(p => {
            allPatternsList.push({
              structure: p.structure,
              meaning: p.meaning,
              lesson: `Phiên Dịch - Bài ${lessonNum}`,
              lessonKey: k,
              subject: "Phiên Dịch"
            });
          });
        });
      });
    }

    allCombinedWords = [...bdWords, ...pdWords];
    allWords = [...bdWords];

    setupLessonDropdown();
    applyFilters();
    renderStats();
    updateGlobalStatsBadges();
  } catch (e) {
    const pVn = document.getElementById("prompt-vn");
    if (pVn) pVn.innerText = "Lỗi: Không tìm thấy dữ liệu giáo trình";
  }
}

function getWordsBySourceCode(sourceCode) {
  if (sourceCode === "bd") return [...bdWords];
  if (sourceCode === "pd") return [...pdWords];
  if (sourceCode === "review_only") return Array.from(needReviewWords.values());
  return [...allCombinedWords];
}

function onChangeWriteCurriculumSource() {
  const srcSelect = document.getElementById("sourceCurriculumFilter");
  const code = srcSelect ? srcSelect.value : "bd";
  allWords = getWordsBySourceCode(code);
  setupLessonDropdown();
  applyFilters();
}

function setupLessonDropdown() {
  const lessons = [...new Set(allCombinedWords.map(w => w.lesson).filter(Boolean))];
  const s1 = document.getElementById("lessonFilter");
  const s3 = document.getElementById("listenLessonFilter");
  const s4 = document.getElementById("fcLessonFilter");

  const optionAll = '<option value="all">Tất cả các bài (1-12)</option>';
  if (s1) s1.innerHTML = optionAll;
  if (s3) s3.innerHTML = optionAll;
  if (s4) s4.innerHTML = optionAll;

  lessons.forEach(l => {
    const opt = `<option value="${l}">${l}</option>`;
    if (s1) s1.innerHTML += opt;
    if (s3) s3.innerHTML += opt;
    if (s4) s4.innerHTML += opt;
  });
}

/* ================= PHÂN HỆ LUYỆN VIẾT CHỮ HÁN (Ô MỄ 米字格) ================= */
function applyFilters() {
  const srcEl = document.getElementById("sourceCurriculumFilter");
  const lEl = document.getElementById("lessonFilter");
  const mEl = document.getElementById("modeFilter");
  const limEl = document.getElementById("limitFilter");

  const srcCode = srcEl ? srcEl.value : "bd";
  const l = lEl ? lEl.value : "all";
  const m = mEl ? mEl.value : "random";
  const lim = limEl ? limEl.value : "all";

  let basePool = getWordsBySourceCode(srcCode);
  let list = (l === "all") ? [...basePool] : basePool.filter(w => String(w.lesson) === l);

  if (m === "random") {
    list = shuffleWords(list);
  }

  if (lim !== "all") {
    list = list.slice(0, parseInt(lim, 10));
  }

  activeWords = list;
  currentIndex = 0;

  if (activeWords.length > 0) {
    loadWord(0);
  } else {
    document.getElementById("prompt-vn").innerText = "Không có từ vựng phù hợp trong bộ lọc này!";
    document.getElementById("boxesContainer").innerHTML = "";
    updateWriteProgressUI();
  }
}

function updateWriteProgressUI() {
  const counterEl = document.getElementById("writeProgressCounter");
  const fillEl = document.getElementById("writeProgressBarFill");
  if (!activeWords || activeWords.length === 0) {
    if (counterEl) counterEl.innerText = "0 / 0 từ";
    if (fillEl) fillEl.style.width = "0%";
    return;
  }
  const pos = Math.min(currentIndex + 1, activeWords.length);
  if (counterEl) counterEl.innerText = `Từ ${pos} / ${activeWords.length}`;
  if (fillEl) fillEl.style.width = `${Math.round((pos / activeWords.length) * 100)}%`;
}

function loadWord(idx) {
  if (activeWords.length === 0) return;
  const item = activeWords[idx];
  const subjectPrefix = item.subject ? `${item.subject} • ` : "";
  document.getElementById("prompt-vn").innerText = `[${subjectPrefix}${item.lesson || ""}] Viết: "${item.vn || ""}"`;
  document.getElementById("prompt-pinyin").innerText = `[ ${item.pinyin || ""} ]`;
  document.getElementById("prompt-pinyin").style.display = "none";
  document.getElementById("result-msg").innerText = "";
  updateWriteProgressUI();
  setupCanvas(String(item.hanzi).trim());
}

function speakCurrentWriteWord() {
  if (activeWords.length === 0 || !activeWords[currentIndex]) return;
  playDiplomaticSpeech(activeWords[currentIndex].hanzi, "zh-CN", 0.85);
}

function togglePinyin() {
  const p = document.getElementById("prompt-pinyin");
  if (p) p.style.display = p.style.display === "none" ? "inline" : "none";
}

function toggleAllGhostChars() {
  const overlays = document.querySelectorAll("#boxesContainer .ghost-char-overlay");
  if (overlays.length === 0) return;
  const anyHidden = Array.from(overlays).some(el => !el.classList.contains("visible"));
  overlays.forEach(el => el.classList.toggle("visible", anyHidden));
}

function isHanziChar(ch) {
  return /[\u4e00-\u9fff]/.test(ch);
}

function setupCanvas(word) {
  const container = document.getElementById("boxesContainer");
  container.innerHTML = "";
  canvasInstances = [];

  let hanziBoxIndex = 0;
  let i = 0;
  while (i < word.length) {
    const ch = word[i];
    if (!isHanziChar(ch)) {
      let staticRun = ch;
      while (i + 1 < word.length && !isHanziChar(word[i + 1])) {
        i++;
        staticRun += word[i];
      }
      const staticTile = document.createElement("div");
      staticTile.className = "static-char-tile";
      staticTile.title = "Ký tự cố định (không cần viết)";
      staticTile.innerText = staticRun;
      container.appendChild(staticTile);
      i++;
      continue;
    }

    const myIdx = hanziBoxIndex;
    hanziBoxIndex++;

    const wrap = document.createElement("div");
    wrap.className = "box-wrapper";

    const cBox = document.createElement("div");
    cBox.className = "canvas-container";

    const ghost = document.createElement("div");
    ghost.className = "ghost-char-overlay";
    ghost.innerText = ch;

    const cv = document.createElement("canvas");
    cv.width = 180;
    cv.height = 180;

    cBox.appendChild(ghost);
    cBox.appendChild(cv);

    const miniControls = document.createElement("div");
    miniControls.className = "box-mini-controls";

    const btnClear = document.createElement("button");
    btnClear.className = "btn-clear-single";
    btnClear.innerText = `Xóa ô ${myIdx + 1}`;
    btnClear.onclick = () => clearBox(myIdx);

    const btnUndo = document.createElement("button");
    btnUndo.className = "btn-clear-single";
    btnUndo.title = "Hoàn tác nét vừa viết";
    btnUndo.innerText = "↩️ Nét";
    btnUndo.onclick = () => undoBoxStroke(myIdx);

    const btnGhost = document.createElement("button");
    btnGhost.className = "btn-clear-single";
    btnGhost.title = "Hiện chữ mờ mẫu để đồ theo";
    btnGhost.innerText = "👁 Mẫu";
    btnGhost.onclick = () => ghost.classList.toggle("visible");

    miniControls.appendChild(btnClear);
    miniControls.appendChild(btnUndo);
    miniControls.appendChild(btnGhost);

    wrap.appendChild(cBox);
    wrap.appendChild(miniControls);
    container.appendChild(wrap);

    const ctx = cv.getContext("2d");
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";

    const st = { char: ch, cv, ctx, cBox, ghost, strokes: [], sx: [], sy: [], st: [], drawing: false, t0: 0 };
    initCanvasEvents(st);
    canvasInstances.push(st);
    i++;
  }
}

function redrawCanvasStrokes(st) {
  st.ctx.clearRect(0, 0, 180, 180);
  st.ctx.lineWidth = 6;
  st.ctx.lineCap = "round";
  st.ctx.lineJoin = "round";
  st.ctx.strokeStyle = "#1e293b";

  for (const stroke of st.strokes) {
    const xs = stroke[0];
    const ys = stroke[1];
    if (!xs || xs.length === 0) continue;
    st.ctx.beginPath();
    st.ctx.moveTo(xs[0], ys[0]);
    for (let k = 1; k < xs.length; k++) {
      st.ctx.lineTo(xs[k], ys[k]);
    }
    st.ctx.stroke();
  }
}

function undoBoxStroke(idx) {
  const s = canvasInstances[idx];
  if (!s || s.strokes.length === 0) return;
  s.strokes.pop();
  s.cBox.classList.remove("correct", "wrong");
  redrawCanvasStrokes(s);
}

function initCanvasEvents(st) {
  const getCoord = e => {
    const r = st.cv.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    return [Math.round(x - r.left), Math.round(y - r.top)];
  };
  const down = e => {
    st.drawing = true;
    st.t0 = Date.now();
    const [x, y] = getCoord(e);
    st.ctx.beginPath();
    st.ctx.moveTo(x, y);
    st.sx = [x];
    st.sy = [y];
    st.st = [0];
  };
  const move = e => {
    if (!st.drawing) return;
    e.preventDefault();
    const [x, y] = getCoord(e);
    st.ctx.lineTo(x, y);
    st.ctx.stroke();
    st.sx.push(x);
    st.sy.push(y);
    st.st.push(Date.now() - st.t0);
  };
  const up = () => {
    if (!st.drawing) return;
    st.drawing = false;
    st.strokes.push([st.sx, st.sy, st.st]);
  };
  st.cv.addEventListener("mousedown", down);
  st.cv.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  st.cv.addEventListener("touchstart", down, { passive: false });
  st.cv.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", up);
}

function clearBox(i) {
  const s = canvasInstances[i];
  if (!s) return;
  s.ctx.clearRect(0, 0, 180, 180);
  s.strokes = [];
  s.cBox.classList.remove("correct", "wrong");
}

function clearAllBoxes() {
  for (let i = 0; i < canvasInstances.length; i++) clearBox(i);
  document.getElementById("result-msg").innerText = "";
}

async function checkAllBoxes() {
  const msg = document.getElementById("result-msg");
  msg.innerText = "⏳ Đang nhận diện nét chữ...";
  let ok = true, empty = false;

  for (let s of canvasInstances) {
    if (s.strokes.length === 0) {
      s.cBox.classList.add("wrong");
      empty = true;
      ok = false;
      continue;
    }
    const p = {
      app_version: 0.4,
      api_level: "537.36",
      device: "5.0",
      input_type: "0",
      options: "enable_pre_space",
      requests: [{
        writing_guide: { writing_area_width: 180, writing_area_height: 180 },
        pre_context: "",
        max_num_results: 12,
        max_completions: 0,
        language: "zh-t-i0-handwrit",
        ink: s.strokes
      }]
    };
    try {
      const res = await fetch("https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p)
      });
      const d = await res.json();
      const cand = d[0] === "SUCCESS" ? d[1][0][1] : [];
      if (cand.includes(s.char)) {
        s.cBox.classList.remove("wrong");
        s.cBox.classList.add("correct");
      } else {
        s.cBox.classList.remove("correct");
        s.cBox.classList.add("wrong");
        s.ghost.classList.add("visible");
        ok = false;
      }
    } catch (e) {
      if (s.strokes.length >= 2) {
        s.cBox.classList.remove("wrong");
        s.cBox.classList.add("correct");
      } else {
        ok = false;
      }
    }
  }

  const cur = activeWords[currentIndex];
  if (empty) {
    msg.className = "msg-wrong";
    msg.innerText = "⚠️ Chưa viết đủ các ô chữ Hán!";
  } else if (ok) {
    msg.className = "msg-correct";
    msg.innerText = `🎉 Chính xác! ${cur.hanzi} [${cur.pinyin}] - ${cur.vn}`;
    playDiplomaticSpeech(cur.hanzi, "zh-CN", 0.9);
    memorizedWords.set(cur.hanzi, cur);
    needReviewWords.delete(cur.hanzi);
    saveVocabProgressToStorage();
  } else {
    msg.className = "msg-wrong";
    msg.innerText = `❌ Có chữ chưa đúng! Đã bật chữ mờ gợi ý (${cur.hanzi})`;
    if (!memorizedWords.has(cur.hanzi)) needReviewWords.set(cur.hanzi, cur);
    saveVocabProgressToStorage();
  }
  renderStats();
}

function renderStats() {
  const cL = document.getElementById("correct-list");
  if (cL) {
    cL.innerHTML = "";
    memorizedWords.forEach(w => {
      cL.innerHTML += `<div style="padding:4px 0; border-bottom:1px dashed var(--border); cursor:pointer;" onclick="playDiplomaticSpeech('${w.hanzi}', 'zh-CN')">🔊 <strong>${w.hanzi}</strong> <span style="color:var(--pinyin-color); font-size:12px;">[${w.pinyin || ""}]</span>: ${w.vn}</div>`;
    });
  }
  const cCnt = document.getElementById("correct-count");
  if (cCnt) cCnt.innerText = memorizedWords.size;

  const wL = document.getElementById("wrong-list");
  if (wL) {
    wL.innerHTML = "";
    needReviewWords.forEach(w => {
      wL.innerHTML += `<div style="padding:4px 0; border-bottom:1px dashed var(--border); cursor:pointer;" onclick="playDiplomaticSpeech('${w.hanzi}', 'zh-CN')">🔊 <strong>${w.hanzi}</strong> <span style="color:var(--pinyin-color); font-size:12px;">[${w.pinyin || ""}]</span>: ${w.vn}</div>`;
    });
  }
  const wCnt = document.getElementById("wrong-count");
  if (wCnt) wCnt.innerText = needReviewWords.size;
}

function nextWord() {
  if (activeWords.length === 0) return;
  currentIndex++;

  if (currentIndex >= activeWords.length) {
    showToast("🎉 Bạn đã hoàn thành hết các từ trong lượt này! Đang trộn lượt mới...", "success");
    applyFilters();
    return;
  }

  loadWord(currentIndex);
}

/* ================= PHÂN HỆ FLASHCARD 3D & TRẮC NGHIỆM 4 ĐÁP ÁN ================= */
let flashcardDeck = [];
let fcIndex = 0;
let currentQuizItem = null;
let quizCorrectTotal = 0;
let quizStreak = 0;

function initFlashcardDeck() {
  const srcEl = document.getElementById("fcSourceFilter");
  const lesEl = document.getElementById("fcLessonFilter");
  const src = srcEl ? srcEl.value : "all";
  const les = lesEl ? lesEl.value : "all";

  let pool = getWordsBySourceCode(src);
  if (les !== "all") {
    pool = pool.filter(w => String(w.lesson) === les);
  }

  if (pool.length === 0 && src === "review_only") {
    showToast("Chưa có từ nào trong mục 'Chưa nhớ'. Đang hiển thị toàn bộ từ vựng!", "info");
    if (srcEl) srcEl.value = "all";
    pool = [...allCombinedWords];
  }

  flashcardDeck = shuffleWords(pool);
  fcIndex = 0;

  if (flashcardDeck.length > 0) {
    renderCurrentFlashcard();
    nextQuizQuestion();
  }
}

function switchFlashcardMode() {
  const modeEl = document.getElementById("fcModeSelect");
  const mode = modeEl ? modeEl.value : "flip";
  const flipBox = document.getElementById("fcFlipContainer");
  const quizBox = document.getElementById("fcQuizContainer");
  if (flipBox) flipBox.style.display = (mode === "flip") ? "block" : "none";
  if (quizBox) quizBox.style.display = (mode === "quiz") ? "block" : "none";
  if (mode === "quiz") nextQuizQuestion();
}

function renderCurrentFlashcard() {
  if (flashcardDeck.length === 0) return;
  const item = flashcardDeck[fcIndex];
  const inner = document.getElementById("flashcardInner");
  if (inner) inner.classList.remove("flipped");

  const counter = document.getElementById("fcCounterText");
  if (counter) counter.innerText = `Thẻ ${fcIndex + 1} / ${flashcardDeck.length}`;

  const tag = document.getElementById("fcFrontLessonTag");
  if (tag) tag.innerText = `${item.subject || "Học phần"} • ${item.lesson || ""}`;

  const statusBadge = document.getElementById("fcStatusBadge");
  if (statusBadge) {
    if (memorizedWords.has(item.hanzi)) {
      statusBadge.style.display = "inline-block";
      statusBadge.className = "fc-status-tag known";
      statusBadge.innerText = "✅ Đã thuộc";
    } else if (needReviewWords.has(item.hanzi)) {
      statusBadge.style.display = "inline-block";
      statusBadge.className = "fc-status-tag unknown";
      statusBadge.innerText = "📌 Chưa nhớ";
    } else {
      statusBadge.style.display = "none";
    }
  }

  const fHz = document.getElementById("fcFrontHanzi");
  if (fHz) fHz.innerText = item.hanzi;

  const bHz = document.getElementById("fcBackHanzi");
  if (bHz) bHz.innerText = item.hanzi;

  const bPy = document.getElementById("fcBackPinyin");
  if (bPy) bPy.innerText = `[ ${item.pinyin || ""} ]`;

  const bVn = document.getElementById("fcBackVn");
  if (bVn) bVn.innerText = item.vn;
}

function flipCurrentFlashcard() {
  const inner = document.getElementById("flashcardInner");
  if (inner) inner.classList.toggle("flipped");
}

function prevFlashcard() {
  if (flashcardDeck.length === 0) return;
  fcIndex = (fcIndex - 1 + flashcardDeck.length) % flashcardDeck.length;
  renderCurrentFlashcard();
}

function speakCurrentFlashcard() {
  if (flashcardDeck.length === 0) return;
  playDiplomaticSpeech(flashcardDeck[fcIndex].hanzi, "zh-CN", 0.9);
}

function markFlashcardKnown() {
  if (flashcardDeck.length === 0) return;
  const cur = flashcardDeck[fcIndex];
  memorizedWords.set(cur.hanzi, cur);
  needReviewWords.delete(cur.hanzi);
  saveVocabProgressToStorage();
  renderStats();
  showToast(`✅ Đã thuộc: ${cur.hanzi} (${cur.vn})`, "success");
  fcIndex = (fcIndex + 1) % flashcardDeck.length;
  renderCurrentFlashcard();
}

// Nút "Chưa nhớ" đánh dấu từ vào danh sách cần ôn tập
function markFlashcardUnknown() {
  if (flashcardDeck.length === 0) return;
  const cur = flashcardDeck[fcIndex];
  needReviewWords.set(cur.hanzi, cur);
  memorizedWords.delete(cur.hanzi);
  saveVocabProgressToStorage();
  renderStats();
  showToast(`📌 Đã đánh dấu "Chưa nhớ": ${cur.hanzi} (${cur.vn})`, "warning");
  fcIndex = (fcIndex + 1) % flashcardDeck.length;
  renderCurrentFlashcard();
}

function nextQuizQuestion() {
  if (flashcardDeck.length < 4) {
    flashcardDeck = shuffleWords(allCombinedWords);
  }
  if (flashcardDeck.length === 0) return;

  currentQuizItem = flashcardDeck[Math.floor(Math.random() * flashcardDeck.length)];
  const distractors = shuffleWords(
    flashcardDeck.filter(w => w.vn !== currentQuizItem.vn)
  ).slice(0, 3);
  const options = shuffleWords([currentQuizItem, ...distractors]);

  document.getElementById("quizQuestionTag").innerText = `${currentQuizItem.subject || ""} • ${currentQuizItem.lesson || ""}`;
  document.getElementById("quizQuestionHanzi").innerText = currentQuizItem.hanzi;
  document.getElementById("quizQuestionPinyin").innerText = `[ ${currentQuizItem.pinyin || ""} ]`;
  document.getElementById("quizFeedbackMsg").innerText = "";

  const grid = document.getElementById("quizOptionsGrid");
  grid.innerHTML = "";
  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option-btn";
    btn.innerText = `${String.fromCharCode(65 + idx)}. ${opt.vn}`;
    btn.onclick = () => checkQuizOption(btn, opt);
    grid.appendChild(btn);
  });
}

function speakQuizWord() {
  if (!currentQuizItem) return;
  playDiplomaticSpeech(currentQuizItem.hanzi, "zh-CN", 0.9);
}

function checkQuizOption(clickedBtn, chosenOpt) {
  const allBtns = document.querySelectorAll("#quizOptionsGrid .quiz-option-btn");
  allBtns.forEach(b => (b.disabled = true));
  const msg = document.getElementById("quizFeedbackMsg");

  if (chosenOpt.hanzi === currentQuizItem.hanzi) {
    clickedBtn.classList.add("correct");
    quizCorrectTotal++;
    quizStreak++;
    msg.className = "msg-correct";
    msg.innerText = `🎉 Chính xác! ${currentQuizItem.hanzi} = ${currentQuizItem.vn}`;
    playDiplomaticSpeech(currentQuizItem.hanzi, "zh-CN", 0.95);
  } else {
    clickedBtn.classList.add("wrong");
    quizStreak = 0;
    needReviewWords.set(currentQuizItem.hanzi, currentQuizItem);
    saveVocabProgressToStorage();
    renderStats();
    msg.className = "msg-wrong";
    msg.innerText = `❌ Đáp án đúng là: "${currentQuizItem.vn}" (Đã thêm vào danh sách Chưa nhớ)`;
  }

  document.getElementById("quizScoreCorrect").innerText = quizCorrectTotal;
  document.getElementById("quizStreakCount").innerText = quizStreak;
}

/* ================= LOGIC TAB LUYỆN NGHE PHẢN XẠ ================= */
let currentListenWord = null;
let listenStreak = 0;

function playAudio(text, rate = 1.0) {
  playDiplomaticSpeech(text, "zh-CN", parseFloat(rate) || 1.0);
}

function onChangeListenSource() {
  setupListenQuestion();
}

function setupListenQuestion() {
  const srcEl = document.getElementById("listenSourceFilter");
  const lessonEl = document.getElementById("listenLessonFilter");
  const src = srcEl ? srcEl.value : "pd";
  const lesson = lessonEl ? lessonEl.value : "all";

  let pool = getWordsBySourceCode(src);
  let words = (lesson === "all") ? pool : pool.filter(w => String(w.lesson) === lesson);
  if (words.length === 0) words = allCombinedWords;
  if (words.length === 0) return;

  currentListenWord = words[Math.floor(Math.random() * words.length)];
  document.getElementById("listenInput").value = "";
  document.getElementById("listen-result-msg").innerText = "";
  document.getElementById("listenAnswerBox").style.display = "none";
  playCurrentListenWord();
}

function playCurrentListenWord() {
  if (!currentListenWord) return;
  const rate = document.getElementById("listenRateSelect").value;
  playAudio(currentListenWord.hanzi, rate);
}

function hintListenWord() {
  if (!currentListenWord) return;
  const hz = String(currentListenWord.hanzi);
  const py = String(currentListenWord.pinyin || "");
  const box = document.getElementById("listenAnswerBox");
  box.innerHTML = `💡 Gợi ý: Chữ đầu là <strong>${hz[0]}...</strong> (Pinyin: <em>${py.split(" ")[0]}...</em>) — Nghĩa: ${currentListenWord.vn}`;
  box.style.display = "block";
}

function checkListenAnswer() {
  if (!currentListenWord) return;
  const rawInput = document.getElementById("listenInput").value.trim();
  const userVal = rawInput.toLowerCase();
  const msg = document.getElementById("listen-result-msg");

  if (!userVal) {
    msg.className = "msg-wrong";
    msg.innerText = "Vui lòng nhập Chữ Hán, Pinyin hoặc Nghĩa tiếng Việt!";
    return;
  }

  const targetHanzi = String(currentListenWord.hanzi).trim().toLowerCase();
  const targetPinyin = String(currentListenWord.pinyin || "").trim().toLowerCase();
  const targetPinyinToneless = stripPinyinTones(targetPinyin);
  const userToneless = stripPinyinTones(userVal);
  const targetVn = String(currentListenWord.vn || "").trim().toLowerCase();

  const isMatch =
    userVal === targetHanzi ||
    userVal === targetPinyin ||
    userToneless === targetPinyinToneless ||
    userToneless.replace(/\s+/g, "") === targetPinyinToneless.replace(/\s+/g, "") ||
    (userVal.length >= 4 && targetVn.includes(userVal));

  if (isMatch) {
    listenStreak++;
    msg.className = "msg-correct";
    msg.innerText = `🎉 Chính xác! ${currentListenWord.hanzi} [${currentListenWord.pinyin}] — ${currentListenWord.vn}`;
  } else {
    listenStreak = 0;
    msg.className = "msg-wrong";
    msg.innerText = "Chưa chính xác, hãy bấm nghe lại hoặc xem gợi ý!";
  }

  const streakBadge = document.getElementById("listenStreakTopBadge");
  if (streakBadge) streakBadge.innerText = `🔥 Chuỗi nghe đúng: ${listenStreak}`;
}

function toggleListenAnswer() {
  if (!currentListenWord) return;
  const box = document.getElementById("listenAnswerBox");
  if (box.style.display === "none") {
    box.innerHTML = `<strong>${currentListenWord.hanzi}</strong> [${currentListenWord.pinyin || ""}]: ${currentListenWord.vn} <span style="color:var(--text-muted); font-size:12px;">(${currentListenWord.subject || ""} • ${currentListenWord.lesson || ""})</span>`;
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

function nextListenWord() {
  setupListenQuestion();
}

/* ================= AI BIÊN DỊCH THEO 12 BÀI GIÁO TRÌNH ================= */
let curriculumDB = null;
let currentTransLessonId = "bai1";
let currentTransTextId = "text1";
let currentPracticeMode = "book";
let showTransPinyin = true;
let isHighlightingTransTerms = false;

let currentTransExercise = {
  sourceText: "",
  sourceLang: "",
  targetLang: "",
  topicTitle: "",
  textTitle: "",
  objectives: "",
  vocabList: [],
  patternList: []
};

async function loadCurriculumDatabase() {
  try {
    curriculumDB = await loadJSONResource("curriculum_db.json", window.EMBEDDED_CURRICULUM_DB);
    initTransLessonChips();
  } catch (err) {
    console.error("Lỗi khi tải curriculum_db.json:", err);
    document.getElementById("aiPromptDisplay").innerText = "Không tìm thấy dữ liệu curriculum_db.json!";
  }
}
window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadCurriculumDatabase();
});

function initTransLessonChips() {
  const container = document.getElementById("transTopicsContainer");
  if (!container || !curriculumDB || !curriculumDB.translation) return;

  container.innerHTML = "";
  Object.keys(curriculumDB.translation).forEach((key) => {
    const lesson = curriculumDB.translation[key];
    const chip = document.createElement("button");
    chip.className = `topic-chip ${key === currentTransLessonId ? "active" : ""}`;
    chip.innerText = lesson.lessonTitle.split("(")[0].trim();
    chip.title = lesson.lessonTitle;
    chip.onclick = () => selectTransLesson(key, chip);
    container.appendChild(chip);
  });

  renderTransTextPills();
}

function selectTransLesson(lessonKey, chipEl) {
  stopTransAudio();
  document.querySelectorAll("#transTopicsContainer .topic-chip").forEach(c => c.classList.remove("active"));
  chipEl.classList.add("active");
  currentTransLessonId = lessonKey;
  currentTransTextId = "text1";
  renderTransTextPills();
}

function renderTransTextPills() {
  const container = document.getElementById("transTextsPillGroup");
  if (!container || !curriculumDB || !curriculumDB.translation) return;

  const lesson = curriculumDB.translation[currentTransLessonId];
  if (!lesson || !lesson.texts) return;

  container.innerHTML = "";
  lesson.texts.forEach((txt) => {
    const btn = document.createElement("button");
    btn.className = `pill-btn ${txt.id === currentTransTextId ? "active" : ""}`;
    const flag = (txt.direction === "zh_to_vi") ? "🇨🇳➔🇻🇳" : "🇻🇳➔🇨🇳";
    btn.innerText = `[${flag}] ${txt.titleVi || txt.title}`;
    btn.onclick = () => selectTransText(txt.id, btn);
    container.appendChild(btn);
  });

  loadCurrentExercise();
}

function selectTransText(textId, btnEl) {
  stopTransAudio();
  document.querySelectorAll("#transTextsPillGroup .pill-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");
  currentTransTextId = textId;
  loadCurrentExercise();
}

function selectTransPracticeMode(mode, btnEl) {
  stopTransAudio();
  document.querySelectorAll("#transPracticeModeGroup .pill-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");
  currentPracticeMode = mode;

  const btnRegen = document.getElementById("btnRegenAIText");
  if (btnRegen) btnRegen.style.display = (mode === "ai_generate") ? "inline-block" : "none";

  loadCurrentExercise();
}

async function loadCurrentExercise() {
  if (!curriculumDB || !curriculumDB.translation) return;

  const lesson = curriculumDB.translation[currentTransLessonId];
  const textObj = lesson.texts.find(t => t.id === currentTransTextId) || lesson.texts[0];

  currentTransExercise.topicTitle = lesson.lessonTitle;
  currentTransExercise.textTitle = textObj.titleVi || textObj.title;
  currentTransExercise.objectives = lesson.objectives || "";
  currentTransExercise.vocabList = textObj.vocabulary || [];
  currentTransExercise.patternList = textObj.patterns || [];

  const objText = document.getElementById("transObjectivesText");
  if (objText) objText.innerText = currentTransExercise.objectives;

  const metaCount = document.getElementById("transLessonMetaCount");
  if (metaCount) {
    metaCount.innerText = `${currentTransExercise.vocabList.length} thuật ngữ • ${currentTransExercise.patternList.length} mẫu câu`;
  }

  if (textObj.direction === "zh_to_vi") {
    currentTransExercise.sourceLang = "Tiếng Trung";
    currentTransExercise.targetLang = "Tiếng Việt";
  } else {
    currentTransExercise.sourceLang = "Tiếng Việt";
    currentTransExercise.targetLang = "Tiếng Trung";
  }

  renderVocabReference(textObj);

  const draftKey = `quyky_draft_bd_${currentTransLessonId}_${currentTransTextId}_${currentPracticeMode}`;
  const savedDraft = safeGetStorage(draftKey, "");
  document.getElementById("aiUserInput").value = savedDraft;
  document.getElementById("aiEvaluationResult").style.display = "none";

  const titleEl = document.getElementById("transPromptTitle");

  if (currentPracticeMode === "book") {
    currentTransExercise.sourceText = textObj.originalText;
    titleEl.innerText = `Đoạn văn sách giáo khoa (${currentTransExercise.sourceLang} ➔ ${currentTransExercise.targetLang}):`;
    renderTransPassageBox();
  } else {
    titleEl.innerText = `Đoạn văn do AI tạo tương tự (${currentTransExercise.sourceLang} ➔ ${currentTransExercise.targetLang}):`;
    requestAITranslationTask();
  }

  onTransInputChanged();
}

function renderTransPassageBox() {
  const displayEl = document.getElementById("aiPromptDisplay");
  if (!displayEl) return;
  const raw = currentTransExercise.sourceText || "";

  if (!isHighlightingTransTerms || currentTransExercise.vocabList.length === 0) {
    displayEl.innerText = raw;
    return;
  }

  let html = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const sortedVocab = [...currentTransExercise.vocabList].sort((a, b) => b.zh.length - a.zh.length);
  sortedVocab.forEach(v => {
    const cleanZh = v.zh.split("/")[0].replace(/…+/g, "").trim();
    if (cleanZh.length >= 2 && html.includes(cleanZh)) {
      const safeTitle = `${v.zh} [${v.pinyin}]: ${v.vi}`.replace(/"/g, "&quot;");
      const safeSpeak = cleanZh.replace(/'/g, "");
      html = html.split(cleanZh).join(
        `<mark class="term-highlight" title="${safeTitle}" onclick="playDiplomaticSpeech('${safeSpeak}', 'zh-CN')">${cleanZh}</mark>`
      );
    }
  });

  displayEl.innerHTML = html;
}

function toggleHighlightTransPassage() {
  isHighlightingTransTerms = !isHighlightingTransTerms;
  const btn = document.getElementById("btnHighlightTransTerms");
  if (btn) {
    btn.style.borderColor = isHighlightingTransTerms ? "var(--primary-border)" : "";
    btn.style.color = isHighlightingTransTerms ? "var(--primary-text)" : "";
  }
  renderTransPassageBox();
}

function speakCurrentTransPassage() {
  if (!currentTransExercise.sourceText) return;
  if (isTransPassageSpeaking) {
    stopTransAudio();
    return;
  }
  isTransPassageSpeaking = true;
  updateTransSpeakBtnUI();
  const lang = currentTransExercise.sourceLang === "Tiếng Trung" ? "zh-CN" : "vi-VN";
  playDiplomaticSpeech(currentTransExercise.sourceText, lang, 0.92, () => {
    isTransPassageSpeaking = false;
    updateTransSpeakBtnUI();
  });
}

function copyCurrentTransPassage() {
  copyTextToClipboard(currentTransExercise.sourceText, "📋 Đã sao chép đoạn văn đề bài!");
}

function toggleTransVocabPinyin() {
  showTransPinyin = !showTransPinyin;
  const lesson = curriculumDB && curriculumDB.translation ? curriculumDB.translation[currentTransLessonId] : null;
  if (!lesson) return;
  const textObj = lesson.texts.find(t => t.id === currentTransTextId) || lesson.texts[0];
  renderVocabReference(textObj);
}

function renderVocabReference(textObj) {
  const box = document.getElementById("transVocabReferenceBox");
  const content = document.getElementById("transVocabListContent");
  if (!box || !content) return;

  box.style.display = "block";
  const userDraft = (document.getElementById("aiUserInput")?.value || "").toLowerCase();

  let html = "<div><strong>Từ vựng trọng tâm:</strong><div class='vocab-grid-list'>";
  (textObj.vocabulary || []).forEach((v, idx) => {
    const cleanZh = v.zh.replace(/…+/g, "");
    const isUsed =
      (cleanZh && userDraft.includes(cleanZh.toLowerCase())) ||
      (v.vi && userDraft.includes(v.vi.toLowerCase()));
    const pySpan = showTransPinyin && v.pinyin ? `<span class="py-text">[${v.pinyin}]</span>` : "";
    html += `
      <span class="vocab-badge ${isUsed ? "used-term" : ""}" onclick="onClickVocabBadge(${idx}, 'trans')" title="Bấm để nghe phát âm">
        <span>🔊</span>
        <span class="zh-text">${v.zh}</span>
        ${pySpan}
        <span class="vi-text">• ${v.vi}</span>
      </span>
    `;
  });
  html += "</div></div>";

  if (textObj.patterns && textObj.patterns.length > 0) {
    html += "<div style='margin-top:10px;'><strong>Mẫu câu &amp; Cấu trúc ngữ pháp:</strong>";
    textObj.patterns.forEach((p, pIdx) => {
      html += `
        <div class="pattern-item-row" onclick="onClickPatternRow(${pIdx}, 'trans')" title="Bấm để nghe mẫu câu">
          <div>
            <strong style="color: var(--primary-text);">🔹 ${p.structure}</strong>
            <span style="color: var(--text-secondary); margin-left: 8px;">➔ ${p.meaning || ""}</span>
          </div>
          <span style="font-size: 12px; color: var(--pinyin-color); font-weight: 600;">🔊 Nghe</span>
        </div>
      `;
    });
    html += "</div>";
  }
  content.innerHTML = html;
}

function onClickVocabBadge(idx, mode) {
  const list = (mode === "trans")
    ? currentTransExercise.vocabList
    : (typeof currentInterScenario !== "undefined" ? currentInterScenario.vocabList : []);
  const item = list[idx];
  if (!item) return;
  playDiplomaticSpeech(item.zh, "zh-CN", 0.9);
}

function onClickPatternRow(idx, mode) {
  const list = (mode === "trans")
    ? currentTransExercise.patternList
    : (typeof currentInterScenario !== "undefined" ? currentInterScenario.patternList : []);
  const item = list[idx];
  if (!item) return;
  playDiplomaticSpeech(item.structure, "zh-CN", 0.9);
}

function toggleVocabReference() {
  const content = document.getElementById("transVocabListContent");
  if (content) content.style.display = (content.style.display === "none") ? "block" : "none";
}

function onTransInputChanged() {
  const val = document.getElementById("aiUserInput")?.value || "";
  const charEl = document.getElementById("transCharCountText");
  if (charEl) charEl.innerText = `${val.length} ký tự`;

  const draftKey = `quyky_draft_bd_${currentTransLessonId}_${currentTransTextId}_${currentPracticeMode}`;
  safeSetStorage(draftKey, val);

  const lower = val.toLowerCase();
  let usedCount = 0;
  const total = currentTransExercise.vocabList.length;
  currentTransExercise.vocabList.forEach(v => {
    const cleanZh = v.zh.split("/")[0].replace(/…+/g, "").trim().toLowerCase();
    const cleanVi = v.vi.split(",")[0].trim().toLowerCase();
    if ((cleanZh && lower.includes(cleanZh)) || (cleanVi && lower.includes(cleanVi))) {
      usedCount++;
    }
  });

  const covEl = document.getElementById("transTermCoverageText");
  if (covEl) {
    covEl.innerText = `Thuật ngữ đã dùng: ${usedCount}/${total}`;
  }

  if (curriculumDB && curriculumDB.translation) {
    const lesson = curriculumDB.translation[currentTransLessonId];
    const textObj = lesson?.texts.find(t => t.id === currentTransTextId);
    if (textObj) renderVocabReference(textObj);
  }
}

function clearTranslationDraft() {
  const area = document.getElementById("aiUserInput");
  if (area) area.value = "";
  onTransInputChanged();
  showToast("Đã xóa nội dung bài làm", "info");
}

function runLocalTransCheck() {
  const userText = (document.getElementById("aiUserInput")?.value || "").trim();
  if (!userText) {
    showToast("Vui lòng nhập bản dịch của bạn trước khi kiểm tra!", "warning");
    return;
  }

  const lower = userText.toLowerCase();
  const matched = [];
  const missed = [];

  currentTransExercise.vocabList.forEach(v => {
    const cleanZh = v.zh.split("/")[0].replace(/…+/g, "").trim().toLowerCase();
    const cleanVi = v.vi.split(",")[0].trim().toLowerCase();
    if ((cleanZh && lower.includes(cleanZh)) || (cleanVi && lower.includes(cleanVi))) {
      matched.push(`${v.zh} (${v.vi})`);
    } else {
      missed.push(`${v.zh} (${v.vi})`);
    }
  });

  const ratio = currentTransExercise.vocabList.length > 0
    ? Math.round((matched.length / currentTransExercise.vocabList.length) * 100)
    : 100;

  const resultBox = document.getElementById("aiEvaluationResult");
  resultBox.innerHTML = `
    <div class="eval-score-header">
      <strong style="font-size: 15px; color: var(--primary-text);">⚡ Kiểm tra nhanh độ phủ Thuật ngữ (Tức thì)</strong>
      <span class="score-circle-badge" style="background: var(--primary);">Độ phủ: ${matched.length}/${currentTransExercise.vocabList.length} (${ratio}%)</span>
    </div>
    <div class="eval-formatted-body">
      <p><strong>✅ Thuật ngữ đã vận dụng (${matched.length}):</strong> ${matched.length ? matched.join(" • ") : "Chưa phát hiện thuật ngữ khớp trực tiếp."}</p>
      <p><strong>💡 Gợi ý thuật ngữ có thể bổ sung (${missed.length}):</strong> ${missed.length ? missed.join(" • ") : "Tuyệt vời! Bạn đã dùng toàn bộ thuật ngữ."}</p>
      <p style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">👉 Bấm <strong>"⚖️ Gửi AI Thẩm Định Bản Dịch"</strong> để nhận chấm điểm ngữ pháp, văn phong và bản dịch mẫu hoàn chỉnh từ AI.</p>
    </div>
  `;
  resultBox.style.display = "block";
}

async function requestAITranslationTask() {
  const displayEl = document.getElementById("aiPromptDisplay");
  displayEl.innerText = `⏳ AI đang biên soạn đoạn văn tương tự theo [${currentTransExercise.textTitle}]...`;
  document.getElementById("aiEvaluationResult").style.display = "none";
  document.getElementById("aiUserInput").value = "";

  const vocabSamples = currentTransExercise.vocabList.slice(0, 6);
  const zhVocabs = vocabSamples.map(v => v.zh).join(", ");
  const viVocabs = vocabSamples.map(v => `"${v.vi}"`).join(", ");
  const patternSample = currentTransExercise.patternList[0] ? currentTransExercise.patternList[0].structure : "";

  let prompt = "";
  if (currentTransExercise.sourceLang === "Tiếng Việt") {
    prompt = `Bạn là giảng viên Biên dịch tiếng Trung.
Chủ đề: [${currentTransExercise.topicTitle}] - Bài: [${currentTransExercise.textTitle}].
Hãy viết 1 đoạn văn ngắn bằng TIẾNG VIỆT (2-3 câu ngắn gọn, tối đa 50 từ), ngữ cảnh trang trọng, sử dụng các từ ngữ sau: [${viVocabs}].
QUY TẮC BẮT BUỘC:
1. 100% tiếng Việt thuần túy, tuyệt đối không chứa chữ Hán hay Pinyin.
2. Chỉ trả về nội dung đoạn văn, không thêm lời chào hay giải thích.`;
  } else {
    prompt = `Bạn là giảng viên Biên dịch tiếng Trung.
Chủ đề: [${currentTransExercise.topicTitle}] - Bài: [${currentTransExercise.textTitle}].
Hãy viết 1 đoạn văn ngắn bằng TIẾNG TRUNG (khoảng 2-3 câu, tối đa 50 chữ Hán), sử dụng các từ vựng: [${zhVocabs}] và kết cấu: "${patternSample}".
QUY TẮC BẮT BUỘC:
1. Chỉ trả về DUY NHẤT chữ Hán, không thêm pinyin hay dịch tiếng Việt.
2. Không thêm lời giải thích nào khác.`;
  }

  try {
    const result = await callGemini(prompt);
    currentTransExercise.sourceText = result.trim();
    renderTransPassageBox();
  } catch (err) {
    displayEl.innerText = "Lỗi tạo đề: " + err.message;
  }
}

async function submitTranslationToAI() {
  const userText = document.getElementById("aiUserInput").value.trim();
  if (!userText) {
    showToast("Vui lòng nhập bản dịch của bạn vào ô!", "warning");
    return;
  }
  if (!currentTransExercise.sourceText) {
    showToast("Chưa có đề bài, vui lòng chờ nạp bài!", "warning");
    return;
  }

  const btn = document.getElementById("btnSubmitAI");
  const resultBox = document.getElementById("aiEvaluationResult");
  btn.innerText = "⏳ AI đang thẩm định bản dịch...";
  btn.disabled = true;

  const standardTerms = currentTransExercise.vocabList.map(v => `${v.zh} (${v.vi})`).join(", ");
  const patternStructures = currentTransExercise.patternList.map(p => p.structure).join(" | ");

  const evalPrompt = `
Bạn là chuyên gia thẩm định Biên dịch tiếng Trung học thuật.
Chủ đề: [${currentTransExercise.topicTitle}] - [${currentTransExercise.textTitle}].
Bảng thuật ngữ chuẩn của bài: [${standardTerms}].
Cấu trúc mẫu câu của bài: [${patternStructures}].

Đoạn văn gốc (${currentTransExercise.sourceLang}):
"${currentTransExercise.sourceText}"

Bản dịch của học viên (${currentTransExercise.targetLang}):
"${userText}"

Hãy đánh giá chi tiết:
1. Điểm số: .../10
2. Đánh giá độ chuẩn xác & Thuật ngữ: Học viên đã dịch sát nghĩa chưa? Đã vận dụng chính xác các thuật ngữ và mẫu câu trọng tâm của bài chưa? Chỉ rõ ưu điểm và các lỗi dùng từ/ngữ pháp (nếu có).
3. Bản dịch mẫu tối ưu nhất: Cung cấp bản dịch trau chuốt, tự nhiên và đạt chuẩn văn phong học thuật nhất để học viên học tập.
`;

  try {
    const evaluation = await callGemini(evalPrompt);
    resultBox.innerHTML = formatAIEvaluationHTML(evaluation, "Thẩm định Biên Dịch Học Thuật");
    resultBox.style.display = "block";
    showToast("🎉 Đã hoàn tất thẩm định bản dịch!", "success");
  } catch (err) {
    showToast("Lỗi chấm bài AI: " + err.message, "error");
    runLocalTransCheck();
  } finally {
    btn.innerText = "⚖️ Gửi AI Thẩm Định Bản Dịch";
    btn.disabled = false;
  }
}

/* ================= MODAL TRA CỨU TỪ ĐIỂN THEO 2 HỌC PHẦN & TỪ BÀI 1 ĐẾN BÀI 12 ================= */
let currentDictSubject = "bd"; // 'bd' (Biên dịch) hoặc 'pd' (Phiên dịch)
let currentDictLessonKey = "all"; // 'all' hoặc 'bai1' .. 'bai12'

function openDictionaryModal() {
  const modal = document.getElementById("dictModalOverlay");
  if (!modal) return;
  modal.classList.add("open");
  renderDictLessonBar();
  const inp = document.getElementById("dictSearchInput");
  if (inp) {
    renderDictionarySearch(inp.value);
  } else {
    renderDictionarySearch("");
  }
}

function closeDictionaryModal() {
  const modal = document.getElementById("dictModalOverlay");
  if (modal) modal.classList.remove("open");
}

function switchDictSubject(subj) {
  currentDictSubject = subj;
  currentDictLessonKey = "all";
  const tabBD = document.getElementById("dictTabBD");
  const tabPD = document.getElementById("dictTabPD");
  if (tabBD) tabBD.classList.toggle("active", subj === "bd");
  if (tabPD) tabPD.classList.toggle("active", subj === "pd");

  renderDictLessonBar();
  const inp = document.getElementById("dictSearchInput");
  renderDictionarySearch(inp ? inp.value : "");
}

function selectDictLessonFilter(lessonKey) {
  currentDictLessonKey = lessonKey;
  renderDictLessonBar();
  const inp = document.getElementById("dictSearchInput");
  renderDictionarySearch(inp ? inp.value : "");
}

function renderDictLessonBar() {
  const bar = document.getElementById("dictLessonBar");
  if (!bar) return;

  let html = `<button type="button" class="dict-lesson-pill ${currentDictLessonKey === "all" ? "active" : ""}" onclick="selectDictLessonFilter('all')">Tất cả (Bài 1 ➔ Bài 12)</button>`;
  for (let i = 1; i <= 12; i++) {
    const k = `bai${i}`;
    html += `<button type="button" class="dict-lesson-pill ${currentDictLessonKey === k ? "active" : ""}" onclick="selectDictLessonFilter('${k}')">Bài ${i}</button>`;
  }
  bar.innerHTML = html;
}

function toggleMarkUnknownFromDict(hanzi, pinyin, vn, lessonLabel, subjectLabel) {
  if (needReviewWords.has(hanzi)) {
    needReviewWords.delete(hanzi);
    showToast(`Đã bỏ đánh dấu Chưa nhớ: ${hanzi}`, "info");
  } else {
    needReviewWords.set(hanzi, { hanzi, pinyin, vn, lesson: lessonLabel, subject: subjectLabel });
    memorizedWords.delete(hanzi);
    showToast(`📌 Đã đánh dấu "Chưa nhớ": ${hanzi} (${vn})`, "warning");
  }
  saveVocabProgressToStorage();
  renderStats();
  const inp = document.getElementById("dictSearchInput");
  renderDictionarySearch(inp ? inp.value : "");
}

function renderDictionarySearch(query) {
  const listEl = document.getElementById("dictResultsList");
  if (!listEl) return;

  const q = String(query || "").trim().toLowerCase();
  const qToneless = stripPinyinTones(q);

  const sourceCurriculum = (currentDictSubject === "bd")
    ? (curriculumDB && curriculumDB.translation ? curriculumDB.translation : (window.EMBEDDED_CURRICULUM_DB ? window.EMBEDDED_CURRICULUM_DB.translation : null))
    : (typeof pdDB !== "undefined" && pdDB ? pdDB : window.EMBEDDED_CURRICULUM_PD);

  const subjectLabel = (currentDictSubject === "bd") ? "Biên Dịch" : "Phiên Dịch";

  if (!sourceCurriculum) {
    listEl.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-muted);">Đang tải dữ liệu học phần...</div>`;
    return;
  }

  let html = "";
  let totalFound = 0;

  for (let i = 1; i <= 12; i++) {
    const key = `bai${i}`;
    if (currentDictLessonKey !== "all" && currentDictLessonKey !== key) continue;

    const lessonObj = sourceCurriculum[key];
    if (!lessonObj) continue;

    const lessonVocab = [];
    const lessonPatterns = [];

    (lessonObj.texts || []).forEach(txt => {
      (txt.vocabulary || []).forEach(v => {
        if (
          !q ||
          String(v.zh).toLowerCase().includes(q) ||
          String(v.pinyin || "").toLowerCase().includes(q) ||
          stripPinyinTones(v.pinyin || "").includes(qToneless) ||
          String(v.vi || "").toLowerCase().includes(q)
        ) {
          lessonVocab.push(v);
        }
      });
      (txt.patterns || []).forEach(p => {
        if (
          !q ||
          String(p.structure).toLowerCase().includes(q) ||
          String(p.meaning || "").toLowerCase().includes(q)
        ) {
          lessonPatterns.push(p);
        }
      });
    });

    if (lessonVocab.length === 0 && lessonPatterns.length === 0) continue;
    totalFound += lessonVocab.length + lessonPatterns.length;

    html += `
      <div class="dict-lesson-group">
        <div class="dict-lesson-group-header">
          <span>📘 ${lessonObj.lessonTitle || `Bài ${i}`}</span>
          <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">
            ${lessonVocab.length} từ vựng • ${lessonPatterns.length} mẫu câu
          </span>
        </div>
        <div class="dict-lesson-items">
    `;

    lessonVocab.forEach(v => {
      const safeSpeak = String(v.zh).replace(/'/g, "");
      const safePy = String(v.pinyin || "").replace(/'/g, "");
      const safeVi = String(v.vi || "").replace(/'/g, "");
      const isMarkedUnknown = needReviewWords.has(v.zh);
      html += `
        <div class="dict-item-card">
          <div>
            <strong style="font-size: 16px; color: var(--hanzi-color);">${v.zh}</strong>
            <span style="color: var(--pinyin-color); font-size: 12.5px; font-weight: 600; margin-left: 6px;">[${v.pinyin || ""}]</span>
            <div style="font-size: 13.5px; color: var(--text-main); margin-top: 3px;">${v.vi}</div>
          </div>
          <div style="display:flex; gap:4px; flex-shrink:0;">
            <button type="button" class="btn-clear-single" onclick="playDiplomaticSpeech('${safeSpeak}', 'zh-CN')" title="Nghe phát âm">🔊</button>
            <button type="button" class="btn-clear-single" style="${isMarkedUnknown ? "border-color: var(--warning-border); background: var(--warning-soft); color: var(--warning-text);" : ""}" onclick="toggleMarkUnknownFromDict('${safeSpeak}', '${safePy}', '${safeVi}', 'Bài ${i}', '${subjectLabel}')" title="Đánh dấu Chưa nhớ để ôn tập">📌</button>
            <button type="button" class="btn-clear-single" onclick="copyTextToClipboard('${safeSpeak}')" title="Sao chép">📋</button>
          </div>
        </div>
      `;
    });

    lessonPatterns.forEach(p => {
      const safeSpeak = String(p.structure).replace(/'/g, "");
      html += `
        <div class="dict-item-card" style="border-left: 3px solid var(--primary);">
          <div>
            <strong style="font-size: 13.5px; color: var(--primary-text);">🔹 Mẫu câu: ${p.structure}</strong>
            <div style="font-size: 13px; color: var(--text-main); margin-top: 2px;">${p.meaning || ""}</div>
          </div>
          <button type="button" class="btn-clear-single" onclick="playDiplomaticSpeech('${safeSpeak}', 'zh-CN')">🔊</button>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  if (totalFound === 0) {
    listEl.innerHTML = `<div style="text-align:center; padding: 28px; color: var(--text-muted);">Không tìm thấy thuật ngữ hoặc mẫu câu nào khớp với "${query}" trong học phần ${subjectLabel}.</div>`;
    return;
  }

  listEl.innerHTML = html;
}

autoLoadExcel();
