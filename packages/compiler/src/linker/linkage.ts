import type { IEncoder } from '../interfaces/i-encoder.js';
import type { LexicalLine, VariableEntry, LabelEntry, FinalViewLine, PostLinkState } from '../types.js';
import { FLOW_INSTRUCTIONS, LONG_FLOW_INSTRUCTIONS } from '@emu8086/shared';
import { CompilerErrorCode }   from '../error-codes.js';
import { generateVariable }    from './generate-variable.js';
import { reformInstruction }   from './reform-instruction.js';

type ResolvedLine = { lexicalLine: LexicalLine; strLine: string };

export class Linkage {
  private origine:    number           = 0;
  private varArray:   VariableEntry[]  = [];
  private labelArray: LabelEntry[]     = [];
  private finalArray: FinalViewLine[]  = [];

  constructor(private readonly encoder: IEncoder) {}

  // ── Public entry points ──────────────────────────────────────────────────

  link(
    lexicalView: LexicalLine[],
    varArray: VariableEntry[],
    labelArray: LabelEntry[],
    origin: number,
  ): FinalViewLine[] {
    this.origine    = origin;
    this.varArray   = varArray;
    this.labelArray = labelArray;
    this.finalArray = [];

    this.initFinalView(lexicalView);
    let passes = 0;
    while (this.runPass(lexicalView) && passes < 1000) passes++;
    return this.finalArray;
  }

  verify(finalView: FinalViewLine[]): PostLinkState {
    for (const entry of finalView) {
      const line = entry.lexicalLine;
      if (line === null) continue;
      if (
        line.expressionType === 'INST' &&
        FLOW_INSTRUCTIONS.includes(line.instName ?? '') &&
        !LONG_FLOW_INSTRUCTIONS.includes(line.instName ?? '')
      ) {
        if ((parseInt(line.operands[0].name) & 0xFF00) !== 0)
          return { good: false, message: CompilerErrorCode.JUMP_OUT_OF_BOUNDS, errorLine: line.index };
      }
    }
    return { good: true, message: '', errorLine: null };
  }

  // ── Pass initialisation ──────────────────────────────────────────────────

  private initFinalView(lexicalView: LexicalLine[]): void {
    this.finalArray = lexicalView.map(line => {
      const originalLine = reformInstruction(line, true, true);
      const entry: FinalViewLine = {
        executableLine:  false,
        lexicalLine:     null,
        originalLine,
        resolvedLine:    '',
        opcodes:         [],
        instructionSize: 0,
        instructionAddr: 0,
      };

      if (line.expressionType === 'INST') {
        entry.executableLine = true;
      } else if (line.expressionType === 'VAR') {
        const bytes = generateVariable(line);
        entry.executableLine  = true;
        entry.resolvedLine    = originalLine;
        entry.opcodes         = bytes;
        entry.instructionSize = bytes.length;
      }

      return entry;
    });
  }

  // ── Iterative address-resolution pass ────────────────────────────────────

  private runPass(lexicalView: LexicalLine[]): boolean {
    let virtualIP    = this.origine;
    let shouldReloop = false;

    for (let i = 0; i < lexicalView.length; i++) {
      const line = lexicalView[i];

      if (line.label !== null) {
        for (const lbl of line.label as string[]) {
          if (this.setLabelAddr(lbl, virtualIP)) shouldReloop = true;
        }
      }

      if (line.expressionType === 'VAR') {
        this.finalArray[i].instructionAddr = virtualIP;
        if (this.setVarAddr(line.variableName, virtualIP)) shouldReloop = true;
        virtualIP += this.finalArray[i].instructionSize;

      } else if (line.expressionType === 'INST') {
        const resolved = FLOW_INSTRUCTIONS.includes(line.instName ?? '')
          ? this.resolveJmp(line, virtualIP)
          : this.resolveGeneral(line);

        this.finalArray[i].lexicalLine     = resolved.lexicalLine;
        this.finalArray[i].resolvedLine    = resolved.strLine.trim();
        this.finalArray[i].opcodes         = this.encoder.encode(resolved.strLine.trim());
        this.finalArray[i].instructionSize = this.finalArray[i].opcodes.length;
        this.finalArray[i].instructionAddr = virtualIP;
        virtualIP += this.finalArray[i].instructionSize;
      }
    }

    return shouldReloop;
  }

