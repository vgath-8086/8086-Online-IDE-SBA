import type { ISyntaxValidator } from '../interfaces/i-syntax-validator.js';
import type { LexicalLine, SyntaxResult } from '../types.js';

export class SyntaxValidatorRegistry {
  private readonly validators: ISyntaxValidator[] = [];

  register(v: ISyntaxValidator): this {
    this.validators.push(v);
    return this;
  }

  validate(line: LexicalLine): SyntaxResult {
    const name = line.instName ?? '';
    for (const v of this.validators) {
      if (v.matches(name)) return v.validate(line);
    }
    return { message: null, good: true };
  }
}
