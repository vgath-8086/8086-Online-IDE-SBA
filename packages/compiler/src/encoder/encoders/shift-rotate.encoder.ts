import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

// ModRM reg fields for each shift/rotate variant
const REG_FIELDS: Record<string, number> = {
  ROL: 0b000000, ROR: 0b001000, RCL: 0b010000, RCR: 0b011000,
  SHL: 0b100000, SAL: 0b100000, SHR: 0b101000, SAR: 0b111000,
};

export class ShiftRotateEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m in REG_FIELDS; }

  encode(str: string, ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    const { operands, v, mode, regmem, arr } = ctx.parseInstruction(str);

    // When CL is the count operand, recompute w from the destination only
    const w = /CL/.test(operands[1])
      ? ctx.wordBit(operands.filter((_, i) => i % 2 === 0))
      : ctx.wordBit(operands);

    arr.push(0b11010000 + (v << 1) + w);
    arr.push((mode << 6) + REG_FIELDS[m] + (/M/.test(operands[2]) ? regmem : ctx.registerToId(operands[0])));
    if (/M/.test(operands[2])) return ctx.appendDisplacementBytes(str, arr);
    return arr;
  }
}
