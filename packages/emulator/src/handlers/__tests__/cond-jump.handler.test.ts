import { describe, it, expect, beforeEach } from 'vitest';
import { CondJumpHandler } from '../cond-jump.handler.js';
import { makeCtx } from './helpers.js';

// CON_JMP = 0x70; low nibbles from opcodes.ts
const JE   = 0x74; // jump if ZF=1
const JNE  = 0x75; // jump if ZF=0
const JB   = 0x72; // jump if CF=1
const JNB  = 0x73; // jump if CF=0

describe('CondJumpHandler', () => {
  let handler: CondJumpHandler;

  beforeEach(() => { handler = new CondJumpHandler(); });

  it('matches 0x70–0x7F', () => {
    expect(handler.matches(0x70)).toBe(true);
    expect(handler.matches(0x7F)).toBe(true);
    expect(handler.matches(0x80)).toBe(false);
  });

  describe('JE (jump if ZF=1)', () => {
    it('jumps when ZF is set', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.setFlag('Z', 1);
      reg.R[13] = 100; // IP
      ram.writeByte(101, 5); // displacement = +5
      handler.execute(JE, ctx);
      expect(reg.R[13]).toBe(107); // 100 + 2 + 5
    });

    it('does not jump when ZF is clear', () => {
      const { ctx, reg } = makeCtx();
      reg.setFlag('Z', 0);
      reg.R[13] = 100;
      handler.execute(JE, ctx);
      expect(reg.R[13]).toBe(102); // 100 + 2 only
    });
  });

  describe('JNE (jump if ZF=0)', () => {
    it('jumps when ZF is clear', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.setFlag('Z', 0);
      reg.R[13] = 50;
      ram.writeByte(51, 10);
      handler.execute(JNE, ctx);
      expect(reg.R[13]).toBe(62); // 50 + 2 + 10
    });

    it('does not jump when ZF is set', () => {
      const { ctx, reg } = makeCtx();
      reg.setFlag('Z', 1);
      reg.R[13] = 50;
      handler.execute(JNE, ctx);
      expect(reg.R[13]).toBe(52); // no jump
    });
  });

  describe('backward jumps (negative displacement)', () => {
    it('JE with negative displacement wraps IP backward', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.setFlag('Z', 1);
      reg.R[13] = 200;
      ram.writeByte(201, 0xFE); // -2 in two's complement: 200 + 2 + (-2) = 200
      handler.execute(JE, ctx);
      // signExtendByte(0xFE) = 0xFFFE masked to 16-bit → 65534 → but IP arithmetic is mod 65536
      // 200 + 2 = 202; 202 + sign_extend(0xFE=254→-2) = 202 - 2 = 200
      expect(reg.R[13]).toBe(200);
    });
  });

  describe('JB / JNB', () => {
    it('JB jumps when CF=1', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.setFlag('C', 1);
      reg.R[13] = 10;
      ram.writeByte(11, 3);
      handler.execute(JB, ctx);
      expect(reg.R[13]).toBe(15);
    });

    it('JNB jumps when CF=0', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.setFlag('C', 0);
      reg.R[13] = 10;
      ram.writeByte(11, 3);
      handler.execute(JNB, ctx);
      expect(reg.R[13]).toBe(15);
    });
  });
});
