import type { LexicalLine, Operand, OperandType, MacroEntry, ExpressionType, InstructionType, VariableClass } from '../types.js';
import { CompilerErrorCode } from '../error-codes.js';
import { deepCopy }          from './deep-copy.js';

export type MacroExpansionResult = {
  success: boolean;
  message: CompilerErrorCode | '';
  errorLine: number | null;
};

/**
 * Extracts macro definitions from the lexical view, then expands all macro
 * call sites in-place.  Uses an iterative fixed-point loop to handle macros
 * that invoke other macros (up to 50 passes before declaring recursion).
 */
export class MacroExpander {
  private macros: MacroEntry[] = [];

  expand(lexicalView: LexicalLine[]): MacroExpansionResult {
    const extract = this.extractDefinitions(lexicalView);
    if (!extract.success) return extract;

    if (this.hasDuplicateNames())
      return { success: false, message: CompilerErrorCode.DUPLICATE_MACRO_NAMES, errorLine: null };

    return this.expandCallSites(lexicalView);
  }

  private extractDefinitions(lexicalView: LexicalLine[]): MacroExpansionResult {
    let inMacro = false;
    let macroIndex: number | null = null;
    let macroLineDeclaration = 0;
    let macroLengthDeclaration = 0;
    let macroCount = 0;
    let localInstParameter: Operand[] = [];

    for (let i = 0; i < lexicalView.length; i++) {
      const line = lexicalView[i];
      const isInst = (name: string) => line.expressionType === 'INST' && line.instName === name;

      if (isInst('LOCAL') && !inMacro)
        return { success: false, message: CompilerErrorCode.ILLEGAL_LOCAL_DIRECTIVE, errorLine: line.index };
      if (isInst('ENDM') && !inMacro)
        return { success: false, message: CompilerErrorCode.ILLEGAL_ENDM_DIRECTIVE, errorLine: line.index };
      if (line.expressionType === 'macro definition' && inMacro)
        return { success: false, message: CompilerErrorCode.MISSING_ENDM, errorLine: line.index };

      if (line.expressionType === 'macro definition' && !inMacro) {
        inMacro = true;
        macroIndex = line.index;
        this.macros.push({
          name: line.instName,
          op: line.operands,
          index: line.index,
          innerContent: [],
          localInstParameter: [],
        });
        macroLineDeclaration = i;
        macroLengthDeclaration = 1;
      } else if (isInst('LOCAL') && inMacro) {
        if (localInstParameter.length !== 0)
          return { success: false, message: CompilerErrorCode.SINGLE_LOCAL_ONLY, errorLine: line.index };
        localInstParameter = line.operands;
        macroLengthDeclaration++;
      } else if (isInst('ENDM') && inMacro) {
        inMacro = false;
        this.macros[macroCount].localInstParameter = localInstParameter;
        localInstParameter = [];
        macroCount++;
        macroLengthDeclaration++;
        lexicalView.splice(macroLineDeclaration, macroLengthDeclaration);
        i -= macroLengthDeclaration;
        macroLengthDeclaration = 0;
      } else if (inMacro) {
        macroLengthDeclaration++;
        this.macros[macroCount].innerContent.push(line);
      }
    }

    if (inMacro)
      return { success: false, message: CompilerErrorCode.MISSING_ENDM, errorLine: macroIndex };

    return { success: true, message: '', errorLine: null };
  }

  private hasDuplicateNames(): boolean {
    for (let i = 0; i < this.macros.length; i++)
      for (let j = i + 1; j < this.macros.length; j++)
        if (this.macros[i].name === this.macros[j].name) return true;
    return false;
  }

  /** Returns the index of the named macro in this.macros, or -1 if not found. */
  private findMacroIndex(name: string | null): number {
    return this.macros.findIndex(m => m.name === name);
  }

