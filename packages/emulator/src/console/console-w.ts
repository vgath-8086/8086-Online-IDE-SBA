import { XL, XH, XX, COLOR_TABLE } from '../constants.js';
import type { Memory }      from '../cpu/memory.js';
import type { Registers }   from '../cpu/registers.js';
import type { KeyProvider } from './key-provider.js';
import type { CpuState }    from '../cpu/cpu-state.js';
import type { IConsole }    from '../interfaces/i-console.js';

export class ConsoleW implements IConsole {
    cursor: number;
    cursorRam: number;
    videoMemorySegment: number;
    readMode: boolean;
    key: string | undefined;
    keyReady: boolean;

    private readonly ram: Memory;
    private readonly register: Registers;
    private readonly keyProvider: KeyProvider;
    private readonly state: CpuState;

    constructor(ram: Memory, register: Registers, keyProvider: KeyProvider, state: CpuState) {
        this.cursor = 0;
        this.cursorRam = 0;
        this.videoMemorySegment = 0xb800;
        this.readMode = false;
        this.key = undefined;
        this.keyReady = false;
        this.ram = ram;
        this.register = register;
        this.keyProvider = keyProvider;
        this.state = state;
    }

    resetState(): void {
        this.cursor = 0;
        this.cursorRam = 0;
    }

    getDisplayChars(): Array<{ char: string; fg: number; bg: number }> {
        const result: Array<{ char: string; fg: number; bg: number }> = [];
        let j = 0;
        for (let i = 0; i < this.cursorRam && j < this.cursor; i += 2) {
            const byte1 = this.ram.readByte((this.videoMemorySegment << 4) + i);
            const byte2 = this.ram.readByte((this.videoMemorySegment << 4) + i + 1);
            result.push({ char: String.fromCharCode(byte1), fg: byte2 % 16, bg: (byte2 >> 4) & 0xff });
            j++;
        }
        return result;
    }

    writeChar(char: string | undefined, fg: number = 15, bg: number = 0): void {
        if (fg <= 16 && bg <= 16) {
            let asciiVal: number;
            if (char == null || char == '') asciiVal = 0;
            else asciiVal = char.charCodeAt(0);
            this.ram.writeByte((this.videoMemorySegment << 4) + this.cursorRam, asciiVal);
            this.ram.writeByte((this.videoMemorySegment << 4) + this.cursorRam + 1, ((bg << 4) & 0xffff) + fg);
            this.cursorRam += 2;
            this.cursor++;
        }
    }

    readChar(): void {
        this.key = undefined;
        this.keyReady = false;
        this.readMode = true;
        this.state.pause = true;
        this.keyProvider.waitForKey().then(k => {
            this.key = k;
            this.keyReady = true;
        });
    }

    async waitForEnter(): Promise<void> {
        await this.keyProvider.waitForEnter();
    }

    /** Delivers a buffered keystroke to console output and resumes execution when a key is ready. */
    processKeyReady(): void {
        if (this.keyReady) {
            this.writeChar(this.key);
            this.readMode = false;
            this.state.pause = false;
        }
    }

    /** Writes the buffered key's ASCII value to a register (byte, high byte, or full word). */
    writeKeyToRegister(XX_REG: number, REG_type: number): void {
        if (this.key != undefined) {
            if (REG_type === XX) {
                this.register.writeReg(XX_REG, this.key.charCodeAt(0));
            } else if (REG_type === XL) {
                this.register.writeReg(XX_REG, this.key.charCodeAt(0) & 0x00ff);
            } else if (REG_type == XH) {
                this.register.writeReg(XX_REG, this.key.charCodeAt(0) & 0xff00);
            }
        }
    }

    /** Writes the buffered key's parsed numeric value to a byte in RAM. */
    writeKeyToMemByte(addr: number): void {
        if (this.key != undefined) {
            this.ram.writeByte(addr, parseInt(this.key));
        }
    }

    /** Writes the buffered key's parsed numeric value to a word in RAM. */
    writeKeyToMemWord(addr: number): void {
        if (this.key != undefined) {
            this.ram.writeWord(addr, parseInt(this.key));
        }
    }
}

export { XL, XH, XX, COLOR_TABLE };
