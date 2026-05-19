import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

// All single-byte no-operand instructions: flags, data conversion, misc.
const OPCODES: Record<string, number> = {
  CLC:  0b11111000, CMC:  0b11110101, STC:  0b11111001,
  CLD:  0b11111100, STD:  0b11111101, CLI:  0b11111010,
  STI:  0b11111011, HLT:  0b11110100,
  LAHF: 0b10011111, SAHF: 0b10011110,
  PUSHF:0b10011100, POPF: 0b10011101,
  AAA:  0b00110111, CBW:  0b10011000, CWD:  0b10011001,
  RET:  0b11000011,
};

export class SimpleEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m in OPCODES; }

  encode(str: string, _ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    return [OPCODES[m]];
  }
}
