import { describe, it, expect, beforeEach } from 'vitest';
import { LogicHandler } from '../logic.handler.js';
import { makeCtx, modrm } from './helpers.js';

const AX = 0;

const OR_WORD_D1 = 0x0B; // OR r16, r/m16 (d=1, w=1)

describe('LogicHandler', () => {
  let handler: LogicHandler;

  beforeEach(() => { handler = new LogicHandler(); });

  it('ORs two words together', () => {
    const { ctx, reg, ram } = makeCtx();
    reg.R[AX] = 0x0F00;
    ram.writeByte(1, modrm(0, 0)); // OR AX, AX (rm=0=AX into reg=0=AX)
    handler.execute(OR_WORD_D1, ctx);
    expect(reg.R[AX]).toBe(0x0F00);
  });

  // Regression: PF was computed as `value % 2` (the result's LSB) instead of
  // the real 8086 parity flag (whether the low byte has an EVEN bit count).
  // These two values are the discriminating case: both are odd numbers (old
  // formula agrees on neither), but 3 has even bit-parity and 1 has odd.
  describe('parity flag (regression: real bit-parity, not value%2)', () => {
    it('OR AX,AX with AX=3 (00000011b, two set bits) sets PF=1', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0003;
      ram.writeByte(1, modrm(0, 0));
      handler.execute(OR_WORD_D1, ctx);
      expect(reg.extractFlag('P')).toBe(1);
    });

    it('OR AX,AX with AX=1 (00000001b, one set bit) leaves PF=0', () => {
      const { ctx, reg, ram } = makeCtx();
      reg.R[AX] = 0x0001;
      ram.writeByte(1, modrm(0, 0));
      handler.execute(OR_WORD_D1, ctx);
      expect(reg.extractFlag('P')).toBe(0);
    });
  });
});
