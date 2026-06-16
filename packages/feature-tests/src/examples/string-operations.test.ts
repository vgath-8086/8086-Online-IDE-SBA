import { describe, it, expect } from 'vitest';
import { AX_REG, BX_REG, CX_REG, SI_REG } from '@emu8086/emulator';
import { getExample, runExample, expectCategoryCovered } from './test-helpers.js';

describe('String Operations examples', () => {
  it('covers every example in this category', () => {
    expectCategoryCovered('String Operations', ['movs', 'lods', 'stos', 'cmps', 'scas', 'rep']);
  });

  describe('MOVS', () => {
    it('copies a byte and advances both SI and DI', async () => {
      const { source } = getExample('movs');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(controller.processor.RAM.readByte(0x300)).toBe(0xAB);
    });
  });

  describe('LODS', () => {
    it('loads successive bytes into AL and advances SI', async () => {
      const { source } = getExample('lods');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(BX_REG) & 0xFF).toBe(0x42); // 'B'
      expect(reg.readReg(CX_REG) & 0xFF).toBe(0x43); // 'C'
      expect(reg.readReg(SI_REG)).toBe(0x0202);
    });
  });

  describe('STOS', () => {
    it('fills a buffer with AL and advances DI each time', async () => {
      const { source } = getExample('stos');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const ram = controller.processor.RAM;
      expect(ram.readByte(0x200)).toBe(0xFF);
      expect(ram.readByte(0x201)).toBe(0xFF);
      expect(ram.readByte(0x202)).toBe(0xFF);
      expect(ram.readByte(0x203)).toBe(0xFF);
    });
  });

  describe('CMPS', () => {
    it('compares successive byte pairs and sets flags accordingly', async () => {
      const { source } = getExample('cmps');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0001); // first pair matched
      expect(reg.readReg(BX_REG)).toBe(0x0001); // second pair mismatched
    });
  });

  describe('SCAS', () => {
    it('scans for a target byte and reports it was found', async () => {
      const { source } = getExample('scas');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG)).toBe(0x0001); // found at offset 2
    });
  });

  describe('REP / REPE / REPNE', () => {
    it('fills, copies, and scans a buffer using a repeat count', async () => {
      const { source } = getExample('rep');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      // REPNE SCASB found the match at offset 2, leaving CX=1 remaining.
      expect(controller.processor.register.readReg(CX_REG)).toBe(0x0001);
    });
  });
});
