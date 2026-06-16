import { describe, it, expect } from 'vitest';
import { AX_REG, BX_REG, SI_REG } from '@emu8086/emulator';
import { getExample, runExample, expectCategoryCovered } from './test-helpers.js';

describe('Flag Operations examples', () => {
  it('covers every example in this category', () => {
    expectCategoryCovered('Flag Operations', ['clc-stc-cmc', 'cld-std']);
  });

  describe('CLC / STC / CMC', () => {
    it('clears, sets, and complements CF, and ADC reads the resulting carry', async () => {
      const { source } = getExample('clc-stc-cmc');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0005);
      expect(reg.readReg(BX_REG)).toBe(0x0001); // 0 + 0 + CF(1)
      expect(reg.extractFlag('C')).toBe(0); // final stc;cmc leaves CF=0
    });
  });

  describe('CLD / STD', () => {
    it('controls whether string instructions auto-increment or auto-decrement', async () => {
      const { source } = getExample('cld-std');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG) & 0xFF).toBe(0x02);
      expect(reg.readReg(SI_REG)).toBe(0x0200); // back to start after forward+backward scan
    });
  });
});
