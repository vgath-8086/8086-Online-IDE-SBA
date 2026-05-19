import type { LexicalAnalysisResult } from '../types.js';

export interface ILexicalAnalyser {
  analyse(code: string): LexicalAnalysisResult;
}
