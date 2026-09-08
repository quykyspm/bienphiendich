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
  if (tabKey === 'interpret' && !currentInterpretItem) setupInterpretQuestion();
}

/* ================= BỘ GIỌNG ĐỌC DIỄN GIẢ NGOẠI GIAO (SPEECH PROSODY) ================= */
let availableVoices = [];
function initVoiceList() {
  if (!window.speechSynthesis) return;
  availableVoices = window.speechSynthesis.getVoices();
}
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = initVoiceList;
}

function playDiplomaticSpeech(text, lang = 'zh-CN') {
  if (!window.speechSynthesis) {
    alert("Trình duyệt không hỗ trợ phát âm!");
    return;
  }
  window.speechSynthesis.cancel();
  
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  
  // Tinh chỉnh nhịp ngắt trang trọng: tốc độ 0.9x, tông hơi trầm 0.95
  u.rate = 0.9;
  u.pitch = 0.95;

  // Lọc giọng Natural / Neural của Microsoft/Google nếu có
  if (availableVoices.length === 0) availableVoices = window.speechSynthesis.getVoices();
  const matchedVoice = availableVoices.find(v => v.lang.startsWith(lang.split('-')[0]) && (v.name.includes("Natural") || v.name.includes("Neural")));
  if (matchedVoice) u.voice = matchedVoice;

  window.speechSynthesis.speak(u);
}

/* ================= PHÒNG LUYỆN PHIÊN DỊCH (INTERPRETATION LAB) ================= */
// Kho dữ liệu đối ngoại Bài 1 trích xuất từ giáo trình
const lesson1Speeches = {
  zh_to_vi: [
    {
      speech: "尊敬的各位领导、各位专家、各位来宾，大家上午好！欢迎大家出席2026年中越教育合作论坛开幕式。",
      targetLang: "vi-VN",
      expectedRef: "Kính thưa quý vị lãnh đạo, quý vị chuyên gia và quý vị đại biểu, chúc mọi người một buổi sáng tốt lành! Nhiệt liệt chào mừng quý vị đến tham dự Lễ khai mạc Diễn đàn Hợp tác Giáo dục Việt - Trung năm 2026."
    },
    {
      speech: "首先，请允许我代表主办方向各位嘉宾表示热烈欢迎，并感谢大家在百忙之中拨冗出席本次活动。",
      targetLang: "vi-VN",
      expectedRef: "Trước hết, xin phép tôi được thay mặt Ban Tổ chức gửi lời chào mừng nồng nhiệt tới quý vị đại biểu, và xin chân thành cảm ơn quý vị đã bớt chút thời gian quý báu để đến tham dự sự kiện lần này."
    },
    {
      speech: "本次论坛将围绕人工智能与国际中文教育的发展展开深入交流，希望各位专家共同探讨未来合作的新方向。",
      targetLang: "vi-VN",
      expectedRef: "Diễn đàn lần này sẽ tiến hành trao đổi chuyên sâu xoay quanh sự phát triển của trí tuệ nhân tạo và giáo dục tiếng Trung quốc tế, hy vọng các chuyên gia sẽ cùng nhau thảo luận về những định hướng hợp tác mới trong tương lai."
    },
    {
      speech: "下面，让我们以热烈的掌声欢迎李校长致开幕词。我宣布，本次论坛正式开幕！",
      targetLang: "vi-VN",
      expectedRef: "Sau đây, xin quý vị hãy dành một tràng pháo tay nồng nhiệt để chào đón Hiệu trưởng Lý lên phát biểu diễn văn khai mạc. Tôi xin tuyên bố, diễn đàn lần này chính thức khai mạc!"
    }
  ],
  vi_to_zh: [
    {
      speech: "Kính thưa các vị giáo sư, quý học giả và các em sinh viên, xin chân thành cảm ơn quý vị đã đến tham dự Hội thảo học thuật quốc tế lần này.",
      targetLang: "zh-CN",
      expectedRef: "尊敬的各位教授、各位学者、各位同学，非常感谢大家参加本次国际学术研讨会。"
    },
    {
      speech: "Hội thảo lần này đã mời các chuyên gia cùng nhau thảo luận về những cơ hội và thách thức mà công nghệ số mang lại cho giảng dạy ngôn ngữ.",
      targetLang: "zh-CN",
      expectedRef: "本次会议邀请了各位专家，共同探讨数字技术对语言教学带来的机遇与挑战。"
    },
    {
      speech: "Quý vị không chỉ có cơ hội lắng nghe các báo cáo học thuật đặc sắc mà còn có thể trao đổi chuyên sâu với giảng viên các trường đại học.",
      targetLang: "zh-CN",
      expectedRef: "大家不仅可以聆听精彩的学术报告，还能够与各高校教师进行深入交流。"
    },
    {
      speech: "Hy vọng hội thảo sẽ tiếp tục thúc đẩy hợp tác quốc tế. Bây giờ, tôi xin tuyên bố hội thảo chính thức bắt đầu!",
      targetLang: "zh-CN",
      expectedRef: "希望本次研讨会能够进一步促进国际合作。现在，我宣布研讨会正式开始！"
    }
  ]
};

