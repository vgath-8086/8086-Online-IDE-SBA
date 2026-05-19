import { describe, it, expect, beforeEach } from 'vitest';
import { ShiftRotateHandler } from '../shift-rotate.handler.js';
import { makeCtx } from './helpers.js';

// op = 0xD1: shift/rotate word, count=1
// ModRM reg field selects operation: SHL=4, SHR=5, SAR=7, ROL=0, ROR=1
const SHL_WORD_ONCE = 0xD1;

// ModRM helpers: mod=11 (reg), rm=0 (AX word encoding → R[0])
const modrm_reg = (regField: number) => 0b11000000 | (regField << 3) | 0; // rm=0=AX

describe('ShiftRotateHandler', () => {
  let handler: ShiftRotateHandler;

  beforeEach(() => { handler = new ShiftRotateHandler(); });

  it('matches 0xD0–0xD3', () => {
    expect(handler.matches(0xD0)).toBe(true);
    expect(handler.matches(0xD3)).toBe(true);
    expect(handler.matches(0xD4)).toBe(false);
  });

  describe('SHL word by 1 (subOp=4)', () => {
    it('doubles the register value', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[0] = 5;          // AX = 5
      ram.writeByte(1, modrm_reg(4)); // SHL
      handler.execute(SHL_WORD_ONCE, ctx);
      expect(reg.R[0]).toBe(10); // 5 << 1 = 10
    });

    it('sets CF from the shifted-out MSB', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[0] = 0x8000;     // bit 15 set
      ram.writeByte(1, modrm_reg(4));
      handler.execute(SHL_WORD_ONCE, ctx);
      expect(reg.extractFlag('C')).toBe(1);
    });

    it('clears CF when MSB was 0', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[0] = 0x0001;
      ram.writeByte(1, modrm_reg(4));
      handler.execute(SHL_WORD_ONCE, ctx);
      expect(reg.extractFlag('C')).toBe(0);
    });

    it('masks result to 16 bits', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[0] = 0xFFFF;
      ram.writeByte(1, modrm_reg(4));
      handler.execute(SHL_WORD_ONCE, ctx);
      expect(reg.R[0]).toBe(0xFFFE); // (0xFFFF << 1) & 0xFFFF
    });
  });

  describe('SHR word by 1 (subOp=5)', () => {
    it('halves the value', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[0] = 10;
      ram.writeByte(1, modrm_reg(5)); // SHR
      handler.execute(SHL_WORD_ONCE, ctx);
      expect(reg.R[0]).toBe(5);
    });

    it('sets CF from the shifted-out LSB', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[0] = 0x0001; // LSB = 1
      ram.writeByte(1, modrm_reg(5));
      handler.execute(SHL_WORD_ONCE, ctx);
      expect(reg.extractFlag('C')).toBe(1);
    });
  });

  describe('SAR word by 1 (subOp=7)', () => {
    it('preserves the sign bit on negative numbers', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[0] = 0x8000; // negative (bit 15 = 1)
      ram.writeByte(1, modrm_reg(7)); // SAR
      handler.execute(SHL_WORD_ONCE, ctx);
      expect(reg.R[0]).toBe(0xC000); // 0x8000 >> 1 with sign fill
    });
  });

  describe('ROL word by 1 (subOp=0)', () => {
    it('rotates MSB into LSB', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[0] = 0x8001; // bit 15 and bit 0 set
      ram.writeByte(1, modrm_reg(0)); // ROL
      handler.execute(SHL_WORD_ONCE, ctx);
      expect(reg.R[0]).toBe(0x0003); // (0x8001 << 1) | old_bit15(1) = 0x0002 | 1 = 0x0003
    });
  });

  it('advances IP by 2', () => {
    const { ctx, reg, ram } = makeCtx();
    ram.writeByte(1, modrm_reg(4));
    handler.execute(SHL_WORD_ONCE, ctx);
    expect(reg.R[13]).toBe(2); // IP_REG
  });
});
