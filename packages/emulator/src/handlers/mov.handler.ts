import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { AX_REG } from '../constants.js';
import { MOV_RM_RM, MOV_IMMEDIATE_TO_RM, MOV_IMMEDIATE_TO_R, MOV_ACCUMULATOR_MEMORY, MOV_RM_SEGEMENT } from '../opcodes.js';
import { OVERFLOW_FLAG } from '../opcodes.js';

export class MovHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op & 0b11111100) === MOV_RM_RM
      || (op & 0b11111110) === MOV_IMMEDIATE_TO_RM
      || (op & 0b11110000) === MOV_IMMEDIATE_TO_R
      || (op & 0b11111100) === MOV_ACCUMULATOR_MEMORY
      || (op & 0b11111101) === MOV_RM_SEGEMENT;
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG

    if ((op & 0b11111100) === MOV_RM_RM) {
      const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));

      if (operandes.addr === null) {
        const R1 = operandes.opRegister[0], R2 = operandes.opRegister[1]!;
        if (op % 2 === 1) {
          if ((op >> 1) % 2) {
            const valB = ctx.reg.readWordReg(R2), valA = ctx.reg.readWordReg(R1);
            ctx.reg.writeWordReg(R1, valB);
            ctx.generateFlag(valB, valA, valB, 1);
          } else {
            const valB = ctx.reg.readWordReg(R1), valA = ctx.reg.readWordReg(R2);
            ctx.reg.writeWordReg(R2, valB);
            ctx.generateFlag(valB, valA, valB, 1);
          }
        } else {
          if ((op >> 1) % 2) {
            const valB = ctx.reg.readByteReg(R2), valA = ctx.reg.readByteReg(R1);
            ctx.reg.writeByteReg(R1, valB);
            ctx.generateFlag(valB, valA, valB, 0);
          } else {
            const valB = ctx.reg.readByteReg(R1), valA = ctx.reg.readByteReg(R2);
            ctx.reg.writeByteReg(R2, valB);
            ctx.generateFlag(valB, valA, valB, 0);
          }
        }
      } else {
        const R = operandes.opRegister[0], addr = operandes.addr;
        if (op % 2 === 1) {
          if ((op >> 1) % 2) {
            const valB = ctx.ram.readWord(addr), valA = ctx.reg.readWordReg(R);
            ctx.reg.writeWordReg(R, valB);
            ctx.generateFlag(valB, valA, valB, 1);
          } else {
            const valA = ctx.ram.readWord(addr), valB = ctx.reg.readWordReg(R);
            ctx.ram.writeWord(addr, valB);
            ctx.generateFlag(valB, valA, valB, 1);
          }
        } else {
          if ((op >> 1) % 2) {
            const valB = ctx.ram.readByte(addr), valA = ctx.reg.readByteReg(R);
            ctx.reg.writeByteReg(R, valB);
            ctx.generateFlag(valB, valA, valB, 0);
          } else {
            const valA = ctx.ram.readByte(addr), valB = ctx.reg.readByteReg(R);
            ctx.ram.writeByte(addr, valB);
            ctx.generateFlag(valB, valA, valB, 0);
          }
        }
      }

      ctx.reg.incIP(operandes.dispSize + 2);

    } else if ((op & 0b11111110) === MOV_IMMEDIATE_TO_RM) {
      const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));
      const immediateAddr = (cs << 4) + ip + 2 + operandes.dispSize;
      const R = operandes.opRegister[1]!;
      const addr = operandes.addr;

      if (op % 2 === 1) {
        const immVal = ctx.ram.readWord(immediateAddr);
        if (addr === null) {
          const val = ctx.reg.readWordReg(R);
          ctx.reg.writeWordReg(R, immVal);
          ctx.generateFlag(immVal, val, immVal, 1);
        } else {
          const val = ctx.ram.readWord(addr);
          ctx.ram.writeWord(addr, immVal);
          ctx.generateFlag(immVal, val, immVal, 1);
        }
      } else {
        const immVal = ctx.ram.readByte(immediateAddr);
        if (addr === null) {
          const val = ctx.reg.readByteReg(R);
          ctx.reg.writeByteReg(R, immVal);
          ctx.generateFlag(immVal, val, immVal, 0);
        } else {
          const val = ctx.ram.readByte(addr);
          ctx.ram.writeByte(addr, immVal);
          ctx.generateFlag(immVal, val, immVal, 0);
        }
      }

      ctx.reg.incIP(operandes.dispSize + (op % 2) + 3);

    } else if ((op & 0b11110000) === MOV_IMMEDIATE_TO_R) {
      const R = op & 0x07;
      const immediateAddr = (cs << 4) + ip + 1;

      if ((op >> 3) % 2 === 1) {
        const immVal = ctx.ram.readWord(immediateAddr);
        ctx.reg.writeWordReg(R, immVal);
        ctx.generateFlag(immVal, 0, 0, 1, 0xFFFF & ~OVERFLOW_FLAG);
      } else {
        const immVal = ctx.ram.readByte(immediateAddr);
        ctx.reg.writeByteReg(R, immVal);
        ctx.generateFlag(immVal, 0, 0, 0, 0xFFFF & ~OVERFLOW_FLAG);
      }

      ctx.reg.incIP(((op >> 3) % 2) + 2);

    } else if ((op & 0b11111100) === MOV_ACCUMULATOR_MEMORY) {
      const ds = ctx.reg.readReg(5); // DS_REG
      const addr = (ds << 4) + ctx.ram.readWord((cs << 4) + ip + 1);

      if ((op >> 1) % 2 === 0) {
        if (op % 2 === 1) {
          const val = ctx.reg.readWordReg(AX_REG);
          ctx.ram.writeWord(addr, val);
          ctx.generateFlag(val, 0, 0, 1, 0xFFFF & ~OVERFLOW_FLAG);
        } else {
          const val = ctx.reg.readByteReg(AX_REG);
          ctx.ram.writeByte(addr, val);
          ctx.generateFlag(val, 0, 0, 0, 0xFFFF & ~OVERFLOW_FLAG);
        }
      } else {
        if (op % 2 === 1) {
          const val = ctx.ram.readWord(addr);
          ctx.reg.writeWordReg(AX_REG, val);
          ctx.generateFlag(val, 0, 0, 1, 0xFFFF & ~OVERFLOW_FLAG);
        } else {
          const val = ctx.ram.readByte(addr);
          ctx.reg.writeByteReg(AX_REG, val);
          ctx.generateFlag(val, 0, 0, 0, 0xFFFF & ~OVERFLOW_FLAG);
        }
      }

      ctx.reg.incIP(3);

    } else {
      // MOV_RM_SEGEMENT
      const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));

      if (operandes.addr === null) {
        const R1 = operandes.opRegister[0], R2 = operandes.opRegister[1]!;
        const valB = ctx.reg.readWordReg(R2), valA = ctx.reg.readSegReg(R1);

        if ((op >> 1) % 2) {
          ctx.reg.writeSegReg(R1, valB);
          ctx.generateFlag(valB, valA, valB, 1);
        } else {
          ctx.reg.writeWordReg(R2, ctx.reg.readSegReg(R1));
          ctx.generateFlag(valA, valA, valB, 1);
        }
      } else {
        const R = operandes.opRegister[0], addr = operandes.addr;
        const valB = ctx.ram.readWord(addr), valA = ctx.reg.readSegReg(R);

        if ((op >> 1) % 2) {
          ctx.reg.writeSegReg(R, valB);
          ctx.generateFlag(valB, valA, valB, 1);
        } else {
          ctx.ram.writeWord(addr, ctx.reg.readSegReg(R));
          ctx.generateFlag(valA, valA, valB, 1);
        }
      }

      ctx.reg.incIP(operandes.dispSize + 2);
    }
  }
}
