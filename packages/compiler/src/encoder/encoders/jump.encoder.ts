import type { IInstructionEncoder } from '../../interfaces/i-instruction-encoder.js';
import type { EncoderContext } from '../encoder-context.js';

export class JumpEncoder implements IInstructionEncoder {
  matches(m: string): boolean { return m === 'JMP' || m === 'CALL'; }

  encode(str: string, ctx: EncoderContext): number[] {
    const m = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    const { operands, w, mode, regmem, arr } = ctx.parseInstruction(str);

    if (m === 'JMP') return this.encodeJmp(str, ctx, operands, w, mode, regmem, arr);
    return this.encodeCall(str, ctx, operands, mode, regmem, arr);
  }

  private encodeJmp(
    str: string, ctx: EncoderContext,
    operands: string[], w: number, mode: number, regmem: number, arr: number[],
  ): number[] {
    if (operands.length === 4) {
      // Indirect far: FF /5
      arr.push(0b11111111);
      arr.push((mode << 6) + 0b101000 + regmem);
      if (/M/.test(operands[1])) return ctx.appendDisplacementBytes(str, arr);
      return arr;
    }

    // Far absolute: EA offset16 segment16
    if (!(/M|R/.test(operands[1])) && /\:/.test(operands[0])) {
      return this.encodeFar(ctx, operands[0], 0b11101010, arr);
    }

    // Immediate near/short
    if (/I/.test(operands[1])) {
      if (w === 1) {
        arr.push(0b11101001);  // near JMP: E9 rel16
        const byte = ctx.splitToBytes(ctx.parseNumericLiteral(operands[0]), ctx.signExtendFlag(operands[0], 1));
        arr.push(byte[0]);
        arr.push(byte.length === 2 ? byte[1] : (byte[0] & 0x80) !== 0 ? 255 : 0);
      } else {
        arr.push(0b11101011);  // short JMP: EB rel8
        arr.push(ctx.parseNumericLiteral(operands[0]));
      }
      return arr;
    }

    // Register/memory indirect: FF /4
    if (/R|M/.test(operands[1])) {
      arr.push(0b11111111);
      arr.push((mode << 6) + 0b100000 + regmem);
      if (/M/.test(operands[1])) {
        ctx.appendDisplacementBytes(str, arr);
        if (ctx.signExtendFlag(operands[1], 0)) arr.push(0);
      }
    }
    return arr;
  }

  private encodeCall(
    str: string, ctx: EncoderContext,
    operands: string[], mode: number, regmem: number, arr: number[],
  ): number[] {
    if (operands.length === 4) {
      // Indirect far: FF /3
      arr.push(0b11111111);
      arr.push((mode << 6) + 0b011000 + regmem);
      if (/M/.test(operands[1])) return ctx.appendDisplacementBytes(str, arr);
      return arr;
    }

    // Far absolute: 9A offset16 segment16
    if (!(/M|R/.test(operands[1])) && /\:/.test(operands[0])) {
      return this.encodeFar(ctx, operands[0], 0b10011010, arr);
    }

    // Near immediate: E8 rel16
    if (/I/.test(operands[1])) {
      arr.push(0b11101000);
      const byte = ctx.splitToBytes(ctx.parseNumericLiteral(operands[0]), ctx.signExtendFlag(operands[0], 1));
      arr.push(byte[0]);
      arr.push(byte.length === 2 ? byte[1] : 0);
      return arr;
    }

    // Register/memory indirect: FF /2
    if (/R|M/.test(operands[1])) {
      arr.push(0b11111111);
      arr.push((mode << 6) + 0b010000 + regmem);
      if (/M/.test(operands[1])) {
        ctx.appendDisplacementBytes(str, arr);
        if (ctx.signExtendFlag(operands[1], 0)) arr.push(0);
      }
    }
    return arr;
  }

  private encodeFar(ctx: EncoderContext, target: string, opcode: number, arr: number[]): number[] {
    arr.push(opcode);
    const offStr = target.match(/(?<=\:\s*)\w+/gi)?.[0] ?? '0';
    if (!ctx.signExtendFlag(offStr, 1)) {
      const b = ctx.splitToBytes(ctx.parseNumericLiteral(offStr), 0);
      arr.push(b[0]); arr.push(b[1]);
    } else {
      arr.push(ctx.parseNumericLiteral(offStr)); arr.push(0);
    }
    const segStr = target.match(/\w+(?=\s*:)/gi)?.[0] ?? '0';
    if (!ctx.signExtendFlag(segStr, 1)) {
      const b = ctx.splitToBytes(ctx.parseNumericLiteral(segStr));
      arr.push(b[0]); arr.push(b[1]);
    } else {
      arr.push(ctx.parseNumericLiteral(segStr)); arr.push(0);
    }
    return arr;
  }
}
