import { describe, it, expect, beforeEach } from 'vitest';
import { MovHandler } from '../mov.handler.js';
import { makeCtx, modrm } from './helpers.js';

// R array indices
const AX = 0, BX = 1, CX = 2;
const IP_REG = 13;

// Opcode constants (mirrors opcodes.ts)
const MOV_RM_RM_WORD_D1      = 0x8B; // MOV r16, r/m16 (d=1, w=1)
const MOV_RM_RM_BYTE_D1      = 0x8A; // MOV r8,  r/m8  (d=1, w=0)
const MOV_RM_RM_WORD_D0      = 0x89; // MOV r/m16, r16 (d=0, w=1)
const MOV_IMM_TO_RM_WORD     = 0xC7; // MOV r/m16, imm16
const MOV_IMM_TO_RM_BYTE     = 0xC6; // MOV r/m8,  imm8
const MOV_IMM_TO_R_AX        = 0xB8; // MOV AX, imm16

describe('MovHandler', () => {
  let handler: MovHandler;

  beforeEach(() => { handler = new MovHandler(); });

  it('matches MOV_RM_RM range (0x88–0x8B)', () => {
    expect(handler.matches(0x88)).toBe(true);
    expect(handler.matches(0x8B)).toBe(true);
  });

  it('matches MOV_IMM_TO_R range (0xB0–0xBF)', () => {
    expect(handler.matches(0xB0)).toBe(true);
    expect(handler.matches(0xBF)).toBe(true);
  });

  it('matches MOV_IMM_TO_RM (0xC6–0xC7)', () => {
    expect(handler.matches(0xC6)).toBe(true);
    expect(handler.matches(0xC7)).toBe(true);
  });

  it('does not match ADD/SUB opcodes', () => {
    expect(handler.matches(0x03)).toBe(false);
    expect(handler.matches(0x2B)).toBe(false);
  });

  // ── MOV r/m ↔ r/m (reg-to-reg) ──────────────────────────────────────────

  describe('MOV reg,reg (word, d=1: reg←rm)', () => {
    it('copies word value from BX into AX', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0;
      reg.R[BX] = 42;
      ram.writeByte(1, modrm(0, 3)); // reg=0=AX, rm=3=BX
      handler.execute(MOV_RM_RM_WORD_D1, ctx);
      expect(reg.R[AX]).toBe(42);
      expect(reg.R[BX]).toBe(42); // source unchanged
    });

    it('advances IP by 2 after reg-reg', () => {
      const { ctx, reg, ram } = makeCtx();
      ram.writeByte(1, modrm(0, 3));
      handler.execute(MOV_RM_RM_WORD_D1, ctx);
      expect(reg.R[IP_REG]).toBe(2);
    });
  });

  describe('MOV reg,reg (word, d=0: rm←reg)', () => {
    it('copies AX into BX', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 100;
      reg.R[BX] = 0;
      ram.writeByte(1, modrm(0, 3)); // reg=0=AX, rm=3=BX → d=0: BX=AX
      handler.execute(MOV_RM_RM_WORD_D0, ctx);
      expect(reg.R[BX]).toBe(100);
    });
  });

  describe('MOV reg,reg (byte, d=1)', () => {
    it('copies CL into AL without affecting upper byte', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[CX] = 0x0055; // CL = 0x55
      reg.R[AX] = 0xFF00; // AL = 0
      // byte reg=0=AL, rm=1=CL
      ram.writeByte(1, modrm(0, 1));
      handler.execute(MOV_RM_RM_BYTE_D1, ctx);
      expect(reg.R[AX] & 0xFF).toBe(0x55);    // AL = CL
      expect((reg.R[AX] >> 8) & 0xFF).toBe(0xFF); // AH unchanged
    });
  });

  // ── MOV r/m ← immediate (C6/C7) ─────────────────────────────────────────

  describe('MOV r/m, imm (word C7)', () => {
    it('writes immediate word to register', () => {
      const { ctx, reg, ram } = makeCtx();
      // ModRM 0xC0 = mod=11 reg=0 rm=0 (AX), imm at ip+2: [lo=0xBB, hi=0x00]
      ram.writeByte(1, 0xC0); // ModRM
      ram.writeByte(2, 0xBB); // imm lo
      ram.writeByte(3, 0x00); // imm hi
      handler.execute(MOV_IMM_TO_RM_WORD, ctx);
      expect(reg.R[AX]).toBe(0x00BB);
    });

    it('handles 16-bit immediate value', () => {
      const { ctx, reg, ram } = makeCtx();
      ram.writeByte(1, 0xC0);
      ram.writeByte(2, 0x34);
      ram.writeByte(3, 0x12); // imm = 0x1234
      handler.execute(MOV_IMM_TO_RM_WORD, ctx);
      expect(reg.R[AX]).toBe(0x1234);
    });
  });

  describe('MOV r/m, imm (byte C6)', () => {
    it('writes immediate byte to AL', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0xFF00; // AL = 0
      ram.writeByte(1, 0xC0); // ModRM rm=0=AL
      ram.writeByte(2, 0x7F); // imm8 = 127
      handler.execute(MOV_IMM_TO_RM_BYTE, ctx);
      expect(reg.R[AX] & 0xFF).toBe(0x7F);
    });
  });

  // ── MOV reg ← imm (B8+r short form) ─────────────────────────────────────

  describe('MOV AX, imm16 (0xB8 short form)', () => {
    it('loads 16-bit immediate directly into AX', () => {
      const { ctx, reg, ram } = makeCtx();
      ram.writeByte(1, 0x05); // imm lo
      ram.writeByte(2, 0x00); // imm hi → 0x0005
      handler.execute(MOV_IMM_TO_R_AX, ctx);
      expect(reg.R[AX]).toBe(5);
    });

    it('advances IP by 3 (opcode + 2-byte imm)', () => {
      const { ctx, reg, ram } = makeCtx();
      ram.writeByte(1, 0x01);
      ram.writeByte(2, 0x00);
      handler.execute(MOV_IMM_TO_R_AX, ctx);
      expect(reg.R[IP_REG]).toBe(3);
    });
  });

  // ── MOV accumulator ↔ memory ──────────────────────────────────────────────
  // In this emulator's encoding: (op>>1)%2=0 → STORE acc→mem, (op>>1)%2=1 → LOAD mem→acc
  // 0xA0/A1 = store; 0xA2/A3 = load (note: differs from typical ISA docs)

  describe('MOV [addr],AX (accumulator store, 0xA1)', () => {
    it('writes AX to memory at DS:addr', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[5] = 0;       // DS = 0
      reg.R[AX] = 0x1234; // AX value to store
      ram.writeByte(1, 0x50); // addr lo
      ram.writeByte(2, 0x00); // addr hi → effective addr 0x50
      handler.execute(0xA1, ctx);
      expect(ram.readWord(0x50)).toBe(0x1234);
    });
  });

  describe('MOV AX,[addr] (accumulator load, 0xA3)', () => {
    it('reads word from DS:addr into AX', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[5] = 0; // DS = 0
      ram.writeByte(1, 0x50); // addr lo = 0x50
      ram.writeByte(2, 0x00); // addr hi
      ram.writeWord(0x50, 0x1234); // word at address 0x50
      handler.execute(0xA3, ctx);
      expect(reg.R[AX]).toBe(0x1234);
    });
  });

  // ── Regression: MOV must never touch flags ──────────────────────────────
  // Bug: every MOV form called ctx.generateFlag(), so a MOV between a flag-set
  // and a flag-consuming instruction (e.g. STC; MOV AX,1; RCR AX,1) silently
  // clobbered CF/ZF/SF/PF. Real 8086 MOV touches no flags at all.
  describe('MOV does not affect flags (regression)', () => {
    it('reg←reg MOV leaves a pre-set carry flag untouched', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.setFlag('C', 1);
      ram.writeByte(1, modrm(0, 3));
      handler.execute(MOV_RM_RM_WORD_D1, ctx);
      expect(reg.extractFlag('C')).toBe(1);
    });

    it('MOV r/m, imm leaves a pre-set carry flag untouched', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.setFlag('C', 1);
      ram.writeByte(1, 0xC0);
      ram.writeByte(2, 0x00);
      ram.writeByte(3, 0x00); // MOV AX, 0 — would set ZF if MOV touched flags
      handler.execute(MOV_IMM_TO_RM_WORD, ctx);
      expect(reg.extractFlag('C')).toBe(1);
      expect(reg.extractFlag('Z')).toBe(0);
    });

    it('MOV reg, imm16 (short form) leaves flags untouched', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.setFlag('C', 1);
      ram.writeByte(1, 0x00);
      ram.writeByte(2, 0x00); // MOV AX, 0
      handler.execute(MOV_IMM_TO_R_AX, ctx);
      expect(reg.extractFlag('C')).toBe(1);
      expect(reg.extractFlag('Z')).toBe(0);
    });
  });
});
