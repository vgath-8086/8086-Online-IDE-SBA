import { COLOR_TABLE, CONSOLE_COLS, CONSOLE_ROWS } from '@emu8086/emulator';

// A cell below ~10px is unreadable. When the container can't fit the full
// 80x25 grid at this floor, the canvas grows past the container instead of
// shrinking further — the wrapping element scrolls to reach the rest.
const MIN_CELL = 10;
const MAX_CELL = 18;

/**
 * Renders the 80x25 DOS-style text page into a canvas sized to fit its
 * container. The grid is always CONSOLE_COLS wide — character cell size
 * (not column count) is what adapts to available space.
 */
export class CanvasRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cellSize = 10;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d')!;
  }

  /** Recomputes cell size for the given CSS box and resets the backing store to match. */
  resize(cssWidth: number, cssHeight: number) {
    if (cssWidth <= 0 || cssHeight <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    this.cellSize = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(
      Math.min(cssWidth / CONSOLE_COLS, cssHeight / CONSOLE_ROWS)
    )));

    const pixelWidth = CONSOLE_COLS * this.cellSize;
    const pixelHeight = CONSOLE_ROWS * this.cellSize;

    this.canvas.width = pixelWidth * dpr;
    this.canvas.height = pixelHeight * dpr;
    this.canvas.style.width = `${pixelWidth}px`;
    this.canvas.style.height = `${pixelHeight}px`;
    this.ctx.scale(dpr, dpr);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderChar(offset: number, char: string, fg: number, bg: number) {
    const size = this.cellSize;
    const y = Math.floor(offset / CONSOLE_COLS);
    const x = offset % CONSOLE_COLS;
    this.ctx.font = `${size}px monospace`;
    this.ctx.fillStyle = COLOR_TABLE[bg] ?? 'black';
    this.ctx.fillRect(x * size, y * size, size, size);
    this.ctx.fillStyle = COLOR_TABLE[fg] ?? 'white';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(char, x * size + 1, y * size + size / 2);
  }

  updateCursor(cursor: number) {
    const size = this.cellSize;
    const y = Math.floor(cursor / CONSOLE_COLS);
    const x = cursor % CONSOLE_COLS;
    setTimeout(() => {
      this.ctx.beginPath();
      this.ctx.moveTo(x * size, y * size + 2);
      this.ctx.lineTo(x * size, y * size + size);
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.closePath();
    }, 500);
    setTimeout(() => {
      this.ctx.clearRect(x * size, y * size, this.ctx.lineWidth, size);
    }, 1000);
  }
}
