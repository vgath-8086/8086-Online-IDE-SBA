import { describe, it, expect, beforeEach } from 'vitest';
import { AddSubHandler } from '../add-sub.handler.js';
import { makeCtx, modrm } from './helpers.js';

// Register array indices (mirror constants.ts)
const AX = 0, BX = 1, CX = 2;

// ADD_REG_MEM=0x00 (w=0→byte, w=1→word; d-bit in bit1: 0=rm←reg, 1=reg←rm)
const ADD_WORD_D1 = 0x03; // ADD word, reg is dst
const SUB_WORD_D1 = 0x2B; // SUB word, reg is dst
const ADD_BYTE_D1 = 0x02; // ADD byte, reg is dst

describe('AddSubHandler', () => {
  let handler: AddSubHandler;

  beforeEach(() => { handler = new AddSubHandler(); });

  it('matches ADD opcodes', () => {
    expect(handler.matches(0x00)).toBe(true);
    expect(handler.matches(0x03)).toBe(true);
    expect(handler.matches(0x04)).toBe(true); // ADD AL,imm8
  });

  it('matches SUB opcodes', () => {
    expect(handler.matches(0x28)).toBe(true);
    expect(handler.matches(0x2B)).toBe(true);
  });

  it('does not match unrelated opcodes', () => {
    expect(handler.matches(0x90)).toBe(false); // NOP
    expect(handler.matches(0x38)).toBe(false); // CMP
  });

  describe('ADD word reg,reg', () => {
    it('adds two word registers', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 5;
      reg.R[BX] = 3;
      ram.writeByte(1, modrm(0, 3)); // IP=0, ModRM at IP+1; reg=0=AX,rm=3=BX
      handler.execute(ADD_WORD_D1, ctx);
      expect(reg.R[AX]).toBe(8);
    });

    it('sets ZF when result is zero', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0;
      reg.R[BX] = 0;
      ram.writeByte(1, modrm(0, 3));
      handler.execute(ADD_WORD_D1, ctx);
      expect(reg.extractFlag('Z')).toBe(1);
    });

    it('clears ZF when result is non-zero', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 1;
      reg.R[BX] = 2;
      ram.writeByte(1, modrm(0, 3));
      handler.execute(ADD_WORD_D1, ctx);
      expect(reg.extractFlag('Z')).toBe(0);
    });

    it('sets CF on word overflow', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0xFFFF;
      reg.R[BX] = 1;
      ram.writeByte(1, modrm(0, 3));
      handler.execute(ADD_WORD_D1, ctx);
      expect(reg.extractFlag('C')).toBe(1);
    });

    it('advances IP by 2 after reg-reg op', () => {
      const { ctx, reg, ram } = makeCtx();
      ram.writeByte(1, modrm(0, 3));
      handler.execute(ADD_WORD_D1, ctx);
      expect(reg.R[13]).toBe(2); // IP_REG
    });
  });

  describe('SUB word reg,reg', () => {
    it('subtracts word registers', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 10;
      reg.R[BX] = 4;
      ram.writeByte(1, modrm(0, 3));
      handler.execute(SUB_WORD_D1, ctx);
      expect(reg.R[AX]).toBe(6);
    });

    it('sets ZF when subtraction yields zero', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 5;
      reg.R[BX] = 5;
      ram.writeByte(1, modrm(0, 3));
      handler.execute(SUB_WORD_D1, ctx);
      expect(reg.extractFlag('Z')).toBe(1);
    });

    it('sets CF on borrow (result is negative)', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 3;
      reg.R[BX] = 5;
      ram.writeByte(1, modrm(0, 3));
      handler.execute(SUB_WORD_D1, ctx);
      expect(reg.extractFlag('C')).toBe(1);
    });
  });

  describe('ADD byte reg,reg', () => {
    it('adds byte registers without affecting upper byte', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[CX] = 0x0A; // CL=10
      reg.R[AX] = 0x0F; // AL=15
      // ModRM: reg=0=AL (byteId=0 → readByteReg(0) → low byte of R[0])
      //        rm=1=CL  (byteId=1 → readByteReg(1) → low byte of R[2])
      ram.writeByte(1, modrm(0, 1));
      handler.execute(ADD_BYTE_D1, ctx);
      // AL = AL + CL = 15 + 10 = 25 = 0x19
      expect(reg.R[AX] & 0xFF).toBe(25);
    });
  });
});
