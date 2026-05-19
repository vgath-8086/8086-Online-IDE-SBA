import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { CX_REG } from '../constants.js';
import { LOOP, LOOPE, LOOPNE } from '../opcodes.js';

export class LoopHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return op === LOOP || op === LOOPE || op === LOOPNE;
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG

    let cx = ctx.reg.readReg(CX_REG);
    ctx.reg.writeReg(CX_REG, cx - 1);
    cx--;

    let doJump = false;
    if (op === LOOP) {
      doJump = cx !== 0;
    } else if (op === LOOPE) {
      doJump = cx !== 0 || ctx.reg.extractFlag('Z') === 1;
    } else {
      doJump = cx !== 0 || ctx.reg.extractFlag('Z') === 0;
    }

    if (doJump) {
      const disp = ctx.signExtendByte(ctx.ram.readByte((cs << 4) + ip + 1));
      ctx.reg.incIP(2 + disp);
    } else {
      ctx.reg.incIP(2);
    }
  }
}
