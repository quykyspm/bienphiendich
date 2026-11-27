/* ==========================================================================
   PURE-JS ISO/IEC 18004 QR CODE ENGINE (UTF-8, Versions 1-14, EC Level M/L)
   + FLASHCARD 3D & VOCABULARY QR CODE SYSTEM
   ========================================================================== */

(function (global) {
  "use strict";

  // -------------------- 1. TOAST NOTIFICATION --------------------
  function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 260);
    }, 2800);
  }
  global.showToast = showToast;

  // -------------------- 2. SAFE STORAGE HELPERS --------------------
  function safeGetStorage(key, fallback = "") {
    try {
      const val = window.localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function safeSetStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // Ignore storage restrictions in sandboxed environments
    }
  }
  global.safeGetStorage = safeGetStorage;
  global.safeSetStorage = safeSetStorage;

  // -------------------- 3. PURE-JS QR CODE ENCODER --------------------
  // Standard ISO/IEC 18004 Byte-Mode QR Code Encoder (EC Level L, Versions 1..14)
  // Level L gives high capacity (up to 458 UTF-8 bytes at v14) with 7% error recovery.
  const QR_EXP = new Uint8Array(512);
  const QR_LOG = new Uint8Array(256);
  (function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      QR_EXP[i] = x;
      QR_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) QR_EXP[i] = QR_EXP[i - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return QR_EXP[QR_LOG[a] + QR_LOG[b]];
  }

  function rsGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      const factor = QR_EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], factor);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecCount) {
    const gen = rsGeneratorPoly(ecCount);
    const res = new Uint8Array(ecCount);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ res[0];
      for (let j = 0; j < ecCount - 1; j++) res[j] = res[j + 1];
      res[ecCount - 1] = 0;
      if (factor !== 0) {
        for (let j = 0; j < ecCount; j++) {
          res[j] ^= gfMul(gen[j + 1], factor);
        }
      }
    }
    return res;
  }

  // EC Level L table: [totalDataCodewords, ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data]
  // Source: ISO/IEC 18004 Table 9 (Level L)
  const VERSION_L_TABLE = [
    null,
    [19, 7, 1, 19, 0, 0],     // v1  (21x21)
    [34, 10, 1, 34, 0, 0],    // v2  (25x25)
    [55, 15, 1, 55, 0, 0],    // v3  (29x29)
    [80, 20, 1, 80, 0, 0],    // v4  (33x33)
    [108, 26, 1, 108, 0, 0],  // v5  (37x37)
    [136, 18, 2, 68, 0, 0],   // v6  (41x41)
    [156, 20, 2, 78, 0, 0],   // v7  (45x45)
    [194, 24, 2, 97, 0, 0],   // v8  (49x49)
    [232, 30, 2, 116, 0, 0],  // v9  (53x53)
    [274, 18, 2, 68, 2, 69],  // v10 (57x57)
    [324, 20, 4, 81, 0, 0],   // v11 (61x61)
    [370, 24, 2, 92, 2, 93],  // v12 (65x65)
    [428, 26, 4, 107, 0, 0],  // v13 (69x69)
    [461, 30, 3, 115, 1, 116] // v14 (73x73)
  ];

  // Alignment pattern center coordinates for versions 1..14
  const ALIGNMENT_PATTERNS = [
    [],
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66]
  ];

  function encodeUTF8(str) {
    if (typeof TextEncoder !== "undefined") {
      return Array.from(new TextEncoder().encode(str));
    }
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) {
        bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else {
        bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return bytes;
  }

  function selectVersion(byteLen) {
    for (let v = 1; v < VERSION_L_TABLE.length; v++) {
      const totalData = VERSION_L_TABLE[v][0];
      const countBits = v <= 9 ? 8 : 16;
      const neededBits = 4 + countBits + byteLen * 8;
      if (neededBits <= totalData * 8) return v;
    }
    return VERSION_L_TABLE.length - 1;
  }

  function buildDataCodewords(bytes, version) {
    const [totalData, ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data] = VERSION_L_TABLE[version];
    const countBits = version <= 9 ? 8 : 16;
    const maxBytes = Math.floor((totalData * 8 - 4 - countBits) / 8);
    const trimmed = bytes.length > maxBytes ? bytes.slice(0, maxBytes) : bytes;

    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    };

    // Mode indicator: Byte mode = 0100
    pushBits(0b0100, 4);
    pushBits(trimmed.length, countBits);
    for (let b of trimmed) pushBits(b, 8);

    // Terminator (up to 4 zeros)
    const maxBits = totalData * 8;
    const term = Math.min(4, maxBits - bits.length);
    for (let i = 0; i < term; i++) bits.push(0);

    // Pad to byte boundary
    while (bits.length % 8 !== 0) bits.push(0);

    // Pack to bytes
    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      data.push(byte);
    }

    // Pad codewords 0xEC, 0x11
    let padToggle = 0;
    while (data.length < totalData) {
      data.push(padToggle % 2 === 0 ? 0xec : 0x11);
      padToggle++;
    }

    // Split into blocks & compute RS EC
    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (let b = 0; b < g1Blocks; b++) {
      const slice = data.slice(offset, offset + g1Data);
      offset += g1Data;
      dataBlocks.push(slice);
      ecBlocks.push(rsEncode(slice, ecPerBlock));
    }
    for (let b = 0; b < g2Blocks; b++) {
      const slice = data.slice(offset, offset + g2Data);
      offset += g2Data;
      dataBlocks.push(slice);
      ecBlocks.push(rsEncode(slice, ecPerBlock));
    }

    // Interleave data codewords
    const finalBytes = [];
    const maxBlockLen = Math.max(g1Data, g2Data);
    for (let i = 0; i < maxBlockLen; i++) {
      for (let b = 0; b < dataBlocks.length; b++) {
        if (i < dataBlocks[b].length) finalBytes.push(dataBlocks[b][i]);
      }
    }
    // Interleave EC codewords
    for (let i = 0; i < ecPerBlock; i++) {
      for (let b = 0; b < ecBlocks.length; b++) {
        finalBytes.push(ecBlocks[b][i]);
      }
    }
    return finalBytes;
  }

  function calcFormatBits(maskPattern) {
    // EC Level L = 01
    const data = (0b01 << 3) | maskPattern;
    let rem = data << 10;
    const poly = 0b10100110111;
    for (let i = 14; i >= 10; i--) {
      if ((rem >> i) & 1) rem ^= poly << (i - 10);
    }
    return ((data << 10) | rem) ^ 0b101010000010010;
  }

  function calcVersionBits(version) {
    let rem = version << 12;
    const poly = 0b1111100100101;
    for (let i = 17; i >= 12; i--) {
      if ((rem >> i) & 1) rem ^= poly << (i - 12);
    }
    return (version << 12) | rem;
  }

  function makeMatrix(version, codewords) {
    const size = version * 4 + 17;
    const modules = Array.from({ length: size }, () => new Uint8Array(size));
    const isFunc = Array.from({ length: size }, () => new Uint8Array(size));

    const setFunc = (r, c, val) => {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        modules[r][c] = val ? 1 : 0;
        isFunc[r][c] = 1;
      }
    };

    // Finder patterns + separators
    const drawFinder = (tr, tc) => {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = tr + dr;
          const c = tc + dc;
          if (r < 0 || r >= size || c < 0 || c >= size) continue;
          const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          const inBox = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
          setFunc(r, c, inBox && (onBorder || inCore));
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      setFunc(6, i, i % 2 === 0);
      setFunc(i, 6, i % 2 === 0);
    }

    // Alignment patterns
    const aligns = ALIGNMENT_PATTERNS[version];
    for (let i = 0; i < aligns.length; i++) {
      for (let j = 0; j < aligns.length; j++) {
        const ar = aligns[i];
        const ac = aligns[j];
        // Skip overlap with 3 finder patterns
        if ((ar <= 8 && ac <= 8) || (ar <= 8 && ac >= size - 9) || (ar >= size - 9 && ac <= 8)) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dist = Math.max(Math.abs(dr), Math.abs(dc));
            setFunc(ar + dr, ac + dc, dist === 0 || dist === 2);
          }
        }
      }
    }

    // Reserve format info areas
    for (let i = 0; i <= 8; i++) {
      if (i !== 6) {
        setFunc(8, i, 0);
        setFunc(i, 8, 0);
      }
    }
    for (let i = 0; i < 8; i++) setFunc(8, size - 1 - i, 0);
    for (let i = 0; i < 7; i++) setFunc(size - 1 - i, 8, 0);
    // Dark module
    setFunc(size - 8, 8, 1);

    // Version info for v >= 7
    if (version >= 7) {
      const vBits = calcVersionBits(version);
      for (let i = 0; i < 18; i++) {
        const bit = (vBits >> i) & 1;
        const a = Math.floor(i / 3);
        const b = size - 11 + (i % 3);
        setFunc(a, b, bit);
        setFunc(b, a, bit);
      }
    }

    // Place data bits in zigzag
    let bitIdx = 0;
    const totalBits = codewords.length * 8;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      const upward = ((right + 1) & 2) === 0;
      for (let vert = 0; vert < size; vert++) {
        const r = upward ? size - 1 - vert : vert;
        for (let j = 0; j < 2; j++) {
          const c = right - j;
          if (!isFunc[r][c]) {
            let bit = 0;
            if (bitIdx < totalBits) {
              bit = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
              bitIdx++;
            }
            modules[r][c] = bit;
          }
        }
      }
    }

    // Evaluate masks 0..7 and pick lowest penalty
    const maskCond = (p, r, c) => {
      switch (p) {
        case 0: return (r + c) % 2 === 0;
        case 1: return r % 2 === 0;
        case 2: return c % 3 === 0;
        case 3: return (r + c) % 3 === 0;
        case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
        case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
        case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
        case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
      }
      return false;
    };

    const applyMaskAndFormat = (mask) => {
      const m = modules.map(row => new Uint8Array(row));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!isFunc[r][c] && maskCond(mask, r, c)) {
            m[r][c] ^= 1;
          }
        }
      }
      const fBits = calcFormatBits(mask);
      for (let i = 0; i <= 5; i++) m[8][i] = (fBits >> (14 - i)) & 1;
      m[8][7] = (fBits >> 8) & 1;
      m[8][8] = (fBits >> 7) & 1;
      m[7][8] = (fBits >> 6) & 1;
      for (let i = 0; i <= 5; i++) m[5 - i][8] = (fBits >> (5 - i)) & 1;

      for (let i = 0; i <= 7; i++) m[8][size - 1 - i] = (fBits >> i) & 1;
      for (let i = 0; i <= 6; i++) m[size - 7 + i][8] = (fBits >> (14 - i)) & 1;
      m[size - 8][8] = 1;
      return m;
    };

    const scoreMatrix = (m) => {
      let penalty = 0;
      // Rule 1: consecutive runs
      for (let r = 0; r < size; r++) {
        let run = 1;
        for (let c = 1; c < size; c++) {
          if (m[r][c] === m[r][c - 1]) {
            run++;
            if (run === 5) penalty += 3;
            else if (run > 5) penalty += 1;
          } else run = 1;
        }
      }
      for (let c = 0; c < size; c++) {
        let run = 1;
        for (let r = 1; r < size; r++) {
          if (m[r][c] === m[r - 1][c]) {
            run++;
            if (run === 5) penalty += 3;
            else if (run > 5) penalty += 1;
          } else run = 1;
        }
      }
      // Rule 2: 2x2 blocks
      for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
          const v = m[r][c];
          if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) penalty += 3;
        }
      }
      // Rule 4: balance
      let dark = 0;
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) dark += m[r][c];
      const ratio = Math.abs(Math.floor((dark * 100) / (size * size)) - 50);
      penalty += Math.floor(ratio / 5) * 10;
      return penalty;
    };

    let bestMatrix = null;
    let bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const candidate = applyMaskAndFormat(mask);
      const score = scoreMatrix(candidate);
      if (score < bestScore) {
        bestScore = score;
        bestMatrix = candidate;
      }
    }
    return bestMatrix;
  }

  function generateQRMatrix(text) {
    const bytes = encodeUTF8(String(text || ""));
    const version = selectVersion(bytes.length);
    const codewords = buildDataCodewords(bytes, version);
    return makeMatrix(version, codewords);
  }

  function drawQRToCanvas(canvas, text, pixelSize = 180, options = {}) {
    if (!canvas) return null;
    const matrix = generateQRMatrix(text);
    const count = matrix.length;
    const quiet = options.quietZone !== undefined ? options.quietZone : 4;
    const totalModules = count + quiet * 2;
    const fg = options.fg || "#0f172a";
    const bg = options.bg || "#ffffff";

    // Crisp integer scaling
    const scale = Math.max(2, Math.floor(pixelSize / totalModules));
    const exactSize = scale * totalModules;

    canvas.width = exactSize;
    canvas.height = exactSize;
    canvas.style.width = pixelSize + "px";
    canvas.style.height = pixelSize + "px";

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, exactSize, exactSize);

    ctx.fillStyle = fg;
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (matrix[r][c]) {
          ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
    }
    return matrix;
  }

  global.QRCodeEngine = {
    generateMatrix: generateQRMatrix,
    drawToCanvas: drawQRToCanvas
  };

  // -------------------- 4. FLASHCARD & VOCABULARY QR SYSTEM --------------------
  let fcAllWords = [];
  let fcFiltered = [];
  let fcIndex = 0;
  let fcViewMode = "card"; // 'card' | 'grid'
  let fcQRPayloadMode = safeGetStorage("qr_payload_mode", "offline"); // 'offline' | 'link'
  let fcCustomBaseUrl = safeGetStorage("qr_custom_base_url", "");
  let fcAutoSpeak = false;
  let fcGridLimit = 24;
  let fcFlipped = false;
  let activeModalWord = null;

  function getEffectiveBaseUrl() {
    if (fcCustomBaseUrl && fcCustomBaseUrl.trim()) {
      return fcCustomBaseUrl.trim().replace(/#.*$/, "").replace(/\?.*$/, "");
    }
    try {
      if (window.location && /^https?:\/\//i.test(window.location.href)) {
        return window.location.origin + window.location.pathname;
      }
    } catch (e) {}
    return "https://bienphiendich.vercel.app/";
  }

  function buildQRPayload(wordObj, modeOverride) {
    const mode = modeOverride || fcQRPayloadMode;
    if (mode === "link") {
      const base = getEffectiveBaseUrl();
      const wordKey = wordObj.id || encodeURIComponent(wordObj.zh);
      return `${base}#vocab=${encodeURIComponent(wordKey)}`;
    }
    // Offline UTF-8 text payload: scannable anywhere without internet
    const parts = [
      `${wordObj.zh}${wordObj.pinyin ? " (" + wordObj.pinyin + ")" : ""}`,
      `Nghĩa: ${wordObj.vi || ""}`
    ];
    if (wordObj.lessonLabel) {
      parts.push(`${wordObj.sourceLabel || "Từ vựng"} - ${wordObj.lessonLabel}`);
    }
    return parts.join("\n");
  }

  function buildUnifiedVocabPool(dbData, pdData) {
    const list = [];
    const seenIds = new Set();

    if (dbData && dbData.translation) {
      Object.keys(dbData.translation).forEach((lessonKey) => {
        const lesson = dbData.translation[lessonKey];
        const lessonNum = lesson.lessonNumber || parseInt(lessonKey.replace("bai", ""), 10) || 1;
        const lessonLabel = `Bài ${lessonNum}`;
        const lessonTitleShort = (lesson.lessonTitle || lessonLabel).split("(")[0].trim();
        (lesson.texts || []).forEach((txt, tIdx) => {
          (txt.vocabulary || []).forEach((v, vIdx) => {
            if (!v || !v.zh) return;
            const id = `bd_${lessonKey}_t${tIdx + 1}_v${vIdx + 1}`;
            if (seenIds.has(id)) return;
            seenIds.add(id);
            list.push({
              id,
              zh: String(v.zh).trim(),
              pinyin: String(v.pinyin || "").trim(),
              vi: String(v.vi || "").trim(),
              lessonKey,
              lessonNum,
              lessonLabel,
              lessonTitleShort,
              textTitle: txt.titleVi || txt.title || "",
              source: "bd",
              sourceLabel: "Biên dịch"
            });
          });
        });
      });
    }

    if (pdData) {
      Object.keys(pdData).forEach((lessonKey) => {
        const lesson = pdData[lessonKey];
        if (!lesson || !lesson.texts) return;
        const lessonNum = lesson.lessonNumber || parseInt(lessonKey.replace("bai", ""), 10) || 1;
        const lessonLabel = `Bài ${lessonNum}`;
        const lessonTitleShort = (lesson.lessonTitle || lessonLabel).split("(")[0].trim();
        (lesson.texts || []).forEach((txt, tIdx) => {
          (txt.vocabulary || []).forEach((v, vIdx) => {
            if (!v || !v.zh) return;
            const id = `pd_${lessonKey}_t${tIdx + 1}_v${vIdx + 1}`;
            if (seenIds.has(id)) return;
            seenIds.add(id);
            list.push({
              id,
              zh: String(v.zh).trim(),
              pinyin: String(v.pinyin || "").trim(),
              vi: String(v.vi || "").trim(),
              lessonKey,
              lessonNum,
              lessonLabel,
              lessonTitleShort,
              textTitle: txt.titleVi || txt.title || "",
              source: "pd",
              sourceLabel: "Phiên dịch"
            });
          });
        });
      });
    }

    fcAllWords = list;
    populateFlashcardLessonFilter();
    applyFlashcardFilters();
    checkVocabDeepLink();
  }

  function populateFlashcardLessonFilter() {
    const sel = document.getElementById("fcLessonFilter");
    if (!sel) return;
    const srcSel = document.getElementById("fcSourceFilter");
    const src = srcSel ? srcSel.value : "all";

    const currentVal = sel.value || "all";
    const pool = src === "all" ? fcAllWords : fcAllWords.filter(w => w.source === src);
    const lessonMap = new Map();
    pool.forEach(w => {
      if (!lessonMap.has(w.lessonLabel)) {
        lessonMap.set(w.lessonLabel, w.lessonNum);
      }
    });
    const sorted = Array.from(lessonMap.entries()).sort((a, b) => a[1] - b[1]);

    sel.innerHTML = '<option value="all">Tất cả các bài</option>';
    sorted.forEach(([label]) => {
      const opt = document.createElement("option");
      opt.value = label;
      opt.textContent = label;
      sel.appendChild(opt);
    });

    if (lessonMap.has(currentVal)) sel.value = currentVal;
    else sel.value = "all";
  }

  function applyFlashcardFilters(resetIndex = true) {
    const src = (document.getElementById("fcSourceFilter") || {}).value || "all";
    const lesson = (document.getElementById("fcLessonFilter") || {}).value || "all";
    const q = ((document.getElementById("fcSearchInput") || {}).value || "").trim().toLowerCase();

    fcFiltered = fcAllWords.filter(w => {
      if (src !== "all" && w.source !== src) return false;
      if (lesson !== "all" && w.lessonLabel !== lesson) return false;
      if (q) {
        const hay = `${w.zh} ${w.pinyin} ${w.vi} ${w.lessonLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (resetIndex) fcIndex = 0;
    if (fcIndex >= fcFiltered.length) fcIndex = 0;
    fcGridLimit = 24;
    fcFlipped = false;

    const countEl = document.getElementById("fcTotalBadge");
    if (countEl) countEl.textContent = `${fcFiltered.length} từ`;

    renderFlashcardUI();
  }

  function renderFlashcardUI() {
    const cardView = document.getElementById("fcCardView");
    const gridView = document.getElementById("fcGridView");
    if (!cardView || !gridView) return;

    if (fcViewMode === "card") {
      cardView.style.display = "block";
      gridView.style.display = "none";
      renderSingleFlashcard();
    } else {
      cardView.style.display = "none";
      gridView.style.display = "block";
      renderFlashcardGrid();
    }
  }

  function renderSingleFlashcard() {
    const emptyEl = document.getElementById("fcEmptyState");
    const stageEl = document.getElementById("fcStageWrap");
    if (!emptyEl || !stageEl) return;

    if (fcFiltered.length === 0) {
      emptyEl.style.display = "block";
      stageEl.style.display = "none";
      return;
    }

    emptyEl.style.display = "none";
    stageEl.style.display = "block";

    const w = fcFiltered[fcIndex];
    const cardEl = document.getElementById("fcFlipCard");
    if (cardEl) {
      cardEl.classList.toggle("is-flipped", fcFlipped);
    }

    // Front face
    const frontMeta = document.getElementById("fcFrontMeta");
    const frontZh = document.getElementById("fcFrontZh");
    const frontPinyin = document.getElementById("fcFrontPinyin");
    if (frontMeta) frontMeta.textContent = `${w.sourceLabel} • ${w.lessonLabel}`;
    if (frontZh) frontZh.textContent = w.zh;
    if (frontPinyin) {
      frontPinyin.textContent = w.pinyin;
      frontPinyin.style.display = "none";
    }

    // Back face
    const backMeta = document.getElementById("fcBackMeta");
    const backZh = document.getElementById("fcBackZh");
    const backPinyin = document.getElementById("fcBackPinyin");
    const backVi = document.getElementById("fcBackVi");
    const backLesson = document.getElementById("fcBackLesson");
    if (backMeta) backMeta.textContent = `${w.sourceLabel} • ${w.lessonLabel}`;
    if (backZh) backZh.textContent = w.zh;
    if (backPinyin) backPinyin.textContent = w.pinyin;
    if (backVi) backVi.textContent = w.vi;
    if (backLesson) backLesson.textContent = w.textTitle || w.lessonTitleShort;

    // Progress
    const counter = document.getElementById("fcProgressText");
    const bar = document.getElementById("fcProgressBarFill");
    if (counter) counter.textContent = `${fcIndex + 1} / ${fcFiltered.length}`;
    if (bar) bar.style.width = `${((fcIndex + 1) / fcFiltered.length) * 100}%`;

    // Mastered state indicator
    const isMastered = typeof memorizedWords !== "undefined" && memorizedWords.has(w.zh);
    const btnMaster = document.getElementById("fcBtnMastered");
    if (btnMaster) {
      btnMaster.textContent = isMastered ? "✅ Đã thuộc" : "☆ Đánh dấu đã thuộc";
      btnMaster.classList.toggle("mastered", isMastered);
    }

    // Draw QR codes on BOTH front (compact) and back (medium)
    const payload = buildQRPayload(w);
    const frontQr = document.getElementById("fcFrontQrCanvas");
    const backQr = document.getElementById("fcBackQrCanvas");
    if (frontQr) drawQRToCanvas(frontQr, payload, 82, { quietZone: 2 });
    if (backQr) drawQRToCanvas(backQr, payload, 128, { quietZone: 3 });

    if (fcAutoSpeak && typeof playAudio === "function") {
      playAudio(w.zh, 0.95);
    }
  }

  function renderFlashcardGrid() {
    const grid = document.getElementById("fcGridContainer");
    const loadMoreBtn = document.getElementById("fcLoadMoreBtn");
    if (!grid) return;

    grid.innerHTML = "";
    if (fcFiltered.length === 0) {
      grid.innerHTML = '<div class="fc-empty">Không tìm thấy từ vựng nào phù hợp.</div>';
      if (loadMoreBtn) loadMoreBtn.style.display = "none";
      return;
    }

    const slice = fcFiltered.slice(0, fcGridLimit);
    const frag = document.createDocumentFragment();

    slice.forEach((w) => {
      const card = document.createElement("div");
      card.className = "qr-vocab-card";

      const top = document.createElement("div");
      top.className = "qr-vocab-card-top";
      top.innerHTML = `<span class="qr-card-badge">${w.sourceLabel} · ${w.lessonLabel}</span>`;

      const speakBtn = document.createElement("button");
      speakBtn.className = "qr-mini-icon-btn";
      speakBtn.title = "Phát âm";
      speakBtn.textContent = "🔊";
      speakBtn.onclick = (e) => {
        e.stopPropagation();
        if (typeof playAudio === "function") playAudio(w.zh, 0.95);
      };
      top.appendChild(speakBtn);

      const zhEl = document.createElement("div");
      zhEl.className = "qr-card-zh";
      zhEl.textContent = w.zh;

      const pyEl = document.createElement("div");
      pyEl.className = "qr-card-pinyin";
      pyEl.textContent = w.pinyin;

      const viEl = document.createElement("div");
      viEl.className = "qr-card-vi";
      viEl.textContent = w.vi;

      const qrWrap = document.createElement("div");
      qrWrap.className = "qr-card-canvas-wrap";
      qrWrap.title = "Bấm để phóng to & tải mã QR";
      const cv = document.createElement("canvas");
      qrWrap.appendChild(cv);
      qrWrap.onclick = () => openWordQRModal(w);

      card.appendChild(top);
      card.appendChild(zhEl);
      card.appendChild(pyEl);
      card.appendChild(viEl);
      card.appendChild(qrWrap);
      frag.appendChild(card);

      drawQRToCanvas(cv, buildQRPayload(w), 112, { quietZone: 3 });
    });

    grid.appendChild(frag);

    if (loadMoreBtn) {
      if (fcFiltered.length > fcGridLimit) {
        loadMoreBtn.style.display = "inline-flex";
        loadMoreBtn.textContent = `Xem thêm (${fcFiltered.length - fcGridLimit} từ còn lại)`;
      } else {
        loadMoreBtn.style.display = "none";
      }
    }
  }

  // -------------------- 5. FLASHCARD CONTROLS --------------------
  function flipFlashcard() {
    fcFlipped = !fcFlipped;
    const cardEl = document.getElementById("fcFlipCard");
    if (cardEl) cardEl.classList.toggle("is-flipped", fcFlipped);
  }

  function prevFlashcard() {
    if (fcFiltered.length === 0) return;
    fcIndex = (fcIndex - 1 + fcFiltered.length) % fcFiltered.length;
    fcFlipped = false;
    renderSingleFlashcard();
  }

  function nextFlashcard() {
    if (fcFiltered.length === 0) return;
    fcIndex = (fcIndex + 1) % fcFiltered.length;
    fcFlipped = false;
    renderSingleFlashcard();
  }

  function shuffleFlashcards() {
    if (fcFiltered.length <= 1) return;
    for (let i = fcFiltered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fcFiltered[i], fcFiltered[j]] = [fcFiltered[j], fcFiltered[i]];
    }
    fcIndex = 0;
    fcFlipped = false;
    renderFlashcardUI();
    showToast("Đã xáo trộn bộ Flashcard!", "success");
  }

  function toggleFlashcardPinyin(e) {
    if (e) e.stopPropagation();
    const el = document.getElementById("fcFrontPinyin");
    if (el) el.style.display = el.style.display === "none" ? "block" : "none";
  }

  function speakCurrentFlashcard(e) {
    if (e) e.stopPropagation();
    if (fcFiltered.length === 0) return;
    const w = fcFiltered[fcIndex];
    if (typeof playAudio === "function") playAudio(w.zh, 0.95);
  }

  function toggleAutoSpeak(btn) {
    fcAutoSpeak = !fcAutoSpeak;
    if (btn) {
      btn.classList.toggle("active", fcAutoSpeak);
      btn.textContent = fcAutoSpeak ? "🔊 Tự đọc: BẬT" : "🔇 Tự đọc: TẮT";
    }
  }

  function switchFlashcardView(mode, btnEl) {
    fcViewMode = mode;
    document.querySelectorAll("#fcViewModeGroup .pill-btn").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    renderFlashcardUI();
  }

  function loadMoreFlashcardGrid() {
    fcGridLimit += 36;
    renderFlashcardGrid();
  }

  function toggleCurrentFlashcardMastered(e) {
    if (e) e.stopPropagation();
    if (fcFiltered.length === 0) return;
    const w = fcFiltered[fcIndex];
    if (typeof memorizedWords !== "undefined") {
      if (memorizedWords.has(w.zh)) {
        memorizedWords.delete(w.zh);
        if (typeof masteredWordsSet !== "undefined") masteredWordsSet.delete(w.zh);
        showToast(`Đã bỏ đánh dấu "${w.zh}"`, "info");
      } else {
        memorizedWords.set(w.zh, { hanzi: w.zh, pinyin: w.pinyin, vn: w.vi, lesson: w.lessonLabel });
        if (typeof needReviewWords !== "undefined") needReviewWords.delete(w.zh);
        if (typeof masteredWordsSet !== "undefined") masteredWordsSet.add(w.zh);
        showToast(`Đã đánh dấu thuộc "${w.zh}"!`, "success");
      }
      const scoreEl = document.getElementById("myCorrectScore");
      if (scoreEl && typeof masteredWordsSet !== "undefined") scoreEl.textContent = masteredWordsSet.size;
      if (typeof renderStats === "function") renderStats();
      renderSingleFlashcard();
    }
  }

  function setQRPayloadMode(mode) {
    fcQRPayloadMode = mode === "link" ? "link" : "offline";
    safeSetStorage("qr_payload_mode", fcQRPayloadMode);

    document.querySelectorAll(".qr-mode-pill").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-qrmode") === fcQRPayloadMode);
    });

    const urlConfigRow = document.getElementById("qrBaseUrlConfigRow");
    if (urlConfigRow) urlConfigRow.style.display = fcQRPayloadMode === "link" ? "flex" : "none";

    renderFlashcardUI();
    if (activeModalWord) renderModalQRContent(activeModalWord);
  }

  function updateCustomBaseUrl(val) {
    fcCustomBaseUrl = (val || "").trim();
    safeSetStorage("qr_custom_base_url", fcCustomBaseUrl);
    renderFlashcardUI();
    if (activeModalWord) renderModalQRContent(activeModalWord);
  }

  function printFlashcardQR() {
    if (fcFiltered.length === 0) {
      showToast("Không có từ vựng nào để in!", "error");
      return;
    }
    const prevMode = fcViewMode;
    const prevLimit = fcGridLimit;
    fcViewMode = "grid";
    fcGridLimit = Math.min(fcFiltered.length, 120);
    renderFlashcardUI();
    setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        showToast("Trình duyệt không cho phép mở hộp thoại in ở khung xem trước.", "info");
      }
      fcViewMode = prevMode;
      fcGridLimit = prevLimit;
      renderFlashcardUI();
    }, 150);
  }

  // -------------------- 6. SHARED QR MODAL --------------------
  function openWordQRModal(wordObj) {
    if (!wordObj || !wordObj.zh) return;
    activeModalWord = wordObj;

    const modal = document.getElementById("qrModalOverlay");
    if (!modal) return;
    modal.classList.remove("hidden");

    const urlInput = document.getElementById("qrCustomUrlInput");
    if (urlInput && !urlInput.value) {
      urlInput.value = fcCustomBaseUrl || getEffectiveBaseUrl();
    }
    const urlConfigRow = document.getElementById("qrBaseUrlConfigRow");
    if (urlConfigRow) urlConfigRow.style.display = fcQRPayloadMode === "link" ? "flex" : "none";

    document.querySelectorAll(".qr-mode-pill").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-qrmode") === fcQRPayloadMode);
    });

    renderModalQRContent(wordObj);
  }

  function renderModalQRContent(wordObj) {
    const zhEl = document.getElementById("qrModalZh");
    const pyEl = document.getElementById("qrModalPinyin");
    const viEl = document.getElementById("qrModalVi");
    const metaEl = document.getElementById("qrModalMeta");
    const payloadPreview = document.getElementById("qrModalPayloadText");
    const canvas = document.getElementById("qrModalCanvas");

    if (zhEl) zhEl.textContent = wordObj.zh;
    if (pyEl) pyEl.textContent = wordObj.pinyin || "";
    if (viEl) viEl.textContent = wordObj.vi || "";
    if (metaEl) {
      metaEl.textContent = [wordObj.sourceLabel, wordObj.lessonLabel].filter(Boolean).join(" • ") || "Từ vựng Biên - Phiên dịch";
    }

    const payload = buildQRPayload(wordObj);
    if (payloadPreview) payloadPreview.textContent = payload;
    if (canvas) drawQRToCanvas(canvas, payload, 210, { quietZone: 4 });
  }

  function closeWordQRModal(e) {
    if (e && e.target && e.target.id !== "qrModalOverlay") return;
    const modal = document.getElementById("qrModalOverlay");
    if (modal) modal.classList.add("hidden");
    activeModalWord = null;
  }

  function openVocabQRByParts(zh, pinyin, vi, lessonLabel = "", sourceLabel = "") {
    const found = fcAllWords.find(w => w.zh === zh);
    if (found) {
      openWordQRModal(found);
      return;
    }
    openWordQRModal({
      id: zh,
      zh,
      pinyin: pinyin || "",
      vi: vi || "",
      lessonLabel: lessonLabel || "",
      sourceLabel: sourceLabel || "Từ vựng"
    });
  }

  function openCurrentFlashcardQR(e) {
    if (e) e.stopPropagation();
    if (fcFiltered.length === 0) return;
    openWordQRModal(fcFiltered[fcIndex]);
  }

  function speakModalWord() {
    if (!activeModalWord) return;
    if (typeof playAudio === "function") playAudio(activeModalWord.zh, 0.95);
  }

  function copyModalQRPayload() {
    if (!activeModalWord) return;
    const payload = buildQRPayload(activeModalWord);
    const done = () => showToast("Đã sao chép nội dung QR!", "success");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(done).catch(() => fallbackCopy(payload, done));
    } else {
      fallbackCopy(payload, done);
    }
  }

  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      if (cb) cb();
    } catch (e) {
      showToast("Không thể sao chép tự động.", "error");
    }
    ta.remove();
  }

  function downloadModalQRPng() {
    if (!activeModalWord) return;
    const w = activeModalWord;
    const payload = buildQRPayload(w);

    // Render a high-resolution styled PNG flashcard with QR
    const qrCanvas = document.createElement("canvas");
    drawQRToCanvas(qrCanvas, payload, 360, { quietZone: 4 });

    const out = document.createElement("canvas");
    const pad = 28;
    const width = Math.max(420, qrCanvas.width + pad * 2);
    const height = qrCanvas.height + 170;
    out.width = width;
    out.height = height;

    const ctx = out.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Top accent bar
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 0, width, 8);

    // QR Code centered
    const qrX = Math.floor((width - qrCanvas.width) / 2);
    ctx.drawImage(qrCanvas, qrX, 24);

    // Word text below QR
    const textY = 24 + qrCanvas.height + 34;
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(w.zh, width / 2, textY);

    ctx.fillStyle = "#0284c7";
    ctx.font = "600 18px sans-serif";
    ctx.fillText(w.pinyin || "", width / 2, textY + 30);

    ctx.fillStyle = "#334155";
    ctx.font = "16px sans-serif";
    const viText = (w.vi || "").length > 42 ? w.vi.slice(0, 40) + "…" : (w.vi || "");
    ctx.fillText(viText, width / 2, textY + 58);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    const footer = [w.sourceLabel, w.lessonLabel, "biên phiên dịch by QuyKy"].filter(Boolean).join(" • ");
    ctx.fillText(footer, width / 2, height - 18);

    const link = document.createElement("a");
    link.download = `QR_${w.zh}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
    showToast(`Đã tải ảnh QR_${w.zh}.png`, "success");
  }

  function jumpToWriteFromModal() {
    if (!activeModalWord) return;
    const w = activeModalWord;
    closeWordQRModal();
    if (typeof global.practiceSpecificWord === "function") {
      global.practiceSpecificWord({
        hanzi: w.zh,
        pinyin: w.pinyin,
        vn: w.vi,
        lesson: w.lessonLabel || ""
      });
    }
  }

  function jumpToWriteFromFlashcard(e) {
    if (e) e.stopPropagation();
    if (fcFiltered.length === 0) return;
    const w = fcFiltered[fcIndex];
    if (typeof global.practiceSpecificWord === "function") {
      global.practiceSpecificWord({
        hanzi: w.zh,
        pinyin: w.pinyin,
        vn: w.vi,
        lesson: w.lessonLabel || ""
      });
    }
  }

  // -------------------- 7. DEEP-LINK HANDLER (#vocab=...) --------------------
  function checkVocabDeepLink() {
    if (fcAllWords.length === 0) return;
    let targetKey = "";
    try {
      const hash = window.location.hash || "";
      const match = hash.match(/vocab=([^&]+)/i);
      if (match) targetKey = decodeURIComponent(match[1]);
      if (!targetKey && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        targetKey = params.get("vocab") || params.get("word") || "";
      }
    } catch (e) {}

    if (!targetKey) return;
    const foundIdx = fcAllWords.findIndex(w => w.id === targetKey || w.zh === targetKey);
    if (foundIdx !== -1) {
      const w = fcAllWords[foundIdx];
      if (typeof global.switchMode === "function") {
        global.switchMode("flashcard", "🃏 Flashcard & QR");
      }
      const fIdx = fcFiltered.findIndex(item => item.id === w.id);
      if (fIdx !== -1) {
        fcIndex = fIdx;
        fcFlipped = false;
        renderSingleFlashcard();
      }
      openWordQRModal(w);
    }
  }

  // Keyboard shortcuts when Flashcard tab is active
  window.addEventListener("keydown", (e) => {
    const fcTab = document.getElementById("tab-flashcard");
    const modal = document.getElementById("qrModalOverlay");
    const nameModal = document.getElementById("nameModal");
    if (!fcTab || !fcTab.classList.contains("active")) return;
    if (modal && !modal.classList.contains("hidden")) {
      if (e.key === "Escape") closeWordQRModal();
      return;
    }
    if (nameModal && !nameModal.classList.contains("hidden")) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

    if (e.code === "Space") {
      e.preventDefault();
      flipFlashcard();
    } else if (e.key === "ArrowRight") {
      nextFlashcard();
    } else if (e.key === "ArrowLeft") {
      prevFlashcard();
    } else if (e.key === "a" || e.key === "A") {
      speakCurrentFlashcard();
    }
  });

  // Expose public functions
  global.FlashcardQR = {
    initPool: buildUnifiedVocabPool,
    populateLessonFilter: populateFlashcardLessonFilter,
    applyFilters: applyFlashcardFilters,
    flip: flipFlashcard,
    prev: prevFlashcard,
    next: nextFlashcard,
    shuffle: shuffleFlashcards,
    togglePinyin: toggleFlashcardPinyin,
    speakCurrent: speakCurrentFlashcard,
    toggleAutoSpeak: toggleAutoSpeak,
    switchView: switchFlashcardView,
    loadMoreGrid: loadMoreFlashcardGrid,
    toggleMastered: toggleCurrentFlashcardMastered,
    setQRPayloadMode: setQRPayloadMode,
    updateCustomBaseUrl: updateCustomBaseUrl,
    printGrid: printFlashcardQR,
    openModal: openWordQRModal,
    closeModal: closeWordQRModal,
    openByParts: openVocabQRByParts,
    openCurrentQR: openCurrentFlashcardQR,
    speakModal: speakModalWord,
    copyModal: copyModalQRPayload,
    downloadModalPng: downloadModalQRPng,
    jumpToWriteModal: jumpToWriteFromModal,
    jumpToWriteCard: jumpToWriteFromFlashcard
  };
})(window);
