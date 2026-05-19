import type { EncoderContext } from '../encoder/encoder-context.js';

export interface IInstructionEncoder {
  matches(mnemonic: string): boolean;
  encode(str: string, ctx: EncoderContext): number[];
}
