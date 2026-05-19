import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { CS_REG, SS_REG, SP_REG, IP_REG } from '../constants.js';
import { JMP_SEG, JMP_SEG_SHORT, JMP_IND_SEG, JMP_DIR_INTSEG, CALL_DIR_SEG, CALL_DIR_INTSEG } from '../opcodes.js';

export class JumpHandler implements IInstructionHandler {
  matches(op: number, ctx: CpuContext): boolean {
    if (op === JMP_SEG || op === JMP_SEG_SHORT || op === JMP_DIR_INTSEG
        || op === CALL_DIR_SEG || op === CALL_DIR_INTSEG) return true;
    if (op === JMP_IND_SEG) { // 0xFF — discriminate by reg field
      const cs = ctx.reg.readReg(CS_REG), ip = ctx.reg.readReg(IP_REG);
      const modrm = ctx.ram.readByte((cs << 4) + ip + 1);
      const reg = (modrm >> 3) & 7;
      return reg === 2 || reg === 3 || reg === 4 || reg === 5;
    }
    return false;
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(IP_REG);
    const cs = ctx.reg.readReg(CS_REG);
    const ss = ctx.reg.readReg(SS_REG);

    if (op === JMP_SEG) {
      const disp = ctx.ram.readWord((cs << 4) + ip + 1);
      ctx.reg.incIP(3 + disp);
      return;
    }

    if (op === JMP_SEG_SHORT) {
      const disp = ctx.signExtendByte(ctx.ram.readByte((cs << 4) + ip + 1));
      ctx.reg.incIP(2 + disp);
      return;
    }

    if (op === JMP_DIR_INTSEG) {
      const dispOff = ctx.ram.readWord((cs << 4) + ip + 1);
      const dispSeg = ctx.ram.readWord((cs << 4) + ip + 3);
      ctx.reg.incIP(5 + dispOff);
      ctx.reg.writeReg(CS_REG, ctx.reg.readReg(CS_REG) + dispSeg);
      return;
    }

    if (op === CALL_DIR_SEG) {
      const disp = ctx.ram.readWord((cs << 4) + ip + 1);
      const oldIP = ip;
      ctx.reg.incSP();
      ctx.ram.writeWord((ss << 4) + ctx.reg.readReg(SP_REG), oldIP + 3);
      ctx.reg.incIP(3 + disp);
      return;
    }

    if (op === CALL_DIR_INTSEG) {
      const dispOff = ctx.ram.readWord((cs << 4) + ip + 1);
      const dispSeg = ctx.ram.readWord((cs << 4) + ip + 3);
      const oldIP = ip, oldCS = cs;
      ctx.reg.incSP();
      ctx.ram.writeWord((ss << 4) + ctx.reg.readReg(SP_REG), oldCS);
      ctx.reg.incSP();
      ctx.ram.writeWord((ss << 4) + ctx.reg.readReg(SP_REG), oldIP + 5);
      ctx.reg.writeReg(CS_REG, ctx.reg.readReg(CS_REG) + dispSeg);
      ctx.reg.incIP(5 + dispOff);
      return;
    }

    // JMP_IND_SEG (0xFF) — indirect JMP or CALL
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));
    const regField = operandes.opRegister[0];

    if (regField === 0b100) {
      // Indirect JMP in-segment
      if (operandes.addr === null) {
        const disp = ctx.reg.readReg(operandes.opRegister[1]!);
        ctx.reg.incIP(2 + disp + operandes.dispSize);
      } else {
        const disp = ctx.ram.readWord(operandes.addr);
        ctx.reg.incIP(2 + disp + operandes.dispSize);
      }
    } else if (regField === 0b101) {
      // Indirect JMP inter-segment (stub)
    } else if (regField === 0b010) {
      // Indirect CALL in-segment
      if (operandes.addr === null) {
        const disp = ctx.reg.readReg(operandes.opRegister[1]!);
        const oldIP = ctx.reg.readReg(IP_REG);
        ctx.reg.incIP(2 + disp);
        ctx.reg.incSP();
        ctx.ram.writeWord((ss << 4) + ctx.reg.readReg(SP_REG), oldIP + 2);
      } else {
        const disp = ctx.ram.readWord(operandes.addr);
        const oldIP = ctx.reg.readReg(IP_REG);
        ctx.reg.incIP(2 + disp + operandes.dispSize);
        ctx.reg.incSP();
        ctx.ram.writeWord((ss << 4) + ctx.reg.readReg(SP_REG), oldIP + 2 + operandes.dispSize);
      }
    } else if (regField === 0b011) {
      // Indirect CALL inter-segment (stub)
    }
  }
}
