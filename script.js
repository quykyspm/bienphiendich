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

// Chuyển đổi giữa 2 Môn học: Biên Dịch & Phiên Dịch
function switchSubject(subjectKey, displayName, clickedEl) {
  const label = document.getElementById("currentActiveTabLabel");
  if (label) label.innerText = displayName;

  document.querySelectorAll(".menu-nav-option").forEach(opt => opt.classList.remove("active"));
  if (clickedEl && clickedEl.classList) {
    clickedEl.classList.add("active");
  } else if (typeof event !== "undefined" && event && event.currentTarget) {
    event.currentTarget.classList.add("active");
  }

  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
  const activeTabEl = document.getElementById(`tab-${subjectKey}`);
  if (activeTabEl) activeTabEl.classList.add("active");

  const dropdown = document.getElementById("menuDropdownBox");
  if (dropdown) dropdown.classList.remove("show");

  // Kích hoạt dữ liệu mặc định khi vừa vào môn
  if (subjectKey === 'biendich') {
    switchBiendichSubTab('trans');
  } else if (subjectKey === 'phiendich') {
    switchPhiendichSubTab('cabin');
    if (typeof loadCurrentInterExercise === "function" && typeof pdDB !== "undefined" && pdDB) {
      loadCurrentInterExercise();
    }
  }
}

// Chuyển Tab con môn Biên Dịch (Dịch văn bản <-> Luyện viết)
function switchBiendichSubTab(tab) {
  const isTrans = (tab === 'trans');
  document.getElementById("biendichSubTrans").style.display = isTrans ? "block" : "none";
  document.getElementById("biendichSubWrite").style.display = isTrans ? "none" : "block";
  
  document.getElementById("btnBiendichTrans").classList.toggle("active", isTrans);
  document.getElementById("btnBiendichWrite").classList.toggle("active", !isTrans);

  if (!isTrans && activeWords.length === 0) {
    applyFilters();
  }
}

// Chuyển Tab con môn Phiên Dịch (Cabin dịch nói <-> Luyện nghe)
function switchPhiendichSubTab(tab) {
  const isCabin = (tab === 'cabin');
  document.getElementById("phiendichSubCabin").style.display = isCabin ? "block" : "none";
  document.getElementById("phiendichSubListen").style.display = isCabin ? "none" : "block";

  document.getElementById("btnPhiendichCabin").classList.toggle("active", isCabin);
  document.getElementById("btnPhiendichListen").classList.toggle("active", !isCabin);

  if (!isCabin && !currentListenWord) {
    setupListenQuestion();
  }
}

/* ================= BỘ GIỌNG ĐỌC DIỄN GIẢ ================= */
let availableVoices = [];
function initVoiceList() {
  if (!window.speechSynthesis) return;
  availableVoices = window.speechSynthesis.getVoices();
}
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = initVoiceList;
}

