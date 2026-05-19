import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { fitsInWord } from '../../compiler-utils.js';
import { CompilerErrorCode } from '../../error-codes.js';

export class JmpCallValidator implements ISyntaxValidator {
  matches(name: string): boolean { return name === 'JMP' || name === 'CALL'; }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length >= 2)
      return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };

    if (Obj.operands.length === 0)
      return Obj.instName === 'JMP'
        ? { message: null, good: true }
        : { message: CompilerErrorCode.WRONG_PARAMETER_TYPE, good: false };

    const op = Obj.operands[0];

    if (op.type === 'INT')
      return fitsInWord(op.name)
        ? { message: null, good: true }
        : { message: CompilerErrorCode.OUT_OF_BOUND_OPERAND, good: false };

    if (op.type === 'LBL' || op.type === 'OFF')
      return { message: null, good: true };

    if (op.type === 'DIS') {
      const num1 = op.name.match(/\w+(?=\s*\:)/);
      const num2 = op.name.match(/(?<=\:\s*)\w+/);
      return num1 !== null && num2 !== null && fitsInWord(num1[0].trim()) && fitsInWord(num2[0].trim())
        ? { message: null, good: true }
        : { message: CompilerErrorCode.OUT_OF_BOUND_OPERAND, good: false };
    }

    return { message: CompilerErrorCode.INVALID_OPERAND, good: false };
  }
}
