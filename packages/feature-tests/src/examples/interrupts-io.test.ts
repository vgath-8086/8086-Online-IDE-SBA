import { describe, it, expect } from 'vitest';
import { AX_REG } from '@emu8086/emulator';
import { getExample, runExample, consoleText, expectCategoryCovered } from './test-helpers.js';

describe('Interrupts / I/O examples', () => {
  it('covers every example in this category', () => {
    expectCategoryCovered('Interrupts / I/O', [
      'int21-02', 'int21-09', 'int21-01', 'int21-0a', 'int10-09',
    ]);
  });

  describe('INT 21h — Write Char (AH=02h)', () => {
    it('writes each character placed in DL to the console', async () => {
      const { source } = getExample('int21-02');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(consoleText(controller)).toBe('Hi!\n');
    });
  });

  describe('INT 21h — Print String (AH=09h)', () => {
    it('prints a $-terminated string, preserving its original case', async () => {
      const { source } = getExample('int21-09');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(consoleText(controller)).toBe('Hello, World!\r\n');
    });
  });

  describe('INT 21h — Read Char (AH=01h)', () => {
    it('waits for a keypress, echoes it, and returns its ASCII code in AL', async () => {
      const { source } = getExample('int21-01');
      const { controller, done } = await runExample(source, ['X']);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG) & 0xFF).toBe('X'.charCodeAt(0));
      expect(consoleText(controller)).toBe('Press a key: XX');
    });
  });

  describe('INT 21h — Buffered Input (AH=0Ah)', () => {
    it('reads a line, stopping early on Enter and reporting the real character count', async () => {
      const { source } = getExample('int21-0a');
      const { controller, done } = await runExample(source, ['H', 'I', '\r']);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG) & 0xFF).toBe(2); // "HI" = 2 chars, Enter excluded
      expect(consoleText(controller)).toBe('Type text and press Enter: HI\r');
    });
  });

  describe('INT 10h — Write Char + Color (AH=09h)', () => {
    it('writes each character using the requested foreground color', async () => {
      const { source } = getExample('int10-09');
      const { controller, done } = await runExample(source);
      expect(done).toBe(true);
      expect(consoleText(controller)).toBe('RGB');
    });
  });
});
