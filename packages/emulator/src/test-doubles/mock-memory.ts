import type { IMemory } from '../interfaces/i-memory.js';

export class MockMemory implements IMemory {
  private readonly buf = new Uint8Array(0x100000);

  readByte(address: number): number {
    return this.buf[address & 0xFFFFF] ?? 0;
  }

  readWord(address: number): number {
    const lo = this.buf[address & 0xFFFFF]       ?? 0;
    const hi = this.buf[(address + 1) & 0xFFFFF] ?? 0;
    return lo | (hi << 8);
  }

  writeByte(address: number, value: number): void {
    this.buf[address & 0xFFFFF] = value & 0xFF;
  }

  writeWord(address: number, value: number): void {
    this.buf[address & 0xFFFFF]       = value & 0xFF;
    this.buf[(address + 1) & 0xFFFFF] = (value >> 8) & 0xFF;
  }

  _writeByte(address: number, value: number): void {
    this.buf[address & 0xFFFFF] = value & 0xFF;
  }
}
