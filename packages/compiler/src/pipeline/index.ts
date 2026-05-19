import type { ILexicalAnalyser } from '../interfaces/i-lexical-analyser.js';
import { WithLexer }             from './with-lexer.js';

export { CompilerPipeline } from './compiler-pipeline.js';

export function createPipeline(lexer: ILexicalAnalyser): WithLexer {
  return new WithLexer(lexer);
}
