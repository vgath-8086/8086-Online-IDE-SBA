import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';

export class XchgHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op & 0xFE) === 0b10000110; // 0x86–0x87
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));

    if (operandes.addr === null) {
      const R1 = operandes.opRegister[0], R2 = operandes.opRegister[1]!;
      if (op % 2 === 0) {
        const tmp = ctx.reg.readByteReg(R1);
        ctx.reg.writeByteReg(R1, ctx.reg.readByteReg(R2));
        ctx.reg.writeByteReg(R2, tmp);
      } else {
        const tmp = ctx.reg.readWordReg(R1);
        ctx.reg.writeWordReg(R1, ctx.reg.readWordReg(R2));
        ctx.reg.writeWordReg(R2, tmp);
      }
    } else {
      const R = operandes.opRegister[0], addr = operandes.addr;
      if (op % 2 === 0) {
        const tmp = ctx.ram.readByte(addr);
        ctx.ram.writeByte(addr, ctx.reg.readByteReg(R));
        ctx.reg.writeByteReg(R, tmp);
      } else {
        const tmp = ctx.ram.readWord(addr);
        ctx.ram.writeWord(addr, ctx.reg.readWordReg(R));
        ctx.reg.writeWordReg(R, tmp);
      }
    }

    ctx.reg.incIP(2 + operandes.dispSize);
  }
}
