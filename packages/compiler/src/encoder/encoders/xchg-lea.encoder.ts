import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

export class XchgLeaEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m === 'XCHG' || m === 'LEA'; }

  encode(str: string, ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    const { operands, w, mode, regmem, arr } = ctx.parseInstruction(str);

    if (m === 'XCHG') {
      arr.push(0b10000110 + w);
      arr.push((mode << 6) + (ctx.registerToId(operands[/R/.test(operands[2]) ? 0 : 1]) << 3) + regmem);
      return ctx.appendDisplacementBytes(str, arr);
    }

    // LEA — reg ← effective address (always memory source)
    if (/R/.test(operands[2]) && /M/.test(operands[3])) {
      arr.push(0b10001101);
      arr.push((mode << 6) + (ctx.registerToId(operands[0]) << 3) + regmem);
      return ctx.appendDisplacementBytes(str, arr);
    }
    return arr;
  }
}