function playDiplomaticSpeech(text, lang = 'zh-CN') {
  if (!window.speechSynthesis) return alert("Trình duyệt không hỗ trợ phát âm!");
  window.speechSynthesis.cancel();
  
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  u.pitch = 0.95;

  if (availableVoices.length === 0) availableVoices = window.speechSynthesis.getVoices();
  const matchedVoice = availableVoices.find(v => v.lang.startsWith(lang.split('-')[0]) && (v.name.includes("Natural") || v.name.includes("Neural")));
  if (matchedVoice) u.voice = matchedVoice;

  window.speechSynthesis.speak(u);
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

/* ================= LOGIC NẠP JSON & LUYỆN VIẾT (KHÔNG DÙNG EXCEL) ================= */
let allWords = [], activeWords = [], currentIndex = 0, canvasInstances = [];
const memorizedWords = new Map(), needReviewWords = new Map();

// Hàm xáo bài ngẫu nhiên chuẩn (Fisher-Yates) - Chống lặp từ 100%
function shuffleWords(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 1. Thay thế autoLoadExcel bằng hàm nạp trực tiếp từ curriculum_db.json
async function autoLoadExcel() {
  try {
    const res = await fetch("curriculum_db.json?t=" + Date.now());
    const data = await res.json();
    
    allWords = [];
    if (data && data.translation) {
      Object.keys(data.translation).forEach(k => {
        const lesson = data.translation[k];
        const lessonNum = lesson.lessonNumber || parseInt(k.replace("bai", ""), 10) || 1;
        (lesson.texts || []).forEach(txt => {
          (txt.vocabulary || []).forEach(v => {
            allWords.push({
              hanzi: v.zh,
              pinyin: v.pinyin,
              vn: v.vi,
              lesson: `Bài ${lessonNum}`
            });
          });
        });
      });
    }

    setupLessonDropdown();
    applyFilters();
  } catch(e) {
    document.getElementById("prompt-vn").innerText = "Lỗi: Không tìm thấy file curriculum_db.json";
  }
}

function setupLessonDropdown() {
  const lessons = [...new Set(allWords.map(w => w.lesson).filter(Boolean))];
  const s1 = document.getElementById("lessonFilter");
  const s2 = document.getElementById("aiLessonFilter");
  const s3 = document.getElementById("listenLessonFilter");

  const optionAll = '<option value="all">Tất cả các bài</option>';
  if (s1) s1.innerHTML = optionAll;
  if (s2) s2.innerHTML = optionAll;
  if (s3) s3.innerHTML = optionAll;

  lessons.forEach(l => {
    const opt = `<option value="${l}">${l}</option>`;
    if (s1) s1.innerHTML += opt;
    if (s2) s2.innerHTML += opt;
    if (s3) s3.innerHTML += opt;
  });
}

// 2. Lọc danh sách và xử lý ngẫu nhiên không trùng lặp
function applyFilters() {
  const lEl = document.getElementById("lessonFilter");
  const mEl = document.getElementById("modeFilter");
  const limEl = document.getElementById("limitFilter");

  const l = lEl ? lEl.value : "all";
  // Mặc định luôn là "random" nếu chưa chọn
  const m = mEl ? mEl.value : "random";
  const lim = limEl ? limEl.value : "all";

  let list = (l === "all") ? [...allWords] : allWords.filter(w => String(w.lesson) === l);

  // Xáo trộn toàn bộ danh sách 1 lần duy nhất (như xáo cỗ bài)
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
    document.getElementById("prompt-vn").innerText = "Không có từ vựng phù hợp!";
    document.getElementById("boxesContainer").innerHTML = "";
  }
}

function loadWord(idx) {
  if (activeWords.length === 0) return;
  const item = activeWords[idx];
  document.getElementById("prompt-vn").innerText = `${item.lesson ? '['+item.lesson+'] ' : ''}Viết: "${item.vn || ''}"`;
  document.getElementById("prompt-pinyin").innerText = `[ ${item.pinyin || ''} ]`;
  document.getElementById("prompt-pinyin").style.display = "none";
  document.getElementById("result-msg").innerText = "";
  setupCanvas(String(item.hanzi).trim());
}

function togglePinyin() {
  const p = document.getElementById("prompt-pinyin");
  p.style.display = p.style.display === "none" ? "inline" : "none";
}

function setupCanvas(word) {
  const container = document.getElementById("boxesContainer");
  container.innerHTML = "";
  canvasInstances = [];
  for (let i = 0; i < word.length; i++) {
    const wrap = document.createElement("div"); wrap.className = "box-wrapper";
    const cBox = document.createElement("div"); cBox.className = "canvas-container";
    const cv = document.createElement("canvas"); cv.width = 180; cv.height = 180;
    const btn = document.createElement("button"); btn.className = "btn-clear-single";
    btn.innerText = `Xóa ô ${i+1}`; btn.onclick = () => clearBox(i);

    cBox.appendChild(cv); wrap.appendChild(cBox); wrap.appendChild(btn); container.appendChild(wrap);
    const ctx = cv.getContext("2d");
    ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1e293b";

    const st = { char: word[i], cv, ctx, cBox, strokes: [], sx: [], sy: [], st: [], drawing: false, t0: 0 };
    initCanvasEvents(st);
    canvasInstances.push(st);
  }
}

function initCanvasEvents(st) {
  const getCoord = e => {
    const r = st.cv.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    return [Math.round(x - r.left), Math.round(y - r.top)];
  };
  const down = e => {
    st.drawing = true; st.t0 = Date.now();
    const [x, y] = getCoord(e); st.ctx.beginPath(); st.ctx.moveTo(x, y);
    st.sx = [x]; st.sy = [y]; st.st = [0];
  };
  const move = e => {
    if (!st.drawing) return; e.preventDefault();
    const [x, y] = getCoord(e); st.ctx.lineTo(x, y); st.ctx.stroke();
    st.sx.push(x); st.sy.push(y); st.st.push(Date.now() - st.t0);
  };
  const up = () => {
    if (!st.drawing) return; st.drawing = false;
    st.strokes.push([st.sx, st.sy, st.st]);
  };
  st.cv.addEventListener("mousedown", down); st.cv.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  st.cv.addEventListener("touchstart", down, {passive:false}); st.cv.addEventListener("touchmove", move, {passive:false}); window.addEventListener("touchend", up);
}

function clearBox(i) {
  const s = canvasInstances[i];
  s.ctx.clearRect(0, 0, 180, 180);
  s.strokes = []; s.cBox.classList.remove("correct", "wrong");
}

function clearAllBoxes() {
  for (let i = 0; i < canvasInstances.length; i++) clearBox(i);
  document.getElementById("result-msg").innerText = "";
}

async function checkAllBoxes() {
  const msg = document.getElementById("result-msg");
  msg.innerText = "Đang kiểm tra nét...";
  let ok = true, empty = false;

  for (let s of canvasInstances) {
    if (s.strokes.length === 0) { s.cBox.classList.add("wrong"); empty = true; ok = false; continue; }
    const p = {
      app_version: 0.4, api_level: "537.36", device: "5.0", input_type: "0", options: "enable_pre_space",
      requests: [{ writing_guide: { writing_area_width: 180, writing_area_height: 180 }, pre_context: "", max_num_results: 10, max_completions: 0, language: "zh-t-i0-handwrit", ink: s.strokes }]
    };
    try {
      const res = await fetch("https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p)
      });
      const d = await res.json();
      const cand = d[0] === "SUCCESS" ? d[1][0][1] : [];
      if (cand.includes(s.char)) { s.cBox.classList.remove("wrong"); s.cBox.classList.add("correct"); }
      else { s.cBox.classList.remove("correct"); s.cBox.classList.add("wrong"); ok = false; }
    } catch(e) { ok = false; }
  }

  const cur = activeWords[currentIndex];
  if (empty) { msg.className = "msg-wrong"; msg.innerText = "Chưa viết đủ ô!"; }
  else if (ok) {
    msg.className = "msg-correct"; msg.innerText = `Chính xác! (${cur.hanzi})`;
    memorizedWords.set(cur.hanzi, cur); needReviewWords.delete(cur.hanzi);
  } else {
    msg.className = "msg-wrong"; msg.innerText = "Có chữ chưa đúng!";
    if (!memorizedWords.has(cur.hanzi)) needReviewWords.set(cur.hanzi, cur);
  }
  renderStats();
}

