import { Linkage }       from './linkage.js';
import { createEncoder } from '../encoder/asm-encoder.js';
import type { ILinker }  from '../interfaces/i-linker.js';

export function createLinker(): ILinker {
  return new Linkage(createEncoder());
}

export { Linkage }              from './linkage.js';
export { generateVariable }     from './generate-variable.js';
export { reformInstruction }    from './reform-instruction.js';
export { FLOW_INSTRUCTIONS as FLOW_INSTRUCTION, LONG_FLOW_INSTRUCTIONS as LONG_FLOW } from '@emu8086/shared';
