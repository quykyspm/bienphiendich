/* ==========================================================================
   PHÂN HỆ PHÒNG LUYỆN PHIÊN DỊCH (INTERPRETATION LAB)
   Nạp độc lập từ curriculum_pd.json & Audio MP3 trường
   ========================================================================== */

let pdDB = null;
let currentInterLessonId = "bai1";
let currentInterTextId = "text1";
let currentInterPracticeMode = "book"; // 'book' (MP3 gốc) hoặc 'ai_generate' (AI tạo)
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

// 1. Tải dữ liệu từ file curriculum_pd.json
async function loadInterpretationDatabase() {
  const notice = document.getElementById("speechBlindNotice");
  try {
    const res = await fetch("curriculum_pd.json?t=" + Date.now());
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - Không thể tải file từ server`);
    }
    const text = await res.text();
    pdDB = JSON.parse(text);
    renderInterLessonChips();
  } catch (err) {
    console.error("Chi tiết lỗi curriculum_pd.json:", err);
    if (notice) {
      notice.innerHTML = `<span class="blind-icon">⚠️</span> <span>Lỗi: ${err.message}</span>`;
    }
  }
}
window.addEventListener("DOMContentLoaded", loadInterpretationDatabase);

// 2. Render danh sách các bài học (Bài 1 -> 6 sáng đèn, Bài 7 -> 12 mờ/khóa)
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
        alert("Bài học này đang được bổ sung nội dung bài khóa!");
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
  btnEl.classList.add("active");
  selectedInterRate = parseFloat(btn.getAttribute("data-val")) || 1.0;
  if (audioElement) audioElement.playbackRate = selectedInterRate;
}

// 5. Nạp bài khóa & cấu hình âm thanh
async function loadCurrentInterExercise() {
  if (!pdDB) return;

  // Dừng phát âm thanh cũ nếu đang chạy
  stopAllAudio();

  const lesson = pdDB[currentInterLessonId];
  if (!lesson || !lesson.texts) return;

  const textObj = lesson.texts.find(t => t.id === currentInterTextId) || lesson.texts[0];

  currentInterScenario.lessonTitle = lesson.lessonTitle;
  currentInterScenario.textTitle = textObj.titleVi || textObj.title;
  currentInterScenario.vocabList = textObj.vocabulary || [];
  currentInterScenario.patternList = textObj.patterns || [];
  currentInterScenario.dir = textObj.direction;

  // Lấy số thứ tự bài và bài khóa để khớp tên file mp3
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

  renderInterVocabReference(textObj);

  // Reset cabin làm bài
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

// Hiển thị khung từ vựng tham khảo
function renderInterVocabReference(textObj) {
  const box = document.getElementById("interpretVocabRefBox");
  const content = document.getElementById("interpretVocabRefContent");
  if (!box || !content) return;

  if (!textObj.vocabulary || textObj.vocabulary.length === 0) {
    box.style.display = "none";
    return;
  }

  box.style.display = "block";
  let html = "<div><strong>Thuật ngữ bài:</strong> ";
  textObj.vocabulary.forEach(v => {
    html += `<span class="vocab-badge">${v.zh} (${v.vi})</span>`;
  });
  html += "</div>";

  if (textObj.patterns && textObj.patterns.length > 0) {
    html += "<div style='margin-top:6px;'><strong>Mẫu câu:</strong> ";
    textObj.patterns.forEach(p => {
      html += `<span class="vocab-badge">${p.structure}</span>`;
    });
    html += "</div>";
  }
  content.innerHTML = html;
}

function toggleInterpretVocabRef() {
  const content = document.getElementById("interpretVocabRefContent");
  if (content) content.style.display = (content.style.display === "none") ? "block" : "none";
}

// ==========================================================================
// 6. Phát âm thanh (MP3 gốc, Doubao TTS hoặc Web Speech)
// ==========================================================================

let doubaoAudioElement = new Audio();

async function playSpeakerAudio() {
  const btn = document.getElementById("btnPlayAudio");
  const voiceSelect = document.getElementById("selectVoiceType");
  const selectedVoice = voiceSelect ? voiceSelect.value : "doubao_yangguang";

  if (currentInterPracticeMode === "book") {
    // PHÁT FILE MP3 TRƯỜNG
    if (!audioElement.paused && audioElement.src.includes(currentInterScenario.audioSrc)) {
      audioElement.pause();
      if (btn) btn.innerText = "▶️ Tiếp tục nghe";
      return;
    }

    audioElement.src = currentInterScenario.audioSrc;
    audioElement.playbackRate = selectedInterRate;
    audioElement.play().then(() => {
      if (btn) btn.innerText = "⏸️ Tạm dừng";
    }).catch(err => {
      console.warn("Không tìm thấy file MP3 cục bộ, chuyển sang TTS tự động:", err);
      routeTTS(currentInterScenario.sourceText, selectedVoice, btn);
    });

    audioElement.onended = () => {
      if (btn) btn.innerText = "🔄 Nghe lại bài";
    };
  } else {
    // PHÁT ĐỀ DO AI TẠO BẰNG TTS
    routeTTS(currentInterScenario.sourceText, selectedVoice, btn);
  }
}

async function routeTTS(text, selectedVoice, btn) {
  if (!text) return;

  if (!doubaoAudioElement.paused) {
    doubaoAudioElement.pause();
    if (btn) btn.innerText = "▶️ Phát âm thanh";
    return;
  }

  // Nếu chọn Doubao và là bài tiếng Trung
  if (currentInterScenario.sourceLangCode === "zh-CN" && selectedVoice.startsWith("doubao")) {
    const speakerId = (selectedVoice === "doubao_taozi") 
      ? "zh_female_taozi_conversation_v4_wvae_bigtts" 
      : "zh_male_yangguang_conversation_v4_wvae_bigtts";

    try {
      if (btn) btn.innerText = "⏳ Đang tải giọng Doubao...";
      
      const response = await fetch("https://gemini-api-backend-rho.vercel.app/api/doubao-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, speaker: speakerId })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob || blob.size < 1000) {
        throw new Error(`Dữ liệu âm thanh rỗng (${blob.size} bytes)`);
      }

      const audioBlob = new Blob([blob], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      doubaoAudioElement.src = audioUrl;
      doubaoAudioElement.playbackRate = selectedInterRate;
      
      doubaoAudioElement.onplay = () => { if (btn) btn.innerText = "⏸️ Đang phát (Doubao)"; };
      doubaoAudioElement.onended = () => { if (btn) btn.innerText = "🔄 Nghe lại bài"; };

      await doubaoAudioElement.play();
      return;
    } catch (err) {
      console.warn("Lỗi kết nối Doubao TTS, chuyển về giọng mặc định:", err);
    }
  }

  // Fallback về giọng đọc trình duyệt
  playFallbackTTS(text);
}

function playFallbackTTS(text) {
  if (!window.speechSynthesis) return alert("Trình duyệt không hỗ trợ phát âm thanh!");
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = currentInterScenario.sourceLangCode;
  u.rate = selectedInterRate;

  const voices = window.speechSynthesis.getVoices();
  const isZh = (currentInterScenario.sourceLangCode === "zh-CN");
  const matched = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(isZh ? "zh" : "vi"));
  if (matched) u.voice = matched;

  const btn = document.getElementById("btnPlayAudio");
  u.onstart = () => { if (btn) btn.innerText = "⏸️ Đang phát..."; };
  u.onend = () => { if (btn) btn.innerText = "🔄 Nghe lại bài"; };

  window.speechSynthesis.speak(u);
}

function stopAllAudio() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
  if (doubaoAudioElement) {
    doubaoAudioElement.pause();
    doubaoAudioElement.currentTime = 0;
  }
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

// 7. AI tạo đề mở rộng
async function requestAIInterpretTask() {
  stopAllAudio();
  const notice = document.getElementById("speechBlindNotice");
  const revealedBox = document.getElementById("revealedSpeechText");
  
  notice.innerHTML = `<span class="blind-icon">⏳</span> <span>AI đang biên soạn đoạn văn mở rộng...</span>`;
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

/* ================= 8. THU ÂM GIỌNG NÓI (CHỐNG LẶP TIẾNG VIỆT & ANDROID) ================= */
let manualPrefixText = ""; // Lưu văn bản đã có sẵn trước khi bấm mic

function toggleSpeechRecording() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert("Trình duyệt không hỗ trợ Web Speech API hoặc đang mở qua app khác.\nVui lòng mở bằng Chrome hoặc bật Đọc chính tả (Dictation) trên Safari!");
    return;
  }

  const btn = document.getElementById("btnToggleRecord");
  const tag = document.getElementById("recordingStatusTag");
  const txtArea = document.getElementById("interpretUserTranscript");

  if (isRecording) {
    isRecording = false;
    if (speechRecognizer) {
      speechRecognizer.stop();
    }
    stopRecordingUI();
    return;
  }

  try {
    speechRecognizer = new SpeechRec();
  } catch (e) {
    alert("Không thể kết nối Micro. Hãy kiểm tra quyền truy cập micro trên trình duyệt!");
    return;
  }

  speechRecognizer.continuous = true;
  speechRecognizer.interimResults = true;
  speechRecognizer.lang = currentInterScenario.targetLangCode;

  // Lưu lại phần chữ người dùng đã gõ trước đó (nếu có)
  manualPrefixText = txtArea.value.trim();

  speechRecognizer.onstart = () => {
    isRecording = true;
    btn.classList.add("active");
    document.getElementById("micBtnText").innerText = "ĐANG THU ÂM... (BẤM DỪNG)";
    tag.className = "status-tag recording";
    tag.innerText = "● Đang ghi âm giọng bạn...";
  };

  // THUẬT TOÁN TÁI TẠO VĂN BẢN DUY NHẤT - TRIỆT TIÊU LẶP CÂU
  speechRecognizer.onresult = (event) => {
    let finalPart = "";
    let interimPart = "";

    for (let i = 0; i < event.results.length; ++i) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        // Chỉ ghép nếu đoạn text này chưa bị trùng với đoạn liền trước
        if (!finalPart.endsWith(chunk.trim())) {
          finalPart += chunk + " ";
        }
      } else {
        interimPart += chunk;
      }
    }

    // Xử lý đặc thù Android: Nếu đoạn sau chứa toàn bộ đoạn trước thì chỉ lấy đoạn dài nhất
    let fullSpoken = (finalPart + interimPart).trim();
    if (manualPrefixText) {
      txtArea.value = manualPrefixText + " " + fullSpoken;
    } else {
      txtArea.value = fullSpoken;
    }
  };

  speechRecognizer.onerror = (event) => {
    console.warn("Lỗi mic:", event.error);
    if (event.error === 'not-allowed') {
      alert("Bạn chưa cấp quyền truy cập Micro trên trình duyệt!");
      stopRecordingUI();
    }
  };

  speechRecognizer.onend = () => {
    if (isRecording) {
      try {
        speechRecognizer.start();
      } catch (e) {
        stopRecordingUI();
      }
    } else {
      stopRecordingUI();
    }
  };

  try {
    speechRecognizer.start();
  } catch (err) {
    console.error("Không thể khởi động mic:", err);
    stopRecordingUI();
  }
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
// 9. Gửi Gemini thẩm định bản dịch
async function submitInterpretationToAI() {
  const userSpeech = document.getElementById("interpretUserTranscript").value.trim();
  if (!userSpeech) return alert("Vui lòng gõ nội dung dịch hoặc nói qua Micro!");
  if (!currentInterScenario.sourceText) return alert("Chưa có đề bài bài khóa!");

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

    // Mở bản gốc cho học viên đối chiếu
    document.getElementById("revealedSpeechText").style.display = "block";
    document.getElementById("speechBlindNotice").style.display = "none";
    isSpeechRevealed = true;
  } catch (err) {
    alert("Lỗi thẩm định: " + err.message);
  } finally {
    btn.innerText = "⚖️ Gửi AI Thẩm Định Phiên Dịch";
    btn.disabled = false;
  }
}
