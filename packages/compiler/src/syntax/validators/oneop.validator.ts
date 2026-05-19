import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { extractDisplacement, fitsInWord } from '../../compiler-utils.js';
import { CompilerErrorCode } from '../../error-codes.js';

const ONEOP = ['INC', 'DEC', 'MUL', 'DIV', 'IDIV', 'IMUL', 'NEG', 'NOT'];

export class OneOpValidator implements ISyntaxValidator {
  matches(name: string): boolean { return ONEOP.includes(name); }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length !== 1)
      return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };

    const type = Obj.operands[0].type;

    if (/M/.test(type) && !fitsInWord(extractDisplacement(Obj.operands[0].name)))
      return { message: CompilerErrorCode.DISPLACEMENT_OVERFLOW, good: false };
    if (/MB|MW|RL|RX|VAR16|VAR8|VARU/.test(type))
      return { message: null, good: true };
    if (/MU/.test(type))
      return { message: CompilerErrorCode.AMBIGUOUS_MEMORY_SIZE, good: false };
    return { message: CompilerErrorCode.ILLEGAL_PARAMETERS, good: false };
  }
}
