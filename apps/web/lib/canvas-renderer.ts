import { COLOR_TABLE } from '@emu8086/emulator';

export class CanvasRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  readonly fontSize = 10;

  constructor(canvasElement: HTMLCanvasElement) {
    const scale = window.devicePixelRatio || 1;
    canvasElement.width = Math.floor(canvasElement.width * scale);
    canvasElement.height = Math.floor(canvasElement.height * scale);
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d')!;
    this.ctx.scale(1, scale);
    this.width = canvasElement.width;
    this.height = canvasElement.height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  renderChar(offset: number, char: string, fg: number, bg: number) {
    const w = Math.floor(this.width / this.fontSize);
    const y = Math.floor(offset / w);
    const x = offset % w;
    this.ctx.beginPath();
    this.ctx.font = this.fontSize + 'px Verdana';
    this.ctx.fillStyle = COLOR_TABLE[bg] ?? 'black';
    this.ctx.fillRect(x * this.fontSize, y * this.fontSize, this.fontSize, this.fontSize);
    this.ctx.fillStyle = COLOR_TABLE[fg] ?? 'white';
    this.ctx.fillText(char, x * this.fontSize, y * this.fontSize + this.fontSize);
    this.ctx.closePath();
  }

  updateCursor(cursor: number) {
    const w = Math.floor(this.width / this.fontSize);
    const y = Math.floor(cursor / w);
    const x = cursor % w;
    setTimeout(() => {
      this.ctx.beginPath();
      this.ctx.moveTo(x * 10, y * 10 + 2);
      this.ctx.lineTo(x * 10, y * 10 + 10);
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.closePath();
    }, 500);
    setTimeout(() => {
      this.ctx.fillStyle = 'black';
      this.ctx.clearRect(x * 10, y * 10, this.ctx.lineWidth, this.fontSize);
    }, 1000);
  }
}
