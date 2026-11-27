/* ==========================================================================
   PHÂN HỆ PHÒNG LUYỆN PHIÊN DỊCH (INTERPRETATION LAB)
   Nạp độc lập từ curriculum_pd.json & Audio MP3 trường + Tích hợp QR từng từ
   ========================================================================== */

let pdDB = null;
let currentInterLessonId = "bai1";
let currentInterTextId = "text1";
let currentInterPracticeMode = "book";
let selectedInterRate = 1.0;

let currentInterScenario = {
  sourceText: "",
  sourceLangCode: "zh-CN",
  targetLangCode: "vi-VN",
  dir: "zh_to_vi",
  lessonTitle: "",
  textTitle: "",
  audioSrc: "",
  vocabList: [],
  patternList: []
};

let audioElement = new Audio();
let isSpeechRevealed = false;
let speechRecognizer = null;
let isRecording = false;

async function loadInterpretationDatabase() {
  const notice = document.getElementById("speechBlindNotice");
  try {
    if (window.EMBEDDED_CURRICULUM_PD) {
      pdDB = window.EMBEDDED_CURRICULUM_PD;
    } else {
      const res = await fetch("curriculum_pd.json?t=" + Date.now());
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - Không thể tải file từ server`);
      }
      const text = await res.text();
      pdDB = JSON.parse(text);
    }
    renderInterLessonChips();

    if (window.FlashcardQR && typeof window.FlashcardQR.initPool === "function") {
      window.FlashcardQR.initPool(typeof curriculumDB !== "undefined" ? curriculumDB : null, pdDB);
    }
  } catch (err) {
    console.error("Chi tiết lỗi curriculum_pd.json:", err);
    if (notice) {
      notice.innerHTML = `<span class="blind-icon">⚠️</span> <span>Lỗi: ${err.message}</span>`;
    }
  }
}
window.addEventListener("DOMContentLoaded", loadInterpretationDatabase);

function renderInterLessonChips() {
  const container = document.getElementById("interpretTopicsContainer");
  if (!container || !pdDB) return;

  container.innerHTML = "";
  Object.keys(pdDB).forEach((key) => {
    const lesson = pdDB[key];
    const chip = document.createElement("button");
    const isAvailable = lesson.texts && lesson.texts[0] && lesson.texts[0].originalText !== "";

    chip.className = `topic-chip ${key === currentInterLessonId ? "active" : ""}`;
    if (!isAvailable) {
      chip.style.opacity = "0.5";
      chip.innerText = `${lesson.lessonTitle.split("(")[0].trim()} (Sắp có)`;
    } else {
      chip.innerText = lesson.lessonTitle.split("(")[0].trim();
    }

    chip.onclick = () => {
      if (!isAvailable) {
        if (typeof showToast === "function") showToast("Bài học này đang được bổ sung nội dung bài khóa!", "info");
        return;
      }
      selectInterLesson(key, chip);
    };
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
  if (btn) btn.classList.add("active");
  selectedInterRate = parseFloat(btn.getAttribute("data-val")) || 1.0;
  if (audioElement) audioElement.playbackRate = selectedInterRate;
}

async function loadCurrentInterExercise() {
  if (!pdDB) return;

  stopAllAudio();

  const lesson = pdDB[currentInterLessonId];
  if (!lesson || !lesson.texts) return;

  const textObj = lesson.texts.find(t => t.id === currentInterTextId) || lesson.texts[0];

  currentInterScenario.lessonTitle = lesson.lessonTitle;
  currentInterScenario.textTitle = textObj.titleVi || textObj.title;
  currentInterScenario.vocabList = textObj.vocabulary || [];
  currentInterScenario.patternList = textObj.patterns || [];
  currentInterScenario.dir = textObj.direction;

  const lessonNum = lesson.lessonNumber || parseInt(currentInterLessonId.replace("bai", ""), 10) || 1;
  const textNum = parseInt(textObj.id.replace("text", ""), 10) || 1;
  currentInterScenario.audioSrc = `audio/bai${lessonNum}_baikhoa${textNum}.mp3`;

  if (textObj.direction === "zh_to_vi") {
    currentInterScenario.sourceLangCode = "zh-CN";
    currentInterScenario.targetLangCode = "vi-VN";
    document.getElementById("speakerRoleTag").innerText = `🎙️ [🇨🇳 ➔ 🇻🇳] ${currentInterScenario.textTitle}`;
    document.getElementById("interpretDeskTitle").innerText = "Bản dịch tiếng Việt của bạn:";
  } else {
    currentInterScenario.sourceLangCode = "vi-VN";
    currentInterScenario.targetLangCode = "zh-CN";
    document.getElementById("speakerRoleTag").innerText = `🎙️ [🇻🇳 ➔ 🇨🇳] ${currentInterScenario.textTitle}`;
    document.getElementById("interpretDeskTitle").innerText = "Bản dịch tiếng Trung của bạn:";
  }

  renderInterVocabReference(textObj, `Bài ${lessonNum}`);

  document.getElementById("interpretUserTranscript").value = "";
  document.getElementById("interpretAIResult").style.display = "none";
  isSpeechRevealed = false;
  document.getElementById("revealedSpeechText").style.display = "none";
  document.getElementById("speechBlindNotice").style.display = "flex";

  if (currentInterPracticeMode === "book") {
    currentInterScenario.sourceText = textObj.originalText || "";
    document.getElementById("revealedSpeechText").innerText = currentInterScenario.sourceText;
    document.getElementById("speechBlindNotice").innerHTML = '<span class="blind-icon">🔒</span> <span>Bài khóa đã sẵn sàng! Bấm "Phát âm thanh" để nghe.</span>';
  } else {
    requestAIInterpretTask();
  }
}

function renderInterVocabReference(textObj, lessonLabel) {
  const box = document.getElementById("interpretVocabRefBox");
  const content = document.getElementById("interpretVocabRefContent");
  if (!box || !content) return;

  if (!textObj.vocabulary || textObj.vocabulary.length === 0) {
    box.style.display = "none";
    return;
  }

  box.style.display = "block";
  content.innerHTML = "";

  const vocabRow = document.createElement("div");
  const vTitle = document.createElement("strong");
  vTitle.textContent = "Thuật ngữ bài (bấm từng từ xem mã QR): ";
  vocabRow.appendChild(vTitle);

  textObj.vocabulary.forEach(v => {
    const badge = document.createElement("span");
    badge.className = "vocab-badge clickable-qr";
    badge.title = "Bấm để xem mã QR & phát âm";
    badge.innerHTML = `<span>${v.zh} (${v.vi})</span><span class="vocab-qr-tag">📱</span>`;
    badge.onclick = () => {
      if (window.FlashcardQR) {
        window.FlashcardQR.openByParts(v.zh, v.pinyin, v.vi, lessonLabel, "Phiên dịch");
      }
    };
    vocabRow.appendChild(badge);
  });
  content.appendChild(vocabRow);

  if (textObj.patterns && textObj.patterns.length > 0) {
    const patRow = document.createElement("div");
    patRow.style.marginTop = "6px";
    const pTitle = document.createElement("strong");
    pTitle.textContent = "Mẫu câu: ";
    patRow.appendChild(pTitle);
    textObj.patterns.forEach(p => {
      const badge = document.createElement("span");
      badge.className = "vocab-badge";
      badge.textContent = p.structure;
      patRow.appendChild(badge);
    });
    content.appendChild(patRow);
  }
}

function toggleInterpretVocabRef() {
  const content = document.getElementById("interpretVocabRefContent");
  if (content) content.style.display = (content.style.display === "none") ? "block" : "none";
}
window.toggleInterVocabRef = toggleInterpretVocabRef;

function playSpeakerAudio() {
  const btn = document.getElementById("btnPlayAudio");

  if (currentInterPracticeMode === "book" && !window.EMBEDDED_CURRICULUM_PD) {
    if (!audioElement.paused && audioElement.src.includes(currentInterScenario.audioSrc)) {
      audioElement.pause();
      btn.innerText = "▶️ Tiếp tục nghe";
      return;
    }

    audioElement.src = currentInterScenario.audioSrc;
    audioElement.playbackRate = selectedInterRate;
    audioElement.play().then(() => {
      btn.innerText = "⏸️ Tạm dừng";
    }).catch(() => {
      playFallbackTTS(currentInterScenario.sourceText);
    });

    audioElement.onended = () => {
      btn.innerText = "🔄 Nghe lại bài";
    };
  } else {
    playFallbackTTS(currentInterScenario.sourceText);
  }
}

function playFallbackTTS(text) {
  if (!window.speechSynthesis) {
    if (typeof showToast === "function") showToast("Trình duyệt không hỗ trợ phát âm thanh!", "error");
    return;
  }
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = currentInterScenario.sourceLangCode;
  u.rate = selectedInterRate;

  const voices = window.speechSynthesis.getVoices();
  const isZh = (currentInterScenario.sourceLangCode === "zh-CN");
  const matched = voices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith(isZh ? "zh" : "vi"));
  if (matched) u.voice = matched;

  window.speechSynthesis.speak(u);
}

function stopAllAudio() {
  if (audioElement) audioElement.pause();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  const btn = document.getElementById("btnPlayAudio");
  if (btn) btn.innerText = "▶️ Phát âm thanh";
}

function toggleRevealSpeech() {
  if (!currentInterScenario.sourceText) return;
  const revealedBox = document.getElementById("revealedSpeechText");
  const blindNotice = document.getElementById("speechBlindNotice");

  isSpeechRevealed = !isSpeechRevealed;
  if (isSpeechRevealed) {
    revealedBox.style.display = "block";
    blindNotice.style.display = "none";
  } else {
    revealedBox.style.display = "none";
    blindNotice.style.display = "flex";
  }
}

async function requestAIInterpretTask() {
  stopAllAudio();
  const notice = document.getElementById("speechBlindNotice");
  const revealedBox = document.getElementById("revealedSpeechText");

  notice.innerHTML = '<span class="blind-icon">⏳</span> <span>AI đang biên soạn đoạn văn mở rộng...</span>';
  revealedBox.style.display = "none";
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
    revealedBox.innerText = currentInterScenario.sourceText;
    notice.innerHTML = '<span class="blind-icon">🔒</span> <span>Đã tạo kịch bản mới! Bấm "Phát âm thanh" để nghe.</span>';
    playSpeakerAudio();
  } catch (err) {
    notice.innerHTML = `<span class="blind-icon">❌</span> <span>Lỗi tạo đề: ${err.message}</span>`;
  }
}

function toggleSpeechRecording() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    if (typeof showToast === "function") showToast("Trình duyệt không hỗ trợ Web Speech API. Bạn có thể gõ trực tiếp vào ô văn bản!", "info");
    return;
  }

  const btn = document.getElementById("btnToggleRecord");
  const tag = document.getElementById("recordingStatusTag");
  const txtArea = document.getElementById("interpretUserTranscript");

  if (isRecording) {
    if (speechRecognizer) speechRecognizer.stop();
    return;
  }

  speechRecognizer = new SpeechRec();
  speechRecognizer.continuous = true;
  speechRecognizer.interimResults = true;
  speechRecognizer.lang = currentInterScenario.targetLangCode;

  speechRecognizer.onstart = () => {
    isRecording = true;
    btn.classList.add("active");
    document.getElementById("micBtnText").innerText = "ĐANG THU ÂM... (BẤM DỪNG)";
    tag.className = "status-tag recording";
    tag.innerText = "● Đang ghi âm giọng bạn...";
  };

  speechRecognizer.onresult = (event) => {
    let finalTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript) {
      txtArea.value = (txtArea.value + " " + finalTranscript).trim();
    }
  };

  speechRecognizer.onerror = () => stopRecordingUI();
  speechRecognizer.onend = () => stopRecordingUI();
  speechRecognizer.start();
}

function stopRecordingUI() {
  isRecording = false;
  const btn = document.getElementById("btnToggleRecord");
  const tag = document.getElementById("recordingStatusTag");
  if (btn) {
    btn.classList.remove("active");
    document.getElementById("micBtnText").innerText = "BẤM VÀO ĐỂ DỊCH (NÓI)";
  }
  if (tag) {
    tag.className = "status-tag idle";
    tag.innerText = "Đã dừng mic (có thể sửa tay)";
  }
}

async function submitInterpretationToAI() {
  const userSpeech = document.getElementById("interpretUserTranscript").value.trim();
  if (!userSpeech) return showToast("Vui lòng gõ nội dung dịch hoặc nói qua Micro!", "error");
  if (!currentInterScenario.sourceText) return showToast("Chưa có đề bài bài khóa!", "error");

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
    resBox.innerText = evaluation;
    resBox.style.display = "block";

    document.getElementById("revealedSpeechText").style.display = "block";
    document.getElementById("speechBlindNotice").style.display = "none";
    isSpeechRevealed = true;
  } catch (err) {
    showToast("Lỗi thẩm định: " + err.message, "error");
  } finally {
    btn.innerText = "⚖️ Gửi AI Thẩm Định Phiên Dịch";
    btn.disabled = false;
  }
}
