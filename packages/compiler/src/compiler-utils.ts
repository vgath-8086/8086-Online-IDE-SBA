// Shared numeric parsing utilities used by syntax validators, encoder context, and linkage.

/** Parses 8086 numeric literals (hex/bin/octal/decimal) to an unsigned integer. */
export function parseUnsignedLiteral(str: string): number {
  if (/0x|0[A-F][A-Za-z0-9]*h|\d[A-Za-z0-9]*h/i.test(str))
    return parseInt(str.replace(/0x|h/gi, '').toUpperCase(), 16);
  if (/[0-1]b/i.test(str))
    return parseInt(str.replace(/b/gi, ''), 2);
  if (/0o/i.test(str))
    return parseInt(str.replace(/0o/gi, '').toUpperCase(), 8);
  return parseInt(str, 10);
}

/** Like parseUnsignedLiteral but folds two's-complement negation for negative operands. */
export function parseNumericLiteral(str: string | number): number {
  if (typeof str === 'number') return str;
  if (/\-/.test(str)) {
    const str3 = str.replace(/\-/, '');
    const binary = parseUnsignedLiteral(str3);
    return binary <= 128 ? ((~binary) & 0xff) + 1 : ((~binary) & 0xffff) + 1;
  }
  return parseUnsignedLiteral(str);
}

/** Extracts the numeric displacement from a memory operand string, e.g. `[BX+4]` → 4. */
export function extractDisplacement(str: string): number {
  const x = str.match(/(?<=(\+|\-|\[))(0x\w+|0[A-F]\w*h|\d\w*h|\d+|[01]+b)(?=(\+|\]))/i);
  if (x !== null) {
    if (/\-/.test(str)) x[0] = '-' + x[0];
    return parseNumericLiteral(x[0]);
  }
  return 0;
}

/** True if value fits unsigned in 16 bits (≤ 65535). */
export function fitsInWord(str: string | number): boolean {
  if (typeof str === 'number') return str <= 65535;
  return /\-/.test(str)
    ? parseUnsignedLiteral(str.replace(/\-/, '')) <= 32768
    : parseUnsignedLiteral(str) <= 65535;
}

/** True if value fits unsigned in 8 bits (≤ 255). */
export function fitsInByte(str: string): boolean {
  return parseNumericLiteral(str) <= 255;
}
