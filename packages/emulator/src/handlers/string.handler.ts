/**
 * Handles REP/REPE/REPNE prefixes and string ops: MOVS, LODS, STOS, CMPS, SCAS.
 */
import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { AX_REG, CX_REG, SI_REG, DI_REG, DS_REG, ES_REG } from '../constants.js';
import { REP_INS, MOVS_INS, LODS_INS, STOS_INS, CMPS_INS, SCAS_INS } from '../opcodes.js';

export class StringHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op & 0b11111110) === REP_INS
      || (op & 0b11111110) === MOVS_INS
      || (op & 0b11111110) === LODS_INS
      || (op & 0b11111110) === STOS_INS
      || (op & 0b11111110) === CMPS_INS
      || (op & 0b11111110) === SCAS_INS;
  }

  execute(op: number, ctx: CpuContext): void {
    if ((op & 0b11111110) === REP_INS) {
      this.executeRepPrefix(op, ctx);
    } else {
      this.executeStringOp(op, ctx, false);
    }
  }

  private executeRepPrefix(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG

    if (ctx.reg.readReg(CX_REG) === 0) {
      ctx.reg.incIP(2);
      return;
    }

    const next = ctx.ram.readByte((cs << 4) + ip + 1);
    let isCmpOp = false;

    if ((next & 0b11111110) === CMPS_INS || (next & 0b11111110) === SCAS_INS) {
      isCmpOp = true;
    }

    this.executeStringOp(next, ctx, true);

    ctx.reg.writeReg(CX_REG, ctx.reg.readReg(CX_REG) - 1);

    // REPNE stops on ZF=1; REPE (op%2==1) stops on ZF=0
    if (isCmpOp) {
      if (op % 2 === 1 && ctx.reg.extractFlag('Z') === 0) {
        ctx.reg.incIP(2);
        return;
      }
      if (op % 2 === 0 && ctx.reg.extractFlag('Z') === 1) {
        ctx.reg.incIP(2);
        return;
      }
    }
  }

  private executeStringOp(op: number, ctx: CpuContext, given: boolean): void {
    if ((op & 0b11111110) === MOVS_INS) this.executeMOVS(op, ctx, given);
    else if ((op & 0b11111110) === LODS_INS) this.executeLODS(op, ctx, given);
    else if ((op & 0b11111110) === STOS_INS) this.executeSTOS(op, ctx, given);
    else if ((op & 0b11111110) === CMPS_INS) this.executeCMPS(op, ctx, given);
    else if ((op & 0b11111110) === SCAS_INS) this.executeSCAS(op, ctx, given);
  }

  private executeMOVS(op: number, ctx: CpuContext, given: boolean): void {
    const di = ctx.reg.readReg(DI_REG);
    const si = ctx.reg.readReg(SI_REG);
    const es = ctx.reg.readReg(ES_REG);
    const ds = ctx.reg.readReg(DS_REG);
    const ea1 = (es << 4) + di; // destination (ES:DI)
    const ea2 = (ds << 4) + si; // source (DS:SI)

    if (op % 2) {
      ctx.ram.writeWord(ea1, ctx.ram.readWord(ea2));
      const inc = ctx.reg.extractFlag('D') ? -2 : 2;
      ctx.reg.writeReg(DI_REG, di + inc);
      ctx.reg.writeReg(SI_REG, si + inc);
    } else {
      ctx.ram.writeByte(ea1, ctx.ram.readByte(ea2));
      const inc = ctx.reg.extractFlag('D') ? -1 : 1;
      ctx.reg.writeReg(DI_REG, di + inc);
      ctx.reg.writeReg(SI_REG, si + inc);
    }

    if (!given) ctx.reg.incIP(1);
  }

  private executeLODS(op: number, ctx: CpuContext, given: boolean): void {
    const si = ctx.reg.readReg(SI_REG);
    const ds = ctx.reg.readReg(DS_REG);

    if (op % 2) {
      const data = ctx.ram.readWord((ds << 4) + si);
      ctx.reg.writeReg(AX_REG, data);
      ctx.reg.writeReg(SI_REG, si + (ctx.reg.extractFlag('D') ? -2 : 2));
    } else {
      const data = ctx.ram.readByte((ds << 4) + si);
      ctx.reg.writeByteReg(0, data); // AL
      ctx.reg.writeReg(SI_REG, si + (ctx.reg.extractFlag('D') ? -1 : 1));
    }

    if (!given) ctx.reg.incIP(1);
  }

  private executeSTOS(op: number, ctx: CpuContext, given: boolean): void {
    const di = ctx.reg.readReg(DI_REG);
    const es = ctx.reg.readReg(ES_REG);

    if (op % 2) {
      ctx.ram.writeWord((es << 4) + di, ctx.reg.readReg(AX_REG));
      ctx.reg.writeReg(DI_REG, di + (ctx.reg.extractFlag('D') ? -2 : 2));
    } else {
      ctx.ram.writeByte((es << 4) + di, ctx.reg.readByteReg(0)); // AL
      ctx.reg.writeReg(DI_REG, di + (ctx.reg.extractFlag('D') ? -1 : 1));
    }

    if (!given) ctx.reg.incIP(1);
  }

  private executeCMPS(op: number, ctx: CpuContext, given: boolean): void {
    const di = ctx.reg.readReg(DI_REG);
    const si = ctx.reg.readReg(SI_REG);
    const es = ctx.reg.readReg(ES_REG);
    const ds = ctx.reg.readReg(DS_REG);
    const ea1 = (es << 4) + di; // ES:DI
    const ea2 = (ds << 4) + si; // DS:SI

    if (op % 2) {
      const valB = ctx.ram.readWord(ea1), valA = ctx.ram.readWord(ea2);
      ctx.generateFlag(valA - valB, valA, valB, 1);
      const inc = ctx.reg.extractFlag('D') ? -2 : 2;
      ctx.reg.writeReg(DI_REG, di + inc);
      ctx.reg.writeReg(SI_REG, si + inc);
    } else {
      const valB = ctx.ram.readByte(ea1), valA = ctx.ram.readByte(ea2);
      ctx.generateFlag(valA - valB, valA, valB, 0);
      const inc = ctx.reg.extractFlag('D') ? -1 : 1;
      ctx.reg.writeReg(DI_REG, di + inc);
      ctx.reg.writeReg(SI_REG, si + inc);
    }

    if (!given) ctx.reg.incIP(1);
  }

  private executeSCAS(op: number, ctx: CpuContext, given: boolean): void {
    const di = ctx.reg.readReg(DI_REG);
    const es = ctx.reg.readReg(ES_REG);
    const ea1 = (es << 4) + di;

    if (op % 2) {
      const valB = ctx.ram.readWord(ea1), valA = ctx.reg.readReg(AX_REG);
      ctx.generateFlag(valA - valB, valA, valB, 1);
      ctx.reg.writeReg(DI_REG, di + (ctx.reg.extractFlag('D') ? -2 : 2));
    } else {
      const valB = ctx.ram.readByte(ea1), valA = ctx.reg.readByteReg(0); // AL
      ctx.generateFlag(valA - valB, valA, valB, 0);
      ctx.reg.writeReg(DI_REG, di + (ctx.reg.extractFlag('D') ? -1 : 1));
    }

    if (!given) ctx.reg.incIP(1);
  }
}
