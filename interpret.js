/* ==========================================================================
   PHÂN HỆ PHÒNG LUYỆN PHIÊN DỊCH (INTERPRETATION LAB NÂNG CẤP)
   Nạp từ curriculum_pd.json & hỗ trợ Giọng Thuần Tiếng Trung + Sổ tay tốc ký
   ========================================================================== */

let pdDB = null;
let currentInterLessonId = "bai1";
let currentInterTextId = "text1";
let currentInterPracticeMode = "book";
let selectedInterRate = 1.0;
let showInterPinyin = true;

let currentInterScenario = {
  sourceText: "",
  sourceLangCode: "zh-CN",
  targetLangCode: "vi-VN",
  dir: "zh_to_vi",
  lessonTitle: "",
  textTitle: "",
  objectives: "",
  audioSrc: "",
  vocabList: [],
  patternList: []
};

let audioElement = new Audio();
let isSpeechRevealed = false;
let speechRecognizer = null;
let isRecording = false;
let isCabinTTSSpeaking = false;

// Biến luyện từng câu (Sentence-by-Sentence Drill)
let isSentenceDrillActive = false;
let cabinSentences = [];
let currentSentenceIdx = 0;

// Biến đồng hồ bấm giờ Cabin
let cabinTimerSeconds = 0;
let cabinTimerInterval = null;

// Ánh xạ chính xác theo tên file thực tế trong thư mục audio
function getAudioFilePath(lessonNum, textNum) {
  if (lessonNum === 4 && textNum === 4) return "audio/Bai4_baikhoa4.mp3";
  if (lessonNum === 6 && textNum === 4) return "audio/Bai6_baikhoa4.mp3";
  if (lessonNum === 7 && textNum === 2) return "audio/Baikhoa7_bai2 .mp3";
  if (lessonNum === 7 && textNum === 4) return "audio/Baikhoa7_bai4 .mp3";
  if (lessonNum >= 7) {
    return `audio/Baikhoa${lessonNum}_bai${textNum}.mp3`;
  }
  return `audio/bai${lessonNum}_baikhoa${textNum}.mp3`;
}

