/**
 * Handles all F6/F7 group instructions: NOT (reg=2), NEG (reg=3), MUL (reg=4/5), DIV (reg=6/7)
 * All share the same first opcode byte (0xF6 or 0xF7).
 */
import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { AX_REG, DX_REG, BYTE_REGISTER, WORD_NS_REGISTER } from '../constants.js';
import { OVERFLOW_FLAG } from '../opcodes.js';

export class GroupF6Handler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op & 0xFE) === 0xF6;
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));
    const reg = operandes.opRegister[0];

    if (reg === 0b010) {
      // NOT
      this.executeNot(op, operandes, ctx);
    } else if (reg === 0b011) {
      // NEG
      this.executeNeg(op, operandes, ctx);
    } else if (reg === 0b100 || reg === 0b101) {
      // MUL
      this.executeMul(op, operandes, ctx);
    } else if (reg === 0b110 || reg === 0b111) {
      // DIV
      this.executeDiv(op, operandes, ctx);
    }
  }

  private executeNot(op: number, operandes: ReturnType<CpuContext['extractOperand']>, ctx: CpuContext): void {
    if (operandes.addr === null) {
      const R = operandes.opRegister[1]!;
      if (op % 2 === 1) {
        const val = (~ctx.reg.readWordReg(R)) & 0xFFFF;
        ctx.reg.writeWordReg(R, val);
        ctx.generateFlag(val, val, val, 1, 0xFFFF & ~OVERFLOW_FLAG);
      } else {
        const val = (~ctx.reg.readByteReg(R)) & 0xFF;
        ctx.reg.writeByteReg(R, val);
        ctx.generateFlag(val, val, val, 0, 0xFFFF & ~OVERFLOW_FLAG);
      }
    } else {
      if (op % 2 === 1) {
        const val = (~ctx.ram.readWord(operandes.addr)) & 0xFFFF;
        ctx.ram.writeWord(operandes.addr, val);
        ctx.generateFlag(val, val, val, 1, 0xFFFF & ~OVERFLOW_FLAG);
      } else {
        const val = (~ctx.ram.readByte(operandes.addr)) & 0xFF;
        ctx.ram.writeWord(operandes.addr, val);
        ctx.generateFlag(val, val, val, 0, 0xFFFF & ~OVERFLOW_FLAG);
      }
    }
    ctx.reg.incIP(operandes.dispSize + 2);
  }

  private executeNeg(op: number, operandes: ReturnType<CpuContext['extractOperand']>, ctx: CpuContext): void {
    if (operandes.addr === null) {
      const R = operandes.opRegister[1]!;
      if (op % 2 === 1) {
        const val = ((~ctx.reg.readWordReg(R)) + 1) & 0xFFFF;
        ctx.reg.writeWordReg(R, val);
      } else {
        const val = ((~ctx.reg.readByteReg(R)) + 1) & 0xFF;
        ctx.reg.writeByteReg(R, val);
      }
    } else {
      if (op % 2 === 1) {
        const val = ((~ctx.ram.readWord(operandes.addr)) + 1) & 0xFFFF;
        ctx.ram.writeWord(operandes.addr, val);
      } else {
        const val = ((~ctx.ram.readByte(operandes.addr)) + 1) & 0xFF;
        ctx.ram.writeWord(operandes.addr, val);
      }
    }
    ctx.reg.incIP(operandes.dispSize + (op % 2) + 1);
  }

  private executeMul(op: number, operandes: ReturnType<CpuContext['extractOperand']>, ctx: CpuContext): void {
    if (operandes.addr === null) {
      const R2 = operandes.opRegister[1]!;
      if (op % 2 === 1) ctx.reg.executeMul(R2, WORD_NS_REGISTER);
      else              ctx.reg.executeMul(R2, BYTE_REGISTER);
    } else {
      if (op % 2 === 1) {
        const val = ctx.ram.readWord(operandes.addr);
        let ax = ctx.reg.readReg(AX_REG);
        ax *= val;
        if (ax >> 16 === 0) {
          ctx.reg.writeReg(AX_REG, ax);
        } else {
          ctx.reg.writeReg(AX_REG, ax & 0x0000FFFF);
          ctx.reg.writeReg(DX_REG, ((ax & 0xFFFF0000) >> 16) & 0xFFFF);
        }
      } else {
        const val = ctx.ram.readByte(operandes.addr);
        let al = ctx.reg.readByteReg(0);
        al *= val;
        if (al >> 8 === 0) ctx.reg.writeByteReg(0, al);
        else               ctx.reg.writeReg(AX_REG, al);
      }
    }
    ctx.reg.incIP(operandes.dispSize + 2);
  }

  private executeDiv(op: number, operandes: ReturnType<CpuContext['extractOperand']>, ctx: CpuContext): void {
    if (operandes.addr === null) {
      const R2 = operandes.opRegister[1]!;
      if (op % 2 === 1) ctx.reg.executeDiv(R2, WORD_NS_REGISTER);
      else              ctx.reg.executeDiv(R2, BYTE_REGISTER);
    } else {
      if (op % 2 === 1) {
        const val = ctx.ram.readWord(operandes.addr);
        const ax = ctx.reg.readReg(AX_REG);
        ctx.reg.writeReg(AX_REG, Math.floor(ax / val));
        ctx.reg.writeReg(DX_REG, ax % val);
      } else {
        const val = ctx.ram.readByte(operandes.addr);
        const al = ctx.reg.readByteReg(0);
        ctx.reg.writeReg(AX_REG, (Math.floor(al % val) << 8) + Math.floor(al / val));
      }
    }
    ctx.reg.incIP(operandes.dispSize + 2);
  }
}
