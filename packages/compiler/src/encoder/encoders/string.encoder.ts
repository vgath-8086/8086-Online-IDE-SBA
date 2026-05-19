import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

// String operation second-byte for REP prefix
const STRING_OP: Record<string, number> = {
  MOVSB: 0b10100100, MOVSW: 0b10100101,
  CMPSB: 0b10100110, CMPSW: 0b10100111,
  SCASB: 0b10101110, SCASW: 0b10101111,
  LODSB: 0b10101100, LODSW: 0b10101101,
  STOSB: 0b10101010, STOSW: 0b10101011,
};

const STANDALONE = new Set(Object.keys(STRING_OP));

export class StringEncoder implements IInstructionEncoder {
  matches(m: string): boolean {
    return m === 'REP' || m === 'REPE' || m === 'REPNE' || STANDALONE.has(m);
  }

  encode(str: string, ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';

    if (m === 'REP' || m === 'REPE') {
      const operands = ctx.parseOperands(str);
      return [0b11110011, STRING_OP[operands[0]] ?? 0];
    }
    if (m === 'REPNE') {
      const operands = ctx.parseOperands(str);
      return [0b11110010, STRING_OP[operands[0]] ?? 0];
    }
    // Standalone string op
    return [STRING_OP[m]];
  }
}
