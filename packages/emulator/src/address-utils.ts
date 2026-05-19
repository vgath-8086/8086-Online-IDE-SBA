import { AddressParseError } from './error-codes.js';

/**
 * Parses a hex address string (plain hex or segment:offset notation) into
 * a 20-bit physical address.  Returns value=-1 on error with a typed code.
 *
 * This is pure 8086 addressing logic with no environment dependencies.
 */
export function parsePhysicalAddress(input: string): { value: number; message: AddressParseError | '' } {
    const str = input.trim();

    if (/^[a-f0-9]+$/i.test(str)) {
        const val = parseInt(str, 16);
        return val >> 20 === 0
            ? { value: val, message: '' }
            : { value: -1, message: AddressParseError.ADDRESS_OUT_OF_BOUND };
    }

    if (/^[a-f0-9]+\s*:\s*[a-f0-9]+$/i.test(str)) {
        const offset  = str.match(/(?<=:\s*)[a-f0-9]+/i)![0];
        const segment = str.match(/[a-f0-9]+(?=\s*:)/i)![0];
        const off = parseInt(offset,  16);
        const seg = parseInt(segment, 16);
        if (off >> 16 !== 0 || seg >> 16 !== 0) return { value: -1, message: AddressParseError.ADDRESS_OUT_OF_BOUND };
        const physical = seg * 16 + off;
        return physical >> 20 === 0
            ? { value: physical, message: '' }
            : { value: -1, message: AddressParseError.ADDRESS_OUT_OF_BOUND };
    }

    return { value: -1, message: AddressParseError.INVALID_ADDRESS_FORMAT };
}
