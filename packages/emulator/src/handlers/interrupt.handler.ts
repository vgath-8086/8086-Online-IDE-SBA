import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import { AX_REG, DX_REG } from '../constants.js';
import { INT } from '../opcodes.js';

export class InterruptHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return op === INT; // 0xCC
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG
    const secondByte = ctx.ram.readByte((cs << 4) + ip + 1);

    if (secondByte === 0x21) {
      const ah = (ctx.reg.readReg(AX_REG) & 0xFF00) >> 8;

      if (ah === 0x01) {
        ctx.cnsl.readChar();
        ctx.int21_01 = true;
      } else if (ah === 0x02) {
        const ch = String.fromCharCode(ctx.reg.readReg(DX_REG) & 0x00FF);
        ctx.cnsl.writeChar(ch);
      } else if (ah === 0x09) {
        let addr = ctx.reg.readReg(DX_REG);
        let val = ctx.ram.readByte(addr);
        while (val !== 36) { // '$'
          ctx.cnsl.writeChar(String.fromCharCode(val));
          addr++;
          val = ctx.ram.readByte(addr);
        }
      } else if (ah === 0x0A) {
        ctx.cnsl.readChar();
        ctx.int21_0a = true;
        ctx.cnsl.waitForEnter();
      }
    }

    ctx.reg.incIP(2);
  }
}
