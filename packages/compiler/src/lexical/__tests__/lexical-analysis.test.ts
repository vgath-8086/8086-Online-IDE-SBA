import { describe, it, expect, beforeEach } from 'vitest';
import { createLexer } from '../index.js';
import type { ILexicalAnalyser } from '../../interfaces/i-lexical-analyser.js';

describe('LexicalAnalysis', () => {
  let lexer: ILexicalAnalyser;

  beforeEach(() => { lexer = createLexer(); });

  describe('simple instruction lines', () => {
    it('parses MOV AX,BX as an INST expression', () => {
      const result = lexer.analyse('MOV AX,BX');
      expect(result.status).toBe(true);
      const line = result.lexicalView[0];
      expect(line.expressionType).toBe('INST');
      expect(line.instName).toBe('MOV');
    });

    it('parses ADD AX,5 correctly', () => {
      const result = lexer.analyse('ADD AX,5');
      expect(result.status).toBe(true);
      const line = result.lexicalView[0];
      expect(line.instName).toBe('ADD');
      expect(line.operands.length).toBeGreaterThan(0);
    });

    it('parses PUSH AX', () => {
      const result = lexer.analyse('PUSH AX');
      const line = result.lexicalView[0];
      expect(line.instName).toBe('PUSH');
    });
  });

  describe('labels', () => {
    it('extracts label from a labelled instruction', () => {
      const result = lexer.analyse('start: MOV AX,0');
      expect(result.status).toBe(true);
      const line = result.lexicalView[0];
      expect(line.label).toContain('start');
      expect(line.instName).toBe('MOV');
    });
  });

  describe('multi-line input', () => {
    it('parses multiple lines', () => {
      const src = 'MOV AX,1\nMOV BX,2\nADD AX,BX';
      const result = lexer.analyse(src);
      expect(result.status).toBe(true);
      expect(result.lexicalView).toHaveLength(3);
      expect(result.lexicalView[0].instName).toBe('MOV');
      expect(result.lexicalView[1].instName).toBe('MOV');
      expect(result.lexicalView[2].instName).toBe('ADD');
    });

    it('assigns sequential line indices', () => {
      const src = 'MOV AX,1\nADD AX,2';
      const result = lexer.analyse(src);
      expect(result.lexicalView[0].index).toBe(0);
      expect(result.lexicalView[1].index).toBe(1);
    });
  });

  describe('comments', () => {
    it('strips inline ; comments before parsing', () => {
      const result = lexer.analyse('MOV AX,5 ; set AX to 5');
      expect(result.status).toBe(true);
      const line = result.lexicalView[0];
      expect(line.instName).toBe('MOV');
    });
  });

  describe('empty and blank lines', () => {
    it('handles empty string without error', () => {
      const result = lexer.analyse('');
      expect(result.status).toBe(true);
    });

    it('handles blank lines in a program', () => {
      const result = lexer.analyse('MOV AX,1\n\nADD AX,2');
      expect(result.status).toBe(true);
      expect(result.lexicalView).toHaveLength(3);
    });
  });

  describe('variable declarations', () => {
    it('parses a DEFINE word variable', () => {
      const result = lexer.analyse('myVar DW 5');
      expect(result.status).toBe(true);
      const line = result.lexicalView[0];
      expect(line.expressionType).toBe('VAR');
      expect(line.variableName).toBe('MYVAR'); // lexer uppercases identifiers
    });
  });
});
