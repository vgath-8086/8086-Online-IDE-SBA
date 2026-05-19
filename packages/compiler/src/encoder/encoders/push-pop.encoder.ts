import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

export class PushPopEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m === 'PUSH' || m === 'POP'; }

  encode(str: string, ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    const { operands, mode, regmem, arr } = ctx.parseInstruction(str);

    if (m === 'PUSH') return this.encodePush(str, ctx, operands, mode, regmem, arr);
    return this.encodePop(str, ctx, operands, mode, regmem, arr);
  }

  private encodePush(
    str: string, ctx: EncoderContext,
    operands: string[], mode: number, regmem: number, arr: number[],
  ): number[] {
    if (/RS/.test(operands[1])) {
      // Segment register: short-form opcode (e.g. PUSH CS = 0x0E)
      arr.push((ctx.registerToId(operands[0]) << 3) + 0b110);
    } else if (/R|M/.test(operands[1])) {
      // Register or memory: FF /6
      arr.push(0b11111111);
      arr.push((mode << 6) + 0b110000 + regmem);
      if (/M/.test(operands[1])) return ctx.appendDisplacementBytes(str, arr);
    } else if (/I/.test(operands[1])) {
      // Immediate push: 6A imm8 or 68 imm16
      if (ctx.signExtendFlag(operands[0], 1)) {
        arr.push(106); // 0x6A
        arr.push(ctx.parseNumericLiteral(operands[0]));
      } else {
        arr.push(104); // 0x68
        arr = arr.concat(ctx.splitToBytes(ctx.parseNumericLiteral(operands[0]), 0));
      }
    }
    return arr;
  }

  private encodePop(
    str: string, ctx: EncoderContext,
    operands: string[], mode: number, regmem: number, arr: number[],
  ): number[] {
    if (/RS/.test(operands[1])) {
      arr.push((ctx.registerToId(operands[0]) << 3) + 0b111);
    } else if (/R|M/.test(operands[1])) {
      arr.push(0b10001111); // 8F
      arr.push((mode << 6) + regmem);
      if (/M/.test(operands[1])) return ctx.appendDisplacementBytes(str, arr);
    }
    return arr;
  }
}
