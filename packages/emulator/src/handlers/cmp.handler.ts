import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';

export class CmpHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op & 0xFC) === 0x38; // 0x38–0x3B
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));

    if (operandes.addr === null) {
      const R1 = operandes.opRegister[0], R2 = operandes.opRegister[1]!;

      if (op % 2 === 1) {
        const valA = ctx.reg.readWordReg(R1), valB = ctx.reg.readWordReg(R2);
        if ((op >> 1) % 2) ctx.generateFlag(valA - valB, valA, (-valB) & 0xFFFF, 1);
        else               ctx.generateFlag(valB - valA, valB, (-valA) & 0xFFFF, 1);
      } else {
        const valA = ctx.reg.readByteReg(R1), valB = ctx.reg.readByteReg(R2);
        if ((op >> 1) % 2) ctx.generateFlag(valA - valB, valA, (-valB) & 0xFF, 0);
        else               ctx.generateFlag(valB - valA, valB, (-valA) & 0xFF, 0);
      }
    } else {
      const R = operandes.opRegister[0], addr = operandes.addr;

      if (op % 2 === 1) {
        if ((op >> 1) % 2) {
          const valA = ctx.reg.readWordReg(R), valB = ctx.ram.readWord(addr);
          ctx.generateFlag(valA - valB, valA, (-valB) & 0xFFFF, 1);
        } else {
          const valA = ctx.ram.readWord(addr), valB = ctx.reg.readWordReg(R);
          ctx.generateFlag(valA - valB, valA, (-valB) & 0xFFFF, 1);
        }
      } else {
        if ((op >> 1) % 2) {
          const valA = ctx.reg.readByteReg(R), valB = ctx.ram.readByte(addr);
          ctx.generateFlag(valA - valB, valA, (-valB) & 0xFF, 0);
        } else {
          const valA = ctx.ram.readByte(addr), valB = ctx.reg.readByteReg(R);
          ctx.generateFlag(valA - valB, valA, (-valB) & 0xFF, 0);
        }
      }
    }

    ctx.reg.incIP(operandes.dispSize + 2);
  }
}
