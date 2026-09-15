/* ==========================================================================
   PHÂN HỆ ĐẤT NƯỚC HỌC TRUNG QUỐC (中国概况)
   ========================================================================== */

let dnhDB = null;
let dnhQuizList = [];
let currentDnhQuizIndex = 0;
let dnhQuizScore = 0;

// Hàm xáo trộn mảng ngẫu nhiên (Fisher-Yates Shuffle)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 1. Tải cơ sở dữ liệu
async function loadDnhDatabase() {
  try {
    const res = await fetch("curriculum_dnh.json?t=" + Date.now());
    if (!res.ok) throw new Error("Không thể tải curriculum_dnh.json");
    dnhDB = await res.json();
    renderDnhCards();
    renderDnhVocab();
  } catch (e) {
    console.error("Lỗi nạp DNH:", e);
  }
}
window.addEventListener("DOMContentLoaded", loadDnhDatabase);

// 2. Chuyển đổi tab con (Thẻ bài / Từ vựng / Trắc nghiệm)
function switchDnhSubTab(tab) {
  document.querySelectorAll(".dnh-subtab").forEach(el => el.style.display = "none");
  document.querySelectorAll("#dnhContainer .pill-btn").forEach(btn => btn.classList.remove("active"));

  if (tab === 'cards') {
    document.getElementById("dnhSubTabCards").style.display = "block";
    document.getElementById("btnTabDnhCards").classList.add("active");
  } else if (tab === 'vocab') {
    document.getElementById("dnhSubTabVocab").style.display = "block";
    document.getElementById("btnTabDnhVocab").classList.add("active");
  } else if (tab === 'quiz') {
    document.getElementById("dnhSubTabQuiz").style.display = "block";
    document.getElementById("btnTabDnhQuiz").classList.add("active");
    startDnhQuiz(); // Khởi động bài test mỗi lần mở tab
  }
}

