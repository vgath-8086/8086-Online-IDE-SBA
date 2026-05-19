import { StreamLanguage } from '@codemirror/language';
import type { StringStream } from '@codemirror/language';
import { INSTRUCTIONS as INSTRUCTION_LIST, ALL_REGISTERS } from '@emu8086/shared';

const INSTRUCTIONS = new Set(INSTRUCTION_LIST);
const REGISTERS    = new Set(ALL_REGISTERS);

function token(stream: StringStream): string | null {
  if (stream.eatSpace()) return null;
  if (stream.eat(';')) { stream.skipToEnd(); return 'comment'; }
  if (stream.match(/0[xX][0-9a-fA-F]+/)) return 'number';
  if (stream.match(/[0-9][0-9a-fA-F]*[hH]/)) return 'number';
  if (stream.match(/[01]+[bB]/)) return 'number';
  if (stream.match(/[0-9]+/)) return 'number';
  if (stream.match(/["'].*?["']/)) return 'string';
  if (stream.match(/[a-zA-Z_][a-zA-Z0-9_]*/)) {
    const word = stream.current().toUpperCase();
    if (INSTRUCTIONS.has(word)) return 'keyword';
    if (REGISTERS.has(word)) return 'atom';
    return 'variable';
  }
  stream.next();
  return null;
}

export const asm8086Language = StreamLanguage.define({ token });
