import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

export class IntEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m === 'INT'; }

  encode(str: string, ctx: EncoderContext): number[] {
    const operands = ctx.parseOperands(str);
    return [0b11001100, ctx.parseNumericLiteral(operands[0])];
  }
}
