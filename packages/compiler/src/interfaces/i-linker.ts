import type { LexicalLine, VariableEntry, LabelEntry, FinalViewLine, PostLinkState } from '../types.js';

export interface ILinker {
  link(
    lexicalView: LexicalLine[],
    varArray: VariableEntry[],
    labelArray: LabelEntry[],
    origin: number,
  ): FinalViewLine[];
  verify(finalView: FinalViewLine[]): PostLinkState;
}