function formatAudioSeconds(sec) {
  if (!sec || isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function bindAudioTimeEvents(aud) {
  aud.addEventListener("timeupdate", () => {
    const slider = document.getElementById("cabinAudioSlider");
    const timeEl = document.getElementById("cabinAudioTime");
    if (aud.duration && !isNaN(aud.duration)) {
      if (slider) slider.value = Math.round((aud.currentTime / aud.duration) * 100);
      if (timeEl) timeEl.innerText = `${formatAudioSeconds(aud.currentTime)} / ${formatAudioSeconds(aud.duration)}`;
    }
  });
}
bindAudioTimeEvents(audioElement);

function seekCabinAudio(deltaSec) {
  if (audioElement && audioElement.duration && !isNaN(audioElement.duration)) {
    audioElement.currentTime = Math.max(0, Math.min(audioElement.duration, audioElement.currentTime + deltaSec));
  } else {
    showToast("Tua nhanh áp dụng khi đang phát file âm thanh MP3 gốc", "info");
  }
}

function onSeekCabinSlider(val) {
  if (audioElement && audioElement.duration && !isNaN(audioElement.duration)) {
    audioElement.currentTime = (parseFloat(val) / 100) * audioElement.duration;
  }
}

// Đồng hồ bấm giờ Cabin
function startCabinTimerIfNeeded() {
  if (cabinTimerInterval) return;
  cabinTimerInterval = setInterval(() => {
    cabinTimerSeconds++;
    const el = document.getElementById("cabinTimerDisplay");
    if (el) el.innerText = `⏱️ ${formatAudioSeconds(cabinTimerSeconds)}`;
  }, 1000);
}

function stopCabinTimer() {
  if (cabinTimerInterval) {
    clearInterval(cabinTimerInterval);
    cabinTimerInterval = null;
  }
}

function resetCabinTimer() {
  stopCabinTimer();
  cabinTimerSeconds = 0;
  const el = document.getElementById("cabinTimerDisplay");
  if (el) el.innerText = "⏱️ 00:00";
}

// 1. Tải dữ liệu từ file curriculum_pd.json
async function loadInterpretationDatabase() {
  const notice = document.getElementById("speechBlindNotice");
  try {
    pdDB = await loadJSONResource("curriculum_pd.json", window.EMBEDDED_CURRICULUM_PD);
    renderInterLessonChips();
  } catch (err) {
    console.error("Chi tiết lỗi curriculum_pd.json:", err);
    if (notice) {
      notice.innerHTML = `<span class="blind-icon">⚠️</span> <span>Lỗi nạp bài: ${err.message}</span>`;
    }
  }
}
window.addEventListener("DOMContentLoaded", loadInterpretationDatabase);

// 2. Render danh sách đầy đủ 12 bài học
function renderInterLessonChips() {
  const container = document.getElementById("interpretTopicsContainer");
  if (!container || !pdDB) return;

  container.innerHTML = "";
  Object.keys(pdDB).forEach((key) => {
    const lesson = pdDB[key];
    const chip = document.createElement("button");
    chip.className = `topic-chip ${key === currentInterLessonId ? "active" : ""}`;
    chip.innerText = (lesson.lessonTitle || key).split("(")[0].trim();
    chip.title = lesson.lessonTitle || key;
    chip.onclick = () => selectInterLesson(key, chip);
    container.appendChild(chip);
  });

  renderInterTextPills();
}

function selectInterLesson(lessonKey, chipEl) {
  document.querySelectorAll("#interpretTopicsContainer .topic-chip").forEach(c => c.classList.remove("active"));
  chipEl.classList.add("active");
  currentInterLessonId = lessonKey;
  currentInterTextId = "text1";
  renderInterTextPills();
}

// 3. Render 4 nút chọn bài khóa
function renderInterTextPills() {
  const container = document.getElementById("interpretTextsPillGroup");
  if (!container || !pdDB) return;

  const lesson = pdDB[currentInterLessonId];
  if (!lesson || !lesson.texts) return;

  container.innerHTML = "";
  lesson.texts.forEach((txt) => {
    const btn = document.createElement("button");
    btn.className = `pill-btn ${txt.id === currentInterTextId ? "active" : ""}`;
    const flag = (txt.direction === "zh_to_vi") ? "🇨🇳➔🇻🇳" : "🇻🇳➔🇨🇳";
    btn.innerText = `[${flag}] ${txt.titleVi || txt.title}`;
    btn.onclick = () => selectInterText(txt.id, btn);
    container.appendChild(btn);
  });

  loadCurrentInterExercise();
}

function selectInterText(textId, btnEl) {
  document.querySelectorAll("#interpretTextsPillGroup .pill-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");
  currentInterTextId = textId;
  loadCurrentInterExercise();
}

// 4. Chọn chế độ: Sách MP3 hoặc AI tạo đề
function selectInterpretPracticeMode(mode, btnEl) {
  document.querySelectorAll("#interpretPracticeModeGroup .pill-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");
  currentInterPracticeMode = mode;

  const regenBox = document.getElementById("btnInterpretRegenContainer");
  if (regenBox) regenBox.style.display = (mode === "ai_generate") ? "block" : "none";

  loadCurrentInterExercise();
}

function selectInterpretRate(btn) {
  document.querySelectorAll("#ratePillGroup .pill-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedInterRate = parseFloat(btn.getAttribute("data-val")) || 1.0;
  if (audioElement) audioElement.playbackRate = selectedInterRate;
}

// 5. Nạp bài khóa & cấu hình âm thanh
async function loadCurrentInterExercise() {
  if (!pdDB) return;

  stopAllAudio();
  resetCabinTimer();

  const lesson = pdDB[currentInterLessonId];
  if (!lesson || !lesson.texts) return;

  const textObj = lesson.texts.find(t => t.id === currentInterTextId) || lesson.texts[0];

  currentInterScenario.lessonTitle = lesson.lessonTitle || "";
  currentInterScenario.textTitle = textObj.titleVi || textObj.title || "";
  currentInterScenario.objectives = lesson.objectives || "";
  currentInterScenario.vocabList = textObj.vocabulary || [];
  currentInterScenario.patternList = textObj.patterns || [];
  currentInterScenario.dir = textObj.direction || "zh_to_vi";

  const objEl = document.getElementById("interObjectivesText");
  if (objEl) objEl.innerText = currentInterScenario.objectives;

  const lessonNum = lesson.lessonNumber || parseInt(currentInterLessonId.replace("bai", ""), 10) || 1;
  const textNum = parseInt(textObj.id.replace("text", ""), 10) || 1;
  currentInterScenario.audioSrc = getAudioFilePath(lessonNum, textNum);

  const roleTag = document.getElementById("speakerRoleTag");
  const deskTitle = document.getElementById("interpretDeskTitle");

  if (textObj.direction === "zh_to_vi") {
    currentInterScenario.sourceLangCode = "zh-CN";
    currentInterScenario.targetLangCode = "vi-VN";
    if (roleTag) roleTag.innerText = `🎙️ [🇨🇳 ➔ 🇻🇳] ${currentInterScenario.textTitle}`;
    if (deskTitle) deskTitle.innerText = "Bản dịch tiếng Việt của bạn:";
  } else {
    currentInterScenario.sourceLangCode = "vi-VN";
    currentInterScenario.targetLangCode = "zh-CN";
    if (roleTag) roleTag.innerText = `🎙️ [🇻🇳 ➔ 🇨🇳] ${currentInterScenario.textTitle}`;
    if (deskTitle) deskTitle.innerText = "Bản dịch tiếng Trung của bạn:";
  }

  renderInterVocabReference(textObj);

  const draftKey = `quyky_draft_pd_${currentInterLessonId}_${currentInterTextId}_${currentInterPracticeMode}`;
  const noteKey = `quyky_notes_pd_${currentInterLessonId}_${currentInterTextId}`;

  const txtArea = document.getElementById("interpretUserTranscript");
  if (txtArea) txtArea.value = safeGetStorage(draftKey, "");

  const noteArea = document.getElementById("cabinShorthandInput");
  if (noteArea) noteArea.value = safeGetStorage(noteKey, "");

  const resBox = document.getElementById("interpretAIResult");
  if (resBox) resBox.style.display = "none";

  isSpeechRevealed = false;
  const revText = document.getElementById("revealedSpeechText");
  const noticeBox = document.getElementById("speechBlindNotice");
  if (revText) revText.style.display = "none";
  if (noticeBox) noticeBox.style.display = "flex";

  if (currentInterPracticeMode === "book") {
    currentInterScenario.sourceText = textObj.originalText || "";
    prepareCabinSentences();
    if (revText) revText.innerText = currentInterScenario.sourceText;
    if (noticeBox) noticeBox.innerHTML = '<span class="blind-icon">🔒</span> <span>Bài khóa đã sẵn sàng! Bấm "Phát âm thanh" để nghe.</span>';
  } else {
    requestAIInterpretTask();
  }

  onInterTranscriptChanged();
}

function prepareCabinSentences() {
  const raw = String(currentInterScenario.sourceText || "").trim();
  if (!raw) {
    cabinSentences = [];
    return;
  }
  const parts = raw
    .split(/(?<=[。！？.!?\n])\s*/)
    .map(s => s.trim())
    .filter(Boolean);
  cabinSentences = parts.length > 0 ? parts : [raw];
  currentSentenceIdx = 0;
  updateSentenceDrillUI();
}

function toggleSentenceDrillMode() {
  isSentenceDrillActive = !isSentenceDrillActive;
  const bar = document.getElementById("sentenceDrillBar");
  if (bar) bar.style.display = isSentenceDrillActive ? "flex" : "none";
  prepareCabinSentences();
  if (isSentenceDrillActive) {
    showToast(`Đã bật chế độ Tách từng câu (${cabinSentences.length} câu)`, "info");
  }
}

function updateSentenceDrillUI() {
  const counter = document.getElementById("sentenceDrillCounter");
  if (counter && cabinSentences.length > 0) {
    counter.innerText = `Câu ${currentSentenceIdx + 1} / ${cabinSentences.length}`;
  }
  if (isSpeechRevealed && isSentenceDrillActive && cabinSentences.length > 0) {
    const revText = document.getElementById("revealedSpeechText");
    if (revText) revText.innerText = cabinSentences[currentSentenceIdx];
  } else if (isSpeechRevealed) {
    const revText = document.getElementById("revealedSpeechText");
    if (revText) revText.innerText = currentInterScenario.sourceText;
  }
}

function stepCabinSentence(dir) {
  if (cabinSentences.length === 0) return;
  currentSentenceIdx = (currentSentenceIdx + dir + cabinSentences.length) % cabinSentences.length;
  updateSentenceDrillUI();
  playCurrentCabinSentence();
}

function playCurrentCabinSentence() {
  if (cabinSentences.length === 0) return;
  const sentence = cabinSentences[currentSentenceIdx];
  playNativeChineseTTS(sentence);
}

function toggleInterVocabPinyin() {
  showInterPinyin = !showInterPinyin;
  const lesson = pdDB ? pdDB[currentInterLessonId] : null;
  if (!lesson) return;
  const textObj = lesson.texts.find(t => t.id === currentInterTextId) || lesson.texts[0];
  renderInterVocabReference(textObj);
}

// Hiển thị khung từ vựng tham khảo
function renderInterVocabReference(textObj) {
  const box = document.getElementById("interpretVocabRefBox");
  const content = document.getElementById("interpretVocabRefContent");
  if (!box || !content) return;

  if (!textObj.vocabulary || textObj.vocabulary.length === 0) {
    box.style.display = "none";
    return;
  }

  const userTranscript = (document.getElementById("interpretUserTranscript")?.value || "").toLowerCase();

  box.style.display = "block";
  let html = "<div><strong>Thuật ngữ bài:</strong><div class='vocab-grid-list'>";
  textObj.vocabulary.forEach((v, idx) => {
    const cleanZh = v.zh.replace(/\.{2,}|…+/g, "").trim();
    const isUsed =
      (cleanZh && userTranscript.includes(cleanZh.toLowerCase())) ||
      (v.vi && userTranscript.includes(v.vi.toLowerCase()));
    const pySpan = showInterPinyin && v.pinyin ? `<span class="py-text">[${v.pinyin}]</span>` : "";
    html += `
      <span class="vocab-badge ${isUsed ? "used-term" : ""}" onclick="onClickVocabBadge(${idx}, 'inter')" title="Bấm để nghe phát âm">
        <span>🔊</span>
        <span class="zh-text">${v.zh}</span>
        ${pySpan}
        <span class="vi-text">• ${v.vi}</span>
      </span>
    `;
  });
  html += "</div></div>";

  if (textObj.patterns && textObj.patterns.length > 0) {
    html += "<div style='margin-top:10px;'><strong>Mẫu câu &amp; Cấu trúc:</strong>";
    textObj.patterns.forEach((p, pIdx) => {
      html += `
        <div class="pattern-item-row" onclick="onClickPatternRow(${pIdx}, 'inter')" title="Bấm để nghe mẫu câu">
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

function toggleInterpretVocabRef() {
  const content = document.getElementById("interpretVocabRefContent");
  if (content) content.style.display = (content.style.display === "none") ? "block" : "none";
}

function onInterTranscriptChanged() {
  startCabinTimerIfNeeded();
  const val = document.getElementById("interpretUserTranscript")?.value || "";
  const draftKey = `quyky_draft_pd_${currentInterLessonId}_${currentInterTextId}_${currentInterPracticeMode}`;
  safeSetStorage(draftKey, val);

  const lower = val.toLowerCase();
  let used = 0;
  const total = currentInterScenario.vocabList.length;
  currentInterScenario.vocabList.forEach(v => {
    const cleanZh = v.zh.replace(/\.{2,}|…+/g, "").trim().toLowerCase();
    const cleanVi = v.vi.split(",")[0].trim().toLowerCase();
    if ((cleanZh && lower.includes(cleanZh)) || (cleanVi && lower.includes(cleanVi))) {
      used++;
    }
  });

  const badge = document.getElementById("interTermCoverageBadge");
  if (badge) badge.innerText = `Thuật ngữ: ${used}/${total}`;

  if (pdDB && pdDB[currentInterLessonId]) {
    const textObj = pdDB[currentInterLessonId].texts.find(t => t.id === currentInterTextId);
    if (textObj) renderInterVocabReference(textObj);
  }
}

function clearInterpretTranscript() {
  const el = document.getElementById("interpretUserTranscript");
  if (el) el.value = "";
  onInterTranscriptChanged();
  showToast("Đã xóa nội dung phiên dịch", "info");
}

function clearShorthandPad() {
  const el = document.getElementById("cabinShorthandInput");
  if (el) el.value = "";
  const noteKey = `quyky_notes_pd_${currentInterLessonId}_${currentInterTextId}`;
  safeSetStorage(noteKey, "");
  showToast("Đã xóa nháp tốc ký", "info");
}

// 6. Phát âm thanh (MP3 gốc hoặc Giọng thuần Tiếng Trung Native TTS)
function playSpeakerAudio() {
  const btn = document.getElementById("btnPlayAudio");

  if (isCabinTTSSpeaking) {
    stopAllAudio();
    return;
  }

  if (isSentenceDrillActive && cabinSentences.length > 0) {
    playCurrentCabinSentence();
    return;
  }

  if (currentInterPracticeMode === "book") {
    const currentDecodedSrc = decodeURI(audioElement.src || "");
    if (!audioElement.paused && currentDecodedSrc.includes(currentInterScenario.audioSrc)) {
      audioElement.pause();
      if (btn) btn.innerText = "▶️ Tiếp tục nghe";
      return;
    }

    audioElement.src = currentInterScenario.audioSrc;
    audioElement.playbackRate = selectedInterRate;
    audioElement.play().then(() => {
      if (btn) btn.innerText = "⏸️ Tạm dừng";
    }).catch(() => {
      playNativeChineseTTS(currentInterScenario.sourceText);
    });

    audioElement.onended = () => {
      if (btn) btn.innerText = "🔄 Nghe lại bài";
    };
  } else {
    playNativeChineseTTS(currentInterScenario.sourceText);
  }
}

function playNativeChineseTTS(text) {
  const btn = document.getElementById("btnPlayAudio");
  if (!text) return;

  if (!window.speechSynthesis) {
    if (btn) btn.innerText = "▶️ Phát âm thanh";
    showToast("Trình duyệt không hỗ trợ Web Speech!", "warning");
    return;
  }
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.rate = selectedInterRate;

  const isZh = (currentInterScenario.sourceLangCode === "zh-CN");
  if (isZh && typeof resolveChineseVoice === "function") {
    const resolved = resolveChineseVoice("zh-CN");
    u.lang = resolved.lang || "zh-CN";
    u.pitch = resolved.pitch || 1.0;
    if (resolved.voice) u.voice = resolved.voice;
  } else {
    u.lang = currentInterScenario.sourceLangCode;
    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith(isZh ? "zh" : "vi"));
    if (matched) u.voice = matched;
  }

  u.onstart = () => {
    isCabinTTSSpeaking = true;
    if (btn) btn.innerText = "⏸️ Đang phát (Bấm dừng)";
  };
  u.onend = () => {
    isCabinTTSSpeaking = false;
    if (btn) btn.innerText = "🔄 Nghe lại bài";
  };
  u.onerror = () => {
    isCabinTTSSpeaking = false;
    if (btn) btn.innerText = "▶️ Phát âm thanh";
  };

  window.speechSynthesis.speak(u);
}

function stopAllAudio() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  isCabinTTSSpeaking = false;

  const btn = document.getElementById("btnPlayAudio");
  if (btn) btn.innerText = "▶️ Phát âm thanh";
  const slider = document.getElementById("cabinAudioSlider");
  if (slider) slider.value = 0;
  const timeEl = document.getElementById("cabinAudioTime");
  if (timeEl) timeEl.innerText = "00:00 / 00:00";
}

function toggleRevealSpeech() {
  if (!currentInterScenario.sourceText) return;
  const revealedBox = document.getElementById("revealedSpeechText");
  const blindNotice = document.getElementById("speechBlindNotice");

  isSpeechRevealed = !isSpeechRevealed;
  if (isSpeechRevealed) {
    revealedBox.style.display = "block";
    blindNotice.style.display = "none";
    updateSentenceDrillUI();
  } else {
    revealedBox.style.display = "none";
    blindNotice.style.display = "flex";
  }
}

// 7. AI tạo đề mở rộng
async function requestAIInterpretTask() {
  stopAllAudio();
  const notice = document.getElementById("speechBlindNotice");
  const revealedBox = document.getElementById("revealedSpeechText");

  if (notice) notice.innerHTML = `<span class="blind-icon">⏳</span> <span>AI đang biên soạn đoạn văn mở rộng...</span>`;
  if (revealedBox) revealedBox.style.display = "none";
  isSpeechRevealed = false;

  const vocabSamples = currentInterScenario.vocabList.slice(0, 6);
  const zhVocabs = vocabSamples.map(v => v.zh).join(", ");
  const viVocabs = vocabSamples.map(v => `"${v.vi}"`).join(", ");

  let prompt = "";
  if (currentInterScenario.dir === "zh_to_vi") {
    prompt = `Bạn là diễn giả hội nghị quốc tế.
Chủ đề: [${currentInterScenario.lessonTitle}] - [${currentInterScenario.textTitle}].
Hãy phát biểu 1 đoạn ngắn bằng TIẾNG TRUNG (khoảng 3 câu ngắn, dưới 50 chữ Hán), phong cách ngoại giao trang trọng, có sử dụng các từ: [${zhVocabs}].
QUY TẮC: Chỉ trả về DUY NHẤT chữ Hán, không kèm pinyin hay giải thích.`;
  } else {
    prompt = `Bạn là đại diện ban tổ chức hội nghị Việt Nam.
Chủ đề: [${currentInterScenario.lessonTitle}] - [${currentInterScenario.textTitle}].
Hãy phát biểu 1 đoạn ngắn bằng TIẾNG VIỆT (khoảng 3 câu ngắn, dưới 50 từ), phong cách nghi thức, có dùng các từ: [${viVocabs}].
QUY TẮC: 100% tiếng Việt thuần túy, không chứa chữ Hán, không giải thích thêm.`;
  }

  try {
    const res = await callGemini(prompt);
    currentInterScenario.sourceText = res.trim();
    prepareCabinSentences();
    if (revealedBox) revealedBox.innerText = currentInterScenario.sourceText;
    if (notice) notice.innerHTML = '<span class="blind-icon">🔒</span> <span>Đã tạo kịch bản mới! Bấm "Phát âm thanh" để nghe.</span>';
    playSpeakerAudio();
  } catch (err) {
    if (notice) notice.innerHTML = `<span class="blind-icon">❌</span> <span>Lỗi tạo đề: ${err.message}</span>`;
  }
}

// 8. Thu âm giọng nói
let manualPrefixText = "";

function toggleSpeechRecording() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    showToast("Trình duyệt không hỗ trợ nhận diện giọng nói (Hãy dùng Chrome/Edge)!", "warning");
    return;
  }

  const btn = document.getElementById("btnToggleRecord");
  const tag = document.getElementById("recordingStatusTag");
  const txtArea = document.getElementById("interpretUserTranscript");

  if (isRecording) {
    isRecording = false;
    if (speechRecognizer) speechRecognizer.stop();
    stopRecordingUI();
    return;
  }

  try {
    speechRecognizer = new SpeechRec();
  } catch (e) {
    showToast("Không thể kết nối Micro!", "error");
    return;
  }

  speechRecognizer.continuous = true;
  speechRecognizer.interimResults = true;
  speechRecognizer.lang = currentInterScenario.targetLangCode;
  manualPrefixText = txtArea.value.trim();

  speechRecognizer.onstart = () => {
    isRecording = true;
    startCabinTimerIfNeeded();
    if (btn) btn.classList.add("active");
    const micText = document.getElementById("micBtnText");
    if (micText) micText.innerText = "ĐANG THU ÂM... (BẤM DỪNG)";
    if (tag) {
      tag.className = "status-tag recording";
      tag.innerText = "● Đang ghi âm giọng bạn...";
    }
  };

  speechRecognizer.onresult = (event) => {
    let finalPart = "";
    let interimPart = "";

    for (let i = 0; i < event.results.length; ++i) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        if (!finalPart.endsWith(chunk.trim())) {
          finalPart += chunk + " ";
        }
      } else {
        interimPart += chunk;
      }
    }

    const fullSpoken = (finalPart + interimPart).trim();
    txtArea.value = manualPrefixText ? (manualPrefixText + " " + fullSpoken) : fullSpoken;
    onInterTranscriptChanged();
  };

  speechRecognizer.onerror = (event) => {
    console.warn("Lỗi mic:", event.error);
    stopRecordingUI();
  };

  speechRecognizer.onend = () => {
    if (isRecording) {
      try { speechRecognizer.start(); } catch (e) { stopRecordingUI(); }
    } else {
      stopRecordingUI();
    }
  };

  try {
    speechRecognizer.start();
  } catch (err) {
    stopRecordingUI();
  }
}

function stopRecordingUI() {
  isRecording = false;
  const btn = document.getElementById("btnToggleRecord");
  const tag = document.getElementById("recordingStatusTag");
  if (btn) {
    btn.classList.remove("active");
    const micText = document.getElementById("micBtnText");
    if (micText) micText.innerText = "BẤM VÀO ĐỂ DỊCH (NÓI)";
  }
  if (tag) {
    tag.className = "status-tag idle";
    tag.innerText = "Đã dừng mic (có thể sửa tay)";
  }
}

// Kiểm tra thuật ngữ Cabin tức thì
function runLocalInterCheck() {
  const userSpeech = (document.getElementById("interpretUserTranscript")?.value || "").trim();
  if (!userSpeech) {
    showToast("Vui lòng nhập hoặc nói bản phiên dịch trước khi kiểm tra!", "warning");
    return;
  }

  const lower = userSpeech.toLowerCase();
  const matched = [];
  const missed = [];

  currentInterScenario.vocabList.forEach(v => {
    const cleanZh = v.zh.replace(/\.{2,}|…+/g, "").trim().toLowerCase();
    const cleanVi = v.vi.split(",")[0].trim().toLowerCase();
    if ((cleanZh && lower.includes(cleanZh)) || (cleanVi && lower.includes(cleanVi))) {
      matched.push(`${v.zh} (${v.vi})`);
    } else {
      missed.push(`${v.zh} (${v.vi})`);
    }
  });

  const ratio = currentInterScenario.vocabList.length > 0
    ? Math.round((matched.length / currentInterScenario.vocabList.length) * 100)
    : 100;

  const resBox = document.getElementById("interpretAIResult");
  resBox.innerHTML = `
    <div class="eval-score-header">
      <strong style="font-size: 15px; color: var(--primary-text);">⚡ Kiểm tra nhanh Thuật ngữ Cabin</strong>
      <span class="score-circle-badge" style="background: var(--primary);">Độ phủ: ${matched.length}/${currentInterScenario.vocabList.length} (${ratio}%)</span>
    </div>
    <div class="eval-formatted-body">
      <p><strong>✅ Thuật ngữ đã dịch (${matched.length}):</strong> ${matched.length ? matched.join(" • ") : "Chưa phát hiện thuật ngữ khớp trực tiếp."}</p>
      <p><strong>💡 Thuật ngữ gợi ý bổ sung (${missed.length}):</strong> ${missed.length ? missed.join(" • ") : "Đã bao phủ toàn bộ thuật ngữ bài khóa!"}</p>
      <p><strong>📜 Kịch bản gốc để đối chiếu:</strong><br>${currentInterScenario.sourceText}</p>
    </div>
  `;
  resBox.style.display = "block";
}

// 9. Gửi Gemini thẩm định bản dịch
async function submitInterpretationToAI() {
  const userSpeech = document.getElementById("interpretUserTranscript").value.trim();
  if (!userSpeech) {
    showToast("Vui lòng gõ nội dung dịch hoặc nói qua Micro!", "warning");
    return;
  }
  if (!currentInterScenario.sourceText) {
    showToast("Chưa có đề bài bài khóa!", "warning");
    return;
  }

  stopCabinTimer();
  const btn = document.getElementById("btnSubmitInterpret");
  const resBox = document.getElementById("interpretAIResult");
  btn.innerText = "⏳ AI đang thẩm định nghiệp vụ...";
  btn.disabled = true;

  const sourceLang = (currentInterScenario.dir === "zh_to_vi") ? "Tiếng Trung" : "Tiếng Việt";
  const targetLang = (currentInterScenario.dir === "zh_to_vi") ? "Tiếng Việt" : "Tiếng Trung";
  const standardTerms = currentInterScenario.vocabList.map(v => `${v.zh} (${v.vi})`).join(", ");

  const evalPrompt = `
Bạn là chuyên gia thẩm định Phiên dịch hội nghị (Interpreter Evaluator).
Chủ đề bài học: [${currentInterScenario.lessonTitle}] - [${currentInterScenario.textTitle}].
Bảng thuật ngữ chuẩn của bài: [${standardTerms}].

Đoạn văn gốc phát ra (${sourceLang}):
"${currentInterScenario.sourceText}"

Bản phiên dịch của học viên (${targetLang}):
"${userSpeech}"

Hãy thẩm định chi tiết:
1. Điểm số: .../10
2. Độ chính xác nội dung: Có truyền tải đúng các thông điệp cốt lõi, chức danh, hành động không?
3. Thuật ngữ & Mẫu câu: Học viên đã vận dụng đúng các thuật ngữ và kết cấu câu của bài chưa? Chỉ ra ưu điểm và lỗi sai cụ thể.
4. Bản dịch cabin tối ưu nhất: Đưa ra bản dịch chuẩn xác, tự nhiên, súc tích và trang trọng theo phong thái ngoại giao.
(Lưu ý: Nếu học viên dùng nhận diện giọng nói, hãy châm chước lỗi chính tả hoặc chữ đồng âm nhỏ).
`;

  try {
    const evaluation = await callGemini(evalPrompt);
    resBox.innerHTML = formatAIEvaluationHTML(evaluation, `Thẩm định Phiên Dịch Cabin (Thời gian: ${formatAudioSeconds(cabinTimerSeconds)})`);
    resBox.style.display = "block";

    const revText = document.getElementById("revealedSpeechText");
    const noticeBox = document.getElementById("speechBlindNotice");
    if (revText) revText.style.display = "block";
    if (noticeBox) noticeBox.style.display = "none";
    isSpeechRevealed = true;
    showToast("🎉 Đã hoàn tất thẩm định phiên dịch!", "success");
  } catch (err) {
    showToast("Lỗi kết nối AI: " + err.message, "error");
    runLocalInterCheck();
  } finally {
    btn.innerText = "⚖️ Gửi AI Thẩm Định Phiên Dịch";
    btn.disabled = false;
  }
}
