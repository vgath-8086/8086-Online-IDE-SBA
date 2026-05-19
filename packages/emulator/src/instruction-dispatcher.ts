import type { IInstructionHandler } from './interfaces/i-instruction-handler.js';
import type { CpuContext } from './cpu/cpu-context.js';

export class InstructionDispatcher {
  private readonly handlers: IInstructionHandler[] = [];

  register(handler: IInstructionHandler): this {
    this.handlers.push(handler);
    return this;
  }

  dispatch(opcode: number, ctx: CpuContext): void {
    for (const h of this.handlers) {
      if (h.matches(opcode, ctx)) {
        h.execute(opcode, ctx);
        return;
      }
    }
  }
}
