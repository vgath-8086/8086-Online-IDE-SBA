import type { LexicalLine, PreProcessorResult } from '../types.js';

export interface IPreProcessor {
  process(lexicalView: LexicalLine[]): PreProcessorResult;
}
