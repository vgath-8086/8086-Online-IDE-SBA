import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { CS_REG, SS_REG, SP_REG, IP_REG } from '../constants.js';
import { RET_SEG, RET_INTERSEG } from '../opcodes.js';

export class CallRetHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return op === RET_SEG || op === RET_INTERSEG;
  }

  execute(op: number, ctx: CpuContext): void {
    const ss = ctx.reg.readReg(SS_REG);
    const sp = ctx.reg.readReg(SP_REG);

    if (op === RET_SEG) {
      const newIP = ctx.ram.readWord((ss << 4) + sp);
      ctx.reg.decSP();
      ctx.reg.writeReg(IP_REG, newIP);
    } else {
      // RET_INTERSEG
      const newIP = ctx.ram.readWord((ss << 4) + sp);
      ctx.reg.decSP();
      const newCS = ctx.ram.readWord((ss << 4) + ctx.reg.readReg(SP_REG));
      ctx.reg.decSP();
      ctx.reg.writeReg(IP_REG, newIP);
      ctx.reg.writeReg(CS_REG, newCS);
    }
  }
}
