// Grid settings
const COLS = 21;
const ROWS = 4;
const CELL_SIZE = 20; // pixels

// Color codes
//  Red    63
//  Orange 64
//  Yellow 65
//  Green  66
//  Blue   67
//  Violet 68
//  White  69
//  Black  70 (empty value, shown as ".")
const COLOR_CODES = {
  red: 63,
  orange: 64,
  yellow: 65,
  green: 66,
  blue: 67,
  violet: 68,
  white: 69,
  black: 70,
};

const CODE_TO_COLOR = {
  63: "red",
  64: "orange",
  65: "yellow",
  66: "green",
  67: "blue",
  68: "violet",
  69: "white",
  70: "black",
};

const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
const bufferOutput = document.getElementById("bufferOutput");
const copyBtn = document.getElementById("copyBtn");
const tooLongMsg = document.getElementById("tooLongMsg");
const invalidMsg = document.getElementById("invalidMsg");

let isDrawing = false;
let currentColor = "red";
let isUpdatingFromCode = false;

// Buffer cells
// { type: "color", code: number, colorName: string }
// { type: "char", char: string }  <-- visually black, but preserved in string
function createBlackCell() {
  return { type: "color", code: COLOR_CODES.black, colorName: "black" };
}

let buffer = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => createBlackCell())
);

// ----- UI Helpers -----
function setInvalidState(isInvalid) {
  if (isInvalid) {
    invalidMsg.style.display = "block";
    bufferOutput.style.backgroundColor = "#4b1b1b";
  } else {
    invalidMsg.style.display = "none";
    bufferOutput.style.backgroundColor = "#111827";
  }
}

// ----- Palette -----
const colorButtons = document.querySelectorAll(".color-btn");
colorButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentColor = btn.dataset.color;

    colorButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ----- Clear button -----
const clearBtn = document.getElementById("clearBtn");
clearBtn.addEventListener("click", () => {
  resetBuffer();
  redrawCanvasFromBuffer();
  updateBufferOutput();
});

// ----- Copy button -----
copyBtn.addEventListener("click", async () => {
  const text = bufferOutput.value;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      bufferOutput.select();
      document.execCommand("copy");
      bufferOutput.setSelectionRange(0, 0);
    }

    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1000);
  } catch (err) {
    console.error("Copy failed:", err);
    copyBtn.textContent = "Error";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1000);
  }
});

// ----- Canvas interaction -----
function getCellFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);

  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
    return null;
  }

  return { col, row };
}

function drawCellVisual(col, row, cell) {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;

  if (cell && cell.type === "char") {
    // Char pixel: black background + white character
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cell.char, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
  } else {
    // Color pixel (or missing -> black)
    let colorName = "black";

    if (cell && cell.type === "color") {
      colorName = cell.colorName || CODE_TO_COLOR[cell.code] || "black";
    }

    ctx.fillStyle = colorName === "black" ? "#000000" : colorName;
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  }

  // Grid border
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
}


function fillColorCell(col, row, colorName) {
  const code = COLOR_CODES[colorName] ?? COLOR_CODES.black;
  buffer[row][col] = { type: "color", code, colorName };
  drawCellVisual(col, row, buffer[row][col]);
  updateBufferOutput();
}

canvas.addEventListener("mousedown", (e) => {
  const cell = getCellFromEvent(e);
  if (!cell) return;

  isDrawing = true;
  fillColorCell(cell.col, cell.row, currentColor);
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const cell = getCellFromEvent(e);
  if (!cell) return;

  fillColorCell(cell.col, cell.row, currentColor);
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// ----- Redraw whole canvas from buffer -----
function redrawCanvasFromBuffer() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawCellVisual(c, r, buffer[r][c]);
    }
  }
}

// ----- Buffer reset -----
function resetBuffer() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      buffer[r][c] = createBlackCell();
    }
  }
}

// ----- Encode buffer to string -----
function updateBufferOutput() {
  const rowsAsStrings = [];

  for (let r = 0; r < ROWS; r++) {
    let rowStr = "";
    for (let c = 0; c < COLS; c++) {
      const cell = buffer[r][c];

      if (cell.type === "char") {
        rowStr += cell.char;       // keep char in string
      } else {
        const code = cell.code;
        if (code === COLOR_CODES.black) {
          rowStr += ".";
        } else {
          rowStr += `{${code}}`;
        }
      }
    }
    rowsAsStrings.push(rowStr);
  }

  const result = rowsAsStrings.join(" ");

  isUpdatingFromCode = true;
  bufferOutput.value = result;
  isUpdatingFromCode = false;

  // Too-long warning
  if (result.length > 255) {
    tooLongMsg.style.display = "block";
  } else {
    tooLongMsg.style.display = "none";
  }

  // String produced from buffer is always valid
  setInvalidState(false);
}

// ----- Parse string -> buffer -----
function parseBufferString(str) {
  const trimmed = str.trim();
  if (trimmed.length === 0) {
    // Treat empty as all black
    return {
      ok: true,
      buffer: Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => createBlackCell())
      ),
    };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== ROWS) {
    return { ok: false };
  }

  const newBuffer = Array.from({ length: ROWS }, () =>
    Array(COLS)
  );

  for (let r = 0; r < ROWS; r++) {
    const rowStr = parts[r];
    let i = 0;
    let col = 0;

    while (i < rowStr.length && col < COLS) {
      const ch = rowStr[i];

      if (ch === ".") {
        newBuffer[r][col] = createBlackCell();
        col++;
        i++;
      } else if (ch === "{") {
        const close = rowStr.indexOf("}", i + 1);
        if (close === -1) return { ok: false };

        const inner = rowStr.slice(i + 1, close);
        if (!/^\d+$/.test(inner)) return { ok: false };

        const code = parseInt(inner, 10);
        const colorName = CODE_TO_COLOR[code];
        if (!colorName) return { ok: false };

        newBuffer[r][col] = { type: "color", code, colorName };
        col++;
        i = close + 1;
      } else {
        // Single alphanumeric character
        if (!/[0-9A-Za-z]/.test(ch)) {
          return { ok: false };
        }
        newBuffer[r][col] = { type: "char", char: ch };
        col++;
        i++;
      }
    }

    // Must consume exactly 21 pixels and whole row string
    if (col !== COLS || i !== rowStr.length) {
      return { ok: false };
    }
  }

  return { ok: true, buffer: newBuffer };
}

// ----- Textarea input -> update canvas -----
bufferOutput.addEventListener("input", () => {
  if (isUpdatingFromCode) return; // ignore programmatic updates

  const str = bufferOutput.value;
  const parsed = parseBufferString(str);

  if (!parsed.ok) {
    setInvalidState(true);
    // don't change canvas or internal buffer
    return;
  }

  // Valid string: update buffer & canvas
  buffer = parsed.buffer;
  setInvalidState(false);
  redrawCanvasFromBuffer();
  updateBufferOutput(); // normalize formatting / warnings
});

// ----- Initial setup -----
resetBuffer();
redrawCanvasFromBuffer();
updateBufferOutput();
