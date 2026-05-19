import type { LexicalLine } from '../types.js';

export function reformInstruction(line: LexicalLine, addLabels = true, showProc = false): string {
  let s = '';

  if (addLabels && line.label !== null) {
    if (showProc && line.instName === 'PROC') s += 'Procedure ';
    for (const lbl of line.label as string[])
      s += lbl.toUpperCase() + ': ';
  }

  if (line.expressionType === 'VAR') {
    s += (line.variableName ?? '') + ' ' + (line.variableClass ?? '').toLowerCase() + ' ';
  } else if (line.expressionType === 'INST') {
    s += (line.instName ?? '').toLowerCase() + ' ';
  } else {
    return s;
  }

  for (let i = 0; i < line.operands.length - 1; i++)
    s += line.operands[i].name.trim() + ', ';

  if (line.operands.length > 0)
    s += line.operands[line.operands.length - 1].name.trim();

  return s;
}
