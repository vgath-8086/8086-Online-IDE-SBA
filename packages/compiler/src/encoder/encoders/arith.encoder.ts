import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

// ADD, ADC, SUB, SBB, CMP — all share the same immediate encoding structure.
// Template Method: base class provides the encoding algorithm; subclasses supply
// the opcode base and ModRM reg field for the immediate form.
interface ArithConfig { rmBase: number; immReg: number; }

const CONFIGS: Record<string, ArithConfig> = {
  ADD: { rmBase: 0b000000, immReg: 0b000 },
  ADC: { rmBase: 0b010000, immReg: 0b010 },
  SUB: { rmBase: 0b101000, immReg: 0b101 },
  SBB: { rmBase: 0b011000, immReg: 0b011 },
  CMP: { rmBase: 0b111000, immReg: 0b111 },
};

export class ArithEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m in CONFIGS; }

  encode(str: string, ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    const { operands, s, w, d, mode, regmem, arr } = ctx.parseInstruction(str);
    const { rmBase, immReg } = CONFIGS[m];

    if (/R|M/.test(operands[2]) && /M|R/.test(operands[3])) {
      // Register/memory form
      arr.push(rmBase + (d << 1) + w);
      arr.push((mode << 6) + (ctx.registerToId(/R/.test(operands[2]) ? operands[0] : operands[1]) << 3) + regmem);
      return ctx.appendDisplacementBytes(str, arr);
    }

    if (/M|R/.test(operands[2]) && /I/.test(operands[3])) {
      // Immediate form: s-bit selects compact (0x83) vs full-word (0x81) encoding
      const sVal = w === 0 ? 0 : s;
      arr.push((0b100000 << 2) + (sVal << 1) + w);
      arr.push((mode << 6) + (immReg << 3) + regmem);
      ctx.appendDisplacementBytes(str, arr); // displacement bytes

      if (w === 1) ctx.emitWordImm(arr, operands[1]);
      else         arr.push(ctx.parseNumericLiteral(operands[1]));
    }
    return arr;
  }
}
