import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';
import {
  CON_JMP, JE, JL, JLE, JB, JBE, JP, JO, JS,
  JNE, JNL, JNLE, JNB, JNBE, JNP, JNO, JNS,
} from '../opcodes.js';

export class CondJumpHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return (op & 0xF0) === CON_JMP; // 0x70–0x7F
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG

    let jump = false;
    const f = (name: string) => ctx.reg.extractFlag(name);

    switch (op & 0x0F) {
      case JE:   jump = f('Z') === 1; break;
      case JL:   jump = f('S') !== f('O'); break;
      case JLE:  jump = f('Z') === 1 || f('S') !== f('O'); break;
      case JB:   jump = f('C') === 1; break;
      case JBE:  jump = f('Z') === 1 || f('C') === 1; break;
      case JP:   jump = f('P') === 1; break;
      case JO:   jump = f('O') === 1; break;
      case JS:   jump = f('S') === 1; break;
      case JNE:  jump = f('Z') === 0; break;
      case JNL:  jump = f('S') === f('O'); break;
      case JNLE: jump = f('Z') === 0 && f('S') === f('O'); break;
      case JNB:  jump = f('C') === 0; break;
      case JNBE: jump = f('Z') === 0 && f('C') === 0; break;
      case JNP:  jump = f('P') === 0; break;
      case JNO:  jump = f('O') === 0; break;
      case JNS:  jump = f('S') === 0; break;
    }

    if (jump) {
      const disp = ctx.signExtendByte(ctx.ram.readByte((cs << 4) + ip + 1));
      ctx.reg.incIP(2 + disp);
    } else {
      ctx.reg.incIP(2);
    }
  }
}
