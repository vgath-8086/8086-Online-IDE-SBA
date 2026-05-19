import { describe, it, expect, beforeEach } from 'vitest';
import { CmpHandler } from '../cmp.handler.js';
import { makeCtx, modrm } from './helpers.js';

const AX = 0, BX = 1;

describe('CmpHandler', () => {
  let handler: CmpHandler;

  beforeEach(() => { handler = new CmpHandler(); });

  it('matches 0x38–0x3B', () => {
    expect(handler.matches(0x38)).toBe(true);
    expect(handler.matches(0x3B)).toBe(true);
    expect(handler.matches(0x3C)).toBe(false);
  });

  it('does not write result to destination register', () => {
    const { ctx, reg, ram } = makeCtx();
    reg.R[AX] = 10;
    reg.R[BX] = 4;
    ram.writeByte(1, modrm(0, 3)); // reg=0=AX, rm=3=BX
    handler.execute(0x3B, ctx);    // CMP word, d=1 (reg dst)
    // AX must not change — CMP only sets flags
    expect(reg.R[AX]).toBe(10);
    expect(reg.R[BX]).toBe(4);
  });

  it('sets ZF when operands are equal', () => {
    const { ctx, reg, ram } = makeCtx();
    reg.R[AX] = 7;
    reg.R[BX] = 7;
    ram.writeByte(1, modrm(0, 3));
    handler.execute(0x3B, ctx);
    expect(reg.extractFlag('Z')).toBe(1);
  });

  it('clears ZF when operands differ', () => {
    const { ctx, reg, ram } = makeCtx();
    reg.R[AX] = 8;
    reg.R[BX] = 3;
    ram.writeByte(1, modrm(0, 3));
    handler.execute(0x3B, ctx);
    expect(reg.extractFlag('Z')).toBe(0);
  });

  it('sets CF when src > dst (borrow)', () => {
    const { ctx, reg, ram } = makeCtx();
    reg.R[AX] = 3;   // AX=3
    reg.R[BX] = 10;  // BX=10 — AX-BX is negative, so CF=1
    ram.writeByte(1, modrm(0, 3));
    handler.execute(0x3B, ctx); // CMP AX, BX → AX - BX = 3 - 10
    expect(reg.extractFlag('C')).toBe(1);
  });

  it('sets SF when result is negative', () => {
    const { ctx, reg, ram } = makeCtx();
    reg.R[AX] = 1;
    reg.R[BX] = 5;
    ram.writeByte(1, modrm(0, 3));
    handler.execute(0x3B, ctx);
    expect(reg.extractFlag('S')).toBe(1);
  });

  it('advances IP by 2 after reg-reg compare', () => {
    const { ctx, reg, ram } = makeCtx();
    ram.writeByte(1, modrm(0, 3));
    handler.execute(0x3B, ctx);
    expect(reg.R[13]).toBe(2); // IP_REG
  });
});
