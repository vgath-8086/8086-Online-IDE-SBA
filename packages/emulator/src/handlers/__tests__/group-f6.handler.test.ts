import { describe, it, expect, beforeEach } from 'vitest';
import { GroupF6Handler } from '../group-f6.handler.js';
import { makeCtx, modrm } from './helpers.js';

const AX = 0, BX = 1, DX = 3;
const IP_REG = 13;

const F6 = 0xF6; // byte-sized group 3
const F7 = 0xF7; // word-sized group 3

describe('GroupF6Handler', () => {
  let handler: GroupF6Handler;

  beforeEach(() => { handler = new GroupF6Handler(); });

  it('matches the 0xF6/0xF7 opcode range', () => {
    expect(handler.matches(0xF6)).toBe(true);
    expect(handler.matches(0xF7)).toBe(true);
    expect(handler.matches(0xF8)).toBe(false);
  });

  describe('TEST r/m, imm (reg=0) — the previously-unimplemented case', () => {
    it('ANDs AX with imm16 and sets ZF, without modifying AX', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0006; // 0000 0110b
      ram.writeByte(1, modrm(0b000, 0)); // reg=0=TEST, rm=0=AX
      ram.writeByte(2, 0x01); // imm lo
      ram.writeByte(3, 0x00); // imm hi -> imm16 = 0x0001
      handler.execute(F7, ctx);
      expect(reg.R[AX]).toBe(0x0006); // unchanged — TEST never writes back
      expect(reg.extractFlag('Z')).toBe(1); // 0x0006 & 0x0001 == 0 -> ZF set
    });

    it('clears ZF when the AND result is non-zero', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0006;
      ram.writeByte(1, modrm(0b000, 0));
      ram.writeByte(2, 0x04); // imm16 = 0x0004 -> 0x0006 & 0x0004 = 0x0004
      ram.writeByte(3, 0x00);
      handler.execute(F7, ctx);
      expect(reg.extractFlag('Z')).toBe(0);
    });

    it('advances IP by 4 for the word form (opcode + modrm + imm16)', () => {
      const { ctx, reg, ram } = makeCtx();
      ram.writeByte(1, modrm(0b000, 0));
      ram.writeByte(2, 0x00);
      ram.writeByte(3, 0x00);
      handler.execute(F7, ctx);
      expect(reg.R[IP_REG]).toBe(4);
    });

    it('works on the byte form (DL, imm8) and advances IP by 3', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[DX] = 0x00FF; // DL = 0xFF
      ram.writeByte(1, modrm(0b000, 2)); // rm=2=DL
      ram.writeByte(2, 0x0F); // imm8
      handler.execute(F6, ctx);
      expect(reg.R[DX] & 0xFF).toBe(0xFF); // unchanged
      expect(reg.extractFlag('Z')).toBe(0); // 0xFF & 0x0F = 0x0F, non-zero
      expect(reg.R[IP_REG]).toBe(3);
    });

    it('also matches reg=1 (undocumented duplicate TEST encoding)', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0006;
      ram.writeByte(1, modrm(0b001, 0));
      ram.writeByte(2, 0x01);
      ram.writeByte(3, 0x00);
      handler.execute(F7, ctx);
      expect(reg.extractFlag('Z')).toBe(1);
    });

    it('does not get stuck — IP always advances (regression for the silent no-op bug)', () => {
      const { ctx, reg, ram } = makeCtx();
      ram.writeByte(1, modrm(0b000, 0));
      ram.writeByte(2, 0x00);
      ram.writeByte(3, 0x00);
      const ipBefore = reg.R[IP_REG];
      handler.execute(F7, ctx);
      expect(reg.R[IP_REG]).not.toBe(ipBefore);
    });

    it('reads the memory operand for TEST [addr], imm without writing back', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[5] = 0; // DS = 0
      ram.writeByte(1, 0b00000110); // mod=00 reg=000 rm=110 -> direct address follows
      ram.writeByte(2, 0x50); // addr lo
      ram.writeByte(3, 0x00); // addr hi -> 0x0050
      ram.writeWord(0x50, 0x00F0);
      ram.writeByte(4, 0x0F); // imm lo
      ram.writeByte(5, 0x00); // imm hi -> 0x0F & 0xF0 = 0
      handler.execute(F7, ctx);
      expect(ram.readWord(0x50)).toBe(0x00F0); // unchanged
      expect(reg.extractFlag('Z')).toBe(1);
    });
  });

  describe('NOT (reg=2) — existing behaviour, sanity-checked', () => {
    it('flips all bits of BX', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[BX] = 0x00FF;
      ram.writeByte(1, modrm(0b010, 3)); // rm=3=BX
      handler.execute(F7, ctx);
      expect(reg.R[BX]).toBe(0xFF00);
    });
  });

  describe('NEG (reg=3) — existing behaviour, sanity-checked', () => {
    it('computes the two\'s complement of AX', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0005;
      ram.writeByte(1, modrm(0b011, 0));
      handler.execute(F7, ctx);
      expect(reg.R[AX]).toBe(0xFFFB);
    });
  });

  // Regression: NEG previously called no flag logic at all.
  describe('NEG sets flags (regression)', () => {
    it('NEG of a non-zero value sets CF=1', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0005;
      ram.writeByte(1, modrm(0b011, 0));
      handler.execute(F7, ctx);
      expect(reg.extractFlag('C')).toBe(1);
    });

    it('NEG of zero leaves CF=0 (special case)', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[BX] = 0x0000;
      ram.writeByte(1, modrm(0b011, 1)); // rm=1=BX
      handler.execute(F7, ctx);
      expect(reg.R[BX]).toBe(0x0000);
      expect(reg.extractFlag('C')).toBe(0);
    });

    it('NEG of the most-negative word (8000h) sets OF=1', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x8000;
      ram.writeByte(1, modrm(0b011, 0));
      handler.execute(F7, ctx);
      expect(reg.R[AX]).toBe(0x8000); // can't be represented positively — wraps to itself
      expect(reg.extractFlag('O')).toBe(1);
    });

    it('NEG of a small positive value leaves OF=0', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0005;
      ram.writeByte(1, modrm(0b011, 0));
      handler.execute(F7, ctx);
      expect(reg.extractFlag('O')).toBe(0);
    });
  });
});
