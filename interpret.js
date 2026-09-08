/* ==========================================================================
   PHÂN HỆ PHÒNG LUYỆN PHIÊN DỊCH HỘI NGHỊ (INTERPRETATION LAB)
   Nguồn học liệu: Giáo trình PHIÊN DỊCH 1 (12 bài thực chiến)
   ========================================================================== */

/* 1. KHO DỮ LIỆU 12 BÀI GIÁO TRÌNH PHIÊN DỊCH 1 */
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

/* 2. BIẾN TRẠNG THÁI PHÒNG PHIÊN DỊCH */
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

/* 3. KHỞI TẠO BỘ CHỌN 12 BÀI HỌC */
function initCurriculumDropdown() {
  const select = document.getElementById("interpretCurriculumTopic");
  if (!select) return;
  select.innerHTML = "";
  curriculumTopics.forEach(t => {
    select.innerHTML += `<option value="${t.id}">${t.title}</option>`;
  });
}
window.addEventListener("DOMContentLoaded", initCurriculumDropdown);

/* 4. AI TỰ ĐỘNG BIÊN SOẠN BÀI PHÁT BIỂU THEO CHỦ ĐỀ */
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

/* 5. ĐIỀU KHIỂN PHÁT ÂM & XEM BẢN GỐC */
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

/* 6. THU ÂM GIỌNG NÓI PHIÊN DỊCH (WEB SPEECH RECOGNITION) */
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

/* 7. GỬI GEMINI THẨM ĐỊNH NGHIỆP VỤ PHIÊN DỊCH */
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
