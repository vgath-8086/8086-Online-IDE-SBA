import { describe, it, expect, beforeEach } from 'vitest';
import { PushPopHandler } from '../push-pop.handler.js';
import { makeCtx } from './helpers.js';

// R array indices
const SS_REG  = 7;
const SP_REG  = 8;
const FLAG_REG = 12;
const IP_REG  = 13;

// Opcodes
const PUSHF   = 0b10011100; // 0x9C
const POPF    = 0b10011101; // 0x9D

describe('PushPopHandler', () => {
  let handler: PushPopHandler;

  beforeEach(() => { handler = new PushPopHandler(); });

  it('matches PUSHF and POPF', () => {
    expect(handler.matches(PUSHF, {} as any)).toBe(true);
    expect(handler.matches(POPF, {} as any)).toBe(true);
  });

  describe('PUSHF', () => {
    it('writes flags to stack and decrements SP', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[SS_REG] = 0x700;
      reg.R[SP_REG] = 0x100;
      reg.R[FLAG_REG] = 0b101; // CF=1, ZF-style bits
      handler.execute(PUSHF, ctx);
      // SP decremented by 2 (incSP in push direction)
      expect(reg.R[SP_REG]).toBe(0xFE); // 0x100 - 2
      // flags written at SS:new_SP = (0x700 << 4) + 0xFE
      const stackAddr = (0x700 << 4) + 0xFE;
      expect(ram.readByte(stackAddr)).toBe(0b101);
    });

    it('advances IP by 1', () => {
      const { ctx, reg } = makeCtx();
      reg.R[SS_REG] = 0;
      reg.R[SP_REG] = 0x10;
      handler.execute(PUSHF, ctx);
      expect(reg.R[IP_REG]).toBe(1);
    });
  });

  describe('POPF', () => {
    it('restores flags from stack and increments SP', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[SS_REG] = 0;
      reg.R[SP_REG] = 0x10;
      ram.writeByte(0x10, 0b11); // CF=1, PF=1
      handler.execute(POPF, ctx);
      expect(reg.R[FLAG_REG]).toBe(0b11);
      expect(reg.R[SP_REG]).toBe(0x12); // decSP = +2
    });
  });

  describe('PUSH imm8 (0x6A)', () => {
    it('pushes sign-extended byte to stack', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[SS_REG] = 0;
      reg.R[SP_REG] = 0x20;
      reg.R[IP_REG] = 100;
      ram.writeByte(101, 42); // imm8 = 42
      handler.execute(106, ctx); // 0x6A
      expect(reg.R[SP_REG]).toBe(0x1E); // 0x20 - 2
      expect(ram.readByte(0x1E)).toBe(42);
    });
  });

  describe('segment PUSH (ES=0x06)', () => {
    it('pushes ES segment register to stack', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[SS_REG] = 0;
      reg.R[SP_REG] = 0x20;
      // ES is segment 0 → op = (0 << 3) | 6 = 0x06
      reg.writeSegReg(0, 0x1234); // ES = 0x1234
      handler.execute(0x06, ctx);
      expect(reg.R[SP_REG]).toBe(0x1E); // 0x20 - 2
      // ES value written word at SS:SP-2 = 0x1E
      expect(ram.readWord(0x1E)).toBe(0x1234);
    });
  });
});
