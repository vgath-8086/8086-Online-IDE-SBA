import type { IRegisters } from '../interfaces/i-registers.js';

// Register indices mirror constants.ts
const FLAG_REG = 12;
const IP_REG   = 13;
const SP_REG   = 8;

// SEGMENT_REGISTERS_TABLE: ES=6, CS=4, SS=7, DS=5
const SEG_TABLE = [6, 4, 7, 5];
// WORD_REGISTERS_TABLE: AX=0, CX=2, DX=3, BX=1, SP=8, BP=9, SI=11, DI=10
const WORD_TABLE = [0, 2, 3, 1, 8, 9, 11, 10];

export class MockRegisters implements IRegisters {
  readonly R = new Array<number>(14).fill(0);

  readReg(id: number): number               { return this.R[id] ?? 0; }
  writeReg(id: number, value: number): void { this.R[id] = value; }

  readByteReg(id: number): number {
    const reg = WORD_TABLE[id % 4];
    return (id >> 2) ? (this.R[reg] >> 8) & 0xFF : this.R[reg] & 0xFF;
  }

  writeByteReg(id: number, value: number): void {
    const reg = WORD_TABLE[id % 4];
    if (id >> 2) {
      this.R[reg] = (this.R[reg] & 0x00FF) | ((value & 0xFF) << 8);
    } else {
      this.R[reg] = (this.R[reg] & 0xFF00) | (value & 0xFF);
    }
  }

  readWordReg(id: number): number               { return this.R[WORD_TABLE[id]] ?? 0; }
  writeWordReg(id: number, value: number): void { this.R[WORD_TABLE[id]] = value; }
  readSegReg(id: number): number                { return this.R[SEG_TABLE[id]] ?? 0; }
  writeSegReg(id: number, value: number): void  { this.R[SEG_TABLE[id]] = value; }

  incIP(by: number): void  { this.R[IP_REG] = (this.R[IP_REG] + by) & 0xFFFF; }
  incSP(): void            { this.R[SP_REG] = (this.R[SP_REG] - 2) & 0xFFFF; }
  decSP(): void            { this.R[SP_REG] = (this.R[SP_REG] + 2) & 0xFFFF; }

  copyRegister(destId: number, srcId: number): void {
    this.R[destId] = this.R[srcId];
  }

  executeMul(_registerId: number, _type: number): void { /* minimal for tests */ }
  executeDiv(_registerId: number, _type: number): void { /* minimal for tests */ }

  extractFlag(name: string): number {
    const val = this.R[FLAG_REG];
    switch (name) {
      case 'O': return (val >> 8) & 1;
      case 'D': return (val >> 7) & 1;
      case 'I': return (val >> 6) & 1;
      case 'T': return (val >> 5) & 1;
      case 'S': return (val >> 4) & 1;
      case 'Z': return (val >> 3) & 1;
      case 'A': return (val >> 2) & 1;
      case 'P': return (val >> 1) & 1;
      case 'C': return val & 1;
      default:  return 0;
    }
  }

  setFlag(name: string, bit: number): void {
    let val = this.R[FLAG_REG];
    switch (name) {
      case 'O': bit ? (val |= 0x100) : (val &= ~0x100); break;
      case 'D': bit ? (val |= 0x080) : (val &= ~0x080); break;
      case 'I': bit ? (val |= 0x040) : (val &= ~0x040); break;
      case 'T': bit ? (val |= 0x020) : (val &= ~0x020); break;
      case 'S': bit ? (val |= 0x010) : (val &= ~0x010); break;
      case 'Z': bit ? (val |= 0x008) : (val &= ~0x008); break;
      case 'A': bit ? (val |= 0x004) : (val &= ~0x004); break;
      case 'P': bit ? (val |= 0x002) : (val &= ~0x002); break;
      case 'C': bit ? (val |= 0x001) : (val &= ~0x001); break;
    }
    this.R[FLAG_REG] = val & 0x1FF;
  }
}
