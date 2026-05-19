import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { FLAG_REG, SP_REG, SS_REG } from '../constants.js';
import { PUSH_REG_MEM, POP_REG_MEM } from '../opcodes.js';

export class PushPopHandler implements IInstructionHandler {
  matches(op: number, ctx: CpuContext): boolean {
    if (op === 0b10011100 || op === 0b10011101) return true; // PUSHF / POPF
    if ((op % 8) === 6 && (op >> 5) === 0) return true;     // segment push
    if ((op % 8) === 7 && (op >> 5) === 0) return true;     // segment pop
    if (op === 106 || op === 104) return true;               // PUSH imm8 / imm16
    const cs = ctx.reg.readReg(4), ip = ctx.reg.readReg(13);
    const modrm = ctx.ram.readByte((cs << 4) + ip + 1);
    const reg = (modrm >> 3) & 7;
    if (op === PUSH_REG_MEM) return reg === 6;               // 0xFF + reg=6
    if (op === POP_REG_MEM)  return reg === 0;               // 0x8F + reg=0
    return false;
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG
    const ss = ctx.reg.readReg(SS_REG);
    const sp = ctx.reg.readReg(SP_REG);

    if (op === 0b10011100) {
      // PUSHF
      ctx.reg.incSP();
      const newSp = ctx.reg.readReg(SP_REG);
      ctx.ram.writeByte((ss << 4) + newSp, ctx.reg.readReg(FLAG_REG));
      ctx.reg.incIP(1);
      return;
    }

    if (op === 0b10011101) {
      // POPF
      const addrStack = (ss << 4) + sp;
      ctx.reg.writeReg(FLAG_REG, ctx.ram.readWord(addrStack));
      ctx.reg.incIP(1);
      ctx.reg.decSP();
      return;
    }

    // Segment push: (op % 8 == 6) && (op >> 5 == 0)
    if ((op % 8) === 6 && (op >> 5) === 0) {
      const reg = (op >> 3) % 4;
      ctx.reg.writeReg(SP_REG, sp - 2);
      const newSp = (ss << 4) + sp - 2;
      ctx.ram.writeWord(newSp, ctx.reg.readSegReg(reg));
      ctx.reg.incIP(1);
      return;
    }

    // Segment pop: (op % 8 == 7) && (op >> 5 == 0)
    if ((op % 8) === 7 && (op >> 5) === 0) {
      const addrStack = (ss << 4) + sp;
      const reg = (op >> 3) % 4;
      ctx.reg.writeSegReg(reg, ctx.ram.readWord(addrStack));
      ctx.ram.writeWord(addrStack, 0);
      ctx.reg.writeReg(SP_REG, sp + 2);
      ctx.reg.incIP(1);
      return;
    }

    // PUSH imm8 (0x6A = 106)
    if (op === 106) {
      const val = ctx.ram.readByte((cs << 4) + ip + 1);
      ctx.reg.writeReg(SP_REG, sp - 2);
      ctx.ram.writeWord((ss << 4) + sp - 2, val);
      ctx.reg.incIP(2);
      return;
    }

    // PUSH imm16 (0x68 = 104)
    if (op === 104) {
      const val = ctx.ram.readWord((cs << 4) + ip + 1);
      ctx.reg.writeReg(SP_REG, sp - 2);
      ctx.ram.writeWord((ss << 4) + sp - 2, val);
      ctx.reg.incIP(3);
      return;
    }

    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));

    if (op === PUSH_REG_MEM) {
      // PUSH r/m (reg field = 6)
      if (operandes.addr === null) {
        const R = operandes.opRegister[1]!;
        ctx.reg.writeReg(SP_REG, sp - 2);
        ctx.ram.writeWord((ss << 4) + sp - 2, ctx.reg.readWordReg(R));
      } else {
        ctx.reg.writeReg(SP_REG, sp - 2);
        ctx.ram.writeWord((ss << 4) + sp - 2, ctx.ram.readWord(operandes.addr));
      }
      ctx.reg.incIP(2 + operandes.dispSize);
    } else {
      // POP r/m (reg field = 0)  — op === POP_REG_MEM (0x8F)
      const addrStack = (ss << 4) + sp;
      if (operandes.addr === null) {
        const R = operandes.opRegister[1]!;
        ctx.reg.writeWordReg(R, ctx.ram.readWord(addrStack));
        ctx.ram.writeWord(addrStack, 0);
        ctx.reg.writeReg(SP_REG, sp + 2);
      } else {
        ctx.ram.writeWord(operandes.addr, ctx.ram.readWord(addrStack));
        ctx.ram.writeWord(addrStack, 0);
        ctx.reg.writeReg(SP_REG, sp + 2);
      }
      ctx.reg.incIP(2 + operandes.dispSize);
    }
  }
}