  // ── Operand resolution: general instructions ─────────────────────────────

  private resolveGeneral(line: LexicalLine, addLabels = false): ResolvedLine {
    const newLine = this.copyLine(line);

    for (const op of newLine.operands) {
      if (op.type === 'VAR16' || op.type === 'VAR8' || op.type === 'VARU') {
        const entry = this.varArray.find(v => v.varName?.toUpperCase() === op.name.toUpperCase());
        if (entry) {
          const prefix = op.type === 'VAR16' ? 'word [' : op.type === 'VAR8' ? 'byte [' : '[';
          op.name = prefix + (entry.addr & 0xFFFF).toString() + ' ]';
          op.type = op.type === 'VARU' ? 'MU' : op.type === 'VAR16' ? 'MW' : 'MB';
        }
      } else if (op.type === 'OFF') {
        const varName = op.name.trim().split(' ')[1].toUpperCase();
        const entry   = this.varArray.find(v => v.varName?.toUpperCase() === varName);
        if (entry) { op.name = (entry.addr & 0xFFFF).toString(); op.type = 'INT'; }
      } else if (op.type === 'LBL') {
        const entry = this.labelArray.find(l => l.labelName?.toUpperCase() === op.name.toUpperCase());
        if (entry) { op.name = (entry.addr & 0xFFFF).toString(); op.type = 'INT'; }
      }
    }

    return { lexicalLine: newLine, strLine: reformInstruction(newLine, addLabels) };
  }

  // ── Operand resolution: flow instructions (JMP / CALL / Jcc / LOOP) ──────

  private resolveJmp(line: LexicalLine, virtualIP: number, addLabels = false): ResolvedLine {
    const newLine = this.copyLine(line);
    const op      = newLine.operands[0];

    if (op?.type === 'LBL') {
      const entry = this.labelArray.find(l => l.labelName?.toUpperCase() === op.name.toUpperCase());
      if (entry) this.applyJumpValue(newLine, op, entry.addr, virtualIP);

    } else if (op?.type === 'OFF') {
      const varName = op.name.trim().split(' ')[1];
      const entry   = this.varArray.find(v => v.varName === varName);
      if (entry) this.applyJumpValue(newLine, op, entry.addr, virtualIP);
    }

    return { lexicalLine: newLine, strLine: reformInstruction(newLine, addLabels) };
  }

  private applyJumpValue(
    line: LexicalLine,
    op:   LexicalLine['operands'][number],
    targetAddr: number,
    virtualIP:  number,
  ): void {
    const modulo = this.jumpModulo(line.instName, targetAddr, virtualIP);
    let value    = (targetAddr - virtualIP - modulo) & 0xFFFF;
    if (!LONG_FLOW_INSTRUCTIONS.includes(line.instName ?? '')) value &= 0x00FF;
    op.name = value.toString();
    op.type = 'INT';
  }

  private jumpModulo(instName: string | null, targetAddr: number, virtualIP: number): number {
    if (instName === 'JMP')
      return (targetAddr - virtualIP > 128 || targetAddr - virtualIP < 0) ? 3 : 2;
    if (instName === 'CALL') return 3;
    return 2;
  }

  // ── Address-table writers ────────────────────────────────────────────────

  private setLabelAddr(name: string | null, addr: number): boolean {
    if (name === null) return false;
    const entry = this.labelArray.find(l => l.labelName === name.toUpperCase());
    if (!entry) return false;
    const changed = entry.addr !== addr;
    entry.addr = addr;
    return changed;
  }

  private setVarAddr(name: string | null, addr: number): boolean {
    if (name === null) return false;
    const entry = this.varArray.find(v => v.varName === name);
    if (!entry) return false;
    const changed = entry.addr !== addr;
    entry.addr = addr;
    return changed;
  }

  private copyLine(line: LexicalLine): LexicalLine {
    return { ...line, operands: line.operands.map(op => ({ ...op })) };
  }
}
