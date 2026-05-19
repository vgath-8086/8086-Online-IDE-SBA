import type { LexicalLine } from '../types.js';

export function deepCopy(rows: LexicalLine[]): LexicalLine[] {
  return rows.map(row => ({ ...row, operands: row.operands.map(op => ({ ...op })) }));
}
