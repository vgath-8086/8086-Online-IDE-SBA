/**
 * Handles AND, OR, XOR (R/M variants) and TEST.
 * AND also handles AND acc, imm (0x24/0x25).
 */
import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { AX_REG } from '../constants.js';
import { AND_RM_RM, AND_IMMEDIATE_TO_ACC, OR_RM_RM, XOR_RM_RM } from '../opcodes.js';

export class LogicHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op >> 2) === AND_RM_RM            // 0x20–0x23
      || (op >> 1) === AND_IMMEDIATE_TO_ACC   // 0x24–0x25
      || (op >> 2) === OR_RM_RM               // 0x08–0x0B
      || (op >> 2) === XOR_RM_RM              // 0x30–0x33
      || (op & 0xFE) === 0b10000100;          // TEST 0x84–0x85
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG

    // AND acc, imm
    if ((op >> 1) === AND_IMMEDIATE_TO_ACC) {
      const immAddr = (cs << 4) + ip + 2;
      if (op % 2 === 1) {
        const immVal = ctx.ram.readWord(immAddr);
        ctx.reg.writeReg(AX_REG, ctx.reg.readReg(AX_REG) & immVal);
      } else {
        const immVal = ctx.ram.readByte(immAddr);
        ctx.reg.writeReg(AX_REG, (ctx.reg.readReg(AX_REG) & 0x00FF) & immVal);
      }
      ctx.reg.incIP(op % 2 + 3);
      return;
    }

    const isTest = (op & 0xFE) === 0b10000100;
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));
    const fn = this.selectBitwiseOp(op, isTest);

    if (operandes.addr === null) {
      const R1 = operandes.opRegister[0], R2 = operandes.opRegister[1]!;

      if (op % 2 === 1) {
        const v1 = ctx.reg.readWordReg(R1), v2 = ctx.reg.readWordReg(R2);
        const result = fn(v1, v2);
        if (!isTest) {
          if ((op >> 1) % 2) ctx.reg.writeWordReg(R1, result);
          else               ctx.reg.writeWordReg(R2, result);
        }
        ctx.generateFlag(result, v1, v2, 1);
      } else {
        const v1 = ctx.reg.readByteReg(R1), v2 = ctx.reg.readByteReg(R2);
        const result = fn(v1, v2);
        if (!isTest) {
          if ((op >> 1) % 2) ctx.reg.writeByteReg(R1, result);
          else               ctx.reg.writeByteReg(R2, result);
        }
        ctx.generateFlag(result, v1, v2, 0);
      }
    } else {
      const R = operandes.opRegister[0], addr = operandes.addr;

      if (op % 2 === 1) {
        const memVal = ctx.ram.readWord(addr), regVal = ctx.reg.readWordReg(R);
        const result = fn(memVal, regVal);
        if (!isTest) {
          if ((op >> 1) % 2) ctx.reg.writeWordReg(R, result);
          else               ctx.ram.writeWord(addr, result);
        }
        ctx.generateFlag(result, memVal, regVal, 1);
      } else {
        const memVal = ctx.ram.readByte(addr), regVal = ctx.reg.readByteReg(R);
        const result = fn(memVal, regVal);
        if (!isTest) {
          if ((op >> 1) % 2) ctx.reg.writeByteReg(R, result);
          else               ctx.ram.writeByte(addr, result);
        }
        ctx.generateFlag(result, memVal, regVal, 0);
      }
    }

    ctx.reg.incIP(operandes.dispSize + 2);
  }

  private selectBitwiseOp(op: number, isTest: boolean): (a: number, b: number) => number {
    if (isTest || (op >> 2) === AND_RM_RM) return (a, b) => a & b;
    if ((op >> 2) === OR_RM_RM)            return (a, b) => a | b;
    /* XOR */                              return (a, b) => a ^ b;
  }
}
