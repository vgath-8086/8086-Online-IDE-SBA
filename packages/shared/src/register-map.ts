/**
 * Maps every 8086 register name (lowercase) to its 3-bit ModRM field ID.
 * Used by the compiler encoder to convert operand strings to register codes.
 *
 * Groupings reflect the ModRM reg/rm encoding table:
 *   0 → AX / AL / ES
 *   1 → CX / CL / CS
 *   2 → DX / DL / SS
 *   3 → BX / BL / DS
 *   4 → SP / AH
 *   5 → BP / CH
 *   6 → SI / DH
 *   7 → DI / BH
 */
export const REGISTER_NAME_TO_ID: Readonly<Record<string, number>> = {
  al: 0, ax: 0, es: 0,
  cl: 1, cx: 1, cs: 1,
  dl: 2, dx: 2, ss: 2,
  bl: 3, bx: 3, ds: 3,
  sp: 4, ah: 4,
  bp: 5, ch: 5,
  si: 6, dh: 6,
  di: 7, bh: 7,
};
