import { describe, it, expect } from 'vitest';
import { AX_REG } from '@emu8086/emulator';
import { getExample, runExample, consoleText, expectCategoryCovered } from './test-helpers.js';

describe('Algorithms examples', () => {
  it('covers every example in this category', () => {
    expectCategoryCovered('Algorithms', [
      'fibonacci', 'bubble-sort', 'multiply-loop', 'string-length', 'countdown',
    ]);
  });

  describe('Fibonacci Sequence', () => {
    it('stores F(0) through F(7) as 16-bit words at DS:0200h', async () => {
      const { source } = getExample('fibonacci');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const ram = controller.processor.RAM;
      const expected = [0, 1, 1, 2, 3, 5, 8, 13];
      for (let i = 0; i < expected.length; i++) {
        expect(ram.readWord(0x200 + i * 2)).toBe(expected[i]);
      }
    });
  });

  describe('Bubble Sort', () => {
    it('sorts [5,3,1,4,2] into ascending order', async () => {
      const { source } = getExample('bubble-sort');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const ram = controller.processor.RAM;
      expect([0, 1, 2, 3, 4].map(i => ram.readByte(0x200 + i))).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Multiply via Addition', () => {
    it('computes 6 × 7 using repeated addition and LOOP', async () => {
      const { source } = getExample('multiply-loop');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG)).toBe(0x002A); // 42
    });
  });

  describe('String Length', () => {
    it('measures a null-terminated string using REPNE SCASB', async () => {
      const { source } = getExample('string-length');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG)).toBe(0x0003); // length of "Hi!"
    });
  });

  describe('Countdown 5→1', () => {
    it('prints a countdown using LOOP and INT 21h AH=02h', async () => {
      const { source } = getExample('countdown');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(consoleText(controller)).toBe('5 4 3 2 1 ');
    });
  });
});