function renderStats() {
  const cL = document.getElementById("correct-list"); cL.innerHTML = "";
  memorizedWords.forEach(w => cL.innerHTML += `<div><strong>${w.hanzi}</strong>: ${w.vn}</div>`);
  document.getElementById("correct-count").innerText = memorizedWords.size;

  const wL = document.getElementById("wrong-list"); wL.innerHTML = "";
  needReviewWords.forEach(w => wL.innerHTML += `<div><strong>${w.hanzi}</strong>: ${w.vn}</div>`);
  document.getElementById("wrong-count").innerText = needReviewWords.size;
}

// 3. Sửa hàm nextWord: Đi hết danh sách mới thông báo và xáo lượt mới (không lặp lại giữa chừng)
function nextWord() {
  if (activeWords.length === 0) return;
  currentIndex++;
  
  if (currentIndex >= activeWords.length) {
    alert("🎉 Bạn đã luyện viết hết tất cả các từ trong lượt này!");
    applyFilters(); // Xáo trộn lại một lượt mới hoàn toàn
    return;
  }
  
  loadWord(currentIndex);
}
/* ================= LOGIC TAB LUYỆN NGHE ================= */
let currentListenWord = null;

function playAudio(text, rate = 1.0) {
  if (!window.speechSynthesis) return alert("Trình duyệt không hỗ trợ phát âm!");
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = parseFloat(rate) || 1.0;
  window.speechSynthesis.speak(u);
}

