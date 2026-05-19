import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

export class IncDecEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m === 'INC' || m === 'DEC'; }

  encode(str: string, ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    const { operands, w, mode, regmem, arr } = ctx.parseInstruction(str);

    arr.push(0b11111110 + w);
    // INC → reg field 0; DEC → reg field 1
    arr.push((mode << 6) + (m === 'DEC' ? 0b1000 : 0) + regmem);
    if (/M/.test(operands[1])) return ctx.appendDisplacementBytes(str, arr);
    return arr;
  }
}
