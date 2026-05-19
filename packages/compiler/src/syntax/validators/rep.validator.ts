import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { CompilerErrorCode } from '../../error-codes.js';

export class RepValidator implements ISyntaxValidator {
  matches(name: string): boolean { return name === 'REP' || name === 'REPE' || name === 'REPNE'; }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length !== 1)
      return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };
    return Obj.operands[0].type === 'INS'
      ? { message: null, good: true }
      : { message: CompilerErrorCode.WRONG_PARAMETER_TYPE, good: false };
  }
}
