import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { Compiler } from '@emu8086/compiler';
import type { CompilerResult } from '@emu8086/compiler';
import { EmulatorController, AX_REG, BX_REG, CX_REG, DX_REG, SI_REG, IP_REG } from '@emu8086/emulator';
import type { KeyProvider, LoadableProgram } from '@emu8086/emulator';

type FinalViewLine = NonNullable<CompilerResult['finalView']>[number];

class MockKeyProvider implements KeyProvider {
  waitForKey(): Promise<string> { return new Promise(() => {}); }
  waitForEnter(): Promise<void> { return new Promise(() => {}); }
}

function hex(n: number): string {
  return n.toString(16).toUpperCase().padStart(4, '0');
}

function pass(msg: string) { console.log(`  ✓ ${msg}`); }
function fail(msg: string) { console.error(`  ✗ ${msg}`); process.exitCode = 1; }
function check(label: string, got: number, expected: number) {
  if (got === expected) pass(`${label} = ${hex(got)}`);
  else fail(`${label}: expected ${hex(expected)}, got ${hex(got)}`);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, 'test-all.asm'), 'utf-8');

// ── Compile ──────────────────────────────────────────────────────────────────
console.log('\n[1] Compilation');
const result = Compiler.compile(source);
if (!result.status || !result.finalView || result.origin === null) {
  console.error('  ✗ Compilation failed:', result.message);
  process.exit(1);
}
pass(`compiled ${result.finalView.filter(l => l.executableLine).length} executable lines, origin=${hex(result.origin)}`);

const program: LoadableProgram = {
  origin: result.origin,
  instructions: result.finalView
    .filter((l: FinalViewLine) => l.executableLine)
    .map((l: FinalViewLine) => ({ addr: l.instructionAddr, opcodes: l.opcodes })),
};

// ── Load ─────────────────────────────────────────────────────────────────────
console.log('\n[2] Load + initial state');
const controller = new EmulatorController(new MockKeyProvider());
controller.loadProgram(program);
const r = controller.processor.register;
check('IP after load', r.readReg(IP_REG), result.origin);
pass('program loaded');

// ── Run ──────────────────────────────────────────────────────────────────────
console.log('\n[3] Execution (step-by-step)');
let steps = 0;
let done = false;
let prevIP = -1;
while (!done && steps < 10_000) {
  const stepResult = controller.singleStep();
  steps++;
  if (stepResult.done) { done = true; break; }
  const ip = r.readReg(IP_REG);
  if (ip === prevIP) { fail(`IP stuck at ${hex(ip)} — unknown opcode?`); break; }
  prevIP = ip;
}
if (done) pass(`execution ended in ${steps} steps`);
else if (steps >= 10_000) fail('hit 10 000 step limit — possible infinite loop');

// ── Step-back ────────────────────────────────────────────────────────────────
console.log('\n[4] Step-back');
// Last step was `ret` (changes IP/SP but not AX); step back from it, check IP restored.
const ipDone = r.readReg(IP_REG);       // 0xFFFE (after ret)
controller.stepBack();                   // undo ret
const ipAfterBack = r.readReg(IP_REG);  // should be back at ret instruction
if (ipDone !== ipAfterBack) pass(`stepBack restored IP: ${hex(ipDone)} → ${hex(ipAfterBack)}`);
else fail('stepBack did not change IP');
// Second step-back: undo "mov ax, 1234h" — AX should revert
const axBeforeUndo = r.readReg(AX_REG);
controller.stepBack();
const axAfterUndo = r.readReg(AX_REG);
if (axBeforeUndo !== axAfterUndo) pass(`stepBack undid AX: ${hex(axBeforeUndo)} → ${hex(axAfterUndo)}`);
else fail('second stepBack did not change AX');
// Restore for final assertions
controller.singleStep();
controller.singleStep();

// ── Register assertions ───────────────────────────────────────────────────────
console.log('\n[5] Final register values');
check('AX (success sentinel)', r.readReg(AX_REG), 0x1234);
check('BX (xchg result)',      r.readReg(BX_REG), 0x000F);
check('CX (loop exhausted)',   r.readReg(CX_REG), 0x0000);
check('DX (neg 1)',            r.readReg(DX_REG), 0xFFFF);
check('SI (loop counter)',     r.readReg(SI_REG), 0x0005);

// ── Reset ────────────────────────────────────────────────────────────────────
console.log('\n[6] Reset');
controller.reset();
check('AX after reset', r.readReg(AX_REG), 0x0000);
check('IP after reset', r.readReg(IP_REG), result.origin);
pass('reset OK');

console.log(process.exitCode ? '\nSome tests FAILED.' : '\nAll tests passed.');
