import { createLexer }          from './lexical/index.js';
import { createPreprocessor }   from './preprocessor/index.js';
import { createSyntaxAnalysis } from './syntax/index.js';
import { createLinker }         from './linker/index.js';
import { createPipeline, CompilerPipeline } from './pipeline/index.js';

export { CompilerPipeline, createPipeline }        from './pipeline/index.js';
export { LexicalAnalysis }                         from './lexical/index.js';
export { PreProcessor }                            from './preprocessor/index.js';
export { SyntaxAnalysis }                          from './syntax/index.js';
export { Linkage, generateVariable, reformInstruction } from './linker/index.js';
export { assembleInstruction, createEncoder }       from './encoder/asm-encoder.js';
export type { CompilerResult }                     from './types.js';
export { CompilerErrorCode }                       from './error-codes.js';

export function createCompiler(): CompilerPipeline {
  return createPipeline(createLexer())
    .pipe(createPreprocessor())
    .pipe(createSyntaxAnalysis())
    .pipe(createLinker());
}
