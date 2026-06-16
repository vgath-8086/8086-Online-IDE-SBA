import { describe, it, expect } from 'vitest';
import { createCompiler, toLoadableProgram } from '@emu8086/compiler';
import { EXAMPLES } from '@emu8086/shared';
import { EmulatorController, AX_REG, BX_REG, CX_REG, DX_REG, SI_REG, DI_REG } from '@emu8086/emulator';
import type { KeyProvider } from '@emu8086/emulator';

// Byte-register ids for readByteReg() — see @emu8086/shared's REGISTER_NAME_TO_ID.
const BL = 3, DH = 6;

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

describe('Data Transfer examples', () => {
  it('covers every example in this category', () => {
    const ids = EXAMPLES.filter(e => e.category === 'Data Transfer').map(e => e.id);
    expect(ids).toEqual(['mov', 'xchg', 'lea', 'push-pop', 'pushf-popf']);
  });

  describe('MOV', () => {
    it('moves immediate, register, and memory values correctly', () => {
      // Arrange
      const { source } = EXAMPLES.find(e => e.id === 'mov')!;
      // Act
      const { controller, done } = run(source);
      // Assert
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x1234);
      expect(reg.readReg(CX_REG)).toBe(0x1234);
      expect(reg.readByteReg(BL)).toBe(0xFF);
      expect(reg.readByteReg(DH)).toBe(0xFF); // DH = mem[0200h]
      expect(controller.processor.RAM.readByte(0x200)).toBe(0xFF);
    });
  });

  describe('XCHG', () => {
    it('swaps register/register and register/memory values', () => {
      const { source } = EXAMPLES.find(e => e.id === 'xchg')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0002);
      expect(reg.readReg(BX_REG)).toBe(0x0002);
      expect(controller.processor.RAM.readByte(0x200)).toBe(0x01);
    });
  });

  describe('LEA', () => {
    it('loads the computed address, not the value at that address', () => {
      const { source } = EXAMPLES.find(e => e.id === 'lea')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0110); // 0100h + 0010h
      expect(reg.readReg(DX_REG)).toBe(0x0104);
    });
  });

  describe('PUSH / POP', () => {
    it('pops in last-in-first-out order', () => {
      const { source } = EXAMPLES.find(e => e.id === 'push-pop')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(DX_REG)).toBe(0x0003);
      expect(reg.readReg(SI_REG)).toBe(0x0002);
      expect(reg.readReg(DI_REG)).toBe(0x0001);
    });
  });

  describe('PUSHF / POPF', () => {
    it('restores a saved flag state after it changes', () => {
      const { source } = EXAMPLES.find(e => e.id === 'pushf-popf')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      // BX=1 confirms ZF was correctly saved by PUSHF and restored by POPF.
      expect(controller.processor.register.readReg(BX_REG)).toBe(0x0001);
    });
  });
});