function setupListenQuestion() {
  const lesson = document.getElementById("listenLessonFilter").value;
  let words = (lesson === "all") ? allWords : allWords.filter(w => String(w.lesson) === lesson);
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

function checkListenAnswer() {
  if (!currentListenWord) return;
  const userVal = document.getElementById("listenInput").value.trim().toLowerCase();
  const msg = document.getElementById("listen-result-msg");
  const targetHanzi = String(currentListenWord.hanzi).trim().toLowerCase();
  const targetPinyin = String(currentListenWord.pinyin || '').trim().toLowerCase();

  if (!userVal) {
    msg.className = "msg-wrong";
    msg.innerText = "Vui lòng nhập đáp án!";
    return;
  }

  if (userVal === targetHanzi || userVal === targetPinyin) {
    msg.className = "msg-correct";
    msg.innerText = `Chính xác! 🎉 (${currentListenWord.hanzi} - ${currentListenWord.vn})`;
  } else {
    msg.className = "msg-wrong";
    msg.innerText = "Chưa chính xác, hãy nghe lại!";
  }
}

function toggleListenAnswer() {
  if (!currentListenWord) return;
  const box = document.getElementById("listenAnswerBox");
  if (box.style.display === "none") {
    box.innerHTML = `<strong>${currentListenWord.hanzi}</strong> [${currentListenWord.pinyin || ''}]: ${currentListenWord.vn}`;
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
let currentPracticeMode = "book"; // 'book' (dịch trong sách) hoặc 'ai_generate' (AI tạo đề mới)
let currentTransExercise = {
  sourceText: "",
  sourceLang: "",
  targetLang: "",
  topicTitle: "",
  textTitle: "",
  vocabList: [],
  patternList: []
};

// 1. Tải file curriculum_db.json
async function loadCurriculumDatabase() {
  try {
    const res = await fetch("curriculum_db.json?t=" + Date.now());
    curriculumDB = await res.json();
    initTransLessonChips();
  } catch (err) {
    console.error("Lỗi khi tải curriculum_db.json:", err);
    document.getElementById("aiPromptDisplay").innerText = "Không tìm thấy file curriculum_db.json. Vui lòng kiểm tra lại!";
  }
}
window.addEventListener("DOMContentLoaded", loadCurriculumDatabase);

// 2. Render danh sách 12 bài học
function initTransLessonChips() {
  const container = document.getElementById("transTopicsContainer");
  if (!container || !curriculumDB || !curriculumDB.translation) return;

  container.innerHTML = "";
  Object.keys(curriculumDB.translation).forEach((key) => {
    const lesson = curriculumDB.translation[key];
    const chip = document.createElement("button");
    chip.className = `topic-chip ${key === currentTransLessonId ? "active" : ""}`;
    chip.innerText = lesson.lessonTitle.split("(")[0].trim();
    chip.onclick = () => selectTransLesson(key, chip);
    container.appendChild(chip);
  });

  // Khởi tạo bài khóa của bài hiện tại
  renderTransTextPills();
}

function selectTransLesson(lessonKey, chipEl) {
  document.querySelectorAll("#transTopicsContainer .topic-chip").forEach(c => c.classList.remove("active"));
  chipEl.classList.add("active");
  currentTransLessonId = lessonKey;
  currentTransTextId = "text1"; // reset về bài khóa 1
  renderTransTextPills();
}

// 3. Render 4 nút thẻ Bài khóa tương ứng của bài đã chọn
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
  document.querySelectorAll("#transTextsPillGroup .pill-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");
  currentTransTextId = textId;
  loadCurrentExercise();
}

// 4. Chọn Chế độ Luyện tập: Dịch sách hoặc AI tạo đề
function selectTransPracticeMode(mode, btnEl) {
  document.querySelectorAll("#transPracticeModeGroup .pill-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");
  currentPracticeMode = mode;
  
  const btnRegen = document.getElementById("btnRegenAIText");
  if (btnRegen) btnRegen.style.display = (mode === "ai_generate") ? "inline-block" : "none";

  loadCurrentExercise();
}

// 5. Nạp bài tập hiện tại
async function loadCurrentExercise() {
  if (!curriculumDB || !curriculumDB.translation) return;

  const lesson = curriculumDB.translation[currentTransLessonId];
  const textObj = lesson.texts.find(t => t.id === currentTransTextId) || lesson.texts[0];

  currentTransExercise.topicTitle = lesson.lessonTitle;
  currentTransExercise.textTitle = textObj.titleVi || textObj.title;
  currentTransExercise.vocabList = textObj.vocabulary || [];
  currentTransExercise.patternList = textObj.patterns || [];

  if (textObj.direction === "zh_to_vi") {
    currentTransExercise.sourceLang = "Tiếng Trung";
    currentTransExercise.targetLang = "Tiếng Việt";
  } else {
    currentTransExercise.sourceLang = "Tiếng Việt";
    currentTransExercise.targetLang = "Tiếng Trung";
  }

  // Cập nhật khung tham khảo từ vựng
  renderVocabReference(textObj);

  // Xóa kết quả làm bài trước
  document.getElementById("aiUserInput").value = "";
  document.getElementById("aiEvaluationResult").style.display = "none";

  const titleEl = document.getElementById("transPromptTitle");
  const displayEl = document.getElementById("aiPromptDisplay");

  if (currentPracticeMode === "book") {
    // CHẾ ĐỘ 1: Dịch bài khóa có sẵn trong sách
    currentTransExercise.sourceText = textObj.originalText;
    titleEl.innerText = `Đoạn văn sách giáo khoa (${currentTransExercise.sourceLang}):`;
    displayEl.innerText = currentTransExercise.sourceText;
  } else {
    // CHẾ ĐỘ 2: Gọi AI tạo đề mới dựa trên từ vựng của bài
    titleEl.innerText = `Đoạn văn do AI tạo tương tự (${currentTransExercise.sourceLang}):`;
    requestAITranslationTask();
  }
}

// Render khung gợi ý từ vựng & mẫu câu
function renderVocabReference(textObj) {
  const box = document.getElementById("transVocabReferenceBox");
  const content = document.getElementById("transVocabListContent");
  if (!box || !content) return;

  box.style.display = "block";
  let html = "<div><strong>Từ vựng trọng tâm:</strong> ";
  (textObj.vocabulary || []).forEach(v => {
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

function toggleVocabReference() {
  const content = document.getElementById("transVocabListContent");
  if (content) content.style.display = (content.style.display === "none") ? "block" : "none";
}

// 6. AI Tạo đề bài mới mở rộng (bám sát từ vựng bài khóa đang chọn)
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
    displayEl.innerText = currentTransExercise.sourceText;
  } catch (err) {
    displayEl.innerText = "Lỗi tạo đề: " + err.message;
  }
}

// 7. Gửi AI Thẩm định bản dịch
async function submitTranslationToAI() {
  const userText = document.getElementById("aiUserInput").value.trim();
  if (!userText) return alert("Vui lòng nhập bản dịch của bạn vào ô!");
  if (!currentTransExercise.sourceText) return alert("Chưa có đề bài, vui lòng chờ nạp bài!");

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
    resultBox.innerText = evaluation;
    resultBox.style.display = "block";
  } catch (err) {
    alert("Lỗi chấm bài: " + err.message);
  } finally {
    btn.innerText = "⚖️ Gửi AI Thẩm Định Bản Dịch";
    btn.disabled = false;
  }
}

autoLoadExcel();
