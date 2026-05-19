import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { CompilerErrorCode } from '../../error-codes.js';

const COND_JUMPS = [
  'JC', 'JE', 'JNC', 'JZ', 'JL', 'JNGE', 'JLE', 'JNG',
  'JB', 'JNAE', 'JBE', 'JNA', 'JP', 'JPE', 'JO', 'JS',
  'JNE', 'JNZ', 'JNL', 'JGE', 'JNLE', 'JG', 'JNB', 'JAE',
  'JNBE', 'JA', 'JNP', 'JPO', 'JNO', 'JNS',
  'LOOP', 'LOOPZ', 'LOOPE', 'LOOPNZ', 'LOOPNE', 'JCXZ',
];

export class CondJmpValidator implements ISyntaxValidator {
  matches(name: string): boolean { return COND_JUMPS.includes(name); }

  validate(Obj: LexicalLine): SyntaxResult {
    if (Obj.operands.length === 1)
      return Obj.operands[0].type === 'LBL'
        ? { message: null, good: true }
        : { message: CompilerErrorCode.WRONG_PARAMETER_TYPE, good: false };
    if (Obj.operands.length === 0)
      return { message: CompilerErrorCode.REQUIRED_LABEL, good: false };
    return { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };
  }
}
