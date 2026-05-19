import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';

const CLC = 0b11111000; // 0xF8
const CMC = 0b11110101; // 0xF5
const STC = 0b11111001; // 0xF9
const CLD = 0b11111100; // 0xFC
const STD = 0b11111101; // 0xFD

export class FlagHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return op === CLC || op === CMC || op === STC || op === CLD || op === STD;
  }

  execute(op: number, ctx: CpuContext): void {
    if (op === CLC) ctx.reg.setFlag('C', 0);
    else if (op === CMC) ctx.reg.setFlag('C', ctx.reg.extractFlag('C') === 0 ? 1 : 0);
    else if (op === STC) ctx.reg.setFlag('C', 1);
    else if (op === CLD) ctx.reg.setFlag('D', 0);
    else if (op === STD) ctx.reg.setFlag('D', 1);
    ctx.reg.incIP(1);
  }
}
