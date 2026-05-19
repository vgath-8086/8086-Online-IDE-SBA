import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

// Maps each mnemonic alias to its opcode byte
const OPCODES: Record<string, number> = {
  JE: 0x74, JZ: 0x74,
  JL: 0x7C, JNGE: 0x7C,
  JLE: 0x7E, JNG: 0x7E,
  JB: 0x72, JNAE: 0x72, JC: 0x72,
  JBE: 0x76, JNA: 0x76,
  JP: 0x7A, JPE: 0x7A,
  JO: 0x70,
  JS: 0x78,
  JNE: 0x75, JNZ: 0x75,
  JNL: 0x7D, JGE: 0x7D,
  JNLE: 0x7F, JG: 0x7F,
  JNB: 0x73, JAE: 0x73,
  JNBE: 0x77, JA: 0x77,
  JNP: 0x7B, JPO: 0x7B,
  JNO: 0x71,
  JNS: 0x79,
  LOOP:   0xE2,
  LOOPZ:  0xE1, LOOPE:  0xE1,
  LOOPNZ: 0xE0, LOOPNE: 0xE0,
  JCXZ:   0xE3,
};

export class CondJumpEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m in OPCODES; }

  encode(str: string, ctx: EncoderContext): number[] {
    const m        = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    const operands = ctx.parseOperands(str);
    return [OPCODES[m], ctx.parseNumericLiteral(operands[0])];
  }
}
