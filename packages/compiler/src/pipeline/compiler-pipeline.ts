import type { ILexicalAnalyser } from '../interfaces/i-lexical-analyser.js';
import type { IPreProcessor }    from '../interfaces/i-preprocessor.js';
import type { ISyntaxAnalyser }  from '../interfaces/i-syntax-analyser.js';
import type { ILinker }          from '../interfaces/i-linker.js';
import type { CompilerResult }   from '../types.js';
import { makeError }             from './make-error.js';

export class CompilerPipeline {
  constructor(
    private readonly lexer:        ILexicalAnalyser,
    private readonly preprocessor: IPreProcessor,
    private readonly syntax:       ISyntaxAnalyser,
    private readonly linker:       ILinker,
  ) {}

  compile(source: string): CompilerResult {
    const lex = this.lexer.analyse(source);
    if (!lex.status) {
      const errIdx = lex.lexicalView.length - 1;
      return makeError(errIdx, lex.lexicalView[errIdx].message);
    }

    const prep = this.preprocessor.process(lex.lexicalView);
    if (!prep.status) return makeError(prep.errorLine, prep.message);

    const synt = this.syntax.analyse(prep.lexicalView);
    if (!synt.good) return makeError(synt.index, synt.message);

    const finalView = this.linker.link(
      prep.lexicalView, prep.varArray, prep.labelArray, prep.origin,
    );
    const postLink = this.linker.verify(finalView);
    if (!postLink.good) return makeError(postLink.errorLine, postLink.message);

    return {
      status:    true,
      origin:    prep.origin,
      message:   '',
      errorLine: null,
      finalView,
      varArray:  prep.varArray,
      labelArray: prep.labelArray,
    };
  }
}
