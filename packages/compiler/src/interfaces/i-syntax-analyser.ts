import type { LexicalLine, AnalysisResult } from '../types.js';

export interface ISyntaxAnalyser {
  analyse(lexicalView: LexicalLine[]): AnalysisResult;
}
