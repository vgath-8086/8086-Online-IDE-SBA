import { parseUnsignedLiteral, parseNumericLiteral, extractDisplacement } from '../compiler-utils.js';
import { WORD_REGISTERS, BYTE_REGISTERS, SEGMENT_REGISTERS, REGISTER_NAME_TO_ID } from '@emu8086/shared';

export interface ParsedInstruction {
  operands: string[];
  s: number;
  w: number;
  v: number;
  d: number;
  mode: number;
  regmem: number;
  arr: number[];
}

export class EncoderContext {
  // Side-effecting state set by regMemField(), consumed by appendDisplacementBytes()
  justNumbers = false;
  zero        = false;

  // ── Numeric conversion ────────────────────────────────────────────────────

  /** Parses 8086 unsigned numeric literal. */
  parseUnsignedLiteral(str: string): number { return parseUnsignedLiteral(str); }
  /** Like parseUnsignedLiteral but handles two's-complement negation. */
  parseNumericLiteral(str: string | number): number { return parseNumericLiteral(str); }
  /** Extracts displacement value from a memory operand string. */
  extractDisplacement(str: string): number { return extractDisplacement(str); }

  /** 1 if value fits in a signed byte and can be sign-extended (s-bit), 0 otherwise. */
  signExtendFlag(str: string, i: number = 0): number {
    const num = i === 0 ? extractDisplacement(str) : parseNumericLiteral(str);
    return /\-/.test(str) ? (num > 255 ? 0 : 1) : (num > 127 ? 0 : 1);
  }

  // ── Operand parsing ───────────────────────────────────────────────────────

  /** Splits an instruction string into operand strings with inferred type tags appended. */
  parseOperands(str: string): string[] {
    let str2 = str.replace(/\w+(?=\s)/, '');
    str2 = str2.replace(/\s/g, '');
    const parts: string[] = /,/.test(str2) ? str2.split(',') : [str2];
    if (parts[0] !== '') {
      const n = parts.length;
      for (let i = 0; i < n; i++) {
        if      (/\[.*\]/.test(parts[i]))                            parts.push('M');
        else if (SEGMENT_REGISTERS.includes(parts[i].toUpperCase())) parts.push('RS');
        else if (WORD_REGISTERS.includes(parts[i].toUpperCase()))    parts.push('RX');
        else if (BYTE_REGISTERS.includes(parts[i].toUpperCase()))    parts.push('RL');
        else                                                         parts.push('I');
      }
    }
    return parts.map(x => x.toUpperCase());
  }

  /** 1 if reg is destination (d-bit), 0 if reg is source. */
  directionBit(operands: string[]): number {
    if (/M/.test(operands[2]) && /R/.test(operands[3])) return 0;
    if (/R/.test(operands[2])) return 1;
    return 0;
  }

  /** 1 if CL is the shift-count register (v-bit), 0 for immediate count. */
  shiftCountBit(operands: string[]): number {
    return /cl/i.test(operands[1]) ? 1 : 0;
  }

  /** 1 for word-size operand (w-bit), 0 for byte. */
  wordBit(operands: string[]): number {
    if (operands.length === 4) {
      if      (/R[XS]/.test(operands[2])) return 1;
      else if (/RL/.test(operands[2]))    return 0;
      else if (/R[XS]/.test(operands[3])) return 1;
      else if (/RL/.test(operands[3]))    return 0;
      const x = /M/.test(operands[2]) ? 0 : 1;
      if      (/WORD|W\./.test(operands[x])) return 1;
      else if (/BYTE|B\./.test(operands[x])) return 0;
      else return this.signExtendFlag(operands[x === 0 ? 1 : 0], 1) ? 0 : 1;
    }
    if (/R[XS]/.test(operands[1])) return 1;
    if (/RL/.test(operands[1]))    return 0;
    if      (/WORD|W\./.test(operands[0])) return 1;
    else if (/BYTE|B\./.test(operands[0])) return 0;
    else return this.signExtendFlag(operands[0], 1) ? 0 : 1;
  }

  /** Computes 2-bit mod field: 0=no disp, 1=byte disp, 2=word disp, 3=register. */
  modBits(operands: string[]): number {
    if (operands.length === 2) {
      if (/R/.test(operands[1])) return 3;
      if (/M/.test(operands[1])) {
        return this.signExtendFlag(operands[0], 0) === 0
          ? 2
          : parseNumericLiteral(extractDisplacement(operands[0])) !== 0 ? 1 : 0;
      }
    } else {
      if (/R|I/.test(operands[2]) && /R|I/.test(operands[3])) return 3;
      const x = /M/.test(operands[2]) ? 0 : 1;
      if (extractDisplacement(operands[x]) === 0) return 0;
      if (this.signExtendFlag(operands[x]) === 0) return 2;
      return 1;
    }
    return 0;
  }

