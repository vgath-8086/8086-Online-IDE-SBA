import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

// AND, OR, XOR, TEST — logical ops with r/m and immediate variants.
// Note: logical immediates don't use the s-bit (always full-word for w=1).
interface LogicConfig { rmBase: number; immReg: number; }

const CONFIGS: Record<string, LogicConfig> = {
  AND:  { rmBase: 0b100000, immReg: 0b100 },
  OR:   { rmBase: 0b001000, immReg: 0b001 },
  XOR:  { rmBase: 0b110000, immReg: 0b110 },
  TEST: { rmBase: 0b10000100, immReg: 0 },   // TEST has a different r/m opcode
};

export class LogicEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m in CONFIGS; }

  encode(str: string, ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    const { operands, w, d, mode, regmem, arr } = ctx.parseInstruction(str);
    const { rmBase, immReg } = CONFIGS[m];

    if (/R|M/.test(operands[2]) && /M|R/.test(operands[3])) {
      // Register/memory form
      const opcode = m === 'TEST'
        ? rmBase + w                                                     // TEST: 0x84/0x85
        : rmBase + (d << 1) + w;                                         // AND/OR/XOR: 0x20-0x33
      arr.push(opcode);
      arr.push((mode << 6) + (ctx.registerToId(/R/.test(operands[2]) ? operands[0] : operands[1]) << 3) + regmem);
      return ctx.appendDisplacementBytes(str, arr);
    }

    if (/M|R/.test(operands[2]) && /I/.test(operands[3])) {
      // Immediate form: TEST uses F6/F7 with reg=0; AND/OR/XOR use 80/81 group (no s-bit)
      const opcode = m === 'TEST'
        ? 0b11110110 + w                                                  // 0xF6/0xF7 + reg=0
        : (0b100000 << 2) + w;                                            // 0x80/0x81 (no s-bit)
      arr.push(opcode);
      arr.push((mode << 6) + (immReg << 3) + regmem);
      ctx.appendDisplacementBytes(str, arr);

      if (w === 1) ctx.emitWordImm(arr, operands[1]);
      else         arr.push(ctx.parseNumericLiteral(operands[1]));
    }
    return arr;
  }
}
