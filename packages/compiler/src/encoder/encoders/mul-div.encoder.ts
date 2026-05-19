import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

// All opcodes sharing the F6/F7 prefix — distinguished by ModRM reg field
const REG_FIELDS: Record<string, number> = {
  NOT:  0b010000,
  NEG:  0b011000,
  MUL:  0b100000,
  IMUL: 0b101000,
  DIV:  0b110000,
  IDIV: 0b111000,
};

export class MulDivEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m in REG_FIELDS; }

  encode(str: string, ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    const { operands, w, mode, regmem, arr } = ctx.parseInstruction(str);

    arr.push(0b11110110 + w);
    arr.push((mode << 6) + REG_FIELDS[m] + regmem);
    if (/M/.test(operands[1])) return ctx.appendDisplacementBytes(str, arr);
    return arr;
  }
}