  /** Maps a register name to its 3-bit ID for ModRM encoding. */
  registerToId(regname: string): number {
    return REGISTER_NAME_TO_ID[regname.toLowerCase()] ?? 0;
  }

  /** Computes the r/m field of ModRM; sets this.zero and this.justNumbers as side effects. */
  regMemField(ops: string[]): number {
    this.zero        = false;
    this.justNumbers = false;

    if (this.modBits(ops) === 3) {
      if (ops.length === 2) return this.registerToId(ops[0]);
      return /R/.test(ops[3]) ? this.registerToId(ops[1]) : this.registerToId(ops[0]);
    }

    const i = /\[/.test(ops[0]) ? 0 : (ops.length > 1 && /\[/.test(ops[1])) ? 1 : -1;
    if (i === -1) return 0;

    if      (/(bx|si)+.*(bx|si)/i.test(ops[i])) return 0;
    else if (/(bx|di)+.*(bx|di)/i.test(ops[i])) return 1;
    else if (/(bp|si)+.*(bp|si)/i.test(ops[i])) return 2;
    else if (/(bp|di)+.*(bp|di)/i.test(ops[i])) return 3;
    else if (/si/i.test(ops[i]))                 return 4;
    else if (/di/i.test(ops[i]))                 return 5;
    else if (/bp/i.test(ops[i]))                 return 6;
    else if (/bx/i.test(ops[i]))                 return 7;

    if (extractDisplacement(ops[i]) === 0) this.zero = true;
    this.justNumbers = true;
    return 0b110;
  }

  /** Splits a number into [lo] or [lo, hi]; applies sign-extension when s=1 and value fits in a byte. */
  splitToBytes(num: number, s: number = 1): number[] {
    if (num > 255) return [num & 0xFF, num >> 8];
    if (s === 0)   return [num, 0];
    return [num];
  }

  /** Appends a zero displacement byte when [BP] is used without an explicit offset. */
  appendBpDisplacement(operands: string[], arr: number[]): number[] {
    if (operands.length === 4) {
      const z = /M/.test(operands[2]) ? 0 : /M/.test(operands[3]) ? 1 : -1;
      if (z !== -1 && /\[BP\]/i.test(operands[z])) arr.push(0);
    } else if (/\[BP\]/i.test(operands[0])) {
      arr.push(0);
    }
    return arr;
  }

  /** Prepends segment-override prefix byte if operand uses ES:/DS:/SS:/CS:. */
  segmentOverridePrefix(operands: string[], arr: number[]): number[] {
    const x = operands.length === 4
      ? (/M/.test(operands[2]) ? 0 : /M/.test(operands[3]) ? 1 : -1)
      : (/M/.test(operands[1]) ? 0 : -1);
    if (x !== -1 && /S:/.test(operands[x])) {
      const y = operands[x][0] + operands[x][1];
      arr.unshift(38 + (this.registerToId(y) << 3));
    }
    return arr;
  }

  /** Appends computed displacement bytes to the encoding buffer. */
  appendDisplacementBytes(str: string, arr: number[]): number[] {
    const tmp = this.parseOperands(str);
    const z   = tmp.length === 4 ? (/M/.test(tmp[2]) ? 0 : 1) : 0;
    const num = parseNumericLiteral(extractDisplacement(tmp[z]));
    this.appendBpDisplacement(this.parseOperands(str), arr);
    if (this.zero) { arr.push(0); arr.push(0); return arr; }
    if (num === 0) return arr;
    const disp = this.splitToBytes(num, this.signExtendFlag(tmp[z]));
    arr = arr.concat(disp);
    if (this.justNumbers && this.signExtendFlag(tmp[z], 0) === 1) arr.push(0);
    return arr;
  }

  /** Always emits 2 bytes for a word immediate (explicit sign-extension byte). */
  emitWordImm(arr: number[], operand: string): void {
    const byte = this.splitToBytes(parseNumericLiteral(operand), this.signExtendFlag(operand, 1));
    arr.push(byte[0]);
    arr.push(byte.length === 2 ? byte[1] : (byte[0] & 0x80) !== 0 ? 255 : 0);
  }

  /** Facade: parse instruction string and compute all common ModRM fields at once. */
  parseInstruction(str: string): ParsedInstruction {
    const operands = this.parseOperands(str);
    const s        = this.signExtendFlag(operands[1], 1);
    const w        = this.wordBit(operands);
    const v        = this.shiftCountBit(operands);
    const d        = this.directionBit(operands);
    let   mode     = this.modBits(operands);
    const regmem   = this.regMemField(operands); // sets this.justNumbers / this.zero

    if (/\[BP\]/i.test(str)) mode = 1;
    if (this.justNumbers)    mode = 0;

    const arr = this.segmentOverridePrefix(operands, []);
    return { operands, s, w, v, d, mode, regmem, arr };
  }
}
