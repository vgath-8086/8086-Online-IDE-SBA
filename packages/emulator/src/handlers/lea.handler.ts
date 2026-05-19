import type { IInstructionHandler } from '../interfaces/i-instruction-handler.js';
import type { CpuContext } from '../cpu/cpu-context.js';

export class LeaHandler implements IInstructionHandler {
  matches(op: number): boolean {
    return op === 0b10001101; // 0x8D
  }

  execute(op: number, ctx: CpuContext): void {
    const ip = ctx.reg.readReg(13); // IP_REG
    const cs = ctx.reg.readReg(4);  // CS_REG
    const operandes = ctx.extractOperand(ctx.ram.readByte((cs << 4) + ip + 1));
    ctx.reg.writeWordReg(operandes.opRegister[0], operandes.addr!);
    ctx.reg.incIP(2 + operandes.dispSize);
  }
}
