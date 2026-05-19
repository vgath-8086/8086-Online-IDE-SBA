import type { ISyntaxValidator } from '../../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../../types.js';
import { CompilerErrorCode } from '../../error-codes.js';

const NOOPS = [
  'RET', 'MOVSB', 'CMPSB', 'SCASB', 'LODSB', 'STOSB',
  'MOVSW', 'CMPSW', 'SAHF', 'SCASW', 'LODSW', 'STOSW',
  'CBW', 'CLC', 'CLD', 'CLI', 'CMC', 'STC', 'STD', 'STI',
  'CWD', 'HLT', 'LAHF', 'PUSHF', 'POPF',
];

export class NoopValidator implements ISyntaxValidator {
  matches(name: string): boolean { return NOOPS.includes(name); }

  validate(Obj: LexicalLine): SyntaxResult {
    return Obj.operands.length === 0
      ? { message: null, good: true }
      : { message: CompilerErrorCode.ILLEGAL_PARAMETER_COUNT, good: false };
  }
}
