import { describe, it, expect, beforeEach } from 'vitest';
import { createLexer }          from '../../lexical/index.js';
import { createSyntaxAnalysis } from '../index.js';
import type { ILexicalAnalyser } from '../../interfaces/i-lexical-analyser.js';
import type { SyntaxAnalysis }   from '../syntax-analysis.js';

// Helper: lex a source string and return the LexicalLine array
function lexLines(lexer: ILexicalAnalyser, src: string) {
  return lexer.analyse(src).lexicalView;
}

describe('SyntaxAnalysis', () => {
  let lexer: ILexicalAnalyser;
  let syntax: SyntaxAnalysis;

  beforeEach(() => {
    lexer  = createLexer();
    syntax = createSyntaxAnalysis();
  });

  describe('valid instructions', () => {
    it('accepts MOV AX,BX', () => {
      const result = syntax.analyse(lexLines(lexer, 'MOV AX,BX'));
      expect(result.good).toBe(true);
    });

    it('accepts ADD AX,5', () => {
      expect(syntax.analyse(lexLines(lexer, 'ADD AX,5')).good).toBe(true);
    });

    it('accepts SUB AX,BX', () => {
      expect(syntax.analyse(lexLines(lexer, 'SUB AX,BX')).good).toBe(true);
    });

    it('accepts CMP AX,BX', () => {
      expect(syntax.analyse(lexLines(lexer, 'CMP AX,BX')).good).toBe(true);
    });

    it('accepts PUSH AX', () => {
      expect(syntax.analyse(lexLines(lexer, 'PUSH AX')).good).toBe(true);
    });

    it('accepts POP AX', () => {
      expect(syntax.analyse(lexLines(lexer, 'POP AX')).good).toBe(true);
    });

    it('accepts JMP label', () => {
      expect(syntax.analyse(lexLines(lexer, 'JMP 5')).good).toBe(true);
    });

    it('accepts a multi-instruction program', () => {
      const src = 'MOV AX,1\nMOV BX,2\nADD AX,BX\nSUB AX,BX';
      const result = syntax.analyse(lexLines(lexer, src));
      expect(result.good).toBe(true);
    });
  });

  describe('invalid syntax', () => {
    it('rejects MOV with wrong operand count', () => {
      // MOV with only one operand is invalid
      const result = syntax.analyse(lexLines(lexer, 'MOV AX'));
      expect(result.good).toBe(false);
    });

    it('reports the index of the bad line in a multi-line program', () => {
      const src = 'MOV AX,BX\nMOV AX'; // second line is bad
      const result = syntax.analyse(lexLines(lexer, src));
      expect(result.good).toBe(false);
      expect(result.index).toBe(1);
    });
  });

  describe('non-instruction lines are skipped', () => {
    it('passes when program only has variable declarations', () => {
      const result = syntax.analyse(lexLines(lexer, 'x DW 5'));
      expect(result.good).toBe(true);
    });

    it('does not flag blank lines', () => {
      const src = '\nMOV AX,BX\n\nADD AX,1';
      expect(syntax.analyse(lexLines(lexer, src)).good).toBe(true);
    });
  });
});
