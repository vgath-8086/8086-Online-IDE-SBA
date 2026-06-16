// Register identifiers (indices into the Registers.R array)
export const AX_REG   = 0;
export const BX_REG   = 1;
export const CX_REG   = 2;
export const DX_REG   = 3;
export const CS_REG   = 4;
export const DS_REG   = 5;
export const ES_REG   = 6;
export const SS_REG   = 7;
export const SP_REG   = 8;
export const BP_REG   = 9;
export const DI_REG   = 10;
export const SI_REG   = 11;
export const FLAG_REG = 12;
export const IP_REG   = 13;

// Register-type identifiers used by the typed read/write helpers
export const ALL_REGISTER     = 0;
export const BYTE_REGISTER    = 1;
export const WORD_NS_REGISTER = 2;
export const SEGMENT_REGISTER = 3;

// Segment register encoding → physical register index
export const SEGMENT_REGISTERS_TABLE = [ES_REG, CS_REG, SS_REG, DS_REG];

// Word-register encoding (mod-r/m field) → physical register index
export const WORD_REGISTERS_TABLE = [
  AX_REG, CX_REG, DX_REG, BX_REG,
  SP_REG, BP_REG, SI_REG, DI_REG,
];

// Console key-type constants
export const XL = 0;
export const XH = 1;
export const XX = 2;

// CGA color palette
export const COLOR_TABLE = [
  'black', 'blue', 'green', 'cyan',
  'red', 'magenta', 'brown', 'lightgray',
  'darkgray', 'lightblue', 'lightgreen', 'lightcyan',
  '#fffcccb', '#ff80ff', 'yellow', 'white',
];

// Standard DOS/CGA text mode page size. getDisplayChars() returns a flat,
// row-major array against this stride — every renderer (web canvas, CLI) must
// wrap rows at this width, not at whatever container size happens to be.
export const CONSOLE_COLS = 80;
export const CONSOLE_ROWS = 25;
