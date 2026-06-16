import { describe, it, expect, beforeEach } from 'vitest';
import { IncDecHandler } from '../inc-dec.handler.js';
import { makeCtx, modrm } from './helpers.js';

const AX = 0;
const IP_REG = 13;

const INC_DEC_WORD = 0xFF; // word form, reg field selects INC(0)/DEC(1)

describe('IncDecHandler', () => {
  let handler: IncDecHandler;

  beforeEach(() => { handler = new IncDecHandler(); });

  it('matches 0xFF with reg=0 (INC) or reg=1 (DEC) via the modrm peek', () => {
    const { ctx, ram } = makeCtx();
    ram.writeByte(1, modrm(0, AX)); // reg=0 = INC
    expect(handler.matches(INC_DEC_WORD, ctx)).toBe(true);
  });

  it('INC AX wraps FFFFh to 0000h', () => {
    const { ctx, reg, ram } = makeCtx();
    reg.R[AX] = 0xFFFF;
    ram.writeByte(1, modrm(0, AX)); // reg=0 = INC
    handler.execute(INC_DEC_WORD, ctx);
    expect(reg.R[AX]).toBe(0x0000);
  });

  it('DEC AX wraps 0000h to FFFFh', () => {
    const { ctx, reg, ram } = makeCtx();
    reg.R[AX] = 0x0000;
    ram.writeByte(1, modrm(1, AX)); // reg=1 = DEC
    handler.execute(INC_DEC_WORD, ctx);
    expect(reg.R[AX]).toBe(0xFFFF);
  });

  it('advances IP by 2', () => {
    const { ctx, reg, ram } = makeCtx();
    ram.writeByte(1, modrm(0, AX));
    handler.execute(INC_DEC_WORD, ctx);
    expect(reg.R[IP_REG]).toBe(2);
  });

  // Regression: INC/DEC never touch CF on real 8086 — only the SUB/CMP-style
  // generateFlag call previously clobbered it via the default (all-flags) mask.
  describe('CF is preserved (regression)', () => {
    it('DEC AX from 0000h to FFFFh leaves a pre-set CF=1 alone', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0000;
      reg.setFlag('C', 1);
      ram.writeByte(1, modrm(1, AX)); // DEC
      handler.execute(INC_DEC_WORD, ctx);
      expect(reg.R[AX]).toBe(0xFFFF);
      expect(reg.extractFlag('C')).toBe(1);
    });

    it('INC AX from FFFFh to 0000h leaves a pre-set CF=0 alone', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0xFFFF;
      reg.setFlag('C', 0);
      ram.writeByte(1, modrm(0, AX)); // INC
      handler.execute(INC_DEC_WORD, ctx);
      expect(reg.R[AX]).toBe(0x0000);
      expect(reg.extractFlag('C')).toBe(0);
    });
  });

  describe('OF (regression: DEC is subtractive, INC is additive)', () => {
    it('DEC 8000h sets OF=1 (most negative value wraps to most positive)', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x8000;
      ram.writeByte(1, modrm(1, AX)); // DEC
      handler.execute(INC_DEC_WORD, ctx);
      expect(reg.R[AX]).toBe(0x7FFF);
      expect(reg.extractFlag('O')).toBe(1);
    });

    it('INC 7FFFh sets OF=1 (max positive wraps to most negative)', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x7FFF;
      ram.writeByte(1, modrm(0, AX)); // INC
      handler.execute(INC_DEC_WORD, ctx);
      expect(reg.R[AX]).toBe(0x8000);
      expect(reg.extractFlag('O')).toBe(1);
    });
  });
});
