import { describe, it, expect } from 'vitest';
import { assembleInstruction } from '../asm-encoder.js';

describe('assembleInstruction', () => {
  describe('MOV register-to-register', () => {
    it('MOV AX,BX → [0x8B, 0xC3]', () => {
      // 0x8B = MOV word, d=1 (reg←rm); ModRM 0xC3 = mod=11 reg=0(AX) rm=3(BX)
      expect(assembleInstruction('MOV AX,BX')).toEqual([0x8B, 0xC3]);
    });

    it('MOV BX,AX → [0x8B, 0xD8]', () => {
      // ModRM 0xD8 = mod=11 reg=3(BX) rm=0(AX)
      expect(assembleInstruction('MOV BX,AX')).toEqual([0x8B, 0xD8]);
    });

    it('MOV AL,BL → byte variant 0x8A', () => {
      const result = assembleInstruction('MOV AL,BL');
      expect(result[0]).toBe(0x8A);
    });
  });

  describe('MOV immediate (compiler uses C6/C7 r/m form, not B8+r short form)', () => {
    it('MOV AX,5 → [0xC7, 0xC0, 5, 0]', () => {
      // 0xC7 = MOV r/m16,imm16; 0xC0 = mod=11 reg=0 rm=0 (AX); imm=5,0
      expect(assembleInstruction('MOV AX,5')).toEqual([0xC7, 0xC0, 5, 0]);
    });

    it('MOV AL,5 → [0xC6, 0xC0, 5]', () => {
      expect(assembleInstruction('MOV AL,5')).toEqual([0xC6, 0xC0, 5]);
    });
  });

  describe('ADD', () => {
    it('ADD AX,BX → [0x03, 0xC3]', () => {
      expect(assembleInstruction('ADD AX,BX')).toEqual([0x03, 0xC3]);
    });

    it('ADD AX,5 uses sign-extended immediate form (0x83)', () => {
      // 0x83 = arith imm w=1 s=1; 0xC0 = mod=11 reg=0(ADD) rm=0(AX); imm byte 5, pad 0
      expect(assembleInstruction('ADD AX,5')).toEqual([0x83, 0xC0, 5, 0]);
    });
  });

  describe('SUB', () => {
    it('SUB AX,BX → [0x2B, 0xC3]', () => {
      expect(assembleInstruction('SUB AX,BX')).toEqual([0x2B, 0xC3]);
    });
  });

  describe('CMP', () => {
    it('CMP AX,BX → [0x3B, 0xC3]', () => {
      expect(assembleInstruction('CMP AX,BX')).toEqual([0x3B, 0xC3]);
    });
  });

  describe('PUSH / POP (compiler uses FF/8F r/m form for registers)', () => {
    it('PUSH AX → [0xFF, 0xF0]', () => {
      // 0xFF /6 r/m16; ModRM 0xF0 = mod=11 reg=6(push) rm=0(AX)
      expect(assembleInstruction('PUSH AX')).toEqual([0xFF, 0xF0]);
    });

    it('POP AX → [0x8F, 0xC0]', () => {
      // 0x8F /0 r/m16; ModRM 0xC0 = mod=11 reg=0 rm=0(AX)
      expect(assembleInstruction('POP AX')).toEqual([0x8F, 0xC0]);
    });

    it('PUSH BX → [0xFF, 0xF3]', () => {
      // rm=3 (BX), reg=6: (3<<6)|(6<<3)|3 = 0xF3
      expect(assembleInstruction('PUSH BX')).toEqual([0xFF, 0xF3]);
    });

    it('PUSH CS (segment) → short form 0x0E', () => {
      // CS is segment 1; (1<<3)|6 = 14 = 0x0E
      expect(assembleInstruction('PUSH CS')).toEqual([0x0E]);
    });
  });

  describe('JMP', () => {
    it('JMP short produces 0xEB lead byte', () => {
      const result = assembleInstruction('JMP 5');
      expect(result[0]).toBe(0xEB);
    });
  });
});
