import { MockMemory }    from '../../test-doubles/mock-memory.js';
import { MockRegisters } from '../../test-doubles/mock-registers.js';
import { MockConsole }   from '../../test-doubles/mock-console.js';
import { CpuContext }    from '../../cpu/cpu-context.js';

export function makeCtx() {
  const ram  = new MockMemory();
  const reg  = new MockRegisters();
  const cnsl = new MockConsole();
  const ctx  = new CpuContext(reg, ram, cnsl);
  // Default CS=0, IP=0. Caller can override via reg.R[4] / reg.R[13].
  return { ctx, reg, ram, cnsl };
}

/** Returns a ModRM byte for register-to-register mode (mod=3). */
export function modrm(reg: number, rm: number): number {
  return 0b11000000 | (reg << 3) | rm;
}
