import { describe, it, expect, beforeEach } from 'vitest';
import { InterruptHandler } from '../interrupt.handler.js';
import { makeCtx } from './helpers.js';
import { INT } from '../../opcodes.js';

const AX = 0, BX = 1, DX = 3;
const IP_REG = 13;

describe('InterruptHandler', () => {
  let handler: InterruptHandler;

  beforeEach(() => { handler = new InterruptHandler(); });

  it('matches the INT opcode (0xCC)', () => {
    expect(handler.matches(INT)).toBe(true);
    expect(handler.matches(0x90)).toBe(false);
  });

  describe('INT 21h AH=02h — write character', () => {
    it('writes DL to the console and advances IP by 2', () => {
      const { ctx, reg, ram, cnsl } = makeCtx();
      ram.writeByte(1, 0x21); // interrupt number
      reg.R[AX] = 0x0200;     // AH=02h
      reg.R[DX] = 0x0048;     // DL = 'H'
      handler.execute(INT, ctx);
      expect(cnsl.written).toEqual([0x48]);
      expect(reg.R[IP_REG]).toBe(2);
    });
  });

  describe('INT 21h AH=09h — print $-terminated string', () => {
    it('writes each character up to the $ terminator', () => {
      const { ctx, reg, ram, cnsl } = makeCtx();
      ram.writeByte(1, 0x21);
      reg.R[AX] = 0x0900; // AH=09h
      reg.R[DX] = 0x0050; // DX = string address
      const msg = 'Hi';
      for (let i = 0; i < msg.length; i++) ram.writeByte(0x50 + i, msg.charCodeAt(i));
      ram.writeByte(0x50 + msg.length, 0x24); // '$'
      handler.execute(INT, ctx);
      expect(cnsl.written).toEqual([msg.charCodeAt(0), msg.charCodeAt(1)]);
    });
  });

  describe('INT 10h AH=09h — write character with attribute (color)', () => {
    it('reads the character from AL and the color from BL', () => {
      const { ctx, reg, ram, cnsl } = makeCtx();
      ram.writeByte(1, 0x10); // interrupt number
      reg.R[AX] = 0x0941;     // AH=09h, AL='A' (0x41)
      reg.R[BX] = 0x0014;     // BL=0x14 → fg=4 (low nibble), bg=1 (high nibble)
      handler.execute(INT, ctx);
      expect(cnsl.written).toEqual([0x41]);
      expect(cnsl.attributes).toEqual([{ fg: 4, bg: 1 }]);
    });

    it('advances IP by 2, same as the other interrupt services', () => {
      const { ctx, reg, ram } = makeCtx();
      ram.writeByte(1, 0x10);
      reg.R[AX] = 0x0941;
      reg.R[BX] = 0x0000;
      handler.execute(INT, ctx);
      expect(reg.R[IP_REG]).toBe(2);
    });

    it('does nothing for unimplemented INT 10h AH values', () => {
      const { ctx, reg, ram, cnsl } = makeCtx();
      ram.writeByte(1, 0x10);
      reg.R[AX] = 0x0200; // AH=02h has no meaning under INT 10h here
      handler.execute(INT, ctx);
      expect(cnsl.written).toEqual([]);
    });
  });
});
