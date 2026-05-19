import { describe, it, expect, beforeEach } from 'vitest';
import { EncoderContext } from '../encoder-context.js';

describe('EncoderContext', () => {
  let ctx: EncoderContext;

  beforeEach(() => { ctx = new EncoderContext(); });

  // ── parseOperands ─────────────────────────────────────────────────────────

  describe('parseOperands', () => {
    it('parses a two-register operand string', () => {
      const ops = ctx.parseOperands('MOV AX,BX');
      expect(ops).toEqual(['AX', 'BX', 'RX', 'RX']);
    });

    it('identifies memory operand with M tag', () => {
      const ops = ctx.parseOperands('MOV AX,[BX]');
      expect(ops[2]).toBe('RX');
      expect(ops[3]).toBe('M');
    });

    it('identifies immediate operand with I tag', () => {
      const ops = ctx.parseOperands('MOV AX,5');
      expect(ops[3]).toBe('I');
    });

    it('identifies byte registers with RL tag', () => {
      const ops = ctx.parseOperands('MOV AL,BL');
      expect(ops[2]).toBe('RL');
      expect(ops[3]).toBe('RL');
    });

    it('identifies segment registers with RS tag', () => {
      const ops = ctx.parseOperands('MOV AX,DS');
      expect(ops[3]).toBe('RS');
    });

    it('handles single operand', () => {
      const ops = ctx.parseOperands('PUSH AX');
      expect(ops.length).toBe(2); // 'AX', 'RX'
      expect(ops[1]).toBe('RX');
    });
  });

  // ── registerToId ─────────────────────────────────────────────────────────

  describe('registerToId', () => {
    it.each([
      ['ax', 0], ['al', 0], ['es', 0],
      ['cx', 1], ['cl', 1], ['cs', 1],
      ['dx', 2], ['dl', 2], ['ss', 2],
      ['bx', 3], ['bl', 3], ['ds', 3],
      ['sp', 4], ['ah', 4],
      ['bp', 5], ['ch', 5],
      ['si', 6], ['dh', 6],
      ['di', 7], ['bh', 7],
    ])('%s → %i', (name, expected) => {
      expect(ctx.registerToId(name)).toBe(expected);
    });

    it('is case-insensitive', () => {
      expect(ctx.registerToId('AX')).toBe(ctx.registerToId('ax'));
    });
  });

  // ── wordBit ───────────────────────────────────────────────────────────────

  describe('wordBit', () => {
    it('returns 1 for word register (AX)', () => {
      const ops = ctx.parseOperands('MOV AX,BX');
      expect(ctx.wordBit(ops)).toBe(1);
    });

    it('returns 0 for byte register (AL)', () => {
      const ops = ctx.parseOperands('MOV AL,BL');
      expect(ctx.wordBit(ops)).toBe(0);
    });
  });

  // ── modBits ───────────────────────────────────────────────────────────────

  describe('modBits', () => {
    it('returns 3 for register-to-register', () => {
      const ops = ctx.parseOperands('MOV AX,BX');
      expect(ctx.modBits(ops)).toBe(3);
    });

    it('returns 0 for memory without displacement', () => {
      const ops = ctx.parseOperands('MOV AX,[BX]');
      expect(ctx.modBits(ops)).toBe(0);
    });

    it('returns 1 for memory with byte displacement', () => {
      const ops = ctx.parseOperands('MOV AX,[BX+5]');
      expect(ctx.modBits(ops)).toBe(1);
    });
  });

  // ── directionBit ─────────────────────────────────────────────────────────

  describe('directionBit', () => {
    it('returns 1 when reg is destination (first operand is register)', () => {
      const ops = ctx.parseOperands('MOV AX,BX');
      expect(ctx.directionBit(ops)).toBe(1);
    });

    it('returns 0 when memory is destination', () => {
      const ops = ctx.parseOperands('MOV [BX],AX');
      expect(ctx.directionBit(ops)).toBe(0);
    });
  });

  // ── signExtendFlag ────────────────────────────────────────────────────────

  describe('signExtendFlag', () => {
    it('returns 1 for values that fit in signed byte (0–127)', () => {
      expect(ctx.signExtendFlag('100', 1)).toBe(1);
    });

    it('returns 0 for values outside signed byte (> 127)', () => {
      expect(ctx.signExtendFlag('200', 1)).toBe(0);
    });

    it('returns 1 for negative values that fit in signed byte (-128..0)', () => {
      expect(ctx.signExtendFlag('-5', 1)).toBe(1);
    });
  });

  // ── splitToBytes ──────────────────────────────────────────────────────────

  describe('splitToBytes', () => {
    it('returns single byte for small values with s=1', () => {
      expect(ctx.splitToBytes(5)).toEqual([5]);
    });

    it('returns two bytes for values > 255', () => {
      expect(ctx.splitToBytes(0x1234)).toEqual([0x34, 0x12]);
    });

    it('returns two bytes [value, 0] when s=0', () => {
      expect(ctx.splitToBytes(10, 0)).toEqual([10, 0]);
    });
  });

  // ── parseInstruction ─────────────────────────────────────────────────────

  describe('parseInstruction', () => {
    it('parses MOV AX,BX and returns correct field values', () => {
      const result = ctx.parseInstruction('MOV AX,BX');
      expect(result.w).toBe(1);    // word operation
      expect(result.d).toBe(1);    // reg is destination
      expect(result.mode).toBe(3); // register mode
    });

    it('parses MOV AL,BL as byte operation', () => {
      const result = ctx.parseInstruction('MOV AL,BL');
      expect(result.w).toBe(0);
    });
  });
});
