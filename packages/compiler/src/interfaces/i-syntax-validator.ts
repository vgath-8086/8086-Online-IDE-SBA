import type { LexicalLine, SyntaxResult } from '../types.js';

export interface ISyntaxValidator {
  matches(instName: string): boolean;
  validate(line: LexicalLine): SyntaxResult;
}
