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

/* ================= 12 CHỦ ĐỀ CHUẨN GIÁO TRÌNH PHIÊN DỊCH 1 ================= */
const curriculumTopics = [
  {
    id: "bai1",
    title: "Bài 1: Khai mạc hội nghị (会议开幕)",
    roleZh: "Người chủ trì / Ban tổ chức hội nghị quốc tế",
    roleVi: "MC / Đại diện Ban Tổ chức phía Việt Nam",
    context: "Khai mạc hội nghị, đón tiếp khách mời, ổn định chỗ ngồi, giới thiệu đại biểu, tuyên bố khai mạc",
    vocabZh: "即将, 礼堂, 就坐, 来宾, 主题, 学习交流, 致辞, 开幕词, 宣布, 组委会, 搭建平台, 旨在, 拨冗出席",
    vocabVi: "hội trường, ổn định chỗ ngồi, khách mời, chủ đề, bài phát biểu khai mạc, tuyên bố, ban tổ chức, tạo dựng nền tảng, bớt chút thời gian quý báu"
  },
  {
    id: "bai2",
    title: "Bài 2: Chúc mừng, cảm ơn & Tiệc (祝贺词, 感谢词)",
    roleZh: "Đại diện đối tác / Lãnh đạo phát biểu tại tiệc chiêu đãi",
    roleVi: "Trưởng đoàn đại biểu Việt Nam phát biểu cảm ơn & nâng ly",
    context: "Phát biểu tại tiệc chiêu đãi, gửi lời chúc mừng, tri ân giúp đỡ, nâng ly chúc tình hữu nghị, giữ liên lạc",
    vocabZh: "庆祝, 友谊, 举杯, 干杯, 到来, 支持, 取得成绩, 保持联系, 欢聚一堂, 衷心祝愿, 合作顺利",
    vocabVi: "chúc mừng, tình hữu nghị, nâng ly, cạn ly, sự hiện diện, ủng hộ, đạt thành tích, giữ liên lạc, chúc công tác thuận lợi"
  },
  {
    id: "bai3",
    title: "Bài 3: Bế mạc hội nghị (闭幕式)",
    roleZh: "Chủ tịch hội nghị quốc tế tổng kết và bế mạc",
    roleVi: "Đại diện ban tổ chức bế mạc diễn đàn hợp tác",
    context: "Tổng kết thành quả hội nghị, đi đến nhận thức chung, cảm ơn đại biểu, đặt nền tảng hợp tác lâu dài, tuyên bố bế mạc",
    vocabZh: "圆满结束, 丰硕成果, 达成共识, 闭幕, 大力支持, 奠定坚实基础, 推动, 议程, 期待再次相聚",
    vocabVi: "kết thúc tốt đẹp, thành quả to lớn, nhận thức chung, bế mạc, ủng hộ to lớn, đặt nền tảng vững chắc, thúc đẩy, hẹn gặp lại"
  },
  {
    id: "bai4",
    title: "Bài 4: Mua sắm & Ăn uống (购物、餐饮)",
    roleZh: "Khách hàng / Nhân viên quầy chăm sóc khách hàng & nhà hàng",
    roleVi: "Phiên dịch viên hỗ trợ khách mua hàng, bảo hành đổi trả hoặc gọi món",
    context: "Hỏi giá khuyến mãi, đổi trả hàng do lỗi kỹ thuật, bảo hành miễn phí, gọi món bò bít tết/tôm rang muối tiêu",
    vocabZh: "羽绒服, 原价, 打折, 促销活动, 试穿, 质量问题, 免费修理, 更换, 保修卡, 顺便, 牛排, 全熟, 补偿",
    vocabVi: "giá gốc, giảm giá, khuyến mãi, mặc thử, lỗi chất lượng, sửa chữa miễn phí, đổi mới, phiếu bảo hành, chín kỹ, bồi thường"
  },
  {
    id: "bai5",
    title: "Bài 5: Hội chợ triển lãm (展览会)",
    roleZh: "Đại diện nhà cung cấp / Doanh nghiệp tham gia hội chợ",
    roleVi: "Doanh nghiệp xuất nhập khẩu đàm phán hợp đồng thương mại",
    context: "Giới thiệu sản phẩm mới tại gian hàng, chứng nhận ISO, đàm phán bảng báo giá, đơn hàng thử lô nhỏ, ký hợp đồng",
    vocabZh: "展位, 经营, 农产品, 出口, 推出, 质量认证, 报价单, 最低订购数量, 小批量试单, 签署合同, 开拓市场",
    vocabVi: "gian hàng, kinh doanh, nông sản, xuất khẩu, chứng nhận chất lượng, bảng báo giá, số lượng tối thiểu, đơn hàng thử, ký hợp đồng"
  },
  {
    id: "bai6",
    title: "Bài 6: Thể thao (体育)",
    roleZh: "Phóng viên thể thao / Vận động viên phỏng vấn sau trận đấu",
    roleVi: "Bình luận viên / Huấn luyện viên chia sẻ về kết quả thi đấu",
    context: "Tường thuật trận chung kết bóng chuyền/bóng đá kịch tính, tỉ số hòa, ý chí kiên cường chạy marathon, chấn thương hồi phục",
    vocabZh: "决赛, 对阵, 激烈, 打平, 团队合作, 比分, 战胜, 金牌, 马拉松, 坚持跑完全程, 成功晋级, 重返赛场",
    vocabVi: "chung kết, đối đầu, quyết liệt, hòa điểm, phối hợp đồng đội, tỉ số, chiến thắng, huy chương vàng, chạy hết chặng, giành quyền đi tiếp"
  },
  {
    id: "bai7",
    title: "Bài 7: Địa danh du lịch (旅游景点)",
    roleZh: "Hướng dẫn viên du lịch giới thiệu thắng cảnh",
    roleVi: "Du khách / Phiên dịch viên tư vấn tour du lịch",
    context: "Giới thiệu vị trí địa lý, danh lam thắng cảnh, di sản thế giới UNESCO, chèo thuyền kayak, đi cáp treo ngắm cảnh",
    vocabZh: "古镇, 世界遗产, 悠久, 五彩缤纷, 灯笼, 名胜古迹, 故宫, 长城, 下龙湾, 石灰岩, 溶洞, 缆车",
    vocabVi: "phố cổ, di sản thế giới, lâu đời, đèn lồng rực rỡ, danh lam thắng cảnh, Cố Cung, Vịnh Hạ Long, đảo đá vôi, hang động, cáp treo"
  },
  {
    id: "bai8",
    title: "Bài 8: Tin tức báo chí (新闻报道)",
    roleZh: "Người phát ngôn / Phóng viên họp báo truyền thông",
    roleVi: "Nhà báo đưa tin sự kiện, xác minh tin đồn mạng xã hội",
    context: "Đưa tin họp báo phim, xu hướng tìm kiếm hot search, xác minh thông tin đời tư, khuyến cáo không lan truyền tin đồn thất thiệt",
    vocabZh: "采访, 登上热搜, 据媒体报道, 发布会, 记者, 澄清, 不实传闻, 核实信息, 引起恐慌, 剧本, 角色",
    vocabVi: "phỏng vấn, lọt xu hướng tìm kiếm, theo truyền thông đưa tin, họp báo, đính chính, tin đồn sai lệch, xác minh thông tin, gây hoang mang"
  },
  {
    id: "bai9",
    title: "Bài 9: Khác biệt văn hoá (文化差异)",
    roleZh: "Giám đốc nhân sự công ty công nghệ Trung Quốc",
    roleVi: "Đại diện doanh nghiệp Việt Nam trao đổi về văn hóa làm việc",
    context: "So sánh chế độ làm việc '996' với thói quen nghỉ trưa và tan làm đúng giờ, cân bằng giữa công việc và gia đình, tránh hiểu lầm",
    vocabZh: "科技企业, 996工作制, 加班, 工作与生活的平衡, 午休, 午睡, 恢复精力, 陪伴家人, 避免产生误会, 沟通习惯",
    vocabVi: "doanh nghiệp công nghệ, chế độ làm việc 996, tăng ca, cân bằng công việc và cuộc sống, nghỉ trưa, ở bên gia đình, tránh hiểu lầm"
  },
  {
    id: "bai10",
    title: "Bài 10: Dự báo thời tiết (天气预报)",
    roleZh: "Chuyên viên khí tượng / Phát thanh viên dự báo thiên tai",
    roleVi: "Cán bộ phòng chống bão lũ / Hướng dẫn viên cảnh báo du khách",
    context: "Bản tin dự báo nhiệt độ ngày đêm, cảnh báo bão ven biển gió giật mạnh, mưa lớn gây lũ quét sạt lở đất, biến đổi khí hậu",
    vocabZh: "天气预报, 摄氏度, 台风, 沿海地区, 暴雨, 强风, 减少外出, 防风防雨, 气候变化, 山洪, 泥石流, 全球变暖",
    vocabVi: "dự báo thời tiết, độ C, bão, ven biển, mưa lớn, gió mạnh, hạn chế ra ngoài, phòng chống gió mưa, lũ quét, sạt lở đất, nóng lên toàn cầu"
  },
  {
    id: "bai11",
    title: "Bài 11: Quản lý thời gian (时间管理)",
    roleZh: "Diễn giả / Chuyên gia đào tạo phương pháp học tập",
    roleVi: "Trưởng nhóm dự án phân công công việc và đốc thúc tiến độ",
    context: "Lập danh sách nhiệm vụ ưu tiên khẩn cấp, phương pháp Pomodoro, tránh trì hoãn phút chót, thống nhất tiến độ nhóm, kết hợp nghỉ ngơi",
    vocabZh: "制定计划, 任务清单, 轻重缓急, 优先处理, 番茄工作法, 恢复精力, 截止日期, 及时沟通, 劳逸结合, 拖延",
    vocabVi: "lập kế hoạch, danh sách nhiệm vụ, khẩn cấp và quan trọng, ưu tiên xử lý, phương pháp Pomodoro, thời hạn deadline, tránh trì hoãn"
  },
  {
    id: "bai12",
    title: "Bài 12: Dân số (人口)",
    roleZh: "Chuyên gia xã hội học / Nhà nghiên cứu chính sách dân số",
    roleVi: "Đại biểu hội nghị phân tích thách thức già hóa dân số",
    context: "Phân tích xu hướng già hóa dân số, tỷ lệ sinh giảm, di cư từ nông thôn lên thành phố, áp lực lên an sinh xã hội và chăm sóc người già",
    vocabZh: "增长速度, 逐渐放缓, 城市化进程, 人口老龄化, 劳动力不足, 养老保障, 调整生育政策, 缩小地区差距, 长期照护",
    vocabVi: "tốc độ tăng trưởng, dần chậm lại, đô thị hóa, già hóa dân số, thiếu hụt lao động, an sinh tuổi già, điều chỉnh chính sách sinh, thu hẹp khoảng cách"
  }
];

