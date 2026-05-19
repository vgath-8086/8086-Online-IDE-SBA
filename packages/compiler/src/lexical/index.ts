import { MemoryValidator }   from './memory-validator.js';
import { OperandClassifier }  from './operand-classifier.js';
import { LexicalAnalysis }    from './lexical-analysis.js';
import type { ILexicalAnalyser } from '../interfaces/i-lexical-analyser.js';

export function createLexer(): ILexicalAnalyser {
  const memValidator = new MemoryValidator();
  return new LexicalAnalysis(new OperandClassifier(memValidator), memValidator);
}

export { LexicalAnalysis } from './lexical-analysis.js';
