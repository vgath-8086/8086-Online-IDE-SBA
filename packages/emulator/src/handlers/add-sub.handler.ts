import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { AX_REG } from '../constants.js';
import {
  ADD_REG_MEM, ADC_REG_MEM, ADD_ACC_IMM, ADC_ACC_IMM,
  SUB_REG_MEM, SBB_REG_MEM, SUB_ACC_IMM, SBB_ACC_IMM,
  ADD_MODE, ADC_MODE, SUB_MODE, SBB_MODE,
} from '../opcodes.js';

export class AddSubHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op >> 2) === (ADD_REG_MEM >> 2)
      || (op >> 1) === (ADD_ACC_IMM >> 1)
      || (op >> 2) === (ADC_REG_MEM >> 2)
      || (op >> 1) === (ADC_ACC_IMM >> 1)
      || (op >> 2) === (SUB_REG_MEM >> 2)
      || (op >> 1) === (SUB_ACC_IMM >> 1)
      || (op >> 2) === (SBB_REG_MEM >> 2)
      || (op >> 1) === (SBB_ACC_IMM >> 1);
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG

    // Determine the arithmetic mode from the opcode
    let mode: number;
    if ((op >> 2) === (ADD_REG_MEM >> 2) || (op >> 1) === (ADD_ACC_IMM >> 1)) mode = ADD_MODE;
    else if ((op >> 2) === (ADC_REG_MEM >> 2) || (op >> 1) === (ADC_ACC_IMM >> 1)) mode = ADC_MODE;
    else if ((op >> 2) === (SUB_REG_MEM >> 2) || (op >> 1) === (SUB_ACC_IMM >> 1)) mode = SUB_MODE;
    else mode = SBB_MODE;

    const isSubtractive = mode === SUB_MODE || mode === SBB_MODE;

    const isAccImm = (op >> 1) === (ADD_ACC_IMM >> 1)
      || (op >> 1) === (ADC_ACC_IMM >> 1)
      || (op >> 1) === (SUB_ACC_IMM >> 1)
      || (op >> 1) === (SBB_ACC_IMM >> 1);

    if (isAccImm) {
      if (op % 2 === 1) {
        const immVal = ctx.ram.readWord((cs << 4) + ip + 1);
        const ax = ctx.reg.readReg(AX_REG);
        const result = ctx.executeArithmetic(mode, ax, immVal);
        ctx.reg.writeReg(AX_REG, result);
        ctx.generateFlag(result, ax, immVal, 1, undefined, isSubtractive);
      } else {
        const immVal = ctx.ram.readByte((cs << 4) + ip + 1);
        const al = ctx.reg.readByteReg(0);
        const result = ctx.executeArithmetic(mode, al, immVal);
        ctx.reg.writeByteReg(0, result & 0xFF);
        ctx.generateFlag(result, al, immVal, 0, undefined, isSubtractive);
      }
      ctx.reg.incIP(op % 2 + 2);
      return;
    }

    // R/M to/from Reg variant
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));

    if (operandes.addr === null) {
      const R1 = operandes.opRegister[0], R2 = operandes.opRegister[1]!;

      if (op % 2 === 1) {
        const v1 = ctx.reg.readWordReg(R1), v2 = ctx.reg.readWordReg(R2);
        const [dst, src] = (op >> 1) % 2 ? [v1, v2] : [v2, v1];
        const result = ctx.executeArithmetic(mode, dst, src);

        if ((op >> 1) % 2) ctx.reg.writeWordReg(R1, result);
        else               ctx.reg.writeWordReg(R2, result);
        ctx.generateFlag(result, dst, src, 1, undefined, isSubtractive);
      } else {
        const v1 = ctx.reg.readByteReg(R1), v2 = ctx.reg.readByteReg(R2);
        const [dst, src] = (op >> 1) % 2 ? [v1, v2] : [v2, v1];
        const result = ctx.executeArithmetic(mode, dst, src);

        if ((op >> 1) % 2) ctx.reg.writeByteReg(R1, result & 0xFF);
        else               ctx.reg.writeByteReg(R2, result & 0xFF);
        ctx.generateFlag(result, dst, src, 0, undefined, isSubtractive);
      }
    } else {
      const R = operandes.opRegister[0], addr = operandes.addr;

      if (op % 2 === 1) {
        const memVal = ctx.ram.readWord(addr), regVal = ctx.reg.readWordReg(R);
        const [dst, src] = (op >> 1) % 2 ? [regVal, memVal] : [memVal, regVal];
        const result = ctx.executeArithmetic(mode, dst, src);

        if ((op >> 1) % 2) ctx.reg.writeWordReg(R, result);
        else               ctx.ram.writeWord(addr, result);
        ctx.generateFlag(result, dst, src, 1, undefined, isSubtractive);
      } else {
        const memVal = ctx.ram.readByte(addr), regVal = ctx.reg.readByteReg(R);
        const [dst, src] = (op >> 1) % 2 ? [regVal, memVal] : [memVal, regVal];
        const result = ctx.executeArithmetic(mode, dst, src);

        if ((op >> 1) % 2) ctx.reg.writeByteReg(R, result & 0xFF);
        else               ctx.ram.writeByte(addr, result & 0xFF);
        ctx.generateFlag(result, dst, src, 0, undefined, isSubtractive);
      }
    }

    ctx.reg.incIP(operandes.dispSize + 2);
  }
}
