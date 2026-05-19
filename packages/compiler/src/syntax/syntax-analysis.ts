import type { LexicalLine, SyntaxResult, AnalysisResult } from '../types.js';
import { SyntaxValidatorRegistry } from './syntax-validator-registry.js';

export class SyntaxAnalysis {
  constructor(private readonly registry: SyntaxValidatorRegistry) {}

  analyse(arr: LexicalLine[]): AnalysisResult {
    let temp: SyntaxResult = { good: true, message: null };
    let index = 0;
    for (index = 0; index < arr.length; index++) {
      const element = arr[index];
      if (element.expressionType === 'INST') {
        temp = this.excute(element);
        if (!temp.good) { index++; break; }
      }
    }
    index--;
    return { message: temp.message, good: temp.good, index: arr[index]?.index ?? null };
  }

  excute(Obj: LexicalLine): SyntaxResult {
    if (Obj.expressionType === 'VAR' || Obj.instructionType === 'prePropIns')
      return { message: null, good: true };
    return this.registry.validate(Obj);
  }
}
