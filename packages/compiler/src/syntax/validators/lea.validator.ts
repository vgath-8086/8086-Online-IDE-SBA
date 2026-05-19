import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { extractDisplacement, fitsInWord } from '../../compiler-utils.js';
import { CompilerErrorCode } from '../../error-codes.js';

const VALID_PAIRS = ['RX MU', 'RX MB', 'RX MW', 'RX VAR8', 'RX VAR16', 'RX VARU'];

export class LeaValidator implements ISyntaxValidator {
  matches(name: string): boolean { return name === 'LEA'; }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length < 2)
      return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };

    const comp = Obj.operands[0].type + ' ' + Obj.operands[1].type;

    if (/M/.test(Obj.operands[1].type) && !fitsInWord(extractDisplacement(Obj.operands[1].name)))
      return { message: CompilerErrorCode.DISPLACEMENT_OVERFLOW, good: false };

    return VALID_PAIRS.includes(comp)
      ? { message: null, good: true }
      : { message: CompilerErrorCode.UNMATCHED_OPERAND_SIZE, good: false };
  }
}
