import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { OPS_COMBINATIONS }                              from '@emu8086/shared';
import { extractDisplacement, fitsInWord }                from '../../compiler-utils.js';
import { CompilerErrorCode } from '../../error-codes.js';

export class XchgValidator implements ISyntaxValidator {
  matches(name: string): boolean { return name === 'XCHG'; }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length < 2)
      return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };

    const comp = Obj.operands[0].type + ' ' + Obj.operands[1].type;

    let exist = false;
    for (let i = 0; i < 3; i++) {
      if (OPS_COMBINATIONS[i].includes(comp)) { exist = true; break; }
    }

    if (/M/.test(Obj.operands[0].type) && !fitsInWord(extractDisplacement(Obj.operands[0].name)))
      return { message: CompilerErrorCode.DISPLACEMENT_OVERFLOW, good: false };

    return exist
      ? { message: null, good: true }
      : { message: CompilerErrorCode.UNMATCHED_OPERAND_SIZE, good: false };
  }
}
