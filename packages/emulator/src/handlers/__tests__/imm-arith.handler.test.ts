import { describe, it, expect, beforeEach } from 'vitest';
import { ImmArithHandler } from '../imm-arith.handler.js';
import { makeCtx, modrm } from './helpers.js';

const AX = 0;
const IP_REG = 13;

const ARITH_IMM_WORD = 0x81; // word form; ModRM reg field selects ADD/OR/ADC/SBB/AND/SUB/XOR/CMP
const SUB_REG = 0b101;
const CMP_REG = 0b111;

describe('ImmArithHandler', () => {
  let handler: ImmArithHandler;

  beforeEach(() => { handler = new ImmArithHandler(); });

  it('matches the 0x80-0x83 immediate group', () => {
    expect(handler.matches(0x80)).toBe(true);
    expect(handler.matches(0x83)).toBe(true);
    expect(handler.matches(0x84)).toBe(false);
  });

  // Regression: generateFlag() was always called with the ADD-style overflow
  // formula (overflow when operand signs MATCH). That's correct for ADD/ADC
  // but backwards for SUB/SBB/CMP (overflow requires operand signs to DIFFER).
  // CMP AX,5 with AX=3 — same-signed positive operands, real OF must be 0.
  // Concrete fallout: this exact case made the jl-jg example's first JL not
  // jump (SF^OF was wrong), since JL reads OF set by this same code path.
  describe('CMP overflow flag (regression: subtractive, not additive)', () => {
    it('CMP AX,5 with AX=3 (same-sign operands) leaves OF=0', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0003;
      ram.writeByte(1, modrm(CMP_REG, 0)); // rm=0=AX
      ram.writeByte(2, 0x05); // imm lo
      ram.writeByte(3, 0x00); // imm hi -> imm16 = 5
      handler.execute(ARITH_IMM_WORD, ctx);
      expect(reg.R[AX]).toBe(0x0003); // CMP never writes back
      expect(reg.extractFlag('O')).toBe(0);
      expect(reg.extractFlag('S')).toBe(1); // 3-5 = -2, negative
    });

    it('CMP AX,8000h with AX=7FFFh (different-sign operands) sets OF=1', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x7FFF; // +32767
      ram.writeByte(1, modrm(CMP_REG, 0));
      ram.writeByte(2, 0x00); // imm lo
      ram.writeByte(3, 0x80); // imm hi -> imm16 = 0x8000 (-32768)
      handler.execute(ARITH_IMM_WORD, ctx);
      expect(reg.extractFlag('O')).toBe(1);
    });
  });

  describe('SUB overflow flag (regression: subtractive, not additive)', () => {
    it('SUB AX,5 with AX=3 (same-sign operands) leaves OF=0', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0003;
      ram.writeByte(1, modrm(SUB_REG, 0));
      ram.writeByte(2, 0x05);
      ram.writeByte(3, 0x00);
      handler.execute(ARITH_IMM_WORD, ctx);
      expect(reg.R[AX]).toBe(0xFFFE); // 3 - 5 = -2
      expect(reg.extractFlag('O')).toBe(0);
    });
  });

  it('advances IP by 4 for the word form (opcode + modrm + imm16)', () => {
    const { ctx, reg, ram } = makeCtx();
    ram.writeByte(1, modrm(CMP_REG, 0));
    ram.writeByte(2, 0x00);
    ram.writeByte(3, 0x00);
    handler.execute(ARITH_IMM_WORD, ctx);
    expect(reg.R[IP_REG]).toBe(4);
  });
});
