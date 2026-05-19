// 8086 register name string constants shared by the compiler (lexical analysis)
// and the web app (syntax highlighting).

/** All 16-bit registers, including segment registers. */
export const WORD_REGISTERS:    readonly string[] = ['AX', 'BX', 'CX', 'DX', 'CS', 'DS', 'ES', 'SS', 'DI', 'SI', 'SP', 'BP', 'IP'];

/** 8-bit (high/low byte) registers. */
export const BYTE_REGISTERS:    readonly string[] = ['AH', 'AL', 'BH', 'BL', 'CH', 'CL', 'DL', 'DH'];

/** Segment registers only. */
export const SEGMENT_REGISTERS: readonly string[] = ['CS', 'DS', 'ES', 'SS'];

/** Union of all named registers — useful for "is this token a register?" checks. */
export const ALL_REGISTERS:     readonly string[] = [...WORD_REGISTERS, ...BYTE_REGISTERS];
