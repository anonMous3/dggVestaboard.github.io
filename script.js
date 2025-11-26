// Grid settings
const COLS = 21;
const ROWS = 4;       // <-- now 4 rows
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

const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
const bufferOutput = document.getElementById("bufferOutput");
const copyBtn = document.getElementById("copyBtn");

let isDrawing = false;
let currentColor = "red";

// 2D buffer of codes; start as all black (empty)
let buffer = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => COLOR_CODES.black)
);

// Initialize palette
const colorButtons = document.querySelectorAll(".color-btn");
colorButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentColor = btn.dataset.color;

    colorButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Clear button
const clearBtn = document.getElementById("clearBtn");
clearBtn.addEventListener("click", () => {
  resetBuffer();
  clearCanvas();
  drawGridLines();
  updateBufferOutput();
});

// Copy button
copyBtn.addEventListener("click", async () => {
  const text = bufferOutput.value;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      bufferOutput.select();
      document.execCommand("copy");
      bufferOutput.setSelectionRange(0, 0); // optional: reset selection
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

// Convert mouse event to grid cell
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

// Draw a single cell in the grid and update buffer
function fillCell(col, row, colorName) {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;

  // Map color name to code, default to black
  const code = COLOR_CODES[colorName] ?? COLOR_CODES.black;
  buffer[row][col] = code;

  // Fill visible cell
  ctx.fillStyle = colorName === "black" ? "#000000" : colorName;
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

  // Re-draw border of this cell so grid stays visible
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

  updateBufferOutput();
}

// Grid lines (just visual)
function drawGridLines() {
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;

  for (let c = 0; c <= COLS; c++) {
    const x = c * CELL_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0.5);
    ctx.lineTo(x, ROWS * CELL_SIZE + 0.5);
    ctx.stroke();
  }

  for (let r = 0; r <= ROWS; r++) {
    const y = r * CELL_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(0.5, y);
    ctx.lineTo(COLS * CELL_SIZE + 0.5, y);
    ctx.stroke();
  }
}

// Clear canvas (to black / empty)
function clearCanvas() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Reset buffer to all black
function resetBuffer() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      buffer[r][c] = COLOR_CODES.black;
    }
  }
}

// Build the text representation of the 21×4 buffer
// Non-black: {code}, black/empty: "."
// All in ONE uninterrupted line.
function updateBufferOutput() {
  const rowsAsStrings = [];

  for (let r = 0; r < ROWS; r++) {
    let rowStr = "";
    for (let c = 0; c < COLS; c++) {
      const code = buffer[r][c];
      if (code === COLOR_CODES.black) {
        rowStr += ".";
      } else {
        rowStr += `{${code}}`;
      }
    }
    rowsAsStrings.push(rowStr);
  }

  // Join rows with a single space between them
  bufferOutput.value = rowsAsStrings.join(" ");
}


// Mouse event handlers
canvas.addEventListener("mousedown", (e) => {
  const cell = getCellFromEvent(e);
  if (!cell) return;

  isDrawing = true;
  fillCell(cell.col, cell.row, currentColor);
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const cell = getCellFromEvent(e);
  if (!cell) return;

  fillCell(cell.col, cell.row, currentColor);
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

// Prevent right-click menu on the canvas (optional)
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// Initial setup
resetBuffer();
clearCanvas();
drawGridLines();
updateBufferOutput();
