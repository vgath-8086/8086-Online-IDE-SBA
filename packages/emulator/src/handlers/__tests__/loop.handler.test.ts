import { describe, it, expect, beforeEach } from 'vitest';
import { LoopHandler } from '../loop.handler.js';
import { makeCtx } from './helpers.js';

// Opcode bytes from opcodes.ts
const LOOP    = 0xE2;
const LOOPE   = 0xE1;
const LOOPNE  = 0xE0;

// R array indices
const CX_REG = 2;
const IP_REG = 13;

describe('LoopHandler', () => {
  let handler: LoopHandler;

  beforeEach(() => { handler = new LoopHandler(); });

  it('matches LOOP, LOOPE, LOOPNE', () => {
    expect(handler.matches(LOOP)).toBe(true);
    expect(handler.matches(LOOPE)).toBe(true);
    expect(handler.matches(LOOPNE)).toBe(true);
    expect(handler.matches(0xEB)).toBe(false);
  });

  describe('LOOP', () => {
    it('decrements CX on every execution', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[CX_REG] = 3;
      reg.R[IP_REG] = 100;
      ram.writeByte(101, 5); // displacement
      handler.execute(LOOP, ctx);
      expect(reg.R[CX_REG]).toBe(2);
    });

    it('jumps when CX becomes non-zero', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[CX_REG] = 3;
      reg.R[IP_REG] = 100;
      ram.writeByte(101, 5);
      handler.execute(LOOP, ctx);
      expect(reg.R[IP_REG]).toBe(107); // 100 + 2 + 5
    });

    it('falls through when CX reaches zero', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[CX_REG] = 1;
      reg.R[IP_REG] = 100;
      ram.writeByte(101, 5);
      handler.execute(LOOP, ctx);
      expect(reg.R[CX_REG]).toBe(0);
      expect(reg.R[IP_REG]).toBe(102); // no jump — advances by 2 only
    });

    it('handles backward jump (negative displacement)', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[CX_REG] = 2;
      reg.R[IP_REG] = 200;
      ram.writeByte(201, 0xFE); // -2: 200 + 2 - 2 = 200 (loop back to self)
      handler.execute(LOOP, ctx);
      expect(reg.R[IP_REG]).toBe(200);
    });
  });

  describe('LOOPE (loop while ZF=1)', () => {
    it('jumps when CX≠0 and ZF=1', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[CX_REG] = 2;
      reg.setFlag('Z', 1);
      reg.R[IP_REG] = 50;
      ram.writeByte(51, 3);
      handler.execute(LOOPE, ctx);
      expect(reg.R[IP_REG]).toBe(55); // 50 + 2 + 3
    });

    it('falls through when CX≠0 but ZF=0', () => {
      const { ctx, reg } = makeCtx();
      reg.R[CX_REG] = 2;
      reg.setFlag('Z', 0);
      reg.R[IP_REG] = 50;
      handler.execute(LOOPE, ctx);
      expect(reg.R[IP_REG]).toBe(52);
    });
  });

  describe('LOOPNE (loop while ZF=0)', () => {
    it('jumps when CX≠0 and ZF=0', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[CX_REG] = 2;
      reg.setFlag('Z', 0);
      reg.R[IP_REG] = 50;
      ram.writeByte(51, 3);
      handler.execute(LOOPNE, ctx);
      expect(reg.R[IP_REG]).toBe(55);
    });

    it('falls through when CX≠0 but ZF=1', () => {
      const { ctx, reg } = makeCtx();
      reg.R[CX_REG] = 2;
      reg.setFlag('Z', 1);
      reg.R[IP_REG] = 50;
      handler.execute(LOOPNE, ctx);
      expect(reg.R[IP_REG]).toBe(52);
    });
  });
});
