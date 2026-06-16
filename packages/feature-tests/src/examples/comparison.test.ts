import { describe, it, expect } from 'vitest';
import { createCompiler, toLoadableProgram } from '@emu8086/compiler';
import { EXAMPLES } from '@emu8086/shared';
import { EmulatorController, CX_REG, DX_REG, BX_REG } from '@emu8086/emulator';
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

describe('Comparison examples', () => {
  it('covers every example in this category', () => {
    const ids = EXAMPLES.filter(e => e.category === 'Comparison').map(e => e.id);
    expect(ids).toEqual(['cmp', 'test']);
  });

  describe('CMP', () => {
    it('drives conditional branches via JE and JB', () => {
      const { source } = EXAMPLES.find(e => e.id === 'cmp')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(CX_REG)).toBe(0x0002); // JE branch taken (equal)
      expect(reg.readReg(DX_REG)).toBe(0x0001); // JB branch taken (5 < 10)
    });
  });

  describe('TEST', () => {
    it('checks individual bits without modifying the operand', () => {
      const { source } = EXAMPLES.find(e => e.id === 'test')!;
      const { controller, done } = run(source);
      expect(done).toBe(true);
      const reg = controller.processor.register;
      expect(reg.readReg(BX_REG)).toBe(0x0000); // even number detected
      expect(reg.readReg(CX_REG)).toBe(0x0001); // bit 2 is set
    });
  });
});
