import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { INC_REG_MEM } from '../opcodes.js';

export class IncDecHandler implements IInstructionHandler {
  matches(op: number, ctx: CpuContext): boolean {
    if ((op & 0b11111110) !== INC_REG_MEM) return false; // 0xFE or 0xFF
    const cs = ctx.reg.readReg(4), ip = ctx.reg.readReg(13);
    const modrm = ctx.ram.readByte((cs << 4) + ip + 1);
    const reg = (modrm >> 3) & 7;
    return reg === 0 || reg === 1; // INC = reg 0, DEC = reg 1
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));
    const isDec = operandes.opRegister[0] === 1;
    const delta = isDec ? -1 : 1;

    if (operandes.addr !== null) {
      if (op % 2) {
        const before = ctx.ram.readWord(operandes.addr);
        ctx.ram.writeWord(operandes.addr, before + delta);
        ctx.generateFlag(before + delta, 0x0001, before, 1);
      } else {
        const before = ctx.ram.readByte(operandes.addr);
        ctx.ram.writeByte(operandes.addr, before + delta);
        ctx.generateFlag(before + delta, 0x0001, before, 0);
      }
    } else {
      const R = operandes.opRegister[1]!;
      if (op % 2) {
        const before = ctx.reg.readWordReg(R);
        ctx.reg.writeWordReg(R, before + delta);
        ctx.generateFlag(before + delta, 0x0001, before, 1);
      } else {
        const before = ctx.reg.readByteReg(R);
        ctx.reg.writeByteReg(R, before + delta);
        ctx.generateFlag(before + delta, 0x0001, before, 0);
      }
    }

    ctx.reg.incIP(2 + operandes.dispSize);
  }
}
