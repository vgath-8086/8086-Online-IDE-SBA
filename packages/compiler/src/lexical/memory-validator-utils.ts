/** Counts how many times `str` appears in `arr`. */
export function countOccurrences(str: string, arr: string[]): number {
  return arr.filter(x => x === str).length;
}

/** True if str matches any 8086 numeric literal form (hex/bin/decimal/negative). */
export function isNumericToken(str: string): boolean {
  return /^0x[a-f0-9]+$|^0[A-F][A-Fa-f0-9]*h$|^\d+[A-Fa-f0-9]*h$|^[0-1]+(b$)|^\d+$/i.test(str)
    || /^-?\d+$/.test(str);
}
