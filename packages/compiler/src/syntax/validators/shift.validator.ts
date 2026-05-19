import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { extractDisplacement, fitsInWord, parseNumericLiteral } from '../../compiler-utils.js';
import { CompilerErrorCode } from '../../error-codes.js';

const SHIFT = ['SHL', 'SAL', 'SHR', 'SAR', 'ROL', 'ROR', 'RCL', 'RCR'];

export class ShiftValidator implements ISyntaxValidator {
  matches(name: string): boolean { return SHIFT.includes(name); }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length < 2)
      return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };

    const type1 = Obj.operands[0].type;
    const type2 = Obj.operands[1].type;

    if (/MU/.test(type1))
      return { message: CompilerErrorCode.AMBIGUOUS_MEMORY_SIZE, good: false };

    if (!/RX|MB|MW|RL|VAR8|VAR16|VARU/.test(type1))
      return { message: CompilerErrorCode.ILLEGAL_PARAMETERS, good: false };

    if (type2 === 'RL' && Obj.operands[1].name === 'CL')
      return { message: null, good: true };

    if (/M/.test(type1) && !fitsInWord(extractDisplacement(Obj.operands[0].name)))
      return { message: CompilerErrorCode.DISPLACEMENT_OVERFLOW, good: false };

    if (type2 === 'INT' && fitsInWord(Obj.operands[1].name) && parseNumericLiteral(Obj.operands[1].name) <= 255)
      return { message: null, good: true };

    return { message: CompilerErrorCode.ILLEGAL_PARAMETERS, good: false };
  }
}