let currentInterpretIndex = 0;
let currentInterpretItem = null;
let speechRecognizer = null;
let isRecording = false;

function setupInterpretQuestion() {
  const dir = document.getElementById("interpretDirection").value;
  const list = lesson1Speeches[dir] || [];
  currentInterpretItem = list[currentInterpretIndex % list.length];

  document.getElementById("speakerSpeechPreview").innerText = currentInterpretItem.speech;
  document.getElementById("interpretUserTranscript").value = "";
  document.getElementById("interpretAIResult").style.display = "none";
  
  // Tự động phát âm thanh diễn giả khi chuyển câu
  playSpeakerSpeech();
}

function playSpeakerSpeech() {
  if (!currentInterpretItem) return;
  const dir = document.getElementById("interpretDirection").value;
  const lang = (dir === "zh_to_vi") ? "zh-CN" : "vi-VN";
  playDiplomaticSpeech(currentInterpretItem.speech, lang);
}

function nextInterpretQuestion() {
  const dir = document.getElementById("interpretDirection").value;
  const list = lesson1Speeches[dir] || [];
  currentInterpretIndex = (currentInterpretIndex + 1) % list.length;
  setupInterpretQuestion();
}

// Xử lý Micro qua Web Speech Recognition API
function toggleSpeechRecording() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert("Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech. Hãy dùng Google Chrome hoặc Edge, hoặc gõ tay trực tiếp vào ô văn bản!");
    return;
  }

  const btn = document.getElementById("btnToggleRecord");
  const tag = document.getElementById("recordingStatusTag");
  const txtArea = document.getElementById("interpretUserTranscript");

  if (isRecording) {
    // Dừng thu
    if (speechRecognizer) speechRecognizer.stop();
    return;
  }

  speechRecognizer = new SpeechRec();
  speechRecognizer.continuous = true;
  speechRecognizer.interimResults = true;
  
  // Chiều dịch: Dịch sang ngôn ngữ đích nào thì nhận diện tiếng đó
  speechRecognizer.lang = currentInterpretItem.targetLang;

  speechRecognizer.onstart = () => {
    isRecording = true;
    btn.classList.add("active");
    document.getElementById("micBtnText").innerText = "ĐANG THU ÂM... (BẤM ĐỂ DỪNG)";
    tag.className = "status-tag recording";
    tag.innerText = "● Đang lắng nghe bạn dịch...";
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

  speechRecognizer.onerror = (event) => {
    console.warn("Lỗi nhận diện giọng nói:", event.error);
    stopRecordingUI();
  };

  speechRecognizer.onend = () => {
    stopRecordingUI();
  };

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
  if (!userSpeech) return alert("Vui lòng nói qua Micro hoặc gõ bản dịch của bạn vào ô!");
  if (!currentInterpretItem) return;

  const btn = document.getElementById("btnSubmitInterpret");
  const resBox = document.getElementById("interpretAIResult");
  btn.innerText = "⏳ AI đang thẩm định nghiệp vụ...";
  btn.disabled = true;

  const dir = document.getElementById("interpretDirection").value;
  const sourceLangName = (dir === "zh_to_vi") ? "Tiếng Trung" : "Tiếng Việt";
  const targetLangName = (dir === "zh_to_vi") ? "Tiếng Việt" : "Tiếng Trung";

  const interpretEvalPrompt = `
Bạn là chuyên gia thẩm định Phiên dịch viên Hội nghị Quốc tế (Conference Interpreter Evaluator).
Bối cảnh: Dịch nối tiếp (Consecutive Interpreting) nghi thức ngoại giao / lễ khai mạc.

Phát biểu gốc của diễn giả (${sourceLangName}):
"${currentInterpretItem.speech}"

Bản phiên dịch nói của học viên (${targetLangName} - thu qua Speech-to-Text):
"${userSpeech}"

Bản dịch tham khảo chuẩn:
"${currentInterpretItem.expectedRef}"

Hãy thẩm định chi tiết theo barem nghiệp vụ phiên dịch:
1. Điểm số: .../10
2. Độ chính xác thông tin cốt lõi (Core Facts): Có dịch đúng đối tác, chức danh, sự kiện, con số không?
3. Văn phong nghi thức ngoại giao (Register & Tone): Đã dùng đúng từ ngữ trang trọng của hội nghị chưa (ví dụ: nhiệt liệt chào mừng, dành thời gian quý báu...)? Hãy khen ưu điểm và chỉ rõ từ ngữ chưa chuẩn nếu có.
4. Phiên bản phiên dịch chuẩn xác và gãy gọn nhất: Cung cấp câu dịch trôi chảy nhất để học viên học tập.
(Chú ý: Do học viên dùng nhận diện giọng nói, hãy châm chước lỗi chữ đồng âm nhỏ, tập trung thẩm định khả năng phản xạ chuyển ngữ và độ trang trọng).
`;

  try {
    const evaluation = await callGemini(interpretEvalPrompt);
    resBox.innerText = evaluation;
    resBox.style.display = "block";
  } catch (err) {
    alert("Lỗi thẩm định: " + err.message);
  } finally {
    btn.innerText = "⚖️ AI Thẩm Định Phiên Dịch";
    btn.disabled = false;
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

/* ================= LOGIC TAB LUYỆN NGHE ================= */
let currentListenWord = null;

function playAudio(text, rate = 1.0) {
  if (!window.speechSynthesis) {
    alert("Trình duyệt không hỗ trợ phát âm!");
    return;
  }
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
    if (arenaTimeLeft <= 0) {
      endArenaMatch();
    }
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

/* ================= KẾT NỐI VERCEL PROXY ================= */
const VERCEL_API_URL = "https://gemini-api-backend-rho.vercel.app/api/gemini";
let currentAIExercise = { text: "", source: "", target: "" };

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

async function requestAITask(mode) {
  const selectedLesson = document.getElementById("aiLessonFilter").value;
  let words = (selectedLesson === "all") ? allWords : allWords.filter(w => String(w.lesson) === selectedLesson);

  if (words.length === 0) return alert("Không có từ vựng trong bài đã chọn!");

  const sampleWords = [...words].sort(() => Math.random() - 0.5).slice(0, 5);

  const promptDisplay = document.getElementById("aiPromptDisplay");
  promptDisplay.innerText = "⏳ AI đang biên soạn nội dung theo từ vựng...";
  document.getElementById("aiEvaluationResult").style.display = "none";
  document.getElementById("aiUserInput").value = "";

  let prompt = "";
  if (mode === "vi_to_zh") {
    currentAIExercise = { source: "Tiếng Việt", target: "Tiếng Trung" };
    const vnVocabList = sampleWords.map(w => `"${w.vn}"`).join(", ");
    prompt = `Bạn là giáo viên tiếng Trung. Hãy viết 1 đoạn văn ngắn hoàn toàn bằng TIẾNG VIỆT (khoảng 2-3 câu, tối đa 40 từ), ngữ cảnh tự nhiên, có sử dụng các khái niệm/từ ngữ sau: [${vnVocabList}]. 
QUY TẮC BẮT BUỘC:
1. 100% bằng tiếng Việt thuần túy.
2. Tuyệt đối KHÔNG chứa bất kỳ chữ Hán, Pinyin hay ký tự Trung Quốc nào.
3. Không thêm giải thích hay lời chào, chỉ trả về nội dung đoạn văn.`;
  } else {
    currentAIExercise = { source: "Tiếng Trung", target: "Tiếng Việt" };
    const zhVocabList = sampleWords.map(w => w.hanzi).join(", ");
    prompt = `Bạn là giáo viên tiếng Trung. Hãy viết một đoạn văn ngắn bằng Tiếng Trung (2-3 câu, cấp độ HSK 2-3) sử dụng các từ sau: [${zhVocabList}]. Chỉ trả về duy nhất chữ Hán, không thêm lời chào hay giải thích nào.`;
  }

  try {
    const result = await callGemini(prompt);
    currentAIExercise.text = result.trim();
    promptDisplay.innerText = currentAIExercise.text;
  } catch (err) {
    promptDisplay.innerText = "Lỗi: " + err.message;
  }
}

async function submitTranslationToAI() {
  const userText = document.getElementById("aiUserInput").value.trim();
  if (!userText) return alert("Vui lòng nhập bài làm của bạn!");
  if (!currentAIExercise.text) return alert("Chưa có đề bài, hãy bấm tạo đề trước!");

  const btn = document.getElementById("btnSubmitAI");
  const resultBox = document.getElementById("aiEvaluationResult");
  btn.innerText = "⏳ AI đang chấm bài...";
  btn.disabled = true;

  const evalPrompt = `
Bạn là chuyên gia thẩm định biên phiên dịch tiếng Trung.
Đề bài (${currentAIExercise.source}):
"${currentAIExercise.text}"

Bản dịch của học viên (${currentAIExercise.target}):
"${userText}"

Hãy đánh giá chi tiết theo mẫu:
- Điểm số: .../10
- Nhận xét chi tiết: Khen ưu điểm, chỉ rõ lỗi sai về từ vựng, ngữ pháp, ngữ cảnh (nếu có).
- Bản dịch tối ưu tham khảo: (cung cấp câu dịch tự nhiên và chuẩn xác nhất).
`;

  try {
    const evaluation = await callGemini(evalPrompt);
    resultBox.innerText = evaluation;
    resultBox.style.display = "block";
  } catch (err) {
    alert("Lỗi chấm bài: " + err.message);
  } finally {
    btn.innerText = "Gửi AI chấm bài";
    btn.disabled = false;
  }
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

  s1.innerHTML = '<option value="all">Tất cả các bài</option>';
  s2.innerHTML = '<option value="all">Tất cả các bài</option>';
  if (s3) s3.innerHTML = '<option value="all">Tất cả các bài</option>';

  lessons.forEach(l => {
    s1.innerHTML += `<option value="${l}">${l}</option>`;
    s2.innerHTML += `<option value="${l}">${l}</option>`;
    if (s3) s3.innerHTML += `<option value="${l}">${l}</option>`;
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

autoLoadExcel();
listenLeaderboard();
