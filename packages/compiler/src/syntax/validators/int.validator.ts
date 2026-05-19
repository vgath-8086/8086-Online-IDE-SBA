import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { fitsInWord, parseNumericLiteral } from '../../compiler-utils.js';
import { CompilerErrorCode } from '../../error-codes.js';

export class IntValidator implements ISyntaxValidator {
  matches(name: string): boolean { return name === 'INT'; }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length !== 1)
      return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };
    if (Obj.operands[0].type !== 'INT')
      return { message: CompilerErrorCode.WRONG_PARAMETER_TYPE, good: false };
    return fitsInWord(Obj.operands[0].name) && parseNumericLiteral(Obj.operands[0].name) <= 255
      ? { message: null, good: true }
      : { message: CompilerErrorCode.NUMBER_OVERFLOW, good: false };
  }
}
