/**
 * Handles D0–D3 group: ROL(reg=0), ROR(reg=1), RCL(reg=2), RCR(reg=3),
 * SHL/SAL(reg=4), SHR(reg=5), SAR(reg=7).
 */
import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { CX_REG } from '../constants.js';

export class ShiftRotateHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op & 0xFC) === 0xD0; // 0xD0–0xD3
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));
    const subOp = operandes.opRegister[0]; // reg field selects operation
    const useCx = (op >> 1) % 2;           // v-bit: 0=once, 1=CL times
    const w = op % 2;                       // w-bit: 0=byte, 1=word

    const getCx = () => ctx.reg.readReg(CX_REG) & 0x00FF;

    if (operandes.addr === null) {
      const R = operandes.opRegister[1]!;
      if (w === 1) {
        let val = ctx.reg.readWordReg(R);
        val = this.applyOp(subOp, val, useCx ? getCx() : 1, 16, ctx);
        ctx.reg.writeWordReg(R, val & 0xFFFF);
      } else {
        let val = ctx.reg.readByteReg(R);
        val = this.applyOp(subOp, val, useCx ? getCx() : 1, 8, ctx);
        ctx.reg.writeByteReg(R, val & 0xFF);
      }
    } else {
      const addr = operandes.addr;
      if (w === 1) {
        let val = ctx.ram.readWord(addr);
        val = this.applyOp(subOp, val, useCx ? getCx() : 1, 16, ctx);
        ctx.ram.writeWord(addr, val & 0xFFFF);
      } else {
        let val = ctx.ram.readByte(addr);
        val = this.applyOp(subOp, val, useCx ? getCx() : 1, 8, ctx);
        ctx.ram.writeByte(addr, val & 0xFF);
      }
    }

    ctx.reg.incIP(2);
  }

  private applyOp(subOp: number, val: number, count: number, bits: number, ctx: CpuContext): number {
    const msb = bits - 1;
    const msbMask = 1 << msb;
    const fullMask = (1 << bits) - 1;

    for (let i = 0; i < count; i++) {
      switch (subOp) {
        case 0b000: { // ROL
          const top = (val & msbMask) >> msb;
          val = ((val << 1) | top) & fullMask;
          break;
        }
        case 0b001: { // ROR
          const bot = val & 1;
          val = ((val >> 1) | (bot << msb)) & fullMask;
          break;
        }
        case 0b010: { // RCL
          const top = (val & msbMask) >> msb;
          const pc = ctx.reg.extractFlag('C');
          ctx.reg.setFlag('C', top);
          val = ((val << 1) | pc) & fullMask;
          break;
        }
        case 0b011: { // RCR
          const bot = val & 1;
          const pc = ctx.reg.extractFlag('C');
          ctx.reg.setFlag('C', bot);
          val = ((val >> 1) | (pc << msb)) & fullMask;
          break;
        }
        case 0b100: { // SHL/SAL
          const top = (val & msbMask) >> msb;
          ctx.reg.setFlag('C', top);
          val = (val << 1) & fullMask;
          break;
        }
        case 0b101: { // SHR
          ctx.reg.setFlag('C', val & 1);
          val = (val >> 1) & fullMask;
          break;
        }
        case 0b111: { // SAR (arithmetic: preserve sign)
          ctx.reg.setFlag('C', val & 1);
          const sign = val & msbMask;
          val = ((val >> 1) | sign) & fullMask;
          break;
        }
      }
    }

    return val;
  }
}
