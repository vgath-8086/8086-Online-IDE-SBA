import { describe, it, expect } from 'vitest';
import { AX_REG, BX_REG, CX_REG, DX_REG, SI_REG } from '@emu8086/emulator';
import { getExample, runExample, expectCategoryCovered } from './test-helpers.js';

describe('Control Flow examples', () => {
  it('covers every example in this category', () => {
    expectCategoryCovered('Control Flow', [
      'jmp', 'call-ret', 'loop', 'je-jne', 'jl-jg', 'jb-ja', 'js-jo',
    ]);
  });

  describe('JMP', () => {
    it('jumps over the instruction in between', async () => {
      const { source } = getExample('jmp');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0001);
      expect(reg.readReg(BX_REG)).toBe(0x0002); // landed past the skipped mov
    });
  });

  describe('CALL / RET', () => {
    it('calls a subroutine and returns to the caller', async () => {
      const { source } = getExample('call-ret');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG)).toBe(0x0007); // 3 + 4
    });
  });

  describe('LOOP', () => {
    it('decrements CX and repeats until it hits zero', async () => {
      const { source } = getExample('loop');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG)).toBe(0x000F); // 1+2+3+4+5
    });
  });

  describe('JE / JNE', () => {
    it('branches on ZF for both the equal and not-equal cases', async () => {
      const { source } = getExample('je-jne');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(BX_REG)).toBe(0x0001); // JE branch taken
      expect(reg.readReg(CX_REG)).toBe(0x0001); // JNE branch taken
    });
  });

  describe('JL / JG / JLE / JGE', () => {
    it('branches correctly on signed comparisons, including negative operands', async () => {
      const { source } = getExample('jl-jg');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(BX_REG)).toBe(0x0001); // JL: 3 < 5
      expect(reg.readReg(CX_REG)).toBe(0x0001); // JG: 3 > 1
      expect(reg.readReg(SI_REG)).toBe(0x0001); // JL: -2 < 1 (signed)
    });
  });

  describe('JB / JA / JBE / JAE', () => {
    it('branches correctly on unsigned comparisons, including large values', async () => {
      const { source } = getExample('jb-ja');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(BX_REG)).toBe(0x0001); // JB: 3 < 5 unsigned
      expect(reg.readReg(CX_REG)).toBe(0x0001); // JA: 3 > 1 unsigned
      expect(reg.readReg(SI_REG)).toBe(0x0001); // JA: 0FFFFh is large unsigned
    });
  });

  describe('JS / JO / JP', () => {
    it('branches on sign, signed overflow, and parity', async () => {
      const { source } = getExample('js-jo');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(BX_REG)).toBe(0x0001); // JS: result was negative
      expect(reg.readReg(CX_REG)).toBe(0x0001); // JO: signed overflow
      expect(reg.readReg(DX_REG)).toBe(0x0001); // JP: even parity (AX=3, two set bits)
      expect(reg.extractFlag('P')).toBe(1);
    });
  });
});
