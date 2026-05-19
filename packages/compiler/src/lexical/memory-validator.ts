import { countOccurrences, isNumericToken } from './memory-validator-utils.js';

const BRACKET_REGISTERS = ['BX', 'BP', 'SI', 'DI'];

export class MemoryValidator {
  isValid(str: string): boolean {
    const matchBefore = str.match(/.*(?=\[)/);
    let prefix = matchBefore ? matchBefore[0].trim() : ' ';
    prefix = prefix.replace(/(?<=\w)\s*(?=\[)/, '');
    prefix = prefix.replace(/(?<=\w)\s+(?=(es|ss|ds|cs))/i, ' ');

    switch (prefix.toUpperCase()) {
      case 'WORD': case 'BYTE': case 'W.': case 'B.': case '':
      case 'ES:': case 'BYTE ES:': case 'WORD ES:':
      case 'DS:': case 'BYTE DS:': case 'WORD DS:':
      case 'CS:': case 'BYTE CS:': case 'WORD CS:':
      case 'SS:': case 'BYTE SS:': case 'WORD SS:': {
        if (!/\]$/.test(str)) return false;

        let inner = str.replace(/.*\[/i, '').replace(/\]/i, '').trim();
        for (let i = 0; i < inner.length; i++) {
          if (inner[i] === '-' && i !== 0) {
            inner = inner.substring(0, i) + '+' + inner.substring(i);
            i++;
          }
        }

        const parts = /\+/.test(inner) ? inner.split(/\+/) : [inner];
        if (parts.includes('')) return false;

        const regs: string[] = [];
        for (const part of parts) {
          const p = part.trim();
          if (BRACKET_REGISTERS.includes(p.toUpperCase())) regs.push(p.toUpperCase());
          else if (!BRACKET_REGISTERS.includes(p.toUpperCase()) && !isNumericToken(p)) return false;
        }

        if (regs.includes('SI') && regs.includes('DI')) return false;
        if (regs.includes('BP') && regs.includes('BX')) return false;
        if (countOccurrences('BX', regs) > 1) return false;
        if (countOccurrences('SI', regs) > 1) return false;
        if (countOccurrences('DI', regs) > 1) return false;
        if (countOccurrences('BP', regs) > 1) return false;

        return true;
      }
      default:
        return false;
    }
  }
}
