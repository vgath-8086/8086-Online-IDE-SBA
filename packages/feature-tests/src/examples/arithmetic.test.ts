import { describe, it, expect } from 'vitest';
import { createCompiler, toLoadableProgram } from '@emu8086/compiler';
import { EXAMPLES } from '@emu8086/shared';
import { EmulatorController, AX_REG, BX_REG, CX_REG, DX_REG } from '@emu8086/emulator';
import type { KeyProvider } from '@emu8086/emulator';

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

describe('Arithmetic examples', () => {
  it('covers every example in this category', () => {
    const ids = EXAMPLES.filter(e => e.category === 'Arithmetic').map(e => e.id);
    expect(ids).toEqual(['add', 'sub', 'mul', 'div', 'neg', 'inc-dec']);
  });

  describe('ADD', () => {
    it('adds register, immediate, and memory operands', () => {
      const { source } = EXAMPLES.find(e => e.id === 'add')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG)).toBe(0x0008);
      expect(controller.processor.RAM.readWord(0x200)).toBe(0x000A);
    });
  });

  describe('SUB', () => {
    it('subtracts and sets CF on underflow', () => {
      const { source } = EXAMPLES.find(e => e.id === 'sub')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x0005);
      expect(reg.readReg(BX_REG)).toBe(0x0003);
      expect(reg.readReg(CX_REG)).toBe(0xFFFF); // 1 - 2 wraps
      expect(reg.extractFlag('C')).toBe(1); // borrow
    });
  });

  describe('MUL', () => {
    it('multiplies byte (AL×src→AX) and word (AX×src→DX:AX) operands', () => {
      const { source } = EXAMPLES.find(e => e.id === 'mul')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x2710); // DX:AX = 0000:2710h (10000)
      expect(reg.readReg(DX_REG)).toBe(0x0000);
    });
  });

  describe('DIV', () => {
    it('divides byte (AX÷src) and word (DX:AX÷src) operands', () => {
      const { source } = EXAMPLES.find(e => e.id === 'div')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0x000E); // quotient 14
      expect(reg.readReg(DX_REG)).toBe(0x0002); // remainder 2
    });
  });

  describe('NEG', () => {
    it('computes two\'s complement and sets OF when negating the most-negative value', () => {
      const { source } = EXAMPLES.find(e => e.id === 'neg')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(AX_REG)).toBe(0xFFFB);
      expect(reg.readReg(BX_REG)).toBe(0x0000);
      expect(reg.readReg(CX_REG)).toBe(0x8000);
      expect(reg.extractFlag('O')).toBe(1); // -(-32768) overflows
    });
  });

  describe('INC / DEC', () => {
    it('wraps at the boundaries and never touches CF', () => {
      const { source } = EXAMPLES.find(e => e.id === 'inc-dec')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      expect(controller.processor.register.readReg(AX_REG)).toBe(0xFFFF); // 0 - 1 wraps
      expect(controller.processor.RAM.readByte(0x200)).toBe(0x09);
    });
  });
});
