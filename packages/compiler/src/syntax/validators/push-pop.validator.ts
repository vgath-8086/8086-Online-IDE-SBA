import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { extractDisplacement, fitsInWord } from '../../compiler-utils.js';
import { CompilerErrorCode } from '../../error-codes.js';

export class PushPopValidator implements ISyntaxValidator {
  matches(name: string): boolean { return name === 'PUSH' || name === 'POP'; }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length !== 1)
      return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };

    const type = Obj.operands[0].type;

    if (/M/.test(type) && !fitsInWord(extractDisplacement(Obj.operands[0].name)))
      return { message: CompilerErrorCode.DISPLACEMENT_OVERFLOW, good: false };

    if (Obj.instName === 'PUSH') {
      switch (type) {
        case 'RX': case 'RS': case 'MW': case 'MU':
        case 'VAR16': case 'LBL': case 'OFF': case 'VARU':
          return { message: null, good: true };
        case 'INT':
          return fitsInWord(Obj.operands[0].name)
            ? { message: null, good: true }
            : { message: CompilerErrorCode.NUMBER_OVERFLOW, good: false };
        default:
          return { message: CompilerErrorCode.ILLEGAL_PARAMETERS, good: false };
      }
    }

    // POP
    switch (type) {
      case 'RX': case 'RS': case 'MW': case 'MU': case 'VAR16': case 'VARU':
        return { message: null, good: true };
      default:
        return { message: CompilerErrorCode.ILLEGAL_PARAMETERS, good: false };
    }
  }
}
