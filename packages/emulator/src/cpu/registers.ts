import {
  BYTE_REGISTER, SEGMENT_REGISTER,
  AX_REG, DX_REG, SP_REG, FLAG_REG, IP_REG,
  SEGMENT_REGISTERS_TABLE, WORD_REGISTERS_TABLE,
} from '../constants.js';
import type { IRegisters } from '../interfaces/i-registers.js';

export class Registers implements IRegisters {
    R: number[];

    constructor() {
        this.R = new Array<number>(14);
        for (let i = 0; i < 14; i++)
            this.R[i] = 0;
    }

    /** Zeroes all 14 registers to their initial state. */
    reset(): void {
        for (let i = 0; i < 14; i++)
            this.R[i] = 0;
    }

    readReg(registerId: number): number {
        return this.R[registerId];
    }

    readSegReg(registerSegId: number): number {
        const registerId = SEGMENT_REGISTERS_TABLE[registerSegId];
        return this.R[registerId];
    }

    readByteReg(registerByteId: number): number {
        const registerId = WORD_REGISTERS_TABLE[registerByteId % 4];
        const HighByte = (registerByteId >> 2);
        if (HighByte)
            return (this.R[registerId] & 0xFF00) >> 8;
        else
            return (this.R[registerId] & 0x00FF);
    }

    readWordReg(registerWordId: number): number {
        const registerId = WORD_REGISTERS_TABLE[registerWordId];
        return this.R[registerId];
    }

    writeReg(registerId: number, value: number): void {
        this.R[registerId] = value & 0xFFFF;
    }

    writeSegReg(registerSegId: number, value: number): void {
        const registerId = SEGMENT_REGISTERS_TABLE[registerSegId];
        this.R[registerId] = value & 0xFFFF;
    }

    writeByteReg(registerByteId: number, value: number): void {
        const registerId = WORD_REGISTERS_TABLE[registerByteId % 4];
        const HighByte = (registerByteId >> 2);

        if (value >> 8 != 0) {
            console.log("Error: Trying to write a word value in a byte register.");
            value %= 256;
        }

        if (HighByte) {
            this.R[registerId] &= 0x00FF;
            this.R[registerId] |= (value << 8);
        } else {
            this.R[registerId] &= 0xFF00;
            this.R[registerId] |= value;
        }
    }

    writeWordReg(registerWordId: number, value: number): void {
        const registerId = WORD_REGISTERS_TABLE[registerWordId];
        this.R[registerId] = value & 0xFFFF;
    }

    incIP(base: number): void {
        this.R[IP_REG] += base;
        this.R[IP_REG] &= 0xFFFF;
    }

    incSP(): void {
        this.R[SP_REG] -= 2;
        this.R[SP_REG] &= 0xFFFF;
    }

    decSP(): void {
        this.R[SP_REG] += 2;
        this.R[SP_REG] &= 0xFFFF;
    }

    /** Copies value from src to dst register, dispatching by register type (byte/segment/word). */
    copyRegister(registerId_1: number, registerId_2: number, type1: number, type2: number): void {
        if (type1 != type2 && type1 == BYTE_REGISTER)
            console.log("Error: Word-Byte operation on register detected");
        else if (type1 == BYTE_REGISTER) {
            const val = this.readByteReg(registerId_2);
            this.writeByteReg(registerId_1, val);
        } else if (type1 == SEGMENT_REGISTER) {
            const val = this.readWordReg(registerId_2);
            this.writeSegReg(registerId_1, val);
        } else if (type2 == SEGMENT_REGISTER) {
            const val = this.readSegReg(registerId_2);
            this.writeWordReg(registerId_1, val);
        } else {
            const val = this.readWordReg(registerId_2);
            this.readWordReg(registerId_1);
            void val;
        }
    }

    /** Unsigned multiply: AX or AL × src register; result stored in AX or DX:AX. */
    executeMul(registerId: number, type: number): void {
        if (type == SEGMENT_REGISTER) {
            console.error("Error:multiplication by a segment register is not allowed");
        } else if (type == BYTE_REGISTER) {
            const val = this.readByteReg(registerId);
            let al = this.readByteReg(0);
            al *= val;
            if (al >> 8 == 0)
                this.writeByteReg(0, al);
            else
                this.writeReg(AX_REG, al);
        } else {
            const val = this.readWordReg(registerId);
            let ax = this.readReg(AX_REG);
            ax *= val;
            if (ax >> 16 == 0) {
                this.writeReg(AX_REG, ax);
            } else {
                const dx = (((ax & 0xffff0000) >> 16) & 0xffff);
                this.writeReg(AX_REG, ax & 0x0000ffff);
                this.writeReg(DX_REG, dx);
            }
        }
    }

    /** Unsigned divide: AX/DX:AX ÷ src register; quotient→AX, remainder→DX (or byte-packed in AX for 8-bit). */
    executeDiv(registerId: number, type: number): void {
        if (type == SEGMENT_REGISTER) {
            console.log("Error:division by a segment register is not allowed");
        } else if (type == BYTE_REGISTER) {
            const val = this.readByteReg(registerId);
            const ax = this.readWordReg(0);
            this.writeReg(AX_REG, (Math.floor(ax % val) << 8) + Math.floor(ax / val));
        } else {
            const val = this.readWordReg(registerId);
            const ax = this.readReg(AX_REG);
            this.writeReg(AX_REG, Math.floor(ax / val));
            this.writeReg(DX_REG, ax % val);
        }
    }

    extractFlag(flagName: string): number {
        let val = this.R[FLAG_REG] & 0b111111111;
        switch (flagName) {
            case 'O': val = val >> 8;       break;
            case 'D': val = (val >> 7) % 2; break;
            case 'I': val = (val >> 6) % 2; break;
            case 'T': val = (val >> 5) % 2; break;
            case 'S': val = (val >> 4) % 2; break;
            case 'Z': val = (val >> 3) % 2; break;
            case 'A': val = (val >> 2) % 2; break;
            case 'P': val = (val >> 1) % 2; break;
            case 'C': val = val % 2;        break;
        }
        return val & 0b111111111;
    }

    setFlag(flagName: string, bit: number): void {
        let val = this.R[FLAG_REG] & 0b111111111;
        switch (flagName) {
            case 'O': if (bit == 1) val |= 0b100000000; else val &= 0b011111111; break;
            case 'D': if (bit == 1) val |= 0b010000000; else val &= 0b101111111; break;
            case 'I': if (bit == 1) val |= 0b001000000; else val &= 0b110111111; break;
            case 'T': if (bit == 1) val |= 0b000100000; else val &= 0b111011111; break;
            case 'S': if (bit == 1) val |= 0b000010000; else val &= 0b111101111; break;
            case 'Z': if (bit == 1) val |= 0b000001000; else val &= 0b111110111; break;
            case 'A': if (bit == 1) val |= 0b000000100; else val &= 0b111111011; break;
            case 'P': if (bit == 1) val |= 0b000000010; else val &= 0b111111101; break;
            case 'C': if (bit == 1) val |= 0b000000001; else val &= 0b111111110; break;
        }
        this.writeReg(FLAG_REG, val & 0b111111111);
    }
}

export {
  AX_REG, BX_REG, CX_REG, DX_REG, CS_REG, DS_REG, ES_REG, SS_REG,
  SP_REG, BP_REG, DI_REG, SI_REG, FLAG_REG, IP_REG,
  SEGMENT_REGISTERS_TABLE, WORD_REGISTERS_TABLE,
  ALL_REGISTER, BYTE_REGISTER, WORD_NS_REGISTER, SEGMENT_REGISTER,
} from '../constants.js';
