import type { ILexicalAnalyser } from '../interfaces/i-lexical-analyser.js';
import type { IPreProcessor }    from '../interfaces/i-preprocessor.js';
import { WithPreprocessor }      from './with-preprocessor.js';

export class WithLexer {
  constructor(private readonly lexer: ILexicalAnalyser) {}

  pipe(preprocessor: IPreProcessor): WithPreprocessor {
    return new WithPreprocessor(this.lexer, preprocessor);
  }
}
