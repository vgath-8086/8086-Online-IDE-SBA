import type { CpuContext } from '../cpu/cpu-context.js';

export interface IInstructionHandler {
  matches(opcode: number, ctx: CpuContext): boolean;
  execute(opcode: number, ctx: CpuContext): void;
}