// 3. Render các Thẻ kiến thức
function renderDnhCards() {
  const container = document.getElementById("dnhCardsList");
  if (!container || !dnhDB || !dnhDB.chapter1) return;

  container.innerHTML = "";
  dnhDB.chapter1.cards.forEach(card => {
    const el = document.createElement("div");
    el.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px;";
    
    let pointsHtml = card.points.map(p => `<li style="margin-bottom: 6px; color: #cbd5e1; font-size: 14px;">${p}</li>`).join("");
    
    el.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 12px; background: #0369a1; color: #e0f2fe; padding: 2px 8px; border-radius: 4px;">${card.badge}</span>
        <span style="font-size: 12px; color: #94a3b8;">${card.category}</span>
      </div>
      <h3 style="color: #f8fafc; font-size: 16px; margin: 0 0 10px 0;">${card.title}</h3>
      <ul style="padding-left: 18px; margin: 0;">${pointsHtml}</ul>
    `;
    container.appendChild(el);
  });
}

// 4. Render Bảng từ vựng chuyên ngành
function renderDnhVocab() {
  const container = document.getElementById("dnhVocabTableContainer");
  if (!container || !dnhDB || !dnhDB.chapter1) return;

  let html = `
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; color: #e2e8f0;">
      <thead>
        <tr style="border-bottom: 2px solid #334155; color: #38bdf8;">
          <th style="padding: 8px;">Chữ Hán</th>
          <th style="padding: 8px;">Pinyin</th>
          <th style="padding: 8px;">Hán-Việt</th>
          <th style="padding: 8px;">Ý nghĩa</th>
        </tr>
      </thead>
      <tbody>
  `;

  dnhDB.chapter1.vocab.forEach(v => {
    html += `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 10px 8px; font-weight: bold; color: #facc15; font-size: 16px;">${v.zh}</td>
        <td style="padding: 10px 8px; color: #94a3b8;">${v.pinyin}</td>
        <td style="padding: 10px 8px; color: #cbd5e1;">${v.hanviet}</td>
        <td style="padding: 10px 8px;">${v.meaning}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

// 5. Khởi động và XÁO TRỘN ĐỀ BÀI + ĐÁP ÁN (Fisher-Yates)
function startDnhQuiz() {
  if (!dnhDB || !dnhDB.chapter1) return;

  // Xáo trộn thứ tự các câu hỏi
  dnhQuizList = shuffleArray(dnhDB.chapter1.quizzes).map(q => {
    return {
      ...q,
      shuffledOptions: shuffleArray(q.options) // Xáo trộn 4 đáp án A/B/C/D của mỗi câu
    };
  });

  currentDnhQuizIndex = 0;
  dnhQuizScore = 0;

  document.getElementById("dnhQuizBox").style.display = "block";
  document.getElementById("dnhQuizSummary").style.display = "none";
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const box = document.getElementById("dnhQuizBox");
  const progress = document.getElementById("dnhQuizProgress");
  const cur = dnhQuizList[currentDnhQuizIndex];

  progress.innerText = `Câu ${currentDnhQuizIndex + 1} / ${dnhQuizList.length}`;

  const labels = ["A", "B", "C", "D"];
  let optionsHtml = cur.shuffledOptions.map((opt, i) => {
    return `
      <button class="dnh-opt-btn" onclick="checkDnhAnswer('${opt.replace(/'/g, "\\'")}', this)" 
              style="width: 100%; text-align: left; padding: 12px 16px; margin-bottom: 8px; background: #0f172a; color: #e2e8f0; border: 1px solid #334155; border-radius: 8px; cursor: pointer; font-size: 15px; transition: all 0.2s;">
        <strong>${labels[i]}.</strong> ${opt}
      </button>
    `;
  }).join("");

  box.innerHTML = `
    <h3 style="color: #f8fafc; margin-bottom: 16px; line-height: 1.5; font-size: 17px;">${cur.q}</h3>
    <div id="dnhOptionsContainer">${optionsHtml}</div>
    <div id="dnhExplainBox" style="display: none; margin-top: 15px; padding: 12px; border-radius: 8px; font-size: 14px; line-height: 1.4;"></div>
    <div style="text-align: right; margin-top: 15px;">
      <button id="btnNextDnhQuiz" class="pill-btn" onclick="nextDnhQuestion()" style="display: none; background: #38bdf8; color: #0f172a; font-weight: bold; padding: 8px 18px;">Câu tiếp theo ➔</button>
    </div>
  `;
}

function checkDnhAnswer(selected, btnElement) {
  const cur = dnhQuizList[currentDnhQuizIndex];
  const allBtns = document.querySelectorAll(".dnh-opt-btn");
  const explainBox = document.getElementById("dnhExplainBox");
  const btnNext = document.getElementById("btnNextDnhQuiz");

  // Vô hiệu hóa nút để chống bấm nhiều lần
  allBtns.forEach(b => b.disabled = true);

  if (selected === cur.answer) {
    btnElement.style.background = "#15803d"; // Màu xanh lá khi đúng
    btnElement.style.borderColor = "#22c55e";
    dnhQuizScore++;
    explainBox.style.display = "block";
    explainBox.style.background = "#14532d";
    explainBox.style.color = "#bbf7d0";
    explainBox.innerHTML = `✅ <strong>Chính xác!</strong> ${cur.explain}`;
  } else {
    btnElement.style.background = "#b91c1c"; // Màu đỏ khi sai
    btnElement.style.borderColor = "#ef4444";
    
    // Đổi màu đáp án đúng để đối chiếu
    allBtns.forEach(b => {
      if (b.innerText.includes(cur.answer)) {
        b.style.background = "#15803d";
        b.style.borderColor = "#22c55e";
      }
    });

    explainBox.style.display = "block";
    explainBox.style.background = "#450a0a";
    explainBox.style.color = "#fecaca";
    explainBox.innerHTML = `❌ <strong>Chưa chính xác!</strong> Đáp án đúng là: <strong>${cur.answer}</strong>.<br>${cur.explain}`;
  }

  btnNext.style.display = "inline-block";
}

function nextDnhQuestion() {
  currentDnhQuizIndex++;
  if (currentDnhQuizIndex < dnhQuizList.length) {
    renderCurrentQuestion();
  } else {
    // Kết thúc bài test
    document.getElementById("dnhQuizBox").style.display = "none";
    const summary = document.getElementById("dnhQuizSummary");
    summary.style.display = "block";
    document.getElementById("dnhQuizScoreText").innerHTML = `Bạn trả lời đúng <strong>${dnhQuizScore} / ${dnhQuizList.length}</strong> câu!`;
  }
}