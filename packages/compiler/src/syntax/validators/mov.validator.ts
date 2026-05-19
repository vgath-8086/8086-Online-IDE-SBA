import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { OPS_COMBINATIONS }                              from '@emu8086/shared';
import { extractDisplacement, fitsInWord, parseNumericLiteral } from '../../compiler-utils.js';
import { CompilerErrorCode } from '../../error-codes.js';

export class MovValidator implements ISyntaxValidator {
  matches(name: string): boolean { return name === 'MOV'; }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length < 2)
      return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };

    const type1 = Obj.operands[0].type;
    const type2 = Obj.operands[1].type;
    const comp  = type1 + ' ' + type2;

    let exist = false;
    for (const group of OPS_COMBINATIONS) {
      if (group.includes(comp)) { exist = true; break; }
    }

    const memIdx = /M/.test(type1) ? 0 : /M/.test(type2) ? 1 : -1;
    if (memIdx !== -1 && !fitsInWord(extractDisplacement(Obj.operands[memIdx].name)))
      return { message: CompilerErrorCode.DISPLACEMENT_OVERFLOW, good: false };

    if (!exist) {
      if (type2 === 'INT') {
        if (!fitsInWord(Obj.operands[1].name))
          return { message: CompilerErrorCode.NUMBER_OVERFLOW, good: false };
        const fits = parseNumericLiteral(Obj.operands[1].name) <= 255;
        if (/RL|MB|VAR8|VARU/.test(type1))
          return fits ? { message: null, good: true } : { message: CompilerErrorCode.UNMATCHED_OPERAND_SIZE, good: false };
        if (/RX|MW|VAR16|VARU/.test(type1))
          return { message: null, good: true };
        if (/MU/.test(type1))
          return { message: CompilerErrorCode.AMBIGUOUS_MEMORY_SIZE, good: false };
        return { message: CompilerErrorCode.WRONG_OPERANDS, good: false };
      }
      if (type2 === 'LBL')
        return /RX|MW|MU/.test(type1)
          ? { message: null, good: true }
          : { message: CompilerErrorCode.WRONG_OPERANDS, good: false };
      return { message: CompilerErrorCode.ILLEGAL_OPERANDS_OR_SIZE_MISMATCH, good: false };
    }
    return { message: null, good: true };
  }
}
