import { describe, it, expect } from 'vitest';
import { createCompiler } from '../../index.js';

// Bug: JO and JCXZ were missing from @emu8086/shared's FLOW_INSTRUCTIONS list (used
// by Linkage to decide whether a label operand needs relative-displacement
// resolution). Mnemonics absent from that list fall through to resolveGeneral(),
// which resolves the label to its ABSOLUTE address instead of a rel8 displacement —
// an out-of-range value that silently lost a byte on write and corrupted everything
// after it.
describe('FLOW_INSTRUCTIONS coverage (conditional jump label resolution)', () => {
  it('JO target resolves to a small relative displacement, not an absolute address', () => {
    const src = `org 100h
add ax, 1
jo  target
mov bx, 0
target:
mov cx, 1
ret`;
    const result = createCompiler().compile(src);
    expect(result.status).toBe(true);
    const jo = result.finalView!.filter(l => l.executableLine)[1];
    expect(jo.opcodes[0]).toBe(0x70); // JO rel8
    expect(jo.opcodes[1]).toBeLessThanOrEqual(0xFF);
    expect(jo.opcodes[1]).toBeLessThan(0x20); // a few bytes forward, not an absolute addr like 0x124
  });

  it('JCXZ target resolves to a small relative displacement, not an absolute address', () => {
    const src = `org 100h
mov cx, 0
jcxz target
mov bx, 0
target:
mov cx, 1
ret`;
    const result = createCompiler().compile(src);
    expect(result.status).toBe(true);
    const jcxz = result.finalView!.filter(l => l.executableLine)[1];
    expect(jcxz.opcodes[0]).toBe(0xE3); // JCXZ rel8
    expect(jcxz.opcodes[1]).toBeLessThanOrEqual(0xFF);
    expect(jcxz.opcodes[1]).toBeLessThan(0x20);
  });
});
