/* ================= CẤU HÌNH FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyD0zd7k81GaRAHN4apend-4fzjZhKFtQxQ",
  authDomain: "chinese-leaderboard.firebaseapp.com",
  databaseURL: "https://chinese-leaderboard-default-rtdb.firebaseio.com",
  projectId: "chinese-leaderboard",
  storageBucket: "chinese-leaderboard.firebasestorage.app",
  messagingSenderId: "896587858259",
  appId: "1:896587858259:web:5aa9af795127d2c973a1a6",
  measurementId: "G-GN32J5JEQ6"
};

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
} catch(e) {
  console.warn("Lỗi Firebase:", e);
}

/* ================= XỬ LÝ MENU TỔNG ĐIỀU HƯỚNG ================= */
function toggleMenuPopup(event) {
  event.stopPropagation();
  const dropdown = document.getElementById("menuDropdownBox");
  if (dropdown) dropdown.classList.toggle("show");
}

window.addEventListener("click", () => {
  const dropdown = document.getElementById("menuDropdownBox");
  if (dropdown && dropdown.classList.contains("show")) {
    dropdown.classList.remove("show");
  }
});

function switchMode(tabKey, displayName) {
  const label = document.getElementById("currentActiveTabLabel");
  if (label) label.innerText = displayName;

  document.querySelectorAll(".menu-nav-option").forEach(opt => opt.classList.remove("active"));
  if (event && event.currentTarget) event.currentTarget.classList.add("active");

  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
  const activeTabEl = document.getElementById(`tab-${tabKey}`);
  if (activeTabEl) activeTabEl.classList.add("active");

  const dropdown = document.getElementById("menuDropdownBox");
  if (dropdown) dropdown.classList.remove("show");

  if (tabKey === 'listen' && !currentListenWord) setupListenQuestion();
  if (tabKey === 'interpret' && typeof currentInterpretScenario !== 'undefined' && !currentInterpretScenario.speechText) {
    generateAIInterpretationScenario();
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

/* ================= LOGIC ĐỌC EXCEL & LUYỆN VIẾT ================= */
let allWords = [], activeWords = [], currentIndex = 0, canvasInstances = [];
const memorizedWords = new Map(), needReviewWords = new Map();

async function autoLoadExcel() {
  try {
    const res = await fetch("words.xlsx?t=" + Date.now());
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
    allWords = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) || [];
    setupLessonDropdown();
    applyFilters();
  } catch(e) {
    document.getElementById("prompt-vn").innerText = "Lỗi: Không tìm thấy file words.xlsx";
  }
}

function setupLessonDropdown() {
  const lessons = [...new Set(allWords.map(w => w.lesson).filter(Boolean))];
  const s1 = document.getElementById("lessonFilter");
  const s2 = document.getElementById("aiLessonFilter");
  const s3 = document.getElementById("listenLessonFilter");

  const optionAll = '<option value="all">Tất cả các bài</option>';
  s1.innerHTML = optionAll;
  s2.innerHTML = optionAll;
  if (s3) s3.innerHTML = optionAll;

  lessons.forEach(l => {
    const opt = `<option value="${l}">${l}</option>`;
    s1.innerHTML += opt;
    s2.innerHTML += opt;
    if (s3) s3.innerHTML += opt;
  });
}

function applyFilters() {
  const l = document.getElementById("lessonFilter").value;
  const m = document.getElementById("modeFilter").value;
  const lim = document.getElementById("limitFilter").value;

  let list = (l === "all") ? [...allWords] : allWords.filter(w => String(w.lesson) === l);
  if (m === "random") list.sort(() => Math.random() - 0.5);
  if (lim !== "all") list = list.slice(0, parseInt(lim, 10));

  activeWords = list;
  currentIndex = 0;
  if (activeWords.length > 0) loadWord(0);
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
    if (!masteredWordsSet.has(cur.hanzi)) {
      masteredWordsSet.add(cur.hanzi);
      document.getElementById("myCorrectScore").innerText = masteredWordsSet.size;
    }
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

function nextWord() {
  if (activeWords.length === 0) return;
  currentIndex = (currentIndex + 1) % activeWords.length;
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

/* ================= ĐẤU TRƯỜNG THI ĐẤU (60 GIÂY) ================= */
let arenaTimer = null;
let arenaTimeLeft = 60;
let arenaCurrentScore = 0;
let arenaCurrentWord = null;
let arenaCanvasInstances = [];

function startArenaMatch() {
  if (allWords.length === 0) return alert("Chưa nạp xong từ vựng, vui lòng chờ!");
  document.getElementById("arenaLobby").style.display = "none";
  document.getElementById("arenaGameArea").style.display = "block";
  document.getElementById("arenaLiveScoreTag").style.display = "block";
  
  arenaCurrentScore = 0;
  arenaTimeLeft = 60;
  document.getElementById("arenaCurrentScore").innerText = "0";
  document.getElementById("arenaTimerDisplay").innerText = "60";
  document.getElementById("arena-result-msg").innerText = "";

  loadNextArenaWord();

  clearInterval(arenaTimer);
  arenaTimer = setInterval(() => {
    arenaTimeLeft--;
    document.getElementById("arenaTimerDisplay").innerText = arenaTimeLeft;
    if (arenaTimeLeft <= 0) endArenaMatch();
  }, 1000);
}

function endArenaMatch() {
  clearInterval(arenaTimer);
  document.getElementById("arenaLobby").style.display = "block";
  document.getElementById("arenaGameArea").style.display = "none";
  document.getElementById("arenaLiveScoreTag").style.display = "none";
  
  alert(`⏰ HẾT GIỜ!\nBạn hoàn thành: ${arenaCurrentScore} từ!`);
  if (arenaCurrentScore > myBestScore) {
    syncScoreToFirebase(arenaCurrentScore);
  }
}

function loadNextArenaWord() {
  const randomIndex = Math.floor(Math.random() * allWords.length);
  arenaCurrentWord = allWords[randomIndex];
  document.getElementById("arena-prompt-vn").innerText = `Viết: "${arenaCurrentWord.vn || ''}"`;
  document.getElementById("arena-result-msg").innerText = "";
  setupArenaCanvas(String(arenaCurrentWord.hanzi).trim());
}

function skipArenaWord() {
  loadNextArenaWord();
}

function setupArenaCanvas(word) {
  const container = document.getElementById("arenaBoxesContainer");
  container.innerHTML = "";
  arenaCanvasInstances = [];
  for (let i = 0; i < word.length; i++) {
    const wrap = document.createElement("div"); wrap.className = "box-wrapper";
    const cBox = document.createElement("div"); cBox.className = "canvas-container";
    const cv = document.createElement("canvas"); cv.width = 180; cv.height = 180;

    cBox.appendChild(cv); wrap.appendChild(cBox); container.appendChild(wrap);
    const ctx = cv.getContext("2d");
    ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1e293b";

    const st = { char: word[i], cv, ctx, cBox, strokes: [], sx: [], sy: [], st: [], drawing: false, t0: 0 };
    initCanvasEvents(st);
    arenaCanvasInstances.push(st);
  }
}

function clearArenaBoxes() {
  for (let s of arenaCanvasInstances) {
    s.ctx.clearRect(0, 0, 180, 180);
    s.strokes = []; s.cBox.classList.remove("correct", "wrong");
  }
  document.getElementById("arena-result-msg").innerText = "";
}

async function checkArenaBoxes() {
  const msg = document.getElementById("arena-result-msg");
  msg.innerText = "Đang kiểm tra nét...";
  let ok = true, empty = false;

  for (let s of arenaCanvasInstances) {
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

  if (empty) { msg.className = "msg-wrong"; msg.innerText = "Chưa viết đủ ô!"; }
  else if (ok) {
    msg.className = "msg-correct"; msg.innerText = `+1 Điểm! (${arenaCurrentWord.hanzi})`;
    arenaCurrentScore++;
    document.getElementById("arenaCurrentScore").innerText = arenaCurrentScore;
    setTimeout(loadNextArenaWord, 500);
  } else {
    msg.className = "msg-wrong"; msg.innerText = "Chưa đúng!";
  }
}

/* ================= THÔNG TIN NGƯỜI DÙNG & REALTIME DATABASE ================= */
const masteredWordsSet = new Set();
let playerId = localStorage.getItem("chinese_player_id");
let playerName = localStorage.getItem("chinese_player_name") || "";
let myBestScore = parseInt(localStorage.getItem("chinese_arena_best") || "0", 10);

if (!playerId) {
  playerId = "user_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("chinese_player_id", playerId);
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("arenaHighScore").innerText = myBestScore;
  if (!playerName) {
    openNameModal();
  } else {
    document.getElementById("nameModal").classList.add("hidden");
    document.getElementById("displayNameTag").innerText = playerName;
  }
});

function openNameModal() {
  document.getElementById("nameModal").classList.remove("hidden");
  const input = document.getElementById("modalNameInput");
  input.value = playerName;
  setTimeout(() => input.focus(), 100);
}

function submitPlayerName() {
  const input = document.getElementById("modalNameInput");
  const val = input ? input.value.trim() : "";
  if (!val) return alert("Vui lòng nhập tên!");
  
  playerName = val;
  localStorage.setItem("chinese_player_name", playerName);
  
  const tag = document.getElementById("displayNameTag");
  if (tag) tag.innerText = playerName;
  
  const modal = document.getElementById("nameModal");
  if (modal) modal.classList.add("hidden");

  syncScoreToFirebase(myBestScore);
}

function syncScoreToFirebase(scoreToSave) {
  if (!db || !playerName) return;

  const numScore = Number(scoreToSave) || 0;
  if (numScore >= myBestScore) {
    myBestScore = numScore;
    localStorage.setItem("chinese_arena_best", myBestScore);
  }
  
  const highEl = document.getElementById("arenaHighScore");
  if (highEl) highEl.innerText = myBestScore;

  db.ref("leaderboard/" + playerId).set({
    name: playerName,
    score: myBestScore,
    updatedAt: Date.now()
  }).catch(err => {
    console.error("Firebase từ chối ghi dữ liệu (kiểm tra lại tab Rules):", err);
  });
}

function listenLeaderboard() {
  if (!db) return;
  
  db.ref("leaderboard").on("value", snapshot => {
    const data = snapshot.val();
    const tbody = document.getElementById("leaderboardBody");
    tbody.innerHTML = "";

    if (!data) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:16px;">Chưa có kỷ lục nào được ghi nhận!</td></tr>';
      return;
    }

    const list = Object.values(data)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10);

    list.forEach((p, idx) => {
      let badge = `#${idx + 1}`;
      if (idx === 0) badge = "🥇 1";
      else if (idx === 1) badge = "🥈 2";
      else if (idx === 2) badge = "🥉 3";

      const isMe = (p.name === playerName) ? 'style="font-weight:bold; color:var(--primary);"' : '';
      tbody.innerHTML += `
        <tr ${isMe}>
          <td style="font-weight:bold;">${badge}</td>
          <td>${p.name || 'Vô danh'}</td>
          <td style="text-align:right;font-weight:bold;color:#d97706;">${p.score || 0} từ</td>
        </tr>
      `;
    });
  }, err => {
    console.error("Lỗi đọc Firebase:", err);
  });
}

autoLoadExcel();
listenLeaderboard();
