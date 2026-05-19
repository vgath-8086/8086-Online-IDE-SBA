import type { ILexicalAnalyser } from '../interfaces/i-lexical-analyser.js';
import type { IPreProcessor }    from '../interfaces/i-preprocessor.js';
import type { ISyntaxAnalyser }  from '../interfaces/i-syntax-analyser.js';
import type { ILinker }          from '../interfaces/i-linker.js';
import { CompilerPipeline }      from './compiler-pipeline.js';

export class WithSyntax {
  constructor(
    private readonly lexer:        ILexicalAnalyser,
    private readonly preprocessor: IPreProcessor,
    private readonly syntax:       ISyntaxAnalyser,
  ) {}

  pipe(linker: ILinker): CompilerPipeline {
    return new CompilerPipeline(this.lexer, this.preprocessor, this.syntax, linker);
  }
}