function initCurriculumDropdown() {
  const select = document.getElementById("interpretCurriculumTopic");
  if (!select) return;
  select.innerHTML = "";
  curriculumTopics.forEach(t => {
    select.innerHTML += `<option value="${t.id}">${t.title}</option>`;
  });
}
window.addEventListener("DOMContentLoaded", initCurriculumDropdown);

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
  if (tabKey === 'interpret' && !currentInterpretScenario.speechText) {
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

/* ================= PHÒNG LUYỆN PHIÊN DỊCH THEO 12 CHỦ ĐỀ GIÁO TRÌNH ================= */
let currentInterpretScenario = {
  speechText: "",
  sourceLang: "zh-CN",
  targetLang: "vi-VN",
  dir: "zh_to_vi",
  topic: null
};
let isSpeechRevealed = false;
let speechRecognizer = null;
let isRecording = false;

// AI Tự động sinh kịch bản diễn giả dựa trên đúng bài giáo trình được chọn
async function generateAIInterpretationScenario() {
  const dir = document.getElementById("interpretDirection").value;
  const topicId = document.getElementById("interpretCurriculumTopic").value;
  const topic = curriculumTopics.find(t => t.id === topicId) || curriculumTopics[0];
  currentInterpretScenario.topic = topic;

  const notice = document.getElementById("speechBlindNotice");
  const revealedBox = document.getElementById("revealedSpeechText");
  const resultBox = document.getElementById("interpretAIResult");
  const roleTag = document.getElementById("speakerRoleTag");
  
  notice.innerHTML = `<span class="blind-icon">⏳</span> <span>AI đang biên soạn phát biểu [${topic.title}]...</span>`;
  revealedBox.style.display = "none";
  isSpeechRevealed = false;
  document.getElementById("interpretUserTranscript").value = "";
  resultBox.style.display = "none";

  let prompt = "";
  if (dir === "zh_to_vi") {
    currentInterpretScenario.sourceLang = "zh-CN";
    currentInterpretScenario.targetLang = "vi-VN";
    currentInterpretScenario.dir = "zh_to_vi";
    roleTag.innerText = `🎙️ ${topic.roleZh.toUpperCase()}`;

    prompt = `Bạn là ${topic.roleZh}. Hãy đóng vai và phát biểu 1 đoạn ngắn bằng TIẾNG TRUNG (khoảng 2-3 câu ngắn gọn, tối đa 45 từ) thuộc ngữ cảnh: "${topic.context}".
BẮT BUỘC có sử dụng một số từ vựng trọng tâm sau: [${topic.vocabZh}].
QUY TẮC BẮT BUỘC:
1. Trả về DUY NHẤT đoạn phát biểu bằng chữ Hán, văn phong tự nhiên đúng khẩu khí người bản xứ trong bối cảnh đó.
2. Tuyệt đối KHÔNG có pinyin, KHÔNG dịch tiếng Việt, KHÔNG có lời chào giải thích nào khác.`;
  } else {
    currentInterpretScenario.sourceLang = "vi-VN";
    currentInterpretScenario.targetLang = "zh-CN";
    currentInterpretScenario.dir = "vi_to_zh";
    roleTag.innerText = `🎙️ ${topic.roleVi.toUpperCase()}`;

    prompt = `Bạn là ${topic.roleVi}. Hãy đóng vai và phát biểu 1 đoạn ngắn bằng TIẾNG VIỆT (khoảng 2-3 câu ngắn gọn, tối đa 45 từ) thuộc ngữ cảnh: "${topic.context}".
BẮT BUỘC có sử dụng một số khái niệm/từ ngữ sau: [${topic.vocabVi}].
QUY TẮC BẮT BUỘC:
1. 100% bằng tiếng Việt thuần túy, đúng phong thái và chuẩn ngữ cảnh bối cảnh.
2. Tuyệt đối KHÔNG chứa chữ Hán, Pinyin hay lời giải thích thừa, chỉ trả về nội dung phát biểu.`;
  }

  try {
    const speech = await callGemini(prompt);
    currentInterpretScenario.speechText = speech.trim();

    revealedBox.innerText = currentInterpretScenario.speechText;
    notice.innerHTML = '<span class="blind-icon">🔒</span> <span>Nội dung đã được che! Bắt đầu phát âm thanh diễn giả...</span>';

    playSpeakerAudio();
  } catch (err) {
    notice.innerHTML = `<span class="blind-icon">❌</span> <span>Lỗi: ${err.message}</span>`;
  }
}

function playSpeakerAudio() {
  if (!currentInterpretScenario.speechText) return alert("Vui lòng bấm 'AI Tạo Tình Huống' trước!");
  playDiplomaticSpeech(currentInterpretScenario.speechText, currentInterpretScenario.sourceLang);
}

function toggleRevealSpeech() {
  if (!currentInterpretScenario.speechText) return;
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

// Micro thu âm tiếng dịch của học viên
function toggleSpeechRecording() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert("Trình duyệt chưa hỗ trợ Web Speech API. Vui lòng dùng Chrome/Edge hoặc gõ bài dịch trực tiếp vào ô văn bản!");
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
  speechRecognizer.lang = currentInterpretScenario.targetLang;

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

// Gửi AI thẩm định bài phiên dịch
async function submitInterpretationToAI() {
  const userSpeech = document.getElementById("interpretUserTranscript").value.trim();
  if (!userSpeech) return alert("Vui lòng nói vào Micro hoặc gõ bài dịch vào ô!");
  if (!currentInterpretScenario.speechText) return alert("Chưa có đề bài, hãy bấm 'AI Tạo Tình Huống' trước!");

  const btn = document.getElementById("btnSubmitInterpret");
  const resBox = document.getElementById("interpretAIResult");
  btn.innerText = "⏳ AI đang thẩm định nghiệp vụ...";
  btn.disabled = true;

  const sourceLangName = (currentInterpretScenario.dir === "zh_to_vi") ? "Tiếng Trung" : "Tiếng Việt";
  const targetLangName = (currentInterpretScenario.dir === "zh_to_vi") ? "Tiếng Việt" : "Tiếng Trung";
  const topicTitle = currentInterpretScenario.topic ? currentInterpretScenario.topic.title : "";

  const evalPrompt = `
Bạn là chuyên gia thẩm định Phiên dịch viên (Interpretation Evaluator).
Chủ đề bài học: [${topicTitle}].
Ngữ cảnh: Dịch nối tiếp (Consecutive Interpreting).

Phát biểu gốc (${sourceLangName}):
"${currentInterpretScenario.speechText}"

Bản phiên dịch nói của học viên (${targetLangName} - thu qua Speech-to-Text):
"${userSpeech}"

Hãy thẩm định chi tiết theo mẫu:
1. Điểm số: .../10
2. Độ chính xác thông tin cốt lõi: Có bỏ sót ý chính, số liệu, tên sự vật, chức danh không?
3. Văn phong & Thuật ngữ theo chủ đề [${topicTitle}]: Đã sử dụng đúng thuật ngữ chuyên ngành và cách nói chuẩn ngữ cảnh chưa? Khen ưu điểm và chỉ rõ lỗi dùng từ nếu có.
4. Bản dịch tối ưu tham khảo: Cung cấp bản dịch gãy gọn, tự nhiên và chuyên nghiệp nhất để học viên học tập.
(Chú ý: Do học viên dùng nhận diện giọng nói, hãy châm chước lỗi chữ đồng âm nhỏ, tập trung thẩm định khả năng phản xạ và chuẩn ngữ nghĩa).
`;

  try {
    const evaluation = await callGemini(evalPrompt);
    resBox.innerText = evaluation;
    resBox.style.display = "block";

    // Tự động mở bản gốc để học viên đối chiếu sau khi có kết quả
    document.getElementById("revealedSpeechText").style.display = "block";
    document.getElementById("speechBlindNotice").style.display = "none";
    isSpeechRevealed = true;
  } catch (err) {
    alert("Lỗi thẩm định: " + err.message);
  } finally {
    btn.innerText = "⚖️ AI Thẩm Định Phiên Dịch";
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

/* ================= AI DỊCH THUẬT (BIÊN DỊCH VIẾT) ================= */
let currentAIExercise = { text: "", source: "", target: "" };

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
