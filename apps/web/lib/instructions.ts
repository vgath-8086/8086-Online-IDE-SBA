export interface InstructionGroup {
  category: string;
  instructions: string[];
}

const JCC_VARIANTS = [
  'JE', 'JNE', 'JG', 'JGE', 'JL', 'JLE', 'JA', 'JAE',
  'JB', 'JBE', 'JS', 'JNS', 'JO', 'JNO', 'JP', 'JNP', 'JCXZ',
];

export const INSTRUCTION_GROUPS: InstructionGroup[] = [
  { category: 'Data Transfer', instructions: ['MOV', 'XCHG', 'LEA', 'PUSH', 'POP', 'PUSHF', 'POPF'] },
  { category: 'Arithmetic', instructions: ['ADD', 'SUB', 'MUL', 'DIV', 'NEG', 'INC', 'DEC', 'CMP'] },
  { category: 'Bitwise / Shift', instructions: ['AND', 'OR', 'XOR', 'NOT', 'TEST', 'SHL', 'SAL', 'SHR', 'SAR', 'ROL', 'ROR', 'RCL', 'RCR'] },
  { category: 'Control Flow', instructions: ['JMP', 'CALL', 'RET', 'LOOP', ...JCC_VARIANTS] },
  { category: 'String', instructions: ['MOVSB', 'MOVSW', 'LODSB', 'LODSW', 'STOSB', 'STOSW', 'CMPSB', 'CMPSW', 'SCASB', 'SCASW', 'REP', 'REPE', 'REPNE'] },
  { category: 'Flags', instructions: ['CLC', 'STC', 'CMC', 'CLD', 'STD'] },
  { category: 'Interrupt', instructions: ['INT (10h video / 21h DOS I/O)'] },
  { category: 'Segment Override', instructions: ['CS:', 'DS:', 'ES:', 'SS:'] },
];