  private expandCallSites(lexicalView: LexicalLine[]): MacroExpansionResult {
    let passes = 0;
    let converged = false;

    while (passes < 50 && !converged) {
      converged = true;

      for (let i = 0; i < lexicalView.length; i++) {
        const line = lexicalView[i];
        if (line.expressionType !== 'MACRO') continue;

        converged = false;
        const macroId = this.findMacroIndex(line.instName);

        if (macroId === -1)
          return { success: false, message: CompilerErrorCode.UNDECLARED_MACRO, errorLine: line.index };
        if (lexicalView[i].operands.length !== this.macros[macroId].op.length)
          return { success: false, message: CompilerErrorCode.WRONG_MACRO_PARAMETER_COUNT, errorLine: line.index };

        const expansion = this.buildExpansion(line, macroId);
        lexicalView.splice(i, 1, ...expansion);
      }

      passes++;
    }

    if (passes >= 50)
      return { success: false, message: CompilerErrorCode.MACRO_RECURSION_DETECTED, errorLine: null };

    return { success: true, message: '', errorLine: null };
  }

  private buildExpansion(line: LexicalLine, macroId: number): LexicalLine[] {
    const code: LexicalLine[] = [];

    // Lift string literals into anonymous DB variables before the macro body.
    const stringVars: { value: string; variableName: string }[] = [];
    for (let j = 0; j < line.operands.length; j++) {
      if (line.operands[j].type === 'STR') {
        const varName = '__VAR_' + line.instName + '__N°_' + j;
        stringVars.push({ value: line.operands[j].name, variableName: varName });
        line.operands[j] = { type: 'VARU', name: varName };
      }
    }

    let jmpPadding = 0;
    for (const sv of stringVars) {
      code.push(this.makeLexicalLine(line.index, 'VAR', 'DB', 'DB', null, sv.variableName, 'DU',
        [{ name: sv.value, type: 'STR' }, { name: '0', type: 'INT' }]));
      jmpPadding += sv.value.length - 2 + 1;
    }

    if (jmpPadding !== 0) {
      code.unshift(this.makeLexicalLine(line.index, 'INST', null, 'JMP', null, null, null,
        [{ name: jmpPadding.toString(), type: 'INT' }]));
      code.unshift(this.makeLexicalLine(line.index, 'NULL', null, null, ['___VARIABLE_MACRO'], null, null, []));
    }

    code.push(this.makeLexicalLine(line.index, 'NULL', null, null, ['___MACRO_BEGINING'], null, null, []));

    const body = this.substituteParameters(line.operands, macroId);
    for (const bodyLine of body) {
      bodyLine.index = line.index;
      code.push(bodyLine);
    }

    code.push(this.makeLexicalLine(line.index, 'NULL', null, null, ['___MACRO_END'], null, null, []));
    return code;
  }

  /** Constructs a LexicalLine with all fields set from the given arguments. */
  private makeLexicalLine(
    index: number | null,
    expressionType: ExpressionType,
    instructionType: InstructionType,
    instName: string | null,
    label: string[] | null,
    variableName: string | null,
    variableClass: VariableClass,
    operands: Operand[],
  ): LexicalLine {
    return {
      label, expressionType, instructionType, instName,
      good: true, message: null, operands,
      variableName, variableClass, index,
    };
  }

  private substituteParameters(operands: Operand[], macroId: number): LexicalLine[] {
    const table = deepCopy(this.macros[macroId].innerContent);
    const labelList    = this.macros[macroId].localInstParameter;
    const paramList    = this.macros[macroId].op;
    const macroName    = this.macros[macroId].name ?? '';

    for (const labelEntry of labelList) {
      const from = labelEntry.name;
      const to   = '__LOCAL_LABEL' + macroName + from;
      for (const row of table) {
        if (Array.isArray(row.label))
          row.label = (row.label as string[]).map(l => l === from ? to : l);
        for (const op of row.operands)
          if (op.name === from) op.name = to;
      }
    }

    for (let i = 0; i < paramList.length; i++) {
      const paramName = paramList[i].name.trim();
      const paramVal  = operands[i];
      for (const row of table) {
        for (const op of row.operands) {
          if (op.name.toUpperCase().trim() === paramName.toUpperCase()) {
            op.name = paramVal.name.trim();
            op.type = paramVal.type.trim() as OperandType;
          }
          const parts = op.name.trim().split(' ');
          if (parts[1]?.toUpperCase() === paramName.toUpperCase())
            op.name = 'offset ' + paramVal.name.trim();
        }
      }
    }

    return table;
  }
}
