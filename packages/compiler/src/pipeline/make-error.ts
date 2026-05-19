import type { CompilerResult }   from '../types.js';
import type { CompilerErrorCode } from '../error-codes.js';

export function makeError(errorLine: number | null, message: CompilerErrorCode | null | ''): CompilerResult {
  return {
    status: false, origin: null,
    message: message ?? '',
    errorLine,
    finalView:  null,
    varArray:   null,
    labelArray: null,
  };
}
