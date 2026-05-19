import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { ARITHMETIC_IMM } from '../opcodes.js';
import {
  ADD_MODE, ADC_MODE, SUB_MODE, SBB_MODE, AND_MODE, OR_MODE, XOR_MODE, CMP_MODE,
} from '../opcodes.js';

const MODES = [ADD_MODE, OR_MODE, ADC_MODE, SBB_MODE, AND_MODE, SUB_MODE, XOR_MODE, CMP_MODE];

export class ImmArithHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op >> 2) === (ARITHMETIC_IMM >> 2); // 0x80–0x83
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));
    const mode = MODES[operandes.opRegister[0]];
    const isCmp = operandes.opRegister[0] === 0b111;

    // Immediate value address: 2 bytes into instruction + displacement
    const immAddr = (cs << 4) + ip + 2 + operandes.dispSize;

    if (op % 2 === 1) {
      // 16-bit operation; compiler always emits 2-byte immediate (even for 0x83)
      const immVal = ctx.ram.readWord(immAddr);

      if (operandes.addr === null) {
        const R = operandes.opRegister[1]!;
        const regVal = ctx.reg.readWordReg(R);
        const result = ctx.executeArithmetic(mode, regVal, immVal);
        if (!isCmp) ctx.reg.writeWordReg(R, result);
        ctx.generateFlag(result, regVal, immVal, 1);
      } else {
        const memVal = ctx.ram.readWord(operandes.addr);
        const result = ctx.executeArithmetic(mode, memVal, immVal);
        if (!isCmp) ctx.ram.writeWord(operandes.addr, result);
        ctx.generateFlag(result, memVal, immVal, 1);
      }

      ctx.reg.incIP(operandes.dispSize + 2 + 2);
    } else {
      // 8-bit
      const immVal = ctx.ram.readByte(immAddr);

      if (operandes.addr === null) {
        const R = operandes.opRegister[1]!;
        const regVal = ctx.reg.readByteReg(R);
        const result = ctx.executeArithmetic(mode, regVal, immVal);
        if (!isCmp) ctx.reg.writeByteReg(R, result & 0xFF);
        ctx.generateFlag(result, regVal, immVal, 0);
      } else {
        const memVal = ctx.ram.readByte(operandes.addr);
        const result = ctx.executeArithmetic(mode, memVal, immVal);
        if (!isCmp) ctx.ram.writeByte(operandes.addr, result & 0xFF);
        ctx.generateFlag(result, memVal, immVal, 0);
      }

      ctx.reg.incIP(operandes.dispSize + 3);
    }
  }
}
