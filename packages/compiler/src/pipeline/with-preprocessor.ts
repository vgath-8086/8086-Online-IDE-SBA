import type { ILexicalAnalyser } from '../interfaces/i-lexical-analyser.js';
import type { IPreProcessor }    from '../interfaces/i-preprocessor.js';
import type { ISyntaxAnalyser }  from '../interfaces/i-syntax-analyser.js';
import { WithSyntax }            from './with-syntax.js';

export class WithPreprocessor {
  constructor(
    private readonly lexer:        ILexicalAnalyser,
    private readonly preprocessor: IPreProcessor,
  ) {}

  pipe(syntax: ISyntaxAnalyser): WithSyntax {
    return new WithSyntax(this.lexer, this.preprocessor, syntax);
  }
}
