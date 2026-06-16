import { describe, it, expect } from 'vitest';
import { createCompiler, toLoadableProgram } from '@emu8086/compiler';
import { EXAMPLES } from '@emu8086/shared';
import { EmulatorController, AX_REG, BX_REG, CX_REG } from '@emu8086/emulator';
import type { KeyProvider } from '@emu8086/emulator';

// Byte-register ids for readByteReg() — see @emu8086/shared's REGISTER_NAME_TO_ID.
const AL = 0, CL = 1, BL = 3;

class NoKeyProvider implements KeyProvider {
  waitForKey(): Promise<string> { return new Promise(() => {}); }
  waitForEnter(): Promise<void> { return new Promise(() => {}); }
}

function run(source: string, maxSteps = 10_000) {
  const program = toLoadableProgram(createCompiler().compile(source));
  if (!program) throw new Error('compile failed');
  const controller = new EmulatorController(new NoKeyProvider());
  controller.loadProgram(program);

  let steps = 0;
  let done = false;
  while (!done && steps < maxSteps) {
    done = controller.singleStep().done;
    steps++;
  }
  return { controller, steps, done };
}

describe('Bit Operations examples', () => {
  it('covers every example in this category', () => {
    const ids = EXAMPLES.filter(e => e.category === 'Bit Operations').map(e => e.id);
    expect(ids).toEqual(['and', 'or', 'xor', 'not', 'shl', 'shr', 'sar', 'rol', 'ror', 'rcl', 'rcr']);
  });

  describe('AND', () => {
    it('masks bits and isolates a bit field', () => {
      const { source } = EXAMPLES.find(e => e.id === 'and')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x000F);
      expect(reg.readReg(BX_REG)).toBe(0x0008);
      expect(reg.readByteReg(CL)).toBe(0x61); // 'a' — lowercased via OR
    });
  });

  describe('OR', () => {
    it('sets individual bits without disturbing others', () => {
      const { source } = EXAMPLES.find(e => e.id === 'or')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0F4F);
      expect(reg.readReg(BX_REG)).toBe(0x0001); // confirmed non-zero via OR ax,ax
    });
  });

  describe('XOR', () => {
    it('toggles bits and swaps two values via the XOR trick', () => {
      const { source } = EXAMPLES.find(e => e.id === 'xor')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readByteReg(AL)).toBe(0x55); // original BL
      expect(reg.readByteReg(BL)).toBe(0xAA); // original AL — values swapped
    });
  });

  describe('NOT', () => {
    it('flips every bit (one\'s complement)', () => {
      const { source } = EXAMPLES.find(e => e.id === 'not')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0xFF00);
      expect(reg.readByteReg(BL)).toBe(0xF5);
      expect(reg.readReg(CX_REG)).toBe(0xFFFB); // NOT then INC = NEG
    });
  });

  describe('SHL / SAL', () => {
    it('shifts left, multiplying by 2 each time and setting CF from the MSB', () => {
      const { source } = EXAMPLES.find(e => e.id === 'shl')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0020); // 1 << 5 = 32
      expect(reg.readReg(BX_REG)).toBe(0x0000); // bit 15 shifted out
      expect(reg.extractFlag('C')).toBe(1);
    });
  });

  describe('SHR', () => {
    it('shifts right, dividing unsigned values and setting CF from the LSB', () => {
      const { source } = EXAMPLES.find(e => e.id === 'shr')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0008); // 128 >> 4 = 8
      expect(reg.readReg(BX_REG)).toBe(0x0001);
      expect(reg.extractFlag('C')).toBe(1);
    });
  });

  describe('SAR', () => {
    it('sign-extends on right shift, preserving the sign of negative values', () => {
      const { source } = EXAMPLES.find(e => e.id === 'sar')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0008); // +16 >> 1 = +8
      expect(reg.readReg(BX_REG)).toBe(0xFFE0); // -256 >> 3 = -32, sign-extended
    });
  });

  describe('ROL', () => {
    it('wraps the MSB into the LSB and into CF', () => {
      const { source } = EXAMPLES.find(e => e.id === 'rol')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readByteReg(AL)).toBe(0x80); // back to start after 8 total rotations
    });
  });

  describe('ROR', () => {
    it('wraps the LSB into the MSB and into CF', () => {
      const { source } = EXAMPLES.find(e => e.id === 'ror')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readByteReg(AL)).toBe(0x01); // back to start after 8 total rotations
    });
  });

  describe('RCL', () => {
    it('rotates left through carry as a 17-bit rotation', () => {
      const { source } = EXAMPLES.find(e => e.id === 'rcl')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0001);
      expect(reg.readReg(BX_REG)).toBe(0x0000);
      expect(reg.extractFlag('C')).toBe(0);
    });
  });

  describe('RCR', () => {
    it('rotates right through carry as a 17-bit rotation', () => {
      const { source } = EXAMPLES.find(e => e.id === 'rcr')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG)).toBe(0x6000);
    });
  });
});
