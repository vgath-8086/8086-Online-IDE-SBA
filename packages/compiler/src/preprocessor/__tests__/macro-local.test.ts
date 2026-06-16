import { describe, it, expect } from 'vitest';
import { createCompiler } from '../../index.js';
import type { CompilerResult } from '../../types.js';
import { EmulatorController, AX_REG, BX_REG, CX_REG, DX_REG } from '@emu8086/emulator';
import type { KeyProvider, LoadableProgram } from '@emu8086/emulator';

type FinalViewLine = NonNullable<CompilerResult['finalView']>[number];

class MockKeyProvider implements KeyProvider {
  waitForKey(): Promise<string> { return new Promise(() => {}); }
  waitForEnter(): Promise<void> { return new Promise(() => {}); }
}

function run(source: string, maxSteps = 10_000) {
  const result = createCompiler().compile(source);
  if (!result.status || !result.finalView || result.origin === null) {
    throw new Error(`compile failed: ${result.message}`);
  }
  const program: LoadableProgram = {
    origin: result.origin,
    instructions: result.finalView
      .filter((l: FinalViewLine) => l.executableLine)
      .map((l: FinalViewLine) => ({ addr: l.instructionAddr, opcodes: l.opcodes })),
  };
  const controller = new EmulatorController(new MockKeyProvider());
  controller.loadProgram(program);

  let steps = 0;
  let done = false;
  while (!done && steps < maxSteps) {
    const stepResult = controller.singleStep();
    steps++;
    if (stepResult.done) { done = true; break; }
  }
  return { controller, steps, done };
}

describe('macro LOCAL label renaming', () => {
  it('keeps LOCAL labels independent across two invocations of the same macro', () => {
    // Each invocation counts from 0 up to n using a LOCAL loop label called "again".
    // If the renamed label collides across invocations, the second invocation's
    // jump resolves to the FIRST invocation's "again", corrupting both results.
    const source = `org 100h

countdown 3
mov bx, ax

countdown 2
mov cx, ax

ret

countdown MACRO n
LOCAL again
mov ax, 0
mov dx, n
again:
inc ax
dec dx
jnz again
ENDM`;

    const { controller, steps, done } = run(source);
    expect(done, `program did not finish within step limit (ran ${steps} steps) — likely an infinite loop from a mis-resolved LOCAL label`).toBe(true);

    const r = controller.processor.register;
    expect(r.readReg(BX_REG), 'BX should hold the result of the first invocation (countdown 3)').toBe(3);
    expect(r.readReg(CX_REG), 'CX should hold the result of the second invocation (countdown 2)').toBe(2);
    expect(r.readReg(AX_REG), 'AX should hold the second invocation\'s final count').toBe(2);
  });

  it('compiles and runs a macro invoked three times', () => {
    const source = `org 100h

countdown 1
mov bx, ax
countdown 2
mov cx, ax
countdown 4
mov dx, ax

ret

countdown MACRO n
LOCAL again
mov ax, 0
mov si, n
again:
inc ax
dec si
jnz again
ENDM`;

    const { controller, done } = run(source);
    expect(done).toBe(true);
    const r = controller.processor.register;
    expect(r.readReg(BX_REG)).toBe(1);
    expect(r.readReg(CX_REG)).toBe(2);
    expect(r.readReg(DX_REG)).toBe(4);
  });
});
