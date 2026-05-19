import { EncoderContext } from './encoder-context.js';
import type { IInstructionEncoder } from '../interfaces/i-instruction-encoder.js';

export class EncoderRegistry {
  private readonly encoders: IInstructionEncoder[] = [];

  constructor(private readonly ctx: EncoderContext) {}

  register(encoder: IInstructionEncoder): this {
    this.encoders.push(encoder);
    return this;
  }

  encode(str: string): number[] {
    const mnemonic = str.match(/(?<=\s*)\S+/)?.[0]?.toUpperCase() ?? '';
    for (const enc of this.encoders) {
      if (enc.matches(mnemonic)) return enc.encode(str, this.ctx);
    }
    return [];
  }
}
