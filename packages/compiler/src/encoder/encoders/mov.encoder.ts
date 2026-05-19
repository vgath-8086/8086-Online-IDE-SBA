import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

export class MovEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m === 'MOV'; }

  encode(str: string, ctx: EncoderContext): number[] {
    const { operands, w, d, mode, regmem, arr } = ctx.parseInstruction(str);

    // MOV r/m ← segment reg  (8C)
    if (/M|R/.test(operands[2]) && /RS/.test(operands[3])) {
      arr.push(0b10001100);
      arr.push((mode << 6) + (ctx.registerToId(operands[1]) << 3)
             + (/R/.test(operands[2]) ? ctx.registerToId(operands[0]) : regmem));
      return ctx.appendDisplacementBytes(str, arr);
    }

    // MOV segment reg ← r/m  (8E)
    if (/RS/.test(operands[2]) && /R|M/.test(operands[3])) {
      arr.push(0b10001110);
      arr.push((mode << 6) + (ctx.registerToId(operands[0]) << 3) + regmem);
      return ctx.appendDisplacementBytes(str, arr);
    }

    // MOV r/m ↔ r/m  (88–8B)
    if (/R|M/.test(operands[2]) && /R|M/.test(operands[3])) {
      if (/M/.test(operands[2]) && /R/.test(operands[3])) {
        arr.push((0b100010 << 2) + w);
        arr.push((mode << 6) + (ctx.registerToId(operands[1]) << 3) + regmem);
      } else if (/R/.test(operands[2])) {
        arr.push((0b100010 << 2) + 0b10 + w);
        arr.push((mode << 6) + (ctx.registerToId(operands[0]) << 3) + regmem);
      }
      return ctx.appendDisplacementBytes(str, arr);
    }

    // MOV r/m ← immediate  (C6/C7)
    if (/M|R/.test(operands[2]) && /I/.test(operands[3])) {
      arr.push(0b11000110 + w);
      arr.push((mode << 6) + regmem);
      ctx.appendDisplacementBytes(str, arr);

      if (w === 1) ctx.emitWordImm(arr, operands[1]);
      else         arr.push(ctx.parseNumericLiteral(operands[1]));
    }

    void d;
    return arr;
  }
}
