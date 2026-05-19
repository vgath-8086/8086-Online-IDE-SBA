import { EncoderContext }     from './encoder-context.js';
import { EncoderRegistry }    from './encoder-registry.js';
import type { IEncoder }      from '../interfaces/i-encoder.js';
import { MovEncoder }         from './encoders/mov.encoder.js';
import { PushPopEncoder }     from './encoders/push-pop.encoder.js';
import { ArithEncoder }       from './encoders/arith.encoder.js';
import { LogicEncoder }       from './encoders/logic.encoder.js';
import { IncDecEncoder }      from './encoders/inc-dec.encoder.js';
import { MulDivEncoder }      from './encoders/mul-div.encoder.js';
import { ShiftRotateEncoder } from './encoders/shift-rotate.encoder.js';
import { XchgLeaEncoder }     from './encoders/xchg-lea.encoder.js';
import { JumpEncoder }        from './encoders/jump.encoder.js';
import { CondJumpEncoder }    from './encoders/cond-jump.encoder.js';
import { StringEncoder }      from './encoders/string.encoder.js';
import { IntEncoder }         from './encoders/int.encoder.js';
import { SimpleEncoder }      from './encoders/simple.encoder.js';

export function createEncoder(): IEncoder {
  return new EncoderRegistry(new EncoderContext())
    .register(new MovEncoder())
    .register(new PushPopEncoder())
    .register(new ArithEncoder())
    .register(new LogicEncoder())
    .register(new IncDecEncoder())
    .register(new MulDivEncoder())
    .register(new ShiftRotateEncoder())
    .register(new XchgLeaEncoder())
    .register(new JumpEncoder())
    .register(new CondJumpEncoder())
    .register(new StringEncoder())
    .register(new IntEncoder())
    .register(new SimpleEncoder());
}

const _defaultEncoder = createEncoder();

/** Encodes a single resolved instruction string to its machine-code byte array. */
export function assembleInstruction(str: string): number[] {
  return _defaultEncoder.encode(str);
}
